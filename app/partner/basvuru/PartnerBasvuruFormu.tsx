"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Upload } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { partnerKaydiniDogrula } from "@/lib/agora/partnerKaydi";
import { partnerIbanGecerli } from "@/lib/agora/partnerProfil";
import styles from "../partner.module.css";

type PartnerTuru = "kisisel" | "kurumsal";

const EN_FAZLA_UZMANLIK = 10;
const EN_FAZLA_TANITIM_KELIME = 250;
const EN_FAZLA_CV_BOYUTU = 5 * 1024 * 1024;
const CV_UZANTILARI = ".pdf,.doc,.docx";

function kelimeSayisi(metin: string) {
  const temiz = metin.trim();
  return temiz ? temiz.split(/\s+/).length : 0;
}

export default function PartnerBasvuruFormu() {
  const [tur, setTur] = useState<PartnerTuru>("kisisel");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [alindi, setAlindi] = useState(false);
  const [hata, setHata] = useState("");
  const kilidi = useRef(false);

  // Ortak iletişim bilgileri (API kaydı için zorunlu)
  const [adSoyad, setAdSoyad] = useState("");
  const [eposta, setEposta] = useState("");
  const [cepTelefonu, setCepTelefonu] = useState("");

  // Kişisel partnerlik alanları
  const [tcNo, setTcNo] = useState("");
  const [uzmanlikGirdisi, setUzmanlikGirdisi] = useState("");
  const [uzmanliklar, setUzmanliklar] = useState<string[]>([]);
  const [kendiniTanitma, setKendiniTanitma] = useState("");
  const [ozgecmisDosya, setOzgecmisDosya] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [kisiselBankaAdi, setKisiselBankaAdi] = useState("");
  const [kisiselIbanRakam, setKisiselIbanRakam] = useState("");
  const [kisiselHesapAdi, setKisiselHesapAdi] = useState("");

  // Kurumsal partnerlik alanları
  const [firmaAdi, setFirmaAdi] = useState("");
  const [firmaWeb, setFirmaWeb] = useState("");
  const [vergiNo, setVergiNo] = useState("");
  const [vergiDairesi, setVergiDairesi] = useState("");
  const [adres, setAdres] = useState("");
  const [kurumsalBankaAdi, setKurumsalBankaAdi] = useState("");
  const [kurumsalIbanRakam, setKurumsalIbanRakam] = useState("");
  const [kurumsalHesapAdi, setKurumsalHesapAdi] = useState("");

  const kilitli = gonderiliyor || alindi;
  const tanitimKelimeSayisi = kelimeSayisi(kendiniTanitma);

  function uzmanlikEkle(hamMetin = uzmanlikGirdisi) {
    if (kilitli) return;
    const parcalar = hamMetin
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parcalar.length) return;
    setUzmanliklar((onceki) => {
      const sonuc = [...onceki];
      for (const p of parcalar) {
        if (sonuc.length >= EN_FAZLA_UZMANLIK) break;
        if (!sonuc.some((m) => m.toLocaleLowerCase("tr-TR") === p.toLocaleLowerCase("tr-TR"))) {
          sonuc.push(p);
        }
      }
      return sonuc;
    });
    setUzmanlikGirdisi("");
  }

  function uzmanlikTusu(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      uzmanlikEkle();
    }
  }

  function uzmanlikSil(index: number) {
    if (kilitli) return;
    setUzmanliklar((onceki) => onceki.filter((_, i) => i !== index));
  }

  async function gonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kilidi.current || alindi) return;
    setHata("");

    const kontrol = partnerKaydiniDogrula(
      tur === "kisisel"
        ? {
            tur,
            ad_soyad: adSoyad,
            eposta,
            cep_telefonu: cepTelefonu,
            tc_no: tcNo,
            uzmanliklar,
            kendini_tanitma: kendiniTanitma,
            banka_adi: kisiselBankaAdi,
            iban: `TR${kisiselIbanRakam}`,
            hesap_adi: kisiselHesapAdi,
          }
        : {
            tur,
            ad_soyad: adSoyad,
            eposta,
            cep_telefonu: cepTelefonu,
            firma_adi: firmaAdi,
            web_adresi: firmaWeb,
            vergi_no: vergiNo,
            vergi_dairesi: vergiDairesi,
            adres,
            banka_adi: kurumsalBankaAdi,
            iban: `TR${kurumsalIbanRakam}`,
            hesap_adi: kurumsalHesapAdi,
          },
    );
    if (!kontrol.ok) {
      setHata(kontrol.hata);
      return;
    }

    if (tur === "kisisel") {
      if (tanitimKelimeSayisi === 0 || tanitimKelimeSayisi > EN_FAZLA_TANITIM_KELIME) {
        setHata(`Sizi Tanımak İsteriz alanını 1 ile ${EN_FAZLA_TANITIM_KELIME} kelime arasında doldurun.`);
        return;
      }
      if (!ozgecmisDosya) {
        setHata("Özgeçmiş (CV) dosyanızı yükleyin.");
        return;
      }
      if (!partnerIbanGecerli(`TR${kisiselIbanRakam}`)) {
        setHata("IBAN için TR’den sonra 24 rakam girin.");
        return;
      }
    } else {
      if (adres.trim().length < 10) {
        setHata("Fatura adresini en az 10 karakter olarak girin.");
        return;
      }
      if (!partnerIbanGecerli(`TR${kurumsalIbanRakam}`)) {
        setHata("IBAN için TR’den sonra 24 rakam girin.");
        return;
      }
    }

    kilidi.current = true;
    setGonderiliyor(true);
    try {
      const formData = new FormData();
      formData.append("veri", JSON.stringify(kontrol.veri));
      if (tur === "kisisel" && ozgecmisDosya) {
        formData.append("ozgecmis", ozgecmisDosya);
      }
      const response = await fetch("/partner/api/kayit", {
        method: "POST",
        body: formData,
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
        const hataMetni =
          data && typeof data === "object" && "hata" in data && typeof data.hata === "string"
            ? data.hata
            : "Üyelik kaydı tamamlanamadı. Lütfen tekrar deneyin.";
        setHata(hataMetni);
        return;
      }
      setAlindi(true);
    } catch {
      setHata("Üyelik kaydı doğrulanamadı. Lütfen tekrar deneyin.");
    } finally {
      kilidi.current = false;
      setGonderiliyor(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topHeader}>
        <Link href="/welcome" className={styles.brand} aria-label="Cogniti">
          <CognitiLogo width={220} height={73} />
        </Link>
        <nav className={styles.headerActions} aria-label="İş partneri başvuru gezinmesi">
          <Link href="/partner?giris=1" className={styles.loginNavBtn}>
            Partner Girişi
          </Link>
          <Link href="/partner" prefetch={false} className={styles.topBack}>
            ← İş Partnerliği
          </Link>
        </nav>
      </header>

      <main className={styles.basvuruMain}>
        <section className={styles.basvuruKart} aria-labelledby="partner-basvuru-baslik">
          <p className={styles.bolumEtiketi}>COGNITI İŞ PARTNERLİĞİ BAŞVURUSU</p>
          <h1 id="partner-basvuru-baslik" className={styles.basvuruBaslik}>
            Partnerimiz Olur musunuz?
          </h1>
          <p className={styles.basvuruAciklama}>
            Başvuru türünüzü seçip bilgilerinizi iletin; onayınızın ardından panelinize giriş yapabilirsiniz.
          </p>

          <div className={styles.toggleBar}>
            <button
              type="button"
              className={`${styles.toggleLabel} ${tur === "kisisel" ? styles.toggleLabelAktif : ""}`}
              onClick={() => {
                setTur("kisisel");
                setHata("");
              }}
            >
              Kişisel Partnerlik
            </button>
            <button
              type="button"
              role="switch"
              aria-label="Kişisel ve Kurumsal Partnerlik arasında geçiş yap"
              aria-checked={tur === "kurumsal"}
              className={styles.toggleSwitch}
              onClick={() => {
                setTur((onceki) => (onceki === "kisisel" ? "kurumsal" : "kisisel"));
                setHata("");
              }}
            >
              <span className={styles.toggleKnob} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.toggleLabel} ${tur === "kurumsal" ? styles.toggleLabelAktif : ""}`}
              onClick={() => {
                setTur("kurumsal");
                setHata("");
              }}
            >
              Kurumsal Partnerlik
            </button>
          </div>

          <form
            className={styles.form}
            style={{ paddingTop: 0 }}
            aria-label="İş partneri üyelik formu"
            aria-busy={gonderiliyor}
            onSubmit={gonder}
          >
            {tur === "kisisel" ? (
              <>
                <div className={styles.profilGrid}>
                  <div className={styles.field}>
                    <label htmlFor="partner-kayit-ad">Adınız Soyadınız *</label>
                    <Input
                      id="partner-kayit-ad"
                      name="ad_soyad"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={150}
                      value={adSoyad}
                      disabled={kilitli}
                      onChange={(e) => setAdSoyad(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-kayit-tc">TC Numaranız *</label>
                    <Input
                      id="partner-kayit-tc"
                      name="tc_no"
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={tcNo}
                      disabled={kilitli}
                      onChange={(e) => setTcNo(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    />
                    <p className={styles.fieldNote}>
                      Ödemelerde sizin adınıza ödenecek stopaj vergisi için
                    </p>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-kayit-eposta">E-posta Adresiniz *</label>
                    <Input
                      id="partner-kayit-eposta"
                      name="eposta"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={eposta}
                      disabled={kilitli}
                      onChange={(e) => setEposta(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-kayit-telefon">Cep Telefon Numaranız *</label>
                    <Input
                      id="partner-kayit-telefon"
                      name="cep_telefonu"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      maxLength={30}
                      value={cepTelefonu}
                      disabled={kilitli}
                      onChange={(e) => setCepTelefonu(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="partner-kayit-uzmanlik">
                    Uzmanlık Alanınız * ({uzmanliklar.length}/{EN_FAZLA_UZMANLIK})
                  </label>
                  <div className={styles.uzmanlikSatir}>
                    <textarea
                      id="partner-kayit-uzmanlik"
                      rows={2}
                      placeholder="Uzmanlık alanınızı yazıp Enter’a veya Ekle’ye basın (en fazla 10)"
                      value={uzmanlikGirdisi}
                      disabled={kilitli || uzmanliklar.length >= EN_FAZLA_UZMANLIK}
                      onChange={(e) => setUzmanlikGirdisi(e.target.value)}
                      onKeyDown={uzmanlikTusu}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={kilitli || uzmanliklar.length >= EN_FAZLA_UZMANLIK || !uzmanlikGirdisi.trim()}
                      onClick={() => uzmanlikEkle()}
                    >
                      Ekle
                    </Button>
                  </div>
                  {uzmanliklar.length > 0 && (
                    <div className={styles.uzmanlikPilleri} aria-label="Eklenen uzmanlık alanları">
                      {uzmanliklar.map((u, idx) => (
                        <span key={u} className={styles.uzmanlikPill}>
                          <span>{u}</span>
                          <button
                            type="button"
                            className={styles.uzmanlikPillSil}
                            aria-label={`${u} uzmanlığını kaldır`}
                            disabled={kilitli}
                            onClick={() => uzmanlikSil(idx)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className={styles.fieldNote}>
                    Belirttiğiniz uzmanlıklarınız Cogniti Agora’da sizi tanıtmak için gösterilecektir.
                  </p>
                </div>

                <div className={styles.field}>
                  <label htmlFor="partner-kayit-tanitim">
                    Sizi Tanımak İsteriz * ({tanitimKelimeSayisi}/{EN_FAZLA_TANITIM_KELIME} kelime)
                  </label>
                  <textarea
                    id="partner-kayit-tanitim"
                    rows={4}
                    placeholder="Deneyimlerinizi paylaşır mısınız?"
                    value={kendiniTanitma}
                    disabled={kilitli}
                    onChange={(e) => setKendiniTanitma(e.target.value)}
                  />
                  {tanitimKelimeSayisi > EN_FAZLA_TANITIM_KELIME && (
                    <p className={styles.alanHatasi} role="alert">
                      En fazla {EN_FAZLA_TANITIM_KELIME} kelime girebilirsiniz.
                    </p>
                  )}
                </div>

                <div className={styles.cvSatir}>
                  <input
                    ref={cvInputRef}
                    id="partner-kayit-cv"
                    type="file"
                    accept={CV_UZANTILARI}
                    hidden
                    aria-label="Özgeçmiş dosyası"
                    disabled={kilitli}
                    onChange={(e) => {
                      const dosya = e.target.files?.[0] ?? null;
                      if (dosya && dosya.size > EN_FAZLA_CV_BOYUTU) {
                        setHata("Özgeçmiş dosyası en fazla 5 MB olabilir.");
                        setOzgecmisDosya(null);
                        if (cvInputRef.current) cvInputRef.current.value = "";
                        return;
                      }
                      setHata("");
                      setOzgecmisDosya(dosya);
                    }}
                  />
                  {!ozgecmisDosya ? (
                    <button
                      type="button"
                      className={styles.cvButon}
                      disabled={kilitli}
                      onClick={() => cvInputRef.current?.click()}
                    >
                      <Upload size={15} aria-hidden="true" />
                      <span>Özgeçmişinizi Yükleyebilirsiniz *</span>
                    </button>
                  ) : (
                    <>
                      <span className={styles.cvDosyaAdi}>{ozgecmisDosya.name}</span>
                      <button
                        type="button"
                        className={styles.cvAksiyonBaglanti}
                        disabled={kilitli}
                        onClick={() => cvInputRef.current?.click()}
                      >
                        Değiştir
                      </button>
                      <button
                        type="button"
                        className={`${styles.cvAksiyonBaglanti} ${styles.cvSilBaglanti}`}
                        disabled={kilitli}
                        onClick={() => {
                          setOzgecmisDosya(null);
                          if (cvInputRef.current) cvInputRef.current.value = "";
                        }}
                      >
                        Kaldır
                      </button>
                    </>
                  )}
                </div>

                <h2 className={styles.bolumAyrac}>Banka Bilgileri</h2>
                <div className={styles.profilGrid}>
                  <div className={styles.field}>
                    <label htmlFor="partner-kisisel-banka">Banka Adı *</label>
                    <Input
                      id="partner-kisisel-banka"
                      type="text"
                      maxLength={120}
                      value={kisiselBankaAdi}
                      disabled={kilitli}
                      onChange={(e) => setKisiselBankaAdi(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-kisisel-hesap">Hesap Adı *</label>
                    <Input
                      id="partner-kisisel-hesap"
                      type="text"
                      maxLength={150}
                      value={kisiselHesapAdi}
                      disabled={kilitli}
                      onChange={(e) => setKisiselHesapAdi(e.target.value)}
                    />
                  </div>
                  <div className={`${styles.field} ${styles.tamSatir}`}>
                    <label htmlFor="partner-kisisel-iban">IBAN *</label>
                    <div className={styles.ibanAlani}>
                      <span className={styles.ibanOnEk} aria-hidden="true">TR</span>
                      <Input
                        id="partner-kisisel-iban"
                        type="text"
                        inputMode="numeric"
                        maxLength={24}
                        placeholder="24 rakam"
                        value={kisiselIbanRakam}
                        disabled={kilitli}
                        onChange={(e) => setKisiselIbanRakam(e.target.value.replace(/\D/g, "").slice(0, 24))}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.profilGrid}>
                  <div className={`${styles.field} ${styles.tamSatir}`}>
                    <label htmlFor="partner-kayit-ad">Yetkili Adı Soyadı *</label>
                    <Input
                      id="partner-kayit-ad"
                      name="ad_soyad"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={150}
                      value={adSoyad}
                      disabled={kilitli}
                      onChange={(e) => setAdSoyad(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-kayit-eposta">E-posta Adresiniz *</label>
                    <Input
                      id="partner-kayit-eposta"
                      name="eposta"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={eposta}
                      disabled={kilitli}
                      onChange={(e) => setEposta(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-kayit-telefon">Cep Telefon Numaranız *</label>
                    <Input
                      id="partner-kayit-telefon"
                      name="cep_telefonu"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      maxLength={30}
                      value={cepTelefonu}
                      disabled={kilitli}
                      onChange={(e) => setCepTelefonu(e.target.value)}
                    />
                  </div>
                </div>

                <h2 className={styles.bolumAyrac}>Fatura ve Banka Bilgileriniz</h2>
                <div className={styles.profilGrid}>
                  <div className={`${styles.field} ${styles.tamSatir}`}>
                    <label htmlFor="partner-firma-adi">Firma Adı *</label>
                    <Input
                      id="partner-firma-adi"
                      type="text"
                      autoComplete="organization"
                      maxLength={200}
                      value={firmaAdi}
                      disabled={kilitli}
                      onChange={(e) => setFirmaAdi(e.target.value)}
                    />
                  </div>
                  <div className={`${styles.field} ${styles.tamSatir}`}>
                    <label htmlFor="partner-firma-web">Web Adresi *</label>
                    <Input
                      id="partner-firma-web"
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      placeholder="https://ornekfirma.com"
                      maxLength={500}
                      value={firmaWeb}
                      disabled={kilitli}
                      onChange={(e) => setFirmaWeb(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-vergi-no">Vergi Numarası *</label>
                    <Input
                      id="partner-vergi-no"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={vergiNo}
                      disabled={kilitli}
                      onChange={(e) => setVergiNo(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-vergi-dairesi">Vergi Dairesi *</label>
                    <Input
                      id="partner-vergi-dairesi"
                      type="text"
                      maxLength={150}
                      value={vergiDairesi}
                      disabled={kilitli}
                      onChange={(e) => setVergiDairesi(e.target.value)}
                    />
                  </div>
                  <div className={`${styles.field} ${styles.tamSatir}`}>
                    <label htmlFor="partner-adres">Adresi *</label>
                    <textarea
                      id="partner-adres"
                      rows={2}
                      maxLength={1000}
                      value={adres}
                      disabled={kilitli}
                      onChange={(e) => setAdres(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-kurumsal-banka">Banka Adı *</label>
                    <Input
                      id="partner-kurumsal-banka"
                      type="text"
                      maxLength={120}
                      value={kurumsalBankaAdi}
                      disabled={kilitli}
                      onChange={(e) => setKurumsalBankaAdi(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="partner-kurumsal-hesap">Hesap Adı *</label>
                    <Input
                      id="partner-kurumsal-hesap"
                      type="text"
                      maxLength={200}
                      value={kurumsalHesapAdi}
                      disabled={kilitli}
                      onChange={(e) => setKurumsalHesapAdi(e.target.value)}
                    />
                    <p className={styles.fieldNote}>Fatura bilgileri ile aynı olmalıdır</p>
                  </div>
                  <div className={`${styles.field} ${styles.tamSatir}`}>
                    <label htmlFor="partner-kurumsal-iban">IBAN *</label>
                    <div className={styles.ibanAlani}>
                      <span className={styles.ibanOnEk} aria-hidden="true">TR</span>
                      <Input
                        id="partner-kurumsal-iban"
                        type="text"
                        inputMode="numeric"
                        maxLength={24}
                        placeholder="24 rakam"
                        value={kurumsalIbanRakam}
                        disabled={kilitli}
                        onChange={(e) => setKurumsalIbanRakam(e.target.value.replace(/\D/g, "").slice(0, 24))}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {hata && (
              <p className={styles.notice} role="alert">
                {hata}
              </p>
            )}
            {alindi && (
              <p className={styles.notice} role="status">
                Başvurunuz alındı. İlk girişiniz için admin onayı bekleniyor.
              </p>
            )}
            <Button type="submit" disabled={kilitli}>
              {gonderiliyor ? "Kaydediliyor…" : "Başvuruyu Gönder"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
