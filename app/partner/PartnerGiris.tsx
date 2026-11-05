"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { SadeSekmeler } from "@/components/kontrol/SadeKontroller";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { partnerKaydiniDogrula } from "@/lib/agora/partnerKaydi";
import styles from "./partner.module.css";

export default function PartnerGiris() {
  const [gorunum, setGorunum] = useState<"giris" | "kayit">("giris");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [kayit, setKayit] = useState({ ad_soyad: "", eposta: "", cep_telefonu: "" });
  const [kayitGonderiliyor, setKayitGonderiliyor] = useState(false);
  const [kayitAlindi, setKayitAlindi] = useState(false);
  const [kayitHatasi, setKayitHatasi] = useState("");
  const kayitKilidi = useRef(false);
  const [giris, setGiris] = useState({ eposta: "", sifre: "" });
  const [girisHatasi, setGirisHatasi] = useState("");
  const [girisYapiliyor, setGirisYapiliyor] = useState(false);
  const girisKilidi = useRef(false);

  async function girisYap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (girisKilidi.current) return;
    girisKilidi.current = true; setGirisYapiliyor(true); setGirisHatasi("");
    try {
      const r = await fetch("/partner/api/giris", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(giris), signal: AbortSignal.timeout(15000) });
      const d: unknown = await r.json();
      if (r.ok && d && typeof d === "object" && "yonlendir" in d && d.yonlendir === "/partner/profil") {
        window.location.replace("/partner/profil"); return;
      }
      setGirisHatasi(d && typeof d === "object" && "hata" in d && typeof d.hata === "string" ? d.hata : "Giriş yapılamadı. Lütfen tekrar deneyin.");
    } catch { setGirisHatasi("Giriş yapılamadı. Lütfen tekrar deneyin."); }
    finally { girisKilidi.current = false; setGirisYapiliyor(false); }
  }

  async function kayitGonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kayitKilidi.current || kayitAlindi) return;
    setKayitHatasi("");
    const kontrol = partnerKaydiniDogrula(kayit);
    if (!kontrol.ok) { setKayitHatasi(kontrol.hata); return; }
    kayitKilidi.current = true;
    setKayitGonderiliyor(true);
    try {
      const response = await fetch("/partner/api/kayit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kontrol.veri), signal: AbortSignal.timeout(15000),
      });
      const data: unknown = await response.json();
      if (response.status !== 202 || !data || typeof data !== "object" || !("mesaj" in data) || typeof data.mesaj !== "string") {
        const hata = data && typeof data === "object" && "hata" in data && typeof data.hata === "string"
          ? data.hata : "Üyelik kaydı tamamlanamadı. Lütfen tekrar deneyin.";
        setKayitHatasi(hata);
        return;
      }
      setKayitAlindi(true);
    } catch {
      setKayitHatasi("Üyelik kaydı doğrulanamadı. Lütfen tekrar deneyin.");
    } finally {
      kayitKilidi.current = false;
      setKayitGonderiliyor(false);
    }
  }

  return <main className={styles.page}>
    <div className={styles.content}>
      <CognitiLogo className={styles.logo} />
      <header className={styles.header}>
        <h1>İş Partneri</h1>
      </header>
      <section className={styles.card} aria-label="İş partneri kayıt ve giriş">
        <SadeSekmeler deger={gorunum} onDegistir={setGorunum} etiket="İş partneri işlemleri" secenekler={[
          { deger: "giris", etiket: "Giriş Yap", icerik:
            <form className={styles.form} aria-label="İş partneri giriş formu" aria-busy={girisYapiliyor} onSubmit={girisYap}>
              <div className={styles.field}>
                <label htmlFor="partner-giris-eposta">E-Posta</label>
                <Input id="partner-giris-eposta" type="email" autoComplete="username" required maxLength={254} value={giris.eposta} disabled={girisYapiliyor} onChange={e => setGiris({ ...giris, eposta: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="partner-giris-sifre">Şifre</label>
                <div className={styles.password}>
                  <Input id="partner-giris-sifre" type={sifreGorunur ? "text" : "password"} autoComplete="current-password" required minLength={6} maxLength={128} value={giris.sifre} disabled={girisYapiliyor} onChange={e => setGiris({ ...giris, sifre: e.target.value })} />
                  <button type="button" className={styles.eye} aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={sifreGorunur} onClick={() => setSifreGorunur(!sifreGorunur)}>
                    {sifreGorunur ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {girisHatasi && <p className={styles.notice} role="alert">{girisHatasi}</p>}
              <Button type="submit" disabled={girisYapiliyor}>{girisYapiliyor ? "Giriş yapılıyor…" : "Giriş Yap"}</Button>
            </form>
          },
          { deger: "kayit", etiket: "İş Partneri Olunuz", icerik:
            <form className={styles.form} aria-label="İş partneri üyelik formu" aria-busy={kayitGonderiliyor} onSubmit={kayitGonder}>
              <div className={styles.field}>
                <label htmlFor="partner-kayit-ad">Ad Soyad</label>
                <Input id="partner-kayit-ad" name="ad_soyad" type="text" autoComplete="name" required maxLength={150} value={kayit.ad_soyad} disabled={kayitGonderiliyor || kayitAlindi} onChange={(e) => setKayit({ ...kayit, ad_soyad: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="partner-kayit-eposta">E-Posta</label>
                <Input id="partner-kayit-eposta" name="eposta" type="email" autoComplete="email" required maxLength={254} value={kayit.eposta} disabled={kayitGonderiliyor || kayitAlindi} onChange={(e) => setKayit({ ...kayit, eposta: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="partner-kayit-telefon">Cep Telefonu</label>
                <Input id="partner-kayit-telefon" name="cep_telefonu" type="tel" autoComplete="tel" inputMode="tel" required maxLength={30} value={kayit.cep_telefonu} disabled={kayitGonderiliyor || kayitAlindi} onChange={(e) => setKayit({ ...kayit, cep_telefonu: e.target.value })} />
              </div>
              {kayitHatasi && <p className={styles.notice} role="alert">{kayitHatasi}</p>}
              {kayitAlindi && <p className={styles.notice} role="status">Başvurunuz alındı. İlk girişiniz için admin onayı bekleniyor.</p>}
              <Button type="submit" disabled={kayitGonderiliyor || kayitAlindi}>{kayitGonderiliyor ? "Kaydediliyor…" : "İş Partneri Olunuz"}</Button>
            </form>
          },
        ]} />
      </section>
      <Link href="/welcome" className={styles.back}>← Cogniti’yi tanıyın</Link>
    </div>
  </main>;
}
