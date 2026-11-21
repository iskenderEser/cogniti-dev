import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerCanliEgitimDogrula } from "@/lib/agora/partnerCanliYayin";
import { partnerKomisyonOraniGecerli, partnerKomisyonOraniOku } from "@/lib/agora/komisyon";

const UUID_RE = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

export async function GET() {
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);

    const { data, error } = await b.db.rpc("agora_partner_canli_verileri_oku", {
      p_partner_id: b.partnerId,
    });
    if (error || !data || typeof data !== "object") {
      return partnerYanit({ hata: "Canlı yayın verileri okunamadı." }, 503);
    }

    const sonuc = data as { komisyon_orani?: unknown; egitimler?: unknown[]; oturumlar?: unknown[] };
    const komisyonOrani = partnerKomisyonOraniGecerli(sonuc.komisyon_orani)
      ? Math.round(sonuc.komisyon_orani * 100) / 100
      : await partnerKomisyonOraniOku(b.db);
    return partnerYanit({
      komisyon_orani: komisyonOrani,
      egitimler: sonuc.egitimler ?? [],
      oturumlar: sonuc.oturumlar ?? [],
    });
  } catch {
    return partnerYanit({ hata: "Canlı yayın verileri okunamadı." }, 503);
  }
}

export async function POST(request: Request) {
  const body = await partnerJsonOku(request, 128 * 1024);
  if (!body.ok) return body.yanit;

  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);

    const d = body.veri;
    const islem = d.islem;

    if (islem === "egitim_olustur") {
      const komisyonOrani = await partnerKomisyonOraniOku(b.db);
      const sonuc = partnerCanliEgitimDogrula(d, komisyonOrani);
      if (!sonuc.ok) return partnerYanit({ hata: sonuc.hata }, 400);

      const v = sonuc.veri;
      const { data, error } = await b.db.rpc("agora_partner_canli_egitim_olustur", {
        p_partner_id: b.partnerId,
        p_egitim_adi: v.egitim_adi,
        p_kategori_kodu: v.kategori_kodu,
        p_kategori: v.kategori,
        p_hedef_roller: v.hedef_roller,
        p_aciklama: v.aciklama,
        p_sure_dakika: v.sure_dakika,
        p_kapasite: v.kapasite,
        p_fiyat_tl: v.fiyat_tl,
      });

      if (error) {
        return partnerYanit({ hata: error.message || "Canlı eğitim oluşturulamadı." }, 400);
      }
      return partnerYanit({ mesaj: "Canlı yayın eğitimi oluşturuldu.", egitim: data });
    }

    if (islem === "egitim_guncelle") {
      if (typeof d.canli_egitim_id !== "string" || !UUID_RE.test(d.canli_egitim_id)) {
        return partnerYanit({ hata: "Geçerli bir canlı eğitim seçin." }, 400);
      }
      const komisyonOrani = await partnerKomisyonOraniOku(b.db);
      const sonuc = partnerCanliEgitimDogrula(d, komisyonOrani);
      if (!sonuc.ok) return partnerYanit({ hata: sonuc.hata }, 400);

      const v = sonuc.veri;
      const { data, error } = await b.db.rpc("agora_partner_canli_egitim_guncelle", {
        p_partner_id: b.partnerId,
        p_canli_egitim_id: d.canli_egitim_id,
        p_egitim_adi: v.egitim_adi,
        p_kategori_kodu: v.kategori_kodu,
        p_kategori: v.kategori,
        p_hedef_roller: v.hedef_roller,
        p_aciklama: v.aciklama,
        p_sure_dakika: v.sure_dakika,
        p_kapasite: v.kapasite,
        p_fiyat_tl: v.fiyat_tl,
      });

      if (error) {
        const status = error.code === "40001" ? 409 : 400;
        return partnerYanit({ hata: error.message || "Canlı eğitim güncellenemedi." }, status);
      }
      return partnerYanit({ mesaj: "Canlı yayın eğitimi güncellendi.", egitim: data });
    }

    if (islem === "egitim_durum_degistir") {
      if (typeof d.canli_egitim_id !== "string" || !UUID_RE.test(d.canli_egitim_id)) {
        return partnerYanit({ hata: "Geçerli bir canlı eğitim seçin." }, 400);
      }
      if (typeof d.aktif_mi !== "boolean") {
        return partnerYanit({ hata: "Geçersiz durum bilgisi." }, 400);
      }

      const { data, error } = await b.db.rpc("agora_partner_canli_egitim_durum_degistir", {
        p_partner_id: b.partnerId,
        p_canli_egitim_id: d.canli_egitim_id,
        p_aktif_mi: d.aktif_mi,
      });

      if (error) {
        const status = error.code === "40001" ? 409 : 400;
        return partnerYanit({ hata: error.message || "Eğitim durumu güncellenemedi." }, status);
      }
      return partnerYanit({
        mesaj: d.aktif_mi ? "Canlı eğitim yeniden aktife alındı." : "Canlı eğitim pasife alındı.",
        egitim: data,
      });
    }

    if (islem === "egitim_sil") {
      if (typeof d.canli_egitim_id !== "string" || !UUID_RE.test(d.canli_egitim_id)) {
        return partnerYanit({ hata: "Geçerli bir canlı eğitim seçin." }, 400);
      }

      const { data, error } = await b.db.rpc("agora_partner_canli_egitim_sil", {
        p_partner_id: b.partnerId,
        p_canli_egitim_id: d.canli_egitim_id,
      });

      if (error) {
        const status = error.code === "40001" ? 409 : 400;
        return partnerYanit({ hata: error.message || "Canlı eğitim silinemedi." }, status);
      }
      if (!data) {
        return partnerYanit({ hata: "Canlı eğitim bulunamadı." }, 404);
      }
      return partnerYanit({ mesaj: "Canlı eğitim silindi." });
    }

    if (islem === "oturum_ekle") {
      if (typeof d.canli_egitim_id !== "string" || !UUID_RE.test(d.canli_egitim_id)) {
        return partnerYanit({ hata: "Geçerli bir canlı eğitim seçin." }, 400);
      }
      if (typeof d.baslangic_at !== "string" || !Number.isFinite(Date.parse(d.baslangic_at))) {
        return partnerYanit({ hata: "Geçerli bir tarih ve saat seçin." }, 400);
      }

      const { data, error } = await b.db.rpc("agora_partner_canli_oturum_ekle", {
        p_partner_id: b.partnerId,
        p_canli_egitim_id: d.canli_egitim_id,
        p_baslangic_at: d.baslangic_at,
      });

      if (error) {
        const status = error.code === "40001" ? 409 : 400;
        return partnerYanit({ hata: error.message || "Takvim oturumu eklenemedi." }, status);
      }
      return partnerYanit({ mesaj: "Canlı yayın oturumu takvime eklendi.", oturum: data });
    }

    if (islem === "oturum_aktif") {
      if (typeof d.oturum_id !== "string" || !UUID_RE.test(d.oturum_id)) {
        return partnerYanit({ hata: "Geçersiz oturum." }, 400);
      }

      const { data, error } = await b.db.rpc("agora_partner_canli_oturum_aktif", {
        p_partner_id: b.partnerId,
        p_oturum_id: d.oturum_id,
      });

      if (error) {
        return partnerYanit({ hata: error.message || "Oturum aktife alınamadı." }, 400);
      }
      if (!data) {
        return partnerYanit({ hata: "Pasif oturum bulunamadı veya aktife alınamadı." }, 409);
      }
      return partnerYanit({ mesaj: "Oturum aktife alındı." });
    }

    if (islem === "oturum_pasif" || islem === "oturum_iptal") {
      if (typeof d.oturum_id !== "string" || !UUID_RE.test(d.oturum_id)) {
        return partnerYanit({ hata: "Geçersiz oturum." }, 400);
      }

      const { data, error } = await b.db.rpc("agora_partner_canli_oturum_iptal", {
        p_partner_id: b.partnerId,
        p_oturum_id: d.oturum_id,
      });

      if (error) return partnerYanit({ hata: "Oturum pasife alınamadı." }, 503);
      if (!data) return partnerYanit({ hata: "Yalnızca henüz sipariş verilmemiş müsait oturumlar pasife alınabilir." }, 409);
      return partnerYanit({ mesaj: "Oturum pasife alındı." });
    }

    return partnerYanit({ hata: "Geçersiz işlem." }, 400);
  } catch {
    return partnerYanit({ hata: "İşlem tamamlanamadı." }, 503);
  }
}
