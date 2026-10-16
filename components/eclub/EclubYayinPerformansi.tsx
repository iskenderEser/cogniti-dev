"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { eclubPerformansGrafikSecenegi } from "@/lib/eclub/performansGrafik";
import type { EChartTiklama } from "@/components/grafik/EChart";
import { useEclubFirmaSecimi } from "./EclubFirmaSecimi";
import { ECLUB_PERFORMANS_TURLERI, eclubPerformansDonemi, eclubPerformansDonemSecenekleri, type PerformansTuru, type PerformansVerisi } from "@/lib/eclub/performans";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/providers/AuthProvider";
import { performansOnbelleginiOku, performansVerisiniIste } from "@/lib/eclub/performansOnbellek";
import { EclubPerformansIcerikSkeleton } from "./EclubFirmaPerformansSkeleton";
import styles from "./eclub-performans.module.css";

const EChart = dynamic(() => import("@/components/grafik/EChart"), { loading: () => <div style={{ height: "var(--eclub-cetvel-yuksekligi)" }} role="status" aria-label="Grafik yükleniyor" /> });

const ISARETLER = { video: "▷", podcast: "♫", gorsel: "▧", flip_pdf: "≡" };
function mobilDinle(bildir: () => void) {
  const sorgu = window.matchMedia("(max-width: 699px)");
  sorgu.addEventListener("change", bildir);
  return () => sorgu.removeEventListener("change", bildir);
}
const mobilOku = () => window.matchMedia("(max-width: 699px)").matches;
const sunucuMobilOku = () => false;
const sayi = (n: number) => n.toLocaleString("tr-TR");

