import { useId } from "react";
import { BookOpen, FileImage, Headphones, Play } from "lucide-react";
import { YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";
import styles from "./cogniti-hakkinda.module.css";

const ARACLAR = [
  { tur: "video", simge: Play },
  { tur: "podcast", simge: Headphones },
  { tur: "gorsel", simge: FileImage },
  { tur: "flip_pdf", simge: BookOpen },
] as const;

const ADIMLAR = [
  { baslik: "Yayını tamamlayın", aciklama: "Tanıtım ve öğrenme araçlarıyla iletilen yayınları tamamlayın" },
  { baslik: "Soruları cevaplayın", aciklama: "Tamamladığınız yayınların sorularını cevaplayın" },
  { baslik: "Puan kazanın", aciklama: "Tamamladığınız yayınlardan ve doğru cevapladığınız sorulardan puan kazanın" },
] as const;

/** Metin alanı sakin tutulan, sayfa boyunca kenarlardan akan bilgi çizgileri. */
export default function CognitiHakkinda() {
  const id = useId();

  return (
    <article className={styles.zemin} aria-label="Cogniti Hakkında">
      <svg
        className={styles.gorsel}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1600 1200"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${id}-kenar-akisi`}>
            <stop offset="0" stopColor="white" stopOpacity=".8" />
            <stop offset=".1" stopColor="white" stopOpacity=".35" />
            <stop offset=".23" stopColor="white" stopOpacity="0" />
            <stop offset=".77" stopColor="white" stopOpacity="0" />
            <stop offset=".9" stopColor="white" stopOpacity=".35" />
            <stop offset="1" stopColor="white" stopOpacity=".8" />
          </linearGradient>
          <mask id={`${id}-metin-korumasi`}>
            <rect width="1600" height="1200" fill={`url(#${id}-kenar-akisi)`} />
          </mask>
        </defs>
        <g mask={`url(#${id}-metin-korumasi)`} fill="none" stroke="#237ac8" strokeWidth="1" strokeLinecap="round">
          {[
            "M-120 65 C180 20 300 350 700 290 S1260 80 1720 190",
            "M-120 110 C200 60 340 420 760 340 S1320 130 1720 245",
            "M-120 200 C180 330 380 60 740 180 S1270 520 1720 390",
            "M-120 430 C170 520 420 310 800 470 S1330 750 1720 580",
            "M-120 650 C220 540 440 810 810 690 S1320 460 1720 760",
            "M-120 730 C200 620 470 910 850 780 S1340 550 1720 850",
            "M-120 940 C180 1080 430 770 820 930 S1320 1190 1720 1040",
            "M-120 1030 C190 1150 470 890 860 1030 S1350 1270 1720 1140",
          ].map((d, index) => (
            <g key={d} className={index % 2 ? styles.hatIkincil : styles.hat}>
              <path d={d} vectorEffect="non-scaling-stroke" />
              <path
                d={d}
                pathLength="1000"
                vectorEffect="non-scaling-stroke"
                className={styles.akis}
                style={{ animationDelay: `${index * -7}s` }}
              />
            </g>
          ))}
        </g>
      </svg>
      <header className={styles.sahne}>

        <div className={styles.metin}>
          <p className={styles.bolumEtiketi}>COGNITI NEDİR?</p>
          <h1 className={`${styles.bolumBasligi} ${styles.anaBaslik}`}>
            İlaç ve eczacılık sektörüne odaklı{" "}
            <span className={styles.anaBaslikAltSatir}>e-öğrenme ve e-tanıtım platformudur</span>
          </h1>
          <p className={styles.vurguCumlesi}>Her tanıtım, karşılıklı öğrenmedir.</p>
          <div className={styles.yaklasimlar}>
            <div className={styles.yaklasim}>
              <p>E-öğrenme uygulaması, saha ekiplerinin verimli tanıtım yapabilmeleri için ihtiyaçları olan sürekli öğrenme fırsatını sunar.</p>
            </div>
            <div className={styles.yaklasim}>
              <p>E-tanıtım uygulaması, merkezine saha ekiplerini alarak eczacılara, eczane teknisyenlerine ve son tüketiciye kadar kanıta dayalı bilgiyi ulaştırır.</p>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.icerik}>


        <section className={styles.bolum} aria-labelledby={`${id}-araclar`}>
          <p className={styles.bolumEtiketi}>Tanıtım ve Öğrenme Araçları</p>
          <h2 className={styles.bolumBasligi} id={`${id}-araclar`}>İzleyin, dinleyin, okuyun</h2>
          <p className={styles.bolumAciklamasi}>
            Herkes farklı öğrenir. Farklı tanıtım ve öğrenme araçları sayesinde verimlilik artar.
          </p>
          <div className={styles.araclar}>
            {ARACLAR.map(({ tur, simge: Simge }) => (
              <div className={styles.arac} key={tur}>
                <span className={styles.simge} aria-hidden="true"><Simge size={23} strokeWidth={1.5} /></span>
                <h3>{tur === "flip_pdf" ? "Bilimsel Belge" : YAYIN_TURU_SUNUMU[tur].etiket}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.bolum} aria-labelledby={`${id}-ogrenme`}>
          <p className={styles.bolumEtiketi}>Tanıtım ve Öğrenme Süreci</p>
          <h2 className={styles.bolumBasligi} id={`${id}-ogrenme`}>Tamamlayın, cevaplayın, kazanın</h2>
          <p className={styles.bolumAciklamasi}>Öğrenme motive edildiğinde, tanıtım kalıcı olur.</p>
          <ol className={styles.adimlar} aria-label="Öğrenme adımları">
            {ADIMLAR.map((adim, index) => (
              <li className={styles.adim} key={adim.baslik}>
                <span className={styles.adimNo} aria-hidden="true">0{index + 1}</span>
                <p>{adim.aciklama}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
