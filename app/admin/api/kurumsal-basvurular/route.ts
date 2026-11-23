import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import {
  ayniKaynaktan,
  KURUMSAL_BASVURU_TABLOSU,
  KURUMSAL_BELGE_BUCKET,
  ON_BASVURU_TABLOSU,
} from "@/lib/firma/kurumsalBasvuru";
import {
  firmaBilgisiGonderimDogrula,
  firmaBilgisiTaslakTemizle,
  kurumsalBasvuruOnayEpostasiGonder,
  kurumsalBasvuruRedEpostasiGonder,
  listeleriGonderimDogrula,
  listeSatirlariTemizle,
  type KurumsalBasvuruDurumu,
} from "@/lib/firma/kurumsalUyelikDogrulama";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";
import { firmaLogoYukle } from "@/lib/firma/logoStorage";
import { firmaAdiBicimle } from "@/lib/utils/firmaAdiBicimle";
import { adSoyadBicimle } from "@/lib/utils/adSoyadBicimle";
import { FIRMA_ADMIN_ROLU } from "@/lib/utils/roller";
import { tekillikIhlaliMi } from "@/lib/admin/hiyerarsiTekillik";
import { sunucuHatasi } from "@/lib/utils/hataIsle";

const HEADERS = { "Cache-Control": "private, no-store" };
const hata = (mesaj: string, status: number) => Response.json({ hata: mesaj }, { status, headers: HEADERS });
const UUID_DESENI = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function adSoyadAyir(tamAd: string): { ad: string; soyad: string } {
  const parcalar = tamAd.trim().split(/\s+/).filter(Boolean);
  if (parcalar.length === 0) return { ad: "Yetkili", soyad: "-" };
  if (parcalar.length === 1) return { ad: adSoyadBicimle(parcalar[0]), soyad: "-" };
  const soyad = adSoyadBicimle(parcalar[parcalar.length - 1]);
  const ad = adSoyadBicimle(parcalar.slice(0, -1).join(" "));
  return { ad: ad || "Yetkili", soyad: soyad || "-" };
}

export async function GET(istek: NextRequest) {
  try {
    const yetki = await adminGirisKontrol();
    if (!yetki.gecerli) return yetki.yanit;

    const durumParam = istek.nextUrl.searchParams.get("durum") ?? "incelemede";
    const gecerliDurumlar = new Set(["incelemede", "onaylandi", "reddedildi", "tumu"]);
    const durumFiltre = gecerliDurumlar.has(durumParam) ? durumParam : "incelemede";

    const db = createAdminClient();
    let sorgu = db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select(
        "on_basvuru_id,durum,firma_bilgileri,logo_yolu,logo_dosya_adi,sozlesme_yolu,sozlesme_dosya_adi,ticaret_sicil_yolu,ticaret_sicil_dosya_adi,vergi_levhasi_yolu,vergi_levhasi_dosya_adi,isim_listesi,urun_listesi,gonderildi_at,karar_at,karar_notu,olusturulan_firma_id,guncellendi_at"
      )
      .neq("durum", "taslak")
      .order("gonderildi_at", { ascending: false, nullsFirst: false });

    if (durumFiltre !== "tumu") {
      sorgu = sorgu.eq("durum", durumFiltre as KurumsalBasvuruDurumu);
    }

    const { data: basvurular, error } = await sorgu;
    if (error) throw error;

    const idler = (basvurular ?? []).map(b => b.on_basvuru_id);
    const onBasvuruHaritasi = new Map<string, {
      id: string;
      firma_adi: string;
      web_sitesi: string | null;
      ad_soyad: string;
      eposta: string;
      cep_tel: string;
    }>();

    if (idler.length > 0) {
      const { data: onBasvurular, error: onHata } = await db
        .from(ON_BASVURU_TABLOSU)
        .select("id,firma_adi,web_sitesi,ad_soyad,eposta,cep_tel")
        .in("id", idler);
      if (onHata) throw onHata;
      for (const kayit of onBasvurular ?? []) {
        onBasvuruHaritasi.set(kayit.id, kayit);
      }
    }

    const sonuc = (basvurular ?? []).map(b => {
      const on = onBasvuruHaritasi.get(b.on_basvuru_id);
      const surum = encodeURIComponent(b.guncellendi_at ?? "0");
      return {
        on_basvuru_id: b.on_basvuru_id,
        durum: b.durum,
        on_basvuru: on ?? null,
        firma_bilgileri: firmaBilgisiTaslakTemizle(b.firma_bilgileri),
        belgeler: {
          logo: {
            yuklu: Boolean(b.logo_yolu),
            dosya_adi: b.logo_dosya_adi ?? null,
            url: b.logo_yolu ? `/admin/api/kurumsal-basvurular/${b.on_basvuru_id}/belge?tur=logo&v=${surum}` : null,
          },
          sozlesme: {
            yuklu: Boolean(b.sozlesme_yolu),
            dosya_adi: b.sozlesme_dosya_adi ?? null,
            url: b.sozlesme_yolu ? `/admin/api/kurumsal-basvurular/${b.on_basvuru_id}/belge?tur=sozlesme` : null,
          },
          ticaret_sicil: {
            yuklu: Boolean(b.ticaret_sicil_yolu),
            dosya_adi: b.ticaret_sicil_dosya_adi ?? null,
            url: b.ticaret_sicil_yolu ? `/admin/api/kurumsal-basvurular/${b.on_basvuru_id}/belge?tur=ticaret_sicil` : null,
          },
          vergi_levhasi: {
            yuklu: Boolean(b.vergi_levhasi_yolu),
            dosya_adi: b.vergi_levhasi_dosya_adi ?? null,
            url: b.vergi_levhasi_yolu ? `/admin/api/kurumsal-basvurular/${b.on_basvuru_id}/belge?tur=vergi_levhasi` : null,
          },
        },
        isim_listesi: Array.isArray(b.isim_listesi) ? b.isim_listesi : [],
        urun_listesi: Array.isArray(b.urun_listesi) ? b.urun_listesi : [],
        gonderildi_at: b.gonderildi_at,
        karar_at: b.karar_at,
        karar_notu: b.karar_notu,
        olusturulan_firma_id: b.olusturulan_firma_id,
      };
    });

    return Response.json(sonuc, { headers: HEADERS });
  } catch (error) {
    return sunucuHatasi(error, "GET /admin/api/kurumsal-basvurular");
  }
}

