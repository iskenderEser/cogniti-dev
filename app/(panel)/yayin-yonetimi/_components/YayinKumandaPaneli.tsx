"use client";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

import { SadeKontrolButonu, SadeKontrolGrubu, SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";

import type { YayinHedefGrubu } from "@/lib/utils/roller";
import type { ReactNode } from "react";
import type { AltSekme, BekleyenHedefSayilari } from "../_types";
import { ANA_SEKME_ETIKETLERI } from "../_types";

import SayfaRehberi from "@/components/rehber/SayfaRehberi";

const KAPSUL_SECENEKLERI: { deger: AltSekme; etiket: string }[] = [
  { deger: "bekleyen", etiket: "Yayına Hazır" },
  { deger: "yayinda", etiket: "Yayında" },
  { deger: "durdurulan", etiket: "Durdurulan" },
];

export function YayinDurumuToggle({ aktifDurum, onDurumDegistir }: {
  aktifDurum: AltSekme;
  onDurumDegistir: (durum: AltSekme) => void;
}) {

  return (
    <SadeKapsulFiltre
      secenekler={KAPSUL_SECENEKLERI}
      deger={aktifDurum}
      onDegistir={onDurumDegistir}
      etiket="Yayın durumu seçimi"
      className="shrink-0"
    />
  );
}

interface Props {
  anaSekmeler: YayinHedefGrubu[];
  aktifHedef: YayinHedefGrubu;
  bekleyen: number;
  bekleyenHedefSayilari: BekleyenHedefSayilari;
  canli: number;
  planli: number;
  durdurulan: number;
  yukleniyor?: boolean;
  onHedefDegistir: (hedef: YayinHedefGrubu) => void;
  aksiyon?: ReactNode;
}

export function YayinKumandaPaneli({
  anaSekmeler,
  aktifHedef,
  bekleyen,
  bekleyenHedefSayilari,
  canli,
  planli,
  durdurulan,
  yukleniyor = false,
  onHedefDegistir,
  aksiyon,
}: Props) {
  const durumlar: {
    anahtar: AltSekme;
    etiket: string;
    deger: number;
    aciklama: string;
    renk: string;
  }[] = [
    {
      anahtar: "bekleyen",
      etiket: "Yayınlanmayı Bekleyen",
      deger: bekleyen,
      aciklama: "Detay bekleyen yayınlar",
      renk: "var(--tema-yerel-uretim-islevsel-metin-36)",
    },
    {
      anahtar: "yayinda",
      etiket: "Yayında",
      deger: canli + planli,
      aciklama: "Toplam açılan yayınlar",
      renk: "var(--tema-yerel-uretim-islevsel-metin-37)",
    },
    {
      anahtar: "durdurulan",
      etiket: "Durdurulan",
      deger: durdurulan,
      aciklama: "Yeniden başlatılabilen yayınlar",
      renk: "var(--tema-yerel-uretim-islevsel-metin-38)",
    },
  ];

  return (
    <section aria-labelledby="yayin-merkezi-baslik" className="flex flex-col gap-4">
      <SayfaYenileBasligi
        baslik={<div className="inline-flex items-center">
          <h1 id="yayin-merkezi-baslik" className="text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-uretim-ana-metin-17)] md:text-[28px]">
            Yayın Yönetimi
          </h1>
          <SayfaRehberi anahtar="yayin-yonetimi" className="ml-1.5 -translate-y-1.5" />
        </div>}
        aksiyon={aksiyon}
      />

      <div aria-label="Yayın durumu" aria-busy={yukleniyor} className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {durumlar.map((durum) => (
          <article
            key={durum.anahtar}
            className="min-w-0 rounded-xl border border-[var(--tema-yerel-uretim-cizgi-12)] bg-[var(--tema-yerel-uretim-kart-01)] p-3 text-left shadow-[0_6px_18px_var(--tema-yerel-uretim-golge-07)] md:p-5"
            style={{ borderLeft: `3px solid ${durum.renk}` }}
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--tema-yerel-uretim-yardimci-metin-20)]">{durum.etiket}</p>
            <div className="text-2xl font-extrabold leading-none text-[var(--tema-yerel-uretim-ana-metin-18)] md:text-3xl">
              {yukleniyor ? (
                <>
                  <span aria-hidden="true" className="inline-block h-8 w-12 animate-pulse rounded bg-current/10" />
                  <span className="sr-only">Yükleniyor...</span>
                </>
              ) : (
                durum.deger.toLocaleString("tr-TR")
              )}
            </div>
            <p className="mt-1.5 text-xs text-[var(--tema-yerel-uretim-yardimci-metin-20)]">{durum.aciklama}</p>
          </article>
        ))}
      </div>

      <SadeKontrolGrubu tur="sekme" aria-label="Yayın kitlesi">
        {anaSekmeler.map((hedef) => {

          const aktif = hedef === aktifHedef;
          const bekleyenSayi = bekleyenHedefSayilari[hedef];
          return (
            <SadeKontrolButonu type="button" key={hedef} aria-pressed={aktif} onClick={() => onHedefDegistir(hedef)}>
              <span className="flex items-center justify-between gap-2">
                <span>{ANA_SEKME_ETIKETLERI[hedef]}</span>
                {bekleyenSayi > 0 && (
                  <span
                    aria-label={`${bekleyenSayi} yayına hazır içerik`}
                    className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--tema-yerel-uretim-vurgu-zemin-01)] px-[5px] text-[10px] font-bold leading-none text-[var(--tema-yerel-uretim-ters-metin-01)]"
                  >
                    {bekleyenSayi}
                  </span>
                )}
              </span>
            </SadeKontrolButonu>
          );
        })}
      </SadeKontrolGrubu>
    </section>
  );
}
