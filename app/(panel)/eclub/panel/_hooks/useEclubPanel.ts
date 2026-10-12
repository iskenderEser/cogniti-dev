// app/eclub/panel/_hooks/useEclubPanel.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { panelOnbelleginiOku, panelOnbellegineYaz, panelOnbelleginiSil, panelVerisiniIste, type PanelVerisi } from "@/lib/eclub/anaSayfaPanelOnbellek";
import type { BaremSatiri, SatisSartiTipi } from "@/lib/eclub/store/eclubStoreTipler";

export interface PanelOneri {
  oneri_id: string;
  yayin_id: string;
  talep_no?: number | null;
  firma_id: string | null;
  firma_adi?: string | null;
  urun_id?: string | null;
  urun_adi: string;
  gorunen_urun_id?: string | null;
  teknik_adi: string | null;
  video_url: string | null;
  arac_id: string | null;
  arac_turu: "video" | "podcast" | "gorsel" | "flip_pdf";
  thumbnail_url: string | null;
  icerik_turu: string | null;
  video_puani: number;
  soru_puani: number;
  soru_sayisi: number;
  cek_karsiligi_var_mi?: boolean | null;
  satis_sarti_tipi?: SatisSartiTipi | null;
  gizli_sart_katlama_orani?: number | null;
  barem_tablosu?: BaremSatiri[] | null;
  kazanilan_izleme_puani: number;
  kazanilan_cevaplama_puani: number;
  ileri_sarma_kaybi: number;
  dogru_cevap: number;
  yanlis_cevap: number;
  oneri_baslangic: string;
  oneri_bitis: string;
  oneri_durumu: "aktif" | "suresi_gecmis";
  kalan_gun: number;
  izlendi_mi: boolean;
  izleme_baslangic: string | null;
  izleme_bitis: string | null;
  izleme_tamamlandi_mi: boolean;
  begeni_sayisi: number;
  favori_sayisi: number;
  begeni_mi: boolean;
  favori_mi: boolean;
  created_at: string;
}

export interface PanelKisi {
  ad: string;
  soyad: string;
  rol: string;
}

export interface PanelFirmaOzeti {
  eclub_store_aktif: boolean;
  firma_id: string;
  firma_adi: string;
  kazanilan_puan: number;
  kaybedilen_puan: number;
  harcanabilir_puan: number;
  dogru_cevap: number;
  video_sayisi: number;
}

export interface PanelOzet {
  eclub_store_aktif: boolean;
  toplam_kazanilan_puan: number;
  ileri_sarma_kaybi: number;
  harcanabilir_puan: number;
  dogru_cevap: number;
}

interface UseEclubPanelArgs {
  acilistaArkaPlandaYenile?: boolean;
  firmaRotasi?: string;
  onbellekKullaniciId?: string;
  firmaId?: string | null;
  hazir: boolean;
  hata: (mesaj: string, adim?: string, detay?: string) => void;
}

