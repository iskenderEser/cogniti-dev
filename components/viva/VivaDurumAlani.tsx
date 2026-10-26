import type { ReactNode } from "react";
import { Info, LoaderCircle, LockKeyhole, WifiOff } from "lucide-react";
import styles from "./viva-yardimci.module.css";

export default function VivaDurumAlani({ tur = "bilgi", baslik, aciklama, anaBaslik = false, children }: {
  tur?: "yukleniyor" | "kilit" | "hata" | "bilgi";
  baslik: string; aciklama?: ReactNode; anaBaslik?: boolean; children?: ReactNode;
}) {
  const Simge = tur === "yukleniyor" ? LoaderCircle : tur === "kilit" ? LockKeyhole : tur === "hata" ? WifiOff : Info;
  const Baslik = anaBaslik ? "h1" : "h2";
  return <section className={styles.statusPanel} role={tur === "kilit" || tur === "hata" ? "alert" : "status"} aria-busy={tur === "yukleniyor" || undefined}>
    <span className={styles.stateIcon}><Simge aria-hidden="true" className={tur === "yukleniyor" ? styles.spin : undefined} /></span>
    <Baslik>{baslik}</Baslik>{aciklama && <p>{aciklama}</p>}
    {tur === "yukleniyor" && <div className={styles.skeleton} aria-hidden="true"><span /><span /><span /></div>}
    {children && <div className={styles.actions}>{children}</div>}
  </section>;
}
