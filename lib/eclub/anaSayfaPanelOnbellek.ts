"use client";

import type { PanelFirmaOzeti, PanelKisi, PanelOneri, PanelOzet } from "@/app/(panel)/eclub/panel/_hooks/useEclubPanel";

export interface PanelVerisi {
  kisi?: PanelKisi | null;
  oneriler?: PanelOneri[];
  firma_ozetleri?: PanelFirmaOzeti[];
  ozet?: Partial<PanelOzet>;
  hata?: string;
  adim?: string;
  detay?: string;
}

const SURE = 60_000;
const PREFIX = "hb_eclub_ana_sayfa_v1_";
const kayitlar = new Map<string, { veri: PanelVerisi; zaman: number }>();
const istekler = new Map<string, Promise<{ ok: boolean; veri: PanelVerisi }>>();

export function panelOnbelleginiSil(anahtar: string) {
  kayitlar.delete(anahtar);
  try { sessionStorage.removeItem(PREFIX + anahtar); } catch { /* Depolama zorunlu değildir. */ }
}

export function panelOnbelleginiOku(anahtar: string, azamiYas = SURE): PanelVerisi | null {
  try {
    const kayit = kayitlar.get(anahtar) ?? JSON.parse(sessionStorage.getItem(PREFIX + anahtar) ?? "null");
    if (kayit?.veri && typeof kayit.zaman === "number" && Date.now() - kayit.zaman >= 0 && Date.now() - kayit.zaman < azamiYas) {
      kayitlar.set(anahtar, kayit);
      return kayit.veri;
    }
  } catch { /* Bozuk kayıt ağ isteğini engellemez. */ }
  panelOnbelleginiSil(anahtar);
  return null;
}

export function panelVerisiniIste(anahtar: string, adres: string, zorla = false) {
  const mevcut = istekler.get(anahtar);
  if (mevcut && !zorla) return mevcut;
  const istek = fetch(adres, { cache: "no-store" }).then(async (res) => ({ ok: res.ok, veri: await res.json() as PanelVerisi }))
    .finally(() => { if (istekler.get(anahtar) === istek) istekler.delete(anahtar); });
  istekler.set(anahtar, istek);
  return istek;
}

export function panelOnbellegineYaz(anahtar: string, veri: PanelVerisi) {
  const kayit = { veri, zaman: Date.now() };
  kayitlar.set(anahtar, kayit);
  try { sessionStorage.setItem(PREFIX + anahtar, JSON.stringify(kayit)); } catch { /* Bellek önbelleği yeterlidir. */ }
}
