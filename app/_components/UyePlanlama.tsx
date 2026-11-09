"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import PanelNavbar from "@/components/panel/PanelNavbar";
import { panelBaslangici } from "@/lib/panel/baslangic";
import { planlamaTarifesiGecerli, type PlanlamaTarifesi } from "@/lib/fiyat/planlama";

export default function UyePlanlama({ rol, partnerAdi, kullaniciId, icerik }: { rol: string; partnerAdi?: string; kullaniciId?: string; icerik: string }) {
  const { kullanici, cikisYap } = useAuth();
  const hesapId = kullaniciId ?? kullanici?.id;
  const anahtar = hesapId ? `cogniti:planlama:${hesapId}:v1`
    : rol === "partner" && partnerAdi ? `cogniti:planlama:partner:${partnerAdi}:v1` : null;
  const [yuklemeSayisi, setYuklemeSayisi] = useState(0);
  const cerceve = useRef<HTMLIFrameElement>(null);
  const [yukseklik, setYukseklik] = useState(1600);
  const [kayitHatasi, setKayitHatasi] = useState("");
  const [tarife, setTarife] = useState<PlanlamaTarifesi | null>(null);
  const [fiyatHatasi, setFiyatHatasi] = useState("");
  const [fiyatDeneme, setFiyatDeneme] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function oku() {
      setTarife(null); setFiyatHatasi("");
      try {
        const yanit = await fetch(rol === "partner" ? "/partner/api/fiyatlar" : "/fiyatlar/api", { cache:"no-store", signal:controller.signal });
        const veri: unknown = await yanit.json();
        if (!yanit.ok || !planlamaTarifesiGecerli(veri)) throw new Error("Fiyatlar okunamadı.");
        if (!controller.signal.aborted) setTarife(veri);
      } catch { if (!controller.signal.aborted) setFiyatHatasi("Güncel fiyatlar okunamadı. Yeniden deneyin."); }
    }
    void oku();
    return () => controller.abort();
  }, [rol, fiyatDeneme]);
  useEffect(() => {
    const gonder = () => cerceve.current?.contentWindow?.postMessage({ type:"cogniti-planlama-tarife", tarife, hata:fiyatHatasi }, "*");
    const hazir = (event: MessageEvent) => {
      if (event.source === cerceve.current?.contentWindow && event.data?.type === "cogniti-planlama-hazir") gonder();
    };
    window.addEventListener("message", hazir);
    gonder();
    return () => window.removeEventListener("message", hazir);
  }, [tarife, fiyatHatasi, yuklemeSayisi]);
  useEffect(() => {
    let yuklendi = false;
    const boyut = (event: MessageEvent) => {
      if (event.source !== cerceve.current?.contentWindow) return;
      if (event.data?.type === "cogniti-planlama-hazir" && anahtar) {
        let draft = null;
        try { draft = JSON.parse(localStorage.getItem(anahtar) ?? "null"); }
        catch { setKayitHatasi("Kayıtlı cevaplar okunamadı. Tarayıcı depolama izinlerini kontrol edin."); }
        cerceve.current?.contentWindow?.postMessage({ type: "cogniti-planlama-yukle", draft }, "*");
        return;
      }
      if (event.data?.type === "cogniti-planlama-yuklendi") { yuklendi = true; return; }
      if (event.data?.type === "cogniti-planlama-kaydet" && anahtar && yuklendi) {
        const draft = event.data.draft;
        if (draft?.version === 1 && draft.values && draft.switches) {
          try { localStorage.setItem(anahtar, JSON.stringify(draft)); setKayitHatasi(""); }
          catch { setKayitHatasi("Cevaplar kaydedilemedi. Sayfayı yenilemeden önce tarayıcı depolama izinlerini kontrol edin."); }
        }
        return;
      }
      if (event.data?.type !== "cogniti-planlama-yukseklik") return;
      const h = event.data.height;
      if (typeof h === "number" && Number.isFinite(h) && h > 0 && h < 50000) setYukseklik(Math.ceil(h));
    };
    window.addEventListener("message", boyut);
    cerceve.current?.contentWindow?.postMessage({ type: "cogniti-planlama-hazir-misin" }, "*");
    return () => window.removeEventListener("message", boyut);
  }, [anahtar, yuklemeSayisi]);
  const router = useRouter();
  useEffect(() => {
    const yonlendir = (event: MessageEvent) => {
      if (event.source === cerceve.current?.contentWindow && event.data?.type === "cogniti-planlama-fiyatlara-git") {
        router.push(rol === "partner" ? "/partner/fiyatlar" : "/fiyatlar");
      }
    };
    window.addEventListener("message", yonlendir);
    return () => window.removeEventListener("message", yonlendir);
  }, [rol, router]);
  const anaSayfaYolu = rol === "partner" ? "/partner/egitimler" : rol === "admin" ? "/admin"
    : rol === "firma_admin" && kullanici?.firma_id ? `/admin?${new URLSearchParams({firma:kullanici.firma_id,sayfa:"firmabilgileri"})}` : panelBaslangici(rol).yol;
  const cikis = async () => {
    if (rol === "partner") { await fetch("/partner/api/cikis", { method:"POST" }); router.replace("/partner"); }
    else await cikisYap();
  };
  return <>
    <PanelNavbar adSoyad={partnerAdi ?? kullanici?.adSoyad} profilAltBilgi={partnerAdi ? "Cogniti İş Partneri" : undefined}
      anaSayfaYolu={anaSayfaYolu} bilgiPilleri={[{key:"ana-sayfa",etiket:"Ana Sayfa",path:anaSayfaYolu}]}
      fiyatlarGoster fiyatlarYolu={rol === "partner" ? "/partner/fiyatlar" : "/fiyatlar"} onCikis={() => void cikis()} />
    {kayitHatasi && <p role="alert">{kayitHatasi}</p>}
    {fiyatHatasi && <p role="alert">{fiyatHatasi} <button type="button" onClick={() => setFiyatDeneme(sayi => sayi + 1)}>Yeniden dene</button></p>}
    <main><iframe ref={cerceve} onLoad={() => setYuklemeSayisi(sayi => sayi + 1)} title="Planlama Aracı" srcDoc={icerik} sandbox="allow-scripts" style={{ display:"block", width:"100%", height:yukseklik, border:0 }} /></main>
  </>;
}
