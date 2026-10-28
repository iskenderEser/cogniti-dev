// components/panel/SolListe.tsx
//
// Panel sol gezinme listesi — Faz 1 / Adım 1.3
// (docs/ana_sayfa_kabuk_donusum_is_plani.md).
//
// PANEL_NAV config'ini (Adım 1.1) okur; her grubun gate'i geçen öğelerini dikey
// liste olarak çizer. Ana görev = grup başlığı, altında alt görevler. PANEL_NAV'da
// grup başlığı görünür öğe sayısından bağımsızdır. Yalnız ayrı kimlik kabukları
// config üzerinden başlıksız çizim isteyebilir. Aktif öğe pathname ile vurgulanır.
//
// Rozetler (B kararı): burada çekilmez — layout tek sefer çeker, prop olarak verir
// (tek kaynak, mükerrer istek yok). MobilDrawer da aynı prop'ları alır.
//
// Girdi (NavContext) + rozet prop'ları layout'tan (Adım 1.5) gelir. Masaüstü içindir
// — mobil drawer Adım 1.4'te ayrı gelir.

"use client";

import { useRouter, usePathname } from "next/navigation";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { PANEL_NAV, navOgeAktifMi, navOgeVeyaAltiAktifMi, navSecimIzi, type NavContext, type NavGrup, type NavOge } from "./panelNav.config";
import { prefetchTalepMerkezi } from "@/app/(panel)/talepler/_hooks/talepOnbellek";
import { prefetchYayinOzet } from "@/app/(panel)/yayin-yonetimi/_hooks/ozetOnbellek";
import { prefetchYayinKatalog } from "@/lib/video/katalogOnbellek";
import { prefetchUretimRaporu } from "@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek";
import { useAuth } from "@/app/providers/AuthProvider";

type SolListeProps = NavContext & {
  badge: Record<string, number>;
  altAlan?: ReactNode;
  // Çizilecek ağaç — layout verir (eclub_kisi'de ECLUB_KISI_NAV). Varsayılan PANEL_NAV.
  gruplar?: NavGrup[];
};

