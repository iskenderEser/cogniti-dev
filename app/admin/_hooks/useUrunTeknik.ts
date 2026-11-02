"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Firma, Takim, Teknik, Urun } from "../_types";

interface Props {
  seciliFirma: Firma;
  takimlar: Takim[];
  hata: (mesaj:string, adim?:string, detay?:string) => void;
  basari: (mesaj:string) => void;
}

/** Firma anahtarıyla açılan çalışma alanı; mevcut ürün/teknik API'lerini kullanır. */
export function useUrunTeknik({ seciliFirma, takimlar, hata, basari }:Props) {
  const [urunler,setUrunler]=useState<Urun[]>([]);
  const [teknikler,setTeknikler]=useState<Teknik[]>([]);
  const [yeniUrunAdi,setYeniUrunAdi]=useState("");
  const [yeniUrunTakimId,setYeniUrunTakimId]=useState("");
  const [yeniTeknikAdi,setYeniTeknikAdi]=useState("");
  const [urunEkleLoading,setUrunEkleLoading]=useState(false);
  const [teknikEkleLoading,setTeknikEkleLoading]=useState(false);
  const [urunSilLoading,setUrunSilLoading]=useState<string|null>(null);
  const [teknikSilLoading,setTeknikSilLoading]=useState<string|null>(null);
  const [urunYukleniyor,setUrunYukleniyor]=useState(true);
  const [teknikYukleniyor,setTeknikYukleniyor]=useState(true);
  const [urunHatasi,setUrunHatasi]=useState(false);
  const [teknikHatasi,setTeknikHatasi]=useState(false);
  const aktif=useRef(true);
  const islemKilidi=useRef(false);
  const firmaId=seciliFirma.firma_id;

  const urunleriCek=useCallback(async(signal?:AbortSignal)=>{
    if(!aktif.current)return;
    setUrunYukleniyor(true);setUrunHatasi(false);
    try {
      const res=await fetch(`/admin/api/firmalar/${firmaId}/urunler`,{signal});
      const data=await res.json();
      if(!aktif.current || signal?.aborted)return;
      if(!res.ok){setUrunHatasi(true);hata(data.hata ?? "Ürünler yüklenemedi.",data.adim,data.detay);return;}
      setUrunler(data.urunler ?? []);
    } catch(err) {
      if(!aktif.current || signal?.aborted)return;
      setUrunHatasi(true);hata("Ürünler yüklenemedi — bağlantı hatası.","ürün listesi",String(err));
    } finally {if(aktif.current && !signal?.aborted)setUrunYukleniyor(false);}
  },[firmaId,hata]);

  const teknikleriCek=useCallback(async(signal?:AbortSignal)=>{
    if(!aktif.current)return;
    setTeknikYukleniyor(true);setTeknikHatasi(false);
    try {
      const res=await fetch(`/admin/api/firmalar/${firmaId}/teknikler`,{signal});
      const data=await res.json();
      if(!aktif.current || signal?.aborted)return;
      if(!res.ok){setTeknikHatasi(true);hata(data.hata ?? "Teknikler yüklenemedi.",data.adim,data.detay);return;}
      setTeknikler(data.teknikler ?? []);
    } catch(err) {
      if(!aktif.current || signal?.aborted)return;
      setTeknikHatasi(true);hata("Teknikler yüklenemedi — bağlantı hatası.","teknik listesi",String(err));
    } finally {if(aktif.current && !signal?.aborted)setTeknikYukleniyor(false);}
  },[firmaId,hata]);

  useEffect(()=>{
    aktif.current=true;
    const controller=new AbortController();
    void urunleriCek(controller.signal);
    void teknikleriCek(controller.signal);
    return ()=>{aktif.current=false;controller.abort();};
  },[urunleriCek,teknikleriCek]);

  const handleUrunEkle=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!yeniUrunAdi.trim() || !yeniUrunTakimId || islemKilidi.current)return;
    islemKilidi.current=true;setUrunEkleLoading(true);
    try {
      const res=await fetch(`/admin/api/firmalar/${firmaId}/urunler`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({urun_adi:yeniUrunAdi.trim(),takim_id:yeniUrunTakimId})});
      const data=await res.json();
      if(!aktif.current)return;
      if(!res.ok){hata(data.hata ?? "Ürün eklenemedi.",data.adim,data.detay);return;}
      basari("Ürün eklendi.");setYeniUrunAdi("");await urunleriCek();
    } catch(err) {if(aktif.current)hata("Ürün ekleme sonucu alınamadı. Yeniden denemeden önce listeyi kontrol edin.","ürün ekleme",String(err));}
    finally {islemKilidi.current=false;if(aktif.current)setUrunEkleLoading(false);}
  };

  const handleTeknikEkle=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!yeniTeknikAdi.trim() || islemKilidi.current)return;
    islemKilidi.current=true;setTeknikEkleLoading(true);
    try {
      const res=await fetch(`/admin/api/firmalar/${firmaId}/teknikler`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({teknik_adi:yeniTeknikAdi.trim()})});
      const data=await res.json();
      if(!aktif.current)return;
      if(!res.ok){hata(data.hata ?? "Teknik eklenemedi.",data.adim,data.detay);return;}
      basari("Teknik eklendi.");setYeniTeknikAdi("");await teknikleriCek();
    } catch(err) {if(aktif.current)hata("Teknik ekleme sonucu alınamadı. Yeniden denemeden önce listeyi kontrol edin.","teknik ekleme",String(err));}
    finally {islemKilidi.current=false;if(aktif.current)setTeknikEkleLoading(false);}
  };

  const handleUrunSil=async(urun_id:string)=>{
    if(islemKilidi.current)return false;
    islemKilidi.current=true;setUrunSilLoading(urun_id);
    try {
      const res=await fetch(`/admin/api/firmalar/${firmaId}/urunler`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({urun_id})});
      const data=await res.json();
      if(!aktif.current)return res.ok;
      if(!res.ok){hata(data.hata ?? "Ürün silinemedi.",data.adim,data.detay);return false;}
      basari("Ürün silindi.");await urunleriCek();return true;
    } catch(err) {if(aktif.current)hata("Ürün silme sonucu alınamadı. Yeniden denemeden önce listeyi kontrol edin.","ürün silme",String(err));return false;}
    finally {islemKilidi.current=false;if(aktif.current)setUrunSilLoading(null);}
  };

  const handleTeknikSil=async(teknik_id:string)=>{
    if(islemKilidi.current)return false;
    islemKilidi.current=true;setTeknikSilLoading(teknik_id);
    try {
      const res=await fetch(`/admin/api/firmalar/${firmaId}/teknikler`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({teknik_id})});
      const data=await res.json();
      if(!aktif.current)return res.ok;
      if(!res.ok){hata(data.hata ?? "Teknik silinemedi.",data.adim,data.detay);return false;}
      basari("Teknik silindi.");await teknikleriCek();return true;
    } catch(err) {if(aktif.current)hata("Teknik silme sonucu alınamadı. Yeniden denemeden önce listeyi kontrol edin.","teknik silme",String(err));return false;}
    finally {islemKilidi.current=false;if(aktif.current)setTeknikSilLoading(null);}
  };

  const takimAdi=(id:string)=>takimlar.find(t=>t.takim_id===id)?.takim_adi ?? "—";
  return { urunler,teknikler,yeniUrunAdi,setYeniUrunAdi,yeniUrunTakimId,setYeniUrunTakimId,yeniTeknikAdi,setYeniTeknikAdi,
    urunEkleLoading,teknikEkleLoading,urunSilLoading,teknikSilLoading,urunYukleniyor,teknikYukleniyor,urunHatasi,teknikHatasi,
    handleUrunEkle,handleTeknikEkle,handleUrunSil,handleTeknikSil,takimAdi,urunleriCek,teknikleriCek };
}
