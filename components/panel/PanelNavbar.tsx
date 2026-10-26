// components/panel/PanelNavbar.tsx
//
// Panel üst barı. Sol: logo. Orta: bilgi pill'leri + (UTT/KD_UTT'de) dikey çizgi
// ardından kişisel özet pill'leri (Takım Sırası · Sipariş Puanı) ve FirmaStore kısayolu.
// Sağ: Viva kısayolu + ad-soyad + avatar; Çıkış adın altında.

"use client";

import CognitiLogo from "@/components/marka/CognitiLogo";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

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

      {/* Sipariş Puanı — yalnız FirmaStore aktifse */}
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

export interface PanelNavbarProps {
  adSoyad?: string;
  email?: string;
  // Kişisel özet — yalnız UTT/KD_UTT (BM sonraya). Verilmezse özet pill'leri çizilmez.
  ozet?: { takimSirasi: number | null; siparisPuani: number } | null;
  // Sipariş Puanı pill'i yalnız kullanıcının firmasında FirmaStore aktifse görünür.
  siparisPuaniGoster?: boolean;
  // FirmaStore giriş pill'i yalnız mağazadan kişisel sipariş verebilen rollerde görünür.
  hbStoreGoster?: boolean;
  // Mevcut Viva gezinme yetkisi layout tarafından çözülür.
  vivaGoster?: boolean;
  // Dış müşteri ana sayfası /eclub/ana-sayfa'dir; iç kullanıcıda varsayılan korunur.
  anaSayfaYolu?: string;
  onAnaSayfa?: () => void;
  anaSayfaSecili?: boolean;
  eclubStorePuani?: number | null;
  firmaLogoUrl?: string | null;
  ogrenmePlatformuAktif?: boolean;
  firmaAdi?: string | null;
  temaSeciciGoster?: boolean;
  bilgiPilleri?: { key: string; etiket: string; path: string }[];
  profilMenusu?: ReactNode;
  profilAltBilgi?: string;
  onCikis: () => void;
  onHamburger?: () => void; // mobilde sol drawer'ı açar
}

// Varsayılan bilgi pill'leri; üretici kabuğu boş liste verir.
const BILGI_PILLERI: { key: string; etiket: string; path: string }[] = [
  { key: "ana-sayfa", etiket: "Ana Sayfa", path: "/ana-sayfa" },
];

function ProfilDugmesi({ harfler, menu, mobil = false }: { harfler?: string; menu?: ReactNode; mobil?: boolean }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const alanRef = useRef<HTMLDivElement>(null);
  const dugmeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik || !menu) return;
    const ogeler = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    (ogeler()[0] ?? menuRef.current)?.focus();
    const disariTiklandi = (event: MouseEvent | TouchEvent) => {
      if (!alanRef.current?.contains(event.target as Node)) setAcik(false);
    };
    const tusaBasildi = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setAcik(false);
        dugmeRef.current?.focus();
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        const liste = ogeler();
        if (!liste.length) return;
        event.preventDefault();
        const mevcut = liste.indexOf(document.activeElement as HTMLElement);
        const indeks = event.key === "Home" ? 0 : event.key === "End" ? liste.length - 1
          : (mevcut + (event.key === "ArrowDown" ? 1 : -1) + liste.length) % liste.length;
        liste[indeks].focus();
      } else if (event.key === "Tab") setAcik(false);
    };
    document.addEventListener("mousedown", disariTiklandi);
    document.addEventListener("touchstart", disariTiklandi);
    document.addEventListener("keydown", tusaBasildi);
    return () => {
      document.removeEventListener("mousedown", disariTiklandi);
      document.removeEventListener("touchstart", disariTiklandi);
      document.removeEventListener("keydown", tusaBasildi);
    };
  }, [acik, menu]);

  return <div ref={alanRef} className="relative shrink-0">
    <button ref={dugmeRef} type="button" aria-label="Profil ve hesap menüsü"
      aria-haspopup={menu ? "menu" : undefined} aria-expanded={menu ? acik : undefined}
      onClick={() => { if (menu) setAcik(!acik); else router.push("/profil"); }}
      className={`${mobil ? "w-7 h-7" : "w-8 h-8"} rounded-full flex items-center justify-center text-xs font-bold cursor-pointer shrink-0 p-0`}
      style={{ background: "var(--tema-gezinme-avatar-zemin)", color: "var(--tema-gezinme-metin)", border: mobil ? "none" : "1px solid var(--tema-gezinme-avatar-cizgi)" }}>
      {harfler}
    </button>
    {menu && acik && <div ref={menuRef} role="menu" aria-label="Hesap işlemleri" tabIndex={-1}
      className="absolute right-0 top-full z-[60] mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-3 text-[var(--tema-metin)] shadow-lg"
      onClick={event => { if ((event.target as HTMLElement).closest('[role="menuitem"]')) setAcik(false); }}>
      {menu}
    </div>}
  </div>;
}

