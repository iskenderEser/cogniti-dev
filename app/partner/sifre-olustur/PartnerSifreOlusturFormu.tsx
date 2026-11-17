"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import styles from "../partner.module.css";

interface Props {
  davetToken: string;
}

export default function PartnerSifreOlusturFormu({ davetToken }: Props) {
  const [durum, setDurum] = useState<"yukleniyor" | "hazir" | "gecersiz" | "tamamlandi">(
    davetToken ? "yukleniyor" : "gecersiz",
  );
  const [aday, setAday] = useState<{ ad_soyad: string; eposta: string } | null>(null);
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [hata, setHata] = useState(davetToken ? "" : "Davet bağlantısı eksik veya geçersiz.");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const kilidi = useRef(false);

  useEffect(() => {
    if (!davetToken) return;
    let iptal = false;
    fetch(`/partner/api/sifre-olustur?davet=${encodeURIComponent(davetToken)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    })
      .then(async r => {
        const d: unknown = await r.json();
        if (iptal) return;
        if (r.ok && d && typeof d === "object" && "eposta" in d && typeof d.eposta === "string") {
          setAday({
            ad_soyad: "ad_soyad" in d && typeof d.ad_soyad === "string" ? d.ad_soyad : "",
            eposta: d.eposta,
          });
          setDurum("hazir");
        } else {
          setHata(
            d && typeof d === "object" && "hata" in d && typeof d.hata === "string"
              ? d.hata
              : "Davet bağlantısı geçersiz.",
          );
          setDurum("gecersiz");
        }
      })
      .catch(() => {
        if (iptal) return;
        setHata("Davet bağlantısı doğrulanamadı.");
        setDurum("gecersiz");
      });
    return () => {
      iptal = true;
    };
  }, [davetToken]);

  async function kaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kilidi.current || durum !== "hazir") return;
    setHata("");
    if (sifre.length < 6 || sifre.length > 128) {
      setHata("Şifreniz en az 6, en fazla 128 karakter olmalıdır.");
      return;
    }
    if (sifre !== sifreTekrar) {
      setHata("Girdiğiniz şifreler eşleşmiyor.");
      return;
    }
    kilidi.current = true;
    setKaydediliyor(true);
    try {
      const r = await fetch("/partner/api/sifre-olustur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ davet: davetToken, sifre }),
        signal: AbortSignal.timeout(15000),
      });
      const d: unknown = await r.json();
      if (!r.ok) {
        setHata(
          d && typeof d === "object" && "hata" in d && typeof d.hata === "string"
            ? d.hata
            : "Şifre kaydedilemedi. Lütfen tekrar deneyin.",
        );
        return;
      }
      setDurum("tamamlandi");
    } catch {
      setHata("Şifre kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      kilidi.current = false;
      setKaydediliyor(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topHeader}>
        <Link href="/welcome" className={styles.brand} aria-label="Cogniti">
          <CognitiLogo width={220} height={73} />
        </Link>
        <nav className={styles.headerActions} aria-label="İş partneri gezinmesi">
          <Link href="/partner?giris=1" className={styles.loginNavBtn}>
            Partner Girişi
          </Link>
        </nav>
      </header>

      <main className={styles.basvuruMain}>
        <section className={styles.basvuruKart} aria-labelledby="partner-sifre-baslik">
          <p className={styles.bolumEtiketi}>COGNITI İŞ PARTNERLİĞİ</p>
          <h1 id="partner-sifre-baslik" className={styles.basvuruBaslik}>
            Partner Şifrenizi Oluşturun
          </h1>

          {durum === "yukleniyor" && <p className={styles.basvuruAciklama}>Davet bağlantınız doğrulanıyor…</p>}

          {durum === "gecersiz" && (
            <>
              <p className={styles.formError} role="alert">
                {hata}
              </p>
              <Link href="/partner" className={styles.topBack}>
                ← İş Partnerliği sayfasına dön
              </Link>
            </>
          )}

          {durum === "tamamlandi" && (
            <div className={styles.alindiKutu} role="status">
              <p className={styles.alindiBaslik}>Şifreniz oluşturuldu</p>
              <p className={styles.alindiMetin}>
                Artık e-posta adresiniz ve yeni şifrenizle Cogniti İş Partneri panelinize giriş yapabilirsiniz.
              </p>
              <Link href="/partner?giris=1" className={styles.loginNavBtn}>
                Partner Girişine Git
              </Link>
            </div>
          )}

          {durum === "hazir" && aday && (
            <>
              <p className={styles.basvuruAciklama}>
                {aday.ad_soyad ? `${aday.ad_soyad} (${aday.eposta})` : aday.eposta} hesabı için giriş şifrenizi
                belirleyin.
              </p>
              <form className={styles.form} onSubmit={kaydet}>
                <label className={styles.field}>
                  <span>Yeni Şifre</span>
                  <div className={styles.passwordField}>
                    <Input
                      type={sifreGorunur ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={6}
                      maxLength={128}
                      required
                      disabled={kaydediliyor}
                      value={sifre}
                      onChange={e => setSifre(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setSifreGorunur(v => !v)}
                      aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {sifreGorunur ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <label className={styles.field}>
                  <span>Yeni Şifre (Tekrar)</span>
                  <Input
                    type={sifreGorunur ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={128}
                    required
                    disabled={kaydediliyor}
                    value={sifreTekrar}
                    onChange={e => setSifreTekrar(e.target.value)}
                  />
                </label>

                {hata && (
                  <p className={styles.formError} role="alert">
                    {hata}
                  </p>
                )}

                <Button type="submit" className={styles.submitBtn} disabled={kaydediliyor}>
                  {kaydediliyor ? "Kaydediliyor…" : "Şifreyi Oluştur"}
                </Button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
