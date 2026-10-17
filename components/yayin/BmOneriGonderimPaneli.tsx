"use client";

import { SadeTarihAlani } from "@/components/kontrol/SadeKontroller";
import type { YayindakiVideo } from "@/lib/video/yayindakiVideolar";
import { oneriTarihKurali } from "@/lib/tclub/oneri/tarihKurali";
import { trGunEkle, trGunu } from "@/lib/zaman/kontrol";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface BmOneriAlici {
  kullanici_id: string;
  ad: string;
  soyad: string;
  haftalik_kalan: number;
  rol?: string;
}

export interface BmOneriLimitler {
  aylik: { kalan: number };
}

interface Props {
  yayinlar: YayindakiVideo[];
  alicilar: BmOneriAlici[];
  limitler: BmOneriLimitler | null;
  alicilarYukleniyor: boolean;
  aliciId: string;
  onAliciDegistir: (id: string) => void;
  baslangic: string;
  onBaslangicDegistir: (gun: string) => void;
  bitis: string;
  onBitisDegistir: (gun: string) => void;
  gonderiliyor: boolean;
  gonderilebilir: boolean;
  hataMesaji: string;
  onGonder: () => void;
  onKapat: () => void;
}

const tarihGoster = (gun: string) => {
  if (!gun) return "Seçilmedi";
  const [yil, ay, tarih] = gun.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(yil, ay - 1, tarih));
};

