// app/eclub/store/_hooks/useEclubStore.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EclubEczaneStoreOzetItem } from "@/lib/eclub/store/eclubStoreTipler";

import type { EclubGezinmeFirmasi } from "@/lib/eclub/firmaGezinme";

interface Args {
  firmaId?: string | null;
  hazir?: boolean;
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

export function useEclubStore({ hata, basari, firmaId = null, hazir = true }: Args) {
  const istekSirasi = useRef(0);
  const [firma, setFirma] = useState<EclubGezinmeFirmasi | null>(null);
  const [yuklenenKapsam, setYuklenenKapsam] = useState<string | null | undefined>(undefined);
  const [cekYayinlar, setCekYayinlar] = useState<EclubEczaneStoreOzetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  const vitrinCek = useCallback(async (sessiz = false) => {
    const istek = ++istekSirasi.current;
    if (sessiz) setYenileniyor(true);
    else setLoading(true);
    try {
      const res = await fetch(`/eclub/store/api${firmaId ? `?firma_id=${encodeURIComponent(firmaId)}` : ""}`);
      const d = await res.json();
      if (istek !== istekSirasi.current) return;
      if (!res.ok) { setCekYayinlar([]); setFirma(null); hata(d.hata ?? "Mağaza yüklenemedi.", d.adim, d.detay); return; }
      setFirma(d.firma ?? null);
      setCekYayinlar(d.cek_yayinlar ?? []);
    } catch (err) {
      if (istek !== istekSirasi.current) return;
      setCekYayinlar([]); setFirma(null);
      hata("Mağaza yüklenirken hata oluştu.", "vitrinCek", err instanceof Error ? err.message : undefined);
    } finally {
      if (istek === istekSirasi.current) {
        setYuklenenKapsam(firmaId);
        setYenileniyor(false); setLoading(false);
      }
    }
  }, [hata, firmaId]);

  useEffect(() => { if (hazir) void vitrinCek(); return () => { istekSirasi.current += 1; }; }, [vitrinCek, hazir]);

  const yenile = useCallback(async () => {
    await vitrinCek(true);
  }, [vitrinCek]);

  const cekTalebiOlustur = useCallback(async (yayin_id: string, siparis_verilsin_mi: boolean) => {
    const res = await fetch("/eclub/api/cek-talepleri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yayin_id, siparis_verilsin_mi, ...(firmaId ? { firma_id: firmaId } : {}) }),
    });
    const d = await res.json();
    if (!res.ok) { hata(d.hata ?? "İşlem gerçekleştirilemedi.", d.adim, d.detay); return false; }
    basari(d.mesaj ?? "Talebiniz alındı.");
    await vitrinCek(true);
    return true;
  }, [hata, basari, vitrinCek, firmaId]);

  return {
    firma, cekYayinlar, loading: loading || yuklenenKapsam !== firmaId, yenileniyor, vitrinCek, yenile, cekTalebiOlustur,
  };
}
