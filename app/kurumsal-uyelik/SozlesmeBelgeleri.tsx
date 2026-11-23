"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import adminStyles from "@/app/admin/admin.module.css";
import formStyles from "@/app/admin/_components/yeni-firma-formu.module.css";
import styles from "@/app/login/login.module.css";
import { TASLAK_SOZLESME_ANAHTARI, taslakOku, taslakYaz } from "./kurumsalTaslak";

export type ResmiBelgeTuru = "sozlesme" | "ticaret_sicil" | "vergi_levhasi";

export type YukluBelgeDurumu = Record<ResmiBelgeTuru, { yuklu: boolean; dosya_adi: string | null }>;

const WORD_VE_PDF = ".doc,.docx,.pdf";
const BELGELER: { tur: ResmiBelgeTuru; ad: string; etiket: string; bicimler: string }[] = [
  { tur: "sozlesme", ad: "imzali-uyelik-sozlesmesi", etiket: "İmzalı Üyelik Sözleşmesi", bicimler: WORD_VE_PDF },
  { tur: "ticaret_sicil", ad: "ticaret-sicili-gazetesi", etiket: "Ticaret Sicili Gazetesi", bicimler: WORD_VE_PDF },
  { tur: "vergi_levhasi", ad: "vergi-levhasi", etiket: "Vergi Levhası", bicimler: ".png,.jpg,.jpeg,.webp,.pdf" },
];

export default function SozlesmeBelgeleri({
  sozlesmeYolu,
  kilitli = false,
  saltOkunur = false,
  ilkBelgeler,
  onDurumDegisimi,
  onBelgeGuncellendi,
}: {
  sozlesmeYolu: string | null;
  kilitli?: boolean;
  saltOkunur?: boolean;
  ilkBelgeler?: YukluBelgeDurumu;
  onDurumDegisimi?: (tamamlandi: boolean) => void;
  onBelgeGuncellendi?: (belgeler: YukluBelgeDurumu) => void;
}) {
  const herhangiYuklu = Boolean(
    ilkBelgeler && BELGELER.some(({ tur }) => ilkBelgeler[tur]?.yuklu)
  );
  const [indirmeDurumu, setIndirmeDurumu] = useState<"hazir" | "indiriliyor" | "basladi" | "hata">(
    herhangiYuklu ? "basladi" : "hazir"
  );
  const [belgeDurumu, setBelgeDurumu] = useState<YukluBelgeDurumu>(
    ilkBelgeler ?? {
      sozlesme: { yuklu: false, dosya_adi: null },
      ticaret_sicil: { yuklu: false, dosya_adi: null },
      vergi_levhasi: { yuklu: false, dosya_adi: null },
    }
  );
  const [yuklenenTur, setYuklenenTur] = useState<ResmiBelgeTuru | null>(null);
  const [yuklemeHatasi, setYuklemeHatasi] = useState("");

  useEffect(() => {
    if (herhangiYuklu) {
      setIndirmeDurumu("basladi");
      return;
    }
    const kayitli = taslakOku<{ indirmeBasladi?: boolean }>(TASLAK_SOZLESME_ANAHTARI);
    if (kayitli?.indirmeBasladi) {
      setIndirmeDurumu("basladi");
    }
  }, [herhangiYuklu]);

  const tumBelgelerYuklu =
    !kilitli &&
    BELGELER.every(({ tur }) => Boolean(belgeDurumu[tur]?.yuklu));

  useEffect(() => {
    onDurumDegisimi?.(tumBelgelerYuklu);
  }, [tumBelgelerYuklu, onDurumDegisimi]);

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

  async function belgeYukle(tur: ResmiBelgeTuru, dosya: File) {
    if (kilitli || saltOkunur || yuklenenTur) return;
    setYuklenenTur(tur);
    setYuklemeHatasi("");
    try {
      const formData = new FormData();
      formData.append("tur", tur);
      formData.append("dosya", dosya);
      const yanit = await fetch("/kurumsal-uyelik/api/basvuru/belge", {
        method: "POST",
        body: formData,
      });
      const veri = await yanit.json().catch(() => null);
      if (!yanit.ok) {
        setYuklemeHatasi(veri?.hata || "Belge yüklenemedi. Tekrar deneyin.");
        return;
      }
      setBelgeDurumu((onceki) => {
        const guncel: YukluBelgeDurumu = {
          ...onceki,
          [tur]: { yuklu: true, dosya_adi: typeof veri?.dosya_adi === "string" ? veri.dosya_adi : dosya.name },
        };
        onBelgeGuncellendi?.(guncel);
        return guncel;
      });
    } catch {
      setYuklemeHatasi("Belge yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setYuklenenTur(null);
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
          {BELGELER.map(({ tur, ad, etiket, bicimler }) => {
            const mevcut = belgeDurumu[tur];
            const yukleniyor = yuklenenTur === tur;
            return (
              <label className={adminStyles.field} key={ad}>
                <span>{etiket}</span>
                {!saltOkunur && (
                  <input
                    type="file"
                    name={ad}
                    accept={bicimler}
                    disabled={kilitli || indirmeDurumu !== "basladi" || yuklenenTur !== null}
                    onChange={(e) => {
                      const dosya = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (dosya) void belgeYukle(tur, dosya);
                    }}
                  />
                )}
                {yukleniyor && <small>Yükleniyor…</small>}
                {!yukleniyor && mevcut?.yuklu && (
                  <small className="inline-flex items-center gap-1.5 text-emerald-700">
                    <Check size={14} aria-hidden="true" />
                    <a
                      href={`/kurumsal-uyelik/api/basvuru/belge?tur=${tur}&indir=1`}
                      className="underline"
                    >
                      {mevcut.dosya_adi || "Yüklendi"}
                    </a>
                  </small>
                )}
              </label>
            );
          })}
        </div>
        {indirmeDurumu === "hata" && (
          <p role="alert" className={adminStyles.notice}>
            {sozlesmeYolu ? "Sözleşme indirilemedi. Tekrar deneyin." : "Üyelik sözleşmesi henüz eklenmedi."}
          </p>
        )}
        {yuklemeHatasi && (
          <p role="alert" className={adminStyles.notice}>
            {yuklemeHatasi}
          </p>
        )}
      </div>
    </div>
  );
}
