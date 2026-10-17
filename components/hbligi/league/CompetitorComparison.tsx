// Seçili dönem ve kapsamdaki HB Ligi sıralaması ile açılır puan ayrıntısı.

"use client";

import { SadeListeSecimi } from "@/components/kontrol/SadeKontroller";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, LockKeyhole } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import styles from "./league.module.css";
import type { SiraliSatir } from "./types";

export interface OrganizasyonTabloFiltresi {
  takimlar: Array<{ id: string; ad: string }>;
  bolgeler: Array<{ id: string; ad: string }>;
  takimId: string;
  bolgeId: string;
  onTakimDegistir: (id: string) => void;
  onBolgeDegistir: (id: string) => void;
}

function SiraRozeti({ sira }: { sira: number }) {
  return <span className="text-sm font-semibold tabular-nums text-[var(--tema-yerel-lig-ana-metin-13)]">{sira}</span>;
}

function PuanKalemi({ etiket, deger, kayip = false }: { etiket: string; deger: number; kayip?: boolean }) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-2 border-b border-[var(--tema-yerel-lig-cizgi-14)] py-1">
      <span className="min-w-0 text-[10px] leading-4 font-semibold whitespace-normal text-[var(--tema-yerel-lig-ana-metin-13)] [overflow-wrap:anywhere] sm:text-[11px]">{etiket}</span>
      <strong className={`shrink-0 text-[11px] tabular-nums sm:text-xs ${kayip ? "text-[var(--tema-yerel-lig-islevsel-metin-21)]" : "text-[var(--tema-yerel-lig-islevsel-metin-01)]"}`}>
        {deger > 0 ? (kayip ? "−" : "+") : ""}{deger.toLocaleString("tr-TR")}
      </strong>
    </div>
  );
}

function PuanAyrintisi({ satir, eclubAcik }: { satir: SiraliSatir; eclubAcik: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start gap-x-5 whitespace-normal sm:gap-x-8">
      <div className="min-w-0">
        <PuanKalemi etiket="Yayın Tamamlama" deger={satir.izleme_puani} />
        <PuanKalemi etiket="Cevaplama" deger={satir.cevaplama_puani} />
        <PuanKalemi etiket="Öneri" deger={satir.oneri_puani} />
        <PuanKalemi etiket="Extra" deger={satir.extra_puani} />
        {eclubAcik && <PuanKalemi etiket="E-Club" deger={satir.eclub_puani ?? 0} />}
      </div>
      <div className="min-w-0">
        <PuanKalemi etiket="İleri sarma" deger={satir.ileri_sarma_kaybi} kayip />
        <PuanKalemi etiket="Yanlış cevap" deger={satir.yanlis_cevap_kaybi} kayip />
        <PuanKalemi etiket="Öneri kaybı" deger={satir.oneri_kaybi} kayip />
      </div>
    </div>
  );
}

function puanToplamlari(satir: SiraliSatir) {
  const toplamKazanc = satir.toplam_kazanc ?? (satir.izleme_puani + satir.cevaplama_puani
    + satir.oneri_puani + satir.extra_puani + (satir.eclub_puani ?? 0));
  const toplamKayip = satir.toplam_kayip
    ?? (satir.ileri_sarma_kaybi + satir.yanlis_cevap_kaybi + satir.oneri_kaybi);
  return { toplamKazanc, toplamKayip };
}

