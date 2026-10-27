"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import CognitiHakkinda from "@/components/panel/bilgi/CognitiHakkinda";
import { useTema } from "@/app/providers/TemaProvider";
import GirisAltBilgileri from "@/app/login/_components/GirisAltBilgileri";
import styles from "@/app/login/login.module.css";
import FiyatlarIcerigi from "./FiyatlarIcerigi";
import switchStyles from "@/components/tema/tema-secici.module.css";

/** Herkese açık karşılama yalnız /welcome adresinde sunulur. */
export default function KarsilamaSayfasi({ fiyatlar = false }: { fiyatlar?: boolean }) {
  const { tema, temaDegistir } = useTema();
  return (
    <div className={`${styles.page} ${styles.welcomePage}`}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/welcome" aria-label="Cogniti">
          <CognitiLogo width={220} height={73} />
        </Link>
        <nav className={styles.welcomeActions} aria-label="Karşılama gezinmesi">
          <Link className={styles.pricingNav} href="/welcome/fiyatlar" aria-current={fiyatlar ? "page" : undefined}>Paketler ve Fiyatları</Link>
          <Link className={styles.action} href="/login">
            <LogIn size={16} aria-hidden="true" />Giriş Yap
          </Link>
        </nav>
      </header>
      <main>{fiyatlar ? <FiyatlarIcerigi /> : <CognitiHakkinda />}</main>
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
