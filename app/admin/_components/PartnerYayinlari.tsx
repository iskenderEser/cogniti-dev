"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import { HataMesajiContainer,useHataMesaji } from "@/components/HataMesaji";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle } from "@/components/ui/alert-dialog";
import { partnerEgitimListesiGecerli,type PartnerEgitimi,type PartnerEgitimListesi } from "@/lib/agora/partnerEgitimleri";
import type { PartnerEgitimFormVerisi } from "@/lib/agora/partnerEgitimFormu";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { TUM_HEDEF_ROLLER } from "@/lib/utils/roller";
import { TUR_RAPOR_ADI,isIcerikTuru } from "@/lib/video/icerikTuru";
import styles from "../admin.module.css";
type Islem="aktif"|"pasif"|"sil";
type Medya={dosya_adi:string;durum:string;izleme_url?:string|null;dinleme_url?:string|null};
interface Detay {egitim:PartnerEgitimi&{bilgiler:Partial<PartnerEgitimFormVerisi>};medya:{egitimVideo:Medya|null;tanitim:Medya|null;podcast:Medya|null}}
const durumAdi={taslak:"Taslak",yayinda:"Aktif",pasif:"Pasif"};
const fiyat=(n:number|null)=>n===null?"Fiyat Belirlenmedi":new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(n);

