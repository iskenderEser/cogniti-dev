"use client";
import {Fragment,useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';
import MobilUyumluTablo from './MobilUyumluTablo';
import {Button} from '@/components/ui/button';
import {AlertDialog,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogCancel} from '@/components/ui/alert-dialog';
import {bannerProformaGecerli,proformaOnayiGecerli,type BannerProforma} from '@/lib/satinAlma/bannerProforma';
import BannerProformaBelgesi from './BannerProformaBelgesi';
import styles from '../admin.module.css';
import local from './esnek-proforma.module.css';
export const BANNER_ALIM_SUTUNLARI = ['İşlem Tarihi', 'Yayın Başlangıcı', 'Süre', 'Haftalık Token', 'Toplam Token', 'İşlem'];
export const BANNER_SAYISAL_SUTUNLAR = new Set(['Haftalık Token', 'Toplam Token', 'Toplam Tutar', 'KDV', 'Genel Tutar']);
const tarih = (deger: string) => new Date(deger).toLocaleDateString('tr-TR', {timeZone:'Europe/Istanbul'});
export const BANNER_PROFORMA_SUTUNLARI = ['Toplam Tutar', 'KDV', 'Genel Tutar', 'Proforma', 'Onay'];
const para = (tutar: number) => tutar.toLocaleString('tr-TR', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' TL';

export default function BannerProformaAlani({firmaId,ay,sadeceOnayli=false,basari,tablo,alimSutunSayisi=0}:{
 firmaId:string;ay:string;sadeceOnayli?:boolean;basari?:(mesaj:string)=>void;
 tablo?:(ekSatir:ReactNode, proformaHucreleri?:ReactNode)=>ReactNode; alimSutunSayisi?:number;
}) {
 const [sonuc,setSonuc]=useState<{anahtar:string;veri?:BannerProforma;hata?:string}|null>(null),[yenileme,setYenileme]=useState(0);
 const [acik,setAcik]=useState(false),[modal,setModal]=useState(false),[aciklama,setAciklama]=useState(''),[hata,setHata]=useState(''),[kaydediyor,setKaydediyor]=useState(false);
 const kilit=useRef(false),id=useId(),anahtar=`${firmaId}:${ay}:${sadeceOnayli}:${yenileme}`;
 const guncel=sonuc?.anahtar===anahtar?sonuc:null,d=guncel?.veri;
 useEffect(()=>{const controller=new AbortController();void(async()=>{try{
 const r=await fetch(`/admin/api/firmalar/${firmaId}/banner-proformalar?${new URLSearchParams({ay,onayli:sadeceOnayli?'1':'0'})}`,{cache:'no-store',signal:controller.signal});const v:unknown=await r.json();
 if(!r.ok||!bannerProformaGecerli(v)||v.firma_id!==firmaId||v.ay!==ay||(sadeceOnayli&&v.belge!==null&&v.onay===null))throw Error('Banner proforması alınamadı. SQL kurulumunu ve erişiminizi kontrol edin.');
 if(!controller.signal.aborted)setSonuc({anahtar,veri:v});
 }catch(e){if(!controller.signal.aborted)setSonuc({anahtar,hata:e instanceof Error?e.message:'Proforma alınamadı.'});}})();return()=>controller.abort();},[anahtar,firmaId,ay,sadeceOnayli]);
 useEffect(()=>{const yenile=()=>setYenileme(n=>n+1);window.addEventListener('focus',yenile);return()=>window.removeEventListener('focus',yenile);},[]);
 async function onayla(){
 if(kilit.current||!d?.onaylanabilir||d.onay)return;
 if(d.admin_onayi&&!aciklama.trim()){setHata('Admin onayı için açıklama zorunludur.');return;}
 kilit.current=true;setKaydediyor(true);setHata('');
 try{const r=await fetch(`/admin/api/firmalar/${firmaId}/banner-proformalar`,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({ay,aciklama:aciklama.trim()})});const v=await r.json();
 if(!r.ok)throw Error(typeof v.hata==='string'?v.hata:'Onay kaydedilemedi.');if(!proformaOnayiGecerli(v))throw Error('Onay sonucu doğrulanamadı.');
 if (!d.admin_onayi) basari?.("Proforma fatura onaylanmıştır.");
 setModal(false);setYenileme(n=>n+1);
 }catch(e){setHata(e instanceof Error?e.message:'Onay kaydedilemedi.');}finally{kilit.current=false;setKaydediyor(false);}
 }
 const sutunlar = [...BANNER_ALIM_SUTUNLARI, ...BANNER_PROFORMA_SUTUNLARI];
 const satirlar = (icerik: ReactNode) => tablo ? tablo(icerik) : (
   <div className={styles.tableWrap}><MobilUyumluTablo basliklar={sutunlar} className={local.tablo} aria-label="Onaylı banner proformaları">
     <thead><tr>{sutunlar.map(sutun => <th key={sutun} scope="col" className={BANNER_SAYISAL_SUTUNLAR.has(sutun) ? local.rakam : undefined}>{sutun}</th>)}</tr></thead>
     <tbody>{icerik}</tbody>
   </MobilUyumluTablo></div>
 );
 const sutunSayisi = (alimSutunSayisi || BANNER_ALIM_SUTUNLARI.length) + BANNER_PROFORMA_SUTUNLARI.length;
 const mesajSatiri = (icerik: ReactNode) => satirlar(<tr><td colSpan={sutunSayisi}>{icerik}</td></tr>);
 if(!guncel)return mesajSatiri(<span role="status">Proforma bilgileri yükleniyor…</span>);
 if(guncel.hata)return mesajSatiri(<div role="alert"><p>{guncel.hata}</p><Button variant="outline" onClick={()=>setYenileme(n=>n+1)}>Yeniden Dene</Button></div>);
 if(!d)return satirlar(null);
 if(!d.belge || !d.belge.satirlar.length) {
   if(sadeceOnayli)return mesajSatiri('Bu ay için onaylanan banner proforması bulunmuyor.');
   if(d.belge)return satirlar(null);
   return mesajSatiri(d.bekleyen > 0 ? 'Banner birim fiyatı bulunamadı.' : 'Proforma ve onay, alım ayını takip eden ayın 1’inde açılır.');
 }
 const hucreler = [
     <td key="toplam" className={local.rakam}>{para(d.belge.toplam_tutar)}</td>,
     <td key="kdv" className={local.rakam}>{para(d.belge.kdv)}</td>,
     <td key="genel" className={local.rakam}>{para(d.belge.genel_tutar)}</td>,
     <td key="proforma" className={local.islem}><button type="button" className={local.buton} aria-expanded={acik} aria-controls={acik ? id : undefined} onClick={()=>setAcik(v=>!v)}>Proforma <ChevronDown size={14} aria-hidden="true" /></button></td>,
     <td key="onay" className={local.islem}>{d.onay
       ? <span className={local.durum}>✓ Onaylandı<small>{d.onay.tur==='admin'?'Admin Onayı':'Firma Onayı'}</small></span>
       : <button type="button" className={`${local.buton} ${local.onayla}`} disabled={!d.onaylanabilir} onClick={()=>{setHata('');setModal(true);}}>Onayla</button>}</td>,
 ];
 const detay = acik && <tr><td colSpan={sutunSayisi} className={local.belgeSatiri}><div id={id}><BannerProformaBelgesi veri={d}/></div></td></tr>;
 return <>{tablo ? tablo(detay, hucreler) : satirlar(d.belge.satirlar.map((s, i) => (
   <Fragment key={s.tuketim_id}>
     <tr>
       <td>{tarih(s.tarih)}</td>
       <td>{s.baslangic ? tarih(s.baslangic) : '—'}</td>
       <td>{s.hafta_sayisi} hafta</td>
       <td className={local.rakam}>{s.haftalik_token?.toLocaleString('tr-TR') ?? '—'}</td>
       <td className={local.rakam}>{s.token_adedi.toLocaleString('tr-TR')}</td>
       <td>{s.islem_turu === 'banner_iptal' || s.alan === 'İptal Bedeli' ? 'İptal Bedeli' : 'Banner Alımı'}</td>
       {i === 0 ? hucreler : <td colSpan={BANNER_PROFORMA_SUTUNLARI.length} />}
     </tr>
     {i === 0 && detay}
   </Fragment>
 )))}
 <AlertDialog open={modal} onOpenChange={v=>{if(!kilit.current)setModal(v);}}><AlertDialogContent>
 <AlertDialogHeader><AlertDialogTitle>{d.admin_onayi?'Admin Onayı':'Proforma Fatura Onayı'}</AlertDialogTitle><AlertDialogDescription>{d.admin_onayi?'Ayın tüm banner alımlarını firma adına onaylamak için açıklamanızı yazın.':'Onayınızdan sonra Cogniti tarafından resmi faturanız düzenlenecektir.'}</AlertDialogDescription></AlertDialogHeader>
 {d.admin_onayi&&<label className={local.modalAlan} htmlFor={`${id}-aciklama`}>Açıklama *<textarea id={`${id}-aciklama`} required maxLength={2000} value={aciklama} onChange={e=>setAciklama(e.target.value)} disabled={kaydediyor}/></label>}
 {hata&&<p role="alert" className={local.hata}>{hata}</p>}
 <AlertDialogFooter><AlertDialogCancel disabled={kaydediyor}>Vazgeç</AlertDialogCancel><Button type="button" disabled={kaydediyor||(d.admin_onayi&&!aciklama.trim())} onClick={()=>void onayla()}>{kaydediyor?'Kaydediliyor…':d.admin_onayi?'Kaydet':'Onayla'}</Button></AlertDialogFooter>
 </AlertDialogContent></AlertDialog></>;
}
