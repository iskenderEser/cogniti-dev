"use client";

import { useEffect, useState } from "react";
import { SadeKapsulFiltre, SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import { YAYIN_TURLERI, YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";
import filtreStyles from "@/components/yayin/egitim-yayin-filtreleri.module.css";
import styles from "../token.module.css";

type Urun = { urun_id: string; urun_adi: string };
const aracSecenekleri = YAYIN_TURLERI.map(tur => ({ deger: tur, etiket: YAYIN_TURU_SUNUMU[tur].cogulEtiket }));

export default function TokenUrunFiltresi() {
  const [urunler, setUrunler] = useState<Urun[] | null>(null);
  const [seciliUrun, setSeciliUrun] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [aktifArac, setAktifArac] = useState<OgrenmeAraciTuru>("video");

  useEffect(() => {
    const controller = new AbortController();
    async function yukle() {
      try {
        const res = await fetch("/token/api/urunler", { cache: "no-store", signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.hata || "Takım ürünleri alınamadı.");
        if (!controller.signal.aborted) setUrunler(json.urunler);
      } catch (error) {
        if (!controller.signal.aborted) setHata(error instanceof Error ? error.message : "Takım ürünleri alınamadı.");
      }
    }
    void yukle();
    return () => controller.abort();
  }, []);

  return <div className={styles.urunFiltresi}>
    {hata ? <p role="alert" className={styles.error}>{hata}</p>
      : urunler === null ? <p role="status" className={styles.urunFiltreNotu}>Ürünler yükleniyor…</p>
      : urunler.length === 0 ? <p className={styles.urunFiltreNotu}>Takımınıza bağlı ürün bulunmuyor.</p>
      : <div className={filtreStyles.urunler}>
        <SadeKontrolGrubu tur="sekme" aria-label="Ürün filtresi">
          <SadeKontrolButonu aria-pressed={seciliUrun === null} onClick={() => setSeciliUrun(null)}>Tüm Ürünler</SadeKontrolButonu>
          {urunler.map(urun => <SadeKontrolButonu key={urun.urun_id} aria-pressed={seciliUrun === urun.urun_id}
            onClick={() => setSeciliUrun(urun.urun_id)}>{urun.urun_adi}</SadeKontrolButonu>)}
        </SadeKontrolGrubu>
      </div>}
    <div className={filtreStyles.kontroller}>
      <SadeKapsulFiltre secenekler={aracSecenekleri} deger={aktifArac} onDegistir={setAktifArac} etiket="Öğrenme aracı türü" />
    </div>
  </div>;
}
