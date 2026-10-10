import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./sayfa-yenile.module.css";

interface Props {
  baslik: ReactNode;
  aksiyon?: ReactNode;
  ustBilgi?: ReactNode;
  aciklama?: ReactNode;
  altAksiyon?: ReactNode;
  ekKontroller?: ReactNode;
  className?: string;
}

/** Başlık ve Yenile aynı satırda; açıklama ve diğer kontroller ayrı satırlarda. */
export function SayfaYenileBasligi({ baslik, aksiyon, ustBilgi, aciklama, altAksiyon, ekKontroller, className }: Props) {
  return (
    <header className={cn("hb-yenile-baslik", styles.baslik, className)}>
      {ustBilgi && <div className={styles.ustBilgi}>{ustBilgi}</div>}
      <div className={cn("hb-yenile-baslik-metni", styles.metin)}>{baslik}</div>
      <div className={cn("hb-yenile-baslik-aksiyon", styles.aksiyon)}>{aksiyon}</div>
      {aciklama && <div className={altAksiyon ? styles.aciklamaYaninda : styles.aciklama}>{aciklama}</div>}
      {altAksiyon && <div className={styles.altAksiyon}>{altAksiyon}</div>}
      {ekKontroller && <div className={styles.ekKontroller}>{ekKontroller}</div>}
    </header>
  );
}
