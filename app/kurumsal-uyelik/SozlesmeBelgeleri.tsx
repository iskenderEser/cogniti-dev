"use client";

import { useState } from "react";
import adminStyles from "@/app/admin/admin.module.css";
import formStyles from "@/app/admin/_components/yeni-firma-formu.module.css";
import styles from "@/app/login/login.module.css";

const WORD_VE_PDF = ".doc,.docx,.pdf";
const BELGELER = [
  { ad: "imzali-uyelik-sozlesmesi", etiket: "İmzalı Üyelik Sözleşmesi", bicimler: WORD_VE_PDF },
  { ad: "ticaret-sicili-gazetesi", etiket: "Ticaret Sicili Gazetesi", bicimler: WORD_VE_PDF },
  { ad: "vergi-levhasi", etiket: "Vergi Levhası", bicimler: ".png,.jpg,.jpeg,.webp,.pdf" },
];

export default function SozlesmeBelgeleri({ sozlesmeYolu }: { sozlesmeYolu: string | null }) {
  const [indirmeDurumu, setIndirmeDurumu] = useState<"hazir" | "indiriliyor" | "basladi" | "hata">("hazir");

  async function sozlesmeyiIndir() {
    if (indirmeDurumu === "indiriliyor") return;
    if (!sozlesmeYolu) {
      setIndirmeDurumu("hata");
      return;
    }
    setIndirmeDurumu("indiriliyor");
    try {
      const yanit = await fetch(sozlesmeYolu);
      if (!yanit.ok) throw new Error("Sözleşme alınamadı.");
      const dosya = await yanit.blob();
      if (!dosya.size || dosya.type !== "application/pdf") throw new Error("Sözleşme PDF'i alınamadı.");
      const adres = URL.createObjectURL(dosya);
      const baglanti = document.createElement("a");
      baglanti.href = adres;
      baglanti.download = "kurumsal-uyelik-sozlesmesi.pdf";
      baglanti.click();
      setTimeout(() => URL.revokeObjectURL(adres), 1000);
      setIndirmeDurumu("basladi");
    } catch {
      setIndirmeDurumu("hata");
    }
  }

  return (
    <div className={`${adminStyles.card} ${formStyles.kurumsalKart}`}>
      <div className={`${adminStyles.cardBody} ${formStyles.compactBody}`}>
        <div className={styles.kurumsalUyelikBelgeAlanlari}>
          <div className={adminStyles.field}>
            <span id="uyelik-sozlesmesi-etiketi">Üyelik Sözleşmesi</span>
            <div className={styles.kurumsalUyelikIndirAlani}>
              <button type="button" className={styles.kurumsalUyelikIndirButonu}
                aria-labelledby="uyelik-sozlesmesi-etiketi uyelik-sozlesmesi-indir"
                disabled={indirmeDurumu === "indiriliyor"} onClick={sozlesmeyiIndir}>
                <span id="uyelik-sozlesmesi-indir">{indirmeDurumu === "indiriliyor" ? "İndiriliyor…" : "İndir"}</span>
              </button>
            </div>
          </div>
          {BELGELER.map(({ ad, etiket, bicimler }) => (
            <label className={adminStyles.field} key={ad}>
              {etiket}
              <input type="file" name={ad} accept={bicimler} disabled={indirmeDurumu !== "basladi"} />
            </label>
          ))}
        </div>
        {indirmeDurumu === "hata" && <p role="alert">
          {sozlesmeYolu ? "Sözleşme indirilemedi. Tekrar deneyin." : "Üyelik sözleşmesi henüz eklenmedi."}
        </p>}
      </div>
    </div>
  );
}
