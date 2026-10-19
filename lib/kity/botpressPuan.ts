import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TUKETICI_ROLLER } from '@/lib/utils/roller';
import { aktifPeriyot, ligPeriyoduAraligi, trGunu } from '@/lib/zaman/kontrol';

const SURE_SANIYE = 15 * 60;
const AMAC = 'kity-aylik-net-puan-denemesi';
type Yetki = { authId: string; kullaniciId: string; firmaId: string };
type Bagimliliklar = {
  anahtar: () => string | undefined;
  db: () => SupabaseClient;
  oturum: () => Promise<{ id: string } | null>;
  simdi?: () => Date;
};

class KityHatasi extends Error {
  readonly durum: number;
  readonly kod: string;
  constructor(durum: number, kod: string, mesaj: string) { super(mesaj); this.durum = durum; this.kod = kod; }
}
const yanit = (veri: unknown, status = 200) => Response.json(veri, {
  status, headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff' },
});
function anahtariOku(b: Bagimliliklar) {
  const anahtar = b.anahtar();
  if (!anahtar || Buffer.byteLength(anahtar) < 32) throw new KityHatasi(503, 'KAPALI', 'Kity veri bağlantısı henüz açılmadı.');
  return anahtar;
}
function imza(govde: string, anahtar: string) { return createHmac('sha256', anahtar).update(govde).digest(); }
function tokenUret(yetki: Yetki, anahtar: string, simdi: Date) {
  const iat = Math.floor(simdi.getTime() / 1000);
  const govde = Buffer.from(JSON.stringify({ ...yetki, aud: AMAC, iat, exp: iat + SURE_SANIYE })).toString('base64url');
  return `${govde}.${imza(govde, anahtar).toString('base64url')}`;
}
function tokenOku(istek: Request, anahtar: string, simdi: Date): Yetki {
  const yetkisiz = () => new KityHatasi(401, 'BAGLANTI_GECERSIZ', 'Deneme bağlantısı geçersiz veya süresi dolmuş. Cogniti hesabınızdan yeni bağlantı oluşturun.');
  const token = istek.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i)?.[1];
  if (!token || token.length > 2048) throw yetkisiz();
  const [govde, imzaMetni] = token.split('.');
  const verilen = Buffer.from(imzaMetni, 'base64url');
  const beklenen = imza(govde, anahtar);
  if (verilen.length !== beklenen.length || !timingSafeEqual(verilen, beklenen)) throw yetkisiz();
  let v: Record<string, unknown>;
  try { v = JSON.parse(Buffer.from(govde, 'base64url').toString('utf8')); } catch { throw yetkisiz(); }
  const an = Math.floor(simdi.getTime() / 1000);
  if (!v || typeof v !== 'object' || v.aud !== AMAC ||
    !Number.isInteger(v.iat) || !Number.isInteger(v.exp) || Number(v.iat) > an || Number(v.exp) <= an ||
    Number(v.exp) - Number(v.iat) !== SURE_SANIYE ||
    ![v.authId, v.kullaniciId, v.firmaId].every(x => typeof x === 'string' && x.length > 0 && x.length <= 100)) throw yetkisiz();
  return { authId: String(v.authId), kullaniciId: String(v.kullaniciId), firmaId: String(v.firmaId) };
}
async function yetkiyiOku(db: SupabaseClient, authId: string): Promise<Yetki> {
  const { data: kimlik, error } = await db.from('v_auth_kimlik_admin')
    .select('kimlik_id,kimlik_turu,rol,aktif_mi').eq('auth_id', authId).maybeSingle();
  if (error) throw new KityHatasi(503, 'KIMLIK_OKUNAMADI', 'Kullanıcı erişimi doğrulanamadı.');
  if (!kimlik?.aktif_mi || kimlik.kimlik_turu !== 'kullanici' || !TUKETICI_ROLLER.includes(kimlik.rol) || !kimlik.kimlik_id)
    throw new KityHatasi(403, 'KAPSAM_DISI', 'Bu ilk deneme yalnız aktif temsilcinin kendi aylık net puanını kapsar.');
  const { data: kisi, error: kisiHatasi } = await db.from('kullanicilar')
    .select('kullanici_id,firma_id,rol,aktif_mi').eq('kullanici_id', kimlik.kimlik_id).maybeSingle();
  if (kisiHatasi) throw new KityHatasi(503, 'KIMLIK_OKUNAMADI', 'Kullanıcı erişimi doğrulanamadı.');
  if (!kisi?.aktif_mi || !kisi.firma_id || kisi.rol !== kimlik.rol)
    throw new KityHatasi(403, 'KAPSAM_DISI', 'Aktif kullanıcı ve firma bağı doğrulanamadı.');
  const { data: firma, error: firmaHatasi } = await db.from('firmalar').select('aktif').eq('firma_id', kisi.firma_id).maybeSingle();
  if (firmaHatasi) throw new KityHatasi(503, 'KIMLIK_OKUNAMADI', 'Firma erişimi doğrulanamadı.');
  if (firma?.aktif !== true) throw new KityHatasi(403, 'KAPSAM_DISI', 'Firma aktif değil.');
  return { authId, kullaniciId: kisi.kullanici_id, firmaId: kisi.firma_id };
}
function hataYaniti(hata: unknown) {
  if (hata instanceof KityHatasi) return yanit({ success: false, kod: hata.kod, hata: hata.message }, hata.durum);
  // Kimlik bilgileri, token ve ham veri hatası dış servise veya loga yazılmaz.
  return yanit({ success: false, kod: 'VERI_OKUNAMADI', hata: 'Puan verisi şu anda okunamadı. Bu durum sıfır puan anlamına gelmez.' }, 503);
}

