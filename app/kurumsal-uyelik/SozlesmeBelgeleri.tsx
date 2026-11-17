"use client";

import { useEffect, useState } from "react";
import adminStyles from "@/app/admin/admin.module.css";
import formStyles from "@/app/admin/_components/yeni-firma-formu.module.css";
import styles from "@/app/login/login.module.css";
import { TASLAK_SOZLESME_ANAHTARI, taslakOku, taslakYaz } from "./kurumsalTaslak";

const WORD_VE_PDF = ".doc,.docx,.pdf";
const BELGELER = [
  { ad: "imzali-uyelik-sozlesmesi", etiket: "İmzalı Üyelik Sözleşmesi", bicimler: WORD_VE_PDF },
  { ad: "ticaret-sicili-gazetesi", etiket: "Ticaret Sicili Gazetesi", bicimler: WORD_VE_PDF },
  { ad: "vergi-levhasi", etiket: "Vergi Levhası", bicimler: ".png,.jpg,.jpeg,.webp,.pdf" },
];

export default function SozlesmeBelgeleri({
  sozlesmeYolu,
  kilitli = false,
  onDurumDegisimi,
}: {
  sozlesmeYolu: string | null;
  kilitli?: boolean;
  onDurumDegisimi?: (tamamlandi: boolean) => void;
}) {
  const [indirmeDurumu, setIndirmeDurumu] = useState<"hazir" | "indiriliyor" | "basladi" | "hata">("hazir");
  const [secilenBelgeler, setSecilenBelgeler] = useState<Record<string, string>>({});

  useEffect(() => {
    const kayitli = taslakOku<{ indirmeBasladi?: boolean }>(TASLAK_SOZLESME_ANAHTARI);
    if (kayitli?.indirmeBasladi) {
      setIndirmeDurumu("basladi");
    }
  }, []);

  const tumBelgelerSecili =
    !kilitli &&
    indirmeDurumu === "basladi" &&
    BELGELER.every(({ ad }) => Boolean(secilenBelgeler[ad]));

  useEffect(() => {
    onDurumDegisimi?.(tumBelgelerSecili);
  }, [tumBelgelerSecili, onDurumDegisimi]);

  async function sozlesmeyiIndir() {
    if (kilitli || indirmeDurumu === "indiriliyor") return;
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
      taslakYaz(TASLAK_SOZLESME_ANAHTARI, { indirmeBasladi: true });
    } catch {
      setIndirmeDurumu("hata");
    }
  }

  return (
    <div className={`${adminStyles.card} ${formStyles.kurumsalKart} ${kilitli ? styles.kurumsalUyelikKilitli : ""}`} aria-disabled={kilitli}>
      <div className={`${adminStyles.cardBody} ${formStyles.compactBody}`}>
        <div className={styles.kurumsalUyelikBelgeAlanlari}>
          <div className={adminStyles.field}>
            <span id="uyelik-sozlesmesi-etiketi">Üyelik Sözleşmesi</span>
            <div className={styles.kurumsalUyelikIndirAlani}>
              <button
                type="button"
                className={styles.kurumsalUyelikIndirButonu}
                aria-labelledby="uyelik-sozlesmesi-etiketi uyelik-sozlesmesi-indir"
                disabled={kilitli || indirmeDurumu === "indiriliyor"}
                onClick={sozlesmeyiIndir}
              >
                <span id="uyelik-sozlesmesi-indir">{indirmeDurumu === "indiriliyor" ? "İndiriliyor…" : "İndir"}</span>
              </button>
            </div>
          </div>
          {BELGELER.map(({ ad, etiket, bicimler }) => (
            <label className={adminStyles.field} key={ad}>
              {etiket}
              <input
                type="file"
                name={ad}
                accept={bicimler}
                disabled={kilitli || indirmeDurumu !== "basladi"}
                onChange={(e) => {
                  const dosya = e.target.files?.[0];
                  setSecilenBelgeler((onceki) => {
                    const guncel = { ...onceki };
                    if (dosya) guncel[ad] = dosya.name;
                    else delete guncel[ad];
                    return guncel;
                  });
                }}
              />
            </label>
          ))}
        </div>
        {indirmeDurumu === "hata" && (
          <p role="alert">
            {sozlesmeYolu ? "Sözleşme indirilemedi. Tekrar deneyin." : "Üyelik sözleşmesi henüz eklenmedi."}
          </p>
        )}
      </div>
    </div>
  );
}
