"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {useAuth} from "@/app/providers/AuthProvider";
import {YayinKarti} from "@/components/yayin/YayinKarti";
import {useHataMesaji,HataMesajiContainer} from "@/components/HataMesaji";
import {Button} from "@/components/ui/button";
import {YenileButonu} from "@/components/ui/yenile-butonu";
import {SadeKapsulFiltre,SadeKontrolGrubu,SadeKontrolButonu,SadeSecim} from "@/components/kontrol/SadeKontroller";
import {TALEP_TURU_KURALLARI,ureticiYetenegi,type TalepTuru} from "@/lib/uretici/yetenekler";
import {ureticiYayinHedefGruplari,type YayinHedefGrubu} from "@/lib/utils/roller";
const ARAMA_HEDEF_KITLE_ADLARI:Record<YayinHedefGrubu,string>={utt:"Ürün Tanıtım Temsilcileri",bm:"Bölge Müdürleri",eczaci:"Eczacılar",eczane_teknisyeni:"Eczane Teknisyenleri",eczaci_ve_eczane_teknisyeni:"Eczacı ve Eczane Teknisyenleri",eczanem:"Eczane Müşterileri"};
import {agoraYayinKurali} from "@/lib/agora/yayinAyarlari";
import {AgoraYayinEditoru} from "./AgoraYayinEditoru";
import styles from "./AgoraVitrini.module.css";
import {AgoraRafOklari} from "./AgoraRafOklari";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
interface Hazirlik {ayarlandi:boolean;istek_id:string;talep_id:string;hedef:YayinHedefGrubu;egitim_turu:TalepTuru;urun_id:string|null;teknik_id:string|null}
interface Yayin {siparis_id:string;partner_id:string;sirket_adi:string;egitim_adi:string;partner_egitim_id:string;kategori:string;yayin_araci:"video"|"podcast";siparis_tarihi:string;kapak_video_guid:string|null;kapak_url:string|null;yayin_sayisi:number;hazirliklar:Hazirlik[]}
function Raf({baslik,yayinlar,onSec,sifirlamaAnahtari}:{baslik:string;yayinlar:Yayin[];onSec:(y:Yayin)=>void;sifirlamaAnahtari:string}){
 const raf=useRef<HTMLDivElement>(null);
 const kart=(y:Yayin)=><YayinKarti yayin={{yayin_id:y.siparis_id,urun_adi:y.egitim_adi,firma_adi:y.sirket_adi,icerik_turu:y.kategori,arac_turu:y.yayin_araci,thumbnail_url:y.kapak_url,video_url:y.kapak_video_guid,yayin_tarihi:y.siparis_tarihi}} durumGoster={false} etkilesimGoster={false} donguGoster={false} izlenmeGoster={false} puanGoster={false} yayinKoduGoster={false} tarihSatiriSagAksiyon={<span className="text-[var(--tema-hoyk-talep-metni)]">{y.partner_egitim_id}</span>} altEkIcerik={<div className="mt-3 space-y-2"><p className="text-xs text-[var(--tema-ikincil-metin)]">{y.sirket_adi}</p><Button className="w-full" onClick={()=>onSec(y)}>Yayına Al</Button></div>}/>;
 return <section className={styles.raf} aria-label={baslik}>
  <div className={styles.rafBaslik}><h2>{baslik}</h2></div>
  {!yayinlar.length?<p className={styles.bos}>Bu rafta henüz yayın bulunmuyor.</p>:<MobilYayinAkisi<Yayin>
   kayitlar={yayinlar} kayitAnahtari={y=>y.siparis_id} renderKart={kart}
   sayacGoster={false} baslangicSayisi={2} adimSayisi={5} sifirlamaAnahtari={sifirlamaAnahtari}
   masaustuIcerik={<div className={styles.rafAlani}>
    <AgoraRafOklari raf={raf} baslik={baslik}/>
    <div ref={raf} className={styles.kaydir}>{yayinlar.map(y=><div key={y.siparis_id} className={styles.kart}>{kart(y)}</div>)}</div>
   </div>}
  />}
 </section>;
}