export default function EclubYayinPerformansi() {
  const { kullanici } = useAuth();
  const kullaniciId = kullanici?.id;
  const params = useParams<{ firma_id: string }>();
  const { urunId, urunAdi, firmaId: seciliFirmaId } = useEclubFirmaSecimi();
  const firmaId = seciliFirmaId ?? params.firma_id;
  const [seciliDonem, setSeciliDonem] = useState<string | null>(null);
  const donemKodu = seciliDonem ?? eclubPerformansDonemi().kod;
  const donemSecenekleri = eclubPerformansDonemSecenekleri();
  const kapsam = `${kullaniciId}:${firmaId}:${urunId}:${donemKodu}`;
  const mobil = useSyncExternalStore(mobilDinle, mobilOku, sunucuMobilOku);
  const [sonuc, setSonuc] = useState<{ kapsam: string; veri: PerformansVerisi } | null>(() => {
    const veri = kullaniciId && urunId ? performansOnbelleginiOku(kullaniciId, firmaId, urunId, donemKodu) : null;
    return veri ? { kapsam, veri } : null;
  });
  const [hata, setHata] = useState<{ kapsam: string; mesaj: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [secim, setSecim] = useState<{ kapsam: string; tur: PerformansTuru; hafta: number } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const veriCek = useCallback(async (onbellekten = false) => {
    if (!urunId || !kullaniciId) return;
    controllerRef.current?.abort();
    const controller = new AbortController(); controllerRef.current = controller;
    setYukleniyor(true);
    try {
      if (onbellekten) {
        const kayit = performansOnbelleginiOku(kullaniciId, firmaId, urunId, donemKodu);
        if (kayit) setSonuc({ kapsam, veri: kayit });
      }
      const data = await performansVerisiniIste(kullaniciId, firmaId, urunId, donemKodu);
      if (!controller.signal.aborted) { setSonuc({ kapsam, veri: data }); setHata(null); }
    } catch (error) {
      if (!controller.signal.aborted) { setSonuc(null); setHata({ kapsam, mesaj: error instanceof Error ? error.message : "Performans bilgileri yüklenemedi." }); }
    } finally { if (!controller.signal.aborted) setYukleniyor(false); }
  }, [firmaId, urunId, kapsam, kullaniciId, donemKodu]);
  useEffect(() => {
    void import("@/components/grafik/EChart").catch(() => undefined);
    void veriCek(true);
    const guncelle = () => { if (document.visibilityState === "visible") void veriCek(); };
    const timer = window.setInterval(guncelle, 60000);
    window.addEventListener("focus", guncelle);
    return () => { controllerRef.current?.abort(); window.clearInterval(timer); window.removeEventListener("focus", guncelle); };
  }, [veriCek]);
  const veri = sonuc?.kapsam === kapsam ? sonuc.veri : null;
  const tur = secim?.kapsam === kapsam ? secim.tur : "video";
  const hafta = secim?.kapsam === kapsam ? secim.hafta : veri?.donem.aktifHafta ?? 1;
  const turBilgisi = ECLUB_PERFORMANS_TURLERI.find(t => t.tur === tur)!;
  const hucre = veri?.satirlar.find(s => s.tur === tur)?.haftalar.find(h => h.hafta === hafta);
  const sec = (yeniTur: PerformansTuru, yeniHafta: number) => setSecim({ kapsam, tur: yeniTur, hafta: yeniHafta });
  const option = useMemo(() => veri ? eclubPerformansGrafikSecenegi(veri, tur, hafta, mobil) : {}, [veri, tur, hafta, mobil]);
  const grafiktenSec = (p: EChartTiklama) => {
    const t = ECLUB_PERFORMANS_TURLERI.find(t => t.tur === p.seriesId);
    if (t && Array.isArray(p.value) && typeof p.value[0] === "number") sec(t.tur, p.value[0]);
  };
  return <div className={styles.page}>
    <div className={styles.heading}><div><h2>Yayın Tamamlama Performansı</h2><p className={styles.muted}>Eczanenizin yayınlardan kazandığı puanları haftalara göre takip edin.</p></div>
      <div className={styles.period}>
        <select aria-label="Performans dönemi" className={styles.periodSelect} value={donemKodu} onChange={event => setSeciliDonem(event.target.value)}>
          {donemSecenekleri.map(donem => <option key={donem.kod} value={donem.kod}>{donem.ad}</option>)}
        </select>
      </div></div>
    {hata?.kapsam === kapsam && <div role="alert" className={styles.error}>{hata.mesaj} <button type="button" onClick={() => void veriCek()} disabled={yukleniyor}>Tekrar dene</button></div>}
    {!veri ? !hata || hata.kapsam !== kapsam ? <EclubPerformansIcerikSkeleton /> : null : <>
      <section className={styles.stats} aria-label="Dönem performansı">
        <div className={styles.stat}><label>Bu dönemde kazanılan puan</label><strong>{sayi(veri.ozet.puan)}</strong><small>Seçili ürünün dört yayın türü</small></div>
        <div className={styles.stat}><label>Tamamlanan yayın</label><strong>{sayi(veri.ozet.tamamlanan)}</strong><small>Tüm üyelerin tamamlamaları</small></div>
        <div className={styles.stat}><label>Katkı sağlayan üye</label><strong>{sayi(veri.ozet.uye)}</strong><small>Eczanenizin E-Club üyeleri</small></div>
      </section>
      <section className={styles.card} aria-label="Haftalık puan cetveli">
        <div className={styles.chartHead}><strong>Haftalık puan cetveli</strong><div className={styles.legend}><i aria-hidden="true" />Seçilen hafta · Noktaya tıklayın</div></div>
        <div className={styles.chartWrap} role="img" aria-label="Dört yayın türünün sekiz haftalık puan cetveli. Ayrıntıyı görüntülemek için noktaya tıklayın veya aşağıdaki hafta bağlantılarını kullanın.">
          <EChart option={option} height="var(--eclub-cetvel-yuksekligi)" renderer="svg" onClick={grafiktenSec} />
        </div>
        <div className={styles.help}>Puanlar yayınların tamamlandığı haftada gösterilir. Dikey işaret içinde bulunduğunuz haftayı belirtir.</div>
        <div className={styles.weekAccess} aria-label="Seçili yayın türünün hafta seçimi">{veri.donem.haftalar.map(h => <button key={h.hafta} type="button" aria-pressed={hafta === h.hafta}
          aria-label={`${turBilgisi.ad}, ${h.hafta}. hafta, ${veri.satirlar.find(s => s.tur === tur)?.haftalar[h.hafta - 1].puan ?? 0} puan`} onClick={() => sec(tur,h.hafta)}>{h.hafta}. hafta</button>)}</div>
      </section>
      <section className={`${styles.card} ${styles.detail}`} aria-live="polite" aria-label="Üye katkıları">
        <div className={styles.detailHead}><div className={styles.detailTitle}><div className={styles.typeIcon} style={{ color: turBilgisi.renk, background: turBilgisi.zemin }}>{ISARETLER[tur]}</div>
          <div><h3>{turBilgisi.ad} · {hafta}. Hafta</h3><div className={styles.detailMeta}>{urunAdi} · Eczanenizin üye katkıları</div></div></div>
          <div className={styles.detailTotal}>{sayi(hucre?.puan ?? 0)}<small>puan</small></div></div>
        <div className={styles.tableScroll} role="region" aria-label="Üye puan tablosu" tabIndex={0}>
        <div className={styles.table} role="table" aria-label="Üyelerin puan katkısı">
          <div className={styles.tableHead} role="row"><span role="columnheader">E-Club üyesi</span><span className={styles.right} role="columnheader">Tamamlanan Yayın</span><span className={styles.right} role="columnheader">Tamamlama Puanı</span><span className={styles.right} role="columnheader">Doğru Cevap Puanı</span><span className={styles.right} role="columnheader">Kayıp Puan</span><span className={styles.right} role="columnheader">Toplam Puan</span></div>
          <div role="rowgroup">{hucre?.uyeler.length ? hucre.uyeler.map(u => <div className={styles.person} role="row" key={u.kisi_id}>
            <div className={styles.identity} role="cell"><span className={styles.avatar}>{u.ad.slice(0,1)}{u.soyad.slice(0,1)}</span><span className={styles.name}>{u.ad} {u.soyad}</span></div><span className={`${styles.count} ${styles.right}`} role="cell">{sayi(u.tamamlanan)} yayın</span>
            <span className={styles.points} role="cell">{sayi(u.tamamlamaPuani)} puan</span>
            <span className={styles.points} role="cell">{sayi(u.dogruCevapPuani)} puan</span>
            <span className={styles.points} role="cell">{sayi(u.kayipPuani)} puan</span>
            <div className={styles.score} role="cell">{sayi(u.puan)} puan<div className={styles.bar}><i style={{ width: `${hucre.puan ? Math.round(u.puan / hucre.puan * 100) : 0}%`, background: turBilgisi.renk }} /></div></div>
          </div>) : <div className={styles.empty}>{hafta > veri.donem.aktifHafta ? "Bu hafta henüz başlamadı." : "Bu hafta bu yayın türünden puan kazanılmadı."}</div>}</div>
        </div>
        </div>
      </section>
    </>}
  </div>;
}
