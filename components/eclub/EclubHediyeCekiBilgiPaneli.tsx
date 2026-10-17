"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import styles from "./eclub-bilgi-paneli.module.css";

export default function EclubHediyeCekiBilgiPaneli() {
  const [yerTutucu, setYerTutucu] = useState<HTMLSpanElement | null>(null);
  const [acik, setAcik] = useState(false);
  const [genislik, setGenislik] = useState(416);
  const kulakcik = useRef<HTMLButtonElement>(null);
  const kapat = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    const sayfa = yerTutucu?.closest<HTMLElement>("[data-eclub-sayfa]");
    if (!sayfa) return;
    const olc = () => {
      const stil = getComputedStyle(sayfa);
      const rafGenisligi = sayfa.getBoundingClientRect().width - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight);
      // Beşli raf: dört adet 16 px boşluk. Mobilde masaüstü referansı korunur.
      setGenislik(window.innerWidth >= 1280 ? Math.max(0, (rafGenisligi - 64) / 5 * 2) : 416);
    };
    const gozlemci = new ResizeObserver(olc);
    gozlemci.observe(sayfa);
    window.addEventListener("resize", olc);
    olc();
    return () => { gozlemci.disconnect(); window.removeEventListener("resize", olc); };
  }, [yerTutucu]);

  useEffect(() => {
    if (!acik) return;
    const tetikleyici = kulakcik.current;
    kapat.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setAcik(false); }
    };
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("keydown", escape); tetikleyici?.focus(); };
  }, [acik]);

  return <>
    <span hidden ref={setYerTutucu} />
    {yerTutucu && createPortal(
      <aside className={`${styles.panel} ${acik ? styles.acik : ""}`} style={{ "--bilgi-genisligi": `${genislik}px` } as CSSProperties} aria-label="Hediye çeki bilgileri">
        <button ref={kulakcik} type="button" className={styles.kulakcik} aria-expanded={acik} aria-controls={panelId}
          aria-label={acik ? "Yararlı bilgileri kapat" : "Yararlı bilgileri aç"} onClick={() => setAcik(!acik)}>
          <Info size={17} aria-hidden="true" />
          <span className={styles.etiket}>Yararlı Bilgiler</span>
          {acik ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
        </button>
        <div id={panelId} className={styles.icerik} inert={!acik} aria-hidden={!acik}>
          <header className={styles.baslik}>
            <h2>Hediye Çeki Hakkında Yararlı Bilgiler</h2>
            <button ref={kapat} type="button" className={styles.kapat} aria-label="Bilgi panelini kapat" onClick={() => setAcik(false)}><X size={18} /></button>
          </header>
          <div className={styles.metin}>
<dl className="grid grid-cols-1 gap-3 text-xs leading-relaxed text-[var(--tema-yerel-eclub-ana-metin-20)]">
              <div className="min-w-0 rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-44)] bg-gradient-to-br from-[var(--tema-yerel-eclub-secim-zemin-19)]/70 via-[var(--tema-yerel-eclub-kart-01)] to-[var(--tema-yerel-eclub-kart-01)] p-4 shadow-sm">
                <dt className="font-bold text-[var(--tema-yerel-eclub-ana-metin-19)]">Eczane Havuz Puanı</dt>
                <dd className="mt-3">Platformda tamamladığınız yayınlar sonrası kazandığınız puanlar, firmanın belirlediği oranda hediye çekine dönüştürülür. Eczane havuz puanı olarak tanımlanır.</dd>
              </div>
              <div className="min-w-0 rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-44)] bg-gradient-to-br from-[var(--tema-yerel-eclub-secim-zemin-19)]/70 via-[var(--tema-yerel-eclub-kart-01)] to-[var(--tema-yerel-eclub-kart-01)] p-4 shadow-sm">
                <dt className="font-bold text-[var(--tema-yerel-eclub-ana-metin-19)]">Puan Limitleri ve Puanların Devri</dt>
                <dd className="mt-3">Firma, her yayın için hediye çeki talebinde kullanılabilecek en az ve en çok puanı belirler. Talepler bu limitler dahilinde verilebilir. Sipariş zorunlu yayınlar hariç diğer yayınlardan kazanılan puanlar, devredilebilir. Bir önceki yıldan kalan kullanılmamış puanlar, 8 Ocak’ta silinir.</dd>
              </div>
              <div className="min-w-0 rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-44)] bg-gradient-to-br from-[var(--tema-yerel-eclub-secim-zemin-19)]/70 via-[var(--tema-yerel-eclub-kart-01)] to-[var(--tema-yerel-eclub-kart-01)] p-4 shadow-sm">
                <dt className="font-bold text-[var(--tema-yerel-eclub-ana-metin-19)]">Sipariş ve Hediye Çeki İlişkisi</dt>
                <dd className="mt-3 space-y-2">
                  <p>Firma, her yayın için sipariş koşulunu belirleyebilir. Üç seçenek vardır:</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li><strong>Sipariş gerekmiyorsa:</strong> Sipariş vermeden puanlarınızı hediye çekine dönüştürebilirsiniz.</li>
                    <li><strong>Sipariş isteğe bağlıysa:</strong> Sipariş vermeden de hediye çeki talep edebilirsiniz. Siparişi vermeniz durumunda hediye çeki tutarı firmanın belirlediği orandan daha fazla olabilir.</li>
                    <li><strong>Sipariş zorunluysa:</strong> Firmanın belirlediği siparişi verdiğinizde puanlarınız hediye çekine dönüşür. Sipariş vermezseniz puanlarınız devredilmez ve silinir.</li>
                  </ul>
                </dd>
              </div>
              <div className="min-w-0 rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-44)] bg-gradient-to-br from-[var(--tema-yerel-eclub-secim-zemin-19)]/70 via-[var(--tema-yerel-eclub-kart-01)] to-[var(--tema-yerel-eclub-kart-01)] p-4 shadow-sm">
                <dt className="font-bold text-[var(--tema-yerel-eclub-ana-metin-19)]">Talep Takibi ve İptali</dt>
                <dd className="mt-3 space-y-2">
                  <p>Hediye çeki talebini yalnızca eczane sahibi oluşturabilir.</p>
                  <p>Hediye çeki talebinizin durumunu <strong>Hediye Çeki Takibi</strong> alanından takip edebilirsiniz.</p>
                  <p>Talebiniz firma yöneticisinin onayını beklerken iptal edebilirsiniz. İptal sonrası puanlarınız eczanenizin havuzuna geri eklenir.</p>
                </dd>
              </div>
        </dl>
          </div>
        </div>
      </aside>, yerTutucu.ownerDocument.body
    )}
  </>;
}
