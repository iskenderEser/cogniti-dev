"use client";

import { Dialog } from "radix-ui";
import { useRef, useState } from "react";
import type { EczaneDagitimDanisani, EczaneDagitimYayini, EczaneDanisanGonderimi } from "../_types";

export interface DanisanGonderimSonucu {
  gonderilenKayit: number;
  gonderilenYayin: number;
  atlanan: number;
  hatalar: string[];
}

interface Props {
  yayinlar: readonly EczaneDagitimYayini[];
  gonderiliyor: boolean;
  onSecimTemizle: () => void;
  onGonder: (musteriIdler: string[]) => Promise<DanisanGonderimSonucu>;
}

const API = "/eczanem/eczane/api/gonderim";

export function EczaneDanisanGonderimPaneli({ yayinlar, gonderiliyor, onSecimTemizle, onGonder }: Props) {
  const islemKilidi = useRef(false);
  const yuklemeKimligi = useRef(0);
  const [acik, setAcik] = useState(false);
  const [adim, setAdim] = useState<1 | 2>(1);
  const [arama, setArama] = useState("");
  const [danisanlar, setDanisanlar] = useState<EczaneDagitimDanisani[]>([]);
  const [gonderimler, setGonderimler] = useState<EczaneDanisanGonderimi[]>([]);
  const [seciliDanisanIdleri, setSeciliDanisanIdleri] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [panelHatasi, setPanelHatasi] = useState<string | null>(null);

  const gonderilmis = new Set(gonderimler.map((kayit) => `${kayit.yayin_id}::${kayit.musteri_id}`));
  const danisanEngeli = (danisan: EczaneDagitimDanisani) => {
    const onceGonderilenler = yayinlar.filter((yayin) => gonderilmis.has(`${yayin.yayin_id}::${danisan.musteri_id}`));
    if (onceGonderilenler.length === 1) return `${onceGonderilenler[0].urun_adi} bu danışana daha önce gönderildi`;
    if (onceGonderilenler.length > 1) return `${onceGonderilenler.length} seçili yayın bu danışana daha önce gönderildi`;
    return null;
  };
  const uygunDanisanlar = danisanlar.filter((danisan) => !danisanEngeli(danisan));
  const gecerliSeciliIdler = seciliDanisanIdleri.filter((id) => uygunDanisanlar.some((danisan) => danisan.musteri_id === id));
  const gorunenDanisanlar = danisanlar.filter((danisan) =>
    `${danisan.ad_soyad} ${danisan.telefon_maskeli}`.toLocaleLowerCase("tr-TR").includes(arama.trim().toLocaleLowerCase("tr-TR")));

  const panelAc = async () => {
    if (!yayinlar.length || gonderiliyor) return;
    const istekKimligi = ++yuklemeKimligi.current;
    setAcik(true);
    setAdim(1);
    setArama("");
    setSeciliDanisanIdleri([]);
    setDanisanlar([]);
    setGonderimler([]);
    setPanelHatasi(null);
    setYukleniyor(true);
    try {
      const yayinIdler = yayinlar.map((yayin) => yayin.yayin_id);
      const parcalar = Array.from({ length: Math.ceil(yayinIdler.length / 100) }, (_, sira) => yayinIdler.slice(sira * 100, (sira + 1) * 100));
      const yanitlar = await Promise.all(parcalar.map(async (parca) => {
        const params = new URLSearchParams({ sadece_uyeler: "1", yayin_idler: parca.join(",") });
        const res = await fetch(`${API}?${params}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.hata ?? "Danışan gönderim durumları yüklenemedi.");
        return data as { uyeler: EczaneDagitimDanisani[]; gonderimler: EczaneDanisanGonderimi[] };
      }));
      if (yuklemeKimligi.current !== istekKimligi) return;
      setDanisanlar(yanitlar[0]?.uyeler ?? []);
      setGonderimler(yanitlar.flatMap((yanit) => yanit.gonderimler ?? []));
    } catch (err) {
      if (yuklemeKimligi.current === istekKimligi) setPanelHatasi(err instanceof Error ? err.message : "Danışanlar yüklenemedi.");
    } finally {
      if (yuklemeKimligi.current === istekKimligi) setYukleniyor(false);
    }
  };

  const kapat = () => {
    if (gonderiliyor) return;
    ++yuklemeKimligi.current;
    setAcik(false);
  };

  const gonder = async () => {
    if (islemKilidi.current || yukleniyor || gonderiliyor || gecerliSeciliIdler.length === 0) return;
    islemKilidi.current = true;
    setPanelHatasi(null);
    try {
      const sonuc = await onGonder(gecerliSeciliIdler);
      if (sonuc.gonderilenKayit > 0) {
        setAcik(false);
        setAdim(1);
        setSeciliDanisanIdleri([]);
        onSecimTemizle();
      } else {
        setPanelHatasi(sonuc.hatalar[0] ?? "Gönderim tamamlanamadı. Danışan uygunluğunu yeniden kontrol edin.");
      }
    } catch {
      setPanelHatasi("Gönderim tamamlanamadı. Lütfen yeniden deneyin.");
    } finally {
      islemKilidi.current = false;
    }
  };

  return <>
    {yayinlar.length > 0 && <div role="region" aria-label="Seçilen yayınlar" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-[650px] flex-wrap items-center gap-2 rounded-2xl bg-[var(--tema-yerel-eczanem-eylem-zemin-03)] px-4 py-3 text-[var(--tema-yerel-eczanem-ters-metin-01)] shadow-[0_16px_40px_var(--tema-yerel-eczanem-golge-01)] sm:bottom-5 sm:gap-3">
      <strong className="min-w-32 flex-1 text-sm">{yayinlar.length} yayın seçildi</strong>
      <span className="text-[10px] text-[var(--tema-yerel-eczanem-yardimci-metin-15)]">Uygun danışanlara anlık gönderim</span>
      <button type="button" onClick={onSecimTemizle} disabled={gonderiliyor} className="rounded-lg px-2 py-2 text-xs font-bold text-[var(--tema-yerel-eczanem-yardimci-metin-16)] hover:bg-[var(--tema-yerel-eczanem-kart-01)]/10 disabled:opacity-50">Seçimi temizle</button>
      <button type="button" onClick={() => void panelAc()} disabled={gonderiliyor} className="rounded-lg bg-[var(--tema-yerel-eczanem-kart-01)] px-3 py-2 text-xs font-extrabold text-[var(--tema-yerel-eczanem-eylem-metin-01)] hover:bg-[var(--tema-yerel-eczanem-secim-zemin-05)] disabled:opacity-50">Gönderim oluştur →</button>
    </div>}

    <Dialog.Root open={acik} onOpenChange={(sonraki) => { if (!sonraki) kapat(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[var(--tema-yerel-eczanem-eylem-zemin-04)]/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[515px] flex-col bg-[var(--tema-yerel-eczanem-kart-01)] shadow-[-10px_0_40px_var(--tema-yerel-eczanem-golge-02)]"
          onEscapeKeyDown={(event) => { if (gonderiliyor) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (gonderiliyor) event.preventDefault(); }}>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--tema-yerel-eczanem-cizgi-11)] px-5 py-5 sm:px-6">
            <div><Dialog.Title className="text-xl font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-04)]">Gönderim oluştur</Dialog.Title><Dialog.Description className="mt-1 text-xs text-[var(--tema-yerel-eczanem-yardimci-metin-17)]">{yayinlar.length} yayın seçildi · Danışan gönderimi</Dialog.Description></div>
            <Dialog.Close disabled={gonderiliyor} aria-label="Gönderim panelini kapat" className="flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-[var(--tema-yerel-eczanem-sayfa-zemini-09)] text-xl text-[var(--tema-yerel-eczanem-ana-metin-07)] disabled:opacity-50">×</Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
            <section className={`overflow-hidden rounded-xl border ${adim === 1 ? "border-[var(--tema-yerel-eczanem-cizgi-12)] shadow-[0_0_0_2px_var(--tema-yerel-eczanem-golge-03)]" : "border-[var(--tema-yerel-eczanem-cizgi-13)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-10)]"}`}>
              <button type="button" onClick={() => { if (!gonderiliyor) setAdim(1); }} aria-expanded={adim === 1} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 1 ? "bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] text-[var(--tema-yerel-eczanem-ters-metin-01)]" : "bg-[var(--tema-yerel-eczanem-islevsel-zemin-18)] text-[var(--tema-yerel-eczanem-islevsel-metin-17)]"}`}>{adim === 1 ? "1" : "✓"}</span>
                <span><strong className="block text-sm text-[var(--tema-yerel-eczanem-ana-metin-08)]">Danışanlar</strong><small className="mt-0.5 block text-[10px] text-[var(--tema-yerel-eczanem-yardimci-metin-18)]">{adim === 1 ? "Uygun danışanları seçin" : `${gecerliSeciliIdler.length} danışan seçildi`}</small></span>
                <span className="ml-auto text-[var(--tema-yerel-eczanem-yardimci-metin-19)]">⌄</span>
              </button>
              {adim === 1 && <div className="px-4 pb-4 sm:pl-14">
                <p className="mb-3 text-[11px] leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-20)]">Seçili yayınların tamamını alabilecek danışanları seçin. Seçilemeyen danışanın nedeni yanında gösterilir.</p>
                {yukleniyor ? <p role="status" className="rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-14)] p-4 text-center text-xs text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">Danışanlar yükleniyor…</p> : <>
                  <input type="search" value={arama} onChange={(event) => setArama(event.target.value)} placeholder="Danışan ara…" aria-label="Danışan ara" className="w-full rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-15)] px-3 py-2.5 text-xs text-[var(--tema-yerel-eczanem-ana-metin-09)]" />
                  <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto">
                    {gorunenDanisanlar.length === 0 && <p className="rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-14)] p-4 text-center text-xs text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">{danisanlar.length === 0 ? "Aktif danışan bulunmuyor." : "Eşleşen danışan yok."}</p>}
                    {gorunenDanisanlar.map((danisan) => { const engel = danisanEngeli(danisan); const secili = gecerliSeciliIdler.includes(danisan.musteri_id); return <label key={danisan.musteri_id} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${engel ? "border-[var(--tema-yerel-eczanem-cizgi-16)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-11)] opacity-75" : secili ? "cursor-pointer border-[var(--tema-yerel-eczanem-cizgi-02)] bg-[var(--tema-yerel-eczanem-secim-zemin-06)]" : "cursor-pointer border-[var(--tema-yerel-eczanem-cizgi-17)] bg-[var(--tema-yerel-eczanem-kart-01)] hover:bg-[var(--tema-yerel-eczanem-sayfa-zemini-12)]"}`}>
                      <input type="checkbox" checked={secili} disabled={!!engel || gonderiliyor} onChange={(event) => setSeciliDanisanIdleri((onceki) => event.target.checked ? [...onceki, danisan.musteri_id] : onceki.filter((id) => id !== danisan.musteri_id))} className="mt-0.5 size-4 shrink-0 accent-[var(--tema-yerel-eczanem-eylem-metin-01)]" />
                      <span className="min-w-0 flex-1"><strong className="block text-xs text-[var(--tema-yerel-eczanem-ana-metin-10)]">{danisan.ad_soyad}</strong><small className="mt-0.5 block text-[10px] text-[var(--tema-yerel-eczanem-yardimci-metin-21)]">{danisan.telefon_maskeli}</small><small className={`mt-1 block text-[10px] leading-4 ${engel ? "text-[var(--tema-yerel-eczanem-islevsel-metin-18)]" : "text-[var(--tema-yerel-eczanem-islevsel-metin-19)]"}`}>{engel ?? "Tüm seçili yayınlar için uygun"}</small></span>
                      {!engel && <span className="shrink-0 text-[10px] font-extrabold text-[var(--tema-yerel-eczanem-islevsel-metin-20)]">Uygun</span>}
                    </label>; })}
                  </div>
                  <p className="mt-3 rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-18)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-13)] p-2.5 text-[10px] leading-4 text-[var(--tema-yerel-eczanem-yardimci-metin-22)]">Yalnız eczanenizin aktif danışanları ve seçili yayınları daha önce almamış kişiler seçilebilir.</p>
                  <div className="mt-4 flex justify-end"><button type="button" disabled={gecerliSeciliIdler.length === 0 || gonderiliyor} onClick={() => setAdim(2)} className="rounded-lg bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eczanem-ters-metin-01)] disabled:cursor-not-allowed disabled:opacity-50">Devam et · Özet →</button></div>
                </>}
              </div>}
            </section>
            <section className={`overflow-hidden rounded-xl border ${adim === 2 ? "border-[var(--tema-yerel-eczanem-cizgi-12)] shadow-[0_0_0_2px_var(--tema-yerel-eczanem-golge-03)]" : "border-[var(--tema-yerel-eczanem-cizgi-13)]"}`}>
              <button type="button" disabled={gecerliSeciliIdler.length === 0 || gonderiliyor} onClick={() => setAdim(2)} aria-expanded={adim === 2} className="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:cursor-not-allowed">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 2 ? "bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] text-[var(--tema-yerel-eczanem-ters-metin-01)]" : "bg-[var(--tema-yerel-eczanem-secim-zemin-07)] text-[var(--tema-yerel-eczanem-yardimci-metin-23)]"}`}>2</span>
                <span><strong className="block text-sm text-[var(--tema-yerel-eczanem-ana-metin-08)]">Özet</strong><small className="mt-0.5 block text-[10px] text-[var(--tema-yerel-eczanem-yardimci-metin-18)]">Göndermeden önce kontrol edin</small></span><span className="ml-auto text-[var(--tema-yerel-eczanem-yardimci-metin-19)]">⌄</span>
              </button>
              {adim === 2 && <div className="px-4 pb-4 sm:pl-14">
                <p className="mb-3 text-[11px] leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-20)]">Bu gönderim seçtiğiniz danışanlara hemen yapılır.</p>
                <div className="divide-y divide-[var(--tema-yerel-eczanem-cizgi-03)] rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-19)] text-xs">
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[var(--tema-yerel-eczanem-yardimci-metin-24)]">Yayın</span><strong className="text-[var(--tema-yerel-eczanem-ana-metin-11)]">{yayinlar.length} yayın</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[var(--tema-yerel-eczanem-yardimci-metin-24)]">Danışan</span><strong className="text-[var(--tema-yerel-eczanem-ana-metin-11)]">{gecerliSeciliIdler.length} danışan</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[var(--tema-yerel-eczanem-yardimci-metin-24)]">Gönderim</span><strong className="text-[var(--tema-yerel-eczanem-ana-metin-11)]">Şimdi</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[var(--tema-yerel-eczanem-yardimci-metin-24)]">Oluşturulacak kayıt</span><strong className="text-[var(--tema-yerel-eczanem-ana-metin-11)]">{yayinlar.length * gecerliSeciliIdler.length}</strong></div>
                </div>
                <ul className="mt-3 space-y-1 text-[11px] text-[var(--tema-yerel-eczanem-ana-metin-12)]">{yayinlar.map((yayin) => <li key={yayin.yayin_id}>{yayin.urun_adi} · {yayin.teknik_adi || "Öğrenme içeriği"}</li>)}</ul>
                <p className="mt-3 rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-18)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-13)] p-2.5 text-[10px] leading-4 text-[var(--tema-yerel-eczanem-yardimci-metin-22)]">Alıcılar: {danisanlar.filter((danisan) => gecerliSeciliIdler.includes(danisan.musteri_id)).map((danisan) => danisan.ad_soyad).join(", ")}</p>
                <div className="mt-4 flex justify-end"><button type="button" disabled={gonderiliyor || gecerliSeciliIdler.length === 0} onClick={() => void gonder()} className="rounded-lg bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eczanem-ters-metin-01)] disabled:cursor-not-allowed disabled:opacity-50">{gonderiliyor ? "Gönderiliyor…" : "Danışanlara gönder"}</button></div>
              </div>}
            </section>
            {panelHatasi && <p role="alert" className="rounded-lg bg-[var(--tema-yerel-eczanem-islevsel-zemin-19)] p-3 text-xs text-[var(--tema-yerel-eczanem-islevsel-metin-21)]">{panelHatasi}</p>}
          </div>
          <p className="border-t border-[var(--tema-yerel-eczanem-cizgi-07)] px-5 py-3 text-[10px] leading-4 text-[var(--tema-yerel-eczanem-yardimci-metin-25)] sm:px-6">Yayın ve aktif danışan koşulları gönderim anında yeniden denetlenir.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
