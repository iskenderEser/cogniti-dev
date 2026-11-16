"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "./cogniti-hakkinda.module.css";

type KitleAnahtari = "firmalar" | "eczaneler" | "danisanlar";

interface SlaytMaddesi {
  baslik: string;
  aciklama: string;
}

interface SlaytVerisi {
  etiket: string;
  baslik: string;
  altBaslik: string;
  maddeler: [SlaytMaddesi, SlaytMaddesi];
}

interface KitleGrubu {
  anahtar: KitleAnahtari;
  sekmeBasligi: string;
  slaytlar: SlaytVerisi[];
}

const KITLE_GRUPLARI: KitleGrubu[] = [
  {
    anahtar: "firmalar",
    sekmeBasligi: "Firmalar",
    slaytlar: [
      {
        etiket: "FİRMALAR  ·  COGNITI E-LEARNING (CEL)",
        baslik: "Saha ekiplerinde kalıcı öğrenme",
        altBaslik: "ve ölçülebilir koçluk",
        maddeler: [
          {
            baslik: "Öğrenmede Rekabet",
            aciklama:
              "Temsilciler yayınları tamamlayıp soruları yanıtladıkça puan kazanır; eğitim tek seferlik toplantı olmaktan çıkıp sahada yaşayan bir sürece dönüşür.",
          },
          {
            baslik: "İkili Çalışmadan Gelişime",
            aciklama:
              "Bölge Müdürleri saha ziyaretleri sonrası temsilcilere nokta atışı gelişim yayınları önerir ve öğrenmenin sonucunu ölçer.",
          },
        ],
      },
      {
        etiket: "FİRMALAR  ·  COGNITI E-PROMOTION (CEP)",
        baslik: "Eczane ve danışanda",
        altBaslik: "ölçülebilir tanıtım etkisi",
        maddeler: [
          {
            baslik: "Eczanede Kalıcı İz",
            aciklama:
              "Saha ekibinin eczacı ve eczane teknisyenlerine ilettiği yayınların tamamlanma oranı ve ilgileri doğrulanmış verilerle ölçülür.",
          },
          {
            baslik: "Danışana Ulaşan Kanıt",
            aciklama:
              "Eczaneler üzerinden danışanlara kanıta dayalı ürün bilgisi ulaştırılarak ürünlerin eczanelerden alınması teşvik edilir.",
          },
        ],
      },
      {
        etiket: "FİRMALAR  ·  YÖNETİM VE ÜRETİM",
        baslik: "Ekonomik bütçe yönetimiyle,",
        altBaslik: "sürekli gelişim",
        maddeler: [
          {
            baslik: "Üretim ve Bütçe Esnekliği",
            aciklama:
              "İster firmanın kendi içerikleriyle ister Agora uzman üretici ağıyla hızlı içerik üretilir; tüm süreçler kullanıma dayalı token modeliyle şeffaf olarak yönetilir.",
          },
          {
            baslik: "Gelişimin Sürekliliği",
            aciklama:
              "Pazarlama, İK, Eğitim, Takım ve Bölge yöneticileri tüm süreci Haftalık, Aylık, Dönemlik ve Yıllık periyotlarla izler.",
          },
        ],
      },
    ],
  },
  {
    anahtar: "eczaneler",
    sekmeBasligi: "Eczaneler",
    slaytlar: [
      {
        etiket: "ECZANELER  ·  DOĞRUDAN VE YALIN BİLGİ",
        baslik: "Yoğun eczane temposunda,",
        altBaslik: "hap bilgiye hızlı erişim",
        maddeler: [
          {
            baslik: "Zamanın İçinde",
            aciklama:
              "İletilen tanıtımları zamanınız dahilinde inceleyebilirsiniz.",
          },
          {
            baslik: "Çoklu Tanıtım Aracı",
            aciklama:
              "Farklı tanıtım araçlarıyla bilgilere ulaşabilirsiniz.",
          },
        ],
      },
      {
        etiket: "ECZANELER  ·  EKİP KATILIMI VE PAYLAŞIM",
        baslik: "Hep birlikte eğlenerek öğrenin",
        altBaslik: "ve danışanlarınıza iletin",
        maddeler: [
          {
            baslik: "Tamamlayın, Cevaplayın, Puan Kazanın",
            aciklama:
              "Tamamlanan yayınlar ve doğru yanıtlanan sorularla puan kazanılır; eczane ekibi güncel ürün içeriklerini birlikte ve keyifle takip eder.",
          },
          {
            baslik: "Danışanlarla Kolay Paylaşım",
            aciklama:
              "Ürünler hakkındaki kanıta dayalı içerikleri danışanlarınıza ileterek, ürünlerin eczanelerden tercih edilmesini teşvik edersiniz.",
          },
        ],
      },
    ],
  },
  {
    anahtar: "danisanlar",
    sekmeBasligi: "Danışanlar",
    slaytlar: [
      {
        etiket: "DANIŞANLAR  ·  KANITA DAYALI BİLGİ",
        baslik: "Güvenilir ve",
        altBaslik: "kanıta dayalı ürün bilgisi",
        maddeler: [
          {
            baslik: "Doğrudan Bilgi Paylaşımı",
            aciklama:
              "İnternetteki doğrulanmamış yorumlar yerine, eczanelerin Cogniti üzerinden paylaştığı kanıta dayalı ürün bilgilerine ulaşırsınız.",
          },
          {
            baslik: "Anlaşılır İçerikler",
            aciklama:
              "Ürünün özelliklerini ve kullanım detaylarını yalın görsel, sesli veya yazılı içeriklerle kolayca incelersiniz.",
          },
        ],
      },
      {
        etiket: "DANIŞANLAR  ·  BİLİNÇLİ TERCİH",
        baslik: "Bilgiye dayalı karar",
        altBaslik: "ve eczanelerden temin",
        maddeler: [
          {
            baslik: "Bilgiye Dayalı Karar",
            aciklama:
              "İhtiyacınıza uygun ürünü kanıta dayalı bilgiler ışığında, aklınızda soru işareti kalmadan değerlendirirsiniz.",
          },
          {
            baslik: "Eczanelerden Temin",
            aciklama:
              "Eczanenizden gelen bilgilerle değerlendirdiğiniz ürünleri, eczanelerinizden güvenle temin edersiniz.",
          },
        ],
      },
    ],
  },
];

