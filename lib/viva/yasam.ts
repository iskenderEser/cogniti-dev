import "server-only";
import { createVivaDailyApi, VivaDailyHatasi, type VivaDailyYasamApi } from "./daily";
import { vivaDailyKisiKimligi } from "./katilim";
export type VivaYasamRpc = (islem: string, veri?: Record<string, unknown>) => Promise<Record<string, unknown>>;
export async function vivaYasamBaslat(rpc: VivaYasamRpc, api: VivaDailyYasamApi = createVivaDailyApi()) {
  const d = await rpc("oku");
  if (d.domain !== api.domain || typeof d.oda_adi !== "string" || typeof d.sahip_id !== "string") throw new VivaDailyHatasi("Görüşme odası hazır değil.", "KATILIM_KAPALI", 409);
  const oturum = await api.sunucuOturumu(d.oda_adi, vivaDailyKisiKimligi(`uye:${d.sahip_id}`));
  if (!oturum) return { bekle: true };
  return rpc("basladi", { surum: d.surum, nesil: d.nesil, oda_adi: d.oda_adi, oturum_id: oturum });
}
export async function vivaYasamMutabakat(rpc: VivaYasamRpc, api: VivaDailyYasamApi = createVivaDailyApi()) {
  const d = await rpc("ayir"); if (d.bekle) return { bekle: true };
  const ids = d.user_ids;
  try {
    if (d.oda_adi != null) {
      if (d.domain !== api.domain || typeof d.oda_adi !== "string" || !Array.isArray(ids) || ids.some(i => typeof i !== "string")) throw new VivaDailyHatasi("Yayın işi doğrulanamadı.", "TUTARSIZ_YANIT");
      if (d.kapat) await api.kayitDurdur?.(d.oda_adi);
      await api.erisimEngelle(d.oda_adi, ids as string[]);
      if (d.kapat) await api.odaKapat(d.oda_adi);
    }
    return await rpc("tamamla", { kira: d.kira, user_ids: ids ?? [], kapat: d.kapat });
  } catch (err) {
    await rpc("hata", { kira: d.kira }).catch(() => undefined);
    throw err;
  }
}
