export const ECZANEM_GONDERIM_OMRU_MS = 30 * 24 * 60 * 60 * 1000;
export const ECZANEM_SURE_DOLDU_MESAJI = "Bu yayının üreticiden çıkışından itibaren 30 günlük gönderim süresi doldu.";
export type EczanemGonderimSuresi = { gonderim_baslangic_at?: string | null; gonderim_sure_muaf?: boolean };
export function eczanemGonderimSuresi(baslangic: string | null | undefined, simdi = Date.now(), sureMuaf = false) {
  if (sureMuaf) return { acik: true, bitis: null, kalanMs: 0, metin: "" };
  const bas = baslangic ? Date.parse(baslangic) : NaN;
  if (!Number.isFinite(bas) || !Number.isFinite(simdi)) return { acik: false, bitis: null, kalanMs: 0, metin: "Gönderim süresi doğrulanamadı" };
  const bitis = bas + ECZANEM_GONDERIM_OMRU_MS;
  const kalanMs = Math.max(0,bitis-simdi);
  if (simdi < bas) return { acik: false, bitis, kalanMs, metin: "Gönderim süresi henüz başlamadı" };
  if (kalanMs === 0) return { acik: false, bitis, kalanMs, metin: "Gönderim süresi doldu" };
  const dakika = Math.ceil(kalanMs / 60000);
  const gun = Math.floor(dakika / 1440);
  const saat = Math.floor((dakika % 1440) / 60);
  const metin = gun > 0 ? `${gun} gün${saat > 0 ? ` ${saat} saat` : ""}` : saat > 0 ? `${saat} saat ${dakika % 60} dakika` : `${dakika} dakika`;
  return { acik: true, bitis, kalanMs, metin: `Gönderim için kalan: ${metin}` };
}
export function eczanemGonderimSuresiHatasi(error: { message?: string }): string | null {
  if (error.message?.includes("ECZANEM_GONDERIM:pm_kaynagi_dogrulanamadi")) return "Yayının yetkili üreticiden çıktığı doğrulanamadı. Gönderim yapılamıyor.";
  if (error.message?.includes("ECZANEM_GONDERIM:sure_doldu")) return ECZANEM_SURE_DOLDU_MESAJI;
  if (error.message?.includes("ECZANEM_GONDERIM:sure_dogrulanamadi")) return "Yayının gönderim süresi doğrulanamadı. Gönderim yapılamıyor.";
  if (error.message?.includes("ECZANEM_GONDERIM:yayin_kapali")) return "Bu yayın şu an yayında değil.";
  return null;
}
