"use client";

import { useCallback, useEffect, useRef } from "react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { BILDIRIM_ROZETLERI_DEGISTI, bildirimRozetleriniYenile } from "@/lib/bildirimler/rozet";

type BildirimSatiri = {
  bildirim_id: string;
  kayit_turu: string;
  mesaj: string;
  goruldu_mu: boolean;
};

const GOSTERILEN_TOAST_ANAHTARI = "cogniti_gosterilen_bildirim_toastlari";

function oturumToastlariniOku(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const ham = window.sessionStorage.getItem(GOSTERILEN_TOAST_ANAHTARI);
    if (!ham) return new Set();
    const dizi = JSON.parse(ham);
    return Array.isArray(dizi) ? new Set(dizi.filter((x): x is string => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function oturumToastKaydet(kume: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GOSTERILEN_TOAST_ANAHTARI, JSON.stringify([...kume].slice(-200)));
  } catch {}
}

export default function YayinSonucBildirimi() {
  const { mesajlar, basari, hata } = useHataMesaji();
  const islenenBildirimler = useRef<Set<string>>(new Set());

  const bildirimleriKontrolEt = useCallback(async () => {
    try {
      const oturumKumesi = oturumToastlariniOku();
      for (const id of oturumKumesi) islenenBildirimler.current.add(id);

      const res = await fetch("/bildirimler/api", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const bildirimler = (data.bildirimler ?? []) as BildirimSatiri[];

      for (const b of bildirimler) {
        if (!b.bildirim_id || !b.mesaj) continue;
        if (islenenBildirimler.current.has(b.bildirim_id)) continue;

        const yayinBasarisiz = b.kayit_turu === "yayin" && b.mesaj.includes("yayınlanamamıştır");
        const transkriptBildirimi = b.kayit_turu === "video" && b.mesaj.includes("Podcast AI transkript");
        const transkriptBasarisiz = transkriptBildirimi && b.mesaj.includes("tamamlanamadı");

        // İş kuyruğu rozetlerine bağlı bildirimler (talep, senaryo, video görevi, soru_seti, oneri, cek)
        // canlı toast olarak 1 kez gösterilir ancak veritabanında okundu (goruldu_mu=true) yapılmaz;
        // böylece kullanıcı işi tamamlayana kadar sol menü rozeti korunur.
        // Yalnızca rozete bağlı olmayan tek seferlik sonuç/uyandırma bildirimleri (yayin ve Podcast AI transkript)
        // gösterildikten sonra okundu işaretlenir.
        const okunduIsaretlenecekMi = b.kayit_turu === "yayin" || transkriptBildirimi;

        islenenBildirimler.current.add(b.bildirim_id);
        oturumToastKaydet(islenenBildirimler.current);

        if (yayinBasarisiz || transkriptBasarisiz) {
          hata(b.mesaj);
        } else {
          basari(b.mesaj);
        }

        if (okunduIsaretlenecekMi) {
          try {
            await fetch("/bildirimler/api", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bildirim_id: b.bildirim_id }),
            });
            bildirimRozetleriniYenile();
          } catch {}
        }
      }
    } catch {
      // Ağ hatası durumunda sessizce devam edilir
    }
  }, [basari, hata]);

  useEffect(() => {
    void bildirimleriKontrolEt();

    const gorunur = () => {
      if (document.visibilityState === "visible") void bildirimleriKontrolEt();
    };

    document.addEventListener("visibilitychange", gorunur);
    window.addEventListener(BILDIRIM_ROZETLERI_DEGISTI, bildirimleriKontrolEt);

    return () => {
      document.removeEventListener("visibilitychange", gorunur);
      window.removeEventListener(BILDIRIM_ROZETLERI_DEGISTI, bildirimleriKontrolEt);
    };
  }, [bildirimleriKontrolEt]);

  return <HataMesajiContainer mesajlar={mesajlar} />;
}
