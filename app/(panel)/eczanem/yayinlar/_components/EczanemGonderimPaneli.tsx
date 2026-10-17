"use client";

import { Dialog } from "radix-ui";
import { useRef, useState } from "react";
import type { UttEczanemEczane, UttEczanemGonderim, UttEczanemYayin } from "../_types";

export interface EczanemGonderimSonucu {
  gonderilenKayit: number;
  gonderilenYayin: number;
  gonderilenEczane: number;
  atlanan: number;
  hatalar: string[];
}

interface Props {
  yayinlar: readonly UttEczanemYayin[];
  eczaneler: readonly UttEczanemEczane[];
  gonderimler: readonly UttEczanemGonderim[];
  esik: number;
  gonderiliyor: boolean;
  onSecimTemizle: () => void;
  onGonder: (eczaneIdleri: string[]) => Promise<EczanemGonderimSonucu>;
}

export function EczanemGonderimPaneli({
  yayinlar, eczaneler, gonderimler, esik, gonderiliyor, onSecimTemizle, onGonder,
}: Props) {
  const islemKilidi = useRef(false);
  const [acik, setAcik] = useState(false);
  const [adim, setAdim] = useState<1 | 2>(1);
  const [arama, setArama] = useState("");
  const [seciliEczaneIdleri, setSeciliEczaneIdleri] = useState<string[]>([]);
  const [panelHatasi, setPanelHatasi] = useState<string | null>(null);

  const gonderilmis = new Set(gonderimler.map((kayit) => `${kayit.yayin_id}::${kayit.eczane_id}`));
  const eczaneEngeli = (eczane: UttEczanemEczane) => {
    if (!eczane.esik_uygun) return `Aktif danışan eşiği sağlanmadı (${eczane.aktif_uye_sayisi}/${esik})`;
    const onceGonderilenler = yayinlar.filter((yayin) => gonderilmis.has(`${yayin.yayin_id}::${eczane.eczane_id}`));
    if (onceGonderilenler.length === 1) return `${onceGonderilenler[0].urun_adi} bu eczaneye daha önce gönderildi`;
    if (onceGonderilenler.length > 1) return `${onceGonderilenler.length} seçili yayın bu eczaneye daha önce gönderildi`;
    return null;
  };
  const uygunEczaneler = eczaneler.filter((eczane) => !eczaneEngeli(eczane));
  const gecerliSeciliIdler = seciliEczaneIdleri.filter((id) => uygunEczaneler.some((eczane) => eczane.eczane_id === id));
  const gorunenEczaneler = eczaneler.filter((eczane) =>
    eczane.eczane_adi.toLocaleLowerCase("tr").includes(arama.trim().toLocaleLowerCase("tr")));

  const panelAc = () => {
    if (!yayinlar.length || gonderiliyor) return;
    setAdim(1);
    setArama("");
    setSeciliEczaneIdleri([]);
    setPanelHatasi(null);
    setAcik(true);
  };
  const gonder = async () => {
    if (islemKilidi.current || gonderiliyor || gecerliSeciliIdler.length === 0) return;
    islemKilidi.current = true;
    setPanelHatasi(null);
    try {
      const sonuc = await onGonder(gecerliSeciliIdler);
      if (sonuc.gonderilenKayit > 0) {
        setAcik(false);
        setAdim(1);
        setSeciliEczaneIdleri([]);
        onSecimTemizle();
      } else {
        setPanelHatasi(sonuc.hatalar[0] ?? "Gönderim tamamlanamadı. Eczane uygunluğunu yeniden kontrol edin.");
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
      <span className="text-[10px] text-[var(--tema-yerel-eczanem-yardimci-metin-15)]">Uygun eczanelere anlık gönderim</span>
      <button type="button" onClick={onSecimTemizle} disabled={gonderiliyor} className="rounded-lg px-2 py-2 text-xs font-bold text-[var(--tema-yerel-eczanem-yardimci-metin-16)] hover:bg-[var(--tema-yerel-eczanem-kart-01)]/10 disabled:opacity-50">Seçimi temizle</button>
      <button type="button" onClick={panelAc} disabled={gonderiliyor} className="rounded-lg bg-[var(--tema-yerel-eczanem-kart-01)] px-3 py-2 text-xs font-extrabold text-[var(--tema-yerel-eczanem-eylem-metin-01)] hover:bg-[var(--tema-yerel-eczanem-secim-zemin-05)] disabled:opacity-50">Gönderim oluştur →</button>
    </div>}

    <Dialog.Root open={acik} onOpenChange={(sonraki) => { if (!sonraki && !gonderiliyor) setAcik(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[var(--tema-yerel-eczanem-eylem-zemin-04)]/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[515px] flex-col bg-[var(--tema-yerel-eczanem-kart-01)] shadow-[-10px_0_40px_var(--tema-yerel-eczanem-golge-02)]"
          onEscapeKeyDown={(event) => { if (gonderiliyor) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (gonderiliyor) event.preventDefault(); }}>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--tema-yerel-eczanem-cizgi-11)] px-5 py-5 sm:px-6">
            <div><Dialog.Title className="text-xl font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-04)]">Gönderim oluştur</Dialog.Title><Dialog.Description className="mt-1 text-xs text-[var(--tema-yerel-eczanem-yardimci-metin-17)]">{yayinlar.length} yayın seçildi · Eczane dağıtımı</Dialog.Description></div>
            <Dialog.Close disabled={gonderiliyor} aria-label="Gönderim panelini kapat" className="flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-[var(--tema-yerel-eczanem-sayfa-zemini-09)] text-xl text-[var(--tema-yerel-eczanem-ana-metin-07)] disabled:opacity-50">×</Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
            <section className={`overflow-hidden rounded-xl border ${adim === 1 ? "border-[var(--tema-yerel-eczanem-cizgi-12)] shadow-[0_0_0_2px_var(--tema-yerel-eczanem-golge-03)]" : "border-[var(--tema-yerel-eczanem-cizgi-13)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-10)]"}`}>
              <button type="button" onClick={() => { if (!gonderiliyor) setAdim(1); }} aria-expanded={adim === 1} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 1 ? "bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] text-[var(--tema-yerel-eczanem-ters-metin-01)]" : "bg-[var(--tema-yerel-eczanem-islevsel-zemin-18)] text-[var(--tema-yerel-eczanem-islevsel-metin-17)]"}`}>{adim === 1 ? "1" : "✓"}</span>
                <span><strong className="block text-sm text-[var(--tema-yerel-eczanem-ana-metin-08)]">Eczaneler</strong><small className="mt-0.5 block text-[10px] text-[var(--tema-yerel-eczanem-yardimci-metin-18)]">{adim === 1 ? "Uygun eczaneleri seçin" : `${gecerliSeciliIdler.length} eczane seçildi`}</small></span>
                <span className="ml-auto text-[var(--tema-yerel-eczanem-yardimci-metin-19)]">⌄</span>
              </button>
              {adim === 1 && <div className="px-4 pb-4 sm:pl-14">
                <p className="mb-3 text-[11px] leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-20)]">Seçili yayınların tamamını alabilecek eczaneleri seçin. Seçilemeyen eczanenin nedeni yanında gösterilir.</p>
                <input type="search" value={arama} onChange={(event) => setArama(event.target.value)} placeholder="Eczane ara…" aria-label="Eczane ara" className="w-full rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-15)] px-3 py-2.5 text-xs text-[var(--tema-yerel-eczanem-ana-metin-09)]" />
                <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto">
                  {gorunenEczaneler.length === 0 && <p className="rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-14)] p-4 text-center text-xs text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">Eşleşen eczane yok.</p>}
                  {gorunenEczaneler.map((eczane) => { const engel = eczaneEngeli(eczane); const secili = gecerliSeciliIdler.includes(eczane.eczane_id); return <label key={eczane.eczane_id} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${engel ? "border-[var(--tema-yerel-eczanem-cizgi-16)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-11)] opacity-75" : secili ? "cursor-pointer border-[var(--tema-yerel-eczanem-cizgi-02)] bg-[var(--tema-yerel-eczanem-secim-zemin-06)]" : "cursor-pointer border-[var(--tema-yerel-eczanem-cizgi-17)] bg-[var(--tema-yerel-eczanem-kart-01)] hover:bg-[var(--tema-yerel-eczanem-sayfa-zemini-12)]"}`}>
                    <input type="checkbox" checked={secili} disabled={!!engel || gonderiliyor} onChange={(event) => setSeciliEczaneIdleri((onceki) => event.target.checked ? [...onceki, eczane.eczane_id] : onceki.filter((id) => id !== eczane.eczane_id))} className="mt-0.5 size-4 shrink-0 accent-[var(--tema-yerel-eczanem-eylem-metin-01)]" />
                    <span className="min-w-0 flex-1"><span className="flex flex-wrap items-baseline gap-x-2"><strong className="text-xs text-[var(--tema-yerel-eczanem-ana-metin-10)]">{eczane.eczane_adi}</strong>{eczane.eczaci_ad_soyad && <span className="text-[11px] text-[var(--tema-yerel-eczanem-yardimci-metin-22)]">Ecz. {eczane.eczaci_ad_soyad}</span>}</span><small className="mt-0.5 block text-[10px] text-[var(--tema-yerel-eczanem-yardimci-metin-21)]">{eczane.aktif_uye_sayisi} aktif danışan</small><small className={`mt-1 block text-[10px] leading-4 ${engel ? "text-[var(--tema-yerel-eczanem-islevsel-metin-18)]" : "text-[var(--tema-yerel-eczanem-islevsel-metin-19)]"}`}>{engel ?? "Tüm seçili yayınlar için uygun"}</small></span>
                    {!engel && <span className="shrink-0 text-[10px] font-extrabold text-[var(--tema-yerel-eczanem-islevsel-metin-20)]">Uygun</span>}
                  </label>; })}
                </div>
                <p className="mt-3 rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-18)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-13)] p-2.5 text-[10px] leading-4 text-[var(--tema-yerel-eczanem-yardimci-metin-22)]">Yalnız en az {esik} aktif danışanı olan ve seçili yayınları daha önce almamış eczaneler seçilebilir.</p>
                <div className="mt-4 flex justify-end"><button type="button" disabled={gecerliSeciliIdler.length === 0 || gonderiliyor} onClick={() => { setPanelHatasi(null); setAdim(2); }} className="rounded-lg bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eczanem-ters-metin-01)] disabled:cursor-not-allowed disabled:opacity-50">Devam et · Özet →</button></div>
              </div>}
            </section>
            <section className={`overflow-hidden rounded-xl border ${adim === 2 ? "border-[var(--tema-yerel-eczanem-cizgi-12)] shadow-[0_0_0_2px_var(--tema-yerel-eczanem-golge-03)]" : "border-[var(--tema-yerel-eczanem-cizgi-13)]"}`}>
              <button type="button" disabled={gecerliSeciliIdler.length === 0 || gonderiliyor} onClick={() => setAdim(2)} aria-expanded={adim === 2} className="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:cursor-not-allowed">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 2 ? "bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] text-[var(--tema-yerel-eczanem-ters-metin-01)]" : "bg-[var(--tema-yerel-eczanem-secim-zemin-07)] text-[var(--tema-yerel-eczanem-yardimci-metin-23)]"}`}>2</span>
                <span><strong className="block text-sm text-[var(--tema-yerel-eczanem-ana-metin-08)]">Özet</strong><small className="mt-0.5 block text-[10px] text-[var(--tema-yerel-eczanem-yardimci-metin-18)]">Göndermeden önce kontrol edin</small></span><span className="ml-auto text-[var(--tema-yerel-eczanem-yardimci-metin-19)]">⌄</span>
              </button>
              {adim === 2 && <div className="px-4 pb-4 sm:pl-14">
                <p className="mb-3 text-[11px] leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-20)]">Bu gönderim seçtiğiniz eczanelere hemen yapılır.</p>
                <div className="divide-y divide-[var(--tema-yerel-eczanem-cizgi-03)] rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-19)] text-xs">
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[var(--tema-yerel-eczanem-yardimci-metin-24)]">Yayın</span><strong className="text-[var(--tema-yerel-eczanem-ana-metin-11)]">{yayinlar.length} yayın</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[var(--tema-yerel-eczanem-yardimci-metin-24)]">Eczane</span><strong className="text-[var(--tema-yerel-eczanem-ana-metin-11)]">{gecerliSeciliIdler.length} eczane</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[var(--tema-yerel-eczanem-yardimci-metin-24)]">Gönderim</span><strong className="text-[var(--tema-yerel-eczanem-ana-metin-11)]">Şimdi</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[var(--tema-yerel-eczanem-yardimci-metin-24)]">Oluşturulacak kayıt</span><strong className="text-[var(--tema-yerel-eczanem-ana-metin-11)]">{yayinlar.length * gecerliSeciliIdler.length}</strong></div>
                </div>
                <ul className="mt-3 space-y-1 text-[11px] text-[var(--tema-yerel-eczanem-ana-metin-12)]">{yayinlar.map((yayin) => <li key={yayin.yayin_id}>{yayin.urun_adi} · {yayin.teknik_adi || "Öğrenme içeriği"}</li>)}</ul>
                <p className="mt-3 rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-18)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-13)] p-2.5 text-[10px] leading-4 text-[var(--tema-yerel-eczanem-yardimci-metin-22)]">Alıcılar: {eczaneler.filter((eczane) => gecerliSeciliIdler.includes(eczane.eczane_id)).map((eczane) => eczane.eczane_adi).join(", ")}</p>
                <div className="mt-4 flex justify-end"><button type="button" disabled={gonderiliyor || gecerliSeciliIdler.length === 0} onClick={() => void gonder()} className="rounded-lg bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eczanem-ters-metin-01)] disabled:cursor-not-allowed disabled:opacity-50">{gonderiliyor ? "Gönderiliyor…" : "Eczanelere gönder"}</button></div>
              </div>}
            </section>
            {panelHatasi && <p role="alert" className="rounded-lg bg-[var(--tema-yerel-eczanem-islevsel-zemin-19)] p-3 text-xs text-[var(--tema-yerel-eczanem-islevsel-metin-21)]">{panelHatasi}</p>}
          </div>
          <p className="border-t border-[var(--tema-yerel-eczanem-cizgi-07)] px-5 py-3 text-[10px] leading-4 text-[var(--tema-yerel-eczanem-yardimci-metin-25)] sm:px-6">Eczane, yayın ve inceleme koşulları gönderim anında yeniden denetlenir.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
