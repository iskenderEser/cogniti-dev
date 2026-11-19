"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";

interface TanitimVideosu {
  id: string;
  odak: string;
  baslik: string;
  altBaslik: string;
  sure: string;
  guid: string;
}

// Dördüncü kural gereği yalnızca ham Bunny Video GUID'si saklanır; oynatma adresi çalışma anında üretilir.
const SUNDUKLARI_VIDEOLAR: readonly TanitimVideosu[] = [
  {
    id: "firmalar",
    odak: "FİRMALAR İÇİN",
    baslik: "Firmalar",
    altBaslik: "E-Tanıtım ve E-Öğrenme Platformu",
    sure: "52 sn",
    guid: "52298a97-b214-4533-b291-058a7fd8e903",
  },
  {
    id: "temsilciler",
    odak: "TEMSİLCİLER İÇİN",
    baslik: "Temsilciler",
    altBaslik: "Temsilcilerin asistanı",
    sure: "50 sn",
    guid: "c7f9c249-8f50-4119-b67d-f6f863450d86",
  },
  {
    id: "eczaneler",
    odak: "ECZANELER İÇİN",
    baslik: "Eczaneler",
    altBaslik: "Kurumsal bilginin adresi",
    sure: "45 sn",
    guid: "eeebd5bc-396b-4564-8c95-f08362eb555d",
  },
  {
    id: "danisanlar",
    odak: "DANIŞANLAR İÇİN",
    baslik: "Danışanlar",
    altBaslik: "Güvenilir bilginin kapısı",
    sure: "41 sn",
    guid: "df1460ad-e0af-4ba4-be39-c3e160ad1a60",
  },
  {
    id: "partnerler",
    odak: "İŞ PARTNERLERİ İÇİN",
    baslik: "İş Partnerleri",
    altBaslik: "Uzmanlık platformu",
    sure: "40 sn",
    guid: "960c3253-7c9e-42bc-926f-156a5ee80ae0",
  },
];

interface Props {
  bunnyLibraryId: string;
  bunnyPullZone?: string;
}

export default function CognitiSunduklari({ bunnyLibraryId, bunnyPullZone }: Props) {
  const [seciliVideo, setSeciliVideo] = useState<TanitimVideosu | null>(null);
  const [hataliKapaklar, setHataliKapaklar] = useState<Record<string, boolean>>({});

  const seciliIndex = seciliVideo
    ? SUNDUKLARI_VIDEOLAR.findIndex((v) => v.id === seciliVideo.id)
    : -1;
  const oncekiVideo =
    seciliIndex > 0 ? SUNDUKLARI_VIDEOLAR[seciliIndex - 1] : null;
  const sonrakiVideo =
    seciliIndex >= 0 && seciliIndex < SUNDUKLARI_VIDEOLAR.length - 1
      ? SUNDUKLARI_VIDEOLAR[seciliIndex + 1]
      : null;

  return (
    <section
      aria-labelledby="cogniti-sunduklari-baslik"
      className="mx-auto w-full max-w-[1160px] px-14 pb-12 max-[800px]:px-8 max-[640px]:px-5"
    >
      <div className="border-t border-[var(--tema-hakkinda-cizgi)] pt-12 max-[800px]:pt-8">
        <p className="m-0 mb-4 text-[11px] font-medium leading-[1.5] tracking-[1.8px] text-[var(--tema-hakkinda-vurgu)]">
          COGNITI TANITIM VE ÖĞRENME ODAKLARI
        </p>
        <div className="mb-7">
          <h2
            id="cogniti-sunduklari-baslik"
            className="m-0 font-[inherit] text-[clamp(26px,3.1vw,38px)] font-light leading-[1.25] tracking-[-1px] text-[var(--tema-hakkinda-baslik)]"
          >
            Cogniti&apos;nin sundukları
          </h2>
        </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {SUNDUKLARI_VIDEOLAR.map((video) => {
          const kapakUrl =
            bunnyPullZone && !hataliKapaklar[video.id]
              ? `https://${bunnyPullZone}/${video.guid}/thumbnail.jpg`
              : null;

          return (
            <div key={video.id} className="flex flex-col">
              <div className="mb-3">
                <div className="whitespace-nowrap text-[11px] font-medium leading-[1.5] tracking-[1.8px] text-[var(--tema-hakkinda-vurgu)] max-[640px]:text-[10px] max-[640px]:tracking-[1px]">
                  {video.odak}
                </div>
                <div
                  aria-hidden="true"
                  className="mt-1.5 h-[2px] w-7 rounded-full bg-[var(--tema-hakkinda-vurgu)]/75"
                />
              </div>

              <button
                type="button"
                onClick={() => setSeciliVideo(video)}
                className="group relative flex aspect-[9/16] w-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--tema-cizgi)] bg-gradient-to-br from-[#185fa5] via-[#237ac8] to-[#0f172a] p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--tema-kontrol-odak)]"
                aria-label={`${video.baslik} tanıtım videosunu izle`}
              >
                {kapakUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={kapakUrl}
                    alt={`${video.baslik} tanıtım videosu`}
                    loading="lazy"
                    onError={() =>
                      setHataliKapaklar((onceki) => ({ ...onceki, [video.id]: true }))
                    }
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/35"
                />

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
                    {video.sure}
                  </span>
                </div>

                <div className="relative z-10 flex flex-1 items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white shadow-md backdrop-blur-md transition-transform duration-200 group-hover:scale-110 group-hover:bg-white group-hover:text-[#185fa5]">
                    <Play size={20} className="ml-0.5 fill-current" aria-hidden="true" />
                  </span>
                </div>

                <div className="relative z-10">
                  <div className="line-clamp-2 text-[12px] font-medium leading-snug text-white/95">
                    {video.altBaslik}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      </div>

      <Dialog.Root
        open={seciliVideo !== null}
        onOpenChange={(acik) => {
          if (!acik) setSeciliVideo(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 flex w-[min(90vw,380px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl focus:outline-none"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
              <Dialog.Title className="m-0 text-[14px] font-semibold">
                {seciliVideo ? `${seciliVideo.baslik} — Cogniti` : ""}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Videoyu kapat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X size={18} aria-hidden="true" />
              </Dialog.Close>
            </div>

            {seciliVideo && (
              <>
                <div className="relative aspect-[9/16] max-h-[76dvh] w-full bg-black">
                  <iframe
                    key={seciliVideo.guid}
                    src={`https://player.mediadelivery.net/embed/${encodeURIComponent(bunnyLibraryId)}/${seciliVideo.guid}?autoplay=true`}
                    title={`${seciliVideo.baslik} tanıtım videosu`}
                    loading="eager"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2.5 text-[12px] text-white/85">
                  <button
                    type="button"
                    disabled={!oncekiVideo}
                    onClick={() => oncekiVideo && setSeciliVideo(oncekiVideo)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft size={15} aria-hidden="true" />
                    <span>{oncekiVideo ? oncekiVideo.baslik : "Önceki"}</span>
                  </button>

                  <span className="text-[11px] font-medium text-white/50">
                    {seciliIndex + 1} / {SUNDUKLARI_VIDEOLAR.length}
                  </span>

                  <button
                    type="button"
                    disabled={!sonrakiVideo}
                    onClick={() => sonrakiVideo && setSeciliVideo(sonrakiVideo)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    <span>{sonrakiVideo ? sonrakiVideo.baslik : "Sonraki"}</span>
                    <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
