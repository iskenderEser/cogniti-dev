"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {AlertDialog,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogCancel} from '@/components/ui/alert-dialog';
import {vivaProformaGecerli,proformaOnayiGecerli,type VivaProforma} from '@/lib/satinAlma/vivaProforma';
import { SUREC4_TOAST } from '@/lib/bildirimler/toastMesajlari';
import VivaProformaBelgesi from './VivaProformaBelgesi';
import styles from '../admin.module.css';
import local from './esnek-proforma.module.css';
export default function VivaProformaAlani({firmaId,ay,sadeceOnayli=false,basari,hata:hataToast}:{firmaId:string;ay:string;sadeceOnayli?:boolean;basari?:(mesaj:string)=>void;hata?:(mesaj:string)=>void}) {
 const [sonuc,setSonuc]=useState<{anahtar:string;veri?:VivaProforma;hata?:string}|null>(null),[yenileme,setYenileme]=useState(0);
 const [acik,setAcik]=useState(false),[modal,setModal]=useState(false),[aciklama,setAciklama]=useState(''),[hata,setHata]=useState(''),[kaydediyor,setKaydediyor]=useState(false);
 const kilit=useRef(false),id=useId(),anahtar=`${firmaId}:${ay}:${sadeceOnayli}:${yenileme}`;
 const guncel=sonuc?.anahtar===anahtar?sonuc:null,d=guncel?.veri;
 useEffect(()=>{const controller=new AbortController();void(async()=>{try{
 const r=await fetch(`/admin/api/firmalar/${firmaId}/viva-proformalar?${new URLSearchParams({ay,onayli:sadeceOnayli?'1':'0'})}`,{cache:'no-store',signal:controller.signal});const v:unknown=await r.json();
 if(!r.ok||!vivaProformaGecerli(v)||v.firma_id!==firmaId||v.ay!==ay||(sadeceOnayli&&v.belge!==null&&v.onay===null))throw Error('Viva proforması alınamadı. SQL kurulumunu ve erişiminizi kontrol edin.');
 if(!controller.signal.aborted)setSonuc({anahtar,veri:v});
 }catch(e){if(!controller.signal.aborted)setSonuc({anahtar,hata:e instanceof Error?e.message:'Proforma alınamadı.'});}})();return()=>controller.abort();},[anahtar,firmaId,ay,sadeceOnayli]);
 useEffect(()=>{const yenile=()=>setYenileme(n=>n+1);window.addEventListener('focus',yenile);return()=>window.removeEventListener('focus',yenile);},[]);
 async function onayla(){
 if(kilit.current||!d?.onaylanabilir||d.onay)return;
 if(d.admin_onayi&&!aciklama.trim()){const mesaj='Admin onayı için açıklama zorunludur.';if(hataToast)hataToast(mesaj);else setHata(mesaj);return;}
 kilit.current=true;setKaydediyor(true);setHata('');
 try{const r=await fetch(`/admin/api/firmalar/${firmaId}/viva-proformalar`,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({ay,aciklama:aciklama.trim()})});const v=await r.json();
 if(!r.ok)throw Error(typeof v.hata==='string'?v.hata:'Onay kaydedilemedi.');if(!proformaOnayiGecerli(v))throw Error('Onay sonucu doğrulanamadı.');
 basari?.(SUREC4_TOAST.proformaOnaylandi('viva', v.tur === 'admin'));
 setModal(false);setYenileme(n=>n+1);
 }catch(e){const mesaj=e instanceof Error?e.message:'Onay kaydedilemedi.';if(hataToast)hataToast(mesaj);else setHata(mesaj);}finally{kilit.current=false;setKaydediyor(false);}
 }
 if(!guncel)return <p className={styles.cardBody} role="status">Proforma bilgileri yükleniyor…</p>;
 if(guncel.hata)return <div className={styles.cardBody} role="alert"><p>{guncel.hata}</p><Button variant="outline" onClick={()=>setYenileme(n=>n+1)}>Yeniden Dene</Button></div>;
 if(!d)return null;
 if(sadeceOnayli)return <div className={styles.cardBody}>{d.belge&&d.onay?<VivaProformaBelgesi veri={d}/>:<p>Bu ay için onaylanan Viva proforması bulunmuyor.</p>}</div>;
 if(!d.belge)return <p className={styles.cardBody}>Proforma ve onay, kullanım ayını takip eden ayın 1’inde açılır.</p>;
 if(!d.belge.satirlar.length)return null;
 return <><div className={`${styles.cardBody} flex flex-wrap items-center justify-end gap-3`}>
 {d.bekleyen>0&&!d.onay&&<p role="status">{d.bekleyen} yayının kullanım hesabı kesinleşmeden onay verilemez.</p>}
 <button type="button" className={local.buton} aria-expanded={acik} aria-controls={id} onClick={()=>setAcik(v=>!v)}>Proforma</button>
 {d.onay?<span className={local.durum}>✓ Onaylandı<small>{d.onay.tur==='admin'?'Admin Onayı':'Firma Onayı'}</small></span>:<button type="button" className={`${local.buton} ${local.onayla}`} disabled={!d.onaylanabilir} onClick={()=>{setHata('');setModal(true);}}>Onayla</button>}
 </div>{acik&&<div id={id} className={styles.cardBody}><VivaProformaBelgesi veri={d}/></div>}
 <AlertDialog open={modal} onOpenChange={v=>{if(!kilit.current)setModal(v);}}><AlertDialogContent>
 <AlertDialogHeader><AlertDialogTitle>{d.admin_onayi?'Admin Onayı':'Proforma Fatura Onayı'}</AlertDialogTitle><AlertDialogDescription>{d.admin_onayi?'Ayın tüm Viva kullanımlarını firma adına onaylamak için açıklamanızı yazın.':'Onayınızdan sonra Cogniti tarafından resmi faturanız düzenlenecektir.'}</AlertDialogDescription></AlertDialogHeader>
 {d.admin_onayi&&<label className={local.modalAlan} htmlFor={`${id}-aciklama`}>Açıklama *<textarea id={`${id}-aciklama`} required maxLength={2000} value={aciklama} onChange={e=>setAciklama(e.target.value)} disabled={kaydediyor}/></label>}
 {!hataToast&&hata&&<p role="alert" className={local.hata}>{hata}</p>}
 <AlertDialogFooter><AlertDialogCancel disabled={kaydediyor}>Vazgeç</AlertDialogCancel><Button type="button" disabled={kaydediyor||(d.admin_onayi&&!aciklama.trim())} onClick={()=>void onayla()}>{kaydediyor?'Kaydediliyor…':d.admin_onayi?'Kaydet':'Onayla'}</Button></AlertDialogFooter>
 </AlertDialogContent></AlertDialog></>;
}
