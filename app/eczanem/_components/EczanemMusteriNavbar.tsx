"use client";

import CognitiLogo from "@/components/marka/CognitiLogo";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  ad: string;
  telefon?: string | null;
  onCikis: () => void | Promise<void>;
  onHesapSil?: () => void;
  onHamburger?: () => void;
}

const BORDO = "var(--tema-yerel-eczanem-vurgu-metin-01)";

const BILGI_PILLERI: { key: string; etiket: string; href: string }[] = [
  { key: "ana-sayfa", etiket: "Ana Sayfa", href: "/eczanem" },
  { key: "puanlarim", etiket: "Puanlarım", href: "/eczanem/puanlarim" },
  { key: "hapbilgi-nedir", etiket: "Nedir", href: "/nedir" },
  { key: "nasil-calisir", etiket: "Nasıl Çalışır", href: "/eczanem/nasil-calisir" },
];

export default function EczanemMusteriNavbar({
  ad,
  telefon,
  onCikis,
  onHesapSil,
  onHamburger,
}: Props) {
  const pathname = usePathname();
  const [hover, setHover] = useState<string | null>(null);
  const [profilAcik, setProfilAcik] = useState(false);
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const profilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profilAcik) return;
    const tiklamaDinle = (e: MouseEvent | TouchEvent) => {
      if (profilRef.current && !profilRef.current.contains(e.target as Node)) {
        setProfilAcik(false);
      }
    };
    const tusDinle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfilAcik(false);
    };
    document.addEventListener("mousedown", tiklamaDinle);
    document.addEventListener("touchstart", tiklamaDinle);
    document.addEventListener("keydown", tusDinle);
    return () => {
      document.removeEventListener("mousedown", tiklamaDinle);
      document.removeEventListener("touchstart", tiklamaDinle);
      document.removeEventListener("keydown", tusDinle);
    };
  }, [profilAcik]);

  useEffect(() => {
    if (!mobilMenuAcik) return;
    const tusDinle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobilMenuAcik(false);
    };
    document.addEventListener("keydown", tusDinle);
    return () => document.removeEventListener("keydown", tusDinle);
  }, [mobilMenuAcik]);

  const hamburgerTiklandi = () => {
    if (onHamburger) {
      onHamburger();
    } else {
      setMobilMenuAcik((prev) => !prev);
    }
  };

  const isAktif = (path: string) => pathname === path;

  const pillClass = (aktif: boolean) =>
    `relative inline-flex items-center justify-center px-3 md:px-4 py-1 rounded-full border-none cursor-pointer text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${aktif ? "font-semibold" : ""}`;

  const pillStyle = (key: string, aktif: boolean): React.CSSProperties => {
    const isHover = hover === key;
    return {
      color: aktif ? BORDO : "var(--tema-yerel-eczanem-ana-metin-19)",
      background: aktif ? "var(--tema-ust-menu-pill-secili-zemin)" : isHover ? "var(--tema-ust-menu-pill-hover)" : "var(--tema-yerel-eczanem-ortu-02)",
      boxShadow: aktif ? "inset 0 0 0 1px var(--tema-ust-menu-pill-secili-cizgi)" : "inset 0 0 0 0.5px var(--tema-yerel-eczanem-golge-04)",
      fontFamily: "'Nunito', sans-serif",
    };
  };

  const bashHarfler = ad
    ? `${ad.trim().split(/\s+/)[0]?.[0] ?? ""}${ad.trim().split(/\s+/)[1]?.[0] ?? ""}`.toUpperCase()
    : "M";

  const yerelCekmece = !onHamburger;

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b border-[var(--tema-yerel-eczanem-cizgi-06)] px-3 py-3 md:px-6 md:py-3.5 min-h-[76px] flex flex-col justify-center"
        style={{
          background: "var(--tema-yerel-eczanem-kart-02)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottomColor: "var(--tema-yerel-eczanem-cizgi-30)",
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Sol Kolon: Logo */}
          <Link
            href="/eczanem"
            aria-label="Cogniti Eczanem ana sayfası"
            className="flex items-center md:w-[216px] flex-shrink-0 cursor-pointer group select-none"
          >
            <CognitiLogo
              width={427}
              height={240}
              className="h-12 md:h-14 lg:h-[62px] w-auto aspect-[901/340] object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>

          {/* Orta-Sol: Bilgi Pill'leri (Masaüstü) */}
          <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 pl-1">
            {BILGI_PILLERI.map((p) => {
              const aktif = isAktif(p.href);
              return (
                <Link
                  key={p.key}
                  href={p.href}
                  aria-current={aktif ? "page" : undefined}
                  onMouseEnter={() => setHover(p.key)}
                  onMouseLeave={() => setHover(null)}
                  className={pillClass(aktif)}
                  style={pillStyle(p.key, aktif)}
                >
                  {p.etiket}
                </Link>
              );
            })}
          </div>

          {/* Sağ Kolon: Masaüstü Profil + Çıkış */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0" style={{ marginRight: 24 }}>



            <div ref={profilRef} className="relative flex flex-col items-end gap-0.5">
              <button
                type="button"
                onClick={() => setProfilAcik((prev) => !prev)}
                aria-label="Profil ve hesap menüsü"
                aria-expanded={profilAcik}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 cursor-pointer select-none group bg-transparent border-none p-0 text-left"
              >
                {ad && (
                  <span
                    className="text-sm font-bold group-hover:opacity-80 transition-opacity"
                    style={{ color: "var(--tema-yerel-eczanem-ana-metin-19)", fontFamily: "'Nunito', sans-serif" }}
                  >
                    {ad}
                  </span>
                )}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all group-hover:ring-2 group-hover:ring-[var(--tema-yerel-eczanem-odak-02)]"
                  style={{ background: "var(--tema-yerel-eczanem-sayfa-zemini-16)", color: "var(--tema-yerel-eczanem-ana-metin-19)", border: "1px solid var(--tema-yerel-eczanem-cizgi-31)" }}
                >
                  {bashHarfler}
                </div>
              </button>

              <div className="flex items-center gap-2">
                {telefon && (
                  <>
                    <span className="text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-04)] select-none">
                      ••• ••• {telefon.slice(-4)}
                    </span>
                    <span style={{ color: "var(--tema-yerel-eczanem-yardimci-metin-30)", fontSize: 11, userSelect: "none" }}>·</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => void onCikis()}
                  className="flex items-center gap-1 text-xs font-semibold cursor-pointer bg-transparent border-none p-0"
                  style={{ color: BORDO, fontFamily: "'Nunito', sans-serif" }}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Çıkış
                </button>
              </div>

              {/* Masaüstü Profil Açılır Menüsü */}
              {profilAcik && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[var(--tema-yerel-eczanem-cizgi-30)] bg-[var(--tema-yerel-eczanem-kart-01)] p-3 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  <div className="flex items-center gap-3 p-2">
                    <div
                      className="size-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: "var(--tema-yerel-eczanem-sayfa-zemini-16)", color: "var(--tema-yerel-eczanem-ana-metin-19)", border: "1px solid var(--tema-yerel-eczanem-cizgi-31)" }}
                    >
                      {bashHarfler}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--tema-yerel-eczanem-ana-metin-02)]">{ad}</p>
                      {telefon ? (
                        <p className="mt-0.5 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-04)]">
                          ••• ••• {telefon.slice(-4)}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-03)]">Telefon bilgisi yok</p>
                      )}
                      <span
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: "var(--tema-ust-menu-pill-secili-zemin)", color: BORDO, border: "1px solid var(--tema-ust-menu-pill-secili-cizgi)" }}
                      >
                        Eczanem Üyesi
                      </span>
                    </div>
                  </div>

                  {onHesapSil && (
                    <>
                      <div className="my-2 border-t border-[var(--tema-yerel-eczanem-cizgi-20)]" />
                      <button
                        type="button"
                        onClick={() => {
                          setProfilAcik(false);
                          onHesapSil();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--tema-yerel-eczanem-islevsel-metin-28)] transition hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-08)] cursor-pointer border-none bg-transparent text-left"
                      >
                        <Trash2 className="size-3.5 text-[var(--tema-yerel-eczanem-islevsel-metin-28)]" />
                        Hesabımı kalıcı olarak sil
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobil Kolon: Avatar + Hamburger */}
          <div className="flex md:hidden items-center gap-2">


            <button
              type="button"
              onClick={hamburgerTiklandi}
              aria-label="Gezinme menüsünü aç"
              aria-expanded={yerelCekmece ? mobilMenuAcik : undefined}
              aria-controls={yerelCekmece ? "eczanem-mobil-drawer" : undefined}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer select-none border-none p-0"
              style={{ background: "var(--tema-yerel-eczanem-sayfa-zemini-16)", color: "var(--tema-yerel-eczanem-ana-metin-19)" }}
            >
              {bashHarfler}
            </button>
            <button
              type="button"
              onClick={hamburgerTiklandi}
              aria-label="Gezinme menüsünü aç"
              aria-expanded={yerelCekmece ? mobilMenuAcik : undefined}
              aria-controls={yerelCekmece ? "eczanem-mobil-drawer" : undefined}
              className="flex flex-col gap-1 p-1 bg-transparent border-none cursor-pointer"
            >
              <span className="block w-4 bg-[var(--tema-yerel-eczanem-eylem-zemin-09)]" style={{ height: "1.5px" }} />
              <span className="block w-4 bg-[var(--tema-yerel-eczanem-eylem-zemin-09)]" style={{ height: "1.5px" }} />
              <span className="block w-4 bg-[var(--tema-yerel-eczanem-eylem-zemin-09)]" style={{ height: "1.5px" }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobil Gezinme Çekmecesi (MobilDrawer Çizgisi) */}
      {mobilMenuAcik && (
        <div
          id="eczanem-mobil-drawer"
          onClick={() => setMobilMenuAcik(false)}
          className="fixed inset-0 z-[60] md:hidden"
          style={{ background: "var(--tema-yerel-eczanem-ortu-03)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0 left-0 h-full overflow-y-auto"
            style={{
              width: "270px",
              maxWidth: "85vw",
              background: "var(--tema-yerel-eczanem-kart-03)",
              boxShadow: "2px 0 16px var(--tema-yerel-eczanem-golge-05)",
              padding: "14px 12px",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {/* Kapat Butonu */}
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={() => setMobilMenuAcik(false)}
                className="bg-transparent border-none cursor-pointer"
                style={{ fontSize: "20px", color: "var(--tema-yerel-eczanem-yardimci-metin-31)", lineHeight: 1, padding: "2px 6px" }}
                aria-label="Menüyü kapat"
              >
                ×
              </button>
            </div>

            {/* Dört Bağlantı (Bilgi Pilleri Sırası) */}
            <div className="flex flex-col gap-1">
              {BILGI_PILLERI.map((p) => {
                const aktif = isAktif(p.href);
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    aria-current={aktif ? "page" : undefined}
                    onClick={() => setMobilMenuAcik(false)}
                    className="w-full flex items-center justify-between rounded-lg cursor-pointer border-none text-left"
                    style={{
                      padding: "10px 12px",
                      fontSize: "14px",
                      fontWeight: aktif ? 700 : 600,
                      color: aktif ? "var(--tema-yerel-eczanem-eylem-metin-08)" : "var(--tema-yerel-eczanem-ana-metin-19)",
                      background: aktif ? "var(--tema-yerel-eczanem-eylem-zemin-10)" : "transparent",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <span>{p.etiket}</span>
                  </Link>
                );
              })}
            </div>

            <div className="h-px my-3" style={{ background: "var(--tema-yerel-eczanem-sayfa-zemini-17)" }} />

            {/* Kullanıcı Profili ve Bilgisi */}
            <div className="px-3 py-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "var(--tema-yerel-eczanem-sayfa-zemini-16)", color: "var(--tema-yerel-eczanem-ana-metin-19)", border: "1px solid var(--tema-yerel-eczanem-cizgi-31)" }}
                >
                  {bashHarfler}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold" style={{ color: "var(--tema-yerel-eczanem-ana-metin-19)" }}>
                    {ad}
                  </p>
                  {telefon ? (
                    <p className="text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-04)]">••• ••• {telefon.slice(-4)}</p>
                  ) : null}
                </div>
              </div>
              {onHesapSil && (
                <button
                  type="button"
                  onClick={() => {
                    setMobilMenuAcik(false);
                    onHesapSil();
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg border-none bg-transparent px-1 py-1.5 text-left text-xs font-semibold cursor-pointer"
                  style={{ color: "var(--tema-yerel-eczanem-islevsel-metin-28)" }}
                >
                  <Trash2 className="size-3.5 text-[var(--tema-yerel-eczanem-islevsel-metin-28)]" />
                  Hesabımı kalıcı olarak sil
                </button>
              )}
            </div>

            <div className="h-px my-3" style={{ background: "var(--tema-yerel-eczanem-sayfa-zemini-17)" }} />

            {/* Çıkış Butonu */}
            <button
              type="button"
              onClick={() => {
                setMobilMenuAcik(false);
                void onCikis();
              }}
              className="w-full flex items-center gap-2 rounded-lg border-none bg-transparent px-3 py-2.5 text-left font-semibold cursor-pointer"
              style={{ color: "var(--tema-yerel-eczanem-vurgu-metin-01)", fontSize: "14px", fontFamily: "'Nunito', sans-serif" }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Çıkış
            </button>
          </div>
        </div>
      )}
    </>
  );
}
