"use client";

import { SadeKontrolGrubu, SadeKontrolButonu } from "@/components/kontrol/SadeKontroller";

import { useMemo, useState } from "react";
import { Clock3, Eye, EyeOff } from "lucide-react";
import { eclubKisiHedefRolu } from "@/lib/utils/roller";
import { YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import {
  gonderimDurumGruplari,
  type GonderimDurumu,
} from "@/lib/eclub/gonderimDurumlari";
import type { OneriGecmisKaydi } from "../../oneriler/_types";

interface Props {
  yayinId: string;
  urunAdi: string;
  aracTuru: OgrenmeAraciTuru;
  kayitlar: readonly OneriGecmisKaydi[];
  simdi: number;
  acik: boolean;
  onAc: () => void;
  onKapat: () => void;
}

const DURUMLAR: { anahtar: GonderimDurumu; etiket: string; ikon: typeof Eye; renk: string }[] = [
  { anahtar: "izleyen", etiket: "İzleyenler", ikon: Eye, renk: "text-[var(--tema-gonderim-detay-izleyen)]" },
  { anahtar: "bekleyen", etiket: "Bekleyenler", ikon: Clock3, renk: "text-[var(--tema-gonderim-detay-bekleyen)]" },
  { anahtar: "izlemeyen", etiket: "İzlemeyenler", ikon: EyeOff, renk: "text-[var(--tema-gonderim-detay-izlemeyen)]" },
];

const tarihYaz = (deger: string) => {
  const tarih = new Date(deger);
  return Number.isNaN(tarih.getTime())
    ? "—"
    : new Intl.DateTimeFormat("tr-TR", { dateStyle: "short" }).format(tarih);
};

const kisiUnvani = (rol: OneriGecmisKaydi["kisi_rol"]) => {
  if (!rol) return "";
  return eclubKisiHedefRolu(rol) === "eczane_teknisyeni" ? "Ecz.Tekn." : "Ecz.";
};

export function EclubGonderimDetayKarti({ yayinId, urunAdi, aracTuru, kayitlar, simdi, acik, onAc, onKapat }: Props) {
  const gruplar = useMemo(() => gonderimDurumGruplari(kayitlar, simdi), [kayitlar, simdi]);
  const varsayilanDurum: GonderimDurumu = gruplar.bekleyen.length > 0
    ? "bekleyen"
    : gruplar.izleyen.length > 0
      ? "izleyen"
      : "izlemeyen";
  const [aktifDurum, setAktifDurum] = useState<GonderimDurumu>(varsayilanDurum);
  const gorunenDurum = aktifDurum;
  const aktifKayitlar = gruplar[gorunenDurum];
  const gorunenDurumEtiketi = DURUMLAR.find(({ anahtar }) => anahtar === gorunenDurum)?.etiket ?? "Gönderimler";
  const bosDurumMesaji = gorunenDurum === "bekleyen"
    ? "Bu ürün için yayını tamamlaması beklenen üye bulunmamaktadır."
    : gorunenDurum === "izlemeyen"
      ? "Bu üründe yayını tamamlamayan üye bulunmamaktadır."
      : "Bu durumda kişi bulunmuyor.";
  const bitisTarihiRengi = gorunenDurum === "izlemeyen"
    ? "text-[var(--tema-gonderim-detay-sure-doldu)]"
    : gorunenDurum === "bekleyen"
      ? "text-[var(--tema-gonderim-detay-sure-bekleyen)]"
      : "text-[var(--tema-gonderim-detay-bitis-metni)]";
  const panelId = `eclub-gonderim-detayi-${yayinId}`;

  return (
    <>
      <div
        id={panelId}
        role="region"
        aria-label={`${urunAdi} gönderim detayları`}
        aria-hidden={!acik}
        className={`absolute inset-x-0 bottom-4 top-0 overflow-hidden rounded-xl border border-[var(--tema-gonderim-detay-panel-cizgi)] bg-[var(--tema-gonderim-detay-zemin)] shadow-[0_12px_28px_var(--tema-gonderim-detay-golge)] transition-[transform,opacity] duration-300 motion-reduce:transition-none ${acik ? "z-30 translate-x-0 translate-y-0 opacity-100" : "pointer-events-none z-0 translate-x-1.5 translate-y-1.5 opacity-100"}`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--tema-gonderim-detay-baslik-cizgi)] bg-[var(--tema-gonderim-detay-zemin)] px-3 py-1.5 text-[10px] text-[var(--tema-gonderim-detay-baslik-yardimci)]">
            <div className="flex min-w-0 items-center" title={`${urunAdi} • ${YAYIN_TURU_SUNUMU[aracTuru].etiket}`}>
              <strong className="min-w-0 truncate text-[var(--tema-gonderim-detay-baslik)]">{urunAdi}</strong>
              <span className="mx-1 shrink-0 text-[8px] text-[var(--tema-gonderim-detay-bos-metin)]" aria-hidden="true">•</span>
              <span className="shrink-0 text-[9px] font-normal text-[var(--tema-gonderim-detay-tarih-metni)]">{YAYIN_TURU_SUNUMU[aracTuru].etiket}</span>
            </div>
            <span className="shrink-0 font-extrabold">{gorunenDurumEtiketi} · {aktifKayitlar.length} kişi</span>
          </div>

          <SadeKontrolGrubu aria-label="Gönderim durumu grupları" tur="kapsul">
            {DURUMLAR.map(({ anahtar, etiket, ikon: Ikon }) => {
              const secili = gorunenDurum === anahtar;
              return (
                <SadeKontrolButonu key={anahtar} type="button" aria-pressed={secili} aria-label={`${etiket}: ${gruplar[anahtar].length} kişi`} title={`${etiket}: ${gruplar[anahtar].length} kişi`} onClick={(event) => { event.stopPropagation(); setAktifDurum(anahtar); }}>
                  <span className="inline-flex items-center gap-1">
                    <Ikon className="size-2.5" aria-hidden="true" /> {gruplar[anahtar].length}
                  </span>
                </SadeKontrolButonu>
              );
            })}
          </SadeKontrolGrubu>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {aktifKayitlar.length === 0 ? (
              <div className="grid h-full min-h-24 place-items-center px-3 text-center text-xs font-normal italic text-[var(--tema-gonderim-detay-bos-metin)]">
                {bosDurumMesaji}
              </div>
            ) : aktifKayitlar.map((kayit) => (
              <div key={kayit.oneri_id} className="mb-1.5 rounded-lg border border-[var(--tema-gonderim-detay-satir-cizgi)] bg-[var(--tema-gonderim-detay-yuzey)] px-2.5 py-2 last:mb-0">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <span className="block truncate text-[10px] font-light text-[var(--tema-gonderim-detay-kisi-metni)]">{kisiUnvani(kayit.kisi_rol)} {kayit.kisi_ad} {kayit.kisi_soyad}</span>
                    <span className="block truncate text-[9px] font-semibold text-[var(--tema-gonderim-detay-eczane-metni)]">{kayit.eczane_adi || "Eczane bilgisi yok"}</span>
                  </div>
                  <div className="shrink-0 text-right font-mono text-[8px] tabular-nums leading-4">
                    <time dateTime={kayit.oneri_baslangic} aria-label={`Başlangıç tarihi: ${tarihYaz(kayit.oneri_baslangic)}`} className="block text-[var(--tema-gonderim-detay-tarih-metni)]">{tarihYaz(kayit.oneri_baslangic)}</time>
                    <time dateTime={kayit.oneri_bitis} aria-label={`Bitiş tarihi: ${tarihYaz(kayit.oneri_bitis)}`} className={`block font-bold ${bitisTarihiRengi}`}>{tarihYaz(kayit.oneri_bitis)}</time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (acik) onKapat();
          else onAc();
        }}
        aria-expanded={acik}
        aria-controls={panelId}
        aria-label={acik ? `${urunAdi} yayın kartına dön` : `${urunAdi} gönderim detaylarını göster`}
        title={acik ? "Yayın kartına dön" : "Gönderim detaylarını göster"}
        className={`absolute bottom-0 left-2 right-[-6px] z-[5] flex h-7 translate-y-1/4 items-end justify-center rounded-b-xl border border-t-0 px-3 pb-1 text-[9px] font-extrabold shadow-sm transition-[background-color,color] duration-200 motion-reduce:transition-none ${acik ? "border-[var(--tema-gonderim-detay-acik-sekme-cizgi)] bg-[var(--tema-gonderim-detay-yuzey)] text-[var(--tema-gonderim-detay-baslik-yardimci)] hover:bg-[var(--tema-gonderim-detay-acik-hover)]" : "border-[var(--tema-gonderim-detay-kapali-sekme-cizgi)] bg-[var(--tema-gonderim-detay-kapali-sekme-zemin)] text-[var(--tema-gonderim-detay-kapali-sekme-metin)] hover:bg-[var(--tema-gonderim-detay-kapali-hover)]"}`}
      >
        {acik ? "Yayın kartına dön" : "Gönderim detayları"}
      </button>
    </>
  );
}
