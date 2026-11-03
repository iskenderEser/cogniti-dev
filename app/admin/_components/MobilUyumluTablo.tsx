"use client";

import { Children, Fragment, cloneElement, isValidElement, type ReactNode, type ReactElement, type ComponentProps } from "react";
import styles from "../admin.module.css";

type Oge = ReactElement<{ children?: ReactNode; colSpan?: number; "data-label"?: string; role?: string }>;

/** Aynı hücreleri ve işlem kontrollerini mobilde etiketli kartlar olarak gösterir. */
export default function MobilUyumluTablo({ basliklar, filtreli = false, children, className = "", ...props }: ComponentProps<"table"> & { basliklar: readonly string[]; filtreli?: boolean }) {
  function satirlar(node: ReactNode): ReactNode {
    return Children.map(node, child => {
      if (!isValidElement(child)) return child;
      const oge = child as Oge;
      if (oge.type === Fragment) return cloneElement(oge, {}, satirlar(oge.props.children));
      if (oge.type !== "tr") return oge;
      let sutun = 0;
      const hucreler = Children.map(oge.props.children, cell => {
        if (!isValidElement(cell)) return cell;
        const hucre = cell as Oge;
        if (hucre.type !== "td" && hucre.type !== "th") return hucre;
        const span = hucre.props.colSpan ?? 1;
        const etiket = span === 1 && hucre.type === "td" ? basliklar[sutun] : undefined;
        sutun += span;
        return cloneElement(hucre, { "data-label": etiket, role: hucre.type === "th" ? "rowheader" : "cell" }, hucre.type === "td" && span === 1 ? <div className={styles.mobileCellValue}>{hucre.props.children}</div> : hucre.props.children);
      });
      return cloneElement(oge, { role: "row" }, hucreler);
    });
  }
  return <table {...props} role="table" className={`${className} ${styles.mobileTable}`} data-filtreli={filtreli || undefined}>
    {Children.map(children, child => {
      if (!isValidElement(child)) return child;
      const bolum = child as Oge;
      if (bolum.type === "tbody" || bolum.type === "tfoot") return cloneElement(bolum, { role: "rowgroup" }, satirlar(bolum.props.children));
      return bolum;
    })}
  </table>;
}
