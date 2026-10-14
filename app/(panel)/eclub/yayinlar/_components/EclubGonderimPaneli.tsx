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
    {bantGoster && yayinlar.length > 0 && <div role="region" aria-label="Seçilen yayınlar" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-[650px] flex-wrap items-center gap-2 rounded-2xl bg-[#172b4d] px-4 py-3 text-white shadow-[0_16px_40px_rgba(23,43,77,0.3)] sm:bottom-5 sm:gap-3">
      <strong className="min-w-32 flex-1 text-sm">{yayinlar.length} yayın seçildi</strong>
      <button type="button" onClick={onSecimTemizle} disabled={kilitli} className="rounded-lg px-2 py-2 text-xs font-bold text-[#d5e2f0] hover:bg-white/10 disabled:opacity-50">Seçimi temizle</button>
      <button type="button" onClick={panelAc} disabled={disabled || kaydediliyor} className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-[#237ac8] hover:bg-[#edf5fc] disabled:opacity-50">Gönderim oluştur →</button>
    </div>}

    <Dialog.Root open={acik} onOpenChange={acilsin => { if (!acilsin && !kilitli) setAcik(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#0f2746]/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[540px] flex-col bg-white shadow-[-10px_0_40px_rgba(13,40,70,0.2)]"
          onEscapeKeyDown={e => { if (kilitli) e.preventDefault(); }} onPointerDownOutside={e => { if (kilitli) e.preventDefault(); }}>
          <div className="flex items-start justify-between gap-4 border-b border-[#e6edf4] px-5 py-5 sm:px-6">
            <div><Dialog.Title className="text-xl font-extrabold text-[#172b4d]">Gönderim oluştur</Dialog.Title><Dialog.Description className="mt-1 text-xs text-[#74869a]">{yayinlar.length} yayın seçildi · Zaman, alıcı ve özet</Dialog.Description></div>
            <Dialog.Close disabled={kilitli} aria-label="Gönderim panelini kapat" className="flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-[#f1f5f9] text-xl text-[#49627e] disabled:opacity-50">×</Dialog.Close>
          </div>
          <div className="flex gap-4 border-b border-[#e6edf4] px-5 text-[11px] font-extrabold sm:gap-6 sm:px-6" aria-label="Gönderim aşamaları">
            {(['Gönderim zamanı', 'Alıcılar', 'Özet'] as const).map((etiket, i) => <span key={etiket} aria-current={adim === i + 1 ? 'step' : undefined} className={`border-b-[3px] py-4 ${adim === i + 1 ? 'border-[#237ac8] text-[#237ac8]' : 'border-transparent text-[#8a9aae]'}`}>{i + 1} · {etiket}</span>)}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            {adim === 1 && <section aria-label="Gönderim zamanı">
              <h3 className="text-base font-extrabold text-[#203653]">Ne zaman gönderilsin?</h3>
              <p className="mt-1 mb-5 text-xs leading-5 text-[#74869a]">Şimdi gönderin veya yalnızca gönderim gününü seçin.</p>
              {([{ deger: 'gonder', baslik: 'Şimdi gönder', aciklama: 'Uygun alıcılara hemen gönderim yapılır.' }, { deger: 'planla', baslik: 'Bir güne planla', aciklama: 'Gönderim seçtiğiniz gün işlenir.' }] as const).map(secenek => <button key={secenek.deger} type="button" onClick={() => { setMod(secenek.deger); setOnay(null); setMesaj(null); }} disabled={kilitli}
                aria-pressed={mod === secenek.deger} className={`mb-2 flex w-full items-start gap-3 rounded-xl border p-4 text-left ${mod === secenek.deger ? 'border-[#237ac8] bg-[#f0f7fe] ring-1 ring-[#237ac8]' : 'border-[#dce5ef] bg-white'}`}>
                <span aria-hidden="true" className={`mt-0.5 size-[18px] shrink-0 rounded-full border-2 ${mod === secenek.deger ? 'border-[5px] border-[#237ac8]' : 'border-[#b7c7d8]'}`} />
                <span><strong className="block text-sm text-[#203653]">{secenek.baslik}</strong><small className="mt-1 block text-xs text-[#768aa1]">{secenek.aciklama}</small></span>
              </button>)}
              {mod === 'planla' && <label className="mt-5 block text-xs font-extrabold text-[#405976]">Gönderim günü
                <input type="date" aria-label="Gönderim günü" value={tarih} min={sinir.min} max={sinir.max} disabled={kilitli} onChange={e => { setTarih(e.target.value); setOnay(null); setMesaj(null); }} className="mt-2 block w-full rounded-lg border border-[#cfdae7] bg-white px-3 py-2.5 text-sm text-[#203653]" />
              </label>}
              {mod === 'planla' && <p className="mt-3 text-xs leading-5 text-[#74869a]">Pazartesi–Cuma · En fazla takip eden hafta · Yalnız mevcut iki aylık dönem</p>}
              {mod === 'planla' && tarih && hedef.hata && <p role="alert" className="mt-3 text-xs text-amber-800">{hedef.hata}</p>}
              {!incelemeHazir && <p role="alert" className="mt-4 rounded-lg bg-[#fff3f1] p-3 text-xs text-[#ad625c]">Seçili yayınları göndermeden önce incelemelerini tamamlayın.</p>}
            </section>}

            {adim === 2 && <section aria-label="Alıcılar">
              <h3 className="text-base font-extrabold text-[#203653]">Alıcıları seçin</h3>
              <p className="mt-1 mb-5 text-xs leading-5 text-[#74869a]">Üyeler eczanelerine göre listelenir. Uygun olmayan alıcıların nedeni yanında görünür.</p>
              <label className="mb-4 block text-xs font-extrabold text-[#405976]">Eczane veya kişi ara<input type="search" value={arama} onChange={e => setArama(e.target.value)} placeholder="Ara…" className="mt-2 block w-full rounded-lg border border-[#cfdae7] px-3 py-2.5 text-sm" /></label>
              {kontrolBekleniyor && <p role="status" className="mb-3 text-xs text-[#6b7f9b]">Alıcıların gönderim uygunluğu kontrol ediliyor…</p>}
              {kontrolHatasi && <p role="alert" className="mb-3 text-xs text-amber-800">{kontrolHatasi}</p>}
              {adaylar.length === 0 && <p className="rounded-xl border border-[#e1e9f2] p-5 text-center text-xs text-[#8090a4]">Seçilen yayınların tümüne uygun alıcı bulunmuyor.</p>}
              {adaylar.length > 0 && eczaneler.size === 0 && <p className="rounded-xl border border-[#e1e9f2] p-5 text-center text-xs text-[#8090a4]">Aramayla eşleşen eczane veya kişi yok.</p>}
              {[...eczaneler].map(([eczane, uyeler]) => <div key={eczane} className="mb-3 overflow-hidden rounded-xl border border-[#e1e9f2]">
                <div className="flex items-center justify-between gap-2 bg-[#f6f9fc] px-3 py-2.5 text-xs font-extrabold text-[#203653]"><span>{eczane}</span><span className="text-[10px] text-[#778ba2]">{uyeler.filter(k => uygunMu(k.kisi_id)).length} uygun kişi</span></div>
                {uyeler.map(k => { const uygun = uygunMu(k.kisi_id); const secili = seciliIdler.includes(k.kisi_id); const engel = kisiSonuclari(k.kisi_id).find(s => !s.uygun); const kalanGun = gonderiIcinKalanGun(kisiSonuclari(k.kisi_id), simdi); return <label key={k.kisi_id} className={`flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#edf1f5] px-3 py-2.5 text-xs sm:flex-nowrap ${uygun ? 'cursor-pointer' : 'opacity-60'}`}>
                  <input type="checkbox" checked={secili} disabled={!uygun || kilitli || (!secili && secimKapasitesiDoldu)} onChange={e => { setSeciliKisiler(onceki => e.target.checked ? [...onceki, k.kisi_id] : onceki.filter(id => id !== k.kisi_id)); setOnay(null); setMesaj(null); }} className="size-4 shrink-0 accent-[#237ac8]" />
                  <span className="min-w-0 flex-1 truncate font-bold text-[#203653]">{k.ad} {k.soyad}<span className="ml-1 font-normal text-[#8798aa]">· {ROL_ETIKETLERI[k.rol]}</span></span>
                  <span className={`w-full pl-6 text-left text-[10px] leading-4 sm:ml-auto sm:w-auto sm:shrink-0 sm:whitespace-nowrap sm:pl-0 sm:text-right ${uygun ? 'font-bold text-[#2b8555]' : 'text-[#aa7727]'}`} title={kalanGun !== null ? undefined : altBilgi(k)}>{kalanGun !== null ? <>⏳ Gönderi için kalan süre: {kalanGun} gün</> : uygun ? 'Uygun' : engel ? gonderimSebebiYaz(engel.sebep) : kontrolBekleniyor ? 'Kontrol ediliyor' : 'Uygunluk alınamadı'}</span>
                </label>; })}
              </div>)}
              <p className="mt-3 text-[11px] text-[#74869a]">{seciliIdler.length} alıcı seçildi · Tek işlemde en fazla 100 alıcı ve 300 yayın–alıcı seçimi</p>
            </section>}

            {adim === 3 && onay && <section aria-label="Gönderim özeti">
              <h3 className="text-base font-extrabold text-[#203653]">Gönderimi gözden geçirin</h3>
              <p className="mt-1 mb-5 text-xs leading-5 text-[#74869a]">Kaydetmeden önce kısa özeti kontrol edin.</p>
              <div className="divide-y divide-[#edf2f7] rounded-xl border border-[#e1e9f2] p-4 text-xs text-[#516982]">
                <div className="flex justify-between gap-4 py-2"><span>Yayın</span><strong className="text-right text-[#203653]">{yayinlar.length} yayın</strong></div>
                <div className="flex justify-between gap-4 py-2"><span>Gönderim</span><strong className="text-right text-[#203653]">{hedef.hedef ? gonderimTarihiYaz(hedef.hedef) : 'Şimdi'}</strong></div>
                <div className="flex justify-between gap-4 py-2"><span>Seçilen alıcı</span><strong className="text-right text-[#203653]">{onay.kisiIdler.length} kişi</strong></div>
                <div className="flex justify-between gap-4 py-2"><span>{mod === 'planla' ? 'Plan kaydı' : 'Gönderim'}</span><strong className="text-right text-[#203653]">{onay.sonuc.sonuclar.length} kayıt</strong></div>
              </div>
              <details className="mt-4 rounded-xl border border-[#e1e9f2] p-3 text-xs text-[#516982]"><summary className="cursor-pointer font-extrabold text-[#203653]">Yayın ve alıcı ayrıntılarını göster</summary>
                <div className="mt-3 space-y-2 border-t border-[#edf2f7] pt-3">
                  <p className="font-bold">Yayınlar: {yayinlar.map(y => y.urun_adi).join(', ')}</p>
                  <p className="font-bold">Alıcılar: {kisiler.filter(k => onay.kisiIdler.includes(k.kisi_id)).map(k => `${k.ad} ${k.soyad}`).join(', ')}</p>
                  {onay.sonuc.sonuclar.map(s => <p key={`${s.yayin_id}:${s.kisi_id}`}>{kisiler.find(k => k.kisi_id === s.kisi_id)?.ad} · {yayinlar.find(y => y.yayin_id === s.yayin_id)?.urun_adi} · {s.tekrar_durumu === 'ilk_gonderim' ? 'İlk gönderim' : `Yeniden gönderim · Dönem tekrarı ${s.adayla_donemlik_tekrar}/2`}</p>)}
                  {onay.sonuc.haftalik_ozet.map(s => <p key={`${s.kisi_id}:${s.urun_id}`}>{kisiler.find(k => k.kisi_id === s.kisi_id)?.ad} · seçim sonrası haftalık {s.haftalik_kalan} hak</p>)}
                </div>
              </details>
              {mod === 'planla' && <p className="mt-4 rounded-lg bg-[#f5f8fc] p-3 text-xs leading-5 text-[#687f98]">Plan kaydı üyeye hemen yayın veya bildirim göndermez. Tamamlama süresi gerçek gönderimde başlar.</p>}
              {!!onay.sonuc.uygun_tarihler.some(t => t !== hedef.hedef) && <p className="mt-3 text-xs text-[#687f98]">Diğer uygun tarihler: {onay.sonuc.uygun_tarihler.filter(t => t !== hedef.hedef).map(gonderimTarihiYaz).join(' · ')}</p>}
            </section>}
            {mesaj && <p role="alert" className="mt-5 rounded-lg bg-[#fff5df] p-3 text-xs text-amber-800">{mesaj}</p>}
            {sonucMetinleri.length > 0 && mesaj && <details className="mt-3 text-xs text-amber-800"><summary>Ayrıntılar</summary><ul className="mt-2 list-disc space-y-1 pl-4">{sonucMetinleri.map((satir, i) => <li key={i}>{satir}</li>)}</ul></details>}
          </div>

          <div className="flex justify-between gap-2 border-t border-[#e6edf4] px-5 py-4 sm:px-6">
            {adim > 1 ? <button type="button" disabled={kilitli} onClick={adimGeri} className="rounded-lg border border-[#d9e3ed] bg-white px-4 py-2.5 text-xs font-extrabold text-[#55708d] disabled:opacity-50">Geri</button> : <span />}
            {adim === 1 ? <button type="button" disabled={kilitli || !incelemeHazir || !!hedef.hata} onClick={() => { setAdim(2); setMesaj(null); }} className="rounded-lg bg-[#237ac8] px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">Devam et →</button>
              : adim === 2 ? <button type="button" disabled={kilitli || !seciliIdler.length || !!hedef.hata || kontrolBekleniyor || !!kontrolHatasi} onClick={() => void ozetAc()} className="rounded-lg bg-[#237ac8] px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{ozetYukleniyor ? 'Kontrol ediliyor…' : 'Özeti göster →'}</button>
              : <button type="button" disabled={kilitli || !onay || onay.anahtar !== anahtar || !!hedef.hata} onClick={() => void onayla()} className="rounded-lg bg-[#237ac8] px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{kaydediliyor ? 'Kaydediliyor…' : mod === 'planla' ? 'Planı kaydet' : 'Gönderimi oluştur'}</button>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {sonucBildirim && <div role="status" className="fixed bottom-4 right-4 z-[110] max-w-sm rounded-xl border border-[#dce8f2] bg-white p-4 text-xs text-[#405976] shadow-xl">
      <div className="flex items-start gap-3"><p className="flex-1 font-extrabold text-[#203653]">{sonucBildirim}</p><button type="button" onClick={() => setSonucBildirim(null)} aria-label="Sonuç bildirimini kapat" className="text-lg text-[#74869a]">×</button></div>
      {sonucMetinleri.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-bold">Atlanan {sonucMetinleri.length} kayıt</summary><ul className="mt-2 list-disc space-y-1 pl-4">{sonucMetinleri.map((satir, i) => <li key={i}>{satir}</li>)}</ul></details>}
    </div>}
  </>;
}
