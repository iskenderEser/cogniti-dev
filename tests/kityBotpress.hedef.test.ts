import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { kityPuanIsleyicileri } from '../lib/kity/botpressPuan.ts';
import { ADMIN_ROLLER, URETICI_ROLLER, YONETICI_ROLLER, YONLENDIRICI_ROLLER, ECLUB_TUKETICI_ROLLERI, MUSTERI_ROLU, IU_ROLU } from '@/lib/utils/roller';

function ortam() {
  const durum = { anahtar: 'kity-yalniz-yerel-sahte-test-anahtari-123456', oturum: true, rol: 'utt',
    aktif: true, firmaAktif: true, firmaId: 'firma-1', simdi: new Date('2026-10-19T13:00:00Z'),
    veri: [{ toplam_net_puan: 1250 }] as Record<string, unknown>[], hata: false };
  const rpc: Array<{ ad: string; p: Record<string, unknown> }> = [];
  const db = {
    from(tablo: string) {
      const filtre: Record<string, unknown> = {};
      const q = { select() { return q; }, eq(k: string, v: unknown) { filtre[k] = v; return q; }, async maybeSingle() {
        if (tablo === 'v_auth_kimlik_admin') {
          assert.equal(filtre.auth_id, 'auth-1');
          return { data: { kimlik_id: 'kisi-1', kimlik_turu: 'kullanici', rol: durum.rol, aktif_mi: durum.aktif }, error: null };
        }
        if (tablo === 'kullanicilar') {
          assert.equal(filtre.kullanici_id, 'kisi-1');
          return { data: { kullanici_id: 'kisi-1', firma_id: durum.firmaId, rol: durum.rol, aktif_mi: durum.aktif }, error: null };
        }
        assert.equal(tablo, 'firmalar'); assert.equal(filtre.firma_id, durum.firmaId);
        return { data: { aktif: durum.firmaAktif }, error: null };
      } }; return q;
    },
    async rpc(ad: string, p: Record<string, unknown>) {
      rpc.push({ ad, p }); return { data: durum.veri, error: durum.hata ? { message: 'sahte hata' } : null };
    },
  } as unknown as SupabaseClient;
  const isleyici = kityPuanIsleyicileri({ anahtar: () => durum.anahtar, db: () => db,
    oturum: async () => durum.oturum ? { id: 'auth-1' } : null, simdi: () => durum.simdi });
  const ac = (origin: string | null = 'https://cogniti.test') => isleyici.baglanti(new Request('https://cogniti.test/api/kity/baglanti', {
    method: 'POST', headers: origin ? { origin } : {},
  }));
  const oku = (token: string, sorgu = 'ay=2026-09') => isleyici.puan(new Request(`https://cogniti.test/api/kity/puan?${sorgu}`, {
    headers: { authorization: `Bearer ${token}` },
  }));
  const tokenAl = async () => { const r = await ac(); assert.equal(r.status, 200); return (await r.json()).token as string; };
  return { durum, rpc, ac, oku, tokenAl };
}