export default function AgoraYayinlarim(){
 const {mesajlar,basari}=useHataMesaji();
 const {kullanici}=useAuth();const rol=kullanici?.rol.toLowerCase()??"";
 const yetenek=ureticiYetenegi(rol),hedefler=ureticiYayinHedefGruplari(rol);
 const [yayinlar,setYayinlar]=useState<Yayin[]>([]),[yukleniyor,setYukleniyor]=useState(true),[hata,setHata]=useState("");
 const [sekme,setSekme]=useState<"havuz"|"yonetim">("havuz"),[partner,setPartner]=useState("");
 const [hedef,setHedef]=useState<YayinHedefGrubu>("utt"),[tur,setTur]=useState<TalepTuru>("urun_egitimi");
 const [secili,setSecili]=useState<Yayin|null>(null),[istek,setIstek]=useState(""),[talep,setTalep]=useState("");
 const [urun,setUrun]=useState(""),[teknik,setTeknik]=useState(""),[mesgul,setMesgul]=useState(false);
 const [urunler,setUrunler]=useState<{urun_id:string;urun_adi:string}[]>([]),[teknikler,setTeknikler]=useState<{teknik_id:string;teknik_adi:string}[]>([]);
 const yenile=useCallback(async()=>{
 setYukleniyor(true);setHata("");try{
 const res=await fetch("/agora-yayinlari/api",{cache:"no-store"});const d=await res.json();if(!res.ok)throw Error(d.hata??"Yayınlar alınamadı.");setYayinlar(d.yayinlar);
 const qs=new URLSearchParams({firma_id:d.profil.firma_id});if(d.profil.takim_id)qs.set("takim_id",d.profil.takim_id);
 const [u,t]=await Promise.all([fetch("/urunler/api?"+qs),fetch("/teknikler/api?firma_id="+encodeURIComponent(d.profil.firma_id))]);
 const [ud,td]=await Promise.all([u.json(),t.json()]);if(!u.ok||!t.ok)throw Error("Ürün veya teknik listesi alınamadı.");setUrunler(ud.urunler??[]);setTeknikler(td.teknikler??[]);
 }catch(e){setHata(e instanceof Error?e.message:"Yayınlar alınamadı.");}finally{setYukleniyor(false);}
 },[]);
 useEffect(()=>{void yenile();},[yenile]);
 const sec=(y:Yayin,h?:Hazirlik)=>{setSecili(y);setSekme("yonetim");setTalep("");setHata("");setIstek(h?.istek_id??crypto.randomUUID());setHedef(h?.hedef??hedefler[0]??"utt");setTur(h&&yetenek?.acabilecegiTalepTurleri.includes(h.egitim_turu)?h.egitim_turu:yetenek?.acabilecegiTalepTurleri[0]??"urun_egitimi");setUrun(h?.urun_id??"");setTeknik(h?.teknik_id??"");};
 const kural=agoraYayinKurali(rol,tur,hedef);
 const ayarla=async()=>{if(!secili||!kural||mesgul)return;setMesgul(true);setHata("");try{
 const res=await fetch("/agora-yayinlari/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siparis_id:secili.siparis_id,istek_id:istek,hedef,egitim_turu:tur,urun_id:kural.urunGoster?urun||null:null,teknik_id:kural.teknikGoster?teknik||null:null})});const d=await res.json();if(!res.ok)throw Error(d.hata??"Ayarlar kaydedilemedi.");setTalep(d.talep_id);void yenile();
 }catch(e){setHata(e instanceof Error?e.message:"Ayarlar kaydedilemedi.");}finally{setMesgul(false);}};
 const partnerler=Array.from(new Map(yayinlar.map(y=>[y.partner_id,{id:y.partner_id,ad:y.sirket_adi}])).values());
 const liste=yayinlar.filter(y=>!partner||y.partner_id===partner);
 const statlar=[{ad:"Satın Aldığım Yayınlar",deger:yayinlar.length},{ad:"Yayınladığım İçerikler",deger:yayinlar.filter(y=>y.yayin_sayisi>0).length},{ad:"Toplam Yayına Alma",deger:yayinlar.reduce((n,y)=>n+y.yayin_sayisi,0)}];
 return <div className={styles.sayfa}><div className={styles.baslik}><h1>Agora Yayınları</h1><YenileButonu yenileniyor={yukleniyor} onYenile={yenile}/></div>
 <section className={styles.statlar} aria-label="Agora yayın özeti">{statlar.map(s=><article key={s.ad} className={styles.stat}><span>{s.ad}</span><strong>{yukleniyor?"—":s.deger.toLocaleString("tr-TR")}</strong></article>)}</section>
 <div className="mb-5"><SadeKapsulFiltre etiket="Agora çalışma alanı" deger={sekme} onDegistir={setSekme} secenekler={[{deger:"havuz",etiket:"Agora Yayınlarım"},{deger:"yonetim",etiket:"Agora Yayın Yönetimi"}]}/></div>
 {hata&&<p role="alert" className={styles.hata}>{hata}</p>}
 {sekme==="havuz"?<><div className={styles.hedefler}><SadeKontrolGrubu tur="sekme" aria-label="Satın alınan yayınların partnerleri"><SadeKontrolButonu aria-pressed={!partner} onClick={()=>setPartner("")}>Tüm Partnerler <span>{yayinlar.length}</span></SadeKontrolButonu>{partnerler.map(p=><SadeKontrolButonu key={p.id} aria-pressed={partner===p.id} onClick={()=>setPartner(p.id)}>{p.ad} <span className="ml-2 rounded-full bg-[#6D28D9] px-2 text-white">{yayinlar.filter(y=>y.partner_id===p.id).length}</span></SadeKontrolButonu>)}</SadeKontrolGrubu></div>
 <div className="mt-5"><Raf sifirlamaAnahtari={partner} baslik="Yeni Satın Aldıklarım" yayinlar={liste.filter(y=>y.yayin_sayisi===0)} onSec={y=>sec(y,y.hazirliklar[0])}/><Raf sifirlamaAnahtari={partner} baslik="Yayınladıklarım" yayinlar={liste.filter(y=>y.yayin_sayisi>0)} onSec={y=>sec(y,y.hazirliklar[0])}/></div></>:<>
 {secili?<section className="mb-5 overflow-hidden rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-4"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold">{secili.egitim_adi} · {secili.partner_egitim_id}</h2><Button variant="outline" onClick={()=>{setSecili(null);setTalep("");}}>Kapat</Button></div>
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <label>Hedef Rol<SadeSecim etiket="Hedef Rol" deger={hedef} onDegistir={v=>{setHedef(v as YayinHedefGrubu);setTalep("");}} secenekler={hedefler.map(h=>({deger:h,etiket:ARAMA_HEDEF_KITLE_ADLARI[h]}))}/></label>
 <label>Eğitim Türü<SadeSecim etiket="Eğitim Türü" deger={tur} onDegistir={v=>{setTur(v as TalepTuru);setUrun("");setTeknik("");setTalep("");}} secenekler={(yetenek?.acabilecegiTalepTurleri??[]).map(t=>({deger:t,etiket:TALEP_TURU_KURALLARI[t].ad}))}/></label>
 {kural?.urunGoster&&<label>Ürün{kural.urunZorunlu?" *":""}<SadeSecim etiket="Ürün" deger={urun} onDegistir={v=>{setUrun(v);setTalep("");}} secenekler={[{deger:"",etiket:"Ürün Seçin"},...urunler.map(u=>({deger:u.urun_id,etiket:u.urun_adi}))]}/></label>}
 {kural?.teknikGoster&&<label>Teknik{kural.teknikZorunlu?" *":""}<SadeSecim etiket="Teknik" deger={teknik} onDegistir={v=>{setTeknik(v);setTalep("");}} secenekler={[{deger:"",etiket:"Teknik Seçin"},...teknikler.map(t=>({deger:t.teknik_id,etiket:t.teknik_adi}))]}/></label>}
 </div>{!talep&&<Button className="mt-4" disabled={mesgul||!kural||(kural.urunZorunlu&&!urun)||(kural.teknikZorunlu&&!teknik)} onClick={()=>void ayarla()}>{mesgul?"Hazırlanıyor…":"Yayın Ayarlarını Aç"}</Button>}
 {talep&&<div className="mt-4"><AgoraYayinEditoru key={talep+hedef} hedef={hedef} talepId={talep} onYayinlandi={()=>{setSecili(null);setTalep("");basari("Agora yayını yayın yönetimine eklendi.");void yenile();}}/></div>}
 </section>:<><div className={styles.hedefler}><SadeKontrolGrubu tur="sekme" aria-label="Yönetim hedef rolü">{hedefler.map(h=><SadeKontrolButonu key={h} aria-pressed={hedef===h} onClick={()=>setHedef(h)}>{ARAMA_HEDEF_KITLE_ADLARI[h]}</SadeKontrolButonu>)}</SadeKontrolGrubu></div>
 {yayinlar.flatMap(y=>y.hazirliklar.filter(h=>h.hedef===hedef&&!h.ayarlandi).map(h=><div key={h.istek_id} className="my-3 flex items-center justify-between rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-3"><span>{y.egitim_adi} · {y.partner_egitim_id}</span><Button variant="outline" onClick={()=>sec(y,h)}>Yayın Ayarları</Button></div>))}
 <AgoraYayinEditoru key={hedef} hedef={hedef} onDuzenle={(id,tid)=>{const y=yayinlar.find(y=>y.siparis_id===id);if(y)sec(y,y.hazirliklar.find(h=>h.talep_id===tid));}} onYayinlandi={()=>{void yenile();}}/>
 </>}
 </>}
 <HataMesajiContainer mesajlar={mesajlar}/>
 </div>;
}
