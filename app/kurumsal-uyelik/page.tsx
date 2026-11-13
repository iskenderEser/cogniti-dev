import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adayOturumu } from "@/lib/firma/kurumsalBasvuru";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { montserrat } from "@/app/_components/montserrat";
import YeniFirmaFormu from "@/app/admin/_components/YeniFirmaFormu";
import adminStyles from "@/app/admin/admin.module.css";
import formStyles from "@/app/admin/_components/yeni-firma-formu.module.css";
import IsimListesiSablonu from "./IsimListesiSablonu";
import SozlesmeBelgeleri from "./SozlesmeBelgeleri";
import styles from "@/app/login/login.module.css";

export const metadata: Metadata = { title: "Kurumsal Üyelik | Cogniti" };

const SOZLESME_DOSYASI = "kurumsal-uyelik-sozlesmesi.pdf";

const KULLANICI_SUTUNLARI = ["Takım/Bölüm", "Bölge", "Unvan", "Ad Soyad", "E-posta", "Telefon Numarası"];
const URUN_SUTUNLARI = ["Takım Adı", "Ürün Adı", "PM Adı Soyadı"];

export default async function KurumsalUyelikSayfasi() {
  if (!await adayOturumu()) redirect("/uyelik-basvurusu?giris=1");
  const sozlesmeYolu = existsSync(join(process.cwd(), "public", SOZLESME_DOSYASI)) ? `/${SOZLESME_DOSYASI}` : null;
  return (
    <div className={`${styles.page} ${styles.kurumsalUyelikPage} ${montserrat.variable}`}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/welcome" aria-label="Cogniti ana sayfası">
          <CognitiLogo width={220} height={73} />
        </Link>
        <nav className={styles.welcomeActions} aria-label="Üyelik">
          <Link className={styles.pricingNav} href="/kurumsal-uyelik" aria-current="page">Kurumsal Üyelik Formu</Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className={styles.heading}>Kurumsal Üyelik</h1>
        <section aria-labelledby="firma-bilgileri-baslik">
          <h2 id="firma-bilgileri-baslik" className={styles.kurumsalUyelikAdimBasligi}>
            <span className={styles.kurumsalUyelikAdimNumarasi}>1</span> Firma Bilgileri
          </h2>
          <YeniFirmaFormu kurumsalUyelik secimMenuClassName={`${styles.kurumsalUyelikMenu} ${montserrat.variable}`} />
        </section>
        <section className={styles.kurumsalUyelikSozlesmeler} aria-labelledby="sozlesmeler-baslik">
          <h2 id="sozlesmeler-baslik" className={styles.kurumsalUyelikAdimBasligi}>
            <span className={styles.kurumsalUyelikAdimNumarasi}>2</span> Sözleşmeler
          </h2>
          <SozlesmeBelgeleri sozlesmeYolu={sozlesmeYolu} />
        </section>
        <section className="mt-6" aria-labelledby="kurumsal-listeler-baslik">
          <h2 id="kurumsal-listeler-baslik" className={styles.kurumsalUyelikAdimBasligi}>
            <span className={styles.kurumsalUyelikAdimNumarasi}>3</span> Kurumsal Listeler
          </h2>
          <div className={`${adminStyles.card} ${formStyles.kurumsalKart}`}>
            <div className={`${adminStyles.cardBody} ${formStyles.compactBody}`}>
              <IsimListesiSablonu sutunlar={KULLANICI_SUTUNLARI} />
            </div>
          </div>
          <div className={`${adminStyles.card} ${formStyles.kurumsalKart} mt-4`}>
            <div className={`${adminStyles.cardBody} ${formStyles.compactBody}`}>
              <IsimListesiSablonu sutunlar={URUN_SUTUNLARI} urunListesi />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