test('HTTP handler zinciri: oturum → imzalı bağlantı → yalnız kişinin Eylül net puanı', async () => {
  const o = ortam(); const r = await o.oku(await o.tokenAl());
  assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'no-store');
  const veri = await r.json(); assert.equal(veri.net_puan, 1250); assert.equal(veri.ornek_veri, false);
  assert.deepEqual(o.rpc, [{ ad: 'get_kullanici_ozet', p: { p_kullanici_id: 'kisi-1',
    p_baslangic: '2026-08-31T21:00:00.000Z', p_bitis: '2026-09-30T20:59:59.999Z' } }]);
  assert.equal('kullaniciId' in veri, false); assert.equal('token' in veri, false);
});
test('KD_UTT aynı kişisel kapsamı kullanır; diğer bütün rol aileleri puan sorgusu açamaz', async () => {
  const o = ortam(); o.durum.rol = 'kd_utt'; assert.equal((await o.oku(await o.tokenAl())).status, 200);
  const roller = new Set([...ADMIN_ROLLER, ...URETICI_ROLLER, ...YONETICI_ROLLER, ...YONLENDIRICI_ROLLER, ...ECLUB_TUKETICI_ROLLERI, MUSTERI_ROLU, IU_ROLU]);
  for (const rol of roller) { const x = ortam(); x.durum.rol = rol; assert.equal((await x.ac()).status, 403, rol); assert.equal(x.rpc.length, 0); }
});
test('Oturumsuz, farklı origin ve Origin bulunmayan token istekleri kapalıdır', async () => {
  const o = ortam(); assert.equal((await o.ac('https://yabanci.test')).status, 403); assert.equal((await o.ac(null)).status, 403);
  o.durum.oturum = false; assert.equal((await o.ac()).status, 401); assert.equal(o.rpc.length, 0);
});
test('Token tahrifi, başka anahtar, sürenin tam sonu ve eksik token puan okuyamaz', async () => {
  const o = ortam(); const token = await o.tokenAl(); const [govde, imza] = token.split('.');
  const degisik = JSON.parse(Buffer.from(govde, 'base64url').toString()); degisik.kullaniciId = 'baska-kisi';
  assert.equal((await o.oku(`${Buffer.from(JSON.stringify(degisik)).toString('base64url')}.${imza}`)).status, 401);
  assert.equal((await o.oku('')).status, 401);
  const anahtar = o.durum.anahtar; o.durum.anahtar += '-farkli'; assert.equal((await o.oku(token)).status, 401); o.durum.anahtar = anahtar;
  o.durum.simdi = new Date(o.durum.simdi.getTime() + 15 * 60_000); assert.equal((await o.oku(token)).status, 401);
  assert.equal(o.rpc.length, 0);
});
test('Pasif kişi/firma, rol ve firma değişimi eski token ile veri açmaz', async () => {
  for (const alan of ['aktif', 'firmaAktif', 'rol', 'firmaId'] as const) {
    const o = ortam(); const token = await o.tokenAl();
    if (alan === 'rol') o.durum.rol = 'bm'; else if (alan === 'firmaId') o.durum.firmaId = 'firma-2'; else o.durum[alan] = false;
    assert.equal((await o.oku(token)).status, 403, alan); assert.equal(o.rpc.length, 0);
  }
});
test('Başka kullanıcı seçimi, fazla/tekrarlı parametre, bozuk ay ve gelecek ay reddedilir', async () => {
  const o = ortam(); const token = await o.tokenAl();
  for (const sorgu of ['ay=2026-09&kullanici_id=baska-kisi', 'ay=2026-09&rol=admin', 'ay=2026-09&ay=2026-08', '', 'ay=2026-13', 'ay=2026-9', 'ay=2026-11', 'ay=0001-01']) {
    assert.equal((await o.oku(token, sorgu)).status, 400, sorgu);
  }
  assert.equal(o.rpc.length, 0);
});
test('Sıfır puan korunur; eksik kayıt, eksik değer ve kaynak hatası sıfır yapılmaz', async () => {
  const o = ortam(); const token = await o.tokenAl();
  o.durum.veri = [{ toplam_net_puan: 0 }]; assert.equal((await (await o.oku(token)).json()).net_puan, 0);
  o.durum.veri = []; assert.equal((await o.oku(token)).status, 404);
  for (const toplam_net_puan of [null, undefined, '', ' ', 'bozuk', true, {}]) {
    o.durum.veri = [{ toplam_net_puan }]; assert.equal((await o.oku(token)).status, 503);
  }
  o.durum.hata = true; assert.equal((await o.oku(token)).status, 503);
});
test('İçinde bulunulan ay şu anla kesilir; Türkiye yeni yıl sınırı doğru kalır', async () => {
  const o = ortam(); const token = await o.tokenAl(); await o.oku(token, 'ay=2026-10');
  assert.equal(o.rpc.at(-1)?.p.p_bitis, '2026-10-19T13:00:00.000Z');
  o.durum.simdi = new Date('2026-12-31T21:00:00Z'); const yeniToken = await o.tokenAl();
  const r = await o.oku(yeniToken, 'ay=2027-01'); assert.equal(r.status, 200);
  assert.equal(o.rpc.at(-1)?.p.p_baslangic, '2026-12-31T21:00:00.000Z');
});
test('Yapılandırma yoksa bağlantı varsayılan olarak kapalıdır', async () => {
  const o = ortam(); o.durum.anahtar = ''; assert.equal((await o.ac()).status, 503); assert.equal((await o.oku('')).status, 503);
  assert.equal(o.rpc.length, 0);
});
