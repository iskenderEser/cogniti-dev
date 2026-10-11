// app/eclub/store/_hooks/useEclubStore.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EclubEczaneStoreOzetItem } from "@/lib/eclub/store/eclubStoreTipler";

import { cekTakipOnbellegi } from "@/lib/eclub/store/cekTakipOnbellek";
import { vitrinOnbellegi, type VitrinVerisi } from "@/lib/eclub/store/vitrinOnbellek";
import type { EclubGezinmeFirmasi } from "@/lib/eclub/firmaGezinme";

interface Args {
  onbellekKullaniciId?: string;
  firmaId?: string | null;
  hazir?: boolean;
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

export function useEclubStore({ hata, basari, firmaId = null, hazir = true, onbellekKullaniciId }: Args) {
  const onbellekAnahtari = onbellekKullaniciId ? `${onbellekKullaniciId}:${firmaId ?? "genel"}` : null;
  const [yuklenenOnbellek, setYuklenenOnbellek] = useState<string | null>(null);
  const istekSirasi = useRef(0);
  const [firma, setFirma] = useState<EclubGezinmeFirmasi | null>(null);
  const [yuklenenKapsam, setYuklenenKapsam] = useState<string | null | undefined>(undefined);
  const [cekYayinlar, setCekYayinlar] = useState<EclubEczaneStoreOzetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  const vitrinCek = useCallback(async (sessiz = false, onbellekten = false) => {
    const istek = ++istekSirasi.current;
    if (sessiz) setYenileniyor(true);
    else setLoading(true);
    try {
      const kayit = onbellekten && onbellekAnahtari ? vitrinOnbellegi.oku(onbellekAnahtari, 300_000) : null;
      if (kayit) {
        setFirma(kayit.firma ?? null); setCekYayinlar(kayit.cek_yayinlar ?? []);
        setYuklenenKapsam(firmaId); setYuklenenOnbellek(onbellekAnahtari);
        setLoading(false); setYenileniyor(true);
      }
      const yukle = async (): Promise<VitrinVerisi> => {
        const res = await fetch(`/eclub/store/api${firmaId ? `?firma_id=${encodeURIComponent(firmaId)}` : ""}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw Object.assign(new Error(data.hata ?? "Mağaza yüklenemedi."), { api: true, adim: data.adim, detay: data.detay });
        return data;
      };
      const d = onbellekAnahtari ? await vitrinOnbellegi.iste(onbellekAnahtari, yukle, !onbellekten) : await yukle();
      if (istek !== istekSirasi.current) return;
      setFirma(d.firma ?? null);
      setCekYayinlar(d.cek_yayinlar ?? []);
    } catch (err) {
      if (istek !== istekSirasi.current) return;
      setCekYayinlar([]); setFirma(null);
      const apiHatasi = err as { api?: boolean; adim?: string; detay?: string };
      if (apiHatasi?.api && err instanceof Error) hata(err.message, apiHatasi.adim, apiHatasi.detay);
      else hata("Mağaza yüklenirken hata oluştu.", "vitrinCek", err instanceof Error ? err.message : undefined);
    } finally {
      if (istek === istekSirasi.current) {
        setYuklenenOnbellek(onbellekAnahtari);
        setYuklenenKapsam(firmaId);
        setYenileniyor(false); setLoading(false);
      }
    }
  }, [hata, firmaId, onbellekAnahtari]);

  useEffect(() => { if (hazir) void vitrinCek(false, true); return () => { istekSirasi.current += 1; }; }, [vitrinCek, hazir]);

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
    if (onbellekAnahtari) { vitrinOnbellegi.sil(onbellekAnahtari); cekTakipOnbellegi.sil(onbellekAnahtari); }
    await vitrinCek(true);
    return true;
  }, [hata, basari, vitrinCek, firmaId, onbellekAnahtari]);

  return {
    firma, cekYayinlar, loading: loading || yuklenenKapsam !== firmaId || yuklenenOnbellek !== onbellekAnahtari, yenileniyor, vitrinCek, yenile, cekTalebiOlustur,
  };
}
