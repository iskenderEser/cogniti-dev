import type { DailyCustomIntegrations } from "@daily-co/daily-js";
// Yalnız açıkça istenen sunucu önizlemesi; gerçek içerik/soru ve özel davet yetkisi taşımaz.
export function vivaOnizlemeAyari(origin: string, etkinlik: string): DailyCustomIntegrations {
  const u = new URL(origin);
  if ((u.protocol !== "https:" && !(u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname)))
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(etkinlik)) throw Error("Geçersiz önizleme adresi.");
  return { cognitiOnizleme: { label: "Cogniti önizleme", location: "main", controlledBy: "owners", shared: false,
    src: `${u.origin}/viva/entegrasyon-onizleme?etkinlik_id=${encodeURIComponent(etkinlik)}`,
    loading: "lazy", referrerPolicy: "no-referrer", sandbox: "allow-scripts allow-same-origin", allow: "fullscreen" } };
}
