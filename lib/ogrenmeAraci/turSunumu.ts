import type { OgrenmeAraciTuru } from "./tipler";

export const YAYIN_TURU_SUNUMU: Record<OgrenmeAraciTuru, {
  etiket: string;
  cogulEtiket: string;
  renk: string;
  zemin: string;
}> = {
  video: { etiket: "Video", cogulEtiket: "Videolar", renk: "var(--tema-arac-video-metin)", zemin: "var(--tema-arac-video-zemin)" },
  podcast: { etiket: "Podcast", cogulEtiket: "Podcastler", renk: "var(--tema-arac-podcast-metin)", zemin: "var(--tema-arac-podcast-zemin)" },
  gorsel: { etiket: "Dijital Broşür", cogulEtiket: "Dijital Broşürler", renk: "var(--tema-arac-gorsel-metin)", zemin: "var(--tema-arac-gorsel-zemin)" },
  flip_pdf: { etiket: "Literatür", cogulEtiket: "Literatürler", renk: "var(--tema-arac-flip_pdf-metin)", zemin: "var(--tema-arac-flip_pdf-zemin)" },
};

export const YAYIN_TURLERI = Object.keys(YAYIN_TURU_SUNUMU) as OgrenmeAraciTuru[];

