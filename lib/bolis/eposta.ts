import type { SupabaseClient } from "@supabase/supabase-js";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";

const kacir = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const TR_TARIH_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const TR_SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function bolisEpostaGonderici(): string {
  return (
    process.env.BOLIS_EMAIL_FROM ||
    process.env.COGNITI_UYELIK_EMAIL_FROM ||
    process.env.VIVA_DAVET_EMAIL_FROM ||
    process.env.ECLUB_DAVET_EMAIL_FROM ||
    ""
  );
}

export function bolisSiteAdresiCoz(istekOrigin: string): string {
  try {
    return davetSiteAdresi(istekOrigin);
  } catch {
    return istekOrigin.replace(/\/$/, "");
  }
}

export function bolisSinavZamaniFormatla(
  baslangicIso: string | null,
  bitisIso: string | null,
): string {
  if (!baslangicIso || !bitisIso) return "Belirtilmedi";
  const bas = new Date(baslangicIso);
  const bit = new Date(bitisIso);
  if (Number.isNaN(bas.getTime()) || Number.isNaN(bit.getTime())) return "Belirtilmedi";

  const basTarih = TR_TARIH_BICIMI.format(bas);
  const bitTarih = TR_TARIH_BICIMI.format(bit);
  const basSaat = TR_SAAT_BICIMI.format(bas);
  const bitSaat = TR_SAAT_BICIMI.format(bit);

  if (basTarih === bitTarih) {
    return `${basTarih}, ${basSaat} – ${bitSaat} (Türkiye saati)`;
  }
  return `${basTarih} ${basSaat} – ${bitTarih} ${bitSaat} (Türkiye saati)`;
}

async function resendBolisEpostaGonder(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  etiket: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = bolisEpostaGonderici();
  const alici = String(params.to ?? "").trim().toLowerCase();
  if (!apiKey || !from || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alici)) {
    return false;
  }

  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [alici],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!yanit.ok) {
      console.error(`[bolis-eposta:${params.etiket}] Gönderilemedi:`, yanit.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[bolis-eposta:${params.etiket}] Hata:`, err);
    return false;
  }
}

export async function bolisHazirListeDavetEpostalariGonder(
  db: SupabaseClient,
  sinavId: string,
  siteAdresi: string,
): Promise<number> {
  if (!process.env.RESEND_API_KEY || !bolisEpostaGonderici()) return 0;

  const { data: sinav } = await db
    .from("bolis_sinavlari")
    .select(
      "sinav_id, firma_id, erisim_kodu, baslik, sure_dakika, baslangic_at, bitis_at, kayit_tipi, durum",
    )
    .eq("sinav_id", sinavId)
    .maybeSingle();

  if (!sinav || sinav.durum !== "yayinda" || sinav.kayit_tipi !== "hazir_liste") {
    return 0;
  }

  const [{ data: firma }, { count: soruSayisi }, { data: davetliler }, { data: tamamlananlar }] =
    await Promise.all([
      db.from("firmalar").select("firma_adi").eq("firma_id", sinav.firma_id).maybeSingle(),
      db
        .from("bolis_sorulari")
        .select("soru_id", { count: "exact", head: true })
        .eq("sinav_id", sinavId),
      db
        .from("bolis_davetlileri")
        .select("davetli_id, davet_kodu, ad, soyad, eposta")
        .eq("sinav_id", sinavId),
      db
        .from("bolis_oturumlari")
        .select("davetli_id")
        .eq("sinav_id", sinavId)
        .eq("durum", "tamamlandi"),
    ]);

  const tamamlananSeti = new Set(
    (tamamlananlar ?? []).map((o) => String(o.davetli_id ?? "")).filter(Boolean),
  );

  const firmaAdi = String(firma?.firma_adi ?? "").trim();
  const sinavBaslik = String(sinav.baslik ?? "Sınav").trim();
  const zamanMetni = bolisSinavZamaniFormatla(
    (sinav.baslangic_at as string | null) ?? null,
    (sinav.bitis_at as string | null) ?? null,
  );
  const sureDakika = Number(sinav.sure_dakika ?? 30);
  const toplamSoru = Number(soruSayisi ?? 0);
  const kokSite = siteAdresi.replace(/\/$/, "");
  const gorulduEpostalar = new Set<string>();

  const hedefler = (davetliler ?? []).filter((d) => {
    const davetliId = String(d.davetli_id ?? "");
    if (tamamlananSeti.has(davetliId)) return false;
    const eposta = String(d.eposta ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) return false;
    if (gorulduEpostalar.has(eposta)) return false;
    gorulduEpostalar.add(eposta);
    return true;
  });

  if (hedefler.length === 0) return 0;

  let basarili = 0;
  const parcalar = 10;
  for (let i = 0; i < hedefler.length; i += parcalar) {
    const dilim = hedefler.slice(i, i + parcalar);
    const sonuclar = await Promise.all(
      dilim.map((d) => {
        const adSoyad = `${String(d.ad ?? "").trim()} ${String(d.soyad ?? "").trim()}`.trim();
        const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Katılımcımız,";
        const davetKodu = String(d.davet_kodu ?? "").trim();
        const baglanti = `${kokSite}/bolis-sinav/${encodeURIComponent(String(sinav.erisim_kodu))}?davet=${encodeURIComponent(davetKodu)}`;
        const girisCumlesiHtml = firmaAdi
          ? `<strong>${kacir(firmaAdi)}</strong> tarafından düzenlenen <strong>${kacir(sinavBaslik)}</strong> sınavına davet edildiniz.`
          : `<strong>${kacir(sinavBaslik)}</strong> sınavına davet edildiniz.`;
        const girisCumlesiText = firmaAdi
          ? `${firmaAdi} tarafından düzenlenen ${sinavBaslik} sınavına davet edildiniz.`
          : `${sinavBaslik} sınavına davet edildiniz.`;

        return resendBolisEpostaGonder({
          to: String(d.eposta),
          subject: "Cogniti Sınav Davetiniz",
          html:
            `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
            `<p style="margin: 0 0 16px 0;">${girisCumlesiHtml}</p>` +
            `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
            `<li style="margin: 0 0 6px 0;"><strong>Sınav zamanı:</strong> ${kacir(zamanMetni)}</li>` +
            `<li style="margin: 0 0 6px 0;"><strong>Süre ve soru sayısı:</strong> ${kacir(sureDakika)} dakika · ${kacir(toplamSoru)} soru</li>` +
            `<li style="margin: 0;"><strong>Katılım bağlantısı:</strong> <a href="${kacir(baglanti)}" style="color: #0F766E; font-weight: 700; text-decoration: underline;">Sınava katıl</a> (${kacir(baglanti)})</li>` +
            `</ul>` +
            `<p style="margin: 0 0 16px 0;">Sınava belirtilen tarih ve saat aralığında tek giriş hakkıyla katılabilirsiniz.</p>` +
            `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
          text:
            `${hitap}\n\n` +
            `${girisCumlesiText}\n\n` +
            `- Sınav zamanı: ${zamanMetni}\n` +
            `- Süre ve soru sayısı: ${sureDakika} dakika · ${toplamSoru} soru\n` +
            `- Katılım bağlantısı: ${baglanti}\n\n` +
            `Sınava belirtilen tarih ve saat aralığında tek giriş hakkıyla katılabilirsiniz.\n\n` +
            `Cogniti · bilgi taşır`,
          idempotencyKey: `bolis-davet/${sinavId}/${davetKodu}`,
          etiket: "hazir-liste-davet",
        });
      }),
    );
    basarili += sonuclar.filter(Boolean).length;
  }

  return basarili;
}

