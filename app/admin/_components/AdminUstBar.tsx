"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import styles from "../admin.module.css";

interface Props {
  firmaAdmin?: boolean;
  kullaniciAd: string;
  onAnaSayfa: () => void;
  onCikis: () => void;
  menuAcik: boolean;
  onMenu: () => void;
}
export default function AdminUstBar(p:Props) {
  return <header className={styles.navbar}>
    <div className={styles.actions}>
      <button type="button" className={styles.brand} onClick={p.onAnaSayfa} aria-label="Cogniti yönetimine dön"><CognitiLogo className={styles.logo} /><span className={styles.brandText}>Yönetim</span></button>
    </div>
    <div className={styles.navbarActions}>
      {!p.firmaAdmin && <Link href="/viva" className={styles.button}>Viva</Link>}

      <div className={styles.profile}><div><span className={styles.profileName}>{p.kullaniciAd}</span><button type="button" className={styles.logout} onClick={p.onCikis}><LogOut size={11} style={{ display:"inline", marginRight:4 }} />Çıkış</button></div><span className={styles.avatar} aria-hidden="true">{p.kullaniciAd.split(/\s+/).map(n=>n[0]).slice(0,2).join("")}</span></div>
      <button type="button" className={styles.mobileNav} aria-label="Menü" aria-expanded={p.menuAcik} aria-controls="admin-gezinme" onClick={p.onMenu}>
        <span /><span /><span />
      </button>
    </div>
  </header>;
}
