"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UrunGosterim } from "../_types";

export async function katalogIstegi(url: string, options?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.hata ?? "İşlem tamamlanamadı. Tekrar deneyin.");
  return data;
}

export function useFirmaStoreKatalogu() {
  const [urunler, setUrunler] = useState<UrunGosterim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yuklemeHatasi, setYuklemeHatasi] = useState("");
  const [islemHatasi, setIslemHatasi] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [islem, setIslem] = useState(false);
  const kilit = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const canli = useRef(true);

  const yenile = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setYukleniyor(true);
    setYuklemeHatasi("");
    try {
      const urun = await katalogIstegi("/admin/store/api/urun", { signal: request.signal });
      if (!Array.isArray(urun.urunler)) throw new Error("Katalog bilgileri alınamadı.");
      if (!request.signal.aborted && canli.current) {
        setUrunler(urun.urunler);
      }
    } catch (error) {
      if (!request.signal.aborted && canli.current) setYuklemeHatasi(error instanceof Error ? error.message : "Katalog yüklenemedi. Bağlantınızı kontrol edin.");
    } finally {
      if (!request.signal.aborted && canli.current) setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    canli.current = true;
    void yenile();
    return () => { canli.current = false; controller.current?.abort(); };
  }, [yenile]);

  async function sil(id: string) {
    if (kilit.current) return false;
    kilit.current = true;
    setIslem(true); setIslemHatasi(""); setMesaj("");
    try {
      await katalogIstegi(`/admin/store/api/urun?urun_id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (canli.current) { setMesaj("Çek silindi."); await yenile(); }
      return true;
    } catch (error) {
      if (canli.current) setIslemHatasi(error instanceof Error ? error.message : "Silme işlemi tamamlanamadı. Tekrar deneyin.");
      return false;
    } finally {
      kilit.current = false;
      if (canli.current) setIslem(false);
    }
  }

  async function kaydedildi(metin: string) { setMesaj(metin); setIslemHatasi(""); await yenile(); }
  return { urunler, yukleniyor, yuklemeHatasi, islemHatasi, mesaj, islem, yenile, sil, kaydedildi, setIslemHatasi };
}