function KapsulLigListesi({ satirlar, benimId, ayrintiGoster, ayrintiIcerigi, eclubAcik }: {
  satirlar: SiraliSatir[]; benimId: string; ayrintiGoster: boolean; eclubAcik: boolean;
  ayrintiIcerigi?: (satir: SiraliSatir) => ReactNode;
}) {
  const [acikId, setAcikId] = useState<string | null>(null);
  return (
    <div className={`${styles.capsuleList} space-y-2`}>
      {satirlar.map((satir) => {
        const benim = satir.benim || satir.kullanici_id === benimId;
        const detay = ayrintiGoster && satir.detay_gorulebilir !== false;
        const acik = detay && acikId === satir.kullanici_id;
        const { toplamKazanc, toplamKayip } = puanToplamlari(satir);
        const ayrintiId = `lig-kapsul-ayrinti-${satir.kullanici_id}`;
        return (
          <article key={satir.kullanici_id} className={`overflow-hidden rounded-2xl border ${benim ? "border-[var(--tema-yerel-lig-cizgi-15)] bg-[var(--tema-yerel-lig-secim-zemin-08)]" : "border-[var(--tema-yerel-lig-cizgi-16)] bg-[var(--tema-yerel-lig-sayfa-zemini-09)]"}`}>
            <button
              type="button"
              disabled={!detay}
              onClick={() => setAcikId(acik ? null : satir.kullanici_id)}
              aria-expanded={detay ? acik : undefined}
              aria-controls={detay ? ayrintiId : undefined}
              aria-label={ayrintiGoster ? `${satir.ad} puan ayrıntısını ${detay ? (acik ? "kapat" : "aç") : "görüntüleyemezsiniz"}` : `${satir.ad} toplam puanları`}
              className={`${styles.capsuleColumns} w-full items-center p-3 text-left outline-none enabled:cursor-pointer enabled:hover:bg-[var(--tema-yerel-lig-secim-zemin-04)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--tema-yerel-lig-odak-01)]`}
            >
              <span className={styles.capsuleRank}><SiraRozeti sira={satir.rank} /></span>
              <span className={`${styles.capsuleName} flex min-h-14 min-w-0 flex-col justify-center rounded-xl border border-[var(--tema-yerel-lig-cizgi-16)] bg-[var(--tema-yerel-lig-kart-01)] px-3 py-2`}>
                <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-[var(--tema-yerel-lig-ana-metin-14)]">
                  <span className="truncate">{satir.ad}</span>
                  {benim && <span className="shrink-0 rounded-md bg-[var(--tema-yerel-lig-secim-zemin-04)] px-1.5 py-0.5 text-[9px] text-[var(--tema-yerel-lig-eylem-metin-02)]">Sen</span>}
                </span>
                <span className="truncate text-[10px] text-[var(--tema-yerel-lig-yardimci-metin-21)]">{satir.bolge}</span>
              </span>
              <span className={`${styles.capsuleGain} flex min-h-14 flex-col justify-center rounded-xl border border-[var(--tema-yerel-lig-islevsel-cizgi-01)] bg-[var(--tema-yerel-lig-kart-01)] px-3 py-2`}>
                <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-21)]">Kazanılan</span>
                <strong className="text-sm tabular-nums text-[var(--tema-yerel-lig-islevsel-metin-01)]">+{toplamKazanc.toLocaleString("tr-TR")}</strong>
              </span>
              <span className={`${styles.capsuleLoss} flex min-h-14 flex-col justify-center rounded-xl border border-[var(--tema-yerel-lig-islevsel-cizgi-02)] bg-[var(--tema-yerel-lig-kart-01)] px-3 py-2`}>
                <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-21)]">Kaybedilen</span>
                <strong className="text-sm tabular-nums text-[var(--tema-yerel-lig-islevsel-metin-21)]">{toplamKayip > 0 ? `−${toplamKayip.toLocaleString("tr-TR")}` : "0"}</strong>
              </span>
              <span className={`${styles.capsuleNet} flex min-h-14 flex-col justify-center rounded-xl border border-[var(--tema-yerel-lig-cizgi-01)] bg-[var(--tema-yerel-lig-secim-zemin-04)] px-3 py-2`}>
                <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-21)]">Net Puan</span>
                <strong className="text-base tabular-nums text-[var(--tema-yerel-lig-eylem-metin-02)]">{satir.toplam_puan.toLocaleString("tr-TR")}</strong>
              </span>
              <span className={`${styles.capsuleArrow} flex justify-center text-[var(--tema-yerel-lig-yardimci-metin-22)]`}>
                {ayrintiGoster && (detay ? (acik ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <LockKeyhole className="h-3.5 w-3.5" />)}
              </span>
            </button>
            {acik && (ayrintiIcerigi ? (
              <div id={ayrintiId} className="border-t border-[var(--tema-yerel-lig-cizgi-16)] bg-[var(--tema-yerel-lig-sayfa-zemini-05)] p-2 sm:p-3">
                {ayrintiIcerigi(satir)}
              </div>
            ) : (
              <div id={ayrintiId} className={`${styles.capsuleColumns} items-start border-t border-[var(--tema-yerel-lig-cizgi-16)] bg-[var(--tema-yerel-lig-sayfa-zemini-05)] p-3`}>
                <div className={`${styles.capsuleGain} min-w-0 rounded-xl border border-[var(--tema-yerel-lig-islevsel-cizgi-01)] bg-[var(--tema-yerel-lig-kart-01)] px-3 py-1`}>
                  <PuanKalemi etiket="Yayın Tamamlama" deger={satir.izleme_puani} />
                  <PuanKalemi etiket="Cevaplama" deger={satir.cevaplama_puani} />
                  <PuanKalemi etiket="Öneri" deger={satir.oneri_puani} />
                  <PuanKalemi etiket="Extra" deger={satir.extra_puani} />
                  {eclubAcik && <PuanKalemi etiket="E-Club" deger={satir.eclub_puani ?? 0} />}
                </div>
                <div className={`${styles.capsuleLoss} min-w-0 rounded-xl border border-[var(--tema-yerel-lig-islevsel-cizgi-02)] bg-[var(--tema-yerel-lig-kart-01)] px-3 py-1`}>
                  <PuanKalemi etiket="İleri sarma" deger={satir.ileri_sarma_kaybi} kayip />
                  <PuanKalemi etiket="Yanlış cevap" deger={satir.yanlis_cevap_kaybi} kayip />
                  <PuanKalemi etiket="Öneri kaybı" deger={satir.oneri_kaybi} kayip />
                </div>
              </div>
            ))}
          </article>
        );
      })}
    </div>
  );
}

