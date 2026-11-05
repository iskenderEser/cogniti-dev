"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { PartnerEgitimKarti } from "@/components/yayin/PartnerEgitimKarti";
import { HataMesajiContainer,useHataMesaji } from "@/components/HataMesaji";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle } from "@/components/ui/alert-dialog";
import { partnerEgitimListesiGecerli,type PartnerEgitimi,type PartnerEgitimListesi } from "@/lib/agora/partnerEgitimleri";
import PartnerYayinInceleme, { type PartnerYayinIncelemeDetayi } from "./PartnerYayinInceleme";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { DahaFazlaGoster } from "@/components/liste/DahaFazlaGoster";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import layout from "./PartnerYayinlari.module.css";
import styles from "../admin.module.css";
type Islem="aktif"|"pasif"|"sil";
type Detay=PartnerYayinIncelemeDetayi;

export default function PartnerYayinlari({partnerId}:{partnerId:string}) {
  const [liste,setListe]=useState<PartnerEgitimListesi|null>(null),[durum,setDurum]=useState("tumu"),[sayfa,setSayfa]=useState(1),[yukleniyor,setYukleniyor]=useState(true),[hata,setHata]=useState(""),[kaydediliyor,setKaydediliyor]=useState(false);
  const [aday,setAday]=useState<{egitim:PartnerEgitimi;islem:Islem}|null>(null),[detayId,setDetayId]=useState<string|null>(null),[detay,setDetay]=useState<Detay|null>(null),[detayHata,setDetayHata]=useState("");
  const [aramaMetni,setAramaMetni]=useState(""),[arama,setArama]=useState(""),[aramaTekrari,setAramaTekrari]=useState(0);
  const [baslangic,setBaslangic]=useState(""),[bitis,setBitis]=useState("");
  const kilit=useRef(false),listeIstegi=useRef<{surum:number;controller:AbortController|null}>({surum:0,controller:null});
  const {mesajlar,basari}=useHataMesaji();const endpoint=`/admin/api/partnerler/${partnerId}/yayinlar`;
  const oku=useCallback(async(istenenSayfa=1,ekle=false)=>{
    const kontrol=listeIstegi.current;kontrol.controller?.abort();const c=new AbortController(),surum=++kontrol.surum;kontrol.controller=c;setYukleniyor(true);setHata("");
    try{
      const r=await fetch(`${endpoint}?${new URLSearchParams({durum,sayfa:String(istenenSayfa),arama,baslangic,bitis})}`,{cache:"no-store",signal:AbortSignal.any([c.signal,AbortSignal.timeout(15000)])});const d=await r.json();
      if(!r.ok)throw new Error(d.hata||"Yayınlar okunamadı.");if(!partnerEgitimListesiGecerli(d))throw new Error("Yayın bilgileri doğrulanamadı.");
      if(surum===kontrol.surum){
        setListe(eski=>ekle&&eski?{toplam:d.toplam,kayitlar:[...eski.kayitlar,...d.kayitlar.filter(yeni=>!eski.kayitlar.some(k=>k.egitim_id===yeni.egitim_id))]}:d);
        setSayfa(istenenSayfa);
      }
    }catch(e){if(!c.signal.aborted&&surum===kontrol.surum){if(!ekle)setListe(null);setHata(e instanceof Error?e.message:"Yayınlar okunamadı.");}}
    finally{if(!c.signal.aborted&&surum===kontrol.surum)setYukleniyor(false);}
  },[endpoint,durum,arama,baslangic,bitis]);
  useEffect(()=>{const k=listeIstegi.current;void oku();return()=>{k.surum++;k.controller?.abort();};},[oku,aramaTekrari]);
  useEffect(()=>{
    setDetay(null);setDetayHata("");if(!detayId)return;
    const c=new AbortController();
    void(async()=>{try{
      const r=await fetch(`${endpoint}?egitim_id=${detayId}`,{cache:"no-store",signal:AbortSignal.any([c.signal,AbortSignal.timeout(15000)])});const d=await r.json();
      if(!r.ok)throw new Error(d.hata||"Eğitim bilgileri okunamadı.");if(d.egitim?.egitim_id!==detayId||!d.medya)throw new Error("Eğitim bilgileri doğrulanamadı.");
      if(!c.signal.aborted)setDetay(d);
    }catch(e){if(!c.signal.aborted)setDetayHata(e instanceof Error?e.message:"Eğitim bilgileri okunamadı.");}})();return()=>c.abort();
  },[endpoint,detayId]);
  function incele(e:PartnerEgitimi){if(kilit.current)return;setDetayId(e.egitim_id);}

  async function uygula(){
    if(kilit.current||!aday)return;kilit.current=true;setKaydediliyor(true);setHata("");
    try{
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(30000),body:JSON.stringify({egitim_id:aday.egitim.egitim_id,islem:aday.islem,surum:aday.egitim.surum})});const d=await r.json();
      if(!r.ok)throw new Error(d.hata||"Yayın işlemi tamamlanamadı.");
      basari(aday.islem==="aktif"?"Eğitim aktife alındı.":aday.islem==="pasif"?"Eğitim pasife alındı.":"Eğitim silindi.");setAday(null);setDetayId(null);
      await oku();
    }catch(e){setHata(e instanceof Error?e.message:"İşlem sonucu doğrulanamadı. Listeyi yenileyin.");}
    finally{kilit.current=false;setKaydediliyor(false);}
  }
  const kart=(k:PartnerEgitimi)=><PartnerEgitimKarti key={k.egitim_id} egitim={k} onIncele={()=>incele(k)} islemler={<div className={layout.kartIslemleri} data-islem-duzeni="yatay">
      <button type="button" className={styles.button} disabled={kaydediliyor} onClick={ev=>{ev.stopPropagation();incele(k);}}>İncele</button>
      {k.durum!=="taslak"&&<button type="button" className={styles.button} disabled={kaydediliyor} onClick={ev=>{ev.stopPropagation();setHata("");setAday({egitim:k,islem:k.durum==="yayinda"?"pasif":"aktif"});}}>{k.durum==="yayinda"?"Pasife Al":"Aktife Al"}</button>}
      <button type="button" className={styles.button} disabled={kaydediliyor} onClick={ev=>{ev.stopPropagation();setHata("");setAday({egitim:k,islem:"sil"});}}>Sil</button>
    </div>} />;
  return <div className={layout.sayfa}>
    <HataMesajiContainer mesajlar={mesajlar} />
    <AlertDialog open={!!aday} onOpenChange={open=>{if(!open&&!kilit.current){setAday(null);setHata("");}}}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{aday?.islem==="sil"?"Eğitimi Sil":aday?.islem==="pasif"?"Eğitimi Pasife Al":"Eğitimi Aktife Al"}</AlertDialogTitle><AlertDialogDescription>“{aday?.egitim.egitim_adi}” {aday?.islem==="sil"?"partnerin eğitim listesinden ve Agora’dan kaldırılacaktır.":aday?.islem==="pasif"?"Agora’da gösterilmeyecektir.":"Agora’da yeniden listelenecektir."}</AlertDialogDescription></AlertDialogHeader>
        {hata&&<p role="alert" className={styles.notice}>{hata}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={kaydediliyor}>İptal</AlertDialogCancel><AlertDialogAction disabled={kaydediliyor} onClick={ev=>{ev.preventDefault();void uygula();}}>{kaydediliyor?"İşleniyor…":aday?.islem==="sil"?"Sil":aday?.islem==="pasif"?"Pasife Al":"Aktife Al"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className={layout.kontroller}>
      <div className={layout.durumAlani}><SadeKapsulFiltre etiket="Yayın Durumu" deger={durum} onDegistir={v=>{if(kilit.current)return;setDurum(v);setSayfa(1);setListe(null);setDetayId(null);}} secenekler={[{deger:"tumu",etiket:"Tümü"},{deger:"yayinda",etiket:"Aktif"},{deger:"pasif",etiket:"Pasif"},{deger:"taslak",etiket:"Taslak"}].map(x=>({...x,disabled:kaydediliyor}))}/>{liste&&<span className={layout.sayac}>{liste.toplam} Eğitim</span>}</div>
      <div className={layout.eylemler}>
        <form role="search" aria-label="Partner Yayın Arama" className={layout.arama} onSubmit={ev=>{ev.preventDefault();if(kilit.current)return;setArama(aramaMetni.trim());setSayfa(1);setListe(null);setDetayId(null);setAramaTekrari(n=>n+1);}}>
          <label htmlFor="partner-yayin-arama" className="sr-only">Eğitim Adı, PE Kodu veya Fiyat</label>
          <input id="partner-yayin-arama" type="search" placeholder="Eğitim adı, PE kodu veya fiyat" maxLength={200} value={aramaMetni} disabled={kaydediliyor} onChange={ev=>setAramaMetni(ev.target.value)}/>
          <button type="submit" className={styles.button} disabled={kaydediliyor}>Ara</button>
        </form>
        <YenileButonu yenileniyor={yukleniyor} disabled={kaydediliyor} onYenile={()=>oku()}/>
      </div>
    </div>
    <div className={layout.tarihler} role="group" aria-label="Yayın Tarihi Filtresi">
      <label>Yayın Tarihi · Başlangıç<input type="date" aria-label="Yayın Tarihi Başlangıç" value={baslangic} max={bitis||undefined} disabled={kaydediliyor} onChange={ev=>{setBaslangic(ev.target.value);setSayfa(1);setListe(null);setDetayId(null);}}/></label>
      <label>Bitiş<input type="date" aria-label="Yayın Tarihi Bitiş" value={bitis} min={baslangic||undefined} disabled={kaydediliyor} onChange={ev=>{setBitis(ev.target.value);setSayfa(1);setListe(null);setDetayId(null);}}/></label>
      {(baslangic||bitis)&&<button type="button" className={styles.button} disabled={kaydediliyor} onClick={()=>{setBaslangic("");setBitis("");setSayfa(1);setListe(null);}}>Tarihleri Temizle</button>}
    </div>
    {hata&&!aday&&<p role="alert" className={styles.notice}>{hata}</p>}
    {yukleniyor&&!liste&&<p role="status" className={layout.bos}>Yayınlar yükleniyor…</p>}
    {liste&&!liste.kayitlar.length&&<p className={layout.bos}>Arama ve durum seçimine uygun eğitim bulunmuyor.</p>}
    {detayId&&<PartnerYayinInceleme key={`${partnerId}:${detayId}`} detay={detay?.egitim.egitim_id===detayId?detay:null} hata={detayHata} baslik={liste?.kayitlar.find(e=>e.egitim_id===detayId)?.egitim_adi??"Yayın İncelemesi"} onKapat={()=>setDetayId(null)}/>}
    {liste&&!!liste.kayitlar.length&&<><MobilYayinAkisi<PartnerEgitimi>
      kayitlar={liste.kayitlar} kayitAnahtari={k=>k.egitim_id} renderKart={kart} sayacGoster={false}
      sifirlamaAnahtari={`${partnerId}:${durum}:${arama}:${baslangic}:${bitis}`}
      masaustuIcerik={<div className={layout.kartlar}>{liste.kayitlar.map(k=><div key={k.egitim_id} className={layout.kart}>{kart(k)}</div>)}</div>}
    />{!yukleniyor&&<DahaFazlaGoster dahaVar={liste.kayitlar.length<liste.toplam} gorunenSayi={liste.kayitlar.length} toplam={liste.toplam} onGoster={()=>{if(!kaydediliyor&&!yukleniyor)void oku(sayfa+1,true);}}/>}
      {yukleniyor&&<p role="status" className={layout.sayac}>Yayınlar yükleniyor…</p>}</>}
  </div>;
}
