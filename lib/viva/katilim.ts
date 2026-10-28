import "server-only";
import { createHash } from "node:crypto";
import { createVivaDailyApi, VivaDailyHatasi, vivaDailyOdaAdi, type VivaDailyKatilimApi, type VivaDailyTokenAyarlari } from "./daily";
import { vivaDailyOdaHazirla, type VivaOdaDeposu, type VivaOdaDurumu } from "./oda";
import { vivaUuidMu } from "./sozlesme";

export type VivaKatilimRolu = "sunucu" | "katilimci" | "izleyici";
export interface VivaKatilimBaglami {
  etkinlik_id: string; surum: number; sahip_id: string; kimlik: string; ad: string;
  rol: VivaKatilimRolu; baslangic: string; bitis: string; oturum_bitis: string | null;
  oda: VivaOdaDurumu | null; oturum_izi?: string | null;
}
export interface VivaKatilimDeposu {
  oku: () => Promise<unknown>;
  odaDeposu?: VivaOdaDeposu;
  erisimKaydet?: (d: VivaKatilimBaglami, dailyUserId: string) => Promise<void>;
}
export type VivaKatilimSonucu = {
  durum: "hazir"; rol: VivaKatilimRolu; url: string; token: string; bitis: string; yayin_bitis: string; sunucu_zamani: string;
} | {
  durum: "bekliyor"; neden: "zaman" | "oda" | "sunucu";
  mesaj: string; tekrar_saniye: number;
};
export const vivaDailyKisiKimligi = (kimlik: string) => `vi_${createHash("sha256").update(`viva:${kimlik}`).digest("hex").slice(0, 32)}`;
export function vivaKatilimBaglami(data: unknown): VivaKatilimBaglami {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new VivaDailyHatasi("Katılım yetkisi okunamadı.", "TUTARSIZ_YANIT");
  const d = data as VivaKatilimBaglami;
  if (!vivaUuidMu(d.etkinlik_id) || !vivaUuidMu(d.sahip_id) || !Number.isSafeInteger(d.surum) || d.surum < 1
    || !["sunucu", "katilimci", "izleyici"].includes(d.rol)
    || typeof d.kimlik !== "string" || !/^(uye|davet):[0-9a-f-]{36}$/i.test(d.kimlik) || !vivaUuidMu(d.kimlik.split(":")[1])
    || (d.rol === "izleyici") !== d.kimlik.startsWith("davet:")
    || (d.rol === "sunucu") !== (d.kimlik === `uye:${d.sahip_id}`)
    || typeof d.ad !== "string" || !d.ad.trim() || d.ad.length > 240
    || typeof d.baslangic !== "string" || typeof d.bitis !== "string"
    || !Number.isFinite(Date.parse(d.baslangic)) || !Number.isFinite(Date.parse(d.bitis)) || Date.parse(d.bitis) <= Date.parse(d.baslangic)
    || (d.rol === "izleyici" ? typeof d.oturum_bitis !== "string" || !Number.isFinite(Date.parse(d.oturum_bitis)) : d.oturum_bitis !== null)
    || !("oda" in d)) throw new VivaDailyHatasi("Katılım yetkisi doğrulanamadı.", "TUTARSIZ_YANIT");
  return d;
}
export function vivaDailyTokenAyarlari(d: VivaKatilimBaglami, simdi = Date.now()): VivaDailyTokenAyarlari {
  const bas = Date.parse(d.baslangic), bit = Math.min(Date.parse(d.bitis), d.oturum_bitis ? Date.parse(d.oturum_bitis) : Infinity);
  // exp ile eject birlikte: erişim sonunu geçirmez, görüşmeyi kısa token ömrüyle kesmez.
  if (bas > simdi || bit <= simdi || !d.oda || !d.oda.guncel || d.oda.kapanmis) {
    throw new VivaDailyHatasi("Bu etkinliğe şu anda katılınamaz.", "KATILIM_KAPALI", 403);
  }
  return {
    room_name: d.oda.oda_adi, user_id: vivaDailyKisiKimligi(d.kimlik + (d.rol === "izleyici" && d.oturum_izi ? `:${d.oturum_izi}` : "")), user_name: d.ad,
    is_owner: d.rol === "sunucu", nbf: Math.floor(bas / 1000), exp: Math.floor(bit / 1000),
    eject_at_token_exp: true, enable_screenshare: d.rol !== "izleyici",
    enable_prejoin_ui: false, enable_recording_ui: d.rol === "sunucu",
    enable_recording: d.rol === "sunucu" ? "cloud" : false,
    start_video_off: true, start_audio_off: true, start_cloud_recording: false,
    auto_start_transcription: false, knocking: false, lang: "tr",
    permissions: { hasPresence: true, canSend: d.rol !== "izleyici", canReceive: { base: true }, canAdmin: d.rol === "sunucu" },
  };
}
function odaDogrula(d: VivaKatilimBaglami, api: VivaDailyKatilimApi) {
  const o = d.oda;
  if (!o || o.domain !== api.domain || o.etkinlik_id !== d.etkinlik_id || o.oda_adi !== vivaDailyOdaAdi(d.etkinlik_id, o.nesil)
    || o.kapanmis || o.durum === "kapali") throw new VivaDailyHatasi("Viva oda eşleştirmesi geçersiz veya kapanmış.", "KATILIM_KAPALI", 403);
}
const bekle = (neden: "zaman" | "oda" | "sunucu"): VivaKatilimSonucu => ({
  durum: "bekliyor", neden, tekrar_saniye: 5,
  mesaj: neden === "zaman" ? "Etkinliğin başlama saati bekleniyor." : neden === "sunucu" ? "Sunucunun görüşmeye katılması bekleniyor." : "Görüşme odası hazırlanıyor. Birazdan yeniden deneyin.",
});
export async function vivaKatilimHazirla(depo: VivaKatilimDeposu, api: VivaDailyKatilimApi = createVivaDailyApi()): Promise<VivaKatilimSonucu> {
  let d = vivaKatilimBaglami(await depo.oku());
  if (Date.parse(d.bitis) <= Date.now() || (d.oturum_bitis && Date.parse(d.oturum_bitis) <= Date.now())) throw new VivaDailyHatasi("Katılım süresi dolmuş.", "KATILIM_KAPALI", 403);
  if (Date.parse(d.baslangic) > Date.now()) return bekle("zaman");
  if (d.oda) odaDogrula(d, api);
  // Sunucu her girişte oda ayarlarını uzlaştırır; eski hazır odalar da yeni özellikleri alır.
  if (d.rol === "sunucu" || !d.oda?.guncel || d.oda.islem_suruyor) {
    if (d.rol !== "sunucu") return bekle("oda");
    if (!depo.odaDeposu) throw new VivaDailyHatasi("Oda hazırlama bağlantısı yok.", "TUTARSIZ_YANIT");
    const hazir = await vivaDailyOdaHazirla(depo.odaDeposu, api);
    if (hazir.bekle) return bekle("oda");
    d = vivaKatilimBaglami(await depo.oku());
    odaDogrula(d, api);
    if (!d.oda?.guncel || d.oda.islem_suruyor) return bekle("oda");
  }
  if (d.rol !== "sunucu" && !await api.sunucuOdada(d.oda!.oda_adi, vivaDailyKisiKimligi(`uye:${d.sahip_id}`))) return bekle("sunucu");
  const ayarlar = vivaDailyTokenAyarlari(d);
  await depo.erisimKaydet?.(d, ayarlar.user_id);
  const token = await api.tokenOlustur(ayarlar);
  // HTTP sırasında yetki/davet/tarih/oda değişmiş olabilir. Token tesliminden önce tekrar oku.
  const son = vivaKatilimBaglami(await depo.oku());
  if (JSON.stringify(son) !== JSON.stringify(d)) throw new VivaDailyHatasi("Etkinlik veya katılım yetkiniz değişti. Yeniden deneyin.", "ETKINLIK_DEGISTI", 409);
  vivaDailyTokenAyarlari(son);
  return { durum: "hazir", rol: d.rol, url: `https://${api.domain}/${ayarlar.room_name}`, token, bitis: new Date(ayarlar.exp * 1000).toISOString(), yayin_bitis: d.bitis, sunucu_zamani: new Date().toISOString() };
}
