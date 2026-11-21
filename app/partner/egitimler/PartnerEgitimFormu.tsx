"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Film, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";
import { SoruSetiAyarlari } from "@/app/(panel)/talepler/_components/SoruSetiAyarlari";
import { SoruIceAktar } from "@/components/SoruIceAktar";
import { SoruSetiFormu } from "@/components/SoruSetiFormu";
import { PartnerEgitimKarti } from "@/components/yayin/PartnerEgitimKarti";
import { TALEP_TURU_KURALLARI, TALEP_TURU_SIRA, type TalepTuru } from "@/lib/uretici/yetenekler";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { ROL_ADLARI, TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";
import { taslaklariBoyutla, taslaklariDogrula } from "@/lib/soru/taslak";
import { canliHakedisOzetiHesapla } from "@/lib/agora/partnerCanliYayin";
import { VARSAYILAN_PARTNER_KOMISYON_ORANI } from "@/lib/agora/komisyon";
import { bosPartnerEgitimFormu, partnerEgitimFormDogrula, partnerKelimeSayisi, partnerAciklamaSinirla, type PartnerEgitimFormVerisi } from "@/lib/agora/partnerEgitimFormu";
import { egitimAdiDogrula } from "@/lib/agora/partnerEgitimleri";
import type { PartnerEgitimi } from "@/lib/agora/partnerEgitimleri";
import PartnerMedyaAlanlari from "./PartnerMedyaAlanlari";
import styles from "./egitimler.module.css";

const TL_BICIMI = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export type PartnerEgitimFormKaydi=Pick<PartnerEgitimi,"egitim_id"|"egitim_adi"|"surum"|"durum"|"yayin_araci">;

export default function PartnerEgitimFormu({ egitim, istekId, onKapat, onKaydedildi, onIslem, onDegisiklik, saltOkunur=false, baslikGoster=true, ikiSutun=false, solAltAksiyonlar, onizlemeDurumu }: {
  egitim: PartnerEgitimFormKaydi | null; istekId: string; onKapat?: () => void; onKaydedildi: () => Promise<void>; onIslem: (aktif: boolean) => void;
  onDegisiklik?: (degisti:boolean)=>void; saltOkunur?:boolean; baslikGoster?:boolean; ikiSutun?:boolean; solAltAksiyonlar?:ReactNode; onizlemeDurumu?:PartnerEgitimi["durum"];
}) {
  const [form, setForm] = useState<PartnerEgitimFormVerisi>(() => ({ ...bosPartnerEgitimFormu(), egitim_adi: egitim?.egitim_adi ?? "", yayin_araci: egitim?.yayin_araci ?? "video", soru_taslaklari: taslaklariBoyutla([],10,2) }));
  const [eklerDegisti,setEklerDegisti]=useState(false);
  const aciklamaRef=useRef<HTMLTextAreaElement>(null);
  const baslangicVerisi=useRef(JSON.stringify(form));
  const [egitimId, setEgitimId] = useState(egitim?.egitim_id ?? null);
  const [partnerEgitimId, setPartnerEgitimId] = useState<string | undefined>(undefined);
  const [medyaYukleniyor, setMedyaYukleniyor] = useState(false);
  const [medyaHazirligi, setMedyaHazirligi] = useState<{egitimId:string|null;tur:"video"|"podcast";hazir:boolean;videoGuid?:string|null}|null>(null);
  const [surum, setSurum] = useState(egitim?.surum ?? 0);
  const [yukleniyor, setYukleniyor] = useState(!!egitim);
  const [okundu, setOkundu] = useState(!egitim);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kayitTamamlandi, setKayitTamamlandi] = useState(false);
  const [hata, setHata] = useState("");
  const [uyari, setUyari] = useState("");
  const [aktarimdaAcilanSoruSayisi, setAktarimdaAcilanSoruSayisi] = useState(0);
  const [onizlemeTarihi] = useState(() => new Date().toISOString());
  const kilit = useRef(false), adInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!egitim) return;
    const c = new AbortController();
    void (async () => {
      try {
        const r = await fetch(`/partner/api/egitimler?egitim_id=${egitim.egitim_id}`, { cache: "no-store", signal: AbortSignal.any([c.signal, AbortSignal.timeout(15000)]) });
        const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Yayın okunamadı.");
        if (!c.signal.aborted) { const bilgiler = { ...bosPartnerEgitimFormu(), ...d.bilgiler, egitim_adi: d.egitim_adi }; const yuklenen={ ...bilgiler, soru_taslaklari: taslaklariBoyutla(bilgiler.soru_taslaklari, bilgiler.soru_seti_buyuklugu, bilgiler.secenek_sayisi) }; baslangicVerisi.current=JSON.stringify(yuklenen); setForm(yuklenen); setSurum(d.surum); if(typeof d.partner_egitim_id==="string")setPartnerEgitimId(d.partner_egitim_id); setOkundu(true); }
      } catch (e) { if (!c.signal.aborted) setHata(e instanceof Error ? e.message : "Yayın okunamadı."); }
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

  const fiyatSayisi = useMemo(() => {
    if (!form.fiyat_tl.trim()) return null;
    const n = Number(form.fiyat_tl.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [form.fiyat_tl]);

  const fiyatOzeti = useMemo(() => {
    if (fiyatSayisi === null || fiyatSayisi <= 0) return null;
    return canliHakedisOzetiHesapla(fiyatSayisi, VARSAYILAN_PARTNER_KOMISYON_ORANI);
  }, [fiyatSayisi]);

  const onizlemeEgitimi = useMemo<PartnerEgitimi>(() => {
    const katKural = form.kategori && TALEP_TURU_SIRA.includes(form.kategori as TalepTuru)
      ? TALEP_TURU_KURALLARI[form.kategori as TalepTuru].icerikTuru
      : null;
    return {
      egitim_id: egitimId ?? "onizleme",
      partner_egitim_id: partnerEgitimId ?? "PE-…",
      egitim_adi: form.egitim_adi.trim() || "Yayın Başlığı",
      kategori: katKural,
      yayin_araci: form.yayin_araci,
      kapak_video_guid: form.yayin_araci === "video" ? (medyaHazirligi?.videoGuid ?? null) : null,
      fiyat_tl: fiyatSayisi,
      durum: onizlemeDurumu ?? egitim?.durum ?? "taslak",
      surum: surum || 1,
      olusturuldu_at: onizlemeTarihi,
      guncellendi_at: onizlemeTarihi,
    };
  }, [egitimId, partnerEgitimId, form.egitim_adi, form.kategori, form.yayin_araci, medyaHazirligi?.videoGuid, fiyatSayisi, onizlemeDurumu, egitim?.durum, surum, onizlemeTarihi]);
  function guncelle<K extends keyof PartnerEgitimFormVerisi>(alan: K, deger: PartnerEgitimFormVerisi[K]) { setForm(f => ({ ...f, [alan]: deger })); }
  async function kaydet(e: FormEvent) {
    e.preventDefault(); if (kilit.current || fiyatKapali) return;
    const sonuc = partnerEgitimFormDogrula(form as unknown as Record<string, unknown>);
    if (!sonuc.ok) { setHata(sonuc.hata); return; }
    kilit.current = true; setKaydediliyor(true); onIslem(true); setHata("");
    try {
      const r = await fetch("/partner/api/egitimler", { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ ...form, ayrintili: true, egitim_id: egitimId, surum, istek_id: istekId }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Yayın kaydedilemedi.");
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
  const icForm = <form onSubmit={kaydet} noValidate className={ikiSutun ? "space-y-5" : styles.formAlanlari}>
      {ikiSutun ? (
        <>
          {/* BÖLÜM 1: YAYIN DETAYLARI VE ÖĞRENME ARACI */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--tema-kontrol-eylem)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tema-kontrol-eylem)] text-xs text-white">
                1
              </span>
              Yayın Detayları
            </div>

            <fieldset data-adim="1" data-aktif={sirali && aktifAdim === 1} disabled={kapali} className="m-0 border-0 p-0">
              <span id="partner-hedef-kitle-baslik" className="mb-2 block text-xs font-semibold text-[var(--tema-ikincil-metin)]">
                Hedef Kitle (Birden fazla seçilebilir)
              </span>
              <fieldset className="m-0 flex flex-wrap gap-1.5 border-0 p-0" aria-labelledby="partner-hedef-kitle-baslik">
                {TUM_HEDEF_ROLLER.map(rol => {
                  const secili = form.hedef_roller.includes(rol);
                  return (
                    <label
                      key={rol}
                      className={`!m-0 inline-flex cursor-pointer items-center rounded-full border px-3 py-1 !text-xs !font-medium transition ${
                        secili
                          ? "border-[var(--tema-kontrol-eylem)] bg-[var(--tema-kontrol-eylem)] text-white"
                          : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={secili}
                        onChange={() => hedefDegistir(rol)}
                      />
                      {rol === "eczanem" ? "Eczanem" : (ROL_ADLARI[rol] ?? HEDEF_ROL_TASARIM[rol].tamEtiket)}
                    </label>
                  );
                })}
              </fieldset>
            </fieldset>

            <div data-adim="2" data-aktif={sirali && aktifAdim === 2} aria-disabled={sirali && !hedefTamam} className="flex flex-col gap-4">
              <fieldset disabled={bilgilerKapali} className="m-0 border-0 p-0">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                  <div className="sm:col-span-7">
                    <label htmlFor="partner-egitim-adi" className="mb-1.5 block text-xs font-semibold text-[var(--tema-ikincil-metin)]">
                      Yayın Adı
                    </label>
                    <Input ref={adInput} id="partner-egitim-adi" value={form.egitim_adi} maxLength={200} onChange={e => guncelle("egitim_adi", e.target.value)} placeholder="Örn. Eczanede Etkili İletişim Teknikleri" />
                  </div>
                  <div className="sm:col-span-5">
                    <label htmlFor="partner-egitim-kategori" className="mb-1.5 block text-xs font-semibold text-[var(--tema-ikincil-metin)]">
                      Yayın Kategorisi
                    </label>
                    <SadeFormSecimi id="partner-egitim-kategori" aria-label="Yayın Kategorisi" className="[&_select]:!h-9" value={form.kategori} onChange={e => guncelle("kategori", e.target.value as TalepTuru)}>
                      <option value="">Kategori Seçin</option>
                      {TALEP_TURU_SIRA.map(k => <option key={k} value={k}>{TALEP_TURU_KURALLARI[k].ad}</option>)}
                    </SadeFormSecimi>
                  </div>
                </div>
              </fieldset>

              <PartnerMedyaAlanlari egitimId={egitimId} egitimAdi={form.egitim_adi} istekId={istekId} tur={form.yayin_araci} disabled={bilgilerKapali}
                  onHazirlik={setMedyaHazirligi} onEkDegisiklik={setEklerDegisti}
                  onTurDegis={tur => guncelle("yayin_araci", tur)}
                  onTaslak={t => { setEgitimId(t.egitim_id); setSurum(t.surum); }}
                  onIslem={aktif => { setMedyaYukleniyor(aktif); kilit.current=aktif; onIslem(aktif); }} />

              <fieldset disabled={bilgilerKapali} className="m-0 border-0 p-0">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label htmlFor="partner-egitim-aciklama" className="!mb-0 font-semibold text-[var(--tema-ikincil-metin)]">
                      Yayın Hakkında (En fazla 500 kelime)
                    </label>
                    <span id="partner-egitim-kelime-sayisi" className="text-[var(--tema-ikincil-metin)]">
                      {partnerKelimeSayisi(form.aciklama)} / 500 Kelime
                    </span>
                  </div>
                  <textarea
                    ref={aciklamaRef}
                    id="partner-egitim-aciklama"
                    aria-describedby="partner-egitim-kelime-sayisi"
                    rows={3}
                    maxLength={10000}
                    value={form.aciklama}
                    onChange={e => guncelle("aciklama", partnerAciklamaSinirla(e.target.value))}
                    placeholder="Yayında ele alınan başlıkları ve kazanımları özetleyin..."
                    className="w-full rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] p-3 text-sm text-[var(--tema-metin)]"
                  />
                </div>
              </fieldset>
            </div>
          </div>

          {/* BÖLÜM 2: FİYAT VE HAK EDİŞ */}
          <div data-adim="4" data-aktif={sirali && aktifAdim === 4} aria-disabled={sirali && !(bilgilerTamam && soruSetiTamam)} className="space-y-3 border-t border-[var(--tema-cizgi)] pt-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--tema-kontrol-eylem)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tema-kontrol-eylem)] text-xs text-white">
                2
              </span>
              Fiyat ve Hak Ediş
            </div>

            <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-3.5 pt-3.5 pb-2">
              <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <label htmlFor="partner-egitim-fiyat" className="mb-1 block text-xs font-semibold text-[var(--tema-ikincil-metin)]">
                    Fiyat (TL)
                  </label>
                  <Input id="partner-egitim-fiyat" inputMode="decimal" disabled={fiyatKapali} value={form.fiyat_tl} onChange={e => guncelle("fiyat_tl", e.target.value)} placeholder="Örn. 5000" />
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-[var(--tema-cizgi)] pt-2.5 text-xs sm:col-span-8 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <div>
                    <div className="text-[var(--tema-ikincil-metin)]">Satış Fiyatı</div>
                    <div className="mt-0.5 text-sm font-bold text-[var(--tema-baslik)]">
                      {fiyatOzeti ? TL_BICIMI.format(fiyatOzeti.fiyatTl) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--tema-ikincil-metin)]">%{VARSAYILAN_PARTNER_KOMISYON_ORANI} Hizmet Bedeli</div>
                    <div className="mt-0.5 text-sm font-semibold text-[var(--tema-baslik)]">
                      {fiyatOzeti ? TL_BICIMI.format(fiyatOzeti.hizmetBedeliTl) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--tema-ikincil-metin)]">Hak Edişiniz</div>
                    <div className={`mt-0.5 text-sm font-extrabold ${fiyatOzeti && fiyatOzeti.netHakedisTl > 0 ? "text-emerald-700" : "text-[var(--tema-ikincil-metin)]"}`}>
                      {fiyatOzeti ? TL_BICIMI.format(fiyatOzeti.netHakedisTl) : "—"}
                    </div>
                  </div>
                </div>
              </div>
              <p className="m-0 mt-3 text-right text-[10px] italic leading-none text-[var(--tema-ikincil-metin)]">
                Tüm fiyatlarda KDV hariçtir.
              </p>
            </div>
          </div>

          {/* BÖLÜM 3: SORU SETİ */}
          <fieldset data-adim="3" data-aktif={sirali && aktifAdim === 3} disabled={sorularKapali} className="space-y-3 border-0 border-t border-[var(--tema-cizgi)] p-0 pt-4 m-0">
            <section aria-label="Hazır Soru Seti" className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--tema-kontrol-eylem)]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tema-kontrol-eylem)] text-xs text-white">
                  3
                </span>
                <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-[var(--tema-kontrol-eylem)]">Soru Seti</h3>
              </div>
              <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3.5 space-y-3">
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
              </div>
            </section>
          </fieldset>
        </>
      ) : (
      <div className={styles.formAlanlari}>
      <div className={styles.formAlanlari}>
      <fieldset data-adim="1" data-aktif={sirali && aktifAdim === 1} disabled={kapali} className={styles.formAlanlari}>
        <div><span id="partner-hedef-kitle-baslik" className={styles.alanBasligi}>Hedef Kitle</span><fieldset className={styles.hedefler} aria-labelledby="partner-hedef-kitle-baslik">{TUM_HEDEF_ROLLER.map(rol => <label key={rol}><input type="checkbox" checked={form.hedef_roller.includes(rol)} onChange={() => hedefDegistir(rol)} />{HEDEF_ROL_TASARIM[rol].tamEtiket}</label>)}</fieldset></div>
      </fieldset>
      <div data-adim="2" data-aktif={sirali && aktifAdim === 2} aria-disabled={sirali && !hedefTamam} className={styles.formAlanlari}>
        <fieldset disabled={bilgilerKapali} className={styles.formAlanlari}>
          <div className={styles.formSatiri}>
          <SadeFormSecimi etiket="Yayın Kategorisi" value={form.kategori} onChange={e => guncelle("kategori", e.target.value as TalepTuru)}><option value="">Kategori Seçin</option>{TALEP_TURU_SIRA.map(k => <option key={k} value={k}>{TALEP_TURU_KURALLARI[k].ad}</option>)}</SadeFormSecimi>
          <div><label htmlFor="partner-egitim-adi">Yayın Adı</label><Input ref={adInput} id="partner-egitim-adi" value={form.egitim_adi} maxLength={200} onChange={e => guncelle("egitim_adi", e.target.value)} /></div>
          </div>
        </fieldset>
        <PartnerMedyaAlanlari egitimId={egitimId} egitimAdi={form.egitim_adi} istekId={istekId} tur={form.yayin_araci} disabled={bilgilerKapali}
            onHazirlik={setMedyaHazirligi} onEkDegisiklik={setEklerDegisti}
            onTurDegis={tur => guncelle("yayin_araci", tur)}
            onTaslak={t => { setEgitimId(t.egitim_id); setSurum(t.surum); }}
            onIslem={aktif => { setMedyaYukleniyor(aktif); kilit.current=aktif; onIslem(aktif); }} />
        <fieldset disabled={bilgilerKapali} className={styles.formAlanlari}>
          <div>
            <label htmlFor="partner-egitim-aciklama">Yayın Hakkında</label>
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
      <fieldset data-adim="3" data-aktif={sirali && aktifAdim === 3} disabled={sorularKapali} className={styles.formAlanlari}>
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
      )}
      {yukleniyor && <p role="status">Yayın Yükleniyor…</p>}
      {uyari && <p role="status" className={styles.bilgi}>{uyari}</p>}
      {hata && <p role="alert" className={styles.hata}>{hata}</p>}
      <div className={ikiSutun ? "flex flex-wrap items-center justify-between gap-2 border-t border-[var(--tema-cizgi)] pt-3" : styles.editorDugmeler}>
        {ikiSutun && <div>{solAltAksiyonlar}</div>}
        <div className={ikiSutun ? "flex items-center gap-2" : "contents"}>
          {onKapat && (
            <Button type="button" variant="outline" disabled={kaydediliyor || medyaYukleniyor} onClick={onKapat}>
              {saltOkunur ? "Kapat" : "Vazgeç"}
            </Button>
          )}
          {!saltOkunur && soruSetiTamam && (!sirali || bilgilerTamam) && (
            <Button type="submit" disabled={fiyatKapali || !partnerEgitimFormDogrula(form as unknown as Record<string, unknown>).ok} className="bg-[var(--tema-kontrol-eylem)] text-white hover:bg-[var(--tema-kontrol-eylem)] hover:brightness-95">
              {kaydediliyor ? "Kaydediliyor…" : "Yayını Kaydet"}
            </Button>
          )}
        </div>
      </div>
    </form>;

  if (ikiSutun) {
    return (
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm lg:col-span-7"
          aria-label="Yayın Oluşturma Formu"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tema-cizgi)] pb-3">
            <div className="flex items-center gap-2">
              <Film size={18} className="text-[var(--tema-kontrol-eylem)]" aria-hidden="true" />
              <h2 className="m-0 text-base font-bold text-[var(--tema-baslik)]">
                Video ve Podcast Yayın Planlama
              </h2>
            </div>
          </div>
          {icForm}
        </section>

        <div className="lg:col-span-5">
          <aside
            aria-label="Agora Görünüşü"
            className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm lg:sticky lg:top-5"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tema-cizgi)] pb-3">
              <div>
                <h2 className="m-0 text-base font-bold text-[var(--tema-baslik)]">Agora Görünüşü</h2>
                <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">
                  Yayının Agora’daki ilan kartı önizlemesi
                </p>
              </div>
              <span className="rounded-full bg-[var(--tema-kontrol-hover)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--tema-kontrol-eylem)]">
                Canlı Önizleme
              </span>
            </div>

            <div className="mx-auto w-[208px]">
              <PartnerEgitimKarti
                egitim={onizlemeEgitimi}
                onIncele={() => {}}
                islemler={
                  <div>
                    <Button type="button" variant="outline">
                      <Pencil size={12} aria-hidden="true" />
                      Düzenle
                    </Button>
                  </div>
                }
              />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return <section className={styles.editor} aria-label="Yayın Oluşturma Formu">
    {baslikGoster&&<div className={styles.editorBaslik}><h2>{egitim ? "Yayın Bilgileri" : "Yeni Yayın Ekle"}</h2></div>}
    {icForm}
  </section>;
}
