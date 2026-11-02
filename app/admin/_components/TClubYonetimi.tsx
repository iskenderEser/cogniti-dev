"use client";

import { GraduationCap } from "lucide-react";
import styles from "../admin.module.css";
import local from "./tclub-yonetimi.module.css";

export default function TClubYonetimi() {
  return <section className={styles.card} aria-labelledby="admin-tclub-erisim-baslik">
    <div className={styles.cardHeader}>
      <h2 id="admin-tclub-erisim-baslik"><GraduationCap />Modül Erişimi</h2>
      <span className={`${styles.status} ${styles.statusActive}`}>Ana modül</span>
    </div>
    <div className={styles.cardBody}>
      <p className={local.description}>Temsilcilerin sürekli öğrenme modülü. Üretim hattı, yayınlar, izleme ve puan akışlarını kapsar.</p>
      <p className={`${styles.notice} ${local.note}`}>T-Club ana modüldür; firma bazında kapatılmaz.</p>
    </div>
  </section>;
}
