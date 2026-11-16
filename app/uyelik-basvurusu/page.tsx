import Link from "next/link";
import { Clock, LogIn } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { montserrat } from "@/app/_components/montserrat";
import styles from "@/app/login/login.module.css";
import { createClient } from "@/lib/supabase/server";
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
  const oturumVar = !aday && giris === "1" && !token
    ? Boolean((await (await createClient()).auth.getUser()).data.user)
    : false;

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
          <div className="grid flex-1 place-items-center">
            <section aria-labelledby="davet-uyari-basligi" className="w-full max-w-[520px] rounded-[22px] border border-(--tema-cizgi) bg-(--tema-yuzey) px-5 py-9 text-center shadow-[0_14px_40px_rgb(15_23_42/0.06)] sm:px-11 sm:py-14">
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-(--tema-kontrol-eylem)/10 text-(--tema-kontrol-eylem)">
                {oturumVar ? <Clock size={26} aria-hidden="true" /> : <LogIn size={26} aria-hidden="true" />}
              </div>
              <h1 id="davet-uyari-basligi" className="mb-4 text-xl text-(--tema-baslik) sm:text-2xl">
                {oturumVar ? "Kurumsal Üyelik Başvurunuz" : "Kurumsal Üyelik Formu"}
              </h1>
              <p className="leading-relaxed text-(--tema-ikincil-metin)">
                {oturumVar
                  ? "Ön başvurunuz onay bekliyor. Admin onayının ardından e-posta adresinize gönderilecek davet bağlantısını kullanın."
                  : "Kurumsal üyelik formuna erişmek için hesabınızla giriş yapın."}
              </p>
              {!oturumVar && (
                <Link href="/login" className="mt-6 inline-flex items-center justify-center rounded-xl bg-(--tema-kontrol-eylem) px-6 py-2.5 text-sm font-bold text-(--tema-kontrol-eylem-metin) no-underline">
                  Giriş Yap
                </Link>
              )}
            </section>
          </div>
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
