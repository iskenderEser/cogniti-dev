"use client";

import type { RefObject } from "react";
import styles from "./AgoraVitrini.module.css";

/** Cogniti raf standardı: kenarlarda, geçişli zemin üzerinde görünen oklar. */
export function AgoraRafOklari({ raf, baslik }: {
  raf: RefObject<HTMLDivElement | null>;
  baslik: string;
}) {
  return <>{([-1, 1] as const).map(yon => (
    <button key={yon} type="button"
      aria-label={`${baslik} rafını ${yon === -1 ? "sola" : "sağa"} kaydır`}
      className={`${styles.rafOku} ${yon === -1 ? styles.solOk : styles.sagOk}`}
      onClick={() => raf.current?.scrollBy({ left: yon * raf.current.clientWidth * 0.85, behavior: "smooth" })}>
      <svg aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={yon === -1 ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  ))}</>;
}
