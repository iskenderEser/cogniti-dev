"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import type { EgitimTuruEtkisiSatiri } from "@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek";
import { formatPuan } from "@/lib/utils/raporUtils";
import styles from "./YayinKonuPerformansi.module.css";

export default function YayinKonuPerformansi({ detay, onKapat }: {
  detay: EgitimTuruEtkisiSatiri;
  onKapat?: () => void;
}) {
  const id = useId();
  const [seciliUrunId, setSeciliUrunId] = useState<string | null>(null);
  const urunler = (detay.urun_dagilimi ?? []).filter((urun) => urun.urun_id != null);
  const seciliIndeks = Math.max(0, urunler.findIndex((urun) => urun.urun_id === seciliUrunId));
  const urun = urunler[seciliIndeks];
  const enYuksekNet = Math.max(0, ...urunler.map((u) => u.net_puan));
  const cubukYuzdesi = urun && enYuksekNet > 0 ? Math.max(0, urun.net_puan) / enYuksekNet * 100 : 0;
  const panelId = id + "-urun-panel";

  function klavyeIleSec(event: KeyboardEvent<HTMLButtonElement>, indeks: number) {
    let sonraki = indeks;
    if (event.key === "ArrowRight") sonraki = (indeks + 1) % urunler.length;
    else if (event.key === "ArrowLeft") sonraki = (indeks + urunler.length - 1) % urunler.length;
    else if (event.key === "Home") sonraki = 0;
    else if (event.key === "End") sonraki = urunler.length - 1;
    else return;
    event.preventDefault();
    setSeciliUrunId(urunler[sonraki].urun_id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[sonraki]?.focus();
  }

  return (
    <section className={styles.card} aria-labelledby={id + "-baslik"}>
      <header className={styles.header}>
        <div>
          <h3 id={id + "-baslik"}><span className={styles.dot} aria-hidden="true" />{detay.egitim_adi} Yayın Performansı</h3>
          <p className={styles.subtitle}>Yayınlarınızdan kazanılan net puanları görebilirsiniz.</p>
        </div>
        {onKapat && (
          <button type="button" className={styles.close} onClick={onKapat} aria-label="Detayı kapat" title="Detayı kapat"><X size={18} aria-hidden="true" /></button>
        )}
      </header>
      <div className={styles.summary}>
        <div className={styles.stat}><div className={styles.statLabel}>Yayına alınan</div><div className={styles.statNumber} data-ozet="yayin">{formatPuan(detay.donemde_yayina_alinan)}</div></div>
        <div className={styles.stat}><div className={styles.statLabel}>Tamamlanan izleme</div><div className={styles.statNumber + " " + styles.blue} data-ozet="tamamlama">{formatPuan(detay.tamamlanan_izleme)}</div></div>
        <div className={styles.stat}><div className={styles.statLabel}>Kazanılan puan</div><div className={styles.statNumber + " " + styles.positive} data-ozet="kazanilan">+{formatPuan(detay.kazanilan_toplam)}</div></div>
        <div className={styles.stat + " " + styles.total}><div className={styles.statLabel}>Net puan</div><div className={styles.statNumber} data-ozet="net">{formatPuan(detay.net_puan)}<span className={styles.unit}>p</span></div></div>
      </div>
      {urun && (
        <>
          <h4 className={styles.productTitle}>Ürün Bazlı Puan Dağılımı</h4>
          <div className={styles.productIndex}>
            <div className={styles.products} id={panelId} role="tabpanel" aria-labelledby={id + "-urun-" + seciliIndeks} aria-live="polite">
              <div className={styles.productRow}>
                <div className={styles.name}>{urun.urun_adi}</div>
                <div className={styles.track} role="img" aria-label={urun.urun_adi + ": " + formatPuan(urun.net_puan) + " net puan"}>
                  <div className={styles.bar} style={{ width: cubukYuzdesi + "%" }} />
                </div>
                <div className={styles.result}>
                  <div className={styles.net + (urun.net_puan < 0 ? " " + styles.negative : "")} data-urun-puani="net">{formatPuan(urun.net_puan)}<span className={styles.unit}>p</span></div>
                  <div className={styles.breakdown}>
                    <span className={styles.positive} data-urun-puani="kazanilan" aria-label={"Kazanılan " + urun.kazanilan_toplam}>+{formatPuan(urun.kazanilan_toplam)}</span>
                    <i aria-hidden="true">|</i>
                    <span className={styles.negative} data-urun-puani="kaybedilen" aria-label={"Kaybedilen " + urun.kaybedilen_toplam}>−{formatPuan(urun.kaybedilen_toplam)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.indexTabs} role="tablist" aria-label={detay.egitim_adi + " ürünleri"}>
              {urunler.map((u, indeks) => (
                <button
                  type="button"
                  className={styles.indexTab}
                  key={u.urun_id}
                  id={id + "-urun-" + indeks}
                  role="tab"
                  aria-controls={panelId}
                  aria-selected={indeks === seciliIndeks}
                  tabIndex={indeks === seciliIndeks ? 0 : -1}
                  onClick={() => setSeciliUrunId(u.urun_id)}
                  onKeyDown={(event) => klavyeIleSec(event, indeks)}
                >{u.urun_adi}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
