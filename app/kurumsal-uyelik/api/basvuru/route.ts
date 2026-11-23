import { createAdminClient } from "@/lib/supabase/server";
import {
  adayOturumuDetay,
  ayniKaynaktan,
  KURUMSAL_BASVURU_TABLOSU,
} from "@/lib/firma/kurumsalBasvuru";
import {
  firmaBilgisiGonderimDogrula,
  firmaBilgisiTaslakTemizle,
  kurumsalBasvuruGonderildiEpostalariGonder,
  listeleriGonderimDogrula,
  listeSatirlariTemizle,
  type KurumsalBasvuruDurumu,
  type KurumsalFirmaBilgileriTaslak,
} from "@/lib/firma/kurumsalUyelikDogrulama";
import { sunucuHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";

const HEADERS = { "Cache-Control": "private, no-store" };
const hata = (mesaj: string, status: number) => Response.json({ hata: mesaj }, { status, headers: HEADERS });

type BasvuruSatiri = {
  on_basvuru_id: string;
  durum: KurumsalBasvuruDurumu;
  firma_bilgileri: KurumsalFirmaBilgileriTaslak | null;
  logo_yolu: string | null;
  logo_dosya_adi: string | null;
  sozlesme_yolu: string | null;
  sozlesme_dosya_adi: string | null;
  ticaret_sicil_yolu: string | null;
  ticaret_sicil_dosya_adi: string | null;
  vergi_levhasi_yolu: string | null;
  vergi_levhasi_dosya_adi: string | null;
  isim_listesi: string[][] | null;
  urun_listesi: string[][] | null;
  gonderildi_at: string | null;
  karar_at: string | null;
  karar_notu: string | null;
  guncellendi_at: string | null;
};

export async function GET() {
  try {
    const aday = await adayOturumuDetay();
    if (!aday) return yetkiHatasi();

    const db = createAdminClient();
    const { data, error } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select(
        "on_basvuru_id,durum,firma_bilgileri,logo_yolu,logo_dosya_adi,sozlesme_yolu,sozlesme_dosya_adi,ticaret_sicil_yolu,ticaret_sicil_dosya_adi,vergi_levhasi_yolu,vergi_levhasi_dosya_adi,isim_listesi,urun_listesi,gonderildi_at,karar_at,karar_notu,guncellendi_at"
      )
      .eq("on_basvuru_id", aday.id)
      .maybeSingle();

    if (error) throw error;

    const kayit = data as BasvuruSatiri | null;
    const kayitliBilgi = firmaBilgisiTaslakTemizle(kayit?.firma_bilgileri ?? {});
    const firmaBilgileri: KurumsalFirmaBilgileriTaslak = {
      firma_adi: kayitliBilgi.firma_adi || aday.firma_adi,
      il_id: kayitliBilgi.il_id ?? null,
      ilce_id: kayitliBilgi.ilce_id ?? null,
      adres: kayitliBilgi.adres ?? "",
      vergi_dairesi: kayitliBilgi.vergi_dairesi ?? "",
      vergi_dairesi_kodu: kayitliBilgi.vergi_dairesi_kodu ?? "",
      vergi_numarasi: kayitliBilgi.vergi_numarasi ?? "",
      sorumlu_ad_soyad: kayitliBilgi.sorumlu_ad_soyad || aday.ad_soyad,
      sorumlu_telefon: kayitliBilgi.sorumlu_telefon || aday.cep_tel,
      sorumlu_eposta: kayitliBilgi.sorumlu_eposta || aday.eposta,
    };

    const surum = encodeURIComponent(kayit?.guncellendi_at ?? "0");
    return Response.json(
      {
        durum: kayit?.durum ?? "taslak",
        firma_bilgileri: firmaBilgileri,
        belgeler: {
          logo: {
            yuklu: Boolean(kayit?.logo_yolu),
            dosya_adi: kayit?.logo_dosya_adi ?? null,
            url: kayit?.logo_yolu ? `/kurumsal-uyelik/api/basvuru/belge?tur=logo&v=${surum}` : null,
          },
          sozlesme: {
            yuklu: Boolean(kayit?.sozlesme_yolu),
            dosya_adi: kayit?.sozlesme_dosya_adi ?? null,
          },
          ticaret_sicil: {
            yuklu: Boolean(kayit?.ticaret_sicil_yolu),
            dosya_adi: kayit?.ticaret_sicil_dosya_adi ?? null,
          },
          vergi_levhasi: {
            yuklu: Boolean(kayit?.vergi_levhasi_yolu),
            dosya_adi: kayit?.vergi_levhasi_dosya_adi ?? null,
          },
        },
        isim_listesi: Array.isArray(kayit?.isim_listesi) ? kayit.isim_listesi : [],
        urun_listesi: Array.isArray(kayit?.urun_listesi) ? kayit.urun_listesi : [],
        gonderildi_at: kayit?.gonderildi_at ?? null,
        karar_at: kayit?.karar_at ?? null,
        karar_notu: kayit?.karar_notu ?? null,
      },
      { headers: HEADERS }
    );
  } catch (error) {
    return sunucuHatasi(error, "GET /kurumsal-uyelik/api/basvuru");
  }
}

export async function PUT(istek: Request) {
  try {
    if (!ayniKaynaktan(istek)) return hata("İstek doğrulanamadı.", 403);
    const aday = await adayOturumuDetay();
    if (!aday) return yetkiHatasi();

    const girdi = await istek.json().catch(() => null);
    if (!girdi || typeof girdi !== "object" || Array.isArray(girdi)) {
      return hata("Geçersiz veri gönderildi.", 400);
    }

    const db = createAdminClient();
    const { data: mevcut, error: okumaHatasi } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select("durum,firma_bilgileri,isim_listesi,urun_listesi")
      .eq("on_basvuru_id", aday.id)
      .maybeSingle();

    if (okumaHatasi) throw okumaHatasi;
    if (mevcut && (mevcut.durum === "incelemede" || mevcut.durum === "onaylandi")) {
      return hata("Başvurunuz incelemede veya onaylandığı için değiştirilemez.", 409);
    }

    let firmaBilgileri = mevcut?.firma_bilgileri ?? {};
    if ("firma_bilgileri" in girdi) {
      firmaBilgileri = firmaBilgisiTaslakTemizle(girdi.firma_bilgileri);
    }

    let isimListesi: string[][] = Array.isArray(mevcut?.isim_listesi) ? (mevcut.isim_listesi as string[][]) : [];
    if ("isim_listesi" in girdi) {
      const temiz = listeSatirlariTemizle(girdi.isim_listesi, 6);
      if (!temiz) return hata("Geçerli bir isim listesi girin.", 400);
      isimListesi = temiz;
    }

    let urunListesi: string[][] = Array.isArray(mevcut?.urun_listesi) ? (mevcut.urun_listesi as string[][]) : [];
    if ("urun_listesi" in girdi) {
      const temiz = listeSatirlariTemizle(girdi.urun_listesi, 4);
      if (!temiz) return hata("Geçerli bir ürün listesi girin.", 400);
      urunListesi = temiz;
    }

    const simdi = new Date().toISOString();
    const { error: yazmaHatasi } = await db.from(KURUMSAL_BASVURU_TABLOSU).upsert(
      {
        on_basvuru_id: aday.id,
        durum: mevcut?.durum ?? "taslak",
        firma_bilgileri: firmaBilgileri,
        isim_listesi: isimListesi,
        urun_listesi: urunListesi,
        guncellendi_at: simdi,
      },
      { onConflict: "on_basvuru_id" }
    );

    if (yazmaHatasi) throw yazmaHatasi;
    return Response.json({ ok: true, guncellendi_at: simdi }, { headers: HEADERS });
  } catch (error) {
    return sunucuHatasi(error, "PUT /kurumsal-uyelik/api/basvuru");
  }
}

export async function POST(istek: Request) {
  try {
    if (!ayniKaynaktan(istek)) return hata("İstek doğrulanamadı.", 403);
    const aday = await adayOturumuDetay();
    if (!aday) return yetkiHatasi();

    const girdi = await istek.json().catch(() => ({}));
    if (!girdi || typeof girdi !== "object" || Array.isArray(girdi)) {
      return hata("Geçersiz veri gönderildi.", 400);
    }

    const db = createAdminClient();
    const { data: mevcut, error: okumaHatasi } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select(
        "durum,firma_bilgileri,logo_yolu,sozlesme_yolu,ticaret_sicil_yolu,vergi_levhasi_yolu,isim_listesi,urun_listesi"
      )
      .eq("on_basvuru_id", aday.id)
      .maybeSingle();

    if (okumaHatasi) throw okumaHatasi;
    if (!mevcut) {
      return hata("Göndermeden önce firma bilgilerinizi, logonuzu, belgelerinizi ve listelerinizi tamamlayın.", 400);
    }
    if (mevcut.durum === "incelemede" || mevcut.durum === "onaylandi") {
      return hata("Başvurunuz zaten incelemeye gönderildi.", 409);
    }

    const firmaTaslak = "firma_bilgileri" in girdi
      ? firmaBilgisiTaslakTemizle(girdi.firma_bilgileri)
      : firmaBilgisiTaslakTemizle(mevcut.firma_bilgileri);
    const firmaSonuc = firmaBilgisiGonderimDogrula(firmaTaslak);
    if (!firmaSonuc.ok) return hata(firmaSonuc.hata, 400);

    if (!mevcut.logo_yolu) return hata("1. adımda firma logosunu yükleyin.", 400);
    if (!mevcut.sozlesme_yolu || !mevcut.ticaret_sicil_yolu || !mevcut.vergi_levhasi_yolu) {
      return hata("2. adımdaki tüm resmi belgeleri (Üyelik Sözleşmesi, Ticaret Sicili Gazetesi, Vergi Levhası) yükleyin.", 400);
    }

    const isimListesi = "isim_listesi" in girdi
      ? listeSatirlariTemizle(girdi.isim_listesi, 6)
      : listeSatirlariTemizle(mevcut.isim_listesi, 6);
    const urunListesi = "urun_listesi" in girdi
      ? listeSatirlariTemizle(girdi.urun_listesi, 4)
      : listeSatirlariTemizle(mevcut.urun_listesi, 4);

    if (!isimListesi || !urunListesi) {
      return hata("Kullanıcı ve ürün listeleri geçerli biçimde olmalıdır.", 400);
    }
    const listeSonuc = listeleriGonderimDogrula(isimListesi, urunListesi);
    if (!listeSonuc.ok) return hata(listeSonuc.hata, 400);

    const simdi = new Date().toISOString();
    const { data: guncel, error: guncellemeHatasi } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .update({
        durum: "incelemede",
        firma_bilgileri: firmaSonuc.veri,
        isim_listesi: isimListesi,
        urun_listesi: urunListesi,
        gonderildi_at: simdi,
        guncellendi_at: simdi,
        karar_notu: null,
      })
      .eq("on_basvuru_id", aday.id)
      .in("durum", ["taslak", "reddedildi"])
      .select("on_basvuru_id")
      .maybeSingle();

    if (guncellemeHatasi) throw guncellemeHatasi;
    if (!guncel) return hata("Başvurunuz zaten gönderilmiş.", 409);

    await kurumsalBasvuruGonderildiEpostalariGonder({
      firmaAdi: firmaSonuc.veri.firma_adi,
      adSoyad: aday.ad_soyad,
      eposta: aday.eposta,
      telefon: aday.cep_tel,
      kullaniciSayisi: isimListesi.length,
      urunSayisi: urunListesi.length,
    });

    return Response.json({ ok: true, durum: "incelemede", gonderildi_at: simdi }, { headers: HEADERS });
  } catch (error) {
    return sunucuHatasi(error, "POST /kurumsal-uyelik/api/basvuru");
  }
}
