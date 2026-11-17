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

const REHBER_SEKMELERI = [
  {
    anahtar: "agora",
    sekmeBasligi: "Agora & Panel",
    etiket: "COGNITI AGORA  ·  ORTAK İÇERİK PAZARI",
    baslik: "İçerikleriniz tek vitrinde",
    altBaslik: "tüm sektör firmalarıyla buluşur",
    maddeler: [
      {
        baslik: "Cogniti Agora Nedir?",
        aciklama:
          "İş partnerlerinin ürettiği eğitim ve gelişim içeriklerinin sergilendiği; Cogniti üyesi firmaların ve profesyonellerin bu içerikleri inceleyip satın alabildiği ortak içerik pazarıdır.",
      },
      {
        baslik: "İş Partneri Paneli ve Agora Akışı",
        aciklama:
          "Özel panelinizde eğitimlerinizi oluşturur ve fiyatlandırırsınız. Hazırladığınız yayınlar onay sürecinin ardından Agora’da yayımlanarak üye firmaların erişimine açılır.",
      },
    ],
  },
  {
    anahtar: "model",
    sekmeBasligi: "Üyelik & Ödemeler",
    etiket: "COGNITI İŞ PARTNERLİĞİ  ·  FİNANSAL MODEL",
    baslik: "Ücretsiz üyelik,",
    altBaslik: "şeffaf hak ediş ve ödeme süreci",
    maddeler: [
      {
        baslik: "Ücretsiz ve Sınırsız Yayın",
        aciklama:
          "Cogniti İş Partnerliği üyeliği tüm kişi ve firmalar için ücretsizdir. Hiçbir ücret ödemeden sınırsız yayın açarak ürettikleri içerikleri Cogniti’deki firmaların profesyonellerine sunabilirler.",
      },
      {
        baslik: "Hak Ediş ve Faturalandırma",
        aciklama:
          "İçerikleriniz satın alındığında hak edişiniz oluşur. Sözleşmedeki hizmet komisyonu düşüldükten sonra kalan tutarı Mill Danışmanlık’a faturalandırırsınız; ödemelerinizi panelinizden şeffafça izlersiniz.",
      },
    ],
  },
] as const;

