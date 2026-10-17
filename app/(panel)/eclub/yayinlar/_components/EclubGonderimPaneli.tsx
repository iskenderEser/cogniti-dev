"use client";
import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'radix-ui';
import { yayinAlicisiUygun } from '@/lib/eclub/yayinGonderimFiltreleri';
import { planHedefiniCoz, planTakvimSinirlari, gonderimSebebiYaz, gonderimTarihiYaz, gonderiIcinKalanGun } from '@/lib/eclub/gonderimEkrani';
import { trGunu } from '@/lib/zaman/kontrol';
import type { GonderimKontrolSonucu } from '@/lib/eclub/gonderimPlanTipleri';
import { ROL_ETIKETLERI } from '../../oneriler/_types';
import type { OneriKisi, OneriYayin, TopluGonderimSonucu } from '../../oneriler/_types';

interface Props {
  yayinlar: OneriYayin[]; kisiler: OneriKisi[]; veriSurumu: number; disabled: boolean; kaydediliyor: boolean;
  onBasarili: () => void;
  onSecimTemizle: () => void; bantGoster: boolean;
  kontrolEt: (yayinlar: string[], kisiler: string[], hedef: string | null, signal?: AbortSignal, tarihleriHesapla?: boolean) => Promise<TopluGonderimSonucu>;
  kaydet: (yayinlar: string[], kisiler: string[], hedef: string | null, anahtar: string) => Promise<TopluGonderimSonucu | null>;
}
interface Onay { anahtar: string; islemAnahtari: string; sonuc: TopluGonderimSonucu; kisiIdler: string[] }
export default function EclubGonderimPaneli({ yayinlar, kisiler, veriSurumu, disabled, kaydediliyor, onBasarili, onSecimTemizle, bantGoster, kontrolEt, kaydet }: Props) {
  const kayitKilit = useRef(false);
  const [acik, setAcik] = useState(false);
  const [adim, setAdim] = useState<1 | 2 | 3>(1);
  const [arama, setArama] = useState('');
  const [mod, setMod] = useState<'gonder' | 'planla'>('gonder');
  const [tarih, setTarih] = useState('');
  const [seciliKisiler, setSeciliKisiler] = useState<string[]>([]);
  const [simdi, setSimdi] = useState(() => Date.now());
  const [kontrol, setKontrol] = useState<{ anahtar: string; sonuclar: GonderimKontrolSonucu[]; hata: string | null }>({ anahtar: '', sonuclar: [], hata: null });
  const [ozetYukleniyor, setOzetYukleniyor] = useState(false);
  const [onay, setOnay] = useState<Onay | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [sonucMetinleri, setSonucMetinleri] = useState<string[]>([]);
  const [sonucBildirim, setSonucBildirim] = useState<string | null>(null);
  useEffect(() => { const id = window.setInterval(() => setSimdi(Date.now()), 60_000); return () => window.clearInterval(id); }, []);
  const hedef = mod === 'planla' ? planHedefiniCoz(tarih, new Date(simdi)) : { hedef: null, hata: null };
  const adaylar = yayinlar.length ? kisiler.filter(k => yayinlar.every(y => yayinAlicisiUygun(k, y)))
    .sort((a, b) => (a.eczane_adi ?? '').localeCompare(b.eczane_adi ?? '', 'tr') || a.ad.localeCompare(b.ad, 'tr')) : [];
  const yayinIdler = yayinlar.map(y => y.yayin_id);
  const anahtar = JSON.stringify({ yayinIdler, kisiIdler: adaylar.map(k => k.kisi_id), hedef: hedef.hedef,
    mod, veriSurumu, gun: trGunu(new Date(simdi)), gecerli: !hedef.hata, disabled });
  const incelemeHazir = yayinlar.length > 0 && yayinlar.every(y => y.gonderim_incelemesi_tamamlandi);
  useEffect(() => {
    const girdi = JSON.parse(anahtar) as { yayinIdler: string[]; kisiIdler: string[]; hedef: string | null; gecerli: boolean; disabled: boolean };
    if (!acik || adim !== 2 || !girdi.yayinIdler.length || !girdi.kisiIdler.length || !girdi.gecerli || girdi.disabled || !incelemeHazir) return;
    const abort = new AbortController(); let aktif = true;
    void (async () => {
      const sonuclar: GonderimKontrolSonucu[] = [];
      const adim = Math.min(100, Math.floor(300 / girdi.yayinIdler.length));
      for (let i = 0; i < girdi.kisiIdler.length; i += adim) {
        const veri = await kontrolEt(girdi.yayinIdler, girdi.kisiIdler.slice(i, i + adim), girdi.hedef, abort.signal);
        sonuclar.push(...veri.sonuclar);
      }
      if (aktif) setKontrol({ anahtar, sonuclar, hata: null });
    })().catch(e => { if (aktif) setKontrol({ anahtar, sonuclar: [], hata: e instanceof Error ? e.message : 'Uygunluk kontrolü tamamlanamadı.' }); });
    return () => { aktif = false; abort.abort(); };
  }, [acik, adim, anahtar, incelemeHazir, kontrolEt]);
  const sonuclar = kontrol.anahtar === anahtar ? kontrol.sonuclar : [];
  const kontrolBekleniyor = acik && adim === 2 && incelemeHazir && adaylar.length > 0 && !hedef.hata && kontrol.anahtar !== anahtar;
  const kontrolHatasi = kontrol.anahtar === anahtar ? kontrol.hata : null;
  const kisiSonuclari = (id: string) => sonuclar.filter(s => s.kisi_id === id);
  const uygunMu = (id: string) => { const s = kisiSonuclari(id); return s.length === yayinlar.length && s.every(r => r.uygun === true); };
  const seciliIdler = seciliKisiler.filter(id => adaylar.some(k => k.kisi_id === id) && uygunMu(id));
  const kilitli = disabled || kaydediliyor || ozetYukleniyor;
  const sinir = planTakvimSinirlari(new Date(simdi));
  const altBilgi = (k: OneriKisi) => {
    const s = kisiSonuclari(k.kisi_id); const engel = s.find(r => !r.uygun);
    if (engel) return `${k.eczane_adi ?? ''} · ${gonderimSebebiYaz(engel.sebep)}${engel.yeniden_gonderilebilir_at ? ` Önceki gönderimden sonra: ${gonderimTarihiYaz(engel.yeniden_gonderilebilir_at)}` : ''}`;
    const haklar = new Map(s.filter(r => r.urun_id).map(r => [r.urun_id, `${yayinlar.find(y => y.yayin_id === r.yayin_id)?.urun_adi ?? 'Ürün'}: ${r.haftalik_kalan_secim_sonrasi ?? r.haftalik_kalan ?? 0}`]));
    return `${k.eczane_adi ?? ''}${s.length ? ` · Seçim sonrası haftalık kalan: ${[...haklar.values()].join(', ')}` : ' · Uygunluk bekleniyor'}`;
  };
  const ozetAc = async () => {
    if (kilitli || !incelemeHazir || !seciliIdler.length || hedef.hata) return;
    setOzetYukleniyor(true); setMesaj(null); setSonucMetinleri([]);
    try {
      const veri = await kontrolEt(yayinIdler, seciliIdler, hedef.hedef, undefined, mod === 'planla');
      if (veri.sonuclar.some(s => !s.uygun)) {
        setMesaj('Gönderim koşulları değişti. Seçimi yeniden kontrol edin.');
        setSonucMetinleri(veri.sonuclar.filter(s => !s.uygun).map(s => `${kisiler.find(k => k.kisi_id === s.kisi_id)?.ad ?? 'Üye'} · ${yayinlar.find(y => y.yayin_id === s.yayin_id)?.urun_adi ?? 'Yayın'}: ${gonderimSebebiYaz(s.sebep)}`));
        setKontrol({ anahtar, sonuclar: [...sonuclar.filter(s => !seciliIdler.includes(s.kisi_id)), ...veri.sonuclar], hata: null });
        return;
      }
      setOnay({ anahtar, islemAnahtari: crypto.randomUUID(), sonuc: veri, kisiIdler: [...seciliIdler] });
      setAdim(3);
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Gönderim özeti alınamadı.'); }
    finally { setOzetYukleniyor(false); }
  };
  const onayla = async () => {
    if (!onay || onay.anahtar !== anahtar || kilitli || hedef.hata || kayitKilit.current) return;
    kayitKilit.current = true;
    try {
      const veri: TopluGonderimSonucu | null = await kaydet(yayinIdler, onay.kisiIdler, hedef.hedef, onay.islemAnahtari);
      if (!veri) return; // Yanıt kaybında aynı plan anahtarı korunur.
      setOnay(null); setMesaj(null); setSonucBildirim(veri.mesaj);
      setSonucMetinleri(veri.atlanan.map(s => `${kisiler.find(k => k.kisi_id === s.kisi_id)?.ad ?? 'Üye'} · ${yayinlar.find(y => y.yayin_id === s.yayin_id)?.urun_adi ?? 'Yayın'}: ${gonderimSebebiYaz(s.sebep)}`));
      if (veri.gonderilen_sayisi > 0 || veri.planlanan_sayisi > 0) { setAcik(false); setAdim(1); setSeciliKisiler([]); onBasarili(); }
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Gönderim işlemi tamamlanamadı.'); }
    finally { kayitKilit.current = false; }
  };
  const aramaDegeri = arama.trim().toLocaleLowerCase('tr-TR');
  const eczaneler = new Map<string, OneriKisi[]>();
  for (const kisi of adaylar) {
    const eczane = kisi.eczane_adi || 'Eczane adı belirtilmemiş';
    if (aramaDegeri && !`${eczane} ${kisi.ad} ${kisi.soyad}`.toLocaleLowerCase('tr-TR').includes(aramaDegeri)) continue;
    eczaneler.set(eczane, [...(eczaneler.get(eczane) ?? []), kisi]);
  }
  const secimKapasitesiDoldu = seciliIdler.length >= 100 || (seciliIdler.length + 1) * yayinlar.length > 300;
  const panelAc = () => {
    if (!yayinlar.length || disabled || kaydediliyor) return;
    setAcik(true); setAdim(1); setMod('gonder'); setTarih(''); setArama('');
    setSeciliKisiler([]); setOnay(null); setMesaj(null); setSonucMetinleri([]); setSonucBildirim(null);
  };
  const adimGeri = () => { setAdim(adim === 3 ? 2 : 1); setOnay(null); setMesaj(null); };

  return <>
    {bantGoster && yayinlar.length > 0 && <div role="region" aria-label="Seçilen yayınlar" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-[650px] flex-wrap items-center gap-2 rounded-2xl bg-[var(--tema-yerel-eclub-eylem-zemin-12)] px-4 py-3 text-[var(--tema-yerel-eclub-ters-metin-01)] shadow-[0_16px_40px_var(--tema-yerel-eclub-golge-10)] sm:bottom-5 sm:gap-3">
      <strong className="min-w-32 flex-1 text-sm">{yayinlar.length} yayın seçildi</strong>
      <button type="button" onClick={onSecimTemizle} disabled={kilitli} className="rounded-lg px-2 py-2 text-xs font-bold text-[var(--tema-yerel-eclub-yardimci-metin-33)] hover:bg-[var(--tema-yerel-eclub-kart-01)]/10 disabled:opacity-50">Seçimi temizle</button>
      <button type="button" onClick={panelAc} disabled={disabled || kaydediliyor} className="rounded-lg bg-[var(--tema-yerel-eclub-kart-01)] px-3 py-2 text-xs font-extrabold text-[var(--tema-yerel-eclub-eylem-metin-01)] hover:bg-[var(--tema-yerel-eclub-secim-zemin-12)] disabled:opacity-50">Gönderim oluştur →</button>
    </div>}

    <Dialog.Root open={acik} onOpenChange={acilsin => { if (!acilsin && !kilitli) setAcik(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[var(--tema-yerel-eclub-eylem-zemin-13)]/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[540px] flex-col bg-[var(--tema-yerel-eclub-kart-01)] shadow-[-10px_0_40px_var(--tema-yerel-eclub-golge-11)]"
          onEscapeKeyDown={e => { if (kilitli) e.preventDefault(); }} onPointerDownOutside={e => { if (kilitli) e.preventDefault(); }}>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--tema-yerel-eclub-cizgi-30)] px-5 py-5 sm:px-6">
            <div><Dialog.Title className="text-xl font-extrabold text-[var(--tema-yerel-eclub-ana-metin-01)]">Gönderim oluştur</Dialog.Title><Dialog.Description className="mt-1 text-xs text-[var(--tema-yerel-eclub-yardimci-metin-34)]">{yayinlar.length} yayın seçildi · Zaman, alıcı ve özet</Dialog.Description></div>
            <Dialog.Close disabled={kilitli} aria-label="Gönderim panelini kapat" className="flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-[var(--tema-yerel-eclub-sayfa-zemini-08)] text-xl text-[var(--tema-yerel-eclub-ana-metin-24)] disabled:opacity-50">×</Dialog.Close>
          </div>
          <div className="flex gap-4 border-b border-[var(--tema-yerel-eclub-cizgi-30)] px-5 text-[11px] font-extrabold sm:gap-6 sm:px-6" aria-label="Gönderim aşamaları">
            {(['Gönderim zamanı', 'Alıcılar', 'Özet'] as const).map((etiket, i) => <span key={etiket} aria-current={adim === i + 1 ? 'step' : undefined} className={`border-b-[3px] py-4 ${adim === i + 1 ? 'border-[var(--tema-yerel-eclub-cizgi-17)] text-[var(--tema-yerel-eclub-eylem-metin-01)]' : 'border-transparent text-[var(--tema-yerel-eclub-yardimci-metin-35)]'}`}>{i + 1} · {etiket}</span>)}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            {adim === 1 && <section aria-label="Gönderim zamanı">
              <h3 className="text-base font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">Ne zaman gönderilsin?</h3>
              <p className="mt-1 mb-5 text-xs leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-34)]">Şimdi gönderin veya yalnızca gönderim gününü seçin.</p>
              {([{ deger: 'gonder', baslik: 'Şimdi gönder', aciklama: 'Uygun alıcılara hemen gönderim yapılır.' }, { deger: 'planla', baslik: 'Bir güne planla', aciklama: 'Gönderim seçtiğiniz gün işlenir.' }] as const).map(secenek => <button key={secenek.deger} type="button" onClick={() => { setMod(secenek.deger); setOnay(null); setMesaj(null); }} disabled={kilitli}
                aria-pressed={mod === secenek.deger} className={`mb-2 flex w-full items-start gap-3 rounded-xl border p-4 text-left ${mod === secenek.deger ? 'border-[var(--tema-yerel-eclub-cizgi-17)] bg-[var(--tema-yerel-eclub-secim-zemin-03)] ring-1 ring-[var(--tema-yerel-eclub-odak-03)]' : 'border-[var(--tema-yerel-eclub-cizgi-31)] bg-[var(--tema-yerel-eclub-kart-01)]'}`}>
                <span aria-hidden="true" className={`mt-0.5 size-[18px] shrink-0 rounded-full border-2 ${mod === secenek.deger ? 'border-[5px] border-[var(--tema-yerel-eclub-cizgi-17)]' : 'border-[var(--tema-yerel-eclub-cizgi-32)]'}`} />
                <span><strong className="block text-sm text-[var(--tema-yerel-eclub-ana-metin-06)]">{secenek.baslik}</strong><small className="mt-1 block text-xs text-[var(--tema-yerel-eclub-yardimci-metin-36)]">{secenek.aciklama}</small></span>
              </button>)}
              {mod === 'planla' && <label className="mt-5 block text-xs font-extrabold text-[var(--tema-yerel-eclub-ana-metin-25)]">Gönderim günü
                <input type="date" aria-label="Gönderim günü" value={tarih} min={sinir.min} max={sinir.max} disabled={kilitli} onChange={e => { setTarih(e.target.value); setOnay(null); setMesaj(null); }} className="mt-2 block w-full rounded-lg border border-[var(--tema-yerel-eclub-cizgi-33)] bg-[var(--tema-yerel-eclub-kart-01)] px-3 py-2.5 text-sm text-[var(--tema-yerel-eclub-ana-metin-06)]" />
              </label>}
              {mod === 'planla' && <p className="mt-3 text-xs leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-34)]">Pazartesi–Cuma · En fazla takip eden hafta · Yalnız mevcut iki aylık dönem</p>}
              {mod === 'planla' && tarih && hedef.hata && <p role="alert" className="mt-3 text-xs text-[var(--tema-yerel-eclub-islevsel-metin-09)]">{hedef.hata}</p>}
              {!incelemeHazir && <p role="alert" className="mt-4 rounded-lg bg-[var(--tema-yerel-eclub-islevsel-zemin-22)] p-3 text-xs text-[var(--tema-yerel-eclub-islevsel-metin-36)]">Seçili yayınları göndermeden önce incelemelerini tamamlayın.</p>}
            </section>}

            {adim === 2 && <section aria-label="Alıcılar">
              <h3 className="text-base font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">Alıcıları seçin</h3>
              <p className="mt-1 mb-5 text-xs leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-34)]">Üyeler eczanelerine göre listelenir. Uygun olmayan alıcıların nedeni yanında görünür.</p>
              <label className="mb-4 block text-xs font-extrabold text-[var(--tema-yerel-eclub-ana-metin-25)]">Eczane veya kişi ara<input type="search" value={arama} onChange={e => setArama(e.target.value)} placeholder="Ara…" className="mt-2 block w-full rounded-lg border border-[var(--tema-yerel-eclub-cizgi-33)] px-3 py-2.5 text-sm" /></label>
              {kontrolBekleniyor && <p role="status" className="mb-3 text-xs text-[var(--tema-yerel-eclub-yardimci-metin-01)]">Alıcıların gönderim uygunluğu kontrol ediliyor…</p>}
              {kontrolHatasi && <p role="alert" className="mb-3 text-xs text-[var(--tema-yerel-eclub-islevsel-metin-09)]">{kontrolHatasi}</p>}
              {adaylar.length === 0 && <p className="rounded-xl border border-[var(--tema-yerel-eclub-cizgi-34)] p-5 text-center text-xs text-[var(--tema-yerel-eclub-yardimci-metin-32)]">Seçilen yayınların tümüne uygun alıcı bulunmuyor.</p>}
              {adaylar.length > 0 && eczaneler.size === 0 && <p className="rounded-xl border border-[var(--tema-yerel-eclub-cizgi-34)] p-5 text-center text-xs text-[var(--tema-yerel-eclub-yardimci-metin-32)]">Aramayla eşleşen eczane veya kişi yok.</p>}
              {[...eczaneler].map(([eczane, uyeler]) => <div key={eczane} className="mb-3 overflow-hidden rounded-xl border border-[var(--tema-yerel-eclub-cizgi-34)]">
                <div className="flex items-center justify-between gap-2 bg-[var(--tema-yerel-eclub-sayfa-zemini-10)] px-3 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]"><span>{eczane}</span><span className="text-[10px] text-[var(--tema-yerel-eclub-yardimci-metin-37)]">{uyeler.filter(k => uygunMu(k.kisi_id)).length} uygun kişi</span></div>
                {uyeler.map(k => { const uygun = uygunMu(k.kisi_id); const secili = seciliIdler.includes(k.kisi_id); const engel = kisiSonuclari(k.kisi_id).find(s => !s.uygun); const kalanGun = gonderiIcinKalanGun(kisiSonuclari(k.kisi_id), simdi); return <label key={k.kisi_id} className={`flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--tema-yerel-eclub-cizgi-06)] px-3 py-2.5 text-xs sm:flex-nowrap ${uygun ? 'cursor-pointer' : 'opacity-60'}`}>
                  <input type="checkbox" checked={secili} disabled={!uygun || kilitli || (!secili && secimKapasitesiDoldu)} onChange={e => { setSeciliKisiler(onceki => e.target.checked ? [...onceki, k.kisi_id] : onceki.filter(id => id !== k.kisi_id)); setOnay(null); setMesaj(null); }} className="size-4 shrink-0 accent-[var(--tema-yerel-eclub-eylem-metin-01)]" />
                  <span className="min-w-0 flex-1 truncate font-bold text-[var(--tema-yerel-eclub-ana-metin-06)]">{k.ad} {k.soyad}<span className="ml-1 font-normal text-[var(--tema-yerel-eclub-yardimci-metin-38)]">· {ROL_ETIKETLERI[k.rol]}</span></span>
                  <span className={`w-full pl-6 text-left text-[10px] leading-4 sm:ml-auto sm:w-auto sm:shrink-0 sm:whitespace-nowrap sm:pl-0 sm:text-right ${uygun ? 'font-bold text-[var(--tema-yerel-eclub-islevsel-metin-37)]' : 'text-[var(--tema-yerel-eclub-islevsel-metin-38)]'}`} title={kalanGun !== null ? undefined : altBilgi(k)}>{kalanGun !== null ? <>⏳ Gönderi için kalan süre: {kalanGun} gün</> : uygun ? 'Uygun' : engel ? gonderimSebebiYaz(engel.sebep) : kontrolBekleniyor ? 'Kontrol ediliyor' : 'Uygunluk alınamadı'}</span>
                </label>; })}
              </div>)}
              <p className="mt-3 text-[11px] text-[var(--tema-yerel-eclub-yardimci-metin-34)]">{seciliIdler.length} alıcı seçildi · Tek işlemde en fazla 100 alıcı ve 300 yayın–alıcı seçimi</p>
            </section>}

            {adim === 3 && onay && <section aria-label="Gönderim özeti">
              <h3 className="text-base font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">Gönderimi gözden geçirin</h3>
              <p className="mt-1 mb-5 text-xs leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-34)]">Kaydetmeden önce kısa özeti kontrol edin.</p>
              <div className="divide-y divide-[var(--tema-yerel-eclub-cizgi-35)] rounded-xl border border-[var(--tema-yerel-eclub-cizgi-34)] p-4 text-xs text-[var(--tema-yerel-eclub-yardimci-metin-39)]">
                <div className="flex justify-between gap-4 py-2"><span>Yayın</span><strong className="text-right text-[var(--tema-yerel-eclub-ana-metin-06)]">{yayinlar.length} yayın</strong></div>
                <div className="flex justify-between gap-4 py-2"><span>Gönderim</span><strong className="text-right text-[var(--tema-yerel-eclub-ana-metin-06)]">{hedef.hedef ? gonderimTarihiYaz(hedef.hedef) : 'Şimdi'}</strong></div>
                <div className="flex justify-between gap-4 py-2"><span>Seçilen alıcı</span><strong className="text-right text-[var(--tema-yerel-eclub-ana-metin-06)]">{onay.kisiIdler.length} kişi</strong></div>
                <div className="flex justify-between gap-4 py-2"><span>{mod === 'planla' ? 'Plan kaydı' : 'Gönderim'}</span><strong className="text-right text-[var(--tema-yerel-eclub-ana-metin-06)]">{onay.sonuc.sonuclar.length} kayıt</strong></div>
              </div>
              <details className="mt-4 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-34)] p-3 text-xs text-[var(--tema-yerel-eclub-yardimci-metin-39)]"><summary className="cursor-pointer font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">Yayın ve alıcı ayrıntılarını göster</summary>
                <div className="mt-3 space-y-2 border-t border-[var(--tema-yerel-eclub-cizgi-35)] pt-3">
                  <p className="font-bold">Yayınlar: {yayinlar.map(y => y.urun_adi).join(', ')}</p>
                  <p className="font-bold">Alıcılar: {kisiler.filter(k => onay.kisiIdler.includes(k.kisi_id)).map(k => `${k.ad} ${k.soyad}`).join(', ')}</p>
                  {onay.sonuc.sonuclar.map(s => <p key={`${s.yayin_id}:${s.kisi_id}`}>{kisiler.find(k => k.kisi_id === s.kisi_id)?.ad} · {yayinlar.find(y => y.yayin_id === s.yayin_id)?.urun_adi} · {s.tekrar_durumu === 'ilk_gonderim' ? 'İlk gönderim' : `Yeniden gönderim · Dönem tekrarı ${s.adayla_donemlik_tekrar}/2`}</p>)}
                  {onay.sonuc.haftalik_ozet.map(s => <p key={`${s.kisi_id}:${s.urun_id}`}>{kisiler.find(k => k.kisi_id === s.kisi_id)?.ad} · seçim sonrası haftalık {s.haftalik_kalan} hak</p>)}
                </div>
              </details>
              {mod === 'planla' && <p className="mt-4 rounded-lg bg-[var(--tema-yerel-eclub-sayfa-zemini-18)] p-3 text-xs leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-40)]">Plan kaydı üyeye hemen yayın veya bildirim göndermez. Tamamlama süresi gerçek gönderimde başlar.</p>}
              {!!onay.sonuc.uygun_tarihler.some(t => t !== hedef.hedef) && <p className="mt-3 text-xs text-[var(--tema-yerel-eclub-yardimci-metin-40)]">Diğer uygun tarihler: {onay.sonuc.uygun_tarihler.filter(t => t !== hedef.hedef).map(gonderimTarihiYaz).join(' · ')}</p>}
            </section>}
            {mesaj && <p role="alert" className="mt-5 rounded-lg bg-[var(--tema-yerel-eclub-islevsel-zemin-23)] p-3 text-xs text-[var(--tema-yerel-eclub-islevsel-metin-09)]">{mesaj}</p>}
            {sonucMetinleri.length > 0 && mesaj && <details className="mt-3 text-xs text-[var(--tema-yerel-eclub-islevsel-metin-09)]"><summary>Ayrıntılar</summary><ul className="mt-2 list-disc space-y-1 pl-4">{sonucMetinleri.map((satir, i) => <li key={i}>{satir}</li>)}</ul></details>}
          </div>

          <div className="flex justify-between gap-2 border-t border-[var(--tema-yerel-eclub-cizgi-30)] px-5 py-4 sm:px-6">
            {adim > 1 ? <button type="button" disabled={kilitli} onClick={adimGeri} className="rounded-lg border border-[var(--tema-yerel-eclub-cizgi-36)] bg-[var(--tema-yerel-eclub-kart-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eclub-yardimci-metin-41)] disabled:opacity-50">Geri</button> : <span />}
            {adim === 1 ? <button type="button" disabled={kilitli || !incelemeHazir || !!hedef.hata} onClick={() => { setAdim(2); setMesaj(null); }} className="rounded-lg bg-[var(--tema-yerel-eclub-eylem-zemin-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eclub-ters-metin-01)] disabled:cursor-not-allowed disabled:opacity-50">Devam et →</button>
              : adim === 2 ? <button type="button" disabled={kilitli || !seciliIdler.length || !!hedef.hata || kontrolBekleniyor || !!kontrolHatasi} onClick={() => void ozetAc()} className="rounded-lg bg-[var(--tema-yerel-eclub-eylem-zemin-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eclub-ters-metin-01)] disabled:cursor-not-allowed disabled:opacity-50">{ozetYukleniyor ? 'Kontrol ediliyor…' : 'Özeti göster →'}</button>
              : <button type="button" disabled={kilitli || !onay || onay.anahtar !== anahtar || !!hedef.hata} onClick={() => void onayla()} className="rounded-lg bg-[var(--tema-yerel-eclub-eylem-zemin-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-eclub-ters-metin-01)] disabled:cursor-not-allowed disabled:opacity-50">{kaydediliyor ? 'Kaydediliyor…' : mod === 'planla' ? 'Planı kaydet' : 'Gönderimi oluştur'}</button>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {sonucBildirim && <div role="status" className="fixed bottom-4 right-4 z-[110] max-w-sm rounded-xl border border-[var(--tema-yerel-eclub-cizgi-37)] bg-[var(--tema-yerel-eclub-kart-01)] p-4 text-xs text-[var(--tema-yerel-eclub-ana-metin-25)] shadow-xl">
      <div className="flex items-start gap-3"><p className="flex-1 font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">{sonucBildirim}</p><button type="button" onClick={() => setSonucBildirim(null)} aria-label="Sonuç bildirimini kapat" className="text-lg text-[var(--tema-yerel-eclub-yardimci-metin-34)]">×</button></div>
      {sonucMetinleri.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-bold">Atlanan {sonucMetinleri.length} kayıt</summary><ul className="mt-2 list-disc space-y-1 pl-4">{sonucMetinleri.map((satir, i) => <li key={i}>{satir}</li>)}</ul></details>}
    </div>}
  </>;
}
