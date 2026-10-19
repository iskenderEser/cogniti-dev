"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { createClient } from "@/lib/supabase/client";
import { kityGirisiniIsaretle, kityHesapDurumunuOku, kityTercihiniKaydet } from "@/lib/auth/kityTercihi";
import { kityKarsilamasi, kityTuruKapsaminda, KITY_METINLERI, KITY_URETICI_ADIMLARI } from "@/lib/rehber/kityGirisTuru";
import type { AuthKullanici } from "@/types/auth";
import YuruyenRehber from "./YuruyenRehber";
import styles from "./rehber.module.css";

type Props = { kullanici: AuthKullanici };

// Yalnız üretici ana sayfası verileri yüklendikten sonra bu bileşeni açar.
export default function KityGirisTuru({ kullanici }: Props) {
  return kityTuruKapsaminda(kullanici) ? <HesapTuru key={kullanici.id} kullanici={kullanici} /> : null;
}

function HesapTuru({ kullanici }: Props) {
  const [acik, setAcik] = useState(false);
  const [gosterme, setGosterme] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const hesapRef = useRef<ReturnType<typeof kityHesapDurumunuOku> | null>(null);
  const kayitRef = useRef(false);
  const { mesajlar, hata } = useHataMesaji();
  const karsilama = useMemo(() => kityKarsilamasi(kullanici.ad), [kullanici.ad]);

  useEffect(() => {
    let iptal = false;
    hesapRef.current ??= kityHesapDurumunuOku(createClient().auth, kullanici.id);
    void hesapRef.current.then(durum => {
      if (iptal || !durum || durum.gosterme) return;
      let depo: Storage | undefined;
      try { depo = window.localStorage; } catch {}
      if (kityGirisiniIsaretle(kullanici.id, durum.oturumId, depo)) setAcik(true);
    });
    return () => { iptal = true; };
  }, [kullanici.id]);

  const tercihiDegistir = async (secili: boolean) => {
    if (kayitRef.current) return;
    kayitRef.current = true;
    setKaydediliyor(true);
    const basarili = await kityTercihiniKaydet(createClient().auth, kullanici.id, secili);
    if (basarili) setGosterme(secili);
    else hata("Kity tercihin kaydedilemedi. Yeniden deneyebilirsin.");
    kayitRef.current = false;
    setKaydediliyor(false);
  };

  return <>
    <YuruyenRehber
      adimlar={KITY_URETICI_ADIMLARI}
      karsilama={karsilama}
      acik={acik}
      onKapat={() => setAcik(false)}
      tarayiciSesiKullan={false}
      vedaMetni={KITY_METINLERI.veda}
      altIcerik={<label className={styles.tercih}>
        <input type="checkbox" checked={gosterme} disabled={kaydediliyor} onChange={e => void tercihiDegistir(e.target.checked)} />
        <span>Bir daha gösterme{kaydediliyor ? " · Kaydediliyor…" : ""}</span>
      </label>}
    />
    <HataMesajiContainer mesajlar={mesajlar} />
  </>;
}
