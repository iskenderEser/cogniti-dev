"use client";
import FirmaBannerTakvimi from "./FirmaBannerTakvimi";
import type { ComponentProps } from "react";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { Pill } from "@/components/pill";
import { eclubKisiNavOlustur } from "@/components/panel/panelNav.config";
import { eczanemUyeMenusuOlustur } from "@/app/eczanem/_components/eczanemUyeMenusu";
import { eclubFirmaYolu } from "@/lib/eclub/firmaGezinme";
import { logoGorseliniOptimizeEt } from "@/lib/firma/logoOptimizasyonIstemci";
import { type BannerKaynagi, bannerAlaniAdedi, platformBannerFirmasi, ECLUB_BANNER_MAX_BOYUT, ECZANEM_BANNER_ALANLARI, type BannerAlani, type EclubBanner } from "@/lib/eclub/banner";
import { btnBase, RENK_BORDO } from "../../_constants";
import styles from "./eclub-banner-yonetimi.module.css";

const BASLIKLAR = ["Birinci Banner", "İkinci Banner", "Üçüncü Banner", "Dördüncü Banner", "Beşinci Banner"];
const ECLUB_KONUM_MENUSU = eclubKisiNavOlustur([]);
const ECZANEM_UYE_KONUM_MENUSU = eczanemUyeMenusuOlustur();
const KONUM_SAYFALARI = {
  "uye-ana-sayfa": "Ana Sayfa",
  uyeler: "Üyeler",
  "uye-yayinlari": "Üye Yayınları",
  "indirim-onayi": "İndirim Onayı",
} as const;
const eskiBannerButonu = { ...btnBase, height: 32, padding: "0 12px" };
type BannerTaslagi = { dosya: File; url: string };
type BannerIslemi = { sira: number; tur: "yayinla" | "gizle" | "goster" | "kaldir" };
type BannerHatasi = { sira: number | null; metin: string; hata: true };

