"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import CognitiHakkinda from "@/components/panel/bilgi/CognitiHakkinda";
import { useTema } from "@/app/providers/TemaProvider";
import GirisAltBilgileri from "@/app/login/_components/GirisAltBilgileri";
import styles from "@/app/login/login.module.css";
import switchStyles from "@/components/tema/tema-secici.module.css";

/** Herkese açık karşılama; / ve oturumsuz /ana-sayfa aynı içeriği sunar. */
export default function KarsilamaSayfasi() {
  const { tema, temaDegistir } = useTema();
  return (
    <div className={`${styles.page} ${styles.welcomePage}`}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Cogniti">
          <CognitiLogo width={220} height={73} />
        </Link>
        <Link className={styles.action} href="/login">
          <LogIn size={16} aria-hidden="true" />Giriş Yap
        </Link>
      </header>
      <main><CognitiHakkinda /></main>
      <GirisAltBilgileri gorunum={
        <div className={styles.appearance}><span>Görünüm</span>
          <div className={`${switchStyles.secici} ${styles.themeSwitch}`}>
            <button type="button" role="switch" aria-label="Mavi ve yeşil görünüm arasında geçiş yap" aria-checked={tema === "mavi"} className={switchStyles[tema]} onClick={() => temaDegistir(tema === "mavi" ? "yesil" : "mavi")}>
              <span className={switchStyles.anahtar} aria-hidden="true"><span className={switchStyles.topuz} /></span>
            </button>
          </div>
        </div>
      } />
    </div>
  );
}
