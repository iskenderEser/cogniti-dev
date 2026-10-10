"use client";

import { useEffect, useRef, useState } from "react";
import { logoGorseliniOptimizeEt } from "@/lib/firma/logoOptimizasyonIstemci";
import { bannerAdedi, hapbilgiBannerFirmasi, type EclubBanner } from "@/lib/eclub/banner";
import { btnBase, RENK_BORDO } from "../../_constants";
import styles from "./eclub-banner-yonetimi.module.css";

const BASLIKLAR = ["Birinci Banner", "İkinci Banner", "Üçüncü Banner", "Dördüncü Banner", "Beşinci Banner"];
const bannerButonu = { ...btnBase, height: 32, padding: "0 12px" };
type BannerTaslagi = { dosya: File; url: string };

export default function EclubBannerYonetimi({ firmaId, firmaAdi }: { firmaId: string; firmaAdi: string }) {
  const [bannerlar, setBannerlar] = useState<EclubBanner[]>([]);
  const [hazir, setHazir] = useState(false);
  const [islem, setIslem] = useState<number | null>(null);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState(false);
  const [deneme, setDeneme] = useState(0);
  const [taslaklar, setTaslaklar] = useState<Record<number, BannerTaslagi>>({});
  const [acikAlanlar, setAcikAlanlar] = useState<number[]>([]);
  const taslakRef = useRef<Record<number, BannerTaslagi>>({});
  const azamiAdet = bannerAdedi(firmaAdi);
  const gorunenSiralar = [...new Set([...bannerlar.map((b) => b.sira), ...acikAlanlar])].sort((a, b) => a - b);
  const bosAlanVar = gorunenSiralar.length < azamiAdet;

  function yeniAlanAc() {
    if (!hazir || islem !== null) return;
    setAcikAlanlar((onceki) => {
      const bosSira = Array.from({ length: azamiAdet }, (_, i) => i + 1)
        .find((sira) => !onceki.includes(sira) && !bannerlar.some((b) => b.sira === sira));
      return bosSira ? [...onceki, bosSira] : onceki;
    });
  }

  useEffect(() => () => {
    Object.values(taslakRef.current).forEach((taslak) => URL.revokeObjectURL(taslak.url));
  }, []);

  function taslagiSil(sira: number) {
    const onceki = taslakRef.current[sira];
    if (onceki) URL.revokeObjectURL(onceki.url);
    const yeni = { ...taslakRef.current };
    delete yeni[sira];
    taslakRef.current = yeni;
    setTaslaklar(yeni);
    setAcikAlanlar((oncekiAlanlar) => oncekiAlanlar.filter((alan) => alan !== sira));
  }

  function gorselSec(sira: number, dosya: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(dosya.type)) {
      setHata(true);
      setMesaj("PNG, JPEG veya WebP görsel seçin.");
      return;
    }
    const onceki = taslakRef.current[sira];
    if (onceki) URL.revokeObjectURL(onceki.url);
    const yeni = { ...taslakRef.current, [sira]: { dosya, url: URL.createObjectURL(dosya) } };
    taslakRef.current = yeni;
    setTaslaklar(yeni);
    setMesaj("");
    setHata(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/admin/api/eclub/bannerlar?firma_id=${encodeURIComponent(firmaId)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const veri = await res.json();
        if (!res.ok) throw new Error(veri.hata ?? "Bannerlar yüklenemedi.");
        if (controller.signal.aborted) return;
        setBannerlar(veri.bannerlar);
        setHazir(true);
        setMesaj("");
        setHata(false);
      }).catch((err) => {
        if (!controller.signal.aborted) { setMesaj(err.message); setHata(true); }
      });
    return () => controller.abort();
  }, [firmaId, deneme]);

  async function yayinla(sira: number) {
    const taslak = taslakRef.current[sira];
    if (!taslak || !hazir || islem !== null) return;
    setIslem(sira);
    setMesaj("");
    try {
      const optimize = await logoGorseliniOptimizeEt(taslak.dosya, { maxWidth: 1932, maxHeight: 480, kalite: 0.9 });
      const form = new FormData();
      form.append("firma_id", firmaId);
      form.append("sira", String(sira));
      form.append("dosya", optimize);
      const res = await fetch("/admin/api/eclub/bannerlar", { method: "POST", body: form });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.hata ?? "Banner yüklenemedi.");
      setBannerlar((onceki) => [...onceki.filter((b) => b.sira !== sira), veri.banner].sort((a, b) => a.sira - b.sira));
      taslagiSil(sira);
      setHata(false);
      setMesaj(`${BASLIKLAR[sira - 1]} yayınlandı.`);
    } catch (err) { setHata(true); setMesaj(err instanceof Error ? err.message : "Banner yüklenemedi."); }
    finally { setIslem(null); }
  }

  async function kaldir(sira: number) {
    setIslem(sira);
    setMesaj("");
    try {
      const res = await fetch(`/admin/api/eclub/bannerlar?firma_id=${encodeURIComponent(firmaId)}&sira=${sira}`, { method: "DELETE" });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.hata ?? "Banner kaldırılamadı.");
      setBannerlar((onceki) => onceki.filter((b) => b.sira !== sira));
      setHata(false);
      setMesaj(`${BASLIKLAR[sira - 1]} kaldırıldı.`);
    } catch (err) { setHata(true); setMesaj(err instanceof Error ? err.message : "Banner kaldırılamadı."); }
    finally { setIslem(null); }
  }

  return <section className={styles.panel} aria-label={`${firmaAdi} E-Club banner yönetimi`}>
    <h2>{firmaAdi} · E-Club Bannerları</h2>
    <p>Görseli seçip önizlemeyi kontrol edin. Yalnız Yayınla butonuna bastığınızda {firmaAdi} firma sayfasında{hapbilgiBannerFirmasi(firmaAdi) ? " ve E-Club ana sayfasında" : ""} görünür.</p>
    <div className={styles.kartlar}>
      {gorunenSiralar.map((sira) => {
        const baslik = BASLIKLAR[sira - 1];
        const banner = bannerlar.find((b) => b.sira === sira);
        const taslak = taslaklar[sira];
        const onizlemeUrl = taslak?.url ?? banner?.url;
        const id = `eclub-banner-${firmaId}-${sira}`;
        return <article key={sira} className={styles.kart}>
          <h3>{baslik}</h3>
          <div className={styles.onizleme}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Optimize edilmiş Storage görseli, özgün oranıyla önizlenir. */}
            {onizlemeUrl ? <img src={onizlemeUrl} alt={`${firmaAdi} ${baslik}${taslak ? " önizlemesi" : ""}`} /> : <span>Görsel seçilmedi</span>}
          </div>
          {(taslak || banner) && <p className={styles.durum}>{taslak ? "Önizleme · Henüz yayınlanmadı" : "Yayında"}</p>}
          <div className={styles.aksiyonlar}>
            <label htmlFor={id} style={{ ...bannerButonu, color: RENK_BORDO }} className={!hazir || islem !== null ? styles.kapali : ""}>
              {banner || taslak ? "Görseli Değiştir" : "Görsel Seç"}
              <input id={id} type="file" accept="image/png,image/jpeg,image/webp" disabled={!hazir || islem !== null}
                onChange={(event) => { const dosya = event.target.files?.[0]; if (dosya) gorselSec(sira, dosya); event.target.value = ""; }} />
            </label>
            <button type="button" style={{ ...bannerButonu, background: RENK_BORDO, color: "white" }}
              disabled={!hazir || !taslak || islem !== null} onClick={() => void yayinla(sira)}>{islem === sira ? "İşleniyor…" : "Yayınla"}</button>
            {(taslak || !banner) && <button type="button" style={bannerButonu} disabled={islem !== null} onClick={() => taslagiSil(sira)}>Vazgeç</button>}
            {banner && !taslak && <button type="button" style={bannerButonu} disabled={islem !== null} onClick={() => void kaldir(sira)}>Kaldır</button>}
          </div>
        </article>;
      })}
    </div>
    <div className={styles.ekleme}>
      <button type="button" style={{ ...bannerButonu, color: RENK_BORDO }} disabled={!hazir || islem !== null || !bosAlanVar} onClick={yeniAlanAc}>Banner Ekle</button>
      <span>En fazla {azamiAdet} banner</span>
    </div>
    <p className={styles.not}>Önerilen görsel ölçüsü: En 1932 px × Boy 480 px</p>
    <p className={styles.not}>PNG, JPEG veya WebP · Görseller yüklenirken küçültülür · En fazla 5 MB</p>
    {mesaj && <p role={hata ? "alert" : "status"} className={hata ? styles.hata : styles.basari}>{mesaj}</p>}
    {!hazir && hata && <button type="button" style={bannerButonu} onClick={() => setDeneme((n) => n + 1)}>Tekrar Dene</button>}
  </section>;
}
