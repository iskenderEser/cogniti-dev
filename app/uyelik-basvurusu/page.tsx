import Link from "next/link";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { montserrat } from "@/app/_components/montserrat";
import styles from "@/app/login/login.module.css";
import { adayOturumu } from "@/lib/firma/kurumsalBasvuru";
import BasvuruIslemi from "./BasvuruIslemi";

export const metadata = { title: "Üyelik Başvurusu | Cogniti", referrer: "no-referrer" as const };

export default async function UyelikBasvurusu({
  searchParams,
}: {
  searchParams: Promise<{ davet?: string; giris?: string }>;
}) {
  const { davet, giris } = await searchParams;
  const token = typeof davet === "string" ? davet : "";
  const aday = await adayOturumu();

  return (
    <div className={`${montserrat.className} ${styles.uyelikBasvurusuPage} flex min-h-svh flex-col bg-white text-slate-900`}>
      <header className={styles.header}>
        <Link href="/welcome" className={styles.brand} aria-label="Cogniti">
          <CognitiLogo width={220} height={73} />
        </Link>
        <Link href="/welcome" prefetch={false} className={styles.back} style={{ margin: 0 }}>
          ← Cogniti’yi tanıyın
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-10">
        {aday ? (
          <nav aria-label="Üyelik"><Link href="/kurumsal-uyelik">Kurumsal Üyelik Formu</Link></nav>
        ) : giris === "1" && !token ? (
          <p className="text-center">Kurumsal üyelik formuna erişmek için e-postanızdaki daveti kabul edin.</p>
        ) : (
          <>
            {token && (
              <p className="mb-7 text-xs leading-relaxed">Daveti kabul etmek için kurumsal e-posta adresiniz ve ön başvuruda belirlediğiniz şifreyle giriş yapın.</p>
            )}
            <BasvuruIslemi token={token} />
          </>
        )}
      </main>
    </div>
  );
}
