"use client";

import { panelBaslangici } from "@/lib/panel/baslangic";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { beniHatirlaKaydet } from "@/lib/utils/beniHatirla";
import { useTema } from "@/app/providers/TemaProvider";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import styles from "./login.module.css";
import switchStyles from "@/components/tema/tema-secici.module.css";
import GirisAltBilgileri from "./_components/GirisAltBilgileri";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreGoster, setSifreGoster] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");
  // F-03/B: Beni hatırla — işaretsizse oturum tarayıcı kapanınca düşer.
  const [beniHatirla, setBeniHatirla] = useState(true);
  // F-03/A: Şifremi unuttum — giriş formuyla yer değiştiren sıfırlama görünümü.
  const [sifirlamaAcik, setSifirlamaAcik] = useState(false);
  const [sifirlamaEmail, setSifirlamaEmail] = useState("");
  const [sifirlamaGonderiliyor, setSifirlamaGonderiliyor] = useState(false);
  const [sifirlamaMesaj, setSifirlamaMesaj] = useState("");
  const router = useRouter();
  const { kullanici, yukleniyor, cikisYap } = useAuth();

  const kimlikRef = useRef<HTMLInputElement>(null);
  const sifirlamaRef = useRef<HTMLInputElement>(null);
  const { tema, temaDegistir } = useTema();

  useEffect(() => {
    if (yukleniyor) return;
    if (!kullanici) return;
    if (kullanici.rol === undefined) return;
    let iptalEdildi = false;

    // E-Club kişisi (eczacı/teknisyen) → kendi paneline; Eczanem müşterisi →
    // /eczanem paneline (müşteri de bu sayfadan e-posta/telefon + şifre ile girer);
    // admin → /admin; üretici → /yayin-yonetimi; diğer iç roller → /ana-sayfa.
    // Kimlik kaynağı useAuth'tur (B-06/D3 — user_metadata okuması kaldırıldı:
    // metadata girişte iliştirilir ve bayatlayabilir, rolCozucu dersi).
    const yonlendir = async () => {
      if (kullanici.kimlik_turu === "eclub_kisi") {
        router.replace("/eclub/ana-sayfa");
        return;
      }
      if (kullanici.kimlik_turu === "musteri") {
        router.replace("/eczanem");
        return;
      }

      // Firma aktif mi — firması pasif olan kullanıcı giriş yapamaz.
      // Admin muaftır (firma yönetimi için panele erişmesi gerekir);
      // firma_id useAuth kimliğinden gelir, ayrıca kullanicilar sorgusu gerekmez.
      if (kullanici.rol !== "admin" && kullanici.firma_id) {
        const supabase = createClient();
        const { data: firma } = await supabase
          .from("firmalar")
          .select("aktif")
          .eq("firma_id", kullanici.firma_id)
          .single();

        if (iptalEdildi) return;
        if (firma && firma.aktif === false) {
          await cikisYap();
          setHata("Firmanızın sisteme erişimi şu anda kapalıdır. Lütfen yöneticinizle görüşün.");
          return;
        }
      }

      if (!iptalEdildi) router.replace(kullanici.rol === "admin" ? "/admin" : panelBaslangici(kullanici.rol).yol);
    };
    yonlendir();
    return () => { iptalEdildi = true; };
  }, [cikisYap, kullanici, router, yukleniyor]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHata("");

    // Kimlik alanı e-posta VEYA cep telefonu kabul eder. Telefon (yalın rakam,
    // '@' yok) girildiyse sunucu ucu üç kimlik düzleminde telefonu tek bir Auth
    // hesabına çözüp oturumu açar.
    const kimlik = email.trim();
    const telefonMu = !kimlik.includes("@") && kimlik.replace(/\D/g, "").length >= 10;

    if (telefonMu) {
      try {
        const res = await fetch("/eczanem/api/giris/sifre", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefon: kimlik, sifre }),
        });
        const data = await res.json();
        if (!res.ok) { setHata(data.hata ?? "Telefon veya şifre hatalı."); setLoading(false); return; }
        beniHatirlaKaydet(beniHatirla);
        // Tam sayfa geçiş: AuthProvider yeni oturumu temiz durumla yüklesin.
        window.location.href = data.yonlendir ?? "/login";
      } catch {
        setHata("Giriş yapılamadı; yeniden deneyin.");
        setLoading(false);
      }
      return;
    }

    const supabase = createClient();
    const { data: giris, error } = await supabase.auth.signInWithPassword({ email: kimlik, password: sifre });
    if (error) {
      setHata("E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }
    if (giris.user?.app_metadata.eclub_davet_bekliyor === true) {
      window.location.replace("/davet-bekliyor");
      return;
    }
    // F-03/B: tercih girişte yazılır; işaretsizse tarayıcı kapanınca oturum düşer.
    beniHatirlaKaydet(beniHatirla);
    // Yönlendirme ve firma-aktif kontrolü yukarıdaki useEffect'te,
    // AuthProvider kimliği çözüldüğünde yapılır.
    setLoading(false);
  };

  // F-03/A: sıfırlama bağlantısı isteği. Mesaj her durumda nötrdür —
  // adresin kayıtlı olup olmadığı dışarı sızdırılmaz.
  const handleSifirlamaGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSifirlamaGonderiliyor(true);
    setSifirlamaMesaj("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(sifirlamaEmail.trim(), {
      redirectTo: `${window.location.origin}/sifre-yenile`,
    });
    setSifirlamaGonderiliyor(false);
    if (error) {
      setSifirlamaMesaj("Bağlantı gönderilemedi. Lütfen biraz sonra tekrar deneyin.");
      return;
    }
    setSifirlamaMesaj(
      "E-posta adresiniz sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderilecektir. Gelen kutunuzu kontrol edin."
    );
  };

  useEffect(() => {
    (sifirlamaAcik ? sifirlamaRef : kimlikRef).current?.focus({ preventScroll: true });
  }, [sifirlamaAcik]);

  return (
    <div className={styles.page}>
      <main>
        <section id="giris-alani" className={styles.authPage} aria-labelledby="giris-basligi">
          <div className={styles.authContent}>
            <CognitiLogo className={styles.authLogo} width={200} height={66} />
            <h1 className={styles.heading} id="giris-basligi">{sifirlamaAcik ? "Şifre Sıfırlama" : "Giriş Yap"}</h1>
            {sifirlamaAcik ? (
              <>
                <p className={styles.resetDescription}>Kayıtlı e-posta adresinizi girin; şifre sıfırlama bağlantısı gönderelim.</p>
                <form onSubmit={handleSifirlamaGonder} className={styles.form}>
                  <div className={styles.field}>
                    <label htmlFor="sifirlama-email">E-posta</label>
                    <input ref={sifirlamaRef} id="sifirlama-email" type="email" value={sifirlamaEmail} onChange={(e) => setSifirlamaEmail(e.target.value)} required autoComplete="email" placeholder="ornek@sirket.com" />
                  </div>
                  {sifirlamaMesaj && <p className={styles.message} role="status">{sifirlamaMesaj}</p>}
                  <button type="submit" disabled={sifirlamaGonderiliyor} className={styles.submit}>
                    {sifirlamaGonderiliyor ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                  </button>
                  <button type="button" className={`${styles.link} ${styles.backLogin}`} onClick={() => { setSifirlamaAcik(false); setSifirlamaMesaj(""); }}>← Girişe dön</button>
                </form>
              </>
            ) : (
              <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="giris-kimlik">E-posta veya Cep Telefonu</label>
                  <input ref={kimlikRef} id="giris-kimlik" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder="E-posta ya da cep telefon numarası" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="giris-sifre">Şifre</label>
                  <div className={styles.password}>
                    <input id="giris-sifre" type={sifreGoster ? "text" : "password"} value={sifre} onChange={(e) => setSifre(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
                    <button type="button" className={styles.eye} onClick={() => setSifreGoster(!sifreGoster)} aria-label={sifreGoster ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={sifreGoster}>
                      {sifreGoster ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                <div className={styles.options}>
                  <label className={styles.remember}><input type="checkbox" checked={beniHatirla} onChange={(e) => setBeniHatirla(e.target.checked)} />Beni hatırla</label>
                  <button type="button" className={styles.link} onClick={() => { setSifirlamaEmail(email.includes("@") ? email : ""); setSifirlamaMesaj(""); setSifirlamaAcik(true); }}>Şifremi unuttum</button>
                </div>
                {hata && <p className={`${styles.message} ${styles.error}`} role="alert">{hata}</p>}
                <button type="submit" disabled={loading} className={styles.submit}>{loading ? "Giriş yapılıyor..." : "Giriş Yap"}</button>
              </form>
            )}
            <Link href="/ana-sayfa" className={styles.back}>← Cogniti’yi tanıyın</Link>
          </div>
        </section>
      </main>
      <GirisAltBilgileri gorunum={
        <div className={styles.appearance}><span>Görünüm</span>
          <div className={`${switchStyles.secici} ${styles.themeSwitch}`}>
            <button type="button" role="switch" aria-label="Mavi ve yeşil görünüm arasında geçiş yap" aria-checked={tema === "mavi"} className={switchStyles[tema]} onClick={() => temaDegistir(tema === "mavi" ? "yesil" : "mavi")}>
              <span className={switchStyles.anahtar} aria-hidden="true"><span className={switchStyles.topuz} /></span>
            </button>
          </div>
        </div>
      } />
    </div>
  );
}
