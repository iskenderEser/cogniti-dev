import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";
import { vivaEpostaDavetToken, vivaHash } from "./sunucu";

interface DavetIsi {
  davet_id: string;
  kilit_id: string;
  token_hash: string;
  deneme_sayisi: number;
  icerik: { from: string; to: string; subject: string; baslik: string; baslangic: string; site: string };
}

type Sonuc = "gonderildi" | "hata" | "kontrol";
const enFazlaDeneme = 5;
const beklemeSaniyesi = (n: number) => Math.min(3600, 60 * 2 ** Math.max(0, n - 1));

/** Gönderilen gövde ilk denemede SQL'de dondurulan bilgilerden kurulur; token veritabanına yazılmaz. */
export function vivaDavetEpostaGovdesi(is: DavetIsi, token: string) {
  const { from, to, subject, baslik, baslangic, site } = is.icerik;
  if (!/^https?:\/\/[^/]+$/.test(site) || !baslik || !to || !from || !subject || !Number.isFinite(Date.parse(baslangic))) {
    throw new Error("VIVA_EPOSTA_ICERIK_GECERSIZ");
  }
  const zaman = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(baslangic));
  const link = `${site}/viva/davet/${token}`;
  return { from, to: [to], subject,
    text: `Merhaba,\n\n${baslik} Viva yayınına davet edildiniz.\n\nYayın zamanı: ${zaman} (Türkiye saati)\nKatılım bağlantısı: ${link}\n\nBağlantıyı açtığınızda e-posta doğrulamasıyla yayına katılabilirsiniz.\n\nCogniti · Viva` };
}

async function bitir(db: SupabaseClient, is: DavetIsi, sonuc: Sonuc, kod: string | null, saglayiciId: string | null, bekleme: number) {
  const { data, error } = await db.rpc("viva_eposta_is_bitir", {
    p_davet: is.davet_id, p_kilit: is.kilit_id, p_sonuc: sonuc,
    p_hata_kodu: kod, p_saglayici_id: saglayiciId, p_bekleme_saniye: bekleme,
  });
  if (error) throw error;
  return data === true;
}

/** Mevcut Viva cron'u bu işleyiciyi çağırır; sahipsiz veya başarılı iş tekrar gönderilmez. */
export async function vivaEpostaKuyrugunuIsle(db: SupabaseClient, origin: string, sonMs: number, enFazla = 5) {
  if (process.env.VIVA_EPOSTA_GONDERIM_AKTIF !== "true") return { islenen: 0, gonderilen: 0, hatali: 0, aktif: false };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VIVA_DAVET_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("VIVA_EPOSTA_AYAR_EKSIK");
  const site = davetSiteAdresi(origin);
  let islenen = 0, gonderilen = 0, hatali = 0;
  while (islenen < enFazla && Date.now() + 9000 < sonMs) {
    const kilit = randomUUID();
    const { data, error } = await db.rpc("viva_eposta_is_al", { p_kilit: kilit, p_gonderici: from, p_site: site });
    if (error) throw error;
    const is = data as DavetIsi | null;
    if (!is?.davet_id) break;
    islenen++;
    let sonuc: Sonuc = "kontrol", kod: string | null = "VIVA_EPOSTA_BELIRSIZ", saglayiciId: string | null = null;
    let bekleme = 0;
    try {
      const token = vivaEpostaDavetToken(is.davet_id);
      if (vivaHash(token) !== is.token_hash) throw new Error("VIVA_EPOSTA_TOKEN_ESLESMEDI");
      const govde = vivaDavetEpostaGovdesi(is, token);
      const yanit = await fetch("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `viva-davet/${is.davet_id}` },
        body: JSON.stringify(govde),
      });
      if (yanit.ok) {
        const veri: unknown = await yanit.json();
        if (!veri || typeof veri !== "object" || !("id" in veri) || typeof veri.id !== "string" || !veri.id || veri.id.length > 200) {
          throw new Error("VIVA_EPOSTA_YANIT_BELIRSIZ");
        }
        sonuc = "gonderildi"; kod = null; saglayiciId = veri.id;
      } else {
        const hata = yanit.status;
        kod = `RESEND_HTTP_${hata}`;
        let tekrarEdilebilir = hata === 429 || hata >= 500;
        if (hata === 409) {
          const ayrinti: unknown = await yanit.json().catch(() => null);
          const nesne = ayrinti && typeof ayrinti === "object" ? ayrinti as Record<string, unknown> : {};
          const hataNesnesi = nesne.error && typeof nesne.error === "object" ? nesne.error as Record<string, unknown> : {};
          tekrarEdilebilir = nesne.name === "concurrent_idempotent_requests" || hataNesnesi.name === "concurrent_idempotent_requests";
        }
        if (tekrarEdilebilir) {
          sonuc = is.deneme_sayisi < enFazlaDeneme ? "hata" : "kontrol";
          bekleme = sonuc === "hata" ? beklemeSaniyesi(is.deneme_sayisi) : 0;
        } else sonuc = hata === 409 ? "kontrol" : "hata"; // Kalıcı sağlayıcı reddi: otomatik tekrar yok.
      }
    } catch (e) {
      kod = e instanceof Error && /^VIVA_EPOSTA_[A-Z_]+$/.test(e.message) ? e.message : "VIVA_EPOSTA_AG_BELIRSIZ";
      if (kod === "VIVA_EPOSTA_TOKEN_ESLESMEDI" || kod === "VIVA_EPOSTA_ICERIK_GECERSIZ") sonuc = "kontrol";
      else {
        sonuc = is.deneme_sayisi < enFazlaDeneme ? "hata" : "kontrol";
        bekleme = sonuc === "hata" ? beklemeSaniyesi(is.deneme_sayisi) : 0;
      }
    }
    const kaydedildi = await bitir(db, is, sonuc, kod, saglayiciId, bekleme);
    if (kaydedildi && sonuc === "gonderildi") gonderilen++;
    else if (kaydedildi && sonuc !== "gonderildi") hatali++;
  }
  return { islenen, gonderilen, hatali, aktif: true };
}
