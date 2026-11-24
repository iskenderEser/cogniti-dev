import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";

const kacir = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function vivaGondericiAdresi(): string {
  return (
    process.env.VIVA_DAVET_EMAIL_FROM ||
    process.env.ECLUB_DAVET_EMAIL_FROM ||
    process.env.COGNITI_UYELIK_EMAIL_FROM ||
    ""
  );
}

function trTarihSaatFormatla(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

interface AliciBilgisi {
  anahtar: string;
  eposta: string;
  adSoyad: string;
}

async function etkinlikKatilimciAlicilariniOku(
  db: SupabaseClient,
  etkinlikId: string,
  hariciDavetlerDahil: boolean,
): Promise<AliciBilgisi[]> {
  const { data: katilimcilar } = await db
    .from("viva_katilimcilar")
    .select("tur, kullanici_id, kisi_id")
    .eq("etkinlik_id", etkinlikId);

  const icIds = [
    ...new Set(
      (katilimcilar ?? [])
        .filter((k) => k.tur === "ic" && typeof k.kullanici_id === "string")
        .map((k) => String(k.kullanici_id)),
    ),
  ];
  const eclubIds = [
    ...new Set(
      (katilimcilar ?? [])
        .filter((k) => k.tur === "eclub" && typeof k.kisi_id === "string")
        .map((k) => String(k.kisi_id)),
    ),
  ];

  const [icSonuc, eclubSonuc, hariciSonuc] = await Promise.all([
    icIds.length
      ? db
          .from("kullanicilar")
          .select("kullanici_id, ad, soyad, eposta")
          .in("kullanici_id", icIds)
          .eq("aktif_mi", true)
      : Promise.resolve({ data: [], error: null }),
    eclubIds.length
      ? db
          .from("eclub_kisiler")
          .select("kisi_id, ad, soyad, eposta")
          .in("kisi_id", eclubIds)
      : Promise.resolve({ data: [], error: null }),
    hariciDavetlerDahil
      ? db
          .from("viva_davetler")
          .select("davet_id, ad, eposta")
          .eq("etkinlik_id", etkinlikId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const alicilar = new Map<string, AliciBilgisi>();
  const epostaGecerli = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  for (const k of icSonuc.data ?? []) {
    const eposta = String(k.eposta ?? "").trim().toLowerCase();
    if (!epostaGecerli(eposta)) continue;
    const adSoyad = [k.ad, k.soyad].filter(Boolean).join(" ").trim();
    alicilar.set(eposta, {
      anahtar: `ic-${k.kullanici_id}`,
      eposta,
      adSoyad,
    });
  }

  for (const k of eclubSonuc.data ?? []) {
    const eposta = String(k.eposta ?? "").trim().toLowerCase();
    if (!epostaGecerli(eposta) || alicilar.has(eposta)) continue;
    const adSoyad = [k.ad, k.soyad].filter(Boolean).join(" ").trim();
    alicilar.set(eposta, {
      anahtar: `eclub-${k.kisi_id}`,
      eposta,
      adSoyad,
    });
  }

  if (hariciDavetlerDahil) {
    for (const d of hariciSonuc.data ?? []) {
      const eposta = String(d.eposta ?? "").trim().toLowerCase();
      if (!epostaGecerli(eposta) || alicilar.has(eposta)) continue;
      const adTemiz = String(d.ad ?? "").trim();
      alicilar.set(eposta, {
        anahtar: `davet-${d.davet_id}`,
        eposta,
        adSoyad: adTemiz === "Davetli" ? "" : adTemiz,
      });
    }
  }

  return [...alicilar.values()];
}

export async function vivaKatilimciDavetEpostalariGonder(
  db: SupabaseClient,
  etkinlikId: string,
  origin: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = vivaGondericiAdresi();
  if (!apiKey || !from) return;

  try {
    const { data: etkinlik } = await db
      .from("viva_etkinlikler")
      .select("etkinlik_id, baslik, baslangic, bitis, durum, surum")
      .eq("etkinlik_id", etkinlikId)
      .maybeSingle();

    if (
      !etkinlik ||
      !["planlandi", "canli"].includes(String(etkinlik.durum)) ||
      !etkinlik.baslangic ||
      !etkinlik.bitis
    ) {
      return;
    }

    const alicilar = await etkinlikKatilimciAlicilariniOku(db, etkinlikId, false);
    if (!alicilar.length) return;

    const site = davetSiteAdresi(origin);
    const link = `${site}/viva/${etkinlik.etkinlik_id}`;
    const baslik = String(etkinlik.baslik ?? "Viva Canlı Yayını").trim();
    const zamanMetni = trTarihSaatFormatla(String(etkinlik.baslangic));
    const sureDakika = Math.max(
      1,
      Math.round(
        (Date.parse(String(etkinlik.bitis)) - Date.parse(String(etkinlik.baslangic))) / 60_000,
      ),
    );
    const surum = Number(etkinlik.surum ?? 1);

    await Promise.allSettled(
      alicilar.map(async (alici) => {
        const hitap = alici.adSoyad ? `Sayın ${alici.adSoyad},` : "Sayın Katılımcımız,";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(8000),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `viva-katilimci-davet/${etkinlik.etkinlik_id}/${alici.anahtar}/v${surum}`,
          },
          body: JSON.stringify({
            from,
            to: [alici.eposta],
            subject: "Cogniti Viva Canlı Yayın Davetiniz",
            html:
              `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
              `<p style="margin: 0 0 16px 0;"><strong>${kacir(baslik)}</strong> Viva canlı yayınına davet edildiniz.</p>` +
              `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
              `<li style="margin: 0 0 6px 0;"><strong>Yayın zamanı:</strong> ${kacir(zamanMetni)} (Türkiye saati)</li>` +
              `<li style="margin: 0 0 6px 0;"><strong>Süre:</strong> ${kacir(sureDakika)} dakika</li>` +
              `<li style="margin: 0;"><strong>Katılım bağlantısı:</strong> <a href="${kacir(link)}" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">Canlı yayını görüntüle</a> (${kacir(link)})</li>` +
              `</ul>` +
              `<p style="margin: 0 0 16px 0;">Yayın saatinde Cogniti hesabınızla giriş yaparak etkinlik sayfasından canlı yayına katılabilirsiniz.</p>` +
              `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
            text:
              `${hitap}\n\n` +
              `${baslik} Viva canlı yayınına davet edildiniz.\n\n` +
              `- Yayın zamanı: ${zamanMetni} (Türkiye saati)\n` +
              `- Süre: ${sureDakika} dakika\n` +
              `- Katılım bağlantısı: ${link}\n\n` +
              `Yayın saatinde Cogniti hesabınızla giriş yaparak etkinlik sayfasından canlı yayına katılabilirsiniz.\n\n` +
              `Cogniti · bilgi taşır`,
          }),
        });
      }),
    );
  } catch (err) {
    console.error("[viva-katilimci-davet-eposta] Gönderim hatası:", err);
  }
}

export async function vivaEtkinlikIptalEpostalariGonder(
  db: SupabaseClient,
  etkinlikId: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = vivaGondericiAdresi();
  if (!apiKey || !from) return;

  try {
    const { data: etkinlik } = await db
      .from("viva_etkinlikler")
      .select("etkinlik_id, baslik, baslangic, durum")
      .eq("etkinlik_id", etkinlikId)
      .maybeSingle();

    if (!etkinlik || etkinlik.durum !== "iptal" || !etkinlik.baslangic) return;

    const alicilar = await etkinlikKatilimciAlicilariniOku(db, etkinlikId, true);
    if (!alicilar.length) return;

    const baslik = String(etkinlik.baslik ?? "Viva Canlı Yayını").trim();
    const zamanMetni = trTarihSaatFormatla(String(etkinlik.baslangic));

    await Promise.allSettled(
      alicilar.map(async (alici) => {
        const hitap = alici.adSoyad ? `Sayın ${alici.adSoyad},` : "Sayın Katılımcımız,";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(8000),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `viva-iptal/${etkinlik.etkinlik_id}/${alici.anahtar}`,
          },
          body: JSON.stringify({
            from,
            to: [alici.eposta],
            subject: "Cogniti Viva Canlı Yayını İptal Edildi",
            html:
              `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
              `<p style="margin: 0 0 16px 0;">${kacir(zamanMetni)} (Türkiye saati) tarihinde yapılması planlanan <strong>${kacir(baslik)}</strong> Viva canlı yayını iptal edilmiştir.</p>` +
              `<p style="margin: 0 0 16px 0;">Güncel yayın takvimini Cogniti Viva ekranından takip edebilirsiniz.</p>` +
              `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
            text:
              `${hitap}\n\n` +
              `${zamanMetni} (Türkiye saati) tarihinde yapılması planlanan ${baslik} Viva canlı yayını iptal edilmiştir.\n\n` +
              `Güncel yayın takvimini Cogniti Viva ekranından takip edebilirsiniz.\n\n` +
              `Cogniti · bilgi taşır`,
          }),
        });
      }),
    );
  } catch (err) {
    console.error("[viva-iptal-eposta] Gönderim hatası:", err);
  }
}
