import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { PushAbonelik } from "@/app/providers/PushAbonelik";
import { VARSAYILAN_TEMA } from "@/lib/tema/temalar";
import { TemaProvider } from "@/app/providers/TemaProvider";

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
    <html lang="tr" data-tema={VARSAYILAN_TEMA}>
      <body className={`${nunito.variable}`} style={{ fontFamily: "var(--font-nunito), sans-serif" }}>
        <AuthProvider>
          <TemaProvider>
            {children}
            <PushAbonelik />
          </TemaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
