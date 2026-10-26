import type { DailyCall, DailyEventObjectAppMessage, DailyEventObjectParticipant } from "@daily-co/daily-js";
import type { VivaAnketDurumu, VivaAnketSorusu, VivaAnketTaslagi } from "./anket";
export type VivaArsivAnketi = { soru: VivaAnketSorusu; acik: boolean; sayilar: number[]; secim: number | null; surum: number; acildi: string; kapandi: string | null };
export type VivaAnketArsivi = { aktif: VivaArsivAnketi | null; sorular?: (VivaAnketTaslagi & { id: string })[]; oturumlar?: VivaArsivAnketi[] };
export async function vivaAnketArsivIstek(etkinlik: string, islem = "liste", veri: Record<string, unknown> = {}, signal?: AbortSignal): Promise<VivaAnketArsivi> {
  const okuma = ["liste", "aktif"].includes(islem);
  const url = `/viva/api/anket${okuma ? `?etkinlik_id=${encodeURIComponent(etkinlik)}&islem=${islem}` : ""}`;
  const r = await fetch(url, { cache: "no-store", credentials: "same-origin", signal,
    ...(okuma ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ etkinlik_id: etkinlik, islem, ...veri }) }),
  });
  const d = await r.json();
  if (!r.ok) throw Object.assign(new Error(d.hata ?? "Anket arşivine erişilemedi."), { status: r.status });
  return d;
}
type Call = Pick<DailyCall, "on" | "off" | "participants" | "sendAppMessage">;
export type VivaAnketDeposu = { istek: (islem: string, veri?: Record<string, unknown>, signal?: AbortSignal) => Promise<VivaAnketArsivi>; hata: (mesaj: string) => void };
export function vivaKaliciAnketBagla(call: Call, rol: "sunucu" | "katilimci" | "izleyici", bildir: (d: VivaAnketDurumu) => void, depo: VivaAnketDeposu) {
  const kontrol = new AbortController(); let kapali = false, surum = -1, aktif: VivaArsivAnketi | null = null;
  let timer: ReturnType<typeof setInterval> | undefined, okuma: Promise<void> | null = null;
  const kanal = "viva-poll-v1";
  function uygula(d: VivaAnketArsivi) {
    if (kapali || (d.aktif && d.aktif.surum < surum) || (!d.aktif && surum >= 0)) return;
    aktif = d.aktif; if (aktif) surum = aktif.surum;
    bildir({ soru: aktif?.soru ?? null, acik: aktif?.acik ?? false, sayilar: aktif?.sayilar ?? [], secim: aktif?.secim ?? null, gonderiliyor: false });
  }
  function duyur(hedef = "*") {
    if (!aktif || !call.participants().local.owner) return;
    // Misafir izleyiciler yalnız soru metnini alır; kalıcı cevaplar/kimlikler yayınlanmaz.
    call.sendAppMessage({ channel: kanal, type: "poll", ...aktif.soru, acik: aktif.acik, surum: aktif.surum, secim: null }, hedef);
  }
  async function oku() {
    if (kapali) return;
    if (okuma) return okuma;
    okuma = (async () => {
      try { uygula(await depo.istek("aktif", {}, kontrol.signal)); }
      catch (e) {
        if (!kapali) {
          depo.hata(e instanceof Error ? e.message : "Anket durumu alınamadı.");
          if ([401, 403].includes(Number((e as { status?: number }).status))) { clearInterval(timer); bildir({ soru: null, acik: false, sayilar: [], secim: null, gonderiliyor: false }); }
        }
      } finally { okuma = null; }
    })();
    return okuma;
  }
  function basladi() { void oku().then(() => { if (!kapali && rol === "sunucu") duyur(); }); if (!timer) timer = setInterval(() => void oku(), 10_000); }
  function al(e: DailyEventObjectAppMessage) {
    if (kapali || !e?.data || typeof e.data !== "object" || e.data.channel !== kanal) return;
    const p = call.participants()[e.fromId]; if (!p || p.local) return;
    if (rol === "sunucu" && e.data.type === "sync") { void oku().then(() => { if (!kapali) duyur(e.fromId); }); return; }
    if ((p.owner && e.data.type === "poll") || (rol === "sunucu" && e.data.type === "archive-updated")) void oku();
  }
  function katildi(e: DailyEventObjectParticipant) { if (!kapali && rol === "sunucu") void oku().then(() => { if (!kapali) duyur(e.participant.session_id); }); }
  async function yaz(islem: string, veri: Record<string, unknown>) {
    if (kapali) throw Error("Görüşme oturumu kapandı.");
    const sonuc = await depo.istek(islem, veri, kontrol.signal);
    if (kapali) return;
    uygula(sonuc);
    if (rol === "sunucu") duyur();
    else {
      const owner = Object.values(call.participants()).find(p => p.owner && !p.local);
      if (owner) call.sendAppMessage({ channel: kanal, type: "archive-updated" }, owner.session_id);
    }
  }
  call.on("app-message", al); call.on("joined-meeting", basladi); call.on("participant-joined", katildi);
  return {
    async ac(soru: VivaAnketTaslagi) {
      if (rol !== "sunucu" || !call.participants().local.owner || !soru.id) throw Error("Önce soruyu kaydedin ve yayıncı olarak katılın.");
      await yaz("ac", { soru_id: soru.id, oturum_id: crypto.randomUUID() });
    },
    async kapat() { if (rol === "sunucu" && aktif) await yaz("kapat", { oturum_id: aktif.soru.id }); },
    async cevapla(secim: number) {
      if (rol !== "katilimci" || !aktif?.acik || aktif.secim !== null || !Number.isInteger(secim) || secim < 0 || secim >= aktif.soru.options.length) return;
      await yaz("cevap", { oturum_id: aktif.soru.id, secim });
    },
    temizle() { kapali = true; kontrol.abort(); clearInterval(timer); call.off("app-message", al); call.off("joined-meeting", basladi); call.off("participant-joined", katildi); },
  };
}
