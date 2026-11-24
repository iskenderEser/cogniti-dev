"use client";
import {useEffect,useState} from 'react';
import {Search,ShoppingBag} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {vivaAlimYanitiGecerli,type VivaAlimYaniti} from '@/lib/satinAlma/vivaAlimlari';
import VivaProformaAlani from "./VivaProformaAlani";
import MobilUyumluTablo from './MobilUyumluTablo';
import styles from '../admin.module.css';
import local from './esnek-proforma.module.css';
import tokenStyles from './token-yonetimi.module.css';
import {SadeKapsulFiltre} from "@/components/kontrol/SadeKontroller";
const basliklar=['Yayın Tarihi','Yayın Adı','Düzenleyen','Katılımcı Sayısı','Toplam Kişi-Dakika','Birim Fiyat','Tutar'];
const para=(n:number)=>`${n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} TL`;
const AYLAR=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const ay=(s:string)=>new Date(`${s}-01T00:00:00+03:00`).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',month:'long',year:'numeric'});
export default function VivaKullanimAlimlari({firmaId,basari,hata}:{firmaId:string;basari:(mesaj:string)=>void;hata?:(mesaj:string)=>void}) {
 const [aramaMetni,setAramaMetni]=useState(''),[arama,setArama]=useState(''),[yenileme,setYenileme]=useState(0);
 const [seciliAy,setSeciliAy]=useState('');
 const [sonuc,setSonuc]=useState<{anahtar:string;veri?:VivaAlimYaniti;hata?:string}|null>(null);
 const anahtar=`${firmaId}:${arama}:${yenileme}`,guncel=sonuc?.anahtar===anahtar?sonuc:null,d=guncel?.veri;
 const yil=d?.belgeler[0]?.donem.slice(0,4)??new Intl.DateTimeFormat('en',{timeZone:'Europe/Istanbul',year:'numeric'}).format(new Date());
 const aktifAy=seciliAy||d?.belgeler[0]?.donem||`${yil}-${new Intl.DateTimeFormat('en',{timeZone:'Europe/Istanbul',month:'2-digit'}).format(new Date())}`;
 const aktifBelge=d?.belgeler.find(b=>b.donem===aktifAy);
 useEffect(()=>{
 const controller=new AbortController();
 void(async()=>{try{
 const r=await fetch(`/admin/api/firmalar/${firmaId}/viva-alimlari?${new URLSearchParams({q:arama})}`,{cache:'no-store',signal:controller.signal});const v:unknown=await r.json();
 if(!r.ok||!vivaAlimYanitiGecerli(v)||v.firma_id!==firmaId||v.arama!==arama)throw Error('Viva satın alımları okunamadı. Yeniden deneyin.');
 if(!controller.signal.aborted)setSonuc({anahtar,veri:v});
 }catch(e){if(!controller.signal.aborted)setSonuc({anahtar,hata:e instanceof Error?e.message:'Viva satın alımları okunamadı.'});}})();
 return()=>controller.abort();
 },[anahtar,firmaId,arama]);
 return <section className={styles.card} aria-label="Viva Kullanımı">
 <div className={styles.cardHeader}><div><h2><ShoppingBag/>Viva Kullanımı</h2><p>Gerçek katılım sürelerine göre hesaplanan aylık kullanım bedelleri. Sonraki ay faturalandırılır.</p></div>
 <form className={tokenStyles.siparisArama} role="search" onSubmit={e=>{e.preventDefault();setArama(aramaMetni.trim());setYenileme(n=>n+1);}}>
 <input type="search" className={styles.input} aria-label="Yayın veya düzenleyen ara" placeholder="Yayın veya düzenleyen ara…" maxLength={80} value={aramaMetni} onChange={e=>setAramaMetni(e.target.value)}/>
 <button type="submit" className={`${styles.button} ${styles.primary}`}><Search/>Ara</button></form></div>
 {!guncel?<p className={styles.cardBody} role="status">Viva kullanımları yükleniyor…</p>:guncel.hata?<div className={styles.cardBody} role="alert"><p>{guncel.hata}</p><Button type="button" variant="outline" onClick={()=>setYenileme(n=>n+1)}>Yeniden Dene</Button></div>:d&&<>
 {!aktifBelge&&<p className={styles.cardBody}>{arama?'Aramayla eşleşen kayıt bulunamadı.':'Henüz kesinleşmiş Viva kullanımı bulunmuyor.'}</p>}
 {<div className={styles.cardBody}><SadeKapsulFiltre
 etiket="Kullanım ayları" deger={aktifAy} onDegistir={setSeciliAy}
 secenekler={AYLAR.map((etiket,i)=>({deger:`${yil}-${String(i+1).padStart(2,'0')}`,etiket}))}
 /></div>}
 {aktifBelge&&[aktifBelge].map(b=><div key={b.donem} aria-label={ay(b.donem)}>
 <div className={styles.tableWrap}><MobilUyumluTablo basliklar={basliklar} className={local.tablo} aria-label="Aylık Viva satın alımları">
 <thead><tr>{basliklar.map((b,i)=><th key={b} className={i>=3?local.rakam:undefined}>{b}</th>)}</tr></thead>
 <tbody>{b.satirlar.map(s=><tr key={s.etkinlik_id}><td>{new Date(s.yayin_tarihi).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul',dateStyle:'short',timeStyle:'short'})}</td><td>{s.yayin_adi}</td><td>{s.duzenleyen}</td>
 <td className={local.rakam}>{s.katilimci_sayisi.toLocaleString('tr-TR')}</td><td className={local.rakam}>{s.kisi_dakika.toLocaleString('tr-TR',{maximumFractionDigits:4})}</td><td className={local.rakam}>{para(s.birim_fiyat)}</td><td className={local.rakam}>{para(s.tutar)}</td></tr>)}
 {!b.satirlar.length&&<tr><td colSpan={7}>Henüz kesinleşmiş Viva kullanımı bulunmuyor.</td></tr>}</tbody></MobilUyumluTablo></div>
 <dl className={local.toplamlar}><div><dt>Toplam Tutar</dt><dd>{para(b.toplam_tutar)}</dd></div><div><dt>KDV (%20)</dt><dd>{para(b.kdv)}</dd></div><div className={local.genel}><dt>Genel Tutar</dt><dd>{para(b.genel_tutar)}</dd></div></dl>
 <VivaProformaAlani key={`${firmaId}:${b.donem}`} firmaId={firmaId} ay={b.donem} basari={basari} hata={hata}/></div>)}
 </>}
 <p className={local.bilgi}>Tutarlar kesinleşmiş Viva kullanımlarından hesaplanır. Birim fiyat TL/kişi-dakikadır.</p>
 </section>;
}
