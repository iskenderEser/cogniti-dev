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
  { baslik: "Yayını tamamlayın", aciklama: "Öğrenme araçlarıyla iletilen yayınları tamamlayın" },
  { baslik: "Soruları cevaplayın", aciklama: "Tamamladığınız yayınların sorularını cevaplayın" },
  { baslik: "Puan kazanın", aciklama: "Tamamladığınız yayınlardan ve doğru cevapladığınız sorulardan puan kazanın" },
] as const;

/** Kullanıcının Cogniti hero SVG'si; metin dar ekranda yeniden akar. */
export default function CognitiHakkinda() {
  const id = useId();

  return (
    <article className={styles.zemin} aria-label="Cogniti Hakkında">
      <header className={styles.sahne}>
        <svg
          className={styles.gorsel}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1728 864"
          preserveAspectRatio="xMinYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient id={`${id}-leftGlow`} cx="10%" cy="49%" r="85%">
              <stop offset="0" stopColor="var(--tema-hakkinda-isik-baslangic)" stopOpacity=".85"/>
              <stop offset=".62" stopColor="var(--tema-hakkinda-isik-orta)" stopOpacity=".65"/>
              <stop offset="1" stopColor="var(--tema-hakkinda-isik-son)" stopOpacity=".08"/>
            </radialGradient>
            <linearGradient id={`${id}-lineBlue`} x1="0" y1="0" x2="1" y2=".35">
              <stop offset="0" stopColor="var(--tema-hakkinda-hat-baslangic)" stopOpacity=".42"/>
              <stop offset=".54" stopColor="var(--tema-hakkinda-hat-orta)" stopOpacity=".26"/>
              <stop offset="1" stopColor="var(--tema-hakkinda-hat-son)" stopOpacity="0"/>
            </linearGradient>
            <filter id={`${id}-softBlur`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="25"/></filter>
            <clipPath id={`${id}-viewport`}><rect width="1728" height="864"/></clipPath>
          </defs>
          <g clipPath={`url(#${id}-viewport)`}>
            <rect width="1728" height="864" fill="var(--tema-yuzey)"/>
            <ellipse cx="-85" cy="450" rx="375" ry="415" fill={`url(#${id}-leftGlow)`} filter={`url(#${id}-softBlur)`}/>
            <path d="M -265 55 C -70 -18 55 33 191 172 C 312 302 333 452 259 635 C 180 820 -29 863 -245 913 Z" fill={`url(#${id}-leftGlow)`} opacity=".60"/>
            <g fill="none" stroke={`url(#${id}-lineBlue)`} strokeWidth="1.15" strokeLinecap="round">
              <path d="M-80 65 C180 6 310 32 514 88 S980 295 1390 287 S1630 227 1810 196"/>
              <path d="M-90 133 C180 90 349 100 525 171 S794 363 1130 410 S1570 407 1800 346"/>
              <path d="M-65 205 C132 186 334 219 535 304 S819 437 1116 441 S1584 425 1815 477"/>
              <path d="M-40 725 C227 706 413 628 625 581 S977 503 1190 529 S1590 655 1800 678"/>
              <path d="M-100 785 C167 859 377 791 549 705 S859 535 1052 517 S1456 617 1800 647"/>
              <path d="M-45 839 C163 763 300 791 525 747 S841 617 1063 599 S1479 725 1810 752"/>
              <path d="M-45 12 C144 118 287 160 482 241 S805 386 1051 412"/>
              <path d="M-25 820 C245 738 374 656 548 578 S890 475 1165 493"/>
              <path d="M-60 551 C100 404 221 282 405 298 S781 399 1100 465" opacity=".42"/>
            </g>
            <g fill="var(--tema-hakkinda-nokta)" opacity=".77">
              <circle cx="344" cy="80" r="6.5"/>
              <circle cx="712" cy="184" r="12"/>
              <circle cx="182" cy="185" r="8"/>
              <circle cx="640" cy="255" r="5"/>
              <circle cx="472" cy="303" r="8"/>
              <circle cx="931" cy="431" r="6" opacity=".38"/>
              <circle cx="962" cy="810" r="7" opacity=".72"/>
              <circle cx="415" cy="641" r="6"/>
              <circle cx="125" cy="707" r="7.5"/>
              <circle cx="470" cy="756" r="10.5"/>
              <circle cx="592" cy="739" r="6" opacity=".57"/>
              <circle cx="702" cy="679" r="4.5" opacity=".3"/>
            </g>
          </g>
        </svg>
        <div className={styles.metin}>
          <p className={styles.bolumEtiketi}>COGNITI NEDİR?</p>
          <p className={styles.aciklama} style={{ fontSize: 14, margin: "0 0 12px" }}>Hap bilgilerle hızlı öğrenme platformudur.</p>
          <h1 className={styles.bolumBasligi}>Öğrenmeyi motive ederek, bilgiyi ulaştırır.</h1>
          <p className={styles.aciklama}>
            Bilgi güvenilir olduğunda öğrenme isteği artar. Cogniti güvenilir bilgiyi farklı öğrenme araçları ile ulaştırır ve
            <br className={styles.aciklamaSatirSonu} />{" "}
            puan ekosistemi sayesinde öğrenmeyi iki kat artırır.
          </p>
        </div>
      </header>

      <div className={styles.icerik}>
        <section className={styles.bolum} aria-labelledby={`${id}-araclar`}>
          <p className={styles.bolumEtiketi}>Öğrenme araçları</p>
          <h2 className={styles.bolumBasligi} id={`${id}-araclar`}>İzleyin, dinleyin, okuyun</h2>
          <p className={styles.bolumAciklamasi}>
            Herkes farklı öğrenir. Farklı öğrenme araçları sayesinde bilgi daha kalıcıdır.
          </p>
          <div className={styles.araclar}>
            {ARACLAR.map(({ tur, simge: Simge }) => (
              <div className={styles.arac} key={tur}>
                <span className={styles.simge} aria-hidden="true"><Simge size={23} strokeWidth={1.5} /></span>
                <h3>{YAYIN_TURU_SUNUMU[tur].etiket}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.bolum} aria-labelledby={`${id}-ogrenme`}>
          <p className={styles.bolumEtiketi}>Öğrenme nasıl işler?</p>
          <h2 className={styles.bolumBasligi} id={`${id}-ogrenme`}>Tamamlayın, cevaplayın, kazanın</h2>
          <ol className={styles.adimlar} aria-label="Öğrenme adımları">
            {ADIMLAR.map((adim, index) => (
              <li className={styles.adim} key={adim.baslik}>
                <span className={styles.adimNo} aria-hidden="true">0{index + 1}</span>
                <h3>{adim.baslik}</h3>
                <p>{adim.aciklama}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