export default function CompetitorComparison({
  satirlar,
  benimId,
  baslik,
  organizasyonFiltresi,
  ayrintiGoster = true,
  eclubAcik = true,
  ayrintiIcerigi,
}: {
  satirlar: SiraliSatir[];
  benimId: string;
  baslik: string;
  organizasyonFiltresi?: OrganizasyonTabloFiltresi;
  ayrintiGoster?: boolean;
  eclubAcik?: boolean;
  ayrintiIcerigi?: (satir: SiraliSatir) => ReactNode;
}) {
  const [acikKullanici, setAcikKullanici] = useState<string | null>(null);

  return (
    <section className={`${styles.panel} flex h-full min-h-0 flex-col p-4`}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div>
          <h2 className={styles.sectionHeading}>{baslik}</h2>
        </div>
      </div>

      {organizasyonFiltresi && (
        <div className="mb-3 grid grid-cols-2 gap-2 md:hidden">
          <label className="min-w-0 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-20)]">
            Takım
            <SadeListeSecimi value={organizasyonFiltresi.takimId} onChange={(event) => organizasyonFiltresi.onTakimDegistir(event.target.value)} aria-label="Takım" className="w-full">
              <option value="">Tüm takımlar</option>
              {organizasyonFiltresi.takimlar.map((takim) => <option key={takim.id} value={takim.id}>{takim.ad}</option>)}
            </SadeListeSecimi>
          </label>
          <label className="min-w-0 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-20)]">
            Bölge
            <SadeListeSecimi value={organizasyonFiltresi.bolgeId} onChange={(event) => organizasyonFiltresi.onBolgeDegistir(event.target.value)} aria-label="Bölge" className="w-full">
              <option value="">Tüm bölgeler</option>
              {organizasyonFiltresi.bolgeler.map((bolge) => <option key={bolge.id} value={bolge.id}>{bolge.ad}</option>)}
            </SadeListeSecimi>
          </label>
        </div>
      )}

      {!organizasyonFiltresi && <KapsulLigListesi satirlar={satirlar} benimId={benimId} ayrintiGoster={ayrintiGoster} ayrintiIcerigi={ayrintiIcerigi} eclubAcik={eclubAcik} />}

      {organizasyonFiltresi && <><div className="space-y-2 md:hidden">
        {satirlar.map((satir) => {
          const benim = satir.benim || satir.kullanici_id === benimId;
          const detayGorulebilir = satir.detay_gorulebilir !== false;
          const acik = acikKullanici === satir.kullanici_id;
          const { toplamKazanc, toplamKayip } = puanToplamlari(satir);
          const ayrintiId = `lig-mobil-ayrinti-${satir.kullanici_id}`;

          return (
            <article key={satir.kullanici_id} className={`overflow-hidden rounded-2xl border bg-[var(--tema-yerel-lig-kart-01)] ${benim ? "border-[var(--tema-yerel-lig-cizgi-15)] shadow-[0_5px_16px_var(--tema-yerel-lig-golge-03)]" : "border-[var(--tema-yerel-lig-cizgi-16)]"}`}>
              <div className="flex items-start gap-3 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--tema-yerel-lig-secim-zemin-04)] text-sm font-black tabular-nums text-[var(--tema-yerel-lig-eylem-metin-02)]">{satir.rank}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <strong className="truncate text-sm font-extrabold text-[var(--tema-yerel-lig-ana-metin-14)]">{satir.ad}</strong>
                    {benim && <Badge variant="secondary" className="shrink-0 text-[10px]">Sen</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--tema-yerel-lig-yardimci-metin-21)]">
                    {[satir.takim, satir.bolge].filter(Boolean).join(" · ") || "Organizasyon bilgisi yok"}
                  </p>
                </div>
                <strong className="shrink-0 text-base font-black tabular-nums text-[var(--tema-yerel-lig-eylem-metin-02)]">{satir.toplam_puan.toLocaleString("tr-TR")}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-[var(--tema-yerel-lig-cizgi-12)] bg-[var(--tema-yerel-lig-sayfa-zemini-09)] px-3 py-2.5">
                <div><span className="block text-[9px] font-extrabold uppercase text-[var(--tema-yerel-lig-yardimci-metin-21)]">Kazanılan</span><strong className="text-xs tabular-nums text-[var(--tema-yerel-lig-islevsel-metin-01)]">+{toplamKazanc.toLocaleString("tr-TR")}</strong></div>
                <div className="text-right"><span className="block text-[9px] font-extrabold uppercase text-[var(--tema-yerel-lig-yardimci-metin-21)]">Kaybedilen</span><strong className="text-xs tabular-nums text-[var(--tema-yerel-lig-islevsel-metin-21)]">{toplamKayip > 0 ? `−${toplamKayip.toLocaleString("tr-TR")}` : "0"}</strong></div>
              </div>
              {detayGorulebilir ? (
                <button
                  type="button"
                  onClick={() => setAcikKullanici(acik ? null : satir.kullanici_id)}
                  className="flex min-h-11 w-full items-center justify-center gap-1.5 border-t border-[var(--tema-yerel-lig-cizgi-12)] bg-[var(--tema-yerel-lig-kart-01)] px-3 text-[11px] font-extrabold text-[var(--tema-yerel-lig-ana-metin-13)]"
                  aria-expanded={acik}
                  aria-controls={ayrintiId}
                >
                  Puan ayrıntısı {acik ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              ) : (
                <div className="flex min-h-11 items-center justify-center gap-1.5 border-t border-[var(--tema-yerel-lig-cizgi-12)] text-[10px] font-bold text-[var(--tema-yerel-lig-yardimci-metin-23)]"><LockKeyhole className="h-3.5 w-3.5" /> Ayrıntılar gizli</div>
              )}
              {acik && detayGorulebilir && (
                <div id={ayrintiId} className="border-t border-[var(--tema-yerel-lig-cizgi-17)] bg-[var(--tema-yerel-lig-sayfa-zemini-05)] p-3">
                  <PuanAyrintisi satir={satir} eclubAcik={eclubAcik} />
                </div>
              )}
            </article>
          );
        })}
        {satirlar.length === 0 && <p className="rounded-2xl border border-dashed border-[var(--tema-yerel-lig-cizgi-04)] p-6 text-center text-xs font-bold text-[var(--tema-yerel-lig-yardimci-metin-20)]">Seçili kapsamda lig kaydı bulunamadı.</p>}
      </div>

      <div className={`${styles.scrollArea} hidden md:block [&_[data-slot=table-container]]:overflow-visible`}>
        <Table className={`${organizasyonFiltresi ? "min-w-[860px]" : "min-w-[640px]"} text-xs [&_td]:h-[54px] [&_td]:py-1.5 [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap`}>
          <TableHeader className="sticky top-0 z-10 bg-[var(--tema-yerel-lig-kart-01)]">
            <TableRow>
              <TableHead className="h-9 w-14 text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-23)]">Sıra</TableHead>
              <TableHead className="h-9 min-w-[220px] text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-23)]">UTT</TableHead>
              {organizasyonFiltresi && (
                <>
                  <TableHead className="h-9 min-w-[130px] align-middle text-left text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-23)]">
                    <label className="sr-only" htmlFor="lig-takim-filtresi">Takım filtresi</label>
                    <SadeListeSecimi id="lig-takim-filtresi" value={organizasyonFiltresi.takimId} onChange={(event) => organizasyonFiltresi.onTakimDegistir(event.target.value)} aria-label="Takım filtresi" className="w-full">
                      <option value="">Takım</option>
                      {organizasyonFiltresi.takimlar.map((takim) => <option key={takim.id} value={takim.id}>{takim.ad}</option>)}
                    </SadeListeSecimi>
                  </TableHead>
                  <TableHead className="h-9 min-w-[130px] align-middle text-left text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-yardimci-metin-23)]">
                    <label className="sr-only" htmlFor="lig-bolge-filtresi">Bölge filtresi</label>
                    <SadeListeSecimi id="lig-bolge-filtresi" value={organizasyonFiltresi.bolgeId} onChange={(event) => organizasyonFiltresi.onBolgeDegistir(event.target.value)} aria-label="Bölge filtresi" className="w-full">
                      <option value="">Bölge</option>
                      {organizasyonFiltresi.bolgeler.map((bolge) => <option key={bolge.id} value={bolge.id}>{bolge.ad}</option>)}
                    </SadeListeSecimi>
                  </TableHead>
                </>
              )}
              <TableHead className="h-9 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-ana-metin-13)]">Kazanılan</TableHead>
              <TableHead className="h-9 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-ana-metin-13)]">Kaybedilen</TableHead>
              <TableHead className="h-9 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--tema-yerel-lig-ana-metin-13)]">Net Puan</TableHead>
              <TableHead className="h-9 w-14" aria-label="Puan ayrıntısı" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {satirlar.map((satir) => {
              const benim = satir.benim || satir.kullanici_id === benimId;
              const detayGorulebilir = satir.detay_gorulebilir !== false;
              const acik = acikKullanici === satir.kullanici_id;
              const { toplamKazanc, toplamKayip } = puanToplamlari(satir);
              const ayrintiId = `lig-ayrinti-${satir.kullanici_id}`;

              return (
                <Fragment key={satir.kullanici_id}>
                  <TableRow
                    className={benim ? "bg-[var(--tema-yerel-lig-secim-zemin-04)] hover:bg-[var(--tema-yerel-lig-secim-zemin-04)] [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-l-[var(--tema-yerel-lig-cizgi-18)]" : "border-[var(--tema-yerel-lig-cizgi-19)]"}
                  >
                    <TableCell className="text-center"><SiraRozeti sira={satir.rank} /></TableCell>
                    <TableCell>
                      <div className="min-w-0 text-left">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--tema-yerel-lig-ana-metin-14)]">
                          <span className="truncate">{satir.ad}</span>
                          {benim && <Badge variant="secondary" className="text-[10px]">Sen</Badge>}
                        </span>
                        <span className="block text-[9px] font-medium text-[var(--tema-yerel-lig-yardimci-metin-15)]">
                          {satir.bolge}
                          {satir.genel_sira ? ` · Genel lig #${satir.genel_sira}` : ""}
                          {satir.etkilesilen_yayin_sayisi ? ` · ${satir.etkilesilen_yayin_sayisi} yayın` : ""}
                        </span>
                      </div>
                    </TableCell>
                    {organizasyonFiltresi && (
                      <>
                        <TableCell className="font-semibold text-[var(--tema-yerel-lig-ana-metin-13)]">{satir.takim}</TableCell>
                        <TableCell className="font-semibold text-[var(--tema-yerel-lig-ana-metin-13)]">{satir.bolge}</TableCell>
                      </>
                    )}
                    <TableCell className="text-center font-bold tabular-nums text-[var(--tema-yerel-lig-islevsel-metin-01)]">
                      +{toplamKazanc.toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-center font-bold tabular-nums text-[var(--tema-yerel-lig-islevsel-metin-21)]">
                      {toplamKayip > 0 ? `−${toplamKayip.toLocaleString("tr-TR")}` : "0"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex min-w-[76px] justify-center rounded-xl bg-[var(--tema-yerel-lig-secim-zemin-04)] px-3 py-2 text-sm font-bold tabular-nums text-[var(--tema-yerel-lig-eylem-metin-10)]">
                        {satir.toplam_puan.toLocaleString("tr-TR")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {detayGorulebilir ? (
                        <button
                          type="button"
                          onClick={() => setAcikKullanici(acik ? null : satir.kullanici_id)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg text-[var(--tema-yerel-lig-yardimci-metin-22)] hover:bg-[var(--tema-yerel-lig-secim-zemin-09)]"
                          aria-expanded={acik}
                          aria-controls={ayrintiId}
                          aria-label={`${satir.ad} puan ayrıntısını ${acik ? "kapat" : "aç"}`}
                        >
                          {acik ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      ) : (
                        <span
                          className="inline-grid h-8 w-8 place-items-center text-[var(--tema-yerel-lig-yardimci-metin-24)]"
                          title="Diğer UTT'lerin puan ayrıntıları görüntülenemez."
                          aria-label={`${satir.ad} puan ayrıntısı gizli`}
                        >
                          <LockKeyhole className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>

                  {acik && detayGorulebilir && (
                    <TableRow id={ayrintiId} className="border-[var(--tema-yerel-lig-cizgi-17)] bg-[var(--tema-yerel-lig-sayfa-zemini-05)] hover:bg-[var(--tema-yerel-lig-sayfa-zemini-05)]">
                      <TableCell colSpan={organizasyonFiltresi ? 8 : 6} className="h-auto whitespace-normal px-4 py-3">
                        <PuanAyrintisi satir={satir} eclubAcik={eclubAcik} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      </>}
    </section>
  );
}