/** Yalnız özel Botpress önizlemesinde tek hesapla gerçek veri denemesi.
 * Token bir kullanıcıya bağlıdır; çok kullanıcılı webchat kimlik entegrasyonu değildir. */
export function kityPuanIsleyicileri(b: Bagimliliklar) {
  const simdiOku = b.simdi ?? (() => new Date());
  return {
    async baglanti(istek: Request) {
      try {
        const anahtar = anahtariOku(b);
        if (istek.headers.get('origin') !== new URL(istek.url).origin ||
          istek.headers.get('sec-fetch-site') === 'cross-site')
          throw new KityHatasi(403, 'KAYNAK', 'İşlemi Cogniti hesabınızın açık olduğu sayfadan başlatın.');
        const user = await b.oturum();
        if (!user) throw new KityHatasi(401, 'OTURUM', 'Cogniti hesabınıza giriş yapın.');
        const yetki = await yetkiyiOku(b.db(), user.id);
        const simdi = simdiOku();
        return yanit({ success: true, token: tokenUret(yetki, anahtar, simdi),
          son_kullanim: new Date(simdi.getTime() + SURE_SANIYE * 1000).toISOString(),
          tarih: trGunu(simdi), saat_dilimi: 'Europe/Istanbul', kapsam: 'Yalnız bağlantıyı oluşturan temsilcinin aylık net puanı' });
      } catch (hata) { return hataYaniti(hata); }
    },
    async puan(istek: Request) {
      try {
        const anahtar = anahtariOku(b);
        const simdi = simdiOku();
        const verilen = tokenOku(istek, anahtar, simdi);
        const url = new URL(istek.url);
        if ([...url.searchParams.keys()].some(k => k !== 'ay') || url.searchParams.getAll('ay').length > 1)
          throw new KityHatasi(400, 'GECERSIZ_SORGU', 'Yalnız ay parametresi kabul edilir; kullanıcı ve rol seçilemez.');
        const ay = url.searchParams.get('ay');
        if (!ay || !/^\d{4}-(0[1-9]|1[0-2])$/.test(ay))
          throw new KityHatasi(400, 'AY_GEREKLI', 'Ayı YYYY-AA biçiminde belirtin.');
        const [yil, ayNo] = ay.split('-').map(Number);
        const mevcut = aktifPeriyot(simdi);
        if (yil < 2000 || yil * 12 + ayNo > mevcut.yil * 12 + mevcut.ay)
          throw new KityHatasi(400, 'GECERSIZ_AY', 'Geçerli ve gelecekte olmayan bir ay seçin.');
        const db = b.db();
        const yetki = await yetkiyiOku(db, verilen.authId);
        if (yetki.kullaniciId !== verilen.kullaniciId || yetki.firmaId !== verilen.firmaId)
          throw new KityHatasi(403, 'KAPSAM_DEGISTI', 'Hesap kapsamı değişti. Yeni deneme bağlantısı oluşturun.');
        const donem = ligPeriyoduAraligi({ periyot: 'ay', yil, ay: ayNo, ceyrek: 1, hafta: 1 });
        const bitis = new Date(Math.min(Date.parse(donem.bitis), simdi.getTime())).toISOString();
        const { data, error } = await db.rpc('get_kullanici_ozet', {
          p_kullanici_id: yetki.kullaniciId, p_baslangic: donem.baslangic, p_bitis: bitis,
        });
        if (error) throw new KityHatasi(503, 'VERI_OKUNAMADI', 'Puan okunamadı; sıfır puan olarak yorumlamayın.');
        if (!Array.isArray(data) || data.length === 0)
          throw new KityHatasi(404, 'KAYIT_YOK', 'Seçilen ay için puan özeti bulunamadı.');
        const puan = data[0]?.toplam_net_puan;
        if (data.length !== 1 || puan === null || puan === undefined || (typeof puan === 'string' && !puan.trim()) ||
          !['number', 'string'].includes(typeof puan) || !Number.isFinite(Number(puan)))
          throw new KityHatasi(503, 'VERI_EKSIK', 'Puan özeti eksik; sıfır puan olarak yorumlamayın.');
        return yanit({ success: true, ay, net_puan: Number(puan), baslangic: donem.baslangic, bitis,
          tarih: trGunu(simdi), saat_dilimi: 'Europe/Istanbul', kaynak: 'Cogniti get_kullanici_ozet', ornek_veri: false });
      } catch (hata) { return hataYaniti(hata); }
    },
  };
}
