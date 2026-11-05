"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { HataMesajiContainer,useHataMesaji } from "@/components/HataMesaji";
import { AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle } from "@/components/ui/alert-dialog";
import { partnerErisimGecerli,type PartnerErisimBilgileri } from "@/lib/agora/partnerErisim";
import { ShieldCheck } from "lucide-react";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import local from "./PartnerUyelikYetkiler.module.css";
import styles from "../admin.module.css";
const etiketler:Record<string,string>={bekliyor:"Onay Bekliyor",onaylandi:"Onaylandı",reddedildi:"Reddedildi",profil_bekliyor:"Profil Bekleniyor",onay_bekliyor:"Onay Bekliyor"};
const tarih=(s:string|null)=>s?new Date(s).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"}):"—";

export default function PartnerUyelikYetkiler({partnerId}:{partnerId:string}) {
  const [bilgi,setBilgi]=useState<PartnerErisimBilgileri|null>(null),[hata,setHata]=useState(""),[yukleniyor,setYukleniyor]=useState(true),[kaydediliyor,setKaydediliyor]=useState(false),[karar,setKarar]=useState<boolean|null>(null);
  const kilit=useRef(false);const {mesajlar,basari}=useHataMesaji();
  const oku=useCallback(async(signal?:AbortSignal)=>{
    setYukleniyor(true);setHata("");
    try{
      const r=await fetch(`/admin/api/partnerler/${partnerId}/erisim`,{cache:"no-store",signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
      const d=await r.json();if(!r.ok)throw new Error(d.hata||"Erişim bilgileri okunamadı.");
      if(!partnerErisimGecerli(d.bilgiler)||d.bilgiler.partner_id!==partnerId)throw new Error("Erişim bilgileri doğrulanamadı.");
      if(!signal?.aborted)setBilgi(d.bilgiler);
    }catch(e){if(!signal?.aborted){setBilgi(null);setHata(e instanceof Error?e.message:"Erişim bilgileri okunamadı.");}}
    finally{if(!signal?.aborted)setYukleniyor(false);}
  },[partnerId]);
  useEffect(()=>{const c=new AbortController();void oku(c.signal);return()=>c.abort();},[oku]);
  async function kaydet(){
    if(kilit.current||karar===null||!bilgi||bilgi.partner_id!==partnerId)return;
    kilit.current=true;setKaydediliyor(true);setHata("");
    try{
      const r=await fetch(`/admin/api/partnerler/${partnerId}/erisim`,{method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(20000),body:JSON.stringify({acik:karar,surum:bilgi.erisim_surum})});
      const d=await r.json();if(!r.ok)throw new Error(d.hata||"Erişim kararı kaydedilemedi.");
      setKarar(null);basari(karar?"Partner erişimi açıldı.":"Partner erişimi kapatıldı.");await oku();
    }catch(e){setHata(e instanceof Error?e.message:"İşlem sonucu doğrulanamadı. Güncel durumu kontrol edin.");}
    finally{kilit.current=false;setKaydediliyor(false);}
  }
  return <div className={styles.stack}>
    <HataMesajiContainer mesajlar={mesajlar} />
    <AlertDialog open={karar!==null} onOpenChange={open=>{if(!open&&!kilit.current){setKarar(null);setHata("");}}}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{karar?"Partner Erişimini Aç":"Partner Erişimini Kapat"}</AlertDialogTitle><AlertDialogDescription>{karar ? `${bilgi?.sirket_adi}: Partner, mevcut onaylarına göre yeniden giriş yapabilecek.` : `${bilgi?.sirket_adi}'nin Cogniti Partner süreçleri durdurulacak ve yeni girişleri engellenecektir.`}</AlertDialogDescription></AlertDialogHeader>
        {hata&&<p role="alert" className={styles.notice}>{hata}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={kaydediliyor}>İptal</AlertDialogCancel><AlertDialogAction disabled={kaydediliyor||yukleniyor} onClick={e=>{e.preventDefault();void kaydet();}}>{kaydediliyor?"Kaydediliyor…":karar?"Erişimi Aç":"Erişimi Kapat"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {hata&&karar===null&&<p role="alert" className={styles.notice}>{hata}</p>}
    {yukleniyor&&!bilgi&&<p role="status">Üyelik ve erişim bilgileri yükleniyor…</p>}
    {bilgi&&bilgi.partner_id===partnerId&&<section className={styles.card} aria-label="Partner Erişimi">
      <div className={local.erisim}>
        <div><h3><ShieldCheck size={18} aria-hidden="true"/>Partner Erişimi <span className={local.durum} data-durum={bilgi.erisim_acik?"onaylandi":"reddedildi"}>{bilgi.erisim_acik?"Açık":"Kapalı"}</span></h3><p className={local.aciklama}>Partnerin Cogniti’ye girişini buradan yönetebilirsiniz.</p></div>
        <div className={local.eylemler}><YenileButonu yenileniyor={yukleniyor} disabled={kaydediliyor} onYenile={()=>oku()}/><button type="button" className={`${styles.button} ${styles.primary}`} disabled={kaydediliyor||yukleniyor} onClick={()=>{setHata("");setKarar(!bilgi.erisim_acik);}}>{bilgi.erisim_acik?"Erişimi Kapat":"Erişimi Aç"}</button></div>
      </div>
      <details className={local.gecmis}><summary>Onay Geçmişi</summary><dl className={local.detaylar}>
        <div><dt>İlk Giriş Onayı</dt><dd>{etiketler[bilgi.ilk_giris_durumu]} · {tarih(bilgi.ilk_giris_karar_at)}</dd></div>
        <div><dt>Üyelik Onayı</dt><dd>{etiketler[bilgi.uyelik_durumu]} · {tarih(bilgi.uyelik_karar_at)}</dd></div>
        <div><dt>Son Erişim Kararı</dt><dd>{tarih(bilgi.erisim_karar_at)}</dd></div>
      </dl><a className={styles.button} href="/admin?bolum=partnerler">Onay Yönetimi</a></details>
    </section>}
    {!bilgi&&!yukleniyor&&<button type="button" className={styles.button} onClick={()=>void oku()}>Tekrar Dene</button>}
  </div>;
}
