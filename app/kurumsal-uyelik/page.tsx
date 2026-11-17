import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adayOturumu } from "@/lib/firma/kurumsalBasvuru";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { montserrat } from "@/app/_components/montserrat";
import KurumsalOturumKoruyucu from "./KurumsalOturumKoruyucu";
import KurumsalUyelikAkisi from "./KurumsalUyelikAkisi";
import SurecAdimlari from "@/app/uyelik-basvurusu/SurecAdimlari";
import styles from "@/app/login/login.module.css";

export const metadata: Metadata = { title: "Kurumsal Üyelik | Cogniti" };

const SOZLESME_DOSYASI = "kurumsal-uyelik-sozlesmesi.pdf";

const KULLANICI_SUTUNLARI = ["Takım/Bölüm", "Bölge", "Unvan", "Ad Soyad", "E-posta", "Telefon Numarası"];
const URUN_SUTUNLARI = ["Takım Adı", "Barkod", "Ürün Adı", "PM Adı Soyadı"];

export default async function KurumsalUyelikSayfasi() {
  if (!await adayOturumu()) redirect("/uyelik-basvurusu?giris=1");
  const sozlesmeYolu = existsSync(join(process.cwd(), "public", SOZLESME_DOSYASI)) ? `/${SOZLESME_DOSYASI}` : null;
  return (
    <div className={`${styles.page} ${styles.kurumsalUyelikPage} ${montserrat.variable}`}>
      <KurumsalOturumKoruyucu />
      <header className={styles.header}>
        <Link className={styles.brand} href="/welcome" aria-label="Cogniti">
          <CognitiLogo width={220} height={73} />
        </Link>
        <nav className={styles.welcomeActions} aria-label="Üyelik">
          <Link className={styles.pricingNav} href="/kurumsal-uyelik" aria-current="page">Kurumsal Üyelik Formu</Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <SurecAdimlari aktifAdim={3} className="mx-auto mb-6 max-w-xl" />
        <div className="relative mb-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <h1 className={styles.heading} style={{ marginBottom: 0 }}>Kurumsal Üyelik</h1>
          <Link href="/welcome" prefetch={false} className={`${styles.back} sm:absolute sm:right-0`} style={{ margin: 0 }}>
            ← Cogniti’yi tanıyın
          </Link>
        </div>
        <KurumsalUyelikAkisi
          sozlesmeYolu={sozlesmeYolu}
          kullaniciSutunlari={KULLANICI_SUTUNLARI}
          urunSutunlari={URUN_SUTUNLARI}
          secimMenuClassName={`${styles.kurumsalUyelikMenu} ${montserrat.variable}`}
        />
      </main>
    </div>
  );
}