export default function SolListe(props: SolListeProps) {
  const gruplar = props.gruplar ?? PANEL_NAV;
  const { kullanici } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const cozPath = (oge: NavOge) => typeof oge.path === "function" ? oge.path(props) : (oge.path ?? "");
  const rozetSayisi = (oge: NavOge) => oge.badgeKey ? (props.badge[oge.badgeKey] ?? 0) : 0;

  const secimIzi = navSecimIzi(gruplar, props);
  const grupAktifMi = (grup: NavGrup) => grup.oglar.some(oge => navOgeVeyaAltiAktifMi(oge, props, pathname));

  const [hover, setHover] = useState<string | null>(null);
  const [kapaliGruplar, setKapaliGruplar] = useState<Set<string>>(() => {
    const gorunurGruplar = gruplar.filter((g) => g.oglar.some((o) => o.gate(props)));
    const kapali = new Set<string>();
    gorunurGruplar.forEach((g, index) => {
      if (index === 0) return; // İlk ana sekme daima açık başlar
      if (grupAktifMi(g)) return; // Aktif sayfanın grubu açık başlar
      kapali.add(g.baslik);
    });
    return kapali;
  });
  const [altOgeDurumlari, setAltOgeDurumlari] = useState<Map<string, { acik: boolean; secimIzi: string }>>(new Map());

  // Sayfa veya görünür gruplar değiştiğinde aktif sayfanın grubu kapalıysa aç; yeni gruplar kapalı başlasın
  useEffect(() => {
    const gorunurGruplar = gruplar.filter((g) => g.oglar.some((o) => o.gate(props)));
    const aktifGrup = gruplar.find((g) => grupAktifMi(g));
    setKapaliGruplar((onceki) => {
      let degisti = false;
      const yeni = new Set(onceki);
      if (aktifGrup && yeni.has(aktifGrup.baslik)) {
        yeni.delete(aktifGrup.baslik);
        degisti = true;
      }
      gorunurGruplar.forEach((g, index) => {
        if (index === 0) return;
        if (grupAktifMi(g)) return;
        if (!yeni.has(g.baslik)) {
          yeni.add(g.baslik);
          degisti = true;
        }
      });
      return degisti ? yeni : onceki;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, props.storeAcik, props.ccAcik, props.eclubAcik, props.eczanemAcik, secimIzi]);

  const grupToggle = (baslik: string) =>
    setKapaliGruplar((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(baslik)) yeni.delete(baslik); else yeni.add(baslik);
      return yeni;
    });

  const Satir = ({ oge, seviye = 0 }: { oge: NavOge; seviye?: number }) => {
    const path = cozPath(oge);
    const aktif = navOgeAktifMi(oge, props, pathname);
    const anahtar = oge.anahtar ?? oge.etiket;
    const isHover = hover === anahtar;
    const sayi = rozetSayisi(oge);

    const onHover = () => {
      setHover(anahtar);
      if (oge.onSecim || !path) return;
      router.prefetch(path);
      if (path === "/yayin-takip" && kullanici?.id) void prefetchTalepMerkezi(kullanici.id);
      else if (path === "/yayin-yonetimi" && kullanici?.id) void prefetchYayinOzet(kullanici.id);
      else if (path === "/sizin-yayinlariniz" && kullanici?.id) void prefetchYayinKatalog("benim", kullanici.id);
      else if (path === "/raporlar/yayin-raporlari" && kullanici?.id) void prefetchUretimRaporu("bu_ay", kullanici.id);
    };

    return (
      <button
        type="button"
        onClick={() => { if (oge.onSecim) oge.onSecim(); else if (path) router.push(path); }}
        aria-pressed={oge.onSecim ? aktif : undefined}
        data-nav-secim={oge.anahtar}
        onMouseEnter={onHover}
        onMouseLeave={() => setHover(null)}
        className="relative w-full flex items-center justify-between rounded-lg cursor-pointer border-none text-left transition-all duration-200"
        style={{
          padding: `7px 10px 7px ${10 + seviye * 8}px`,
          fontSize: "14px",
          fontWeight: aktif ? 700 : 600,
          color: aktif ? "var(--tema-menu-secili-metin)" : path === "/token" ? "var(--tema-kontrol-eylem)" : "var(--tema-gezinme-metin)",
          background: aktif ? "var(--tema-menu-secili-zemin)" : isHover ? "var(--tema-menu-hover)" : "transparent",
          boxShadow: aktif ? "inset 0 0 0 1px var(--tema-menu-secili-halka)" : "none",
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <span>{oge.etiket}</span>
        {sayi > 0 && (
          <span
            className="flex items-center justify-center rounded-full text-[var(--tema-ters-metin)]"
            style={{ minWidth: "18px", height: "18px", padding: "0 5px", background: "var(--tema-vurgu)", fontSize: "10px", fontWeight: 700, lineHeight: 1 }}
          >
            {sayi > 99 ? "99+" : sayi}
          </span>
        )}
      </button>
    );
  };

  const OgeBlogu = ({ oge, seviye = 0 }: { oge: NavOge; seviye?: number }) => {
    const altOglar = (oge.altOglar ?? []).filter((altOge) => altOge.gate(props));
    if (altOglar.length === 0) return Satir({ oge, seviye });
    const anahtar = oge.anahtar ?? oge.etiket;
    const altAktif = (Boolean(oge.onSecim) && navOgeAktifMi(oge, props, pathname))
      || altOglar.some(alt => navOgeVeyaAltiAktifMi(alt, props, pathname));
    const kayit = altOgeDurumlari.get(anahtar);
    const altAcik = oge.onSecim && altAktif && kayit?.secimIzi !== secimIzi ? true : kayit?.acik ?? altAktif;
    const dalDegistir = () => setAltOgeDurumlari(onceki => {
      const yeni = new Map(onceki);
      yeni.set(anahtar, { acik: !altAcik, secimIzi });
      return yeni;
    });
    const sayi = rozetSayisi(oge);
    if (oge.onSecim) {
      return <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          { Satir({ oge, seviye }) }
          <button type="button" onClick={dalDegistir} aria-expanded={altAcik}
            aria-label={`${oge.etiket} alt menüsünü ${altAcik ? "kapat" : "aç"}`}
            data-nav-dal={anahtar}
            className="shrink-0 rounded-lg border-none bg-transparent p-2 text-[var(--tema-gezinme-metin)]"
            style={{ minWidth: "32px", minHeight: "32px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ transform: altAcik ? "rotate(180deg)" : "none" }} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
        {altAcik && <div className="flex flex-col gap-0.5">
          {altOglar.map(altOge => <Fragment key={altOge.anahtar ?? altOge.etiket}>{OgeBlogu({ oge: altOge, seviye: seviye + 1 })}</Fragment>)}
        </div>}
      </div>;
    }

    return (
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={dalDegistir}
          aria-expanded={altAcik}
          className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent text-left"
          style={{ padding: `7px 10px 3px ${10 + seviye * 8}px`, fontSize: "14px", fontWeight: 700, color: "var(--tema-gezinme-metin)", fontFamily: "'Nunito', sans-serif" }}
        >
          <span>{oge.etiket}</span>
          <span className="flex items-center gap-2">
            {sayi > 0 && (
              <span className="flex items-center justify-center rounded-full text-[var(--tema-ters-metin)]" style={{ minWidth: "18px", height: "18px", padding: "0 5px", background: "var(--tema-vurgu)", fontSize: "10px", fontWeight: 700, lineHeight: 1 }}>
                {sayi > 99 ? "99+" : sayi}
              </span>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ transform: altAcik ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
          </span>
        </button>
        {altAcik && (
          <div className="flex flex-col gap-0.5">
            {altOglar.map(altOge => <Fragment key={altOge.anahtar ?? altOge.etiket}>{OgeBlogu({ oge: altOge, seviye: seviye + 1 })}</Fragment>)}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      data-panel-sidebar
      className="hidden md:flex min-h-0 flex-col flex-shrink-0"
      style={{ width: "240px", borderRight: "0.5px solid var(--tema-cizgi)", padding: "16px 12px", background: "var(--tema-yan-zemin)" }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {gruplar.map((grup) => {
          const gorunur = grup.oglar.filter((o) => o.gate(props));
          if (gorunur.length === 0) return null;

          // Ayrı kimlik kabukları başlığı bilinçli olarak gizleyebilir.
          if (grup.baslikGoster === false) {
            return (
              <div key={grup.baslik} className="flex flex-col gap-1" style={grup.ayirac ? { borderTop: "1px solid var(--tema-cizgi)", paddingTop: "12px" } : undefined}>
                {gorunur.map(oge => <Fragment key={oge.anahtar ?? oge.etiket}>{OgeBlogu({ oge })}</Fragment>)}
              </div>
            );
          }

          const acik = !kapaliGruplar.has(grup.baslik);
          return (
            <div key={grup.baslik} className="flex flex-col gap-1">
              <button
                onClick={() => grupToggle(grup.baslik)}
                aria-expanded={acik}
                className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer"
                style={{ fontSize: "12px", fontWeight: 800, color: "var(--tema-baslik)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 10px 4px", fontFamily: "'Nunito', sans-serif" }}
              >
                <span>{grup.baslik}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tema-baslik)" strokeWidth={2.5}
                  style={{ transform: acik ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {acik && gorunur.map(oge => <Fragment key={oge.anahtar ?? oge.etiket}>{OgeBlogu({ oge, seviye: 1 })}</Fragment>)}
            </div>
          );
        })}
      </div>
      {props.altAlan && <div className="mt-4 flex shrink-0 items-center justify-center border-t border-[var(--tema-cizgi)] pt-3 pb-1">{props.altAlan}</div>}
    </aside>
  );
}
