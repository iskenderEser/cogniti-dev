"use client";
import {useEffect,useState,useId} from "react";
import {satinAlmaBakiyeOzetiGecerli,type SatinAlmaBakiyeOzeti} from "@/lib/satinAlma/bakiyeOzeti";
import type {BakiyeTuru} from "@/lib/satinAlma/esnekPaket";
export function PmTokenHesapSecimi({deger,onDegistir}:{deger:BakiyeTuru|null;onDegistir:(v:BakiyeTuru)=>void}){
 const name=useId();
 const [sonuc,setSonuc]=useState<{veri?:SatinAlmaBakiyeOzeti;hata?:string}|null>(null);
 const [tekrar,setTekrar]=useState(0);
 useEffect(()=>{const c=new AbortController();void(async()=>{
  try{const r=await fetch('/api/token-bakiyeleri',{cache:'no-store',signal:c.signal});const veri=await r.json();if(!r.ok||!satinAlmaBakiyeOzetiGecerli(veri))throw Error();if(!c.signal.aborted)setSonuc({veri});}
  catch{if(!c.signal.aborted)setSonuc({hata:'Token hesapları alınamadı.'});}
 })();return()=>c.abort();},[tekrar]);
 const num=(n:number)=>n.toLocaleString('tr-TR');
 return <fieldset className="my-3 min-w-0 space-y-2 border-0 p-0 text-xs text-[var(--tema-kontrol-metin)]"><legend className="mb-2">Eczanem gönderimlerinde kullanılacak token hesabı</legend>
 {!sonuc?<p role="status">Hesaplar yükleniyor…</p>:sonuc.hata?<p role="alert">{sonuc.hata} <button type="button" onClick={()=>{setSonuc(null);setTekrar(n=>n+1);}}>Tekrar dene</button></p>:sonuc.veri&&<>
 {sonuc.veri.kisisel&&<label className="flex flex-wrap items-center gap-2"><input type="radio" name={name} checked={deger==='kisisel'} onChange={()=>onDegistir('kisisel')}/>Kişisel Token Hesabı · Kullanılabilir {num(sonuc.veri.kisisel.kalan)}</label>}
 <label className="flex flex-wrap items-center gap-2"><input type="radio" name={name} checked={deger==='firma_ortak'} onChange={()=>onDegistir('firma_ortak')}/>Firma Token Hesabı · Kullanılabilir {num(sonuc.veri.firma_ortak.kalan)}</label>
 <p className="text-[var(--tema-ikincil-metin)]">UTT eczaneye ilettiğinde uygun aktif üye sayısı kadar token bloklanır. Hesap seçimi bu yayın için sabitlenir.</p>
 </>}
 </fieldset>;
}
