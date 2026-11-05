"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartnerKabugu from "@/components/agora/PartnerKabugu";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { GraduationCap, Pencil, Plus, Send, Trash2, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PartnerEgitimFormu from "./PartnerEgitimFormu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { PartnerEgitimKarti } from "@/components/yayin/PartnerEgitimKarti";
import { partnerEgitimListesiGecerli, type PartnerEgitimi, type PartnerEgitimDurumu, type PartnerEgitimListesi } from "@/lib/agora/partnerEgitimleri";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { DahaFazlaGoster } from "@/components/liste/DahaFazlaGoster";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import styles from "./egitimler.module.css";

export default function PartnerEgitimAlani({ sirketAdi, kaydedildi=false }: { sirketAdi: string; logoSurumu: number; kaydedildi?:boolean }) {
  const router=useRouter();
  const bildirimGosterildi=useRef(false);
  const [liste, setListe] = useState<PartnerEgitimListesi | null>(null);
  const [durum, setDurum] = useState<PartnerEgitimDurumu | "tumu">("tumu");
  const [sayfa, setSayfa] = useState(1);
  const [aramaMetni,setAramaMetni]=useState(""),[arama,setArama]=useState(""),[aramaTekrari,setAramaTekrari]=useState(0);
  const [baslangic,setBaslangic]=useState(""),[bitis,setBitis]=useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [editor, setEditor] = useState<{ egitim: PartnerEgitimi | null; istekId: string } | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [cikiliyor, setCikiliyor] = useState(false);
  const [silinenId, setSilinenId] = useState<string | null>(null);
  const [yayinAdayi, setYayinAdayi] = useState<PartnerEgitimi | null>(null);
  const [silmeAdayi, setSilmeAdayi] = useState<PartnerEgitimi | null>(null);
  const kilit = useRef(false);
  const incelemeOdak = useRef<Element|null>(null);
  const istek = useRef({ surum: 0, controller: null as AbortController | null });
  const { mesajlar, basari } = useHataMesaji();

  const oku = useCallback(async (istenenSayfa=1, ekle=false) => {
    const kontrol = istek.current; kontrol.controller?.abort();
    const controller = new AbortController(); kontrol.controller = controller;
    const surum = ++kontrol.surum;
    setYukleniyor(true); setHata("");
    try {
      const r = await fetch(`/partner/api/egitimler?${new URLSearchParams({ durum, sayfa: String(istenenSayfa), arama, baslangic, bitis })}`, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      if (r.status === 401) { window.location.replace("/partner/profil"); return; }
      const data: unknown = await r.json();
      if (!r.ok || !partnerEgitimListesiGecerli(data)) throw new Error();
      if (surum === kontrol.surum) {
        setListe(eski=>ekle&&eski?{toplam:data.toplam,kayitlar:[...eski.kayitlar,...data.kayitlar.filter(yeni=>!eski.kayitlar.some(k=>k.egitim_id===yeni.egitim_id))]}:data);
        setSayfa(istenenSayfa);
      }
    } catch {
      if (surum === kontrol.surum && !controller.signal.aborted) { if(!ekle)setListe(null); setHata("Eğitimleriniz okunamadı. Yenile ile tekrar deneyin."); }
    } finally { if (surum === kontrol.surum) setYukleniyor(false); }
  }, [durum, arama, baslangic, bitis]);
  useEffect(() => { const kontrol = istek.current; void oku(); return () => { kontrol.surum++; kontrol.controller?.abort(); }; }, [oku,aramaTekrari]);

  useEffect(()=>{
    if(kaydedildi&&!bildirimGosterildi.current){
      bildirimGosterildi.current=true;basari("Eğitim bilgileri kaydedildi.");
      window.history.replaceState(window.history.state,"","/partner/egitimler");
    }
  },[kaydedildi,basari]);

  function editorAc(egitim: PartnerEgitimi | null) {
    if (kilit.current) return;
    if(!egitim){router.push("/partner/egitimler/yeni");return;}
    incelemeOdak.current = document.activeElement;
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
      await oku();
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
      await oku();
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
  const kart=(e:PartnerEgitimi)=><PartnerEgitimKarti key={e.egitim_id} egitim={e} onIncele={()=>editorAc(e)} islemler={<div className={styles.kartIslemleri} data-islem-duzeni="yatay">
    {e.durum==="taslak"&&<Button type="button" className={styles.yayimlaButonu} disabled={kaydediliyor||cikiliyor||!!editor} onClick={ev=>{ev.stopPropagation();setHata("");setYayinAdayi(e);}}><Send size={12} aria-hidden="true"/>Agora’da Yayımla</Button>}
    <Button type="button" variant="outline" disabled={kaydediliyor||cikiliyor} onClick={ev=>{ev.stopPropagation();editorAc(e);}}><Pencil size={12} aria-hidden="true"/>İncele</Button>
    <Button type="button" variant="outline" className={styles.silButonu} disabled={kaydediliyor||cikiliyor} onClick={ev=>{ev.stopPropagation();setHata("");setSilmeAdayi(e);}}><Trash2 size={12} aria-hidden="true"/>{silinenId===e.egitim_id?"Siliniyor…":"Eğitimi Sil"}</Button>
  </div>}/>;
  const egitimFormu=editor?<PartnerEgitimFormu key={editor.istekId} egitim={editor.egitim} istekId={editor.istekId} saltOkunur baslikGoster={false} onKapat={()=>{if(!kilit.current)setEditor(null);}} onIslem={aktif => { kilit.current = aktif; setKaydediliyor(aktif); }} onKaydedildi={async () => {
        setEditor(null); basari("Eğitim bilgileri kaydedildi.");
        if (durum !== "tumu" || arama || baslangic || bitis) { setListe(null); setDurum("tumu"); setArama(""); setAramaMetni(""); setBaslangic(""); setBitis(""); } else await oku();
      }} />:null;
  return <PartnerKabugu className={styles.page} firmaAdi={sirketAdi} onCikis={()=>void cikis()} onAnaSayfa={()=>router.push("/partner/egitimler")} engelli={kaydediliyor||cikiliyor}>
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
        <AlertDialogHeader><AlertDialogTitle className="sr-only">Yayımlama Onayı</AlertDialogTitle><AlertDialogDescription>Yayınınız Cogniti Agora'da firmaların tercihine sunulacaktır. Onaylıyor musunuz?</AlertDialogDescription></AlertDialogHeader>
        {hata && <p role="alert" className={styles.hata}>{hata}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={kaydediliyor}>Hayır</AlertDialogCancel>
          <AlertDialogAction disabled={kaydediliyor || cikiliyor} onClick={e => { e.preventDefault(); if (yayinAdayi) void yayimla(yayinAdayi); }}>{kaydediliyor ? "Yayımlanıyor…" : "Evet"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className={styles.icerik}>
      <div className={styles.baslik}><div><h1>Eğitimlerim</h1></div><Button type="button" className={styles.yeniButonu} disabled={!acik} onClick={() => editorAc(null)}><Plus size={18} aria-hidden="true" />Yeni Eğitim</Button></div>
      {editor?.egitim?<Dialog.Root open onOpenChange={open=>{if(!open&&!kilit.current)setEditor(null);}}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--tema-yayin-detay-ortu)] backdrop-blur-sm"/>
          <Dialog.Content className={`fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100%_-_24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--tema-yayin-detay-dis-cizgi)] bg-[var(--tema-yayin-detay-yuzey)] shadow-2xl ${styles.incelemeModal}`}
            onEscapeKeyDown={ev=>{if(kilit.current)ev.preventDefault();}}
            onInteractOutside={ev=>{if(kilit.current)ev.preventDefault();}}
            onCloseAutoFocus={ev=>{ev.preventDefault();if(incelemeOdak.current instanceof HTMLElement&&incelemeOdak.current.isConnected)incelemeOdak.current.focus();}}>
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--tema-yayin-detay-ust-cizgi)] bg-[var(--tema-yayin-detay-ust-zemin)] px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--tema-yayin-detay-simge-zemini)] text-[var(--tema-yayin-detay-eylem)]"><Film className="size-5" aria-hidden="true"/></span>
                <div className="min-w-0">
                  {editor.egitim.partner_egitim_id&&<p className="mb-1 font-mono text-xs font-bold text-[var(--tema-yayin-detay-ust-etiket)]">{editor.egitim.partner_egitim_id}</p>}
                  <Dialog.Title className="truncate text-base font-bold text-[var(--tema-yayin-detay-baslik)]">{editor.egitim.egitim_adi}</Dialog.Title>
                </div>
              </div>
              {editor.egitim.durum==="taslak"&&<Button type="button" variant="outline" onClick={()=>router.push(`/partner/egitimler/yeni?egitim=${editor.egitim!.egitim_id}`)}><Pencil size={14} aria-hidden="true"/>Taslağı Düzenle</Button>}
              <Dialog.Close disabled={kaydediliyor} aria-label="İncelemeyi Kapat" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--tema-yayin-detay-cizgi)] text-[var(--tema-yayin-detay-aciklama)] hover:bg-[var(--tema-yayin-detay-kapat-hover)] disabled:opacity-50"><X className="size-4" aria-hidden="true"/></Dialog.Close>
              <Dialog.Description className="sr-only">Seçilen eğitimin bilgilerini, öğrenme aracını ve soru setini inceleyin.</Dialog.Description>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--tema-yayin-detay-govde-zemin)] p-4 sm:p-6">{egitimFormu}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>:null}
      <div className={styles.araclar}>
        <div className={styles.durumAlani}><SadeKapsulFiltre etiket="Eğitim Durumu" deger={durum} onDegistir={v=>{if(kilit.current||!["tumu","taslak","yayinda","pasif"].includes(v))return;setDurum(v as PartnerEgitimDurumu|"tumu");setListe(null);}} secenekler={[
          {deger:"tumu",etiket:"Tümü"},{deger:"taslak",etiket:"Taslak"},{deger:"yayinda",etiket:"Yayında"},{deger:"pasif",etiket:"Pasif"},
        ].map(x=>({...x,disabled:kaydediliyor||cikiliyor}))}/>{liste&&<span className={styles.sayac}>{liste.toplam} Eğitim</span>}</div>
        <div className={styles.eylemler}>
          <form role="search" aria-label="Eğitim Arama" className={styles.arama} onSubmit={ev=>{ev.preventDefault();if(kilit.current||cikiliyor)return;setArama(aramaMetni.trim());setListe(null);setAramaTekrari(n=>n+1);}}>
            <label htmlFor="partner-egitim-arama" className="sr-only">Eğitim Adı, PE Kodu veya Fiyat</label>
            <input id="partner-egitim-arama" type="search" placeholder="Eğitim adı, PE kodu veya fiyat" maxLength={200} value={aramaMetni} disabled={kaydediliyor||cikiliyor} onChange={ev=>setAramaMetni(ev.target.value)}/>
            <Button type="submit" className={styles.araButonu} disabled={kaydediliyor||cikiliyor}>Ara</Button>
          </form>
          <YenileButonu yenileniyor={yukleniyor} disabled={kaydediliyor||cikiliyor} onYenile={()=>oku()}/>
        </div>
      </div>
      <div className={styles.tarihler} role="group" aria-label="Yayın Tarihi Filtresi">
        <label>Yayın Tarihi · Başlangıç<input type="date" aria-label="Yayın Tarihi Başlangıç" value={baslangic} max={bitis||undefined} disabled={kaydediliyor||cikiliyor} onChange={ev=>{setBaslangic(ev.target.value);setListe(null);}}/></label>
        <label>Bitiş<input type="date" aria-label="Yayın Tarihi Bitiş" value={bitis} min={baslangic||undefined} disabled={kaydediliyor||cikiliyor} onChange={ev=>{setBitis(ev.target.value);setListe(null);}}/></label>
        {(baslangic||bitis)&&<Button type="button" variant="outline" disabled={kaydediliyor||cikiliyor} onClick={()=>{setBaslangic("");setBitis("");setListe(null);}}>Tarihleri Temizle</Button>}
      </div>
      {hata && !silmeAdayi && !yayinAdayi && <p role="alert" className={styles.hata}>{hata}</p>}
      {yukleniyor && !liste && <p role="status" className={styles.bilgi}>Eğitimleriniz yükleniyor…</p>}
      {liste && liste.toplam === 0 && !arama && !baslangic && !bitis && <section className={styles.bos}>
        <div className={styles.bosSimge}><GraduationCap size={36} aria-hidden="true" /></div><h2>{durum === "tumu" ? "İlk Eğitiminizi Ekleyin" : "Bu Durumda Eğitim Bulunmuyor"}</h2><p>{durum === "tumu" ? "Eğitimlerinizi burada listeleyebilir ve yönetebilirsiniz." : "Diğer eğitimlerinizi görmek için Tümü seçeneğine geçin."}</p>
        {durum === "tumu" && <Button type="button" className={styles.yeniButonu} disabled={!acik} onClick={() => editorAc(null)}><Plus size={18} aria-hidden="true" />Yeni Eğitim</Button>}
      </section>}
      {liste && liste.toplam === 0 && !!(arama||baslangic||bitis) && <p className={styles.bilgi}>Arama ve filtrelere uygun eğitim bulunamadı.</p>}
      {liste && liste.kayitlar.length > 0 && <>
        <MobilYayinAkisi<PartnerEgitimi> kayitlar={liste.kayitlar} kayitAnahtari={e=>e.egitim_id} renderKart={kart} sayacGoster={false}
          sifirlamaAnahtari={`${durum}:${arama}:${baslangic}:${bitis}`}
          masaustuIcerik={<div className={styles.kartlar}>{liste.kayitlar.map(e=><div key={e.egitim_id} className={styles.kart}>{kart(e)}</div>)}</div>}/>
        {!yukleniyor&&<DahaFazlaGoster dahaVar={liste.kayitlar.length<liste.toplam} gorunenSayi={liste.kayitlar.length} toplam={liste.toplam} onGoster={()=>{if(!kilit.current&&!cikiliyor)void oku(sayfa+1,true);}}/>}
        {yukleniyor&&<p role="status" className={styles.bilgi}>Eğitimleriniz yükleniyor…</p>}
      </>}
    </div>
  </PartnerKabugu>;
}
