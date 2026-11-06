"use client";

import { useEffect,useRef,useState } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { URETICI_ROLLER,TUM_HEDEF_ROLLER,type HedefRol } from "@/lib/utils/roller";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import { Button } from "@/components/ui/button";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SadeKontrolGrubu,SadeKontrolButonu,SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { AgoraDenemeOynaticisi } from "./AgoraDenemeOynaticisi";
import { AGORA_KORUMA_SURUMU,type AgoraDenemeKaynagi } from "@/lib/agora/koruma";
import { agoraRaflari,agoraTokenTutari,type AgoraYayini } from "@/lib/agora/vitrin";
import { useAgoraVitrini } from "./AgoraVitrinBaglami";
import { AgoraPodcastBilgisi } from "./AgoraPodcastBilgisi";
import { AgoraSiparisModali } from "./AgoraSiparisModali";
import { HataMesajiContainer,useHataMesaji } from "@/components/HataMesaji";
import styles from "./AgoraVitrini.module.css";
import { AgoraRafOklari } from "./AgoraRafOklari";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";

function AgoraRafi({baslik,yayinlar,onIncele,onSiparis}:{baslik:string;yayinlar:AgoraYayini[];onIncele:(y:AgoraYayini)=>void;onSiparis:(y:AgoraYayini)=>void}) {
 const raf=useRef<HTMLDivElement>(null),agora=useAgoraVitrini();
 const {kullanici}=useAuth();
 const uretici=URETICI_ROLLER.includes(kullanici?.rol.toLowerCase()??"");
 const kart=(y:AgoraYayini)=><YayinKarti
    yayin={{yayin_id:y.egitim_id,urun_adi:y.egitim_adi,firma_adi:y.sirket_adi,icerik_turu:y.kategori,arac_turu:y.yayin_araci,
     thumbnail_url:y.kapak_url,video_url:y.kapak_video_guid,yayin_tarihi:y.yayinlandi_at,begeni_sayisi:y.begeni_sayisi,favori_sayisi:y.favori_sayisi,begeni_mi:y.begeni_mi,favori_mi:y.favori_mi}}
    onClick={y.satin_alindi?undefined:()=>onIncele(y)} thumbnailSolUstRozet={y.satin_alindi?<span className={styles.satinAlindi}>Daha Önce Satın Aldınız</span>:undefined} durumGoster={false} donguGoster={false} izlenmeGoster={false} puanGoster={false} yayinKoduGoster={false}
    etkilesimAktif={!!agora&&!agora.mesgul&&!y.satin_alindi}
    onBegeni={e=>{e.stopPropagation();void agora?.etkilesim(y,"begeni");}}
    onFavori={e=>{e.stopPropagation();void agora?.etkilesim(y,"favori");}}
    tarihSatiriSagAksiyon={<span className="font-mono text-[10px] text-[var(--tema-hoyk-talep-metni)]">{y.partner_egitim_id}</span>}
    altEkIcerik={<><AgoraPodcastBilgisi yayin={y}/><div className={styles.siparis}><strong>{agoraTokenTutari(y.fiyat_tl).toLocaleString("tr-TR")} Token</strong>
     {uretici&&<Button disabled={y.satin_alindi||!Number.isInteger(y.surum)} onClick={e=>{e.stopPropagation();onSiparis(y);}}>Sipariş Ver</Button>}
    </div></>}
   />;
 return <section className={styles.raf} aria-label={baslik}>
  <div className={styles.rafBaslik}><h2>{baslik}</h2></div>
  {yayinlar.length===0?<p className={styles.bos}>Bu rafta henüz yayın bulunmuyor.</p>:<MobilYayinAkisi<AgoraYayini>
   kayitlar={yayinlar} kayitAnahtari={y=>y.egitim_id} renderKart={kart}
   sayacGoster={false} baslangicSayisi={2} adimSayisi={5}
   masaustuIcerik={<div className={styles.rafAlani}>
    <AgoraRafOklari raf={raf} baslik={baslik}/>
    <div ref={raf} className={styles.kaydir}>{yayinlar.map(y=><div key={y.egitim_id} className={styles.kart}>{kart(y)}</div>)}</div>
   </div>}
  />}
 </section>;

}
function AgoraOnIzleme({yayin}:{yayin:AgoraYayini}) {
 const [kaynak,setKaynak]=useState<AgoraDenemeKaynagi|null>(null),[hata,setHata]=useState("");
 useEffect(()=>{
  const c=new AbortController();
  void fetch("/agora/api/yayin/"+yayin.egitim_id,{cache:"no-store",signal:AbortSignal.any([c.signal,AbortSignal.timeout(20000)])})
   .then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.hata||"Yayın açılamadı.");
    if(d.tur!==yayin.yayin_araci||d.korumaSurumu!==AGORA_KORUMA_SURUMU||typeof d.url!=="string")throw new Error("Ön izleme doğrulanamadı.");
    if(!c.signal.aborted)setKaynak(d);
   }).catch(e=>{if(!c.signal.aborted)setHata(e.message);});
  return()=>c.abort();
 },[yayin.egitim_id,yayin.yayin_araci]);
 return <><AgoraPodcastBilgisi yayin={yayin}/><Dialog.Description className={styles.aciklama}>{yayin.aciklama}</Dialog.Description>
  {kaynak?<AgoraDenemeOynaticisi kaynak={kaynak}/>:<p role={hata?"alert":"status"}>{hata||"Yayın hazırlanıyor…"}</p>}
 </>;
}
export default function AgoraVitrini() {
 const agora=useAgoraVitrini();
 const {mesajlar,basari}=useHataMesaji();
 const [siparis,setSiparis]=useState<AgoraYayini|null>(null);
 const [hedef,setHedef]=useState<HedefRol|"">(""),[tur,setTur]=useState<"video"|"podcast">("video"),[incelenen,setIncelenen]=useState<AgoraYayini|null>(null);
 if(!agora)return null;
 const {veri,hata,yukleniyor,seciliPartner}=agora;
 const partner=veri?.partnerler.find(p=>p.partner_id===seciliPartner);
 const raflar=agoraRaflari(veri?.yayinlar??[],partner?.partner_id??null,hedef,tur);
 return <div className={styles.sayfa}>
  <div className={styles.baslik}><h1>{partner?.sirket_adi??"Agora"}</h1><YenileButonu yenileniyor={yukleniyor} onYenile={agora.yenile}/></div>
  <section className={styles.statlar} aria-label="Agora genel özeti">
   {[{ad:"Cogniti Partnerleri",deger:veri?.stat.partner_sayisi},{ad:"Toplam Yayın Sayısı",deger:veri?.stat.yayin_sayisi},{ad:"Toplam Sipariş Sayısı",deger:veri?.stat.siparis_sayisi}].map(s=>
    <article className={styles.stat} key={s.ad}><span>{s.ad}</span><strong>{s.deger==null?"—":s.deger.toLocaleString("tr-TR")}</strong></article>)}
  </section>
  {hata&&<p role="alert" className={styles.hata}>{hata}</p>}
  <div className={styles.filtreler}>
   <div className={styles.hedefler}><SadeKontrolGrubu tur="sekme" aria-label="Hedef kitle">
    <SadeKontrolButonu aria-pressed={hedef===""} onClick={()=>setHedef("")}>Tüm Hedef Kitleler</SadeKontrolButonu>
    {TUM_HEDEF_ROLLER.map(r=><SadeKontrolButonu key={r} aria-pressed={hedef===r} onClick={()=>setHedef(r)}>{HEDEF_ROL_TASARIM[r].tamEtiket}</SadeKontrolButonu>)}
   </SadeKontrolGrubu></div>
   <SadeKapsulFiltre etiket="Yayın aracı" secenekler={[{deger:"video",etiket:"Video"},{deger:"podcast",etiket:"Podcast"}]} deger={tur} onDegistir={setTur}/>
  </div>
  {yukleniyor&&!veri?<p role="status">Agora yükleniyor…</p>:raflar.map(r=><AgoraRafi key={r.baslik+seciliPartner+hedef+tur} {...r} onIncele={setIncelenen} onSiparis={setSiparis}/>)}
  <HataMesajiContainer mesajlar={mesajlar}/>
  {siparis&&<AgoraSiparisModali key={siparis.egitim_id} yayin={siparis} onKapat={()=>setSiparis(null)} onTamam={(mevcut,borc)=>{setSiparis(null);basari(mevcut?"Bu yayını daha önce satın aldınız.":"Yayın satın alındı ve yayın havuzunuza eklendi."+(borc>0?` ${borc.toLocaleString("tr-TR")} token borca yazıldı.`:""));void agora.yenile();}}/>}
  <Dialog.Root open={!!incelenen} onOpenChange={acik=>{if(!acik)setIncelenen(null);}}>
   <Dialog.Portal><Dialog.Overlay className={styles.ortu}/><Dialog.Content className={styles.modal}>
    <div className={styles.modalBaslik}><Dialog.Title className="text-lg font-bold">{incelenen?.egitim_adi}</Dialog.Title><Dialog.Close asChild><Button variant="outline" aria-label="İncelemeyi kapat"><X size={16}/></Button></Dialog.Close></div>
    {incelenen&&<AgoraOnIzleme key={incelenen.egitim_id} yayin={incelenen}/>}
   </Dialog.Content></Dialog.Portal>
  </Dialog.Root>
 </div>;
}
