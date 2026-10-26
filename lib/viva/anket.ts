import { vivaKaliciAnketBagla, type VivaAnketDeposu } from "./anketArsiv";
import type { DailyCall, DailyEventObjectAppMessage, DailyEventObjectParticipant } from "@daily-co/daily-js";

// Daily virtual-class-demo / PollProvider akışı, mevcut Prebuilt çerçevesine uyarlanmıştır.
// https://github.com/daily-demos/virtual-class-demo/blob/main/contexts/PollProvider.js
export type VivaAnketTaslagi = { id?: string; question: string; options: string[] };
export type VivaAnketSorusu = VivaAnketTaslagi & { id: string };
export type VivaAnketDurumu = { soru: VivaAnketSorusu | null; acik: boolean; sayilar: number[]; secim: number | null; gonderiliyor: boolean };
export const BOS_ANKET: VivaAnketDurumu = { soru: null, acik: false, sayilar: [], secim: null, gonderiliyor: false };
const kanal = "viva-poll-v1";
export function vivaAnketTaslagi(veri: unknown): VivaAnketTaslagi {
  const d = veri as VivaAnketTaslagi | null;
  if (!d || typeof d.question !== "string" || !Array.isArray(d.options) || d.options.length < 2 || d.options.length > 8
    || d.options.some(s => typeof s !== "string" || !s.trim() || s.trim().length > 150)
    || !d.question.trim() || d.question.trim().length > 300) throw Error("Bir soru ve 2–8 dolu seçenek girin. Soru en fazla 300, seçenekler 150 karakter olabilir.");
  const sonuc = { question: d.question.trim(), options: d.options.map(s => s.trim()) };
  if (new Set(sonuc.options).size !== sonuc.options.length) throw Error("Seçenekler birbirinden farklı olmalıdır.");
  if (new TextEncoder().encode(JSON.stringify(sonuc)).length > 3000) throw Error("Soru ve seçeneklerin toplam metni çok uzun.");
  return { ...sonuc, ...(typeof d.id === "string" ? { id: d.id } : {}) };
}
export function vivaAnketDosyasi(metin: string): VivaAnketTaslagi[] {
  if (new TextEncoder().encode(metin).length > 200_000) throw Error("Soru dosyası en fazla 200 KB olabilir.");
  let veri: unknown; try { veri = JSON.parse(metin); } catch { throw Error("Soru dosyası geçerli JSON olmalıdır."); }
  const liste = Array.isArray(veri) ? veri : [veri];
  if (!liste.length || liste.length > 50) throw Error("Bir dosyada 1–50 soru bulunabilir.");
  return liste.map(vivaAnketTaslagi);
}
type Call = Pick<DailyCall, "on" | "off" | "participants" | "sendAppMessage">;
export function vivaAnketBagla(call: Call, rol: "sunucu" | "katilimci" | "izleyici", bildir: (d: VivaAnketDurumu) => void, depo?: VivaAnketDeposu) {
  if (depo) return vivaKaliciAnketBagla(call, rol, bildir, depo);
  let durum: VivaAnketDurumu = { ...BOS_ANKET }, surum = 0, sahip = "", kapali = false;
  let oylar = new Map<string, number>();
  let bekleyen: ReturnType<typeof setTimeout> | undefined;
  const guncelle = (d: Partial<VivaAnketDurumu>) => { if (!kapali) { durum = { ...durum, ...d }; bildir({ ...durum, sayilar: [...durum.sayilar] }); } };
  const yerel = () => call.participants().local;
  const kimlik = (p: { user_id?: string; session_id: string }) => p.user_id || p.session_id;
  const gonder = (veri: Record<string, unknown>, hedef = "*") => call.sendAppMessage({ channel: kanal, ...veri }, hedef);
  function ozet(hedef: string) {
    const p = call.participants()[hedef]; if (!p || !durum.soru) return;
    gonder({ type: "poll", ...durum.soru, acik: durum.acik, surum, secim: oylar.get(kimlik(p)) ?? null }, hedef);
  }
  function al(e: DailyEventObjectAppMessage) {
    if (kapali || !e?.data || typeof e.data !== "object") return;
    const d = e.data as Record<string, unknown>;
    if (d.channel !== kanal) return;
    const p = call.participants()[e.fromId]; if (!p || p.local) return;
    if (rol === "sunucu" && yerel().owner) {
      if (d.type === "sync") { ozet(e.fromId); return; }
      if (d.type !== "selected-answer-poll" || !durum.acik || !durum.soru || d.id !== durum.soru.id || p.owner || p.permissions?.canSend === false
        || !Number.isInteger(d.answer) || Number(d.answer) < 0 || Number(d.answer) >= durum.soru.options.length) return;
      const key = kimlik(p);
      if (!oylar.has(key)) {
        oylar.set(key, Number(d.answer));
        const sayilar = [...durum.sayilar]; sayilar[Number(d.answer)] += 1;
        guncelle({ sayilar });
      }
      gonder({ type: "answer-received", id: durum.soru.id, answer: oylar.get(key) }, e.fromId);
      return;
    }
    // Gönderen adı veya mesaj içindeki rol güven kaynağı değildir; Daily owner doğrulanır.
    if (!p.owner || !Number.isSafeInteger(d.surum) && d.type === "poll") return;
    if (d.type === "poll") {
      if (sahip === e.fromId && Number(d.surum) < surum) return;
      try {
        const soru = vivaAnketTaslagi(d);
        if (typeof d.id !== "string" || !/^[a-f0-9-]{36}$/i.test(d.id) || typeof d.acik !== "boolean") return;
        clearTimeout(bekleyen); sahip = e.fromId; surum = Number(d.surum);
        const secim = Number.isInteger(d.secim) && Number(d.secim) >= 0 && Number(d.secim) < soru.options.length ? Number(d.secim) : null;
        guncelle({ soru: { ...soru, id: d.id }, acik: d.acik, secim, gonderiliyor: false, sayilar: [] });
      } catch { /* Diğer uygulama mesajları ve bozuk sorular görüşmeyi etkilemez. */ }
    } else if (d.type === "answer-received" && durum.soru && e.fromId === sahip && d.id === durum.soru.id && Number.isInteger(d.answer)
      && Number(d.answer) >= 0 && Number(d.answer) < durum.soru.options.length) {
      clearTimeout(bekleyen); guncelle({ secim: Number(d.answer), gonderiliyor: false });
    }
  }
  function esitle() {
    if (kapali) return;
    if (rol !== "sunucu") {
      const owner = Object.values(call.participants()).find(p => p.owner && !p.local);
      if (owner) gonder({ type: "sync" }, owner.session_id);
    }
  }
  function katildi(e: DailyEventObjectParticipant) {
    if (kapali) return;
    if (rol === "sunucu" && yerel().owner) ozet(e.participant.session_id);
    else if (e.participant.owner) esitle();
  }
  call.on("app-message", al); call.on("joined-meeting", esitle); call.on("participant-joined", katildi);
  return {
    ac(taslak: VivaAnketTaslagi) {
      if (kapali || rol !== "sunucu" || !yerel().owner) throw Error("Soruyu yalnız yayıncı açabilir.");
      const soru = { ...vivaAnketTaslagi(taslak), id: crypto.randomUUID() };
      const yeniSurum = surum + 1;
      gonder({ type: "poll", ...soru, acik: true, surum: yeniSurum, secim: null });
      surum = yeniSurum; oylar = new Map(); guncelle({ soru, acik: true, sayilar: soru.options.map(() => 0), secim: null });
    },
    kapat() {
      if (kapali || rol !== "sunucu" || !yerel().owner || !durum.soru) return;
      const yeniSurum = surum + 1;
      gonder({ type: "poll", ...durum.soru, acik: false, surum: yeniSurum, secim: null });
      surum = yeniSurum; guncelle({ acik: false });
    },
    cevapla(answer: number) {
      if (kapali || rol !== "katilimci" || !durum.acik || durum.secim !== null || durum.gonderiliyor || !durum.soru
        || !Number.isInteger(answer) || answer < 0 || answer >= durum.soru.options.length) return;
      gonder({ type: "selected-answer-poll", id: durum.soru.id, answer }, sahip);
      guncelle({ gonderiliyor: true });
      bekleyen = setTimeout(() => guncelle({ gonderiliyor: false }), 8000);
    },
    temizle() { kapali = true; clearTimeout(bekleyen); oylar.clear(); call.off("app-message", al); call.off("joined-meeting", esitle); call.off("participant-joined", katildi); },
  };
}
