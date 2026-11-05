"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BookOpen, GraduationCap, LogOut, Pencil, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PartnerEgitimFormu from "./PartnerEgitimFormu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import { EGITIM_DURUMLARI, partnerEgitimListesiGecerli, type PartnerEgitimi, type PartnerEgitimDurumu, type PartnerEgitimListesi } from "@/lib/agora/partnerEgitimleri";
import styles from "./egitimler.module.css";

export default function PartnerEgitimAlani({ sirketAdi, logoSurumu }: { sirketAdi: string; logoSurumu: number }) {
  const [liste, setListe] = useState<PartnerEgitimListesi | null>(null);
  const [durum, setDurum] = useState<PartnerEgitimDurumu | "tumu">("tumu");
  const [sayfa, setSayfa] = useState(1);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [editor, setEditor] = useState<{ egitim: PartnerEgitimi | null; istekId: string } | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [cikiliyor, setCikiliyor] = useState(false);
  const [silinenId, setSilinenId] = useState<string | null>(null);
  const [yayinAdayi, setYayinAdayi] = useState<PartnerEgitimi | null>(null);
  const [silmeAdayi, setSilmeAdayi] = useState<PartnerEgitimi | null>(null);
  const kilit = useRef(false);
  const istek = useRef({ surum: 0, controller: null as AbortController | null });
  const { mesajlar, basari } = useHataMesaji();
  const logo = `/partner/api/logo?v=${logoSurumu}`;

  const oku = useCallback(async () => {
    const kontrol = istek.current; kontrol.controller?.abort();
    const controller = new AbortController(); kontrol.controller = controller;
    const surum = ++kontrol.surum;
    setYukleniyor(true); setHata("");
    try {
      const r = await fetch(`/partner/api/egitimler?${new URLSearchParams({ durum, sayfa: String(sayfa) })}`, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      if (r.status === 401) { window.location.replace("/partner/profil"); return; }
      const data: unknown = await r.json();
      if (!r.ok || !partnerEgitimListesiGecerli(data)) throw new Error();
      if (surum === kontrol.surum) setListe(data);
    } catch {
      if (surum === kontrol.surum && !controller.signal.aborted) { setListe(null); setHata("Eğitimleriniz okunamadı. Yenile ile tekrar deneyin."); }
    } finally { if (surum === kontrol.surum) setYukleniyor(false); }
  }, [durum, sayfa]);
  useEffect(() => { const kontrol = istek.current; void oku(); return () => { kontrol.surum++; kontrol.controller?.abort(); }; }, [oku]);

  function editorAc(egitim: PartnerEgitimi | null) {
    if (kilit.current) return;
    setEditor({ egitim, istekId: crypto.randomUUID() });
  }
  async function egitimiSil(egitim: PartnerEgitimi) {
    if (kilit.current || cikiliyor) return;
    kilit.current = true; setKaydediliyor(true); setSilinenId(egitim.egitim_id); setHata("");
    try {
      const r = await fetch("/partner/api/egitimler", { method: "DELETE", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ egitim_id: egitim.egitim_id, surum: egitim.surum }) });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 401) { window.location.replace("/partner/profil"); return; }
        if (r.status === 409) { setSilmeAdayi(null); await oku(); setHata(typeof data.hata === "string" ? data.hata : "Eğitim değişmiş. Listeyi kontrol edin."); return; }
        throw new Error(typeof data.hata === "string" ? data.hata : "Eğitim silinemedi.");
      }
      if (editor?.egitim?.egitim_id === egitim.egitim_id) setEditor(null);
      setSilmeAdayi(null); basari("Eğitim silindi.");
      if (sayfa > 1 && liste && liste.toplam - 1 <= (sayfa - 1) * 20) { setListe(null); setSayfa(sayfa - 1); } else await oku();
    } catch (e) { setHata(e instanceof Error ? e.message : "Silme sonucu doğrulanamadı. Listeyi yenileyip kontrol edin."); }
    finally { kilit.current = false; setKaydediliyor(false); setSilinenId(null); }
  }
  async function yayimla(egitim: PartnerEgitimi) {
    if (kilit.current || cikiliyor) return;
    kilit.current=true;setKaydediliyor(true);setHata("");
    try {
      const r=await fetch("/partner/api/yayinla",{method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(30000),body:JSON.stringify({egitim_id:egitim.egitim_id,surum:egitim.surum})});
      const d=await r.json();if(!r.ok)throw new Error(d.hata||"Eğitim yayımlanamadı.");
      setYayinAdayi(null);basari("Eğitim Agora’da yayımlandı.");
      if(sayfa!==1){setListe(null);setSayfa(1);}else await oku();
    }catch(e){setHata(e instanceof Error?e.message:"Yayımlama sonucu doğrulanamadı. Listeyi yenileyin.");}
    finally{kilit.current=false;setKaydediliyor(false);}
  }
  async function cikis() {
    if (kilit.current || cikiliyor) return;
    setCikiliyor(true); setHata("");
    try {
      const r = await fetch("/partner/api/cikis", { method: "POST", signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error();
      window.location.replace("/partner");
    } catch { setCikiliyor(false); setHata("Çıkış tamamlanamadı. Yeniden deneyin."); }
  }
  const acik = !!liste && !yukleniyor && !kaydediliyor && !cikiliyor;
  return <main className={styles.page}>
    <HataMesajiContainer mesajlar={mesajlar} />
    <AlertDialog open={!!silmeAdayi} onOpenChange={open => { if (!open && !kilit.current) { setSilmeAdayi(null); setHata(""); } }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Eğitimi Sil</AlertDialogTitle><AlertDialogDescription>“{silmeAdayi?.egitim_adi}” eğitimini silmek istediğinize emin misiniz? Eğitim, listenizden kaldırılacak.</AlertDialogDescription></AlertDialogHeader>
        {hata && <p role="alert" className={styles.hata}>{hata}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={kaydediliyor}>İptal</AlertDialogCancel>
          <AlertDialogAction className={styles.silOnayButonu} disabled={kaydediliyor || cikiliyor} onClick={e => { e.preventDefault(); if (silmeAdayi) void egitimiSil(silmeAdayi); }}>{silinenId ? "Siliniyor…" : "Sil"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!yayinAdayi} onOpenChange={open => { if (!open && !kilit.current) { setYayinAdayi(null); setHata(""); } }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Agora’da Yayımla</AlertDialogTitle><AlertDialogDescription>“{yayinAdayi?.egitim_adi}” eğitimini Agora’da yayımlamak istiyor musunuz? Kaydedilmiş eğitim bilgileriniz ve tamamlanan dosyalarınızla ek onay beklemeden listelenecek.</AlertDialogDescription></AlertDialogHeader>
        {hata && <p role="alert" className={styles.hata}>{hata}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={kaydediliyor}>İptal</AlertDialogCancel>
          <AlertDialogAction disabled={kaydediliyor || cikiliyor} onClick={e => { e.preventDefault(); if (yayinAdayi) void yayimla(yayinAdayi); }}>{kaydediliyor ? "Yayımlanıyor…" : "Yayımla"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <header className={styles.header}><div className={styles.headerIcerik}>
      <div className={styles.kimlik}><Image unoptimized src={logo} alt={`${sirketAdi} Logosu`} width={120} height={56} className={styles.logo} /><div><p>Cogniti İş Partneri</p><strong>{sirketAdi}</strong></div></div>
      <Button type="button" variant="outline" onClick={() => void cikis()} disabled={kaydediliyor || cikiliyor}><LogOut size={16} aria-hidden="true" />{cikiliyor ? "Çıkılıyor…" : "Çıkış"}</Button>
    </div></header>
    <div className={styles.icerik}>
      <div className={styles.baslik}><div><span className={styles.kucukBaslik}>EĞİTİM YÖNETİMİ</span><h1>Eğitimlerim</h1><p>Eğitimlerinizi oluşturun ve yönetin.</p></div><Button type="button" disabled={!acik} onClick={() => editorAc(null)}><Plus size={18} aria-hidden="true" />Yeni Eğitim Ekle</Button></div>
      {editor && <PartnerEgitimFormu key={editor.istekId} egitim={editor.egitim} istekId={editor.istekId} onKapat={() => setEditor(null)} onIslem={aktif => { kilit.current = aktif; setKaydediliyor(aktif); }} onKaydedildi={async () => {
        setEditor(null); basari("Eğitim bilgileri kaydedildi.");
        if (durum !== "tumu" || sayfa !== 1) { setListe(null); setDurum("tumu"); setSayfa(1); } else await oku();
      }} />}
      <div className={styles.araclar}><SadeKapsulFiltre etiket="Eğitim Durumu" deger={durum} onDegistir={v => { if (kaydediliyor) return; setDurum(v); setSayfa(1); setListe(null); }} secenekler={[
        { deger: "tumu", etiket: "Tümü", disabled: kaydediliyor }, { deger: "taslak", etiket: "Taslak", disabled: kaydediliyor }, { deger: "yayinda", etiket: "Yayında", disabled: kaydediliyor }, { deger: "pasif", etiket: "Pasif", disabled: kaydediliyor },
      ]} /><Button type="button" variant="outline" disabled={kaydediliyor || yukleniyor} onClick={() => void oku()}><RefreshCw size={16} className={yukleniyor ? styles.donuyor : undefined} aria-hidden="true" />{yukleniyor ? "Yükleniyor…" : "Yenile"}</Button></div>
      {hata && !silmeAdayi && !yayinAdayi && <p role="alert" className={styles.hata}>{hata}</p>}
      {yukleniyor && !liste && <p role="status" className={styles.bilgi}>Eğitimleriniz yükleniyor…</p>}
      {liste && liste.toplam === 0 && <section className={styles.bos}>
        <div className={styles.bosSimge}><GraduationCap size={36} aria-hidden="true" /></div><h2>{durum === "tumu" ? "İlk Eğitiminizi Ekleyin" : "Bu Durumda Eğitim Bulunmuyor"}</h2><p>{durum === "tumu" ? "Eğitimlerinizi burada listeleyebilir ve yönetebilirsiniz." : "Diğer eğitimlerinizi görmek için Tümü seçeneğine geçin."}</p>
        {durum === "tumu" && <Button type="button" disabled={!acik} onClick={() => editorAc(null)}><Plus size={18} aria-hidden="true" />Yeni Eğitim Ekle</Button>}
      </section>}
      {liste && liste.kayitlar.length > 0 && <>
        <p className={styles.listeOzeti}><BookOpen size={16} aria-hidden="true" />{liste.toplam} Eğitim</p>
        <div className={styles.kartlar}>{liste.kayitlar.map(e => <YayinKarti key={e.egitim_id}
          yayin={{ yayin_id: e.egitim_id, urun_adi: e.egitim_adi, icerik_turu: e.kategori, arac_turu: e.yayin_araci, thumbnail_url: logo, yayin_tarihi: e.olusturuldu_at }}
          className={styles.egitimKarti} ariaLabel={`${e.egitim_adi} Eğitim Bilgileri`}
          onClick={() => editorAc(e)} etkilesimGoster={false} izlenmeGoster={false} puanGoster={false} yayinKoduGoster={false} donguGoster={false} yayinTuruGoster={!!e.yayin_araci}
          solUstRozet={<span>{EGITIM_DURUMLARI[e.durum]}</span>}
          puanYaniRozet={<span className={styles.fiyat}>{e.fiyat_tl === null ? "Fiyat Belirlenmedi" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(e.fiyat_tl)}</span>}
          altEkIcerik={<div className={styles.kartAlt}>{e.durum === "taslak" && <Button type="button" disabled={kaydediliyor || cikiliyor || !!editor} onClick={ev => { ev.stopPropagation(); setHata(""); setYayinAdayi(e); }}><Send size={14} aria-hidden="true" />Agora’da Yayımla</Button>}<Button type="button" variant="outline" disabled={kaydediliyor || cikiliyor} onClick={ev => { ev.stopPropagation(); editorAc(e); }}><Pencil size={14} aria-hidden="true" />{e.durum === "taslak" ? "İncele / Düzenle" : "İncele"}</Button><Button type="button" variant="outline" className={styles.silButonu} disabled={kaydediliyor || cikiliyor} onClick={ev => { ev.stopPropagation(); setHata(""); setSilmeAdayi(e); }}><Trash2 size={14} aria-hidden="true" />{silinenId === e.egitim_id ? "Siliniyor…" : "Eğitimi Sil"}</Button></div>}
        />)}</div>
        <nav className={styles.sayfalama} aria-label="Eğitim Sayfaları"><Button type="button" variant="outline" disabled={sayfa === 1 || !acik} onClick={() => { setSayfa(sayfa - 1); setListe(null); }}>Önceki</Button><span>Sayfa {sayfa}</span><Button type="button" variant="outline" disabled={sayfa * 20 >= liste.toplam || !acik} onClick={() => { setSayfa(sayfa + 1); setListe(null); }}>Sonraki</Button></nav>
      </>}
    </div>
  </main>;
}
