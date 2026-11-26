import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { PushAbonelik } from "@/app/providers/PushAbonelik";
import { LOGIN_TEMA_BASLANGIC_BETIGI, VARSAYILAN_TEMA } from "@/lib/tema/temalar";
import { TemaProvider } from "@/app/providers/TemaProvider";

import { VivaGorusmeSaglayici } from "@/components/viva/VivaGorusmeSaglayici";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cogniti.net"),
  applicationName: "Cogniti",
  title: "Cogniti",
  description: "Cogniti · bilgi taşır",
  // PWA/push zemini (P1): manifest yüklenebilirlik + iOS "Ana Ekrana Ekle"
  // (iOS Safari push'u yalnız PWA kurulumunda destekler — plan A.5).
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Cogniti",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-tema={VARSAYILAN_TEMA} suppressHydrationWarning>
      <body className={`${nunito.variable}`} style={{ fontFamily: "var(--font-nunito), sans-serif" }}>
        <Script
          id="google-tag-manager"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-P3PS23GF"
          strategy="beforeInteractive"
        />
        <Script id="google-gtag-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>
        <Script id="cogniti-tema-baslangic" strategy="beforeInteractive">
          {LOGIN_TEMA_BASLANGIC_BETIGI}
        </Script>
        <AuthProvider>
          <TemaProvider>
            <VivaGorusmeSaglayici>{children}</VivaGorusmeSaglayici>
            <PushAbonelik />
          </TemaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
