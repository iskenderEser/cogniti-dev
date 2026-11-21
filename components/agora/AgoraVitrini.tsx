"use client";

import { useEffect,useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Search,X } from "lucide-react";
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
import { AgoraCanliYayinlar } from "./AgoraCanliYayinlar";
import { HataMesajiContainer,useHataMesaji } from "@/components/HataMesaji";
import styles from "./AgoraVitrini.module.css";
import { AgoraRafOklari } from "./AgoraRafOklari";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";

function AgoraRafi({baslik,yayinlar,onIncele,onSiparis}:{baslik:string;yayinlar:AgoraYayini[];onIncele:(y:AgoraYayini)=>void;onSiparis:(y:AgoraYayini)=>void}) {
 const raf=useRef<HTMLDivElement>(null);
 const {kullanici}=useAuth();
 const uretici=URETICI_ROLLER.includes(kullanici?.rol.toLowerCase()??"");
 const kart=(y:AgoraYayini)=><YayinKarti
    yayin={{yayin_id:y.egitim_id,urun_adi:y.egitim_adi,firma_adi:y.sirket_adi,icerik_turu:y.kategori,arac_turu:y.yayin_araci,
     thumbnail_url:y.kapak_url,video_url:y.kapak_video_guid,yayin_tarihi:y.yayinlandi_at}}
    onClick={y.satin_alindi?undefined:()=>onIncele(y)} thumbnailSolUstRozet={y.satin_alindi?<span className={styles.satinAlindi}>Sipariş Verildi</span>:undefined} durumGoster={false} donguGoster={false} izlenmeGoster={false} puanGoster={false} yayinKoduGoster={false}
    etkilesimGoster={false}
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
 const router=useRouter();
 const {kullanici}=useAuth();
 const uretici=URETICI_ROLLER.includes(kullanici?.rol.toLowerCase()??"");
 const {mesajlar,basari}=useHataMesaji();
 const [siparis,setSiparis]=useState<AgoraYayini|null>(null);
 const [hedef,setHedef]=useState<HedefRol|"">(""),[tur,setTur]=useState<"video"|"podcast"|"canli">("video"),[arama,setArama]=useState(""),[incelenen,setIncelenen]=useState<AgoraYayini|null>(null);
 if(!agora)return null;
 const {veri,hata,yukleniyor,seciliPartner}=agora;
 const partner=veri?.partnerler.find(p=>p.partner_id===seciliPartner);
 const raflar=tur==="canli"?[]:agoraRaflari(veri?.yayinlar??[],partner?.partner_id??null,hedef,tur,arama);
 return <div className={styles.sayfa}>
  <div className={styles.baslik}><h1>{partner?.sirket_adi??"Agora"}</h1><div className="flex items-center gap-2">{uretici&&<Button type="button" size="sm" onClick={()=>router.push("/agora-yayinlari")}>Agora Yayınları</Button>}<YenileButonu yenileniyor={yukleniyor} onYenile={agora.yenile}/></div></div>
  <section className={styles.statlarAgora} aria-label="Agora genel özeti">
   {[
    {ad:"Yayıncı Cogniti Partnerleri",deger:veri?.stat.partner_sayisi,aciklama:"Yayınları olan eğitimci ve firmalar"},
    {ad:"Toplam Yayın",deger:veri?.stat.yayin_sayisi,aciklama:"Tüm video ve podcast yayınları"},
    {ad:"Toplam Viva Canlı Yayın",deger:veri?.stat.canli_yayin_sayisi,aciklama:"Planlanmış canlı yayınlar"},
   ].map(s=>
    <article className={styles.statAgora} key={s.ad}><span>{s.ad}</span><strong>{s.deger==null?"—":s.deger.toLocaleString("tr-TR")}</strong><small>{s.aciklama}</small></article>)}
  </section>
  {hata&&<p role="alert" className={styles.hata}>{hata}</p>}
  <div className={styles.filtreler}>
   <div className={styles.hedefler}><SadeKontrolGrubu tur="sekme" aria-label="Hedef kitle">
    <SadeKontrolButonu aria-pressed={hedef===""} onClick={()=>setHedef("")}>Tüm Hedef Kitleler</SadeKontrolButonu>
    {TUM_HEDEF_ROLLER.map(r=><SadeKontrolButonu key={r} aria-pressed={hedef===r} onClick={()=>setHedef(r)}>{HEDEF_ROL_TASARIM[r].tamEtiket}</SadeKontrolButonu>)}
   </SadeKontrolGrubu></div>
   <div className={styles.altFiltreSatiri}>
    <SadeKapsulFiltre etiket="Yayın aracı" secenekler={[{deger:"video",etiket:"Video"},{deger:"podcast",etiket:"Podcast"},{deger:"canli",etiket:"Canlı Yayın (Viva)"}]} deger={tur} onDegistir={setTur}/>
    <div className={styles.aramaKutusu}>
     <Search size={15} className={styles.aramaIkonu} aria-hidden="true"/>
     <input
      type="search"
      aria-label="Yayınlarda ara"
      placeholder="Yayın adı, partner veya PE kodu ile ara…"
      value={arama}
      onChange={e=>setArama(e.target.value)}
      className={styles.aramaGirdisi}
     />
     {arama&&<button type="button" className={styles.aramaTemizle} aria-label="Aramayı temizle" onClick={()=>setArama("")}><X size={13}/></button>}
    </div>
   </div>
  </div>
  {tur==="canli"?<AgoraCanliYayinlar partnerId={partner?.partner_id??null} hedefRol={hedef} arama={arama} onBasari={mesaj=>{basari(mesaj);void agora.yenile();}}/>:yukleniyor&&!veri?<p role="status">Agora yükleniyor…</p>:raflar.length===0?<p className={styles.bos}>Seçili kriterlere uygun yayın bulunmuyor.</p>:raflar.map(r=><AgoraRafi key={r.baslik+seciliPartner+hedef+tur+arama} {...r} onIncele={setIncelenen} onSiparis={setSiparis}/>)}
  <HataMesajiContainer mesajlar={mesajlar}/>
  {siparis&&<AgoraSiparisModali key={siparis.egitim_id} yayin={siparis} onKapat={()=>setSiparis(null)} onTamam={(mevcut,borc)=>{setSiparis(null);basari(mevcut?"Bu yayın için daha önce sipariş verdiniz.":"Yayın siparişiniz tamamlandı ve yayın havuzunuza eklendi."+(borc>0?` ${borc.toLocaleString("tr-TR")} token borca yazıldı.`:""));void agora.yenile();}}/>}
  <Dialog.Root open={!!incelenen} onOpenChange={acik=>{if(!acik)setIncelenen(null);}}>
   <Dialog.Portal><Dialog.Overlay className={styles.ortu}/><Dialog.Content className={styles.modal}>
    <div className={styles.modalBaslik}><Dialog.Title className="text-lg font-bold">{incelenen?.egitim_adi}</Dialog.Title><Dialog.Close asChild><Button variant="outline" aria-label="İncelemeyi kapat"><X size={16}/></Button></Dialog.Close></div>
    {incelenen&&<AgoraOnIzleme key={incelenen.egitim_id} yayin={incelenen}/>}
   </Dialog.Content></Dialog.Portal>
  </Dialog.Root>
 </div>;
}
