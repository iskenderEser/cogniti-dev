import type { SupabaseClient } from "@supabase/supabase-js";

const kacir = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const tlBicim = (tl: number) => new Intl.NumberFormat("tr-TR").format(tl);

export async function eclubCekIptalEpostasiGonder(db: SupabaseClient, talepId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ECLUB_CEK_EMAIL_FROM || process.env.COGNITI_UYELIK_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[eclub-cek-iptal-eposta] Resend ayarları eksik.");
    return;
  }

  try {
    const { data: talep } = await db
      .from("eclub_store_cek_talepleri")
      .select("talep_id, eczane_id, talep_eden_kisi_id, talep_edilen_cek_tl")
      .eq("talep_id", talepId)
      .maybeSingle();
    if (!talep?.eczane_id) return;

    const { data: baglar } = await db
      .from("eclub_kisi_eczane")
      .select("kisi_id, eclub_kisiler ( kisi_id, ad, soyad, eposta, rol )")
      .eq("eczane_id", talep.eczane_id)
      .eq("aktif_mi", true);

    type KisiBilgisi = { kisi_id?: string; ad?: string | null; soyad?: string | null; eposta?: string | null; rol?: string | null };
    const kisiler = ((baglar ?? []) as Array<{ eclub_kisiler?: KisiBilgisi | KisiBilgisi[] | null }>)
      .map((b) => (Array.isArray(b.eclub_kisiler) ? b.eclub_kisiler[0] : b.eclub_kisiler))
      .filter((k): k is KisiBilgisi => Boolean(k?.eposta?.trim()));

    const anaEczaci =
      kisiler.find((k) => (k.rol ?? "").trim().toLowerCase() === "eczaci") ??
      kisiler.find((k) => k.kisi_id === talep.talep_eden_kisi_id);
    if (!anaEczaci?.eposta) return;

    const eposta = anaEczaci.eposta.trim().toLowerCase();
    const adSoyad = [anaEczaci.ad, anaEczaci.soyad].filter(Boolean).join(" ").trim();
    const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Eczacımız,";
    const tutarMetni = `${tlBicim(Number(talep.talep_edilen_cek_tl ?? 0))} TL`;

    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `eclub-cek-iptal/${talep.talep_id}`,
      },
      body: JSON.stringify({
        from,
        to: [eposta],
        subject: "E-Club hediye çeki talebiniz iptal edildi",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;"><strong>${kacir(tutarMetni)}</strong> tutarındaki E-Club hediye çeki talebiniz iptal edilmiştir. Talebe bağlı puan kullanımınız hesabınıza geri açılmıştır.</p>` +
          `<p style="margin: 0 0 16px 0;">Detayları Cogniti içindeki Hediye Çeki Takibi ekranından inceleyebilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${tutarMetni} tutarındaki E-Club hediye çeki talebiniz iptal edilmiştir. Talebe bağlı puan kullanımınız hesabınıza geri açılmıştır.\n\n` +
          `Detayları Cogniti içindeki Hediye Çeki Takibi ekranından inceleyebilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });
    if (!yanit.ok) {
      console.error("[eclub-cek-iptal-eposta] Gönderilemedi:", yanit.status);
    }
  } catch (err) {
    console.error("[eclub-cek-iptal-eposta] Hazırlık hatası:", err);
  }
}
