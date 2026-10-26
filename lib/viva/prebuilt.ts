import type { DailyCall, DailyFactoryOptions, DailyThemeConfig, DailyThemeColors, DailyCustomIntegrations, DailyInputVideoProcessorSettings, DailyEventObjectNonFatalError, DailyEventObjectNetworkConnectionEvent } from "@daily-co/daily-js";
import { vivaAnketBagla, type VivaAnketDurumu, type VivaAnketTaslagi } from "./anket";
import type { VivaAnketDeposu } from "./anketArsiv";
import { cizimRenkCozucu, cizimTemasiniIzle } from "@/lib/tema/cizimRenkleri";

export type VivaPrebuiltSdk = Pick<typeof import("@daily-co/daily-js").default, "createFrame" | "supportedBrowser">;
export type VivaArkaPlan = { tur: "yok" | "bulanik" } | { tur: "gorsel"; kaynak: ArrayBuffer };
export interface VivaGorusmeGirdisi {
  durum: "hazir"; rol: "sunucu" | "katilimci" | "izleyici"; url: string; token: string; bitis: string;
}
export function vivaGorusmeGirdisi(data: unknown): VivaGorusmeGirdisi {
  const d = data as VivaGorusmeGirdisi | null;
  let url: URL;
  try { url = new URL(d?.url ?? ""); } catch { throw new Error("Görüşme bağlantısı doğrulanamadı."); }
  if (!d || d.durum !== "hazir" || !["sunucu", "katilimci", "izleyici"].includes(d.rol)
    || url.protocol !== "https:" || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.daily\.co$/.test(url.hostname)
    || url.port || url.username || url.password || url.search || url.hash || !/^\/viva-[a-f0-9]{32}-n[1-9][0-9]*$/.test(url.pathname)
    || typeof d.token !== "string" || d.token.length > 16384 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(d.token)
    || typeof d.bitis !== "string" || !Number.isFinite(Date.parse(d.bitis)) || Date.parse(d.bitis) <= Date.now()) {
    throw new Error("Görüşme bağlantısı doğrulanamadı veya süresi dolmuş.");
  }
  return { durum: "hazir", rol: d.rol, url: url.href, token: d.token, bitis: d.bitis };
}
export function vivaPrebuiltTemasi(oge: Element): DailyThemeConfig {
  const coz = cizimRenkCozucu(oge);
  const kaynak: Record<keyof DailyThemeColors, string> = {
    accent: "--tema-eylem", accentText: "--tema-eylem-metin", background: "--tema-yuzey",
    backgroundAccent: "--tema-secili", baseText: "--tema-metin", border: "--tema-cizgi",
    mainAreaBg: "--tema-zemin", mainAreaBgAccent: "--tema-kart", mainAreaText: "--tema-metin", supportiveText: "--tema-ikincil-metin",
  };
  // Daily yalnız hex kabul eder. Renk kaynağı Cogniti CSS'sidir; çözülemeyen renk SDK varsayılanına bırakılır.
  const colors = Object.fromEntries(Object.entries(kaynak).flatMap(([ad, degisken]) => {
    const renk = coz(`var(${degisken})`);
    return /^#[a-f0-9]{3}(?:[a-f0-9]{3})?$/i.test(renk) ? [[ad, renk]] : [];
  }));
  return { colors };
}
/** Yalnız belgelenen Prebuilt CSS kancaları; medya ve yerleşim kontrolleri saklanmaz. */
export const VIVA_PREBUILT_CSS = `
body.cogniti-viva { font-family: Nunito, ui-rounded, system-ui, sans-serif; }
body.cogniti-viva button, body.cogniti-viva input, body.cogniti-viva select { font-family: inherit; }
body.cogniti-viva .daily-video-tile { border-radius: 12px; overflow: hidden; }
body.cogniti-viva .daily-controls { border-radius: 12px; }
`;
// create/destroy sırası sayfa değişimleri ve StrictMode yeniden bağlanmaları arasında korunur.
let kaynakSirasi: Promise<unknown> = Promise.resolve();
let etkin: DailyCall | null = null;
function sirada<T>(is: () => Promise<T> | T): Promise<T> {
  const sonuc = kaynakSirasi.then(is);
  kaynakSirasi = sonuc.catch(() => undefined);
  return sonuc;
}
export function vivaPrebuiltBaslat(v: {
  kapsayici: HTMLElement; girdi: VivaGorusmeGirdisi;
  sdkYukle?: () => Promise<VivaPrebuiltSdk>;
  durum: (durum: "hazirlaniyor" | "gorusmede" | "ayrildi") => void;
  hata: (mesaj: string) => void;
  paylasimDestegi: (baslatabilir: boolean) => void;
  baglanti?: (kesik: boolean) => void;
  arkaPlanDestegi?: (destekli: boolean) => void;
  arkaPlanHatasi?: (mesaj: string) => void;
  kayit?: (durum: "basladi" | "durdu" | "hata", instanceId?: string) => void;
  entegrasyonlar?: DailyCustomIntegrations;
  anket?: (durum: VivaAnketDurumu) => void;
  anketDeposu?: VivaAnketDeposu;
}) {
  let kapali = false; let call: DailyCall | null = null; let temizlik: Promise<void> | null = null;
  let gorusmede = false, videoIsleme = false;
  let temayiBirak = () => {};
  let anket: ReturnType<typeof vivaAnketBagla> | null = null;
  const dinleyiciler: (() => void)[] = [];
  function kapat(): Promise<void> {
    if (temizlik) return temizlik;
    kapali = true; anket?.temizle(); temayiBirak(); dinleyiciler.splice(0).forEach(fn => fn());
    temizlik = sirada(async () => {
      if (!call) return;
      try { if (!call.isDestroyed()) await call.destroy(); }
      finally { if (call.isDestroyed() && etkin === call) etkin = null; }
    });
    return temizlik;
  }
  function hata() {
    if (kapali) return;
    v.hata("Görüşme bağlantısı kurulamadı. Yeniden katılmayı deneyin.");
    void kapat().catch(() => undefined);
  }
  const hazir = (async () => {
    const sdk = await (v.sdkYukle ?? (async () => (await import("@daily-co/daily-js")).default))();
    if (kapali) return;
    const destek = sdk.supportedBrowser();
    videoIsleme = destek.supportsVideoProcessing === true;
    v.arkaPlanDestegi?.(videoIsleme);
    if (!destek.supported) {
      v.hata("Bu tarayıcı canlı görüşmeyi desteklemiyor. Güncel Chrome, Edge veya Safari ile yeniden deneyin.");
      return;
    }
    await sirada(() => {
      if (kapali) return;
      if (etkin && !etkin.isDestroyed()) throw new Error("Önceki görüşme henüz kapatılamadı.");
      const ayarlar: DailyFactoryOptions = {
        lang: "tr", showLeaveButton: true, showFullscreenButton: destek.supportsFullscreen,
        showUserNameChangeUI: false, bodyClass: "cogniti-viva", cssText: VIVA_PREBUILT_CSS,
        layoutConfig: { grid: { minTilesPerPage: 1, maxTilesPerPage: 9 } }, theme: vivaPrebuiltTemasi(v.kapsayici),
        iframeStyle: { width: "100%", height: "100%", border: "0", display: "block" },
        ...(v.girdi.rol === "sunucu" && v.entegrasyonlar ? { customIntegrations: v.entegrasyonlar } : {}),
      };
      call = sdk.createFrame(v.kapsayici, ayarlar); etkin = call;
      const c = call;
      if (v.anket) anket = vivaAnketBagla(c, v.girdi.rol, v.anket, v.anketDeposu);
      const iframe = c.iframe();
      if (iframe) { iframe.title = "Viva canlı görüşme"; iframe.referrerPolicy = "no-referrer"; }
      v.paylasimDestegi(destek.supportsScreenShare);
      const izle = (ad: "loaded" | "joined-meeting" | "left-meeting" | "error", fn: () => void) => {
        c.on(ad, fn); dinleyiciler.push(() => c.off(ad, fn));
      };
      izle("loaded", () => { if (!kapali) v.durum("hazirlaniyor"); });
      izle("joined-meeting", () => { if (!kapali) { gorusmede = true; v.durum("gorusmede"); } });
      izle("left-meeting", () => {
        if (kapali) return;
        gorusmede = false;
        v.durum("ayrildi"); void kapat().catch(() => undefined);
      });
      izle("error", hata);
      if (v.baglanti) {
        const kesilenler = new Set<DailyEventObjectNetworkConnectionEvent["type"]>();
        const agDurumu = (e: DailyEventObjectNetworkConnectionEvent) => {
          if (kapali || !gorusmede || !["signaling", "sfu", "peer-to-peer"].includes(e.type)) return;
          if (e.event === "interrupted") kesilenler.add(e.type);
          else if (e.event === "connected") kesilenler.delete(e.type);
          else return;
          // SDK yeniden bağlanır; ikinci iframe/token/katılım döngüsü başlatılmaz.
          v.baglanti?.(kesilenler.size > 0);
        };
        c.on("network-connection", agDurumu);
        dinleyiciler.push(() => c.off("network-connection", agDurumu));
      }
      if (v.arkaPlanHatasi) {
        const islemeHatasi = (e: DailyEventObjectNonFatalError) => {
          if (!kapali && ["input-settings-error", "video-processor-error"].includes(e.type))
            v.arkaPlanHatasi?.("Arka plan uygulanamadı. Farklı bir JPEG/PNG görseliyle veya bulanıklaştırmayla yeniden deneyin.");
        };
        c.on("nonfatal-error", islemeHatasi); dinleyiciler.push(() => c.off("nonfatal-error", islemeHatasi));
      }
      // Yerel durum yalnız kullanıcı bildirimi; hazır dosya sunucuda Daily API/webhook ile doğrulanır.
      const kayitBasladi = (e?: { instanceId?: string }) => { if (!kapali) v.kayit?.("basladi", e?.instanceId); };
      const kayitDurdu = (e?: { instanceId?: string }) => { if (!kapali) v.kayit?.("durdu", e?.instanceId); };
      const kayitHata = (e?: { instanceId?: string }) => { if (!kapali) v.kayit?.("hata", e?.instanceId); };
      c.on("recording-started", kayitBasladi); c.on("recording-stopped", kayitDurdu); c.on("recording-error", kayitHata);
      dinleyiciler.push(() => { c.off("recording-started", kayitBasladi); c.off("recording-stopped", kayitDurdu); c.off("recording-error", kayitHata); });
      temayiBirak = cizimTemasiniIzle(v.kapsayici, () => {
        if (!kapali && !c.isDestroyed()) void c.setTheme(vivaPrebuiltTemasi(v.kapsayici)).catch(() => undefined);
      });
      // Token yalnız join parametresidir; URL'ye, DOM'a veya tarayıcı deposuna yazılmaz.
      void c.join({ url: v.girdi.url, token: v.girdi.token, lang: "tr", startAudioOff: true, startVideoOff: true,
        ...(v.girdi.rol === "izleyici" ? { audioSource: false, videoSource: false } : {}),
      }).catch(hata);
    });
  })().catch(hata);
  function kaydiBaslat() {
    if (kapali || !call || call.isDestroyed() || v.girdi.rol !== "sunucu") return false;
    call.startRecording({ type: "cloud", dataOutputs: ["chat-webvtt"] });
    return true;
  }
  function kaydiDurdur() {
    if (kapali || !call || call.isDestroyed() || v.girdi.rol !== "sunucu") return false;
    call.stopRecording();
    return true;
  }
  async function arkaPlanDegistir(secim: VivaArkaPlan) {
    if (kapali || !call || call.isDestroyed() || !gorusmede) throw Error("Önce görüşmeye katılın.");
    if (v.girdi.rol === "izleyici") throw Error("İzleyici kamera arka planını değiştiremez.");
    if (!videoIsleme) throw Error("Bu cihaz veya tarayıcı arka plan efektlerini desteklemiyor.");
    let processor: DailyInputVideoProcessorSettings;
    if (secim.tur === "gorsel") {
      if (!secim.kaynak.byteLength || secim.kaynak.byteLength > 5 * 1024 * 1024) throw Error("En fazla 5 MB boyutunda bir görsel seçin.");
      processor = { type: "background-image", config: { source: secim.kaynak } };
    } else processor = secim.tur === "bulanik" ? { type: "background-blur", config: { strength: 0.8 } } : { type: "none" };
    await call.updateInputSettings({ video: { processor } });
  }
  return { hazir, kapat, kaydiBaslat, kaydiDurdur, arkaPlanDegistir,
    anketAc: (soru: VivaAnketTaslagi) => { if (!anket || kapali) throw Error("Önce görüşmeye katılın."); return anket.ac(soru); },
    anketKapat: () => anket?.kapat(), anketCevapla: (secim: number) => anket?.cevapla(secim),
  };
}
