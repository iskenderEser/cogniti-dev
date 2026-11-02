"use client";
import { useEffect, useState } from "react";
/** Açık sayfada yeni haftanın yayını ve erken kaldırma durumunu yeniden okur. */
export function useBannerTakvimYenileme() {
  const [surum, setSurum] = useState(0);
  useEffect(() => {
    const yenile = () => { if (document.visibilityState === "visible") setSurum(n => n + 1); };
    const t = setInterval(yenile, 60000);
    document.addEventListener("visibilitychange", yenile);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", yenile); };
  }, []);
  return surum;
}
