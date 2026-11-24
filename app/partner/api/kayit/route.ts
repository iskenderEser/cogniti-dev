import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerBasvuruAlindiEpostalariGonder } from "@/lib/agora/partnerEposta";
import { partnerKayitIsleyicisi } from "@/lib/agora/partnerKayitApi";

const PARTNER_CV_BUCKET = "agora-partner-cvleri";

export const POST = partnerKayitIsleyicisi(async (veri, ozgecmis) => {
  const db = createAdminClient(AbortSignal.timeout(15000));
  const { data: partnerId, error } = await db.rpc("agora_partner_basvuru_kaydet", {
    p_basvuru_turu: veri.tur,
    p_ad_soyad: veri.ad_soyad,
    p_eposta: veri.eposta,
    p_cep_telefonu: veri.cep_telefonu,
    p_tc_no: veri.tc_no ?? null,
    p_uzmanliklar: veri.uzmanliklar ?? null,
    p_kendini_tanitma: veri.kendini_tanitma ?? null,
    p_banka_adi: veri.banka_adi,
    p_iban: veri.iban,
    p_hesap_adi: veri.hesap_adi,
    p_firma_adi: veri.firma_adi ?? null,
    p_web_adresi: veri.web_adresi ?? null,
    p_vergi_no: veri.vergi_no ?? null,
    p_vergi_dairesi: veri.vergi_dairesi ?? null,
    p_adres: veri.adres ?? null,
  });

  if (error) return false;
  if (!partnerId || typeof partnerId !== "string") {
    return true;
  }

  if (ozgecmis) {
    const guvenliAd = ozgecmis.adi.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "ozgecmis";
    const yol = `${partnerId}/${randomUUID()}-${guvenliAd}`;
    const { error: yuklemeHatasi } = await db.storage
      .from(PARTNER_CV_BUCKET)
      .upload(yol, ozgecmis.bytes, { contentType: ozgecmis.mime, upsert: false });
    if (yuklemeHatasi) {
      await db.rpc("agora_partner_basvuru_geri_al", { p_partner_id: partnerId });
      return false;
    }
    const { data: baglandi, error: baglamaHatasi } = await db.rpc("agora_partner_ozgecmis_bagla", {
      p_partner_id: partnerId,
      p_ozgecmis_yolu: yol,
      p_ozgecmis_adi: ozgecmis.adi,
    });
    if (baglamaHatasi || baglandi !== true) {
      await db.storage.from(PARTNER_CV_BUCKET).remove([yol]);
      await db.rpc("agora_partner_basvuru_geri_al", { p_partner_id: partnerId });
      return false;
    }
  }

  try {
    await partnerBasvuruAlindiEpostalariGonder(partnerId, veri);
  } catch {
    // Başvuru kaydı e-posta hatasından bağımsızdır.
  }

  return true;
});