export async function POST(istek: Request) {
  try {
    if (!ayniKaynaktan(istek)) return hata("İstek doğrulanamadı.", 403);
    const yetki = await adminGirisKontrol();
    if (!yetki.gecerli) return yetki.yanit;

    const girdi = await istek.json().catch(() => null);
    const onBasvuruId = typeof girdi?.on_basvuru_id === "string" ? girdi.on_basvuru_id.trim() : "";
    const karar = girdi?.karar;
    if (!UUID_DESENI.test(onBasvuruId) || (karar !== "onayla" && karar !== "reddet")) {
      return hata("Geçersiz karar isteği.", 400);
    }

    const db = createAdminClient();
    const { data: basvuru, error: basvuruHatasi } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select(
        "on_basvuru_id,durum,firma_bilgileri,logo_yolu,logo_dosya_adi,sozlesme_yolu,ticaret_sicil_yolu,vergi_levhasi_yolu,isim_listesi,urun_listesi"
      )
      .eq("on_basvuru_id", onBasvuruId)
      .maybeSingle();

    if (basvuruHatasi) throw basvuruHatasi;
    if (!basvuru) return hata("Kurumsal üyelik başvurusu bulunamadı.", 404);
    if (basvuru.durum !== "incelemede") {
      return hata("Bu başvuru şu anda inceleme aşamasında değil.", 409);
    }

    const { data: onBasvuru, error: onBasvuruHatasi } = await db
      .from(ON_BASVURU_TABLOSU)
      .select("id,aday_auth_id,firma_adi,ad_soyad,eposta,cep_tel")
      .eq("id", onBasvuruId)
      .maybeSingle();

    if (onBasvuruHatasi) throw onBasvuruHatasi;
    if (!onBasvuru || !onBasvuru.aday_auth_id) {
      return hata("Ön başvuru veya aday hesabı bulunamadı.", 404);
    }

    const simdi = new Date().toISOString();

    if (karar === "reddet") {
      const kararNotu = typeof girdi?.karar_notu === "string" ? girdi.karar_notu.trim() : "";
      if (kararNotu.length < 3 || kararNotu.length > 2000) {
        return hata("Reddetme / düzeltme açıklamasını girin (en az 3, en fazla 2000 karakter).", 400);
      }

      const { data: guncel, error: redHatasi } = await db
        .from(KURUMSAL_BASVURU_TABLOSU)
        .update({
          durum: "reddedildi",
          karar_notu: kararNotu,
          karar_at: simdi,
          karar_veren: yetki.kullaniciId,
          guncellendi_at: simdi,
        })
        .eq("on_basvuru_id", onBasvuruId)
        .eq("durum", "incelemede")
        .select("on_basvuru_id")
        .maybeSingle();

      if (redHatasi) throw redHatasi;
      if (!guncel) return hata("Başvuru durumu değişmiş, sayfayı yenileyin.", 409);

      const epostaSonuc = await kurumsalBasvuruRedEpostasiGonder({
        eposta: onBasvuru.eposta,
        adSoyad: onBasvuru.ad_soyad,
        aciklama: kararNotu,
      });

      return Response.json(
        {
          ok: true,
          durum: "reddedildi",
          eposta_gonderildi: epostaSonuc.ok,
          eposta_uyari: epostaSonuc.ok ? null : epostaSonuc.hata ?? "E-posta gönderilemedi.",
        },
        { headers: HEADERS }
      );
    }

    // karar === "onayla" (1-A: Firma + Logo + Listeler + Başvuran Yetkili firma_admin)
    const firmaSonuc = firmaBilgisiGonderimDogrula(firmaBilgisiTaslakTemizle(basvuru.firma_bilgileri));
    if (!firmaSonuc.ok) return hata(firmaSonuc.hata, 400);
    if (!basvuru.logo_yolu) return hata("Firma logosu eksik.", 400);
    if (!basvuru.sozlesme_yolu || !basvuru.ticaret_sicil_yolu || !basvuru.vergi_levhasi_yolu) {
      return hata("Resmi belgelerden en az biri eksik.", 400);
    }

    const isimListesi = listeSatirlariTemizle(basvuru.isim_listesi, 6);
    const urunListesi = listeSatirlariTemizle(basvuru.urun_listesi, 4);
    if (!isimListesi || !urunListesi) return hata("Kurumsal listeler geçersiz.", 400);
    const listeSonuc = listeleriGonderimDogrula(isimListesi, urunListesi);
    if (!listeSonuc.ok) return hata(listeSonuc.hata, 400);

    const bicimliFirmaAdi = firmaAdiBicimle(firmaSonuc.veri.firma_adi);
    const { data: mevcutFirma, error: mevcutFirmaHatasi } = await db
      .from("firmalar")
      .select("firma_id")
      .eq("firma_adi", bicimliFirmaAdi)
      .maybeSingle();

    if (mevcutFirmaHatasi) throw mevcutFirmaHatasi;
    if (mevcutFirma) {
      return hata(`"${bicimliFirmaAdi}" adında bir firma zaten kayıtlı.`, 422);
    }

    const { data: logoBlob, error: logoIndirmeHatasi } = await db.storage
      .from(KURUMSAL_BELGE_BUCKET)
      .download(basvuru.logo_yolu);
    if (logoIndirmeHatasi || !logoBlob) {
      return hata("Başvurudaki firma logosu okunamadı.", 502);
    }

    const logoYukleme = await firmaLogoYukle(
      db,
      logoBlob,
      logoBlob.type || "image/png",
      basvuru.logo_dosya_adi || "logo.png"
    );
    if (!logoYukleme.ok || !logoYukleme.url) {
      return hata(logoYukleme.error ?? "Firma logosu yayınlanamadı.", 502);
    }

    const { data: yeniFirma, error: firmaEklemeHatasi } = await db
      .from("firmalar")
      .insert({
        firma_adi: bicimliFirmaAdi,
        adres: firmaSonuc.veri.adres,
        vergi_dairesi: firmaSonuc.veri.vergi_dairesi,
        vergi_dairesi_kodu: firmaSonuc.veri.vergi_dairesi_kodu,
        vergi_numarasi: firmaSonuc.veri.vergi_numarasi,
        sorumlu_ad_soyad: firmaSonuc.veri.sorumlu_ad_soyad,
        sorumlu_telefon: firmaSonuc.veri.sorumlu_telefon,
        sorumlu_eposta: firmaSonuc.veri.sorumlu_eposta,
        il_id: firmaSonuc.veri.il_id,
        ilce_id: firmaSonuc.veri.ilce_id,
        logo_url: logoYukleme.url,
        ogrenme_platformu_aktif: true,
        aktif: true,
      })
      .select("firma_id,firma_adi")
      .single();

    if (tekillikIhlaliMi(firmaEklemeHatasi)) {
      return hata(`"${bicimliFirmaAdi}" adında bir firma zaten kayıtlı.`, 422);
    }
    if (firmaEklemeHatasi || !yeniFirma) {
      throw firmaEklemeHatasi ?? new Error("Firma oluşturulamadı.");
    }

    const firmaId = yeniFirma.firma_id as string;
    const geriAl = async () => {
      await db.from("kullanicilar").delete().eq("kullanici_id", onBasvuru.aday_auth_id).eq("firma_id", firmaId);
      await db.from("firmalar").delete().eq("firma_id", firmaId);
    };

    try {
      const { ad, soyad } = adSoyadAyir(onBasvuru.ad_soyad);
      const { error: kullaniciHatasi } = await db.from("kullanicilar").insert({
        kullanici_id: onBasvuru.aday_auth_id,
        ad,
        soyad,
        eposta: onBasvuru.eposta.toLowerCase(),
        telefon: onBasvuru.cep_tel,
        rol: FIRMA_ADMIN_ROLU,
        firma_id: firmaId,
        takim_id: null,
        bolge_id: null,
        aktif_mi: true,
        yetki_kullanici_yonetim: true,
        yetki_aktif_pasif: true,
      });

      if (kullaniciHatasi) {
        await geriAl();
        if (kullaniciHatasi.code === "23505") {
          return hata("Başvuruyu yapan yetkilinin hesabı veya telefon numarası sistemde zaten kayıtlı.", 409);
        }
        throw kullaniciHatasi;
      }

      const [isimSonuc, urunSonuc] = await Promise.all([
        db.rpc("cogniti_kurumsal_isim_listesi_yaz", {
          p_firma: firmaId,
          p_satirlar: isimListesi,
          p_gonder: true,
        }),
        db.rpc("cogniti_kurumsal_urun_listesi_yaz", {
          p_firma: firmaId,
          p_satirlar: urunListesi,
          p_gonder: true,
        }),
      ]);

      if (isimSonuc.error) throw isimSonuc.error;
      if (urunSonuc.error) throw urunSonuc.error;

      const { data: onaylanan, error: onayHatasi } = await db
        .from(KURUMSAL_BASVURU_TABLOSU)
        .update({
          durum: "onaylandi",
          karar_at: simdi,
          karar_veren: yetki.kullaniciId,
          karar_notu: null,
          olusturulan_firma_id: firmaId,
          guncellendi_at: simdi,
        })
        .eq("on_basvuru_id", onBasvuruId)
        .eq("durum", "incelemede")
        .select("on_basvuru_id")
        .maybeSingle();

      if (onayHatasi || !onaylanan) {
        await geriAl();
        if (onayHatasi) throw onayHatasi;
        return hata("Başvuru durumu değişmiş, sayfayı yenileyin.", 409);
      }
    } catch (err) {
      await geriAl();
      throw err;
    }

    let siteAdresi = "https://cogniti.net";
    try {
      siteAdresi = davetSiteAdresi(new URL(istek.url).origin);
    } catch {
      // Varsayılan üretim adresi kullanılır.
    }
    const girisLinki = new URL("/login", siteAdresi).href;
    const onayEpostaSonuc = await kurumsalBasvuruOnayEpostasiGonder({
      eposta: onBasvuru.eposta,
      adSoyad: onBasvuru.ad_soyad,
      firmaAdi: String(yeniFirma.firma_adi ?? firmaSonuc.veri.firma_adi),
      girisLinki,
    });

    return Response.json(
      {
        ok: true,
        durum: "onaylandi",
        firma_id: firmaId,
        firma_adi: yeniFirma.firma_adi,
        eposta_gonderildi: onayEpostaSonuc.ok,
        eposta_uyari: onayEpostaSonuc.ok ? null : onayEpostaSonuc.hata ?? "Onay e-postası gönderilemedi.",
      },
      { headers: HEADERS }
    );
  } catch (error) {
    return sunucuHatasi(error, "POST /admin/api/kurumsal-basvurular");
  }
}