export default function PartnerYayinlari({partnerId}:{partnerId:string}) {
  const [liste,setListe]=useState<PartnerEgitimListesi|null>(null),[durum,setDurum]=useState("tumu"),[sayfa,setSayfa]=useState(1),[yukleniyor,setYukleniyor]=useState(true),[hata,setHata]=useState(""),[kaydediliyor,setKaydediliyor]=useState(false);
  const [aday,setAday]=useState<{egitim:PartnerEgitimi;islem:Islem}|null>(null),[detayId,setDetayId]=useState<string|null>(null),[detay,setDetay]=useState<Detay|null>(null),[detayHata,setDetayHata]=useState("");
  const kilit=useRef(false),listeIstegi=useRef<{surum:number;controller:AbortController|null}>({surum:0,controller:null});
  const {mesajlar,basari}=useHataMesaji();const endpoint=`/admin/api/partnerler/${partnerId}/yayinlar`;
  const oku=useCallback(async()=>{
    const kontrol=listeIstegi.current;kontrol.controller?.abort();const c=new AbortController(),surum=++kontrol.surum;kontrol.controller=c;setYukleniyor(true);setHata("");
    try{
      const r=await fetch(`${endpoint}?${new URLSearchParams({durum,sayfa:String(sayfa)})}`,{cache:"no-store",signal:AbortSignal.any([c.signal,AbortSignal.timeout(15000)])});const d=await r.json();
      if(!r.ok)throw new Error(d.hata||"Yayınlar okunamadı.");if(!partnerEgitimListesiGecerli(d))throw new Error("Yayın bilgileri doğrulanamadı.");
      if(surum===kontrol.surum)setListe(d);
    }catch(e){if(!c.signal.aborted&&surum===kontrol.surum){setListe(null);setHata(e instanceof Error?e.message:"Yayınlar okunamadı.");}}
    finally{if(!c.signal.aborted&&surum===kontrol.surum)setYukleniyor(false);}
  },[endpoint,durum,sayfa]);
  useEffect(()=>{const k=listeIstegi.current;void oku();return()=>{k.surum++;k.controller?.abort();};},[oku]);
  useEffect(()=>{
    setDetay(null);setDetayHata("");if(!detayId)return;
    const c=new AbortController();
    void(async()=>{try{
      const r=await fetch(`${endpoint}?egitim_id=${detayId}`,{cache:"no-store",signal:AbortSignal.any([c.signal,AbortSignal.timeout(15000)])});const d=await r.json();
      if(!r.ok)throw new Error(d.hata||"Eğitim bilgileri okunamadı.");if(d.egitim?.egitim_id!==detayId||!d.medya)throw new Error("Eğitim bilgileri doğrulanamadı.");
      if(!c.signal.aborted)setDetay(d);
    }catch(e){if(!c.signal.aborted)setDetayHata(e instanceof Error?e.message:"Eğitim bilgileri okunamadı.");}})();return()=>c.abort();
  },[endpoint,detayId]);
  function incele(e:PartnerEgitimi){if(kilit.current)return;setDetayId(e.egitim_id);requestAnimationFrame(()=>document.getElementById("partner-yayin-inceleme")?.scrollIntoView({block:"start",behavior:"smooth"}));}
  async function uygula(){
    if(kilit.current||!aday)return;kilit.current=true;setKaydediliyor(true);setHata("");
    try{
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(30000),body:JSON.stringify({egitim_id:aday.egitim.egitim_id,islem:aday.islem,surum:aday.egitim.surum})});const d=await r.json();
      if(!r.ok)throw new Error(d.hata||"Yayın işlemi tamamlanamadı.");
      basari(aday.islem==="aktif"?"Eğitim aktife alındı.":aday.islem==="pasif"?"Eğitim pasife alındı.":"Eğitim silindi.");setAday(null);setDetayId(null);
      if(sayfa!==1){setListe(null);setSayfa(1);}else await oku();
    }catch(e){setHata(e instanceof Error?e.message:"İşlem sonucu doğrulanamadı. Listeyi yenileyin.");}
    finally{kilit.current=false;setKaydediliyor(false);}
  }
  function medya(ad:string,m:Medya|null){return <section><h3>{ad}</h3>{!m?<p>Dosya Yüklenmedi</p>:<><p>{m.dosya_adi} · {m.durum==="hazir"?"Hazır":m.durum==="hata"?"İşlenemedi":m.durum==="isleniyor"?"İşleniyor":"Aktarım Bekleniyor"}</p>{m.izleme_url&&<iframe src={m.izleme_url} title={`${ad} Önizleme`} className={styles.partnerYayinVideo} allowFullScreen />}{m.dinleme_url&&<audio className={styles.partnerYayinSes} controls preload="metadata" src={m.dinleme_url} />}</>}</section>;}
  const e=detay?.egitim,b=e?.bilgiler;
  return <div className={styles.stack}>
    <HataMesajiContainer mesajlar={mesajlar} />
    <AlertDialog open={!!aday} onOpenChange={open=>{if(!open&&!kilit.current){setAday(null);setHata("");}}}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{aday?.islem==="sil"?"Eğitimi Sil":aday?.islem==="pasif"?"Eğitimi Pasife Al":"Eğitimi Aktife Al"}</AlertDialogTitle><AlertDialogDescription>“{aday?.egitim.egitim_adi}” {aday?.islem==="sil"?"partnerin eğitim listesinden ve Agora’dan kaldırılacaktır.":aday?.islem==="pasif"?"Agora’da gösterilmeyecektir.":"Agora’da yeniden listelenecektir."}</AlertDialogDescription></AlertDialogHeader>
        {hata&&<p role="alert" className={styles.notice}>{hata}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={kaydediliyor}>İptal</AlertDialogCancel><AlertDialogAction disabled={kaydediliyor} onClick={ev=>{ev.preventDefault();void uygula();}}>{kaydediliyor?"İşleniyor…":aday?.islem==="sil"?"Sil":aday?.islem==="pasif"?"Pasife Al":"Aktife Al"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <section className={styles.card}><header className={styles.cardHeader}><h2>Yayınlar</h2><button type="button" className={styles.button} disabled={kaydediliyor||yukleniyor} onClick={()=>void oku()}>Yenile</button></header>
      <div className={styles.toolbar}><SadeKapsulFiltre etiket="Yayın Durumu" deger={durum} onDegistir={v=>{if(kilit.current)return;setDurum(v);setSayfa(1);setListe(null);setDetayId(null);}} secenekler={[{deger:"tumu",etiket:"Tümü"},{deger:"yayinda",etiket:"Aktif"},{deger:"pasif",etiket:"Pasif"},{deger:"taslak",etiket:"Taslak"}].map(x=>({...x,disabled:kaydediliyor}))} />{liste&&<span>{liste.toplam} Eğitim</span>}</div>
      {hata&&!aday&&<p role="alert" className={styles.notice}>{hata}</p>}{yukleniyor&&!liste&&<p role="status" className={styles.empty}>Yayınlar yükleniyor…</p>}{liste&&!liste.kayitlar.length&&<p className={styles.empty}>Bu seçimde eğitim bulunmuyor.</p>}
    </section>
    {detayId&&<section className={styles.card} id="partner-yayin-inceleme" aria-label="Eğitim İncelemesi"><header className={styles.cardHeader}><h2>{e?.egitim_adi??"Eğitim Bilgileri"}</h2><button type="button" className={styles.button} disabled={kaydediliyor} onClick={()=>setDetayId(null)}>Kapat</button></header><div className={styles.cardBody}>
      {detayHata?<p role="alert" className={styles.notice}>{detayHata}</p>:!e?<p role="status">Eğitim bilgileri yükleniyor…</p>:<div className={styles.stack}>
        <dl className={styles.partnerUyelikDetay}>{[["Kategori",isIcerikTuru(e.kategori)?TUR_RAPOR_ADI[e.kategori]:"Belirlenmedi"],["Yayın Aracı",e.yayin_araci==="video"?"Video":e.yayin_araci==="podcast"?"Podcast":"Belirlenmedi"],["Durum",durumAdi[e.durum]],["Fiyat",fiyat(e.fiyat_tl)],["Hedef Kitle",TUM_HEDEF_ROLLER.filter(r=>b?.hedef_roller?.includes(r)).map(r=>HEDEF_ROL_TASARIM[r].tamEtiket).join(", ")||"Belirlenmedi"],["Eğitim Hakkında",b?.aciklama||"Bilgi Girilmedi"]].map(([etiket,deger])=><div key={etiket}><dt>{etiket}</dt><dd>{deger}</dd></div>)}</dl>
        <div className={styles.twoColumns}>{e.yayin_araci==="podcast"?medya("Podcast",detay!.medya.podcast):medya("Eğitim Videosu",detay!.medya.egitimVideo)}{medya("Tanıtım Videosu",detay!.medya.tanitim)}</div>
        <section><h3>Soru Seti</h3>{!b?.soru_taslaklari?.length?<p>Soru Seti Girilmedi</p>:<ol className={styles.partnerYayinSorular}>{b.soru_taslaklari.map((s,i)=><li key={i}><p>{s.soru_metni}</p><ul>{s.secenekler.map((secenek,j)=><li key={j}>{secenek}{s.dogru===j?" · Doğru Cevap":""}</li>)}</ul></li>)}</ol>}</section>
      </div>}
    </div></section>}
    {liste&&!!liste.kayitlar.length&&<><div className={styles.partnerYayinKartlar}>{liste.kayitlar.map(k=><YayinKarti key={k.egitim_id} yayin={{yayin_id:k.egitim_id,urun_adi:k.egitim_adi,icerik_turu:k.kategori,arac_turu:k.yayin_araci,thumbnail_url:`/admin/api/partnerler/${partnerId}/logo`,yayin_tarihi:k.olusturuldu_at}} onClick={()=>incele(k)} etkilesimGoster={false} izlenmeGoster={false} puanGoster={false} yayinKoduGoster={false} donguGoster={false} yayinTuruGoster={!!k.yayin_araci} solUstRozet={<span>{durumAdi[k.durum]}</span>} puanYaniRozet={<span>{fiyat(k.fiyat_tl)}</span>} altEkIcerik={<div className={styles.actions}>
      <button type="button" className={styles.button} disabled={kaydediliyor} onClick={ev=>{ev.stopPropagation();incele(k);}}>İncele</button>
      {k.durum!=="taslak"&&<button type="button" className={styles.button} disabled={kaydediliyor} onClick={ev=>{ev.stopPropagation();setHata("");setAday({egitim:k,islem:k.durum==="yayinda"?"pasif":"aktif"});}}>{k.durum==="yayinda"?"Pasife Al":"Aktife Al"}</button>}
      <button type="button" className={styles.button} disabled={kaydediliyor} onClick={ev=>{ev.stopPropagation();setHata("");setAday({egitim:k,islem:"sil"});}}>Sil</button>
    </div>} />)}</div><nav aria-label="Partner Yayın Sayfaları" className={styles.actions}><button type="button" className={styles.button} disabled={sayfa===1||kaydediliyor||yukleniyor} onClick={()=>{setSayfa(sayfa-1);setListe(null);setDetayId(null);}}>Önceki</button><span>Sayfa {sayfa}</span><button type="button" className={styles.button} disabled={sayfa*20>=liste.toplam||kaydediliyor||yukleniyor} onClick={()=>{setSayfa(sayfa+1);setListe(null);setDetayId(null);}}>Sonraki</button></nav></>}
  </div>;
}
