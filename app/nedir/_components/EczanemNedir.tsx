"use client";

import EczanemPanelBaglantisi from "@/app/eczanem/_components/EczanemPanelBaglantisi";
import { eczanemUyeMenusuOlustur } from "@/app/eczanem/_components/eczanemUyeMenusu";
import OgrenmeZinciri from "@/components/panel/bilgi/OgrenmeZinciri";
import styles from "@/components/panel/bilgi/bilgi.module.css";

export default function EczanemHapbilgiNedirPage() {
  return (
    <EczanemPanelBaglantisi gruplar={eczanemUyeMenusuOlustur()}>
      <div className={styles.zemin}>
        <section className={styles.sayfa} aria-label="Cogniti Nedir?">
          <header>
            <p className={styles.etiket}>Cogniti Nedir?</p>
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
    </EczanemPanelBaglantisi>
  );
}
