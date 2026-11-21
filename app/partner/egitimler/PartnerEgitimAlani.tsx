"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartnerKabugu from "@/components/agora/PartnerKabugu";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { GraduationCap, Pencil, Plus, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PartnerEgitimFormu from "./PartnerEgitimFormu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SadeKapsulFiltre, SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { PartnerEgitimKarti } from "@/components/yayin/PartnerEgitimKarti";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";
import { partnerEgitimListesiGecerli, type PartnerEgitimi, type PartnerEgitimDurumu, type PartnerEgitimListesi } from "@/lib/agora/partnerEgitimleri";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { DahaFazlaGoster } from "@/components/liste/DahaFazlaGoster";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import styles from "./egitimler.module.css";
import { AgoraRafOklari } from "@/components/agora/AgoraRafOklari";
import rafStyles from "@/components/agora/AgoraVitrini.module.css";

export default function PartnerEgitimAlani({ sirketAdi, kaydedildi=false, baslangicDurumu="tumu" }: { sirketAdi: string; logoSurumu: number; kaydedildi?:boolean; baslangicDurumu?:PartnerEgitimDurumu|"tumu" }) {
  const router=useRouter();
  const raf=useRef<HTMLDivElement>(null);
  const bildirimGosterildi=useRef(false);
  const [liste, setListe] = useState<PartnerEgitimListesi | null>(null);
  const [durum, setDurum] = useState<PartnerEgitimDurumu | "tumu">(baslangicDurumu);
  const [hedef, setHedef] = useState<HedefRol | "">("");
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
      const r = await fetch(`/partner/api/egitimler?${new URLSearchParams({ durum, sayfa: String(istenenSayfa), arama, baslangic, bitis, hedef })}`, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      if (r.status === 401) { window.location.replace("/partner/profil"); return; }
      const data: unknown = await r.json();
      if (!r.ok || !partnerEgitimListesiGecerli(data)) throw new Error();
      if (surum === kontrol.surum) {
        setListe(eski=>ekle&&eski?{toplam:data.toplam,video_sayisi:data.video_sayisi,podcast_sayisi:data.podcast_sayisi,kayitlar:[...eski.kayitlar,...data.kayitlar.filter(yeni=>!eski.kayitlar.some(k=>k.egitim_id===yeni.egitim_id))]}:data);
        setSayfa(istenenSayfa);
      }
    } catch {
      if (surum === kontrol.surum && !controller.signal.aborted) { if(!ekle)setListe(null); setHata("Yayınlarınız okunamadı. Yenile ile tekrar deneyin."); }
    } finally { if (surum === kontrol.surum) setYukleniyor(false); }
  }, [durum, arama, baslangic, bitis, hedef]);
  useEffect(() => { const kontrol = istek.current; void oku(); return () => { kontrol.surum++; kontrol.controller?.abort(); }; }, [oku,aramaTekrari]);

  useEffect(()=>{
    if(kaydedildi&&!bildirimGosterildi.current){
      bildirimGosterildi.current=true;basari("Yayın bilgileri kaydedildi.");
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
        if (r.status === 409) { setSilmeAdayi(null); await oku(); setHata(typeof data.hata === "string" ? data.hata : "Yayın değişmiş. Listeyi kontrol edin."); return; }
        throw new Error(typeof data.hata === "string" ? data.hata : "Yayın silinemedi.");
      }
      if (editor?.egitim?.egitim_id === egitim.egitim_id) setEditor(null);
      setSilmeAdayi(null); basari("Yayın silindi.");
      await oku();
    } catch (e) { setHata(e instanceof Error ? e.message : "Silme sonucu doğrulanamadı. Listeyi yenileyip kontrol edin."); }
    finally { kilit.current = false; setKaydediliyor(false); setSilinenId(null); }
  }
  async function yayimla(egitim: PartnerEgitimi) {
    if (kilit.current || cikiliyor) return;
    kilit.current=true;setKaydediliyor(true);setHata("");
    try {
      const r=await fetch("/partner/api/yayinla",{method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(30000),body:JSON.stringify({egitim_id:egitim.egitim_id,surum:egitim.surum})});
      const d=await r.json();if(!r.ok)throw new Error(d.hata||"Yayın yayımlanamadı.");
      setYayinAdayi(null);basari("Yayın Agora’da yayımlandı.");
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
  const pasifSayfa = baslangicDurumu === "pasif";
  const gorunenKayitlar = liste
    ? (pasifSayfa ? liste.kayitlar : liste.kayitlar.filter(e => e.durum !== "pasif"))
    : [];
  const gorunenToplam = liste
    ? (pasifSayfa ? liste.toplam : Math.max(0, liste.toplam - (liste.kayitlar.length - gorunenKayitlar.length)))
    : 0;
  const acik = !!liste && !yukleniyor && !kaydediliyor && !cikiliyor;
  const statKartlari = [
    { etiket: "Tüm Video ve Podcast", deger: liste?.toplam },
    { etiket: "Video", deger: liste?.video_sayisi },
    { etiket: "Podcast", deger: liste?.podcast_sayisi },
  ];
  const kart=(e:PartnerEgitimi)=><PartnerEgitimKarti key={e.egitim_id} egitim={e} onIncele={()=>router.push(`/partner/egitimler/yeni?egitim=${e.egitim_id}`)} islemler={<div>
    <Button type="button" variant="outline" disabled={kaydediliyor||cikiliyor} onClick={ev=>{ev.stopPropagation();router.push(`/partner/egitimler/yeni?egitim=${e.egitim_id}`);}}><Pencil size={12} aria-hidden="true"/>Düzenle</Button>
  </div>}/>;
  const egitimFormu=editor?<PartnerEgitimFormu key={editor.istekId} egitim={editor.egitim} istekId={editor.istekId} saltOkunur baslikGoster={false} onKapat={()=>{if(!kilit.current)setEditor(null);}} onIslem={aktif => { kilit.current = aktif; setKaydediliyor(aktif); }} onKaydedildi={async () => {
        setEditor(null); basari("Yayın bilgileri kaydedildi.");
        if (durum !== "tumu" || arama || baslangic || bitis || hedef) { setListe(null); setDurum("tumu"); setArama(""); setAramaMetni(""); setBaslangic(""); setBitis(""); setHedef(""); } else await oku();
      }} />:null;
  return <PartnerKabugu className={styles.page} firmaAdi={sirketAdi} onCikis={()=>void cikis()} onAnaSayfa={()=>router.push("/partner/egitimler")} engelli={kaydediliyor||cikiliyor}>
    <HataMesajiContainer mesajlar={mesajlar} />
    <AlertDialog open={!!silmeAdayi} onOpenChange={open => { if (!open && !kilit.current) { setSilmeAdayi(null); setHata(""); } }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Yayını Sil</AlertDialogTitle><AlertDialogDescription>“{silmeAdayi?.egitim_adi}” yayınını silmek istediğinize emin misiniz? Yayın, listenizden kaldırılacak.</AlertDialogDescription></AlertDialogHeader>
        {hata && <p role="alert" className={styles.hata}>{hata}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={kaydediliyor}>İptal</AlertDialogCancel>
          <AlertDialogAction className={styles.silOnayButonu} disabled={kaydediliyor || cikiliyor} onClick={e => { e.preventDefault(); if (silmeAdayi) void egitimiSil(silmeAdayi); }}>{silinenId ? "Siliniyor…" : "Sil"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!yayinAdayi} onOpenChange={open => { if (!open && !kilit.current) { setYayinAdayi(null); setHata(""); } }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle className="sr-only">Yayımlama Onayı</AlertDialogTitle><AlertDialogDescription>Yayınınız Cogniti Agora&apos;da firmaların tercihine sunulacaktır. Onaylıyor musunuz?</AlertDialogDescription></AlertDialogHeader>
        {hata && <p role="alert" className={styles.hata}>{hata}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={kaydediliyor}>Hayır</AlertDialogCancel>
          <AlertDialogAction disabled={kaydediliyor || cikiliyor} onClick={e => { e.preventDefault(); if (yayinAdayi) void yayimla(yayinAdayi); }}>{kaydediliyor ? "Yayımlanıyor…" : "Evet"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className={styles.icerik}>
      <div className={styles.baslik}><div><h1>{pasifSayfa ? "Pasif Yayınlar" : "Agora Video ve Podcast Yayınlar"}</h1></div>{!pasifSayfa && <Button type="button" className={styles.yeniButonu} disabled={!acik} onClick={() => editorAc(null)}><Plus size={18} aria-hidden="true" />Yeni Yayın</Button>}</div>
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
              <Dialog.Description className="sr-only">Seçilen yayının bilgilerini, öğrenme aracını ve soru setini inceleyin.</Dialog.Description>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--tema-yayin-detay-govde-zemin)] p-4 sm:p-6">{egitimFormu}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>:null}
      <section className={styles.statlar} aria-label="Video ve podcast yayın sayıları" aria-busy={yukleniyor}>
        {statKartlari.map((k) => (
          <article key={k.etiket} className={styles.stat}>
            <span>{k.etiket}</span>
            <strong>{k.deger == null ? "—" : k.deger.toLocaleString("tr-TR")}</strong>
          </article>
        ))}
      </section>
      <div className={styles.hedefFiltreleri}>
        <SadeKontrolGrubu tur="sekme" aria-label="Hedef kitle">
          <SadeKontrolButonu aria-pressed={hedef === ""} disabled={kaydediliyor || cikiliyor} onClick={() => { if (kilit.current || cikiliyor || hedef === "") return; setHedef(""); setListe(null); }}>Tüm Hedef Kitleler</SadeKontrolButonu>
          {TUM_HEDEF_ROLLER.map((r) => (
            <SadeKontrolButonu key={r} aria-pressed={hedef === r} disabled={kaydediliyor || cikiliyor} onClick={() => { if (kilit.current || cikiliyor || hedef === r) return; setHedef(r); setListe(null); }}>
              {r === "eczanem" ? "Eczanem (Eczane Danışanı)" : HEDEF_ROL_TASARIM[r].tamEtiket}
            </SadeKontrolButonu>
          ))}
        </SadeKontrolGrubu>
      </div>
      <div className={styles.araclar}>
        <div className={styles.durumAlani}>{!pasifSayfa && <SadeKapsulFiltre etiket="Yayın Durumu" deger={durum} onDegistir={v=>{if(kilit.current||!["tumu","taslak","yayinda"].includes(v))return;setDurum(v as PartnerEgitimDurumu|"tumu");setListe(null);}} secenekler={[
          {deger:"tumu",etiket:"Tümü"},{deger:"yayinda",etiket:"Yayında"},{deger:"taslak",etiket:"Taslak"},
        ].map(x=>({...x,disabled:kaydediliyor||cikiliyor}))}/>}{liste&&<span className={styles.sayac}>{gorunenToplam} Yayın</span>}</div>
        <div className={styles.eylemler}>
          <form role="search" aria-label="Yayın Arama" className={styles.arama} onSubmit={ev=>{ev.preventDefault();if(kilit.current||cikiliyor)return;setArama(aramaMetni.trim());setListe(null);setAramaTekrari(n=>n+1);}}>
            <label htmlFor="partner-egitim-arama" className="sr-only">Yayın Adı, PE Kodu veya Fiyat</label>
            <input id="partner-egitim-arama" type="search" placeholder="Yayın adı, PE kodu veya fiyat" maxLength={200} value={aramaMetni} disabled={kaydediliyor||cikiliyor} onChange={ev=>setAramaMetni(ev.target.value)}/>
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
      {yukleniyor && !liste && <p role="status" className={styles.bilgi}>Yayınlarınız yükleniyor…</p>}
      {liste && gorunenKayitlar.length === 0 && !arama && !baslangic && !bitis && !hedef && <section className={styles.bos}>
        <div className={styles.bosSimge}><GraduationCap size={36} aria-hidden="true" /></div><h2>{pasifSayfa ? "Pasif Yayın Bulunmuyor" : durum === "tumu" ? "İlk Yayınınızı Ekleyin" : "Bu Durumda Yayın Bulunmuyor"}</h2><p>{pasifSayfa ? "Pasife aldığınız video veya podcast yayınlarınız burada listelenir." : durum === "tumu" ? "Yayınlarınızı burada listeleyebilir ve yönetebilirsiniz." : "Diğer yayınlarınızı görmek için Tümü seçeneğine geçin."}</p>
        {!pasifSayfa && durum === "tumu" && <Button type="button" className={styles.yeniButonu} disabled={!acik} onClick={() => editorAc(null)}><Plus size={18} aria-hidden="true" />Yeni Yayın</Button>}
      </section>}
      {liste && gorunenKayitlar.length === 0 && !!(arama||baslangic||bitis||hedef) && <p className={styles.bilgi}>Arama ve filtrelere uygun yayın bulunamadı.</p>}
      {liste && gorunenKayitlar.length > 0 && <>
        <MobilYayinAkisi<PartnerEgitimi> kayitlar={gorunenKayitlar} kayitAnahtari={e=>e.egitim_id} renderKart={kart} sayacGoster={false}
          sifirlamaAnahtari={`${durum}:${arama}:${baslangic}:${bitis}:${hedef}`}
          masaustuIcerik={<div className={rafStyles.rafAlani}><AgoraRafOklari raf={raf} baslik={pasifSayfa ? "Pasif Yayınlar" : "Agora Video ve Podcast Yayınlar"}/><div key={`${durum}:${arama}:${baslangic}:${bitis}:${hedef}`} ref={raf} className={styles.kartlar}>{gorunenKayitlar.map(e=><div key={e.egitim_id} className={styles.kart}>{kart(e)}</div>)}</div></div>}/>
        {!yukleniyor&&<DahaFazlaGoster dahaVar={liste.kayitlar.length<liste.toplam} gorunenSayi={gorunenKayitlar.length} toplam={gorunenToplam} onGoster={()=>{if(!kilit.current&&!cikiliyor)void oku(sayfa+1,true);}}/>}
        {yukleniyor&&<p role="status" className={styles.bilgi}>Yayınlarınız yükleniyor…</p>}
      </>}
    </div>
  </PartnerKabugu>;
}