export default function CognitiFaydaModali() {
  const [acik, setAcik] = useState(false);
  const [aktifGrupIndex, setAktifGrupIndex] = useState(0);
  const [aktifSlaytIndex, setAktifSlaytIndex] = useState(0);

  const aktifGrup = KITLE_GRUPLARI[aktifGrupIndex];
  const toplamSlayt = aktifGrup.slaytlar.length;
  const aktifSlayt = aktifGrup.slaytlar[aktifSlaytIndex] ?? aktifGrup.slaytlar[0];

  const oncekiSlayt = () => {
    if (aktifSlaytIndex > 0) {
      setAktifSlaytIndex((prev) => prev - 1);
    } else if (aktifGrupIndex > 0) {
      const yeniGrupIdx = aktifGrupIndex - 1;
      setAktifGrupIndex(yeniGrupIdx);
      setAktifSlaytIndex(KITLE_GRUPLARI[yeniGrupIdx].slaytlar.length - 1);
    }
  };

  const sonrakiSlayt = () => {
    if (aktifSlaytIndex < toplamSlayt - 1) {
      setAktifSlaytIndex((prev) => prev + 1);
    } else if (aktifGrupIndex < KITLE_GRUPLARI.length - 1) {
      setAktifGrupIndex((prev) => prev + 1);
      setAktifSlaytIndex(0);
    }
  };

  useEffect(() => {
    if (!acik) return;
    const klavyeDinle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAcik(false);
      } else if (e.key === "ArrowLeft") {
        if (aktifSlaytIndex > 0) {
          setAktifSlaytIndex((p) => p - 1);
        } else if (aktifGrupIndex > 0) {
          const yeniGrup = aktifGrupIndex - 1;
          setAktifGrupIndex(yeniGrup);
          setAktifSlaytIndex(KITLE_GRUPLARI[yeniGrup].slaytlar.length - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (aktifSlaytIndex < toplamSlayt - 1) {
          setAktifSlaytIndex((p) => p + 1);
        } else if (aktifGrupIndex < KITLE_GRUPLARI.length - 1) {
          setAktifGrupIndex((p) => p + 1);
          setAktifSlaytIndex(0);
        }
      }
    };
    window.addEventListener("keydown", klavyeDinle);
    return () => window.removeEventListener("keydown", klavyeDinle);
  }, [acik, aktifGrupIndex, aktifSlaytIndex, toplamSlayt]);

  const ilkSlaytMi = aktifGrupIndex === 0 && aktifSlaytIndex === 0;
  const sonSlaytMi =
    aktifGrupIndex === KITLE_GRUPLARI.length - 1 &&
    aktifSlaytIndex === toplamSlayt - 1;

  return (
    <>
      <button
        type="button"
        className={styles.faydaTetikleyici}
        onClick={() => {
          setAktifGrupIndex(0);
          setAktifSlaytIndex(0);
          setAcik(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={acik}
      >
        <span className={styles.faydaLogoKapsul} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marka/cogniti-icon.svg" alt="" width={18} height={18} />
        </span>
        <span className={styles.faydaTetikleyiciMetin}>
          COGNITI DEĞER ZİNCİRİ
        </span>
      </button>

      {acik && (
        <div
          className={styles.faydaArkaPlan}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cogniti-fayda-baslik"
          onClick={() => setAcik(false)}
        >
          <div
            className={styles.faydaModal}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.faydaUst}>
              <div>
                <p className={styles.faydaUstEtiket}>COGNITI DEĞER ZİNCİRİ</p>
                <h2 id="cogniti-fayda-baslik" className={styles.faydaUstBaslik}>
                  Cogniti’de Olmak Ne Fayda Sağlar?
                </h2>
              </div>
              <button
                type="button"
                className={styles.faydaKapat}
                onClick={() => setAcik(false)}
                aria-label="Sunumu kapat"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </header>

            <nav className={styles.faydaSekmeler} aria-label="Hedef kitle seçimi">
              {KITLE_GRUPLARI.map((grup, idx) => {
                const secili = idx === aktifGrupIndex;
                return (
                  <button
                    key={grup.anahtar}
                    type="button"
                    className={`${styles.faydaSekme} ${secili ? styles.faydaSekmeAktif : ""}`}
                    onClick={() => {
                      setAktifGrupIndex(idx);
                      setAktifSlaytIndex(0);
                    }}
                  >
                    <span>{grup.sekmeBasligi}</span>
                    <span className={styles.faydaSekmeAdet}>
                      {grup.slaytlar.length}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className={styles.faydaSahne}>
              <p className={styles.faydaSlaytEtiket}>{aktifSlayt.etiket}</p>
              <h3 className={styles.faydaSlaytBaslik}>
                {aktifSlayt.baslik}{" "}
                <span className={styles.faydaSlaytAltBaslik}>
                  {aktifSlayt.altBaslik}
                </span>
              </h3>

              <div className={styles.faydaKartlar}>
                {aktifSlayt.maddeler.map((madde, mIdx) => (
                  <div key={madde.baslik} className={styles.faydaKart}>
                    <span className={styles.faydaKartNo}>0{mIdx + 1}</span>
                    <h4 className={styles.faydaKartBaslik}>{madde.baslik}</h4>
                    <p className={styles.faydaKartAciklama}>{madde.aciklama}</p>
                  </div>
                ))}
              </div>
            </div>

            <footer className={styles.faydaAlt}>
              <div className={styles.faydaNoktalar} aria-label="Slayt adımları">
                {aktifGrup.slaytlar.map((s, sIdx) => (
                  <button
                    key={s.baslik}
                    type="button"
                    className={`${styles.faydaNokta} ${sIdx === aktifSlaytIndex ? styles.faydaNoktaAktif : ""}`}
                    onClick={() => setAktifSlaytIndex(sIdx)}
                    aria-label={`${aktifGrup.sekmeBasligi} slayt ${sIdx + 1}`}
                  />
                ))}
                <span className={styles.faydaSayac}>
                  0{aktifSlaytIndex + 1} / 0{toplamSlayt}
                </span>
              </div>

              <div className={styles.faydaOklar}>
                <button
                  type="button"
                  className={styles.faydaOkBtn}
                  onClick={oncekiSlayt}
                  disabled={ilkSlaytMi}
                  aria-label="Önceki slayt"
                >
                  <ChevronLeft size={17} strokeWidth={1.8} />
                  <span>Önceki</span>
                </button>
                <button
                  type="button"
                  className={styles.faydaOkBtn}
                  onClick={sonrakiSlayt}
                  disabled={sonSlaytMi}
                  aria-label="Sonraki slayt"
                >
                  <span>
                    {aktifSlaytIndex === toplamSlayt - 1 &&
                    aktifGrupIndex < KITLE_GRUPLARI.length - 1
                      ? `${KITLE_GRUPLARI[aktifGrupIndex + 1].sekmeBasligi} →`
                      : "Sonraki"}
                  </span>
                  {!(
                    aktifSlaytIndex === toplamSlayt - 1 &&
                    aktifGrupIndex < KITLE_GRUPLARI.length - 1
                  ) && <ChevronRight size={17} strokeWidth={1.8} />}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