export async function bolisSinavSonucEpostasiGonder(params: {
  oturumId: string;
  sinavBaslik: string;
  adSoyad: string;
  eposta: string;
  toplamPuan: number;
  maksimumPuan: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
}): Promise<boolean> {
  const adTemiz = params.adSoyad.trim();
  const hitap = adTemiz ? `Sayın ${adTemiz},` : "Sayın Katılımcımız,";
  const baslik = params.sinavBaslik.trim() || "Sınav";
  const toplamMetin = params.toplamPuan.toLocaleString("tr-TR");
  const maksMetin = params.maksimumPuan.toLocaleString("tr-TR");
  const basariYuzdesi =
    params.maksimumPuan > 0 ? Math.round((params.toplamPuan / params.maksimumPuan) * 100) : 0;

  return resendBolisEpostaGonder({
    to: params.eposta,
    subject: "Cogniti Sınav Sonucunuz",
    html:
      `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
      `<p style="margin: 0 0 16px 0;"><strong>${kacir(baslik)}</strong> sınavını tamamladınız. Sınav sonuç özetiniz aşağıda yer almaktadır.</p>` +
      `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
      `<li style="margin: 0 0 6px 0;"><strong>Toplam puanınız:</strong> ${kacir(toplamMetin)} / ${kacir(maksMetin)} (%${kacir(basariYuzdesi)} başarı)</li>` +
      `<li style="margin: 0;"><strong>Yanıt dağılımı:</strong> ${kacir(params.dogruSayisi)} doğru · ${kacir(params.yanlisSayisi)} yanlış · ${kacir(params.bosSayisi)} boş</li>` +
      `</ul>` +
      `<p style="margin: 0 0 16px 0;">Katılımınız için teşekkür ederiz.</p>` +
      `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
    text:
      `${hitap}\n\n` +
      `${baslik} sınavını tamamladınız. Sınav sonuç özetiniz aşağıda yer almaktadır.\n\n` +
      `- Toplam puanınız: ${toplamMetin} / ${maksMetin} (%${basariYuzdesi} başarı)\n` +
      `- Yanıt dağılımı: ${params.dogruSayisi} doğru · ${params.yanlisSayisi} yanlış · ${params.bosSayisi} boş\n\n` +
      `Katılımınız için teşekkür ederiz.\n\n` +
      `Cogniti · bilgi taşır`,
    idempotencyKey: `bolis-sonuc/${params.oturumId}`,
    etiket: "sinav-sonuc",
  });
}