function EskiEclubBannerYonetimi({ firmaId, firmaAdi, alan = "firma", modern = false, konumGoster = false, kaynak: kaynakProp }: { firmaId: string; firmaAdi: string; alan?: BannerAlani; modern?: boolean; konumGoster?: boolean; kaynak?: BannerKaynagi }) {
  const kaynak = kaynakProp ?? (platformBannerFirmasi(firmaId) ? "cogniti" : "firma");
  const [kaynakHazir,setKaynakHazir] = useState(false);
  const [doluSiralar,setDoluSiralar] = useState<number[]>([]);
  const bannerButonu = modern ? { ...eskiBannerButonu, height: 32, padding: "0 9px", fontSize: "11.5px", borderRadius: 8, fontWeight: 700, borderColor: "var(--tema-kontrol-cizgi)", color: "var(--tema-kontrol-eylem)", background: "var(--tema-yuzey)" } : eskiBannerButonu;
  const vurgu = modern ? "var(--tema-kontrol-eylem)" : RENK_BORDO;
  const [bannerlar, setBannerlar] = useState<EclubBanner[]>([]);
  const [hazir, setHazir] = useState(false);
  const [islem, setIslem] = useState<BannerIslemi | null>(null);
  const islemKilidi = useRef(false);
  const [bildirim, setBildirim] = useState<BannerHatasi | null>(null);
  const [gorunurlukHazir, setGorunurlukHazir] = useState(false);
  const [silOnayi, setSilOnayi] = useState<number | null>(null);
  const [deneme, setDeneme] = useState(0);
  const [taslaklar, setTaslaklar] = useState<Record<number, BannerTaslagi>>({});
  const [acikAlanlar, setAcikAlanlar] = useState<number[]>([]);
  const [acikKonum, setAcikKonum] = useState<number | null>(null);
  const taslakRef = useRef<Record<number, BannerTaslagi>>({});
  const azamiAdet = bannerAlaniAdedi(firmaId, alan);
  const baslik = alan === "uye-ana-sayfa" ? (platformBannerFirmasi(firmaId) ? "Eczanem Ana Sayfa Bannerları" : `${firmaAdi} · Eczanem Bannerları`) : alan === "firma" ? (platformBannerFirmasi(firmaId) ? "E-Club Ana Sayfa Bannerları" : `${firmaAdi} · E-Club · Firma ve Yayınlar Bannerı`) : `${firmaAdi} · Eczanem · ${ECZANEM_BANNER_ALANLARI[alan]}`;
  const gorunenSiralar = [...new Set([...bannerlar.map((b) => b.sira), ...acikAlanlar])].sort((a, b) => a - b);
  const doluAlanlar = new Set([...doluSiralar,...gorunenSiralar]);
  const bosAlanVar = doluAlanlar.size < azamiAdet;
  const konumSayfasi = alan === "firma" || alan === "uye-ana-sayfa"
    ? platformBannerFirmasi(firmaId) ? "Ana Sayfa" : firmaAdi
    : KONUM_SAYFALARI[alan];
  const ekranYolu = alan === "firma"
    ? platformBannerFirmasi(firmaId) ? "E-Club → Ana Sayfa" : `E-Club → Firmalar ve Yayınları → ${firmaAdi}`
    : alan === "uye-ana-sayfa"
      ? platformBannerFirmasi(firmaId) ? "Eczanem Üyesi → Ana Sayfa" : `Eczanem Üyesi → Firmalar ve Yayınları → ${firmaAdi}`
      : `Eczacı → Eczanem → ${konumSayfasi}`;
  const konumMenusu = alan === "uye-ana-sayfa" ? ECZANEM_UYE_KONUM_MENUSU : ECLUB_KONUM_MENUSU;
  const konumYolu = alan === "firma"
    ? platformBannerFirmasi(firmaId) ? "/eclub/ana-sayfa" : eclubFirmaYolu(firmaAdi, "yayinlar")
    : alan === "uye-ana-sayfa" ? "/eczanem" : `/eczanem/eczane/${alan}`;
  const anaSayfaKonumu = platformBannerFirmasi(firmaId) && (alan === "firma" || alan === "uye-ana-sayfa");

  function hataBildir(sira: number | null, metin: string) {
    setBildirim({ sira, metin, hata: true });
  }

  function islemBaslat(sira: number, tur: BannerIslemi["tur"]) {
    if (islemKilidi.current) return false;
    islemKilidi.current = true;
    setIslem({ sira, tur });
    setBildirim(null);
    setSilOnayi(null);
    return true;
  }

  function islemBitir() {
    islemKilidi.current = false;
    setIslem(null);
  }

  function yeniAlanAc() {
    if (!hazir || !kaynakHazir || islem !== null) return;
    setAcikAlanlar((onceki) => {
      const bosSira = Array.from({ length: azamiAdet }, (_, i) => i + 1)
        .find((sira) => !onceki.includes(sira) && !doluSiralar.includes(sira));
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
    setSilOnayi(null);
    setBildirim((onceki) => onceki?.sira === sira ? null : onceki);
  }

  function gorselSec(sira: number, dosya: File) {
    if (islemKilidi.current) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(dosya.type)) {
      hataBildir(sira, "PNG, JPEG veya WebP görsel seçin.");
      return;
    }
    if (!dosya.size || dosya.size > ECLUB_BANNER_MAX_BOYUT) {
      hataBildir(sira, "En fazla 5 MB boyutunda, boş olmayan bir görsel seçin.");
      return;
    }
    const onceki = taslakRef.current[sira];
    if (onceki) URL.revokeObjectURL(onceki.url);
    const yeni = { ...taslakRef.current, [sira]: { dosya, url: URL.createObjectURL(dosya) } };
    taslakRef.current = yeni;
    setTaslaklar(yeni);
    setBildirim(null);
    setSilOnayi(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/admin/api/eclub/bannerlar?firma_id=${encodeURIComponent(firmaId)}&alan=${alan}&kaynak=${kaynak}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const veri = await res.json();
        if (!res.ok) throw new Error(veri.hata ?? "Bannerlar yüklenemedi.");
        if (controller.signal.aborted) return;
        setBannerlar(veri.bannerlar);
        setDoluSiralar(veri.doluSiralar ?? veri.bannerlar.map((b: EclubBanner)=>b.sira));
        setKaynakHazir(veri.kaynakHazir === true);
        setGorunurlukHazir(veri.gorunurlukHazir === true);
        setHazir(true);
        setBildirim(null);
      }).catch((err) => {
        if (!controller.signal.aborted) setBildirim({ sira: null, metin: err.message, hata: true });
      });
    return () => controller.abort();
  }, [firmaId, alan, kaynak, deneme]);

  async function yayinla(sira: number) {
    const taslak = taslakRef.current[sira];
    if (!taslak || !hazir || !kaynakHazir || !islemBaslat(sira, "yayinla")) return;
    try {
      const optimize = await logoGorseliniOptimizeEt(taslak.dosya, { maxWidth: 1930, maxHeight: 300, kalite: 0.9 });
      const form = new FormData();
      form.append("firma_id", firmaId);
      form.append("alan", alan);
      form.append("kaynak",kaynak);
      form.append("sira", String(sira));
      form.append("dosya", optimize);
      const res = await fetch("/admin/api/eclub/bannerlar", { method: "POST", body: form });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.hata ?? "Banner yüklenemedi.");
      setBannerlar((onceki) => [...onceki.filter((b) => b.sira !== sira), veri.banner].sort((a, b) => a.sira - b.sira));
      setDoluSiralar(onceki=>[...new Set([...onceki,sira])]);
      taslagiSil(sira);
    } catch (err) { hataBildir(sira, err instanceof Error ? err.message : "Banner yüklenemedi."); }
    finally { islemBitir(); }
  }

  async function gorunurlukDegistir(sira: number, gorunur: boolean) {
    if (!kaynakHazir || !gorunurlukHazir || !islemBaslat(sira, gorunur ? "goster" : "gizle")) return;
    try {
      const res = await fetch("/admin/api/eclub/bannerlar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firma_id: firmaId, alan, kaynak, sira, gorunur }),
      });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.hata ?? "Banner görünürlüğü değiştirilemedi.");
      setBannerlar((onceki) => onceki.map((banner) => banner.sira === sira ? { ...banner, gorunur: veri.banner.gorunur } : banner));
    } catch (err) { hataBildir(sira, err instanceof Error ? err.message : "Banner görünürlüğü değiştirilemedi."); }
    finally { islemBitir(); }
  }

  async function kaldir(sira: number) {
    if (!kaynakHazir || !gorunurlukHazir || silOnayi !== sira || !islemBaslat(sira, "kaldir")) return;
    try {
      const res = await fetch(`/admin/api/eclub/bannerlar?firma_id=${encodeURIComponent(firmaId)}&alan=${alan}&kaynak=${kaynak}&sira=${sira}`, { method: "DELETE" });
      const veri = await res.json();
      if (!res.ok) {
        if (veri.banner?.gorunur === false) setBannerlar((onceki) => onceki.map((banner) => banner.sira === sira ? { ...banner, gorunur: false } : banner));
        throw new Error(veri.hata ?? "Banner kaldırılamadı.");
      }
      setBannerlar((onceki) => onceki.filter((b) => b.sira !== sira));
      setDoluSiralar(onceki=>onceki.filter(n=>n!==sira));
      setAcikKonum((onceki) => onceki === sira ? null : onceki);
    } catch (err) { hataBildir(sira, err instanceof Error ? err.message : "Banner kaldırılamadı."); }
    finally { islemBitir(); }
  }

  return <section className={`${styles.panel} ${modern ? styles.modern : ""}`} aria-label={baslik}>
    <h2>{kaynak === "cogniti" && !platformBannerFirmasi(firmaId) ? `Cogniti · ${baslik}` : baslik}</h2>
    <p>{alan === "uye-ana-sayfa" ? "Görseli seçip önizlemeyi kontrol edin. Eczanem bannerını kaydetmek için Yayınla butonunu kullanın." : alan !== "firma" ? "Görseli seçip önizlemeyi kontrol edin. Bu sayfanın bannerını kaydetmek için Yayınla butonunu kullanın." : <>Görseli seçip önizlemeyi kontrol edin. Yalnız Yayınla butonuna bastığınızda {firmaAdi} firma sayfasında{platformBannerFirmasi(firmaId) ? " ve E-Club ana sayfasında" : ""} görünür.</>}</p>
    {hazir && !kaynakHazir && <p role="alert">Banner yönetimi için cogniti_banner_yonetimi.sql kurulumu tamamlanmalı.</p>}
    {hazir && !gorunurlukHazir && <div className={`${styles.bildirim} ${styles.bildirimHata}`} role="alert">Gizle/Göster ve Kaldır kullanılamıyor. Banner görünürlük kurulumu tamamlanmalı.</div>}
    {bildirim?.hata && (bildirim.sira === null || !gorunenSiralar.includes(bildirim.sira)) && <div role="alert" className={`${styles.bildirim} ${styles.bildirimHata}`}>{bildirim.metin}</div>}
    <div className={styles.kartlar}>
      {gorunenSiralar.map((sira) => {
        const baslik = BASLIKLAR[sira - 1];
        const banner = bannerlar.find((b) => b.sira === sira);
        const taslak = taslaklar[sira];
        const onizlemeUrl = taslak?.url ?? banner?.url;
        const id = `eclub-banner-${firmaId}-${alan}-${sira}`;
        return <article key={sira} className={styles.kart} aria-busy={islem?.sira === sira}>
          <div className={styles.kartBasligi}>
            <h3>{baslik}</h3>
            {(taslak || banner) && <Pill className="shrink-0" renk={!taslak && banner?.gorunur !== false
              ? { bg: "var(--tema-yerel-yonetim-islevsel-zemin-05)", metin: "var(--tema-yerel-yonetim-islevsel-metin-10)", kenar: "var(--tema-yerel-yonetim-islevsel-metin-10)" }
              : { bg: "var(--tema-zemin)", metin: "var(--tema-kontrol-ikincil-metin)", kenar: "var(--tema-kontrol-cizgi)" }}>
              {taslak ? "Önizleme" : banner?.gorunur === false ? "Gizli" : "Yayında"}
            </Pill>}
          </div>
          <div className={styles.onizleme}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Optimize edilmiş Storage görseli, özgün oranıyla önizlenir. */}
            {onizlemeUrl ? <img src={onizlemeUrl} alt={`${firmaAdi} ${baslik}${taslak ? " önizlemesi" : ""}`} /> : <span>Görsel seçilmedi</span>}
          </div>
          <div className={styles.aksiyonlar}>
            <div className={styles.aksiyonGrubu}>
              <label htmlFor={id} style={{ ...bannerButonu, color: vurgu }} aria-disabled={!hazir || !kaynakHazir || islem !== null} className={!hazir || !kaynakHazir || islem !== null ? styles.kapali : ""}>
                {banner || taslak ? "Görseli Değiştir" : "Görsel Seç"}
                <input id={id} type="file" accept="image/png,image/jpeg,image/webp" disabled={!hazir || !kaynakHazir || islem !== null}
                  onChange={(event) => { const dosya = event.target.files?.[0]; if (dosya) gorselSec(sira, dosya); event.target.value = ""; }} />
              </label>
              {konumGoster && <button type="button" style={bannerButonu} aria-expanded={acikKonum === sira} aria-controls={`${id}-konum`}
                onClick={() => setAcikKonum((onceki) => onceki === sira ? null : sira)}>{acikKonum === sira ? "Kapat" : "Yerini Gör"}</button>}
            </div>
            <div className={`${styles.aksiyonGrubu} ${styles.sagAksiyonlar}`}>
              {taslak && <button type="button" style={{ ...bannerButonu, background: vurgu, color: "white" }}
                disabled={!hazir || !kaynakHazir || islem !== null} onClick={() => void yayinla(sira)}>{islem?.sira === sira && islem.tur === "yayinla" ? "Yayınlanıyor…" : "Yayınla"}</button>}
              {(taslak || !banner) && <button type="button" style={bannerButonu} disabled={islem !== null} onClick={() => taslagiSil(sira)}>Vazgeç</button>}
              {banner && !taslak && <button type="button" style={bannerButonu} disabled={!kaynakHazir || !gorunurlukHazir || islem !== null}
                onClick={() => void gorunurlukDegistir(sira, banner.gorunur === false)}>{islem?.sira === sira && (islem.tur === "gizle" || islem.tur === "goster") ? islem.tur === "gizle" ? "Gizleniyor…" : "Gösteriliyor…" : banner.gorunur === false ? "Göster" : "Gizle"}</button>}
              {banner && !taslak && <button type="button" style={bannerButonu} disabled={!kaynakHazir || !gorunurlukHazir || islem !== null || silOnayi === sira} onClick={() => setSilOnayi(sira)}>{islem?.sira === sira && islem.tur === "kaldir" ? "Kaldırılıyor…" : "Kaldır"}</button>}
            </div>
          </div>
          {silOnayi === sira && <div className={styles.silOnayi} role="group" aria-label={`${baslik} kaldırma onayı`}>
            <p>Bu görsel kalıcı olarak kaldırılacak. Onaylıyor musunuz?</p>
            <div className={styles.onayButonlari}>
              <button type="button" style={{ ...bannerButonu, color: "var(--tema-yerel-yonetim-islevsel-metin-15)" }} disabled={islem !== null} onClick={() => void kaldir(sira)}>Kaldır</button>
              <button type="button" style={bannerButonu} disabled={islem !== null} onClick={() => setSilOnayi(null)}>Vazgeç</button>
            </div>
          </div>}
          {bildirim?.hata && bildirim.sira === sira && <div role="alert" className={`${styles.bildirim} ${styles.bildirimHata}`}>{bildirim.metin}</div>}
          {konumGoster && acikKonum === sira && <div id={`${id}-konum`} className={styles.konumKilavuzu} role="region" aria-label={`${baslik} konumu`}>
            <div className={styles.konumBilgisi}>
              <h3>Göründüğü Ekran</h3>
              <p className={styles.ekranYolu}>{ekranYolu}</p>
              <p><strong>Konumu:</strong> Sayfa başlığının ve açıklamasının altında, özet kartlarının üstünde.</p>
              {platformBannerFirmasi(firmaId) && (alan === "firma" || alan === "uye-ana-sayfa") && <p>Aynı banner {firmaAdi} firma ekranında da görünür.</p>}
            </div>
            <figure className={styles.konumSemasi}>
              <div className={styles.semaPencere} aria-hidden="true">
                <div className={styles.semaUstBar}><strong>Cogniti</strong><span className={styles.semaAnaSayfa} data-active={anaSayfaKonumu}>Ana Sayfa</span></div>
                <div className={styles.semaGovde}>
                  <div className={styles.semaSidebar}>
                    {konumMenusu.map((grup) => <div key={grup.baslik} className={styles.semaMenuGrubu}>
                      <h4>{grup.baslik}<span>⌄</span></h4>
                      {grup.oglar.map((oge) => {
                        const yol = typeof oge.path === "string" ? oge.path : "";
                        const secili = Boolean(yol && (konumYolu === yol || (!oge.tamEslesme && konumYolu.startsWith(`${yol}/`))))
                          || oge.aktifYollar?.some((aktifYol) => konumYolu === aktifYol || konumYolu.startsWith(`${aktifYol}/`)) === true;
                        return <span key={oge.anahtar ?? oge.etiket} className={styles.semaMenuOgesi} data-active={secili}>{oge.etiket}</span>;
                      })}
                    </div>)}
                  </div>
                  <div className={styles.semaIcerik}>
                    <strong>{konumSayfasi}</strong>
                    <span className={styles.semaAciklama} />
                    <div className={styles.semaBanner}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- Seçilen banner, konum şemasında gösterilir. */}
                      {onizlemeUrl && <img src={onizlemeUrl} alt="" />}
                      <span>{baslik}</span>
                    </div>
                    <div className={styles.semaOzetler}>{Array.from({ length: alan === "uyeler" ? 4 : 3 }, (_, i) => <span key={i} />)}</div>
                    <span className={styles.semaAciklama} />
                  </div>
                </div>
              </div>
              <figcaption>Sayfadaki konumun şematik gösterimi</figcaption>
            </figure>
          </div>}
        </article>;
      })}
    </div>
    <div className={styles.ekleme}>
      <button type="button" style={{ ...bannerButonu, color: vurgu }} disabled={!hazir || !kaynakHazir || islem !== null || !bosAlanVar} onClick={yeniAlanAc}>Banner Ekle</button>
      <span>{doluSiralar.length} / {azamiAdet} alan dolu · Firma ve Cogniti ortak limiti{!bosAlanVar ? " · Yeni banner eklenemez" : ""}</span>
    </div>
    <p className={styles.not}>Önerilen görsel ölçüsü: En 1930 px × Boy 300 px</p>
    <p className={styles.not}>PNG, JPEG veya WebP · Görseller yüklenirken küçültülür · En fazla 5 MB</p>
    {!hazir && bildirim?.hata && <button type="button" style={bannerButonu} onClick={() => setDeneme((n) => n + 1)}>Tekrar Dene</button>}
  </section>;
}

const EskiBanner = saltOkunurAlan(EskiEclubBannerYonetimi);
export default function EclubBannerYonetimi(props: ComponentProps<typeof EskiEclubBannerYonetimi>) {
  const kaynak = props.kaynak ?? (platformBannerFirmasi(props.firmaId) ? "cogniti" : "firma");
  return kaynak === "firma" && !platformBannerFirmasi(props.firmaId)
    ? <FirmaBannerTakvimi key={`${props.firmaId}/${props.alan ?? "firma"}`} firmaId={props.firmaId} firmaAdi={props.firmaAdi} alan={props.alan ?? "firma"} />
    : <EskiBanner {...props} />;
}
