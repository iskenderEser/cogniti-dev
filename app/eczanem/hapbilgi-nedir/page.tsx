"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import EczanemMusteriNavbar from "../_components/EczanemMusteriNavbar";
import OgrenmeZinciri from "@/components/panel/bilgi/OgrenmeZinciri";
import styles from "@/components/panel/bilgi/bilgi.module.css";

export default function EczanemHapbilgiNedirPage() {
  const { kullanici, yukleniyor, cikisYap } = useAuth();
  const musteri = !!kullanici && kullanici.kimlik_turu === MUSTERI_ROLU;

  if (yukleniyor || !kullanici || !musteri) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--tema-yerel-eczanem-kart-01)]">
        <span
          className="size-7 animate-spin rounded-full border-2 border-[var(--tema-yerel-eczanem-cizgi-38)] border-t-[var(--tema-yerel-eczanem-vurgu-cizgi-01)]"
          aria-label="Oturum yükleniyor"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--tema-yerel-eczanem-kart-01)]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <EczanemMusteriNavbar
        ad={kullanici.adSoyad || kullanici.ad || "Müşteri"}
        telefon={kullanici.telefon}
        onCikis={cikisYap}
      />

      <div className={styles.zemin}>
        <section className={styles.sayfa} aria-label="HapBilgi Nedir?">
          <header>
            <p className={styles.etiket}>HapBilgi Nedir?</p>
            <h1 className={styles.baslik}>
              Uçtan uca<br />
              <span>öğrenme zinciri</span>
            </h1>
            <p className={styles.aciklama}>
              Eczanenizden gelen güvenilir ürün ve sağlık içeriklerini keşfettiğiniz, öğrendikçe puan biriktirdiğiniz bir dijital öğrenme platformudur.
            </p>
          </header>
          <OgrenmeZinciri baslangicIndex={3} />
        </section>
      </div>
    </div>
  );
}
