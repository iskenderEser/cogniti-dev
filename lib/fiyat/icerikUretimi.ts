import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";

export const SORU_SETI_URETIM_TOKENI = 200;

export const ICERIK_URETIM_TARIFESI = {
  video: { ad: "Video", token: 2500 },
  podcast: { ad: "Podcast", token: 1500 },
  gorsel: { ad: "Dijital Broşür", token: 1000 },
  flip_pdf: { ad: "Literatür", token: null },
} satisfies Record<OgrenmeAraciTuru, { ad: string; token: number | null }>;

export function icerikUretimBedeli(tur: OgrenmeAraciTuru, hazirArac: boolean, hazirSoruSeti: boolean) {
  if (hazirArac && hazirSoruSeti) return { tur: "sabit", token: 0 } as const;

  const aracToken = ICERIK_URETIM_TARIFESI[tur].token;
  if (aracToken === null) return { tur: "teklif", token: null } as const;

  return {
    tur: "sabit",
    token: (hazirArac ? 0 : aracToken) + (hazirSoruSeti ? 0 : SORU_SETI_URETIM_TOKENI),
  } as const;
}
