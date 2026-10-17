// components/panel/PanelNavbar.tsx
//
// Panel üst barı. Sol: logo. Orta: bilgi pill'leri + (UTT/KD_UTT'de) dikey çizgi
// ardından kişisel özet pill'leri (Takım Sırası · Sipariş Puanı) ve HBStore kısayolu.
// Sağ: ad-soyad (bordo) + avatar; Çıkış adın altında. Fonksiyonel gezinme sol listede.

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useTema } from "@/app/providers/TemaProvider";
import TemaSecici from "@/components/tema/TemaSecici";

const BORDO = "var(--tema-vurgu)";

// UTT Kişisel Özet Kapsülü — tek şık rozet: Takım: 1 | Sipariş: 1.386
function OzetKapsul({
  ozet,
  siparisPuaniGoster,
}: {
  ozet: { takimSirasi: number | null; siparisPuani: number };
  siparisPuaniGoster?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full leading-tight select-none py-1 px-3"
      style={{
        background: "var(--tema-ust-menu-pill-zemin)",
        boxShadow: "inset 0 0 0 0.5px var(--tema-ust-menu-pill-cizgi)",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Takım Sırası */}
      <div className="flex items-center gap-1 whitespace-nowrap">
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tema-ikincil-metin)" }}>
          Takım Sırası:
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tema-baslik)" }}>
          {ozet.takimSirasi ? `${ozet.takimSirasi}` : "-"}
        </span>
      </div>

      {/* Sipariş Puanı — yalnız HBStore aktifse */}
      {siparisPuaniGoster && (
        <>
          <span style={{ color: "var(--tema-ust-menu-ozet-ayirici)", margin: "0 8px", fontSize: 11, userSelect: "none" }}>|</span>
          {/* Sipariş Puanı */}
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tema-ikincil-metin)" }}>
              Sipariş:
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tema-baslik)" }}>
              {ozet.siparisPuani.toLocaleString("tr-TR")} p
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// Tekil özet pill'i (E-Club Store puanı vb.)
function OzetPill({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full leading-tight select-none py-1.5 px-3.5"
      style={{
        background: "var(--tema-ust-menu-pill-zemin)",
        boxShadow: "inset 0 0 0 0.5px var(--tema-ust-menu-pill-cizgi)",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--tema-ikincil-metin)" }}>{etiket}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--tema-metin)" }}>{deger}</span>
    </div>
  );
}

interface PanelNavbarProps {
  adSoyad?: string;
  email?: string;
  // Kişisel özet — yalnız UTT/KD_UTT (BM sonraya). Verilmezse özet pill'leri çizilmez.
  ozet?: { takimSirasi: number | null; siparisPuani: number } | null;
  // Sipariş Puanı pill'i yalnız kullanıcının firmasında HBStore aktifse görünür.
  siparisPuaniGoster?: boolean;
  // HBStore giriş pill'i yalnız mağazadan kişisel sipariş verebilen rollerde görünür.
  hbStoreGoster?: boolean;
  // Dış müşteri ana sayfası /eclub/ana-sayfa'dir; iç kullanıcıda varsayılan korunur.
  anaSayfaYolu?: string;
  eclubStorePuani?: number | null;
  firmaLogoUrl?: string | null;
  ogrenmePlatformuAktif?: boolean;
  firmaAdi?: string | null;
  temaSeciciGoster?: boolean;
  onCikis: () => void;
  onHamburger?: () => void; // mobilde sol drawer'ı açar
}

// Bilgi pill'leri — sabit sıra, rolden bağımsız.
const BILGI_PILLERI: { key: string; etiket: string; path: string }[] = [
  { key: "ana-sayfa", etiket: "Ana Sayfa", path: "/ana-sayfa" },
  { key: "hapbilgi-nedir", etiket: "HapBilgi Nedir", path: "/hapbilgi-nedir" },
  { key: "nasil-calisir", etiket: "Nasıl Çalışır", path: "/nasil-calisir" },
];

