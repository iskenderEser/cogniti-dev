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
    {yayinlar.length > 0 && <div role="region" aria-label="Seçilen yayınlar" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-[650px] flex-wrap items-center gap-2 rounded-2xl bg-[#172b4d] px-4 py-3 text-white shadow-[0_16px_40px_rgba(23,43,77,0.3)] sm:bottom-5 sm:gap-3">
      <strong className="min-w-32 flex-1 text-sm">{yayinlar.length} yayın seçildi</strong>
      <span className="text-[10px] text-[#b8cade]">Uygun eczanelere anlık gönderim</span>
      <button type="button" onClick={onSecimTemizle} disabled={gonderiliyor} className="rounded-lg px-2 py-2 text-xs font-bold text-[#d5e2f0] hover:bg-white/10 disabled:opacity-50">Seçimi temizle</button>
      <button type="button" onClick={panelAc} disabled={gonderiliyor} className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-[#237ac8] hover:bg-[#edf5fc] disabled:opacity-50">Gönderim oluştur →</button>
    </div>}

    <Dialog.Root open={acik} onOpenChange={(sonraki) => { if (!sonraki && !gonderiliyor) setAcik(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#0f2746]/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[515px] flex-col bg-white shadow-[-10px_0_40px_rgba(13,40,70,0.2)]"
          onEscapeKeyDown={(event) => { if (gonderiliyor) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (gonderiliyor) event.preventDefault(); }}>
          <div className="flex items-start justify-between gap-4 border-b border-[#e6edf4] px-5 py-5 sm:px-6">
            <div><Dialog.Title className="text-xl font-extrabold text-[#172b4d]">Gönderim oluştur</Dialog.Title><Dialog.Description className="mt-1 text-xs text-[#74869a]">{yayinlar.length} yayın seçildi · Eczane dağıtımı</Dialog.Description></div>
            <Dialog.Close disabled={gonderiliyor} aria-label="Gönderim panelini kapat" className="flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-[#f1f5f9] text-xl text-[#49627e] disabled:opacity-50">×</Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
            <section className={`overflow-hidden rounded-xl border ${adim === 1 ? "border-[#9fc7e8] shadow-[0_0_0_2px_#cfe5f744]" : "border-[#e0e8f0] bg-[#fbfdff]"}`}>
              <button type="button" onClick={() => { if (!gonderiliyor) setAdim(1); }} aria-expanded={adim === 1} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 1 ? "bg-[#237ac8] text-white" : "bg-[#e7f6ee] text-[#188354]"}`}>{adim === 1 ? "1" : "✓"}</span>
                <span><strong className="block text-sm text-[#314b67]">Eczaneler</strong><small className="mt-0.5 block text-[10px] text-[#879aaf]">{adim === 1 ? "Uygun eczaneleri seçin" : `${gecerliSeciliIdler.length} eczane seçildi`}</small></span>
                <span className="ml-auto text-[#8da0b2]">⌄</span>
              </button>
              {adim === 1 && <div className="px-4 pb-4 sm:pl-14">
                <p className="mb-3 text-[11px] leading-5 text-[#657b93]">Seçili yayınların tamamını alabilecek eczaneleri seçin. Seçilemeyen eczanenin nedeni yanında gösterilir.</p>
                <input type="search" value={arama} onChange={(event) => setArama(event.target.value)} placeholder="Eczane ara…" aria-label="Eczane ara" className="w-full rounded-lg border border-[#d8e4ef] px-3 py-2.5 text-xs text-[#334d67]" />
                <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto">
                  {gorunenEczaneler.length === 0 && <p className="rounded-lg border border-[#e1e9f2] p-4 text-center text-xs text-[#8090a4]">Eşleşen eczane yok.</p>}
                  {gorunenEczaneler.map((eczane) => { const engel = eczaneEngeli(eczane); const secili = gecerliSeciliIdler.includes(eczane.eczane_id); return <label key={eczane.eczane_id} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${engel ? "border-[#e3e9ef] bg-[#f8fafc] opacity-75" : secili ? "cursor-pointer border-[#237ac8] bg-[#f0f8ff]" : "cursor-pointer border-[#dce6ef] bg-white hover:bg-[#f7fbff]"}`}>
                    <input type="checkbox" checked={secili} disabled={!!engel || gonderiliyor} onChange={(event) => setSeciliEczaneIdleri((onceki) => event.target.checked ? [...onceki, eczane.eczane_id] : onceki.filter((id) => id !== eczane.eczane_id))} className="mt-0.5 size-4 shrink-0 accent-[#237ac8]" />
                    <span className="min-w-0 flex-1"><span className="flex flex-wrap items-baseline gap-x-2"><strong className="text-xs text-[#2d4660]">{eczane.eczane_adi}</strong>{eczane.eczaci_ad_soyad && <span className="text-[11px] text-[#607b96]">Ecz. {eczane.eczaci_ad_soyad}</span>}</span><small className="mt-0.5 block text-[10px] text-[#8294a7]">{eczane.aktif_uye_sayisi} aktif danışan</small><small className={`mt-1 block text-[10px] leading-4 ${engel ? "text-[#a2643c]" : "text-[#28815c]"}`}>{engel ?? "Tüm seçili yayınlar için uygun"}</small></span>
                    {!engel && <span className="shrink-0 text-[10px] font-extrabold text-[#2e8962]">Uygun</span>}
                  </label>; })}
                </div>
                <p className="mt-3 rounded-lg border border-[#e2ecf5] bg-[#f4f8fc] p-2.5 text-[10px] leading-4 text-[#607b96]">Yalnız en az {esik} aktif danışanı olan ve seçili yayınları daha önce almamış eczaneler seçilebilir.</p>
                <div className="mt-4 flex justify-end"><button type="button" disabled={gecerliSeciliIdler.length === 0 || gonderiliyor} onClick={() => { setPanelHatasi(null); setAdim(2); }} className="rounded-lg bg-[#237ac8] px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">Devam et · Özet →</button></div>
              </div>}
            </section>
            <section className={`overflow-hidden rounded-xl border ${adim === 2 ? "border-[#9fc7e8] shadow-[0_0_0_2px_#cfe5f744]" : "border-[#e0e8f0]"}`}>
              <button type="button" disabled={gecerliSeciliIdler.length === 0 || gonderiliyor} onClick={() => setAdim(2)} aria-expanded={adim === 2} className="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:cursor-not-allowed">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${adim === 2 ? "bg-[#237ac8] text-white" : "bg-[#edf3f8] text-[#71869d]"}`}>2</span>
                <span><strong className="block text-sm text-[#314b67]">Özet</strong><small className="mt-0.5 block text-[10px] text-[#879aaf]">Göndermeden önce kontrol edin</small></span><span className="ml-auto text-[#8da0b2]">⌄</span>
              </button>
              {adim === 2 && <div className="px-4 pb-4 sm:pl-14">
                <p className="mb-3 text-[11px] leading-5 text-[#657b93]">Bu gönderim seçtiğiniz eczanelere hemen yapılır.</p>
                <div className="divide-y divide-[#edf2f7] rounded-lg border border-[#e0e9f1] text-xs">
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[#71849b]">Yayın</span><strong className="text-[#263e56]">{yayinlar.length} yayın</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[#71849b]">Eczane</span><strong className="text-[#263e56]">{gecerliSeciliIdler.length} eczane</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[#71849b]">Gönderim</span><strong className="text-[#263e56]">Şimdi</strong></div>
                  <div className="flex justify-between gap-3 px-3 py-2.5"><span className="text-[#71849b]">Oluşturulacak kayıt</span><strong className="text-[#263e56]">{yayinlar.length * gecerliSeciliIdler.length}</strong></div>
                </div>
                <ul className="mt-3 space-y-1 text-[11px] text-[#4d6680]">{yayinlar.map((yayin) => <li key={yayin.yayin_id}>{yayin.urun_adi} · {yayin.teknik_adi || "Öğrenme içeriği"}</li>)}</ul>
                <p className="mt-3 rounded-lg border border-[#e2ecf5] bg-[#f4f8fc] p-2.5 text-[10px] leading-4 text-[#607b96]">Alıcılar: {eczaneler.filter((eczane) => gecerliSeciliIdler.includes(eczane.eczane_id)).map((eczane) => eczane.eczane_adi).join(", ")}</p>
                <div className="mt-4 flex justify-end"><button type="button" disabled={gonderiliyor || gecerliSeciliIdler.length === 0} onClick={() => void gonder()} className="rounded-lg bg-[#237ac8] px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{gonderiliyor ? "Gönderiliyor…" : "Eczanelere gönder"}</button></div>
              </div>}
            </section>
            {panelHatasi && <p role="alert" className="rounded-lg bg-[#fff5df] p-3 text-xs text-amber-800">{panelHatasi}</p>}
          </div>
          <p className="border-t border-[#e7edf4] px-5 py-3 text-[10px] leading-4 text-[#7990a6] sm:px-6">Eczane, yayın ve inceleme koşulları gönderim anında yeniden denetlenir.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
