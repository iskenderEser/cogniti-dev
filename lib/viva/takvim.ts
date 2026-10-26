import { vivaUuidMu, type VivaEtkinlik } from "./sozlesme";

function takvimBilgisi(e: VivaEtkinlik, origin: string) {
  const u = new URL(origin);
  if (!["https:", "http:"].includes(u.protocol) || u.username || u.password || !vivaUuidMu(e.etkinlik_id)
    || e.durum !== "planlandi" || e.yayin_turu === "anlik" || !Number.isFinite(Date.parse(e.baslangic))
    || !Number.isFinite(Date.parse(e.bitis)) || Date.parse(e.bitis) <= Date.parse(e.baslangic)) throw Error("Bu yayın takvime eklenemez.");
  return { url: `${u.origin}/viva/${e.etkinlik_id}`, bas: new Date(e.baslangic), bit: new Date(e.bitis) };
}
const damga = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
export function vivaGoogleTakvim(e: VivaEtkinlik, origin: string) {
  const { url, bas, bit } = takvimBilgisi(e, origin);
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.baslik, dates: `${damga(bas)}/${damga(bit)}`,
    stz: "Europe/Istanbul", etz: "Europe/Istanbul", details: `${e.aciklama}\n\nCogniti · Viva\n${url}`, location: url });
  return `https://calendar.google.com/calendar/r/eventedit?${q}`;
}
const kacir = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
// iCalendar satırı en fazla 75 UTF-8 baytı; Türkçe karakterler bölünmez.
function katla(s: string) {
  const enc = new TextEncoder(); let satir = "", sonuc = "", bayt = 0;
  for (const harf of s) {
    const n = enc.encode(harf).length;
    if (bayt + n > 75) { sonuc += `${satir}\r\n`; satir = " "; bayt = 1; }
    satir += harf; bayt += n;
  }
  return sonuc + satir;
}
export function vivaOutlookTakvim(e: VivaEtkinlik, origin: string, simdi = new Date()) {
  const { url, bas, bit } = takvimBilgisi(e, origin);
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cogniti//Viva//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:viva-${e.etkinlik_id}@${new URL(origin).hostname}`, `DTSTAMP:${damga(simdi)}`, `DTSTART:${damga(bas)}`, `DTEND:${damga(bit)}`,
    `SEQUENCE:${e.surum}`, `SUMMARY:${kacir(e.baslik)}`, `DESCRIPTION:${kacir(`${e.aciklama}\n\nCogniti · Viva\n${url}`)}`,
    `LOCATION:${kacir(url)}`, `URL:${url}`, "END:VEVENT", "END:VCALENDAR"].map(katla).join("\r\n") + "\r\n";
}