export default function PanelNavbar({
  adSoyad,
  email,
  ozet,
  siparisPuaniGoster,
  hbStoreGoster,
  anaSayfaYolu = "/ana-sayfa",
  eclubStorePuani,
  firmaLogoUrl,
  ogrenmePlatformuAktif,
  firmaAdi,
  temaSeciciGoster = true,
  onCikis,
  onHamburger,
}: PanelNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tema, temaDegistir } = useTema();
  const [hover, setHover] = useState<string | null>(null);

  // Ana Sayfa navbarın sürekli görünen ana hedefidir. Butonla yapılan router.push
  // geçişi Link'in otomatik ön yüklemesini kullanmadığı için rotayı önceden hazırla.
  useEffect(() => {
    router.prefetch(anaSayfaYolu);
  }, [anaSayfaYolu, router]);

  const isAktif = (path: string) => pathname === path;

  const pillClass = (aktif: boolean) =>
    `relative inline-flex items-center justify-center px-2.5 md:px-3 lg:px-3.5 py-1 rounded-full border-none cursor-pointer text-xs md:text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${aktif ? "font-semibold" : ""}`;

  const pillStyle = (key: string, aktif: boolean): React.CSSProperties => {
    const isHover = hover === key;
    return {
      color: aktif ? BORDO : "var(--tema-gezinme-metin)",
      background: aktif ? "var(--tema-ust-menu-pill-secili-zemin)" : isHover ? "var(--tema-ust-menu-pill-hover)" : "var(--tema-ust-menu-pill-zemin)",
      boxShadow: aktif ? "inset 0 0 0 1px var(--tema-ust-menu-pill-secili-cizgi)" : "inset 0 0 0 0.5px var(--tema-ust-menu-pill-cizgi)",
      fontFamily: "'Nunito', sans-serif",
    };
  };

  const bashHarfler = adSoyad
    ? `${adSoyad.split(" ")[0]?.[0] ?? ""}${adSoyad.split(" ")[1]?.[0] ?? ""}`
    : email?.[0]?.toUpperCase();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-[var(--tema-cizgi)] px-2.5 py-2.5 sm:px-6 sm:py-3.5 min-h-[64px] sm:min-h-[76px] flex flex-col justify-center"
      style={{ background: "var(--tema-ust-menu-zemin)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottomColor: "var(--tema-cizgi)" }}
    >
      <div className="flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Sol Kolon: Logo & Co-Branding (Ayraç sidebarın 240px sağ kenarı ile tam hizalıdır: 24px padding + 216px = 240px) */}
        <div className="flex items-center flex-shrink-0">
          <div
            onClick={() => router.push(anaSayfaYolu)}
            className="flex items-center md:w-[175px] lg:w-[195px] xl:w-[216px] flex-shrink-0 cursor-pointer group select-none"
          >
            <Image
              src="/hapbilgi-yatay-TM-1-logo-optimized.png"
              alt="hapbilgi"
              width={427}
              height={240}
              preload
              unoptimized
              className="h-10 sm:h-11 md:h-12 lg:h-[48px] xl:h-[54px] w-auto aspect-[901/340] object-cover transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
            />
          </div>

          {ogrenmePlatformuAktif && firmaLogoUrl && (
            <div className="flex items-center flex-shrink-0 select-none">
              <div className="h-6 sm:h-7 xl:h-8 w-[1.5px] bg-[var(--tema-ust-menu-logo-ayirici)] rounded-full mx-1.5 sm:mx-0" />
              
              <div className="flex items-center flex-shrink-0 pl-0.5 sm:pl-3 xl:pl-4">
                {/* Sabit Bounding Box (72px) */}
                <div className="w-[72px] sm:w-[90px] xl:w-[115px] h-8 sm:h-8.5 xl:h-9 flex items-center justify-center flex-shrink-0">
                  <img
                    src={firmaLogoUrl}
                    alt={firmaAdi ?? "Firma"}
                    className="max-h-full max-w-full object-contain block"
                  />
                </div>
                
                {/* Sabit Metin (8.5px) */}
                <span
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                  className="text-[8.5px] sm:text-[9.5px] xl:text-[11.5px] font-normal text-[var(--tema-ust-menu-aciklama)] tracking-tight whitespace-nowrap ml-1 sm:ml-2 xl:ml-2.5"
                >
                  resmi öğrenme platformu
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Orta: Esnek Boşluk */}
        <div className="flex-1 min-w-0" />

        {/* Sağ Kolon: Bilgi Pill'leri + Puan/Sıra Pill'leri + Kullanıcı Profili */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3.5 flex-shrink-0">
          {/* Bilgi Pill'leri */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {BILGI_PILLERI.map((p) => (
              <button
                key={p.key}
                onClick={() => router.push(p.key === "ana-sayfa" ? anaSayfaYolu : p.path)}
                onMouseEnter={() => setHover(p.key)}
                onMouseLeave={() => setHover(null)}
                className={pillClass(isAktif(p.key === "ana-sayfa" ? anaSayfaYolu : p.path))}
                style={pillStyle(p.key, isAktif(p.key === "ana-sayfa" ? anaSayfaYolu : p.path))}
              >
                {p.etiket}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-[var(--tema-ust-menu-ayirici)]" />
          {ozet && (
            <OzetKapsul ozet={ozet} siparisPuaniGoster={siparisPuaniGoster} />
          )}
          {eclubStorePuani !== null && eclubStorePuani !== undefined && (
            <OzetPill etiket="Store Puanı" deger={eclubStorePuani.toLocaleString("tr-TR")} />
          )}

          {hbStoreGoster && (
            <button
              type="button"
              onClick={() => router.push("/store")}
              className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-extrabold leading-tight text-[var(--tema-ters-metin)] whitespace-nowrap cursor-pointer border-none transition-all duration-200 hover:-translate-y-px hover:brightness-105 active:translate-y-0"
              style={{
                background: "var(--tema-hbstore-zemini)",
                boxShadow: "0 4px 12px var(--tema-hbstore-golge), inset 0 1px 0 var(--tema-hbstore-parilti)",
                fontFamily: "'Nunito', sans-serif",
              }}
              aria-label="HBStore'u aç"
            >
              HBStore
            </button>
          )}

          {/* Kullanıcı Adı + Avatar + Çıkış (0.5 cm / 22px sol boşlukla puanlardan ayrıldı) */}
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-5 lg:ml-6">
            <div className="flex items-center gap-2">
              {adSoyad && <span className="text-sm font-bold whitespace-nowrap" style={{ color: "var(--tema-gezinme-metin)" }}>{adSoyad}</span>}
              <div
                onClick={() => router.push("/profil")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer shrink-0"
                style={{ background: "var(--tema-gezinme-avatar-zemin)", color: "var(--tema-gezinme-metin)", border: "1px solid var(--tema-gezinme-avatar-cizgi)" }}
              >
                {bashHarfler}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onCikis}
                className="flex items-center gap-1 text-xs font-semibold cursor-pointer bg-transparent border-none"
                style={{ color: BORDO }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış
              </button>
            </div>
          </div>
        </div>

        {/* Mobil: avatar + hamburger (sol drawer'ı açar). flex-shrink-0 ile asla kesilmez */}
        <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
          <div
            onClick={() => router.push("/profil")}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
            style={{ background: "var(--tema-gezinme-avatar-zemin)", color: "var(--tema-gezinme-metin)" }}
          >
            {bashHarfler}
          </div>
          <button
            onClick={onHamburger}
            aria-label="Menü"
            className="flex flex-col gap-1 p-1 bg-transparent border-none cursor-pointer"
          >
            <span className="block w-4 bg-[var(--tema-ust-menu-simge)]" style={{ height: "1.5px" }} />
            <span className="block w-4 bg-[var(--tema-ust-menu-simge)]" style={{ height: "1.5px" }} />
            <span className="block w-4 bg-[var(--tema-ust-menu-simge)]" style={{ height: "1.5px" }} />
          </button>
        </div>
      </div>
      {temaSeciciGoster && <TemaSecici tema={tema} onTemaDegistir={temaDegistir} />}
    </nav>
  );
}