export default function PanelNavbar({
  adSoyad,
  email,
  ozet,
  siparisPuaniGoster,
  hbStoreGoster,
  vivaGoster = false,
  anaSayfaYolu = "/ana-sayfa",
  onAnaSayfa,
  anaSayfaSecili,
  eclubStorePuani,
  firmaLogoUrl,
  ogrenmePlatformuAktif,
  firmaAdi,
  bilgiPilleri = BILGI_PILLERI,
  profilMenusu,
  profilAltBilgi,
  onCikis,
  onHamburger,
}: PanelNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [hover, setHover] = useState<string | null>(null);

  // Logo hedefini önceden hazırla; üreticilerde bu hedef Yayın Yönetimi'dir.
  useEffect(() => {
    router.prefetch(anaSayfaYolu);
  }, [anaSayfaYolu, router]);

  const isAktif = (path: string) => path === anaSayfaYolu && anaSayfaSecili !== undefined ? anaSayfaSecili : pathname === path;

  const pillClass = (aktif: boolean) =>
    `relative inline-flex items-center justify-center px-2.5 md:px-3 lg:px-3.5 py-1 rounded-full border-none cursor-pointer text-xs md:text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${aktif ? "font-semibold" : ""}`;

  const pillStyle = (key: string, aktif: boolean): React.CSSProperties => {
    const isHover = hover === key;
    return {
      color: aktif ? "var(--tema-ust-menu-pill-secili-metin)" : "var(--tema-gezinme-metin)",
      background: aktif ? "var(--tema-ust-menu-pill-secili-zemin)" : isHover ? "var(--tema-ust-menu-pill-hover)" : "var(--tema-ust-menu-pill-zemin)",
      boxShadow: aktif ? "inset 0 0 0 1px var(--tema-ust-menu-pill-secili-cizgi)" : "inset 0 0 0 0.5px var(--tema-ust-menu-pill-cizgi)",
      fontFamily: "'Nunito', sans-serif",
    };
  };

  const vivaAktif = pathname === "/viva" || pathname.startsWith("/viva/");
  const vivaPill = () => vivaGoster && <button
    type="button"
    aria-label="Viva'yı aç"
    aria-current={vivaAktif ? "page" : undefined}
    title="Viva"
    onClick={() => router.push("/viva")}
    onMouseEnter={() => setHover("viva")}
    onMouseLeave={() => setHover(null)}
    className={`${pillClass(vivaAktif)} shrink-0 gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tema-kontrol-odak)]`}
    style={{
      padding: "3px 9px",
      background: hover === "viva" ? "var(--tema-kontrol-hover)" : "transparent",
      fontFamily: "'Nunito', sans-serif",
    }}
  >
    {/* SVG logo kendi vektör oranıyla gösterilir. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/marka/viva/viva-mavi-ribon-yatay.svg" alt="Viva" width={62} height={18} style={{ display: "block", objectFit: "contain" }} />
  </button>;

  const bashHarfler = adSoyad
    ? `${adSoyad.split(" ")[0]?.[0] ?? ""}${adSoyad.split(" ")[1]?.[0] ?? ""}`
    : email?.[0]?.toUpperCase();

  return (
    <nav
      id="panel-navbar"
      className="sticky top-0 z-50 border-b border-[var(--tema-cizgi)] px-2.5 py-2.5 sm:px-6 sm:py-3.5 min-h-[64px] sm:min-h-[76px] flex flex-col justify-center"
      style={{ background: "var(--tema-ust-menu-zemin)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottomColor: "var(--tema-cizgi)" }}
    >
      <div className="flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Sol Kolon: Logo & Co-Branding (Ayraç sidebarın 240px sağ kenarı ile tam hizalıdır: 24px padding + 216px = 240px) */}
        <div className="flex items-center flex-shrink-0">
          <div
            id="panel-ana-sayfa"
            onClick={() => { if (onAnaSayfa) onAnaSayfa(); else router.push(anaSayfaYolu); }}
            className="flex items-center md:w-[175px] lg:w-[195px] xl:w-[216px] flex-shrink-0 cursor-pointer group select-none"
          >
            <CognitiLogo
              width={427}
              height={240}
              className="h-10 sm:h-11 md:h-12 lg:h-[48px] xl:h-[54px] w-auto aspect-[901/340] object-contain transition-transform duration-200 group-hover:scale-105"
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
                  className="hidden sm:inline text-[8.5px] sm:text-[9.5px] xl:text-[11.5px] font-normal text-[var(--tema-ust-menu-aciklama)] tracking-tight whitespace-nowrap ml-1 sm:ml-2 xl:ml-2.5"
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
          {bilgiPilleri.length > 0 && <div className="flex items-center gap-1.5 sm:gap-2">
            {bilgiPilleri.map((p) => (
              <button
                key={p.key}
                aria-pressed={isAktif(p.key === "ana-sayfa" ? anaSayfaYolu : p.path)}
                onClick={() => { if (p.key === "ana-sayfa" && onAnaSayfa) onAnaSayfa(); else router.push(p.key === "ana-sayfa" ? anaSayfaYolu : p.path); }}
                onMouseEnter={() => setHover(p.key)}
                onMouseLeave={() => setHover(null)}
                className={pillClass(isAktif(p.key === "ana-sayfa" ? anaSayfaYolu : p.path))}
                style={pillStyle(p.key, isAktif(p.key === "ana-sayfa" ? anaSayfaYolu : p.path))}
              >
                {p.etiket}
              </button>
            ))}
          </div>}

          {bilgiPilleri.length > 0 && <div className="h-5 w-[1px] bg-[var(--tema-ust-menu-ayirici)]" />}
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
              aria-label="FirmaStore'u aç"
            >
              FirmaStore
            </button>
          )}

          {/* Kullanıcı Adı + Avatar + Çıkış (0.5 cm / 22px sol boşlukla puanlardan ayrıldı) */}
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-5 lg:ml-6">
            <div className="flex items-center gap-2">
              {adSoyad && <span className="text-sm font-bold whitespace-nowrap" style={{ color: "var(--tema-gezinme-metin)" }}>{adSoyad}</span>}
              <ProfilDugmesi harfler={bashHarfler} menu={profilMenusu} />
            </div>
            <div className="flex items-center gap-2">
              {profilAltBilgi && <span className="text-[11px] font-semibold text-[var(--tema-ikincil-metin)]">{profilAltBilgi}</span>}
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
          <ProfilDugmesi harfler={bashHarfler} menu={profilMenusu} mobil />
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
      {vivaGoster && <div className="absolute left-1/2 z-[51] flex h-9 w-32 -translate-x-1/2 items-start justify-center pt-0.5" style={{ top: "calc(100% - 1px)" }}>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 128 38" preserveAspectRatio="none" aria-hidden="true" style={{ filter: "drop-shadow(0 3px 3px color-mix(in srgb, var(--tema-metin) 5%, transparent))" }}>
          <path d="M0 1C8 1 10 5 14 17L16 24C19 33 23 37 31 37H97C105 37 109 33 112 24L114 17C118 5 120 1 128 1V-2H0Z" fill="var(--tema-ust-menu-zemin)" />
        </svg>
        {vivaPill()}
      </div>}
    </nav>
  );
}
