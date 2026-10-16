const GUN_MS = 24 * 60 * 60 * 1000;
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
const TOPLAM_GUN = 15;
const YESIL = [22, 163, 74] as const;
const SARI = [217, 147, 0] as const;
const KIRMIZI = [220, 38, 38] as const;

function sinirla(deger: number, alt: number, ust: number): number {
  return Math.max(alt, Math.min(ust, deger));
}

function karistir(ilk: readonly number[], son: readonly number[], oran: number): number[] {
  return ilk.map((deger, indeks) => Math.round(deger + (son[indeks] - deger) * oran));
}

export function eclubHoykRengi(konum: number, kirmizilasma = 0): string {
  const oran = sinirla(konum, 0, 1);
  const ara = oran <= 0.5
    ? karistir(YESIL, SARI, oran * 2)
    : karistir(SARI, KIRMIZI, (oran - 0.5) * 2);
  return `rgb(${karistir(ara, KIRMIZI, sinirla(kirmizilasma, 0, 1)).join(",")})`;
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
