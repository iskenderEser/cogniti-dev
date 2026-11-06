"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";
import { SoruSetiAyarlari } from "@/app/(panel)/talepler/_components/SoruSetiAyarlari";
import { SoruIceAktar } from "@/components/SoruIceAktar";
import { SoruSetiFormu } from "@/components/SoruSetiFormu";
import { TALEP_TURU_KURALLARI, TALEP_TURU_SIRA, type TalepTuru } from "@/lib/uretici/yetenekler";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";
import { taslaklariBoyutla, taslaklariDogrula } from "@/lib/soru/taslak";
import { bosPartnerEgitimFormu, partnerEgitimFormDogrula, partnerKelimeSayisi, partnerAciklamaSinirla, type PartnerEgitimFormVerisi } from "@/lib/agora/partnerEgitimFormu";
import { egitimAdiDogrula } from "@/lib/agora/partnerEgitimleri";
import type { PartnerEgitimi } from "@/lib/agora/partnerEgitimleri";
import PartnerMedyaAlanlari from "./PartnerMedyaAlanlari";
import styles from "./egitimler.module.css";

export type PartnerEgitimFormKaydi=Pick<PartnerEgitimi,"egitim_id"|"egitim_adi"|"surum"|"durum"|"yayin_araci">;

export default function PartnerEgitimFormu({ egitim, istekId, onKapat, onKaydedildi, onIslem, onDegisiklik, saltOkunur=false, baslikGoster=true, ikiSutun=false }: {
  egitim: PartnerEgitimFormKaydi | null; istekId: string; onKapat?: () => void; onKaydedildi: () => Promise<void>; onIslem: (aktif: boolean) => void;
  onDegisiklik?: (degisti:boolean)=>void; saltOkunur?:boolean; baslikGoster?:boolean; ikiSutun?:boolean;
}) {
  const [form, setForm] = useState<PartnerEgitimFormVerisi>(() => ({ ...bosPartnerEgitimFormu(), egitim_adi: egitim?.egitim_adi ?? "", yayin_araci: egitim?.yayin_araci ?? "video", soru_taslaklari: taslaklariBoyutla([],10,2) }));
  const [eklerDegisti,setEklerDegisti]=useState(false);
  const aciklamaRef=useRef<HTMLTextAreaElement>(null);
  const baslangicVerisi=useRef(JSON.stringify(form));
  const [egitimId, setEgitimId] = useState(egitim?.egitim_id ?? null);
  const [medyaYukleniyor, setMedyaYukleniyor] = useState(false);
  const [medyaHazirligi, setMedyaHazirligi] = useState<{egitimId:string|null;tur:"video"|"podcast";hazir:boolean}|null>(null);
  const [surum, setSurum] = useState(egitim?.surum ?? 0);
  const [yukleniyor, setYukleniyor] = useState(!!egitim);
  const [okundu, setOkundu] = useState(!egitim);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kayitTamamlandi, setKayitTamamlandi] = useState(false);
  const [hata, setHata] = useState("");
  const [uyari, setUyari] = useState("");
  const [aktarimdaAcilanSoruSayisi, setAktarimdaAcilanSoruSayisi] = useState(0);
  const kilit = useRef(false), adInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!egitim) return;
    const c = new AbortController();
    void (async () => {
      try {
        const r = await fetch(`/partner/api/egitimler?egitim_id=${egitim.egitim_id}`, { cache: "no-store", signal: AbortSignal.any([c.signal, AbortSignal.timeout(15000)]) });
        const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Eğitim okunamadı.");
        if (!c.signal.aborted) { const bilgiler = { ...bosPartnerEgitimFormu(), ...d.bilgiler, egitim_adi: d.egitim_adi }; const yuklenen={ ...bilgiler, soru_taslaklari: taslaklariBoyutla(bilgiler.soru_taslaklari, bilgiler.soru_seti_buyuklugu, bilgiler.secenek_sayisi) }; baslangicVerisi.current=JSON.stringify(yuklenen); setForm(yuklenen); setSurum(d.surum); setOkundu(true); }
      } catch (e) { if (!c.signal.aborted) setHata(e instanceof Error ? e.message : "Eğitim okunamadı."); }
      finally { if (!c.signal.aborted) setYukleniyor(false); }
    })(); return () => c.abort();
  }, [egitim]);
  useEffect(()=>{onDegisiklik?.(okundu&&!saltOkunur&&(JSON.stringify(form)!==baslangicVerisi.current||eklerDegisti));},[form,okundu,saltOkunur,onDegisiklik,eklerDegisti]);
  useLayoutEffect(()=>{
    const alan=aciklamaRef.current;
    if(!alan)return;
    const boyutla=()=>{alan.style.height="auto";alan.style.height=`${alan.scrollHeight+2}px`;};
    boyutla();window.addEventListener("resize",boyutla);
    return()=>window.removeEventListener("resize",boyutla);
  },[form.aciklama]);
  const soruSetiTamam = taslaklariDogrula(form.soru_taslaklari, form.soru_seti_buyuklugu) === null;
  const kapali = saltOkunur || medyaYukleniyor || kaydediliyor || kayitTamamlandi || yukleniyor || !okundu || (!!egitim && egitim.durum !== "taslak");
  const sirali = ikiSutun && !saltOkunur;
  const hedefTamam = form.hedef_roller.length > 0;
  const medyaTamam = medyaHazirligi?.egitimId === egitimId
    && medyaHazirligi?.tur === form.yayin_araci && medyaHazirligi.hazir;
  const bilgilerTamam = hedefTamam && !!egitimAdiDogrula(form.egitim_adi)
    && TALEP_TURU_SIRA.includes(form.kategori as TalepTuru)
    && !!form.aciklama.trim() && form.aciklama.length <= 10000
    && partnerKelimeSayisi(form.aciklama) <= 500 && medyaTamam;
  const bilgilerKapali = kapali || (sirali && !hedefTamam);
  const sorularKapali = kapali || (sirali && !bilgilerTamam);
  const fiyatKapali = kapali || (sirali && !(bilgilerTamam && soruSetiTamam));
  const aktifAdim = !hedefTamam ? 1 : !bilgilerTamam ? 2 : !soruSetiTamam ? 3 : 4;
  function guncelle<K extends keyof PartnerEgitimFormVerisi>(alan: K, deger: PartnerEgitimFormVerisi[K]) { setForm(f => ({ ...f, [alan]: deger })); }
  async function kaydet(e: FormEvent) {
    e.preventDefault(); if (kilit.current || fiyatKapali) return;
    const sonuc = partnerEgitimFormDogrula(form as unknown as Record<string, unknown>);
    if (!sonuc.ok) { setHata(sonuc.hata); return; }
    kilit.current = true; setKaydediliyor(true); onIslem(true); setHata("");
    try {
      const r = await fetch("/partner/api/egitimler", { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ ...form, ayrintili: true, egitim_id: egitimId, surum, istek_id: istekId }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Eğitim kaydedilemedi.");
      setKayitTamamlandi(true);
      await onKaydedildi();
    } catch (e) { setHata(e instanceof Error ? e.message : "Kayıt sonucu doğrulanamadı. Listeyi kontrol edin."); }
    finally { kilit.current = false; setKaydediliyor(false); onIslem(false); }
  }
  function hedefDegistir(hedef: HedefRol) {
    setForm(f => ({ ...f, hedef_roller: f.hedef_roller.includes(hedef)
      ? f.hedef_roller.filter(r => r !== hedef)
      : [...f.hedef_roller, hedef] }));
  }
  return <section className={ikiSutun ? `${styles.editor} ${styles.panelliEditor}` : styles.editor} aria-label="Eğitim Oluşturma Formu">
    {baslikGoster&&<div className={styles.editorBaslik}><h2>{egitim ? "Eğitim Bilgileri" : "Yeni Eğitim Ekle"}</h2></div>}
    <form onSubmit={kaydet} noValidate className={styles.formAlanlari}>
      <div className={ikiSutun?styles.formSutunlari:styles.formAlanlari}>
      <div className={styles.formAlanlari}>
      <fieldset data-adim="1" data-aktif={sirali && aktifAdim === 1} disabled={kapali} className={ikiSutun ? `${styles.formAlanlari} ${styles.formPaneli}` : styles.formAlanlari}>
        <div><span id="partner-hedef-kitle-baslik" className={styles.alanBasligi}>Hedef Kitle</span><fieldset className={styles.hedefler} aria-labelledby="partner-hedef-kitle-baslik">{TUM_HEDEF_ROLLER.map(rol => <label key={rol}><input type="checkbox" checked={form.hedef_roller.includes(rol)} onChange={() => hedefDegistir(rol)} />{HEDEF_ROL_TASARIM[rol].tamEtiket}</label>)}</fieldset></div>
      </fieldset>
      <div data-adim="2" data-aktif={sirali && aktifAdim === 2} aria-disabled={sirali && !hedefTamam} className={ikiSutun ? `${styles.formAlanlari} ${styles.formPaneli}` : styles.formAlanlari}>
        <fieldset disabled={bilgilerKapali} className={styles.formAlanlari}>
          <div className={styles.formSatiri}>
          <SadeFormSecimi etiket="Eğitim Kategorisi" value={form.kategori} onChange={e => guncelle("kategori", e.target.value as TalepTuru)}><option value="">Kategori Seçin</option>{TALEP_TURU_SIRA.map(k => <option key={k} value={k}>{TALEP_TURU_KURALLARI[k].ad}</option>)}</SadeFormSecimi>
          <div><label htmlFor="partner-egitim-adi">Eğitim Adı</label><Input ref={adInput} id="partner-egitim-adi" value={form.egitim_adi} maxLength={200} onChange={e => guncelle("egitim_adi", e.target.value)} /></div>
          </div>
        </fieldset>
        <PartnerMedyaAlanlari egitimId={egitimId} egitimAdi={form.egitim_adi} istekId={istekId} tur={form.yayin_araci} disabled={bilgilerKapali}
            onHazirlik={setMedyaHazirligi} onEkDegisiklik={setEklerDegisti}
            onTurDegis={tur => guncelle("yayin_araci", tur)}
            onTaslak={t => { setEgitimId(t.egitim_id); setSurum(t.surum); }}
            onIslem={aktif => { setMedyaYukleniyor(aktif); kilit.current=aktif; onIslem(aktif); }} />
        <fieldset disabled={bilgilerKapali} className={styles.formAlanlari}>
          <div>
            <label htmlFor="partner-egitim-aciklama">Eğitim Hakkında</label>
            <div className={styles.aciklamaKutusu}>
              <textarea ref={aciklamaRef} className={styles.aciklama} id="partner-egitim-aciklama" aria-describedby="partner-egitim-kelime-sayisi" rows={3} maxLength={10000} value={form.aciklama} onChange={e => guncelle("aciklama", partnerAciklamaSinirla(e.target.value))} />
              <p id="partner-egitim-kelime-sayisi" className={styles.kelimeSayaci}>{partnerKelimeSayisi(form.aciklama)} / 500 Kelime</p>
            </div>
          </div>
        </fieldset>
      </div>
      <div data-adim="4" data-aktif={sirali && aktifAdim === 4} aria-disabled={sirali && !(bilgilerTamam && soruSetiTamam)} className={styles.fiyatAlani}>
        <label htmlFor="partner-egitim-fiyat">Fiyat (TL)</label>
        <Input id="partner-egitim-fiyat" inputMode="decimal" disabled={fiyatKapali} value={form.fiyat_tl} onChange={e => guncelle("fiyat_tl", e.target.value)} />
      </div>
      </div>
      <fieldset data-adim="3" data-aktif={sirali && aktifAdim === 3} disabled={sorularKapali} className={ikiSutun ? `${styles.formAlanlari} ${styles.formPaneli}` : styles.formAlanlari}>
        <section aria-label="Hazır Soru Seti"><h3 className={styles.alanBasligi}>Soru Seti</h3>
          <SoruSetiAyarlari buyukluk={form.soru_seti_buyuklugu} secenek={form.secenek_sayisi} videoBasi={form.yayin_basi_soru} buyuklukEtiketi="Soru Seti Büyüklüğü" videoBasiEtiketi="Yayın Başına Soru Sayısı"
            onBuyuklukChange={n => setForm(f => ({ ...f, soru_seti_buyuklugu: n, yayin_basi_soru: Math.min(n, f.yayin_basi_soru), soru_taslaklari: taslaklariBoyutla(f.soru_taslaklari, n, f.secenek_sayisi) }))}
            onSecenekChange={n => { if (form.soru_taslaklari.some(s => s.secenekler.slice(n).some(Boolean) || (s.dogru !== null && s.dogru >= n))) { setHata("Seçenek sayısını azaltmadan önce kaldırılacak seçenekleri ve doğru cevap işaretlerini temizleyin."); return; } setForm(f => ({ ...f, secenek_sayisi: n, soru_taslaklari: f.soru_taslaklari.map(s => ({ ...s, secenekler: Array.from({ length: n }, (_,i) => s.secenekler[i] ?? "") })) })); }}
            onVideoBasiChange={n => guncelle("yayin_basi_soru", n)} />
          <div className={styles.soruBlogu}>
            <SoruSetiFormu
              ilkSoruSayisi={2}
              enAzGorunenSoruSayisi={aktarimdaAcilanSoruSayisi}
              sayacSagIcerik={
                <SoruIceAktar
                  kompakt
                  disabled={sorularKapali}
                  secenekSayisi={form.secenek_sayisi}
                  onDoldur={(taslaklar, mesaj) => {
                    guncelle("soru_taslaklari", taslaklariBoyutla(taslaklar, form.soru_seti_buyuklugu, form.secenek_sayisi));
                    setAktarimdaAcilanSoruSayisi(form.soru_seti_buyuklugu);
                    setUyari(mesaj);
                  }}
                  onKaldir={aktarimdaAcilanSoruSayisi > 0 ? () => {
                    guncelle("soru_taslaklari", taslaklariBoyutla([], form.soru_seti_buyuklugu, form.secenek_sayisi));
                    setAktarimdaAcilanSoruSayisi(0);
                    setUyari("");
                  } : undefined}
                />
              }
              gezinmeGoster={false}
              taslaklar={form.soru_taslaklari}
              buyukluk={form.soru_seti_buyuklugu}
              secenekSayisi={form.secenek_sayisi}
              onDegis={s => guncelle("soru_taslaklari", s)}
            />
          </div>
        </section>
      </fieldset>
      </div>
      {yukleniyor && <p role="status">Eğitim Yükleniyor…</p>}
      {uyari && <p role="status" className={styles.bilgi}>{uyari}</p>}
      {hata && <p role="alert" className={styles.hata}>{hata}</p>}
      <div className={styles.editorDugmeler}>
        {!saltOkunur && soruSetiTamam && (!sirali || bilgilerTamam) && (
          <Button type="submit" disabled={fiyatKapali || !partnerEgitimFormDogrula(form as unknown as Record<string, unknown>).ok} className="bg-[var(--tema-kontrol-eylem)] text-white hover:bg-[var(--tema-kontrol-eylem)] hover:brightness-95">
            {kaydediliyor ? "Kaydediliyor…" : "Eğitimi Kaydet"}
          </Button>
        )}
        {onKapat && (
          <Button type="button" variant="outline" disabled={kaydediliyor || medyaYukleniyor} onClick={onKapat}>
            {saltOkunur ? "Kapat" : "Vazgeç"}
          </Button>
        )}
      </div>
    </form>
  </section>;
}
