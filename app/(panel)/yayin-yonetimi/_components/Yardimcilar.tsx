// app/yayin-yonetimi/_components/Yardimcilar.tsx
//
// Yayın yönetimi sayfasının küçük, durumsuz sunum bileşenleri:
//   - VideoThumb: tıklanınca önizleme açan video küçük resmi
//
// Davranış orijinal page.tsx ile birebir aynıdır.

"use client";

import { useState } from "react";
import { yayinThumbnailIstemciCoz } from "@/lib/ogrenmeAraci/thumbnailIstemci";
import { AracVarsayilanKapak } from "@/components/ogrenme-araci/AracVarsayilanKapak";
import { dikeyMi, enBoyOrani } from "@/lib/video/enBoyOrani";

export interface OgrenmeAraciThumbProps {
  video_url?: string | null;
  thumbnail_url?: string | null;
  onAc?: (url: string) => void;
  onOnizle?: () => void;
  arac_turu?: string | null;
  urun_adi?: string | null;
  arac_id?: string | null;
  genis?: boolean;
}

export const OgrenmeAraciThumb = ({
  video_url,
  thumbnail_url,
  onAc,
  onOnizle,
  arac_turu = "video",
  urun_adi,
  arac_id,
  genis = false,
}: OgrenmeAraciThumbProps) => {
  const [hataliUrl, setHataliUrl] = useState<string | null>(null);
  const [olculenKapak, setOlculenKapak] = useState<{ url: string; genislik: number; yukseklik: number } | null>(null);
  const tur = arac_turu ?? "video";
  const thumb = yayinThumbnailIstemciCoz({ thumbnail_url, video_url, arac_turu: tur });

  const etiket =
    tur === "podcast" ? "Podcast"
    : tur === "gorsel" ? "Dijital Broşür"
    : tur === "flip_pdf" ? "Literatür"
    : "Video";

  const tiklanabilir = Boolean(onOnizle || video_url || arac_id);

  const ariaLabel = tiklanabilir
    ? `${urun_adi ? `${urun_adi} ` : ""}${etiket.toLowerCase()} önizlemesi`
    : "Önizleme bulunmuyor";

  const handleTikla = () => {
    if (onOnizle) {
      onOnizle();
    } else if (video_url && onAc) {
      onAc(video_url);
    }
  };

  const resimGoster = Boolean(thumb && hataliUrl !== thumb);
  const olculenOran = enBoyOrani(
    olculenKapak?.url === thumb ? olculenKapak.genislik : null,
    olculenKapak?.url === thumb ? olculenKapak.yukseklik : null,
  );
  const dikeyVideo = genis && tur === "video" && resimGoster && dikeyMi(olculenOran);

  return (
    <button
      type="button"
      onClick={handleTikla}
      disabled={!tiklanabilir}
      aria-label={ariaLabel}
      className={`group relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--tema-yerel-uretim-cizgi-45)] bg-[var(--tema-yerel-uretim-secim-zemin-14)] p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tema-yerel-uretim-odak-01)] disabled:cursor-default ${dikeyVideo ? "mx-auto h-auto max-w-full" : genis ? "aspect-[1600/693] w-full lg:aspect-[1360/693]" : "h-[72px] w-32"}`}
      style={dikeyVideo ? { width: `min(100%, ${Math.round(280 * olculenOran)}px)`, aspectRatio: olculenOran } : undefined}
    >
      {resimGoster ? (
        <img
          src={thumb!}
          alt=""
          onError={() => setHataliUrl(thumb)}
          onLoad={(event) => {
            if (!genis || tur !== "video" || !thumb) return;
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth > 0 && naturalHeight > 0) {
              setOlculenKapak({ url: thumb, genislik: naturalWidth, yukseklik: naturalHeight });
            }
          }}
          className={`absolute inset-0 h-full w-full ${dikeyVideo ? "object-contain" : "object-cover"}`}
        />
      ) : (
        <AracVarsayilanKapak aracTuru={tur} urunAdi={urun_adi} kucuk={!genis} className="absolute inset-0 h-full w-full" />
      )}
      {tiklanabilir && (
        <div className={`absolute flex items-center justify-center rounded-full transition-transform group-hover:scale-110 ${genis ? "h-11 w-11" : "h-7 w-7"}`} style={{ background: "var(--tema-yerel-uretim-ortu-03)" }}>
          {tur === "podcast" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-uretim-ters-metin-02)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          ) : tur === "gorsel" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-uretim-ters-metin-02)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          ) : tur === "flip_pdf" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-uretim-ters-metin-02)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="var(--tema-yerel-uretim-ters-metin-02)"><path d="M0 0l10 6-10 6z" /></svg>
          )}
        </div>
      )}
    </button>
  );
};

// Geriye dönük uyumluluk için alias
export const VideoThumb = OgrenmeAraciThumb;