export function useEclubPanel({ hazir, hata, firmaId = null, firmaRotasi, onbellekKullaniciId, acilistaArkaPlandaYenile = false }: UseEclubPanelArgs) {
  const onbellekAnahtari = onbellekKullaniciId ? `${onbellekKullaniciId}:${firmaRotasi ? `firma:${firmaRotasi}` : firmaId ?? "genel"}` : null;
  const istekSirasi = useRef(0);
  const [yuklenenKapsam, setYuklenenKapsam] = useState<string | null | undefined>(undefined);
  const [kisi, setKisi] = useState<PanelKisi | null>(null);
  const [oneriler, setOneriler] = useState<PanelOneri[]>([]);
  const [firmaOzetleri, setFirmaOzetleri] = useState<PanelFirmaOzeti[]>([]);
  const [ozet, setOzet] = useState<PanelOzet>({ eclub_store_aktif: false, toplam_kazanilan_puan: 0, ileri_sarma_kaybi: 0, harcanabilir_puan: 0, dogru_cevap: 0 });
  const [loading, setLoading] = useState(true);
  const [yuklenenOnbellek, setYuklenenOnbellek] = useState<string | null>(null);

  const veriCek = useCallback(async (sessiz = false, onbellekten = false) => {
    const istek = ++istekSirasi.current;
    if (!sessiz) setLoading(true);
    const uygula = (d: PanelVerisi) => {
        setKisi(d.kisi ?? null);
        setOneriler(d.oneriler ?? []);
        setFirmaOzetleri(d.firma_ozetleri ?? []);
        setOzet({
          eclub_store_aktif: d.ozet?.eclub_store_aktif === true,
          toplam_kazanilan_puan: d.ozet?.toplam_kazanilan_puan ?? 0,
          ileri_sarma_kaybi: d.ozet?.ileri_sarma_kaybi ?? 0,
          harcanabilir_puan: d.ozet?.harcanabilir_puan ?? 0,
          dogru_cevap: d.ozet?.dogru_cevap ?? 0,
        });
    };
    try {
      const adres = `/eclub/panel/api${firmaRotasi ? `?firma=${encodeURIComponent(firmaRotasi)}` : firmaId ? `?firma_id=${encodeURIComponent(firmaId)}` : ""}`;
      const kayit = onbellekten && onbellekAnahtari ? panelOnbelleginiOku(onbellekAnahtari, acilistaArkaPlandaYenile ? 300_000 : undefined) : null;
      if (kayit && acilistaArkaPlandaYenile) {
        uygula(kayit);
        setYuklenenKapsam(firmaId); setYuklenenOnbellek(onbellekAnahtari); setLoading(false);
      }
      const sonuc = kayit && !acilistaArkaPlandaYenile ? { ok: true, veri: kayit }
        : onbellekAnahtari ? await panelVerisiniIste(onbellekAnahtari, adres, !onbellekten)
        : await fetch(adres).then(async (res) => ({ ok: res.ok, veri: await res.json() }));
      const d = sonuc.veri;
      if (istek !== istekSirasi.current) return;
      if (!sonuc.ok) {
        if (onbellekAnahtari) panelOnbelleginiSil(onbellekAnahtari);
        setKisi(null); setOneriler([]); setFirmaOzetleri([]);
        setOzet({ eclub_store_aktif: false, toplam_kazanilan_puan: 0, ileri_sarma_kaybi: 0, harcanabilir_puan: 0, dogru_cevap: 0 });
        hata(d.hata ?? "E-Club Panel Verileri Yüklenemedi.", d.adim, d.detay);
      } else {
        if (onbellekAnahtari && (!kayit || acilistaArkaPlandaYenile)) panelOnbellegineYaz(onbellekAnahtari, d);
        uygula(d);
      }
    } catch (err) {
      if (istek !== istekSirasi.current) return;
      if (onbellekAnahtari) panelOnbelleginiSil(onbellekAnahtari);
      setKisi(null); setOneriler([]); setFirmaOzetleri([]);
        setOzet({ eclub_store_aktif: false, toplam_kazanilan_puan: 0, ileri_sarma_kaybi: 0, harcanabilir_puan: 0, dogru_cevap: 0 });
      hata("Veri yüklenirken hata oluştu.", "useEclubPanel veriCek", err instanceof Error ? err.message : undefined);
    } finally {
      if (istek === istekSirasi.current) { setYuklenenKapsam(firmaId); setYuklenenOnbellek(onbellekAnahtari); setLoading(false); }
    }
  }, [hata, firmaId, firmaRotasi, onbellekAnahtari, acilistaArkaPlandaYenile]);

  useEffect(() => {
    if (hazir) void veriCek(false, true);
    return () => { istekSirasi.current += 1; };
  }, [hazir, veriCek]);

  const etkilesimGuncelle = (tur: "begeni" | "favori", yayinId: string, aktif: boolean) => {
    if (onbellekAnahtari) panelOnbelleginiSil(onbellekAnahtari);
    setOneriler((mevcut) => mevcut.map((oneri) => {
      if (oneri.yayin_id !== yayinId) return oneri;
      return tur === "begeni"
        ? { ...oneri, begeni_mi: aktif, begeni_sayisi: Math.max(0, oneri.begeni_sayisi + (aktif ? 1 : -1)) }
        : { ...oneri, favori_mi: aktif, favori_sayisi: Math.max(0, oneri.favori_sayisi + (aktif ? 1 : -1)) };
    }));
  };

  return { kisi, oneriler, firmaOzetleri, ozet, loading: loading || yuklenenKapsam !== firmaId || yuklenenOnbellek !== onbellekAnahtari, veriCek, etkilesimGuncelle };
}
