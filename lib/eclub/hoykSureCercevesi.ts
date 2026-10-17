import { hesaplananRenk } from "@/lib/tema/cizimRenkleri";
import type { HesaplananRenkAnahtari } from "@/lib/tema/hesaplananRenkler.generated";

const GUN_MS = 24 * 60 * 60 * 1000;
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
const TOPLAM_GUN = 15;

/** Üç uç CSS'den gelir; ara renk hesabı ve yuvarlama sırası korunur. */
export function eclubHoykRenkPaleti(coz: (ad: HesaplananRenkAnahtari) => string = hesaplananRenk) {
  const rgb = (ad: HesaplananRenkAnahtari): readonly number[] => {
    const deger = coz(ad);
    if (/^#[\da-f]{6}$/i.test(deger)) return [1, 3, 5].map((i) => parseInt(deger.slice(i, i + 2), 16));
    return deger.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  };
  return { yesil: rgb("--tema-cizim-sure-baslangic"), sari: rgb("--tema-cizim-sure-orta"), kirmizi: rgb("--tema-cizim-sure-bitis") };
}
const VARSAYILAN_PALET = eclubHoykRenkPaleti();

function sinirla(deger: number, alt: number, ust: number): number {
  return Math.max(alt, Math.min(ust, deger));
}

function karistir(ilk: readonly number[], son: readonly number[], oran: number): number[] {
  return ilk.map((deger, indeks) => Math.round(deger + (son[indeks] - deger) * oran));
}

export function eclubHoykRengi(konum: number, kirmizilasma = 0, palet = VARSAYILAN_PALET): string {
  const oran = sinirla(konum, 0, 1);
  const ara = oran <= 0.5
    ? karistir(palet.yesil, palet.sari, oran * 2)
    : karistir(palet.sari, palet.kirmizi, (oran - 0.5) * 2);
  return `rgb(${karistir(ara, palet.kirmizi, sinirla(kirmizilasma, 0, 1)).join(",")})`;
}

export function eclubHoykUcRengi(gecenGun: number): string {
  return eclubHoykRengi(gecenGun / TOPLAM_GUN, gecenGun >= TOPLAM_GUN ? 1 : 0);
}

const turkiyeTarihi = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function turkiyeGunIndeksi(zaman: number): number {
  const parcalar = turkiyeTarihi.formatToParts(new Date(zaman));
  const yil = Number(parcalar.find((parca) => parca.type === "year")?.value);
  const ay = Number(parcalar.find((parca) => parca.type === "month")?.value);
  const gun = Number(parcalar.find((parca) => parca.type === "day")?.value);
  return Date.UTC(yil, ay - 1, gun) / GUN_MS;
}

export function eclubHoykSureDurumu(
  baslangic: string,
  bitis: string,
  simdi: number,
): { gecenGun: number; suresiGecti: boolean; kalanGun: number } | null {
  const baslangicMs = Date.parse(baslangic);
  const bitisMs = Date.parse(bitis);
  if (!Number.isFinite(baslangicMs) || !Number.isFinite(bitisMs) || !Number.isFinite(simdi)) return null;

  return {
    gecenGun: Math.max(0, Math.min(TOPLAM_GUN, turkiyeGunIndeksi(simdi) - turkiyeGunIndeksi(baslangicMs))),
    suresiGecti: simdi > bitisMs,
    kalanGun: Math.max(0, Math.ceil((bitisMs - simdi) / GUN_MS)),
  };
}

export function sonrakiTurkiyeGeceYarisi(simdi: number): number {
  return (turkiyeGunIndeksi(simdi) + 1) * GUN_MS - ISTANBUL_OFFSET_MS;
}
