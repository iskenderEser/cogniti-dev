import "server-only";
import { createVivaDailyApi, VivaDailyHatasi, type VivaDailyApi, type VivaDailyOdaIstek } from "./daily";

export interface VivaOdaDurumu {
  etkinlik_id: string; domain: string; oda_adi: string; oda_id: string | null; nesil: number;
  durum: "hazirlaniyor" | "hazir" | "hata" | "kapali";
  guncel: boolean; islem_suruyor: boolean; kapanmis: boolean; hata_kodu: string | null;
}
export interface VivaOdaSonucu { oda: VivaOdaDurumu | null; bekle?: boolean }
export interface VivaOdaDeposu {
  islem: (islem: "durum" | "ayir" | "tamamla" | "hata", veri?: Record<string, unknown>) => Promise<unknown>;
}
export function vivaOdaSonucu(data: unknown): VivaOdaSonucu {
  if (!data || typeof data !== "object") throw new VivaDailyHatasi("Viva oda eşleştirmesi okunamadı.", "TUTARSIZ_YANIT");
  const d = data as Record<string, unknown>;
  if (typeof d.hata === "string") {
    throw new VivaDailyHatasi(d.hata, "ETKINLIK_DEGISTI", d.status === 409 ? 409 : 503);
  }
  if (!("oda" in d)) throw new VivaDailyHatasi("Viva oda eşleştirmesi okunamadı.", "TUTARSIZ_YANIT");
  // Dış yanıt izinli alanlardan üretilir; kira anahtarı/dahili istek dönmez.
  const o = d.oda as VivaOdaDurumu | null;
  return { oda: o ? {
    etkinlik_id: o.etkinlik_id, domain: o.domain, oda_adi: o.oda_adi, oda_id: o.oda_id,
    nesil: o.nesil, durum: o.durum, guncel: o.guncel, islem_suruyor: o.islem_suruyor,
    kapanmis: o.kapanmis, hata_kodu: o.hata_kodu,
  } : null, ...(d.bekle === true ? { bekle: true } : {}) };
}
export async function vivaDailyOdaHazirla(depo: VivaOdaDeposu, api: VivaDailyApi = createVivaDailyApi()): Promise<VivaOdaSonucu> {
  const ham = await depo.islem("ayir", { domain: api.domain });
  const durum = vivaOdaSonucu(ham);
  if (durum.bekle) return durum;
  const v = (ham as { istek?: VivaDailyOdaIstek & { kira_anahtari: string } }).istek;
  if (!v || v.domain !== api.domain || typeof v.kira_anahtari !== "string" || !/^[0-9a-f-]{36}$/i.test(v.kira_anahtari)) {
    throw new VivaDailyHatasi("Viva oda işlemi başlatılamadı.", "TUTARSIZ_YANIT");
  }
  try {
    const oda = await api.odaHazirla(v);
    return vivaOdaSonucu(await depo.islem("tamamla", { kira_anahtari: v.kira_anahtari, oda_id: oda.id }));
  } catch (err) {
    // Hata güncellemesi de başarısız olursa kira süresi yeniden denemeyi mümkün kılar.
    await depo.islem("hata", { kira_anahtari: v.kira_anahtari, hata_kodu: err instanceof VivaDailyHatasi ? err.kod : "ESLESTIRME_HATASI" }).catch(() => undefined);
    throw err;
  }
}
