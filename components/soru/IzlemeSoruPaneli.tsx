"use client";

import type { ReactNode } from "react";
import type { IzlemeCevaplari, IzlemeCevapSonucu, IzlemeSorusu } from "@/lib/soru/izlemeTipleri";

interface SoruFormuProps {
  sorular: IzlemeSorusu[];
  cevaplar: IzlemeCevaplari;
  yukleniyor: boolean;
  onCevap: (soruIndex: number, cevap: string) => void;
  onGonder: () => void;
  baslik?: string;
  aciklama?: string;
  gonderMetni?: string;
}

export function IzlemeSoruFormu({
  sorular,
  cevaplar,
  yukleniyor,
  onCevap,
  onGonder,
  baslik = "Soruları Cevapla",
  aciklama = "Her soru için bir seçenek işaretleyin.",
  gonderMetni = "Cevapları Gönder",
}: SoruFormuProps) {
  const tumuCevaplandi = sorular.length > 0
    && sorular.every((soru) => Boolean(cevaplar[soru.soru_index]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-extrabold text-[var(--tema-yerel-uretim-ana-metin-29)]">{baslik}</h3>
        <p className="mt-1 text-[11px] font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-42)]">{aciklama}</p>
      </div>
      {sorular.map((soru, index) => (
        <div key={soru.soru_index} className="rounded-2xl border border-[var(--tema-yerel-uretim-cizgi-51)] bg-[var(--tema-yerel-uretim-sayfa-zemini-04)] p-4">
          <p className="text-sm font-extrabold leading-5 text-[var(--tema-yerel-uretim-ana-metin-27)]">
            {index + 1}. {soru.soru_metni}
          </p>
          <div className="mt-3 grid gap-2">
            {soru.secenekler.map((secenek) => {
              const secili = cevaplar[soru.soru_index] === secenek.harf;
              return (
                <button
                  type="button"
                  key={secenek.harf}
                  onClick={() => onCevap(soru.soru_index, secenek.harf)}
                  aria-pressed={secili}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${secili ? "border-[var(--tema-yerel-uretim-cizgi-52)] bg-[var(--tema-yerel-uretim-secim-zemin-18)] text-[var(--tema-yerel-uretim-eylem-metin-19)] ring-1 ring-[var(--tema-yerel-uretim-odak-03)]" : "border-[var(--tema-yerel-uretim-cizgi-53)] bg-[var(--tema-yerel-uretim-kart-01)] text-[var(--tema-yerel-uretim-yardimci-metin-43)] hover:border-[var(--tema-yerel-uretim-cizgi-54)] hover:bg-[var(--tema-yerel-uretim-sayfa-zemini-15)]"}`}
                >
                  <span className="mr-2 inline-flex size-6 items-center justify-center rounded-lg bg-current/10">{secenek.harf}</span>
                  {secenek.metin}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onGonder}
          disabled={!tumuCevaplandi || yukleniyor}
          className="rounded-xl bg-[var(--tema-yerel-uretim-eylem-zemin-01)] px-5 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-uretim-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-uretim-eylem-zemin-12)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {yukleniyor ? "Gönderiliyor…" : gonderMetni}
        </button>
      </div>
    </div>
  );
}

interface SoruSonuclariProps<T extends IzlemeCevapSonucu> {
  sonuclar: T[];
  sonucMetni: (sonuc: T) => ReactNode;
  altIcerik?: ReactNode;
  baslik?: string;
}

export function IzlemeSoruSonuclari<T extends IzlemeCevapSonucu>({
  sonuclar,
  sonucMetni,
  altIcerik,
  baslik = "Sonuçlar",
}: SoruSonuclariProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-extrabold text-[var(--tema-yerel-uretim-ana-metin-29)]">{baslik}</h3>
      {sonuclar.map((sonuc) => (
        <div
          key={sonuc.soru_index}
          className={`rounded-xl border px-3 py-2.5 text-xs font-extrabold ${sonuc.dogru_mu ? "border-[var(--tema-yerel-uretim-islevsel-cizgi-24)] bg-[var(--tema-yerel-uretim-islevsel-zemin-31)] text-[var(--tema-yerel-uretim-islevsel-metin-41)]" : "border-[var(--tema-yerel-uretim-islevsel-cizgi-25)] bg-[var(--tema-yerel-uretim-islevsel-zemin-32)] text-[var(--tema-yerel-uretim-islevsel-metin-42)]"}`}
        >
          {sonucMetni(sonuc)}
        </div>
      ))}
      {altIcerik}
    </div>
  );
}
