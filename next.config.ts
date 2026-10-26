import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // npm run build önce bağımsız ve zorunlu typecheck:build çalıştırır.
    // Doğrudan next build çağrıları bu bayrak olmadan tip kontrolünü korur.
    ignoreBuildErrors: process.env.HAPBILGI_TYPES_CHECKED === "1",
  },
  async redirects() {
    return [
      {
        source: "/raporlar/uretim",
        destination: "/raporlar/yayin-raporlari",
        permanent: true,
      },
      {
        source: "/raporlar/yayin-rapolari",
        destination: "/raporlar/yayin-raporlari",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/viva/entegrasyon-onizleme", headers: [
      { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://cogniti-viva.daily.co" },
      { key: "Cache-Control", value: "private, no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ] }];
  },
};

export default nextConfig;
