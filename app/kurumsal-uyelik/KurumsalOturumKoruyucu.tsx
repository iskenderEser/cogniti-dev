"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import adminStyles from "@/app/admin/admin.module.css";
import { createClient } from "@/lib/supabase/client";
import {
  kurumsalTaslagiTemizle,
  SON_ETKILESIM_ANAHTARI,
  taslakOku,
  taslakYaz,
} from "./kurumsalTaslak";

const HAREKETSIZLIK_SURESI_MS = 15 * 60 * 1000; // 15 dakika
const GERI_SAYIM_SANIYE = 60; // 60 saniye uyarı süresi

export default function KurumsalOturumKoruyucu() {
  const [uyariAcik, setUyariAcik] = useState(false);
  const [kalanSaniye, setKalanSaniye] = useState(GERI_SAYIM_SANIYE);
  const [temizleniyor, setTemizleniyor] = useState(false);

  const temizleVeCik = useCallback(async () => {
    if (temizleniyor) return;
    setTemizleniyor(true);
    kurumsalTaslagiTemizle();
    try {
      await createClient().auth.signOut();
    } catch {
      // oturum kapatma hatası yönlendirmeyi engellemez
    }
    window.location.replace("/welcome");
  }, [temizleniyor]);

  const devamEt = useCallback(() => {
    taslakYaz(SON_ETKILESIM_ANAHTARI, Date.now());
    setUyariAcik(false);
    setKalanSaniye(GERI_SAYIM_SANIYE);
  }, []);

  useEffect(() => {
    const mevcutZaman = taslakOku<number>(SON_ETKILESIM_ANAHTARI);
    if (!mevcutZaman || typeof mevcutZaman !== "number") {
      taslakYaz(SON_ETKILESIM_ANAHTARI, Date.now());
    }

    let sonKayitZamani = Date.now();
    const etkilesimKaydet = () => {
      if (uyariAcik) return;
      const simdi = Date.now();
      if (simdi - sonKayitZamani > 2000) {
        sonKayitZamani = simdi;
        taslakYaz(SON_ETKILESIM_ANAHTARI, simdi);
      }
    };

    const olaylar = ["mousedown", "keydown", "touchstart", "scroll", "input", "change"] as const;
    for (const olay of olaylar) {
      window.addEventListener(olay, etkilesimKaydet, { passive: true });
    }

    const kontrolAraligi = window.setInterval(() => {
      if (uyariAcik) return;
      const son = taslakOku<number>(SON_ETKILESIM_ANAHTARI) ?? Date.now();
      if (Date.now() - son >= HAREKETSIZLIK_SURESI_MS) {
        setKalanSaniye(GERI_SAYIM_SANIYE);
        setUyariAcik(true);
      }
    }, 5000);

    return () => {
      for (const olay of olaylar) {
        window.removeEventListener(olay, etkilesimKaydet);
      }
      window.clearInterval(kontrolAraligi);
    };
  }, [uyariAcik]);

  useEffect(() => {
    if (!uyariAcik) return;
    const sayac = window.setInterval(() => {
      setKalanSaniye((onceki) => {
        if (onceki <= 1) {
          window.clearInterval(sayac);
          void temizleVeCik();
          return 0;
        }
        return onceki - 1;
      });
    }, 1000);
    return () => window.clearInterval(sayac);
  }, [uyariAcik, temizleVeCik]);

  return (
    <AlertDialog open={uyariAcik}>
      <AlertDialogContent>
        <AlertDialogTitle>İşleme devam etmek istiyor musunuz?</AlertDialogTitle>
        <AlertDialogDescription>
          Uzun süredir işlem yapmadınız. Güvenliğiniz için{" "}
          <strong>{kalanSaniye} saniye</strong> içinde yanıt verilmezse
          kaydedilmemiş form bilgileriniz temizlenecek ve oturumunuz
          kapatılacaktır.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <button
            type="button"
            className={adminStyles.button}
            disabled={temizleniyor}
            onClick={() => void temizleVeCik()}
          >
            {temizleniyor ? "Temizleniyor…" : "Temizle ve Çık"}
          </button>
          <button
            type="button"
            className={`${adminStyles.button} ${adminStyles.primary}`}
            disabled={temizleniyor}
            onClick={devamEt}
          >
            Devam Et
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
