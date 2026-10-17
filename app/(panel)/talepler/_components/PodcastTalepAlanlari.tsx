"use client";

import { useRef, useState } from "react";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import {
  type BekleyenDosya,
  PODCAST_FORMATLAR,
  PODCAST_KAPAK_FORMATLARI,
} from "../_types";

import { PodcastTranskriptEditoru } from "./PodcastTranskriptEditoru";

interface DosyaAlaniProps {
  etiket: string;
  accept: string;
  bekleyen: BekleyenDosya | null;
  onSec: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSil: () => void;
  zorunlu?: boolean;
  sunucudaYuklu?: boolean;
  yuklenenDosyaAdi?: string | null;
}

function DosyaAlani({
  etiket,
  accept,
  bekleyen,
  onSec,
  onSil,
  zorunlu = true,
  sunucudaYuklu = false,
  yuklenenDosyaAdi = null,
}: DosyaAlaniProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const yukluGoster = sunucudaYuklu && !bekleyen;

  return (
    <div>
      <label className="mb-1 flex h-5 items-center text-xs font-bold text-[var(--tema-yerel-uretim-ana-metin-07)]">
        {etiket} {zorunlu && !yukluGoster && <span className="ml-1 text-[var(--tema-yerel-uretim-islevsel-metin-09)]">*</span>}
      </label>
      <div>
        <label className="cursor-pointer rounded-lg border border-[var(--tema-yerel-uretim-cizgi-04)] bg-[var(--tema-yerel-uretim-kart-01)] px-3 py-1.5 text-xs font-semibold text-[var(--tema-yerel-uretim-eylem-metin-06)] hover:bg-[var(--tema-yerel-uretim-secim-zemin-07)] w-full flex items-center justify-center text-center">
          {yukluGoster ? "Dosyayı Değiştir" : "Dosya Seç"}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => {
              onSec(event);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
        </label>
        {bekleyen && (
          <span className="mt-1.5 inline-flex w-full items-center justify-between gap-2 rounded-full border border-[var(--tema-yerel-uretim-islevsel-cizgi-11)] bg-[var(--tema-yerel-uretim-islevsel-zemin-11)] px-2.5 py-1 text-xs text-[var(--tema-yerel-uretim-islevsel-metin-10)]">
            <span className="truncate">{bekleyen.preview.dosya_adi}</span>
            <button type="button" onClick={onSil} aria-label={`${etiket} dosyasını kaldır`} className="cursor-pointer text-[var(--tema-yerel-uretim-islevsel-metin-11)] hover:text-[var(--tema-yerel-uretim-islevsel-metin-12)] font-bold">×</button>
          </span>
        )}
        {yukluGoster && (
          <span className="mt-1.5 inline-flex w-full items-center justify-between gap-2 rounded-full border border-[var(--tema-yerel-uretim-islevsel-cizgi-12)] bg-[var(--tema-yerel-uretim-islevsel-zemin-12)] px-2.5 py-1 text-xs text-[var(--tema-yerel-uretim-islevsel-metin-13)]">
            <span className="truncate"><span className="font-semibold text-[var(--tema-yerel-uretim-islevsel-metin-14)]">Sunucuda Yüklü: </span>{yuklenenDosyaAdi || (etiket === "Podcast" ? "podcast.mp3" : "kapak.jpg")}</span>
            <button type="button" onClick={onSil} aria-label={`${etiket} dosyasını kaldır`} className="cursor-pointer text-[var(--tema-yerel-uretim-islevsel-metin-14)] hover:text-[var(--tema-yerel-uretim-islevsel-metin-13)] font-bold">×</button>
          </span>
        )}
      </div>
    </div>
  );
}

interface PodcastTalepAlanlariProps {
  hazir: boolean;
  ses: BekleyenDosya | null;
  kapak: BekleyenDosya | null;
  transkript: BekleyenDosya | null;
  sesYuklendi?: boolean;
  sesDosyaAdi?: string | null;
  kapakYuklendi?: boolean;
  kapakDosyaAdi?: string | null;
  transkriptMetni?: string;
  transkriptOnaylandi?: boolean;
  aiIstendi?: boolean;
  aracId?: string;
  islemDurumu?: "bosta" | "taslak_hazirlaniyor" | "podcast_yukleniyor" | "podcast_dogrulaniyor" | "ai_kuyrukta" | "ai_isleniyor" | "transkript_hazir" | "hata";
  yuklemeYuzdesi?: number;
  onAiBaslat?: () => void | Promise<void>;
  aiYukleniyor?: boolean;
  aiHatasi?: string | null;
  onSesSec: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKapakSec: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTranskriptSec: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSesSil: () => void;
  onKapakSil: () => void;
  onTranskriptSil: () => void;
  onTranskriptMetinDegisti?: (metin: string) => void;
  onTranskriptOnayla?: () => void;
  onTranskriptIptal?: () => void;
  onSunucuOnayla?: (metin: string) => Promise<{ ok: boolean; hata?: string }>;
  onSunucuIptal?: () => Promise<{ ok: boolean; hata?: string }>;
  onAiIstendiDegisti?: (istendi: boolean) => void;
  onTranskriptDosyaSecildi?: (dosya: File, cikarilanMetin?: string) => void;
  iuTranskriptIstendi?: boolean | null;
  onIuTranskriptIstendiDegisti?: (istendi: boolean) => void;
}

export function PodcastTalepAlanlari(props: PodcastTalepAlanlariProps) {
  const [transkriptAcik, setTranskriptAcik] = useState<boolean>(
    Boolean(
      props.transkript ||
      props.transkriptMetni ||
      props.aiIstendi ||
      (props.islemDurumu && props.islemDurumu !== "bosta")
    )
  );
  const [transkriptSekme, setTranskriptSekme] = useState<"ai" | "dosya" | "metin">(
    props.aiIstendi || (props.islemDurumu && props.islemDurumu !== "bosta") ? "ai" : "dosya"
  );

  return (
    <section className="rounded-2xl border border-[var(--tema-yerel-uretim-cizgi-08)] bg-[var(--tema-yerel-uretim-kart-01)] p-4">
      <h3 className="text-sm font-extrabold text-[var(--tema-yerel-uretim-ana-metin-04)]">Podcast Yapısı</h3>
      {!props.hazir && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-[var(--tema-yerel-uretim-yardimci-metin-05)]">
            İçerik üreticisi podcast ses kaydını hazırlayacaktır.
          </p>

          <div className="rounded-xl border border-[var(--tema-yerel-uretim-cizgi-08)] bg-[var(--tema-yerel-uretim-sayfa-zemini-04)] p-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[var(--tema-yerel-uretim-ana-metin-04)]">
                Transkript Tercihi <span className="text-[var(--tema-yerel-uretim-islevsel-metin-15)]">*</span>
              </label>
            </div>

            <div className="mt-3">
              <SadeKapsulFiltre<"istiyorum" | "istemiyorum" | "">
                etiket="Transkript Tercihi"
                secenekler={[
                  { deger: "istiyorum", etiket: "Transkript istiyorum" },
                  { deger: "istemiyorum", etiket: "Transkript istemiyorum" },
                ]}
                deger={props.iuTranskriptIstendi === true ? "istiyorum" : props.iuTranskriptIstendi === false ? "istemiyorum" : ""}
                onDegistir={(deger) => props.onIuTranskriptIstendiDegisti?.(deger === "istiyorum")}
                className="w-fit max-w-full"
              />
            </div>

            {props.iuTranskriptIstendi === true && (
              <div className="mt-3 rounded-lg border border-[var(--tema-yerel-uretim-cizgi-14)] bg-[var(--tema-yerel-uretim-secim-zemin-07)] p-2.5 text-xs text-[var(--tema-yerel-uretim-ana-metin-08)]">
                <strong>Bilgi:</strong> Transkript talep edildiğinde, İçerik Üreticisi tarafından podcast sesinden AI ile oluşturulacaktır.
              </div>
            )}

            {props.iuTranskriptIstendi === false && (
              <div className="mt-3 rounded-lg border border-[var(--tema-yerel-uretim-cizgi-15)] bg-[var(--tema-yerel-uretim-sayfa-zemini-05)] p-2.5 text-xs text-[var(--tema-yerel-uretim-ana-metin-09)]">
                <strong>Bilgi:</strong> Transkript talep edilmedi; podcast yalnızca ses kaydı olarak yayınlanacaktır.
              </div>
            )}

          </div>
        </div>
      )}
      {props.hazir && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
            {/* 1. Podcast */}
            <DosyaAlani
              etiket="Podcast"
              accept={PODCAST_FORMATLAR}
              bekleyen={props.ses}
              sunucudaYuklu={props.sesYuklendi}
              yuklenenDosyaAdi={props.sesDosyaAdi}
              onSec={props.onSesSec}
              onSil={props.onSesSil}
            />

            {/* 2. Yayın Görseli */}
            <DosyaAlani
              etiket="Yayın Görseli"
              accept={PODCAST_KAPAK_FORMATLARI}
              bekleyen={props.kapak}
              sunucudaYuklu={props.kapakYuklendi}
              yuklenenDosyaAdi={props.kapakDosyaAdi}
              onSec={props.onKapakSec}
              onSil={props.onKapakSil}
              zorunlu={false}
            />

            {/* 3. Manuel Transkript */}
            <div>
              <label className="mb-1 flex h-5 items-center text-xs font-bold text-[var(--tema-yerel-uretim-ana-metin-07)] truncate">
                Manuel Transkript <span className="ml-1 text-[11px] font-normal text-[var(--tema-yerel-uretim-yardimci-metin-02)]">(İsteğe bağlı)</span>
              </label>
              <div>
                {props.transkript ? (
                  <span className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-[var(--tema-yerel-uretim-islevsel-cizgi-11)] bg-[var(--tema-yerel-uretim-islevsel-zemin-11)] px-2.5 py-1 text-xs text-[var(--tema-yerel-uretim-islevsel-metin-10)]">
                    <span className="truncate">{props.transkript.preview.dosya_adi}</span>
                    <button
                      type="button"
                      onClick={props.onTranskriptSil}
                      aria-label="Transkript dosyasını kaldır"
                      className="cursor-pointer text-[var(--tema-yerel-uretim-islevsel-metin-11)] hover:text-[var(--tema-yerel-uretim-islevsel-metin-12)] font-bold"
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTranskriptSekme("dosya");
                      props.onAiIstendiDegisti?.(false);
                      setTranskriptAcik(true);
                    }}
                    className="cursor-pointer rounded-lg border border-[var(--tema-yerel-uretim-cizgi-04)] bg-[var(--tema-yerel-uretim-kart-01)] px-3 py-1.5 text-xs font-semibold text-[var(--tema-yerel-uretim-eylem-metin-06)] hover:bg-[var(--tema-yerel-uretim-secim-zemin-07)] w-full flex items-center justify-center text-center"
                  >
                    + Manuel Transkript Ekle
                  </button>
                )}
              </div>
            </div>

            {/* 4. AI ile Transkript */}
            <div>
              <label className="mb-1 flex h-5 items-center text-xs font-bold text-[var(--tema-yerel-uretim-ana-metin-07)] truncate">
                AI ile Transkript <span className="ml-1 text-[11px] font-normal text-[var(--tema-yerel-uretim-yardimci-metin-02)]">(Gemini 3.5)</span>
              </label>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setTranskriptSekme("ai");
                    props.onAiIstendiDegisti?.(true);
                    setTranskriptAcik(true);
                    if (props.onAiBaslat) {
                      void props.onAiBaslat();
                    }
                  }}
                  className="cursor-pointer rounded-lg border border-[var(--tema-yerel-uretim-cizgi-16)] bg-[var(--tema-yerel-uretim-eylem-zemin-02)] px-3 py-1.5 text-xs font-semibold text-[var(--tema-yerel-uretim-ters-metin-01)] hover:bg-[var(--tema-yerel-uretim-eylem-zemin-03)] w-full flex items-center justify-center text-center"
                >
                  ✨ AI ile Transkript Oluştur
                </button>
              </div>
            </div>
          </div>

          <PodcastTranskriptEditoru
            bekleyenDosya={props.transkript}
            metin={props.transkriptMetni ?? ""}
            onaylandi={props.transkriptOnaylandi ?? false}
            aiIstendi={props.aiIstendi}
            aracId={props.aracId}
            islemDurumu={props.islemDurumu}
            yuklemeYuzdesi={props.yuklemeYuzdesi}
            onAiBaslat={props.onAiBaslat}
            aiYukleniyor={props.aiYukleniyor}
            hataMesaji={props.aiHatasi}
            onAiIstendiDegisti={props.onAiIstendiDegisti}
            onSunucuOnayla={props.onSunucuOnayla}
            onSunucuIptal={props.onSunucuIptal}
            acik={transkriptAcik}
            onAcikDegisti={setTranskriptAcik}
            sekme={transkriptSekme}
            onSekmeDegisti={setTranskriptSekme}
            onDosyaSec={(dosya, cikarilanMetin) => {
              if (props.onTranskriptDosyaSecildi) {
                props.onTranskriptDosyaSecildi(dosya, cikarilanMetin);
              } else {
                const fakeEvent = {
                  target: { files: [dosya] },
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                props.onTranskriptSec(fakeEvent);
              }
            }}
            onMetinDegisti={(yeniMetin) => {
              props.onTranskriptMetinDegisti?.(yeniMetin);
            }}
            onOnayla={() => {
              props.onTranskriptOnayla?.();
            }}
            onIptalEt={() => {
              props.onTranskriptSil();
              props.onTranskriptIptal?.();
              setTranskriptAcik(false);
            }}
          />
        </div>
      )}
    </section>
  );
}