export default function PartnerGiris() {
  const [gorunum, setGorunum] = useState<"giris" | "kayit">("giris");
  const [formModalAcik, setFormModalAcik] = useState(false);
  const [rehberAcik, setRehberAcik] = useState(false);
  const [rehberIndeks, setRehberIndeks] = useState(0);
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
    event.preventDefault();
    if (girisKilidi.current) return;
    girisKilidi.current = true;
    setGirisYapiliyor(true);
    setGirisHatasi("");
    try {
      const r = await fetch("/partner/api/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(giris),
        signal: AbortSignal.timeout(15000),
      });
      const d: unknown = await r.json();
      if (r.ok && d && typeof d === "object" && "yonlendir" in d && d.yonlendir === "/partner/profil") {
        window.location.replace("/partner/profil");
        return;
      }
      setGirisHatasi(
        d && typeof d === "object" && "hata" in d && typeof d.hata === "string"
          ? d.hata
          : "Giriş yapılamadı. Lütfen tekrar deneyin.",
      );
    } catch {
      setGirisHatasi("Giriş yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      girisKilidi.current = false;
      setGirisYapiliyor(false);
    }
  }

  async function kayitGonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kayitKilidi.current || kayitAlindi) return;
    setKayitHatasi("");
    const kontrol = partnerKaydiniDogrula(kayit);
    if (!kontrol.ok) {
      setKayitHatasi(kontrol.hata);
      return;
    }
    kayitKilidi.current = true;
    setKayitGonderiliyor(true);
    try {
      const response = await fetch("/partner/api/kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kontrol.veri),
        signal: AbortSignal.timeout(15000),
      });
      const data: unknown = await response.json();
      if (
        response.status !== 202 ||
        !data ||
        typeof data !== "object" ||
        !("mesaj" in data) ||
        typeof data.mesaj !== "string"
      ) {
        const hata =
          data && typeof data === "object" && "hata" in data && typeof data.hata === "string"
            ? data.hata
            : "Üyelik kaydı tamamlanamadı. Lütfen tekrar deneyin.";
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

  const aktifRehber = REHBER_SEKMELERI[rehberIndeks] ?? REHBER_SEKMELERI[0];

  return (
    <div className={styles.page}>
      <header className={styles.topHeader}>
        <Link href="/welcome" className={styles.brand} aria-label="Cogniti">
          <CognitiLogo width={220} height={73} />
        </Link>
        <nav className={styles.headerActions} aria-label="İş partneri gezinmesi">
          <button
            type="button"
            className={styles.applyNavBtn}
            onClick={() => {
              setGorunum("kayit");
              setFormModalAcik(true);
            }}
          >
            İŞ PARTNERİ BAŞVURUSU
          </button>
          <button
            type="button"
            className={styles.loginNavBtn}
            onClick={() => {
              setGorunum("giris");
              setFormModalAcik(true);
            }}
          >
            Partner Girişi
          </button>
          <Link href="/welcome" prefetch={false} className={styles.topBack}>
            ← Cogniti’yi tanıyın
          </Link>
        </nav>
      </header>

      <main className={styles.zemin}>
        <svg
          className={styles.gorsel}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1600 1200"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="partner-kenar-akisi">
              <stop offset="0" stopColor="white" stopOpacity=".8" />
              <stop offset=".1" stopColor="white" stopOpacity=".35" />
              <stop offset=".23" stopColor="white" stopOpacity="0" />
              <stop offset=".77" stopColor="white" stopOpacity="0" />
              <stop offset=".9" stopColor="white" stopOpacity=".35" />
              <stop offset="1" stopColor="white" stopOpacity=".8" />
            </linearGradient>
            <mask id="partner-metin-korumasi">
              <rect width="1600" height="1200" fill="url(#partner-kenar-akisi)" />
            </mask>
          </defs>
          <g mask="url(#partner-metin-korumasi)" fill="none" stroke="#237ac8" strokeWidth="1" strokeLinecap="round">
            {[
              "M-120 65 C180 20 300 350 700 290 S1260 80 1720 190",
              "M-120 110 C200 60 340 420 760 340 S1320 130 1720 245",
              "M-120 430 C170 520 420 310 800 470 S1330 750 1720 580",
              "M-120 730 C200 620 470 910 850 780 S1340 550 1720 850",
              "M-120 1030 C190 1150 470 890 860 1030 S1350 1270 1720 1140",
            ].map((d, index) => (
              <g key={d} className={index % 2 ? styles.hatIkincil : styles.hat}>
                <path d={d} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </g>
        </svg>

        <section className={styles.sahne} aria-labelledby="partner-baslik">
          <div className={styles.metin}>
            <div className={styles.ustSatir}>
              <p className={styles.bolumEtiketi}>COGNITI İŞ PARTNERLİĞİ</p>
              <button
                type="button"
                className={styles.rehberTetikleyici}
                onClick={() => {
                  setRehberIndeks(0);
                  setRehberAcik(true);
                }}
              >
                <span className={styles.rehberLogoKapsul} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/marka/cogniti-icon.svg" alt="" width={18} height={18} />
                </span>
                <span>AGORA VE ÖDEME MODELİ</span>
              </button>
            </div>

            <h1 id="partner-baslik" className={styles.anaBaslik}>
              Uzmanlığınızı{" "}
              <span className={styles.anaBaslikAltSatir}>sektörle buluşturun</span>
            </h1>
            <p className={styles.vurguCumlesi}>
              Cogniti İş Partnerleri, ilaç ve eczacılık sektörüne yönelik eğitim içeriklerini Agora üzerinden firmalara sunar, bilgi ve deneyimlerini değer yaratan kalıcı bir iş birliğine dönüştürürler.
            </p>

            <div className={styles.yaklasimlar}>
              <div className={styles.yaklasimBlok}>
                <div className={styles.yaklasim}>
                  <p>
                    <strong>Cogniti İş Partneri:</strong> İlaç ve eczacılık sektöründeki firmaların eğitim ve gelişim ihtiyaçlarına yönelik içerik üreten, hazırladığı yayınları <strong>Cogniti Agora</strong> üzerinden firmaların kullanımına sunan uzman içerik ortağıdır.
                  </p>
                </div>
                <div className={styles.yaklasim}>
                  <p>
                    <strong>Kimler İş Partneri Olabilir?</strong> Sağlık, ilaç ve eczacılık sektörü profesyonelleri, kendi alanının uzmanları ya da eğitimcisi olan kişiler ya da eğitim/danışmanlık firmaları, Cogniti iş partneri olarak bilgilerini ve deneyimlerini sunabilirler.
                  </p>
                </div>
              </div>

              <div className={styles.yaklasimBlok}>
                <div className={styles.yaklasim}>
                  <p>
                    <strong>Ücretsiz ve Sınırsız Yayın:</strong> Cogniti İş Partnerliği üyeliği tüm kişi ve firmalar için ücretsizdir. Ayrıca Cogniti İş Partnerleri, <strong>Cogniti Agora</strong>’da hiçbir ücret ödemeden sınırsız yayın açarak ürettikleri içerikleri Cogniti’deki firmaların profesyonellerine sunabilirler.
                  </p>
                </div>
                <div className={styles.yaklasim}>
                  <p>
                    <strong>Şeffaf Hak Ediş ve Ödeme:</strong> Firmalar veya profesyonelleri Agora’daki içeriklerinizi satın aldığında hak edişiniz oluşur. Sözleşmede belirtilen hizmet komisyonu düşüldükten sonra kalan tutarı Mill Danışmanlık’a faturalandırır ve tüm süreci kendi panelinizden şeffaf biçimde takip edersiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.icerik}>
          <section className={styles.bolum} aria-labelledby="nasil-olunur-baslik">
            <p className={styles.bolumEtiketi}>Cogniti İş Partnerliği Başvuru Süreci</p>
            <h2 id="nasil-olunur-baslik" className={styles.bolumBasligi}>Nasıl İş Partneri olunur?</h2>
            <p className={styles.vurguCumlesi}>Üç adımda başvurunuzu tamamlayıp içeriklerinizi sunmaya başlayın.</p>
            <ol className={styles.adimlar}>
              <li className={styles.adim}>
                <span className={styles.adimNo} aria-hidden="true">01</span>
                <h3>Ön Başvuru</h3>
                <p>Üst menüdeki “İş Partneri Başvurusu” butonundan ad soyad, e-posta ve telefon bilgilerinizi iletin.</p>
              </li>
              <li className={styles.adim}>
                <span className={styles.adimNo} aria-hidden="true">02</span>
                <h3>Onay ve Giriş</h3>
                <p>Başvurunuz değerlendirilip onaylandığında giriş bilgileriniz e-posta adresinize gönderilir.</p>
              </li>
              <li className={styles.adim}>
                <span className={styles.adimNo} aria-hidden="true">03</span>
                <h3>Profil ve Başlangıç</h3>
                <p>“Partner Girişi” butonundan portala girerek gerekli bilgileri doldurup Cogniti İş Partnerliği’nizi başlatabilirsiniz.</p>
              </li>
            </ol>
          </section>

          <section className={styles.bolum} aria-labelledby="sonraki-surec-baslik">
            <p className={styles.bolumEtiketi}>Cogniti Agora ve Kazanım Süreci</p>
            <h2 id="sonraki-surec-baslik" className={styles.bolumBasligi}>İş Partneri olduktan sonraki süreç nasıl?</h2>
            <p className={styles.vurguCumlesi}>Panelinizde üretin, Agora’da sergileyin, hak edişlerinizi şeffafça yönetin.</p>
            <ol className={styles.adimlar}>
              <li className={styles.adim}>
                <span className={styles.adimNo} aria-hidden="true">01</span>
                <h3>İçerik oluşturma ve yayımlama</h3>
                <p>İş Partneri Paneli’nde video, podcast, dijital broşür ve bilimsel belge formatlarında hazırladığınız eğitimler onay sonrası Agora’da yayımlanır.</p>
              </li>
              <li className={styles.adim}>
                <span className={styles.adimNo} aria-hidden="true">02</span>
                <h3>İçeriğin firmalar tarafından satın alınması</h3>
                <p>Ortak içerik pazarı Agora’da sergilenen yayınlarınız, Cogniti üyesi firmalar ve profesyonelleri tarafından incelenip satın alınır.</p>
              </li>
              <li className={styles.adim}>
                <span className={styles.adimNo} aria-hidden="true">03</span>
                <h3>Hak ediş ödemesi</h3>
                <p>Hizmet komisyonu düşüldükten sonra kalan tutarı Mill Danışmanlık’a faturalandırır, ödemelerinizi kendi panelinizden takip edersiniz.</p>
              </li>
            </ol>
          </section>
        </div>
      </main>

      {/* Giriş & Başvuru Modalı (Test uyumluluğu için DOM'da hazır tutulur, hidden ile açılır) */}
      <div
        className={styles.modalArkaPlan}
        hidden={!formModalAcik}
        onClick={() => setFormModalAcik(false)}
      >
        <section
          className={styles.card}
          aria-label="İş partneri kayıt ve giriş"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.cardUst}>
            <h2>{gorunum === "kayit" ? "İş Partneri Başvurusu" : "İş Partneri Girişi"}</h2>
            <button
              type="button"
              className={styles.modalKapat}
              onClick={() => setFormModalAcik(false)}
              aria-label="Pencereyi kapat"
            >
              ×
            </button>
          </div>
          <SadeSekmeler
            deger={gorunum}
            onDegistir={setGorunum}
            etiket="İş partneri işlemleri"
            secenekler={[
              {
                deger: "giris",
                etiket: "Giriş Yap",
                icerik: (
                  <form
                    className={styles.form}
                    aria-label="İş partneri giriş formu"
                    aria-busy={girisYapiliyor}
                    onSubmit={girisYap}
                  >
                    <div className={styles.field}>
                      <label htmlFor="partner-giris-eposta">E-Posta</label>
                      <Input
                        id="partner-giris-eposta"
                        type="email"
                        autoComplete="username"
                        required
                        maxLength={254}
                        value={giris.eposta}
                        disabled={girisYapiliyor}
                        onChange={(e) => setGiris({ ...giris, eposta: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="partner-giris-sifre">Şifre</label>
                      <div className={styles.password}>
                        <Input
                          id="partner-giris-sifre"
                          type={sifreGorunur ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          minLength={6}
                          maxLength={128}
                          value={giris.sifre}
                          disabled={girisYapiliyor}
                          onChange={(e) => setGiris({ ...giris, sifre: e.target.value })}
                        />
                        <button
                          type="button"
                          className={styles.eye}
                          aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}
                          aria-pressed={sifreGorunur}
                          onClick={() => setSifreGorunur(!sifreGorunur)}
                        >
                          {sifreGorunur ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                    {girisHatasi && (
                      <p className={styles.notice} role="alert">
                        {girisHatasi}
                      </p>
                    )}
                    <Button type="submit" disabled={girisYapiliyor}>
                      {girisYapiliyor ? "Giriş yapılıyor…" : "Giriş Yap"}
                    </Button>
                  </form>
                ),
              },
              {
                deger: "kayit",
                etiket: "İş Partneri Olunuz",
                icerik: (
                  <form
                    className={styles.form}
                    aria-label="İş partneri üyelik formu"
                    aria-busy={kayitGonderiliyor}
                    onSubmit={kayitGonder}
                  >
                    <div className={styles.field}>
                      <label htmlFor="partner-kayit-ad">Ad Soyad</label>
                      <Input
                        id="partner-kayit-ad"
                        name="ad_soyad"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={150}
                        value={kayit.ad_soyad}
                        disabled={kayitGonderiliyor || kayitAlindi}
                        onChange={(e) => setKayit({ ...kayit, ad_soyad: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="partner-kayit-eposta">E-Posta</label>
                      <Input
                        id="partner-kayit-eposta"
                        name="eposta"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        value={kayit.eposta}
                        disabled={kayitGonderiliyor || kayitAlindi}
                        onChange={(e) => setKayit({ ...kayit, eposta: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="partner-kayit-telefon">Cep Telefonu</label>
                      <Input
                        id="partner-kayit-telefon"
                        name="cep_telefonu"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        maxLength={30}
                        value={kayit.cep_telefonu}
                        disabled={kayitGonderiliyor || kayitAlindi}
                        onChange={(e) => setKayit({ ...kayit, cep_telefonu: e.target.value })}
                      />
                    </div>
                    {kayitHatasi && (
                      <p className={styles.notice} role="alert">
                        {kayitHatasi}
                      </p>
                    )}
                    {kayitAlindi && (
                      <p className={styles.notice} role="status">
                        Başvurunuz alındı. İlk girişiniz için admin onayı bekleniyor.
                      </p>
                    )}
                    <Button type="submit" disabled={kayitGonderiliyor || kayitAlindi}>
                      {kayitGonderiliyor ? "Kaydediliyor…" : "İş Partneri Olunuz"}
                    </Button>
                  </form>
                ),
              },
            ]}
          />
        </section>
      </div>

      {/* Agora ve Ödeme Modeli Rehber Modalı */}
      {rehberAcik && (
        <div
          className={styles.modalArkaPlan}
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-rehber-baslik"
          onClick={() => setRehberAcik(false)}
        >
          <div className={styles.rehberModal} onClick={(e) => e.stopPropagation()}>
            <header className={styles.rehberUst}>
              <div>
                <p className={styles.bolumEtiketi} style={{ marginBottom: 4 }}>
                  COGNITI İŞ PARTNERLİĞİ REHBERİ
                </p>
                <h2 id="partner-rehber-baslik" className={styles.rehberUstBaslik}>
                  Agora, Panel ve Ödeme Modeli
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalKapat}
                onClick={() => setRehberAcik(false)}
                aria-label="Rehberi kapat"
              >
                ×
              </button>
            </header>

            <nav className={styles.rehberSekmeler} aria-label="Rehber bölümleri">
              {REHBER_SEKMELERI.map((sekme, idx) => (
                <button
                  key={sekme.anahtar}
                  type="button"
                  className={`${styles.rehberSekme} ${idx === rehberIndeks ? styles.rehberSekmeAktif : ""}`}
                  onClick={() => setRehberIndeks(idx)}
                >
                  {sekme.sekmeBasligi}
                </button>
              ))}
            </nav>

            <div className={styles.rehberSahne}>
              <p className={styles.bolumEtiketi}>{aktifRehber.etiket}</p>
              <h3 className={styles.rehberSlaytBaslik}>
                {aktifRehber.baslik}{" "}
                <span className={styles.anaBaslikAltSatir} style={{ display: "inline" }}>
                  {aktifRehber.altBaslik}
                </span>
              </h3>
              <div className={styles.rehberKartlar}>
                {aktifRehber.maddeler.map((m, i) => (
                  <div key={m.baslik} className={styles.rehberKart}>
                    <span className={styles.adimNo}>0{i + 1}</span>
                    <h4>{m.baslik}</h4>
                    <p>{m.aciklama}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
