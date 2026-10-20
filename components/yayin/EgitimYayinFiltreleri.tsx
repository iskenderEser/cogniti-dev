"use client";

import { useMemo } from "react";
import { SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";
import { ListeArama } from "@/components/liste";
import type { ListeArananDurumu } from "@/components/liste/useListe";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import { UttYayinTuruToggle } from "./UttYayinListeOrtaklari";
import styles from "./egitim-yayin-filtreleri.module.css";

interface UrunluYayin {
  urun_adi: string;
  gorunen_urun_id?: string | null;
  arac_turu?: string | null;
}

interface UrunSecenegi {
  anahtar: string;
  ad: string;
}

/** Görünen ürün ID'si varsa aynı adlı farklı ürünler birbirine karışmaz. */
export function egitimUrunAnahtari(yayin: UrunluYayin): string {
  return yayin.gorunen_urun_id
    ? JSON.stringify(["id", yayin.gorunen_urun_id])
    : JSON.stringify(["ad", yayin.urun_adi.trim().toLocaleLowerCase("tr-TR")]);
}

export function useEgitimUrunFiltresi<T extends UrunluYayin>(yayinlar: T[], etkin: boolean, secim: string | null) {
  const urunler = useMemo(() => {
    const tekil = new Map<string, UrunSecenegi>();
    if (etkin) for (const yayin of yayinlar) {
      const anahtar = egitimUrunAnahtari(yayin);
      if (!tekil.has(anahtar)) tekil.set(anahtar, { anahtar, ad: yayin.urun_adi });
    }
    return [...tekil.values()].sort((a, b) => a.ad.localeCompare(b.ad, "tr-TR"));
  }, [yayinlar, etkin]);
  // Yenilemede ürün listeden kalkarsa görünümü boş bir eski seçime kilitleme.
  const seciliUrun = etkin && urunler.some(urun => urun.anahtar === secim) ? secim : null;
  const urunYayinlari = useMemo(() => seciliUrun
    ? yayinlar.filter(yayin => egitimUrunAnahtari(yayin) === seciliUrun)
    : yayinlar, [yayinlar, seciliUrun]);
  return { urunler, seciliUrun, urunYayinlari };
}

/** Ürün satırı ile yayın türü ve arama alanlarının ortak, alana göre yerleşimi. */
export default function EgitimYayinFiltreleri<T extends UrunluYayin>({
  urunler, seciliUrun, onUrunSec, yayinlar, aktifTur, onTurDegistir, arama,
}: {
  urunler: UrunSecenegi[];
  seciliUrun: string | null;
  onUrunSec: (anahtar: string | null) => void;
  yayinlar: T[];
  aktifTur: YayinTuruFiltreDegeri;
  onTurDegistir: (tur: YayinTuruFiltreDegeri) => void;
  arama: ListeArananDurumu<T>;
}) {
  return <div className={styles.alan} data-egitim-filtreleri>
    {urunler.length > 0 && <div className={styles.urunler}>
      <SadeKontrolGrubu tur="sekme" aria-label="Ürün filtresi">
        <SadeKontrolButonu aria-pressed={seciliUrun === null} onClick={() => onUrunSec(null)}>Tüm Ürünler</SadeKontrolButonu>
        {urunler.map(urun => <SadeKontrolButonu key={urun.anahtar} aria-pressed={seciliUrun === urun.anahtar}
          onClick={() => onUrunSec(urun.anahtar)}>{urun.ad}</SadeKontrolButonu>)}
      </SadeKontrolGrubu>
    </div>}
    <div className={styles.kontroller}>
      <div className={styles.tur}>
        <UttYayinTuruToggle yayinlar={yayinlar} deger={aktifTur} onDegistir={onTurDegistir} />
      </div>
      <div className={styles.arama}>
        <ListeArama arama={arama} ipucu="Bu kategoride ara..." genislik="w-full" yukseklik="secim" />
      </div>
    </div>
  </div>;
}
