"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { YONETICI_ROLLER } from "@/lib/utils/roller";
import styles from "./token.module.css";
import TokenKullanimTablosu from "./_components/TokenKullanimTablosu";
import { SadeFormSecimi, SadeKapsulFiltre, SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";
import { SadeKisiSecimi } from "@/components/kontrol/KisiKontroller";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import { YAYIN_TURLERI, YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";

import { isTalepTuru, talepTuruAdi, TALEP_TURU_SIRA, ureticiYetenegi, type TalepTuru } from "@/lib/uretici/yetenekler";

type Yukleme={ miktar:number; kalan:number; yukleme_turu:string; created_at:string; son_kullanim_at:string|null; suresi_doldu:boolean };
type GunSonu={ donem_baslangici?:string; hazir:boolean; veri_tarihi:string; plan_limiti?:number|null; firma_toplam_token?:number; eclub_token?:number; oneri_token?:number; egitim_token?:number|null; eczanem_token?:number };
type Rapor={ secili_egitim_turu?:TalepTuru|null; gun_sonu?:GunSonu|null; hesap_var:boolean; kapsam?:string; yonetici?:boolean; paket_turu?:string; bakiye?:number; paket_asimi?:number; toplam?:number; yuklemeler?:Yukleme[]; tmler?:{tm_id:string;tm_adi:string}[]; secili_tm_id?:string|null; bmler?:{bm_id:string;bm_adi:string}[]; secili_bm_id?:string|null; uttler?:{utt_id:string;utt_adi:string}[]; secili_utt_id?:string|null };
const stat=(v:number|null|undefined)=>v==null?"—":n(v);
const n=(v:number)=>new Intl.NumberFormat("tr-TR").format(v);
const tarih=(v:string)=>new Date(v).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"short",timeStyle:"short"});
const statNotu=(g:GunSonu|null|undefined)=>{
 if(!g)return "Gün sonu token hesabı henüz kullanıma açılmadı.";
 if(!g.hazir)return "Token hesabınızın ilk gün sonu verileri yarın gösterilecek.";
 if(g.donem_baslangici&&g.veri_tarihi<g.donem_baslangici)return "Bu ayın gün sonu tüketimi henüz oluşmadı. Bugünkü işlemler yarın yansır.";
 const gun=(v:string)=>new Date(v+"T12:00:00+03:00").toLocaleDateString("tr-TR",{timeZone:"Europe/Istanbul"});
 return g.donem_baslangici?`${gun(g.donem_baslangici)}–${gun(g.veri_tarihi)} dönemi tüketimidir. Bugünkü işlemler yarın yansır.`:`Veriler ${gun(g.veri_tarihi)} gün sonu itibarıyladır. Bugünkü işlemler yarın yansır.`;
};
export default function TokenSayfasi(){
 const { kullanici }=useAuth();
 const rol=(kullanici?.rol??"").toLowerCase();
 const bm=rol==="bm";
 const tm=rol==="tm";
 const yetenek=ureticiYetenegi(rol);
 const uretici=!!yetenek;
 const yonetici=YONETICI_ROLLER.includes(rol)||uretici;
 const pmDuzeni=yonetici;
 const tmDuzeni=tm||pmDuzeni;
 const yonetim=bm||tm||yonetici;
 const [tokenKapsam,setTokenKapsam]=useState<"urun_egitimi"|"kendi"|"ekip">("ekip");
 const [icerikTuru,setIcerikTuru]=useState<TalepTuru|"">("");
 const izinliTurler=TALEP_TURU_SIRA.filter(tur=>YONETICI_ROLLER.includes(rol)||yetenek?.acabilecegiTalepTurleri.includes(tur));
 const seciliIcerikTuru=izinliTurler.length===1?izinliTurler[0]:izinliTurler.find(tur=>tur===icerikTuru)??"";
 const [oneriYayinTuru,setOneriYayinTuru]=useState<YayinTuruFiltreDegeri>("tumu");
 const [egitimYayinTuru,setEgitimYayinTuru]=useState<YayinTuruFiltreDegeri>("tumu");
 const [tmId,setTmId]=useState("");
 const [bmId,setBmId]=useState("");
 const [uttId,setUttId]=useState("");
 const [detayAyi,setDetayAyi]=useState("");
 const [detayYili,setDetayYili]=useState(()=>new Intl.DateTimeFormat("en",{timeZone:"Europe/Istanbul",year:"numeric"}).format(new Date()));
 const uttAylik=rol==="utt"||rol==="kd_utt";
 const [data,setData]=useState<Rapor|null>(null),[hata,setHata]=useState(""),[yukleniyor,setYukleniyor]=useState(true);
 const [alici,setAlici]=useState<"eczaci"|"eczane_teknisyeni"|"eclub"|"eczanem">("eclub");
 const [yayinTuru,setYayinTuru]=useState<YayinTuruFiltreDegeri|"viva">("tumu");
 const egitimRaporu=pmDuzeni&&tokenKapsam==="urun_egitimi";
 const oneriRaporu=pmDuzeni&&tokenKapsam==="kendi";
 const raporUttId=tmDuzeni&&tokenKapsam!=="ekip"?"":uttId;
 const yukle=useCallback(async(signal:AbortSignal)=>{
  setYukleniyor(true);setHata("");
  try {const sorgu=new URLSearchParams();if(egitimRaporu){if(seciliIcerikTuru){sorgu.set("gonderi","icerik");sorgu.set("egitim_turu",seciliIcerikTuru);}}else if(oneriRaporu)sorgu.set("gonderi","oneri");if(yonetim){sorgu.set("gorunum",yonetici?"yonetici":tm?"tm":"bm");if(yonetici&&tmId)sorgu.set("tm_id",tmId);if((tm||yonetici)&&bmId)sorgu.set("bm_id",bmId);if(raporUttId)sorgu.set("utt_id",raporUttId);}const res=await fetch(`/token/api/rapor${sorgu.size?`?${sorgu}`:""}`,{cache:"no-store",signal});const json=await res.json();if(!res.ok)throw new Error(json.hata||"Token bilgileri alınamadı.");if(!signal.aborted)setData(json as Rapor);}
  catch(e){if(!signal.aborted)setHata(e instanceof Error?e.message:"Token bilgileri alınamadı.");}
  finally{if(!signal.aborted)setYukleniyor(false)}
 },[yonetim,yonetici,tm,tmId,bmId,raporUttId,egitimRaporu,oneriRaporu,seciliIcerikTuru]);
 useEffect(()=>{const controller=new AbortController();void yukle(controller.signal);return()=>controller.abort()},[yukle]);

 if(kullanici?.kimlik_turu==="eclub_kisi" || kullanici?.kimlik_turu==="musteri") return <main className={styles.page}><p>Bu sayfaya erişiminiz bulunmuyor.</p></main>;
 const scope=data?.kapsam??"benim";
 const scopeName=scope==="firma"?"Firma geneli":scope==="takim"?"Takımım":scope==="bolge"?"Bölgem":"Benim gönderimlerim";
 const uttGorunumu=rol==="utt" || rol==="kd_utt";
 const sahaGorunumu=uttGorunumu||yonetim;
 const aliciSekmeleri=sahaGorunumu;
 const oneriGorunumu=(bm||tmDuzeni)&&tokenKapsam==="kendi";
 const egitimGorunumu=pmDuzeni&&tokenKapsam==="urun_egitimi";
 const dogrudanGorunum=oneriGorunumu||egitimGorunumu;
 const seciliArac=egitimGorunumu?egitimYayinTuru:oneriGorunumu?oneriYayinTuru:yayinTuru;
 const gonderiTuru=aliciSekmeleri&&alici==="eczanem"?"eczanem":"eclub";
 const takimHazir=!yonetici||(data?.secili_tm_id??"")===tmId;
 const bolgeHazir=(!(tm||yonetici)||(data?.secili_bm_id??"")===bmId)&&takimHazir;
 const secimHazir=(!yonetim||(data?.secili_utt_id??"")===raporUttId)&&bolgeHazir;
 const icerikHazir=!egitimGorunumu||!!seciliIcerikTuru&&data?.secili_egitim_turu===seciliIcerikTuru;
 const gunSonu=secimHazir&&icerikHazir?data?.gun_sonu:null;
 const pmEkipSecimiEksik=pmDuzeni&&!egitimGorunumu&&!tmId;
 const pmEkipBekliyor=pmDuzeni&&!egitimGorunumu&&(pmEkipSecimiEksik||!secimHazir);
 return <main className={styles.page}>
  <div className={styles.breadcrumb}>Cogniti　›　<span>Token Kullanımı</span></div>
  <h1>Token Kullanımı</h1><p className={styles.subtitle}>Firmanızın token bakiyesini ve kullanımını takip edin.</p>
  {hata && <p role="alert" className={styles.error}>{hata}</p>}
  {!data && yukleniyor ? <p>Bilgiler yükleniyor…</p> : data && !data.hesap_var ? <p>Firmanız için henüz token hesabı açılmadı.</p> : data?.hesap_var && <>
   {sahaGorunumu ? <>
    <div className={styles.uttStats} style={dogrudanGorunum?{gridTemplateColumns:"repeat(3,minmax(0,1fr))"}:undefined}>
     <article><div><span>Token Kullanım Limiti</span><strong>{stat(data.gun_sonu?.plan_limiti)} <em className={styles.statUnit}>Token/Ay</em></strong><small>Kullandığın kadar öde paketi tercih edilmiştir.</small></div></article>
     <article><div><span>Toplam Kullanılan Token</span><strong>{stat(data.gun_sonu?.firma_toplam_token)}</strong><small>Tüm firma kullanımı</small></div></article>
     {oneriGorunumu&&<article><div><span>Öneri Token Kullanımı</span><strong>{stat((tmDuzeni?gunSonu:data.gun_sonu)?.oneri_token)}</strong><small>{tmDuzeni?"Ekibinizin ilettiği öneriler için kullanılan token toplamı":"İlettiğiniz öneriler için kullanılan token toplamı"}</small></div></article>}
     {egitimGorunumu&&<article><div><span>{(seciliIcerikTuru?talepTuruAdi(seciliIcerikTuru):"İçerik Türü")+" Token Kullanımı"}</span><strong>{stat(gunSonu?.egitim_token)}</strong><small>{uretici?"İlettiğiniz içerikler için kullanılan token toplamı":"Firmanızın içerik gönderimleri için kullanılan token toplamı"}</small></div></article>}
     {!dogrudanGorunum&&<><article><div><span>Eclub Token Kullanımı</span><strong>{stat(gunSonu?.eclub_token)}</strong><small>Eclub üyeleri için gönderi ve etkinlik yayınları tüketimi</small></div></article>
     <article><div><span>Eczanem Token Kullanımı</span><strong>{stat(gunSonu?.eczanem_token)}</strong><small>Eczanem üyeleri için gönderilerdeki tüketim</small></div></article></>}
    </div><p className={styles.statNote}>{statNotu(data.gun_sonu)}</p>
   </> : <div className={styles.stats}>
    <div><span>KALAN TOKEN</span><strong>{n(data.bakiye??0)}</strong><small>Firmanızın kullanılabilir bakiyesi</small></div>
    <div><span>PAKET</span><strong className={styles.paket}>{data.paket_turu==="aylik"?"Aylık paket":"Kullandığın Kadar Öde"}</strong><small>{data.paket_turu==="aylik"?"2 ay token kullanım süresi":"Aylık 1.500 token kullanım limiti"}</small></div>
    <div><span>{(scope==="benim"?"Kendi kullanımım":scopeName+" kullanımı").toLocaleUpperCase("tr-TR")}</span><strong>{n(data.toplam??0)}</strong><small>Toplam tüketilen token</small></div>
   </div>}
   {(data.paket_asimi??0)>0 && <p className={styles.asim}>Paket aşımı: {n(data.paket_asimi??0)} token</p>}
   {(bm||tmDuzeni)&&<div className={styles.icerikKapsamSatiri}><SadeKontrolGrubu tur="kapsul" aria-label="Token kullanım kapsamı">
    {pmDuzeni&&<SadeKontrolButonu aria-pressed={egitimGorunumu} onClick={()=>setTokenKapsam("urun_egitimi")}>İçerik Türü</SadeKontrolButonu>}
    <SadeKontrolButonu aria-pressed={oneriGorunumu} onClick={()=>setTokenKapsam("kendi")}>BM Öneri Gönderileri</SadeKontrolButonu>
    <SadeKontrolButonu aria-pressed={!dogrudanGorunum} onClick={()=>setTokenKapsam("ekip")}>Ekip Gönderileri</SadeKontrolButonu>
   </SadeKontrolGrubu>
   {egitimGorunumu&&<div className={styles.icerikTuruSecimi}><SadeFormSecimi etiket="İçerik Türü" aria-label="İçerik Türü" value={seciliIcerikTuru} disabled={izinliTurler.length===1} onChange={event=>{if(isTalepTuru(event.target.value)&&izinliTurler.includes(event.target.value))setIcerikTuru(event.target.value);}}>
    <option value="" disabled>İçerik türünü seçiniz</option>
    {izinliTurler.map(tur=><option key={tur} value={tur}>{talepTuruAdi(tur)}</option>)}
   </SadeFormSecimi></div>}
   </div>}
   {(bm||tmDuzeni)&&<div className={styles.heading}><h2>Token Kullanım Detayları</h2></div>}
   {!(bm||tmDuzeni)&&<div className={`${styles.heading} ${yonetim?styles.bmHeading:""}`}>{!bm&&<h2>Token Kullanım Detayları</h2>}{yonetim&&!(bm&&oneriGorunumu)&&<div className={styles.kapsamSecimleri}>{yonetici&&<div className={styles.temsilciSecimi}><SadeKisiSecimi baslik="Tanıtım Müdürleri" bosSecenekEtiketi="Tüm Takımlar" kisiler={(data.tmler??[]).map(kisi=>({deger:kisi.tm_id,adSoyad:kisi.tm_adi}))} deger={tmId} onDegistir={id=>{setTmId(id);setBmId("");setUttId("");}} /></div>}{(tm||yonetici)&&<div className={styles.temsilciSecimi}><SadeKisiSecimi baslik="Bölge Müdürleri" bosSecenekEtiketi="Tüm Bölgeler" disabled={yonetici&&(!tmId||!takimHazir)} kisiler={(takimHazir?data.bmler??[]:[]).map(kisi=>({deger:kisi.bm_id,adSoyad:kisi.bm_adi}))} deger={bmId} onDegistir={id=>{setBmId(id);setUttId("");}} /></div>}<div className={styles.temsilciSecimi}><SadeKisiSecimi baslik="Temsilciler" bosSecenekEtiketi="Tüm Temsilciler" disabled={(tm||yonetici)&&(!bmId||!bolgeHazir)} kisiler={(bolgeHazir?data.uttler??[]:[]).map(utt=>({deger:utt.utt_id,adSoyad:utt.utt_adi}))} deger={uttId} onDegistir={setUttId} /></div></div>}</div>}
   {aliciSekmeleri&&!dogrudanGorunum && <SadeKontrolGrubu tur="sekme" aria-label="Token alıcısı" className={styles.aliciSekmeleri}>
    {([{deger:"eczaci",etiket:"Eczacı"},{deger:"eczane_teknisyeni",etiket:"Eczane Teknisyeni"},{deger:"eclub",etiket:"Eczacı ve Ecz. Teknisyeni"},{deger:"eczanem",etiket:"Eczanem Üyesi"}] as const).map(secenek=><SadeKontrolButonu key={secenek.deger} aria-pressed={alici===secenek.deger} onClick={()=>{setAlici(secenek.deger);if(secenek.deger==="eczanem"&&yayinTuru==="viva")setYayinTuru("tumu");}}>{secenek.etiket}</SadeKontrolButonu>)}
   </SadeKontrolGrubu>}
   {sahaGorunumu && <div className={styles.gonderiSecimi} style={(tmDuzeni||(bm&&!oneriGorunumu))?{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}:undefined}><SadeKapsulFiltre
    etiket="Yayın türüne göre filtrele" deger={seciliArac} onDegistir={deger=>{if(egitimGorunumu){if(deger!=="viva")setEgitimYayinTuru(deger);}else if(oneriGorunumu){if(deger!=="viva")setOneriYayinTuru(deger);}else setYayinTuru(deger);}}
    secenekler={[{deger:"tumu",etiket:"Tümü"},...YAYIN_TURLERI.map(tur=>({deger:tur,etiket:YAYIN_TURU_SUNUMU[tur].cogulEtiket})),...(gonderiTuru==="eczanem"||dogrudanGorunum?[]:[{deger:"viva" as const,etiket:"Viva"}])]}
   />{(tmDuzeni||(bm&&!oneriGorunumu))&&<div className={styles.kapsamSecimleri} style={{marginLeft:"auto"}}>
    {pmDuzeni&&<div className={styles.temsilciSecimi}><SadeKisiSecimi baslik="Tanıtım Müdürleri" bosSecenekEtiketi="Tüm Takımlar" kisiler={(data.tmler??[]).map(kisi=>({deger:kisi.tm_id,adSoyad:kisi.tm_adi}))} deger={tmId} onDegistir={id=>{setTmId(id);setBmId("");setUttId("");}} /></div>}
    {tmDuzeni&&<div className={styles.temsilciSecimi}><SadeKisiSecimi baslik="Bölge Müdürleri" bosSecenekEtiketi="Tüm Bölgeler" disabled={pmDuzeni&&(!tmId||!takimHazir)} kisiler={(takimHazir?data.bmler??[]:[]).map(kisi=>({deger:kisi.bm_id,adSoyad:kisi.bm_adi}))} deger={bmId} onDegistir={id=>{setBmId(id);setUttId("");}} /></div>}
    <div className={styles.temsilciSecimi}><SadeKisiSecimi baslik="Temsilciler" bosSecenekEtiketi="Tüm Temsilciler" disabled={tmDuzeni&&(dogrudanGorunum||!bmId||!bolgeHazir)} kisiler={(bolgeHazir?data.uttler??[]:[]).map(utt=>({deger:utt.utt_id,adSoyad:utt.utt_adi}))} deger={raporUttId} onDegistir={setUttId} /></div></div>}</div>}
   {pmEkipBekliyor ? <><p role="status" className={styles.detayDurumu}>{pmEkipSecimiEksik?"Verileri görmek için tanıtım müdürü seçin.":"Seçilen kapsam yükleniyor…"}</p><TokenKullanimTablosu key={`pm-bekliyor-${tokenKapsam}-${gonderiTuru}-${seciliArac}`} bos eczanem={!oneriGorunumu&&gonderiTuru==="eczanem"} gonderiTuru={oneriGorunumu?"tumu":gonderiTuru} aracTuru={seciliArac} /></> : egitimGorunumu ? <TokenKullanimTablosu key={`icerik-${kullanici?.id}-${seciliIcerikTuru}-${seciliArac}-${tmId}-${bmId}`} bos={!seciliIcerikTuru} yonetici tmId={tmId} bmId={bmId} gonderiTuru="icerik" egitimTuru={seciliIcerikTuru||undefined} aracTuru={seciliArac==="viva"?"tumu":seciliArac} /> : oneriGorunumu ? pmDuzeni ? <TokenKullanimTablosu key={`pm-oneri-${kullanici?.id}-${seciliArac}-${tmId}-${bmId}`} yonetici tmId={tmId} bmId={bmId} oneri aracTuru={seciliArac==="viva"?"tumu":seciliArac} /> : <TokenKullanimTablosu key={`oneri-${kullanici?.id}-${seciliArac}-${tm?bmId:""}`} bm={bm} tm={tm} bmId={tm?bmId:""} oneri aracTuru={seciliArac==="viva"?"tumu":seciliArac} /> : <div hidden={sahaGorunumu && gonderiTuru!=="eclub"}>
    <TokenKullanimTablosu aylikToplam={uttAylik} ay={detayAyi} yil={detayYili} onYilDegistir={setDetayYili} onAyDegistir={setDetayAyi} key={`${detayAyi}-${kullanici?.id}-${sahaGorunumu ? yayinTuru : "tumu"}-${yonetim?uttId:""}-${tm||yonetici?bmId:""}-${yonetici?tmId:""}-${aliciSekmeleri?alici:""}`} bm={bm} tm={tm} yonetici={yonetici} tmId={yonetici?tmId:""} bmId={tm||yonetici?bmId:""} uttId={yonetim?uttId:""} hoykGoster={sahaGorunumu} aracTuru={sahaGorunumu ? yayinTuru : "tumu"} gonderiTuru={sahaGorunumu ? "eclub" : "tumu"} aliciFiltresi={aliciSekmeleri&&alici!=="eczanem"?alici:undefined} />
   </div>}
   {!pmEkipBekliyor && !dogrudanGorunum && sahaGorunumu && gonderiTuru==="eczanem" && <TokenKullanimTablosu aylikToplam={uttAylik} ay={detayAyi} yil={detayYili} onYilDegistir={setDetayYili} onAyDegistir={setDetayAyi} key={`${detayAyi}-${kullanici?.id}-eczanem-${yayinTuru}-${yonetim?uttId:""}-${tm||yonetici?bmId:""}-${yonetici?tmId:""}`} bm={bm} tm={tm} yonetici={yonetici} tmId={yonetici?tmId:""} bmId={tm||yonetici?bmId:""} uttId={yonetim?uttId:""} eczanem gonderiTuru="eczanem" aracTuru={yayinTuru} />}
   {data.yonetici && <section className={styles.loads}><div className={styles.heading}><h2>Token yüklemeleri</h2><p>Son yüklemeler ve kullanım durumları</p></div><div className={styles.list}>{(data.yuklemeler??[]).length===0?<p className={styles.empty}>Yükleme kaydı yok.</p>:(data.yuklemeler??[]).map((x,i)=><div className={styles.load} key={`${x.created_at}-${i}`}><div><b>{n(x.miktar)} token</b><small>{tarih(x.created_at)} · Kalan: {n(x.suresi_doldu?0:x.kalan)}</small></div><span>{x.suresi_doldu?"Süresi doldu":x.son_kullanim_at?`Son kullanım: ${new Date(x.son_kullanim_at).toLocaleDateString("tr-TR",{timeZone:"Europe/Istanbul"})}`:"Süresiz"}</span></div>)}</div></section>}
  </>}
 </main>;
}
