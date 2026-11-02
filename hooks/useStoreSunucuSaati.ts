"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Cihaz duvar saati yerine DB saatine monotonic geçen süreyi ekler. */
export function useStoreSunucuSaati() {
  const [simdi, setSimdi] = useState<number | null>(null);
  const anchor = useRef<{ server: number; performance: number } | null>(null);
  const ayarla = useCallback((iso: string) => {
    const server = Date.parse(iso);
    if (!Number.isFinite(server)) return false;
    anchor.current = { server, performance: performance.now() };
    setSimdi(server);
    return true;
  }, []);
  useEffect(() => {
    const ilerlet = () => {
      if (anchor.current) setSimdi(anchor.current.server + Math.max(0, performance.now() - anchor.current.performance));
    };
    const timer = window.setInterval(ilerlet, 1000);
    window.addEventListener("focus", ilerlet);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", ilerlet); };
  }, []);
  return { simdi, ayarla };
}
