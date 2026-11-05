"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";
import { SoruSetiAyarlari } from "@/app/(panel)/talepler/_components/SoruSetiAyarlari";
import { SoruIceAktar } from "@/components/SoruIceAktar";
import { SoruSetiFormu } from "@/components/SoruSetiFormu";
import { TALEP_TURU_KURALLARI, TALEP_TURU_SIRA, type TalepTuru } from "@/lib/uretici/yetenekler";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";
import { taslaklariBoyutla } from "@/lib/soru/taslak";
import { bosPartnerEgitimFormu, partnerEgitimFormDogrula, partnerKelimeSayisi, type PartnerEgitimFormVerisi } from "@/lib/agora/partnerEgitimFormu";
import type { PartnerEgitimi } from "@/lib/agora/partnerEgitimleri";
import PartnerMedyaAlanlari from "./PartnerMedyaAlanlari";
import styles from "./egitimler.module.css";

export default function PartnerEgitimFormu({ egitim, istekId, onKapat, onKaydedildi, onIslem }: {
  egitim: PartnerEgitimi | null; istekId: string; onKapat: () => void; onKaydedildi: () => Promise<void>; onIslem: (aktif: boolean) => void;
}) {
  const [form, setForm] = useState<PartnerEgitimFormVerisi>(() => ({ ...bosPartnerEgitimFormu(), egitim_adi: egitim?.egitim_adi ?? "", soru_taslaklari: taslaklariBoyutla([],10,2) }));
  const [egitimId, setEgitimId] = useState(egitim?.egitim_id ?? null);
  const [medyaYukleniyor, setMedyaYukleniyor] = useState(false);
  const [surum, setSurum] = useState(egitim?.surum ?? 0);
  const [yukleniyor, setYukleniyor] = useState(!!egitim);
  const [okundu, setOkundu] = useState(!egitim);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [uyari, setUyari] = useState("");
  const kilit = useRef(false), adInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!egitim) { adInput.current?.focus(); return; }
    const c = new AbortController();
    void (async () => {
      try {
        const r = await fetch(`/partner/api/egitimler?egitim_id=${egitim.egitim_id}`, { cache: "no-store", signal: AbortSignal.any([c.signal, AbortSignal.timeout(15000)]) });
        const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Eğitim okunamadı.");
        if (!c.signal.aborted) { const bilgiler = { ...bosPartnerEgitimFormu(), ...d.bilgiler, egitim_adi: d.egitim_adi }; setForm({ ...bilgiler, soru_taslaklari: taslaklariBoyutla(bilgiler.soru_taslaklari, bilgiler.soru_seti_buyuklugu, bilgiler.secenek_sayisi) }); setSurum(d.surum); setOkundu(true); }
      } catch (e) { if (!c.signal.aborted) setHata(e instanceof Error ? e.message : "Eğitim okunamadı."); }
      finally { if (!c.signal.aborted) setYukleniyor(false); }
    })(); return () => c.abort();
  }, [egitim]);
  const kapali = medyaYukleniyor || kaydediliyor || yukleniyor || !okundu || (!!egitim && egitim.durum !== "taslak");
  function guncelle<K extends keyof PartnerEgitimFormVerisi>(alan: K, deger: PartnerEgitimFormVerisi[K]) { setForm(f => ({ ...f, [alan]: deger })); }
  async function kaydet(e: FormEvent) {
    e.preventDefault(); if (kilit.current || kapali) return;
    const sonuc = partnerEgitimFormDogrula(form as unknown as Record<string, unknown>);
    if (!sonuc.ok) { setHata(sonuc.hata); return; }
    kilit.current = true; setKaydediliyor(true); onIslem(true); setHata("");
    try {
      const r = await fetch("/partner/api/egitimler", { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ ...form, ayrintili: true, egitim_id: egitimId, surum, istek_id: istekId }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Eğitim kaydedilemedi.");
      await onKaydedildi();
    } catch (e) { setHata(e instanceof Error ? e.message : "Kayıt sonucu doğrulanamadı. Listeyi kontrol edin."); }
    finally { kilit.current = false; setKaydediliyor(false); onIslem(false); }
  }
  function hedefDegistir(hedef: HedefRol) {
    setForm(f => ({ ...f, hedef_roller: f.hedef_roller.includes(hedef)
      ? f.hedef_roller.filter(r => r !== hedef)
      : [...f.hedef_roller, hedef] }));
  }
  return <section className={styles.editor} aria-label="Eğitim Oluşturma Formu">
    <div className={styles.editorBaslik}><h2>{egitim ? "Eğitim Bilgileri" : "Yeni Eğitim Ekle"}</h2><span className={styles.durum}>Hazır İçerik / Hazır Soru Seti</span></div>
    <form onSubmit={kaydet} noValidate>
      <fieldset disabled={kapali} className={styles.formAlanlari}>
        <SadeFormSecimi etiket="Eğitim Kategorisi" value={form.kategori} onChange={e => guncelle("kategori", e.target.value as TalepTuru)}><option value="">Kategori Seçin</option>{TALEP_TURU_SIRA.map(k => <option key={k} value={k}>{TALEP_TURU_KURALLARI[k].ad}</option>)}</SadeFormSecimi>
        <div><label htmlFor="partner-egitim-adi">Eğitim Adı</label><Input ref={adInput} id="partner-egitim-adi" value={form.egitim_adi} maxLength={200} onChange={e => guncelle("egitim_adi", e.target.value)} /></div>
        <fieldset className={styles.hedefler}><legend>Hedef Kitle</legend>{TUM_HEDEF_ROLLER.map(rol => <label key={rol}><input type="checkbox" checked={form.hedef_roller.includes(rol)} onChange={() => hedefDegistir(rol)} />{HEDEF_ROL_TASARIM[rol].tamEtiket}</label>)}</fieldset>
        <SadeFormSecimi etiket="Yayın Aracı" value={form.yayin_araci} onChange={e => guncelle("yayin_araci", e.target.value as "video" | "podcast")}><option value="video">Video</option><option value="podcast">Podcast</option></SadeFormSecimi>
        <PartnerMedyaAlanlari egitimId={egitimId} egitimAdi={form.egitim_adi} istekId={istekId} tur={form.yayin_araci} disabled={kapali}
          onTaslak={t => { setEgitimId(t.egitim_id); setSurum(t.surum); }}
          onIslem={aktif => { setMedyaYukleniyor(aktif); kilit.current=aktif; onIslem(aktif); }} />
        <div><label htmlFor="partner-egitim-aciklama">Eğitim Hakkında</label><textarea id="partner-egitim-aciklama" rows={4} maxLength={10000} value={form.aciklama} onChange={e => guncelle("aciklama", e.target.value)} /><p className={styles.bilgi}>{partnerKelimeSayisi(form.aciklama)} / 500 Kelime</p></div>
        <div><label htmlFor="partner-egitim-fiyat">Fiyat (TL)</label><Input id="partner-egitim-fiyat" inputMode="decimal" value={form.fiyat_tl} onChange={e => guncelle("fiyat_tl", e.target.value)} /></div>
        <section aria-label="Hazır Soru Seti"><h3>Soru Seti</h3>
          <SoruSetiAyarlari buyukluk={form.soru_seti_buyuklugu} secenek={form.secenek_sayisi} videoBasi={form.yayin_basi_soru} buyuklukEtiketi="Soru Seti Büyüklüğü" videoBasiEtiketi="Yayın Başına Soru Sayısı"
            onBuyuklukChange={n => setForm(f => ({ ...f, soru_seti_buyuklugu: n, yayin_basi_soru: Math.min(n, f.yayin_basi_soru), soru_taslaklari: taslaklariBoyutla(f.soru_taslaklari, n, f.secenek_sayisi) }))}
            onSecenekChange={n => { if (form.soru_taslaklari.some(s => s.secenekler.slice(n).some(Boolean) || (s.dogru !== null && s.dogru >= n))) { setHata("Seçenek sayısını azaltmadan önce kaldırılacak seçenekleri ve doğru cevap işaretlerini temizleyin."); return; } setForm(f => ({ ...f, secenek_sayisi: n, soru_taslaklari: f.soru_taslaklari.map(s => ({ ...s, secenekler: Array.from({ length: n }, (_,i) => s.secenekler[i] ?? "") })) })); }}
            onVideoBasiChange={n => guncelle("yayin_basi_soru", n)} />
          <div className={styles.soruBlogu}><SoruIceAktar secenekSayisi={form.secenek_sayisi} onDoldur={(taslaklar, mesaj) => { guncelle("soru_taslaklari", taslaklariBoyutla(taslaklar, form.soru_seti_buyuklugu, form.secenek_sayisi)); setUyari(mesaj); }} />
            <SoruSetiFormu taslaklar={form.soru_taslaklari} buyukluk={form.soru_seti_buyuklugu} secenekSayisi={form.secenek_sayisi} onDegis={s => guncelle("soru_taslaklari", s)} />
          </div>
        </section>
      </fieldset>
      {yukleniyor && <p role="status">Eğitim Yükleniyor…</p>}
      {uyari && <p role="status" className={styles.bilgi}>{uyari}</p>}
      {hata && <p role="alert" className={styles.hata}>{hata}</p>}
      <div className={styles.editorDugmeler}><Button type="submit" disabled={kapali}>{kaydediliyor ? "Kaydediliyor…" : "Eğitim Bilgilerini Kaydet"}</Button><Button type="button" variant="outline" disabled={kaydediliyor || medyaYukleniyor} onClick={onKapat}>Kapat</Button></div>
    </form>
  </section>;
}
