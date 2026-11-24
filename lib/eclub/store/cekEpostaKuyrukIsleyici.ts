import "server-only";
import { cekBaglantisiGecerli } from "./teslimat";
import { createAdminClient } from "@/lib/supabase/server";

interface CekEpostaIsi {
  outbox_id: string;
  talep_id: string;
  alici_eposta: string;
  alici_adi?: string | null;
  cek_kodu: string;
  kullanim_linki?: string | null;
  cek_tutari_tl: number;
}

const htmlKacir = (deger: unknown) => String(deger ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export async function eclubCekEpostaKuyrugunuTuket(maxIsSayisi = 10) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ECLUB_CEK_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("ECLUB_EMAIL_ENV_EKSIK");
  const supabase = createAdminClient();
  let tamamlanan = 0;
  let hatali = 0;

  for (let i = 0; i < maxIsSayisi; i += 1) {
    const { data, error } = await supabase.rpc("eclub_cek_eposta_isi_al", { p_lease_saniye: 120 });
    if (error) throw new Error(`ECLUB_EMAIL_CLAIM:${error.message}`);
    const is = (Array.isArray(data) ? data[0] : data) as CekEpostaIsi | null;
    if (!is?.outbox_id) break;

    try {
      const adTemiz = String(is.alici_adi ?? "").trim();
      const hitapHtml = adTemiz ? `Sayın ${htmlKacir(is.alici_adi || "")},` : "Sayın Eczacımız,";
      const hitapMetin = adTemiz ? `Sayın ${adTemiz},` : "Sayın Eczacımız,";
      const linkGecerli = Boolean(is.kullanim_linki && cekBaglantisiGecerli(is.kullanim_linki));
      const yanit = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `eclub-cek/${is.outbox_id}`,
        },
        body: JSON.stringify({
          from,
          to: [is.alici_eposta],
          subject: "E-Club Hediye Çekiniz Hazır",
          html:
            `<p style="margin: 0 0 16px 0;">${hitapHtml}</p>` +
            `<p style="margin: 0 0 16px 0;"><strong>${htmlKacir(is.cek_tutari_tl)} TL</strong> değerindeki hediye çekiniz hazırdır.</p>` +
            `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
            `<li style="margin: 0 0 ${linkGecerli ? 6 : 0}px 0;"><strong>Çek kodunuz:</strong> ${htmlKacir(is.cek_kodu)}</li>` +
            (linkGecerli
              ? `<li style="margin: 0;"><strong>Kullanım bağlantısı:</strong> <a href="${htmlKacir(is.kullanim_linki)}" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">Hediye çekini kullan</a></li>`
              : "") +
            `</ul>` +
            `<p style="margin: 0 0 16px 0;">Çek kodunu${linkGecerli ? " ve kullanım bağlantısını" : ""} Cogniti içindeki Hediye Çeki Takibi alanından da görebilirsiniz.</p>` +
            `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
          text:
            `${hitapMetin}\n\n` +
            `${is.cek_tutari_tl} TL değerindeki hediye çekiniz hazırdır.\n\n` +
            `- Çek kodunuz: ${is.cek_kodu}\n` +
            (linkGecerli ? `- Kullanım bağlantısı: ${is.kullanim_linki}\n` : "") +
            `\nÇek kodunu${linkGecerli ? " ve kullanım bağlantısını" : ""} Cogniti içindeki Hediye Çeki Takibi alanından da görebilirsiniz.\n\n` +
            `Cogniti · bilgi taşır`,
        }),
      });
      if (!yanit.ok) throw new Error(`RESEND_${yanit.status}`);
      const { data: tamamlandi, error: tamamlaHatasi } = await supabase.rpc("eclub_cek_teslimat_tamamla", {
        p_outbox_id: is.outbox_id,
        p_kanal: "eposta",
      });
      if (tamamlaHatasi) throw new Error(`ECLUB_EMAIL_COMPLETE:${tamamlaHatasi.message}`);
      if (!tamamlandi) throw new Error("ECLUB_EMAIL_COMPLETE:ISLEM_DURUMU_GECERSIZ");
      tamamlanan += 1;
    } catch (error) {
      const kod = error instanceof Error ? error.message.split(":")[0] : "EMAIL_ERROR";
      await supabase.rpc("eclub_cek_teslimat_hata", {
        p_outbox_id: is.outbox_id,
        p_kanal: "eposta",
        p_hata_kodu: kod,
      });
      hatali += 1;
    }
  }
  return { tamamlanan, hatali };
}