export default function BmOneriGonderimPaneli({
  yayinlar, alicilar, limitler, alicilarYukleniyor, aliciId, onAliciDegistir,
  baslangic, onBaslangicDegistir, bitis, onBitisDegistir,
  gonderiliyor, gonderilebilir, hataMesaji, onGonder, onKapat,
}: Props) {
  const [adim, setAdim] = useState<1 | 2 | 3>(1);
  const [arama, setArama] = useState("");
  const tarihlerGecerli = oneriTarihKurali(baslangic, bitis).gecerli;
  const alici = alicilar.find((kisi) => kisi.kullanici_id === aliciId);
  const aliciUygun = !!alici && alici.haftalik_kalan >= yayinlar.length && (limitler?.aylik.kalan ?? 0) >= yayinlar.length;
  const gorunenAlicilar = alicilar.filter((kisi) =>
    `${kisi.ad} ${kisi.soyad}`.toLocaleLowerCase("tr").includes(arama.trim().toLocaleLowerCase("tr")));

  useEffect(() => {
    const eskiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tus = (event: KeyboardEvent) => { if (event.key === "Escape" && !gonderiliyor) onKapat(); };
    document.addEventListener("keydown", tus);
    return () => { document.body.style.overflow = eskiOverflow; document.removeEventListener("keydown", tus); };
  }, [gonderiliyor, onKapat]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-11)]/40" onClick={gonderiliyor ? undefined : onKapat} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-labelledby="bm-gonderim-baslik" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col bg-[var(--tema-yerel-ortak-sayfa-kart-01)] shadow-[-10px_0_40px_var(--tema-yerel-ortak-sayfa-golge-07)]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--tema-yerel-ortak-sayfa-cizgi-12)] px-5 py-5 sm:px-6">
          <div>
            <h2 id="bm-gonderim-baslik" className="text-xl font-extrabold text-[var(--tema-yerel-ortak-sayfa-ana-metin-03)]">Gönderim oluştur</h2>
            <p className="mt-1 text-xs text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-20)]">{yayinlar.length} yayın seçildi · tek temsilciye önerilecek</p>
          </div>
          <button type="button" aria-label="Gönderim panelini kapat" onClick={onKapat} disabled={gonderiliyor} className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-09)] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-21)] hover:bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-10)] disabled:opacity-50"><X className="size-4" /></button>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4 sm:px-6">
          <section className={`overflow-hidden rounded-xl border bg-[var(--tema-yerel-ortak-sayfa-kart-01)] ${adim === 1 ? "border-[var(--tema-yerel-ortak-sayfa-cizgi-13)] ring-2 ring-[var(--tema-yerel-ortak-sayfa-odak-04)]" : "border-[var(--tema-yerel-ortak-sayfa-cizgi-14)]"}`}>
            <button type="button" onClick={() => setAdim(1)} aria-expanded={adim === 1} aria-controls="bm-adim-alici" className="flex w-full items-center gap-3 p-3.5 text-left">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 1 ? "bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-01)] text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)]" : "bg-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-22)] text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-19)]"}`}>{adim > 1 ? <Check className="size-4" /> : "1"}</span>
              <span className="min-w-0 flex-1"><strong className="block text-[13px] text-[var(--tema-yerel-ortak-sayfa-ana-metin-03)]">Alıcı</strong><small className="mt-0.5 block text-[11px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-22)]">{adim > 1 && alici ? `${alici.ad} ${alici.soyad}` : "Tek temsilci seçimi"}</small></span>
              <ChevronDown className="size-4 text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-23)]" />
            </button>
            {adim === 1 && <div id="bm-adim-alici" className="px-3.5 pb-4 sm:pl-[52px]">
              <p className="mb-3 text-[11px] leading-relaxed text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-24)]">Bu öneri grubu tek temsilciye gönderilir. Seçilen yayın sayısı haftalık ve aylık haklara sığmalıdır.</p>
              <input type="search" value={arama} onChange={(event) => setArama(event.target.value)} placeholder="Temsilci ara…" aria-label="Temsilci ara" className="mb-2 w-full rounded-lg border border-[var(--tema-yerel-ortak-sayfa-cizgi-15)] px-3 py-2 text-xs text-[var(--tema-yerel-ortak-sayfa-ana-metin-02)]" />
              {alicilarYukleniyor ? <p className="py-3 text-xs text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-24)]">Temsilciler yükleniyor…</p> : !limitler ? <p className="py-3 text-xs text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-20)]">Alıcı ve kota bilgileri alınamadı. Sayfayı yenileyin.</p> : gorunenAlicilar.length === 0 ? <p className="py-3 text-xs text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-24)]">Temsilci bulunamadı.</p> : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto">
                  {gorunenAlicilar.map((kisi) => {
                    const uygun = kisi.haftalik_kalan >= yayinlar.length && limitler.aylik.kalan >= yayinlar.length;
                    const secili = aliciId === kisi.kullanici_id;
                    return <button key={kisi.kullanici_id} type="button" disabled={!uygun} onClick={() => onAliciDegistir(kisi.kullanici_id)} aria-pressed={secili} className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left ${secili ? "border-[var(--tema-yerel-ortak-sayfa-cizgi-16)] bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-08)]" : "border-[var(--tema-yerel-ortak-sayfa-cizgi-17)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)]"} disabled:bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-11)] disabled:opacity-60`}>
                      <span className={`size-4 shrink-0 rounded-full border-2 ${secili ? "border-[5px] border-[var(--tema-yerel-ortak-sayfa-cizgi-16)]" : "border-[var(--tema-yerel-ortak-sayfa-cizgi-18)]"}`} />
                      <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[var(--tema-yerel-ortak-sayfa-ana-metin-17)]">{kisi.ad} {kisi.soyad}</strong><small className="text-[10px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-25)]">{kisi.rol === "kd_utt" ? "KD_UTT" : "UTT"}</small></span>
                      <span className={`text-right text-[10px] font-extrabold ${uygun ? "text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-21)]" : "text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-22)]"}`}>{kisi.haftalik_kalan} hak kaldı{uygun ? "" : " · yetersiz"}</span>
                    </button>;
                  })}
                </div>
              )}
              {limitler && <p className="mt-3 rounded-lg border border-[var(--tema-yerel-ortak-sayfa-cizgi-19)] bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-12)] px-2.5 py-2 text-[10px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-26)]">Bu ay {limitler.aylik.kalan} öneri hakkı kaldı. {yayinlar.length} yayın seçildi.</p>}
              <div className="mt-3 flex justify-end"><button type="button" disabled={!aliciUygun} onClick={() => setAdim(2)} className="rounded-lg bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-01)] px-3 py-2.5 text-[11px] font-extrabold text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] hover:bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-02)] disabled:opacity-45">Devam et · Zaman →</button></div>
            </div>}
          </section>

          <section className={`overflow-hidden rounded-xl border bg-[var(--tema-yerel-ortak-sayfa-kart-01)] ${adim === 2 ? "border-[var(--tema-yerel-ortak-sayfa-cizgi-13)] ring-2 ring-[var(--tema-yerel-ortak-sayfa-odak-04)]" : "border-[var(--tema-yerel-ortak-sayfa-cizgi-14)]"}`}>
            <button type="button" disabled={!aliciUygun} onClick={() => setAdim(2)} aria-expanded={adim === 2} aria-controls="bm-adim-zaman" className="flex w-full items-center gap-3 p-3.5 text-left disabled:opacity-55">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 2 ? "bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-01)] text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)]" : adim > 2 ? "bg-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-22)] text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-19)]" : "bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-13)] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-27)]"}`}>{adim > 2 ? <Check className="size-4" /> : "2"}</span>
              <span className="min-w-0 flex-1"><strong className="block text-[13px] text-[var(--tema-yerel-ortak-sayfa-ana-metin-03)]">Zaman</strong><small className="mt-0.5 block text-[11px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-22)]">{adim > 2 ? `${tarihGoster(baslangic)} – ${tarihGoster(bitis)}` : "Başlangıç ve bitiş günü"}</small></span>
              <ChevronDown className="size-4 text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-23)]" />
            </button>
            {adim === 2 && <div id="bm-adim-zaman" className="px-3.5 pb-4 sm:pl-[52px]">
              <p className="mb-3 text-[11px] leading-relaxed text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-24)]">Önerinin başlayacağı ve biteceği günleri seçin. Başlangıç en erken yarın olabilir.</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label className="text-[11px] font-extrabold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-28)]">Başlangıç günü
                  <SadeTarihAlani value={baslangic} min={trGunEkle(trGunu(), 1)} onChange={(event) => onBaslangicDegistir(event.target.value)} className="mt-1.5 w-full" />
                </label>
                <label className="text-[11px] font-extrabold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-28)]">Bitiş günü
                  <SadeTarihAlani value={bitis} min={baslangic ? trGunEkle(baslangic, 1) : trGunEkle(trGunu(), 2)} onChange={(event) => onBitisDegistir(event.target.value)} className="mt-1.5 w-full" />
                </label>
              </div>
              <p className="mt-3 rounded-lg border border-[var(--tema-yerel-ortak-sayfa-cizgi-19)] bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-12)] px-2.5 py-2 text-[10px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-26)]">Bitiş günü başlangıçtan en az bir gün sonra olmalıdır.</p>
              <div className="mt-3 flex justify-end"><button type="button" disabled={!tarihlerGecerli} onClick={() => setAdim(3)} className="rounded-lg bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-01)] px-3 py-2.5 text-[11px] font-extrabold text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] hover:bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-02)] disabled:opacity-45">Devam et · Özet →</button></div>
            </div>}
          </section>

          <section className={`overflow-hidden rounded-xl border bg-[var(--tema-yerel-ortak-sayfa-kart-01)] ${adim === 3 ? "border-[var(--tema-yerel-ortak-sayfa-cizgi-13)] ring-2 ring-[var(--tema-yerel-ortak-sayfa-odak-04)]" : "border-[var(--tema-yerel-ortak-sayfa-cizgi-14)]"}`}>
            <button type="button" disabled={!tarihlerGecerli || !aliciUygun} onClick={() => setAdim(3)} aria-expanded={adim === 3} aria-controls="bm-adim-ozet" className="flex w-full items-center gap-3 p-3.5 text-left disabled:opacity-55">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 3 ? "bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-01)] text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)]" : "bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-13)] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-27)]"}`}>3</span>
              <span className="min-w-0 flex-1"><strong className="block text-[13px] text-[var(--tema-yerel-ortak-sayfa-ana-metin-03)]">Özet</strong><small className="mt-0.5 block text-[11px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-22)]">Göndermeden önce gözden geçirin</small></span>
              <ChevronDown className="size-4 text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-23)]" />
            </button>
            {adim === 3 && <div id="bm-adim-ozet" className="px-3.5 pb-4 sm:pl-[52px]">
              <p className="mb-3 text-[11px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-24)]">Yayınları, alıcıyı ve tarih aralığını kontrol edin.</p>
              <dl className="overflow-hidden rounded-lg border border-[var(--tema-yerel-ortak-sayfa-cizgi-19)] text-[11px]">
                {[ ["Yayın", `${yayinlar.length} yayın`], ["Alıcı", alici ? `${alici.ad} ${alici.soyad}` : "—"], ["Başlangıç", tarihGoster(baslangic)], ["Bitiş", tarihGoster(bitis)] ].map(([etiket, deger]) => <div key={etiket} className="flex justify-between gap-3 border-b border-[var(--tema-yerel-ortak-sayfa-cizgi-20)] px-3 py-2.5 last:border-b-0"><dt className="text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-29)]">{etiket}</dt><dd className="text-right font-extrabold text-[var(--tema-yerel-ortak-sayfa-ana-metin-02)]">{deger}</dd></div>)}
              </dl>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[11px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-30)]">{yayinlar.map((yayin) => <li key={yayin.yayin_id}>{yayin.urun_adi}</li>)}</ul>
              {hataMesaji && <p role="alert" className="mt-3 rounded-lg border border-[var(--tema-yerel-ortak-sayfa-islevsel-cizgi-04)] bg-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-23)] px-3 py-2 text-xs text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-20)]">{hataMesaji}</p>}
              <div className="mt-4 flex justify-end"><button type="button" onClick={onGonder} disabled={!gonderilebilir} className="rounded-lg bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-01)] px-4 py-2.5 text-[11px] font-extrabold text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] hover:bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-02)] disabled:opacity-45">{gonderiliyor ? "Gönderiliyor…" : "Önerileri oluştur"}</button></div>
            </div>}
          </section>
        </div>
        <div className="border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-12)] px-5 py-3.5 text-[10px] leading-relaxed text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-31)] sm:px-6">BM önerileri tek temsilci için oluşturulur. Başlangıç günü en erken yarındır; bitiş günü başlangıçtan sonra olmalıdır.</div>
      </aside>
    </>
  );
}
