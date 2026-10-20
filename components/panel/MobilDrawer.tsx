// components/panel/MobilDrawer.tsx
//
// Mobil gezinme çekmecesi — Faz 1 / Adım 1.4
// (docs/ana_sayfa_kabuk_donusum_is_plani.md).
//
// Hamburger → soldan açılan drawer. İçerik masaüstüyle aynı kaynaklardan türetilir:
//   • üstte 5 bilgi pill'i (PanelNavbar ile aynı liste),
//   • altında sol liste ağacı (PANEL_NAV + mobil HBStore grubu, aynı gate + rozet mantığı).
// Rozetler prop'tan gelir (B kararı — layout tek sefer çeker). Bir öğeye tıklanınca
// hedefe gidilir ve drawer kapanır.
//
// NOT: Eski tüketici (UTT) bottom-tab bar'ının son biçimi Faz 1 sonu görselle
// kararlaştırılacak; bu adımda drawer ana mobil gezinme olarak eklenir, bottom-tab'a
// dokunulmaz.
//
// Girdi (NavContext) + rozet prop'ları + açık/kapat layout'tan (Adım 1.5) gelir.

"use client";

import { useRouter, usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { PANEL_NAV, mobilPanelNavOlustur, navOgeAktifMi, navOgeVeyaAltiAktifMi, navSecimIzi, type NavContext, type NavGrup, type NavOge } from "./panelNav.config";
import { URETICI_ROLLER } from "@/lib/utils/roller";

type MobilDrawerProps = NavContext & {
  acik: boolean;
  onKapat: () => void;
  onCikis: () => void;
  badge: Record<string, number>;
  anaSayfaYolu?: string;
  onAnaSayfa?: () => void;
  anaSayfaSecili?: boolean;
  bilgiPilleri?: { etiket: string; path: string }[];
  // Çizilecek ağaç — layout verir (eclub_kisi'de ECLUB_KISI_NAV). Varsayılan PANEL_NAV.
  gruplar?: NavGrup[];
};

// PanelNavbar ile birebir aynı bilgi pill'i listesi.
const BILGI_PILLERI: { etiket: string; path: string }[] = [
  { etiket: "Ana Sayfa", path: "/ana-sayfa" },
  { etiket: "Nedir", path: "/nedir" },
  { etiket: "Nasıl Çalışır", path: "/nasil-calisir" },
];

export default function MobilDrawer(props: MobilDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const gruplar = mobilPanelNavOlustur(props.gruplar ?? PANEL_NAV, props);

  const cozPath = (oge: NavOge) => typeof oge.path === "function" ? oge.path(props) : (oge.path ?? "");
  const rozetSayisi = (oge: NavOge) => oge.badgeKey ? (props.badge[oge.badgeKey] ?? 0) : 0;

  const secimIzi = navSecimIzi(gruplar, props);
  const grupAktifMi = (grup: NavGrup) => grup.oglar.some(oge => navOgeVeyaAltiAktifMi(oge, props, pathname));

  const [kapaliGruplar, setKapaliGruplar] = useState<Set<string>>(() => {
    const gorunurGruplar = gruplar.filter((g) => g.oglar.some((o) => o.gate(props)));
    const kapali = new Set<string>();
    gorunurGruplar.forEach((g, index) => {
      if (index === 0) return; // İlk ana sekme açık başlar
      if (grupAktifMi(g)) return; // Aktif sayfanın grubu açık başlar
      kapali.add(g.baslik);
    });
    return kapali;
  });
  const [altOgeDurumlari, setAltOgeDurumlari] = useState<Map<string, { acik: boolean; secimIzi: string }>>(new Map());

  const grupToggle = (baslik: string) =>
    setKapaliGruplar((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(baslik)) yeni.delete(baslik); else yeni.add(baslik);
      return yeni;
    });

  // Sayfa veya görünür gruplar değiştiğinde aktif sayfanın grubu açık kalsın.
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
        if (index === 0 || grupAktifMi(g)) return;
        if (!yeni.has(g.baslik)) {
          yeni.add(g.baslik);
          degisti = true;
        }
      });
      return degisti ? yeni : onceki;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, props.storeAcik, props.ccAcik, props.eclubAcik, props.eclubStoreAcik, props.eczanemAcik, secimIzi]);

  useEffect(() => {
    if (!props.acik || !URETICI_ROLLER.includes(props.rolKucu)) return;
    router.prefetch("/t-club-ligi");
    router.prefetch("/raporlar/tclub-uretici");
  }, [props.acik, props.rolKucu, router]);

  if (!props.acik) return null;

  const git = (path: string) => { router.push(path); props.onKapat(); };
  const cikis = () => { props.onKapat(); props.onCikis(); };

  const Satir = ({ etiket, path, sayi, girintili = false, tamEslesme = false, aktifYollar, secili, onSecim, anahtar }: { etiket: string; path: string; sayi?: number; girintili?: boolean; tamEslesme?: boolean; aktifYollar?: string[]; secili?: boolean; onSecim?: () => void; anahtar?: string }) => {
    const aktif = secili ?? (Boolean(path && (tamEslesme ? pathname === path : pathname === path || pathname.startsWith(`${path}/`))) || aktifYollar?.some((yol) => pathname === yol || pathname.startsWith(`${yol}/`)) === true);
    return (
      <button
        type="button"
        onClick={() => { if (onSecim) { onSecim(); props.onKapat(); } else if (path) git(path); }}
        aria-pressed={onSecim ? aktif : undefined}
        data-nav-secim={anahtar}
        className="w-full flex items-center justify-between rounded-lg cursor-pointer border-none text-left"
        style={{
          padding: girintili ? "10px 12px 10px 20px" : "10px 12px",
          fontSize: "14px",
          fontWeight: aktif ? 700 : 600,
          color: aktif ? "var(--tema-menu-secili-metin)" : "var(--tema-gezinme-metin)",
          background: aktif ? "var(--tema-menu-secili-zemin)" : "transparent",
          fontFamily: "'Nunito', sans-serif",
          minHeight: "44px",
        }}
      >
        <span>{etiket}</span>
        {sayi && sayi > 0 ? (
          <span
            className="flex items-center justify-center rounded-full text-[var(--tema-ters-metin)]"
            style={{ minWidth: "18px", height: "18px", padding: "0 5px", background: "var(--tema-vurgu)", fontSize: "10px", fontWeight: 700, lineHeight: 1 }}
          >
            {sayi > 99 ? "99+" : sayi}
          </span>
        ) : null}
      </button>
    );
  };

  const OgeBlogu = ({ oge, girintili = false }: { oge: NavOge; girintili?: boolean }) => {
    const altOglar = (oge.altOglar ?? []).filter((altOge) => altOge.gate(props));
    if (altOglar.length === 0) return Satir({ etiket: oge.etiket, path: cozPath(oge), sayi: rozetSayisi(oge), girintili, tamEslesme: oge.tamEslesme, aktifYollar: oge.aktifYollar, secili: oge.secili, onSecim: oge.onSecim, anahtar: oge.anahtar });
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
          { Satir({ etiket: oge.etiket, path: cozPath(oge), sayi, girintili, secili: oge.secili, onSecim: oge.onSecim, anahtar: oge.anahtar }) }
          <button type="button" onClick={dalDegistir} aria-expanded={altAcik}
            aria-label={`${oge.etiket} alt menüsünü ${altAcik ? "kapat" : "aç"}`}
            data-nav-dal={anahtar}
            className="shrink-0 rounded-lg border-none bg-transparent p-2 text-[var(--tema-gezinme-metin)]"
            style={{ minWidth: "32px", minHeight: "44px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ transform: altAcik ? "rotate(180deg)" : "none" }} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
        {altAcik && <div className="flex flex-col gap-0.5 pl-3">
          {altOglar.map(altOge => <Fragment key={altOge.anahtar ?? altOge.etiket}>{OgeBlogu({ oge: altOge, girintili: true })}</Fragment>)}
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
          style={{ padding: girintili ? "10px 12px 4px 20px" : "10px 12px 4px", minHeight: "44px", fontSize: "14px", fontWeight: 700, color: "var(--tema-gezinme-metin)", fontFamily: "'Nunito', sans-serif" }}
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
          <div className="flex flex-col gap-0.5 pl-3">
            {altOglar.map(altOge => <Fragment key={altOge.anahtar ?? altOge.etiket}>{OgeBlogu({ oge: altOge, girintili: true })}</Fragment>)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={props.onKapat}
      className="fixed inset-0 z-[60] md:hidden"
      style={{ background: "var(--tema-mobil-menu-ortu)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 left-0 h-full overflow-y-auto"
        style={{ width: "270px", maxWidth: "85vw", background: "var(--tema-yan-zemin)", boxShadow: "2px 0 16px var(--tema-mobil-menu-golge)", padding: "14px 12px" }}
      >
        {/* Kapat */}
        <div className="flex justify-end mb-1">
          <button
            onClick={props.onKapat}
            className="bg-transparent border-none cursor-pointer"
            style={{ fontSize: "20px", color: "var(--tema-yardimci-metin)", lineHeight: 1, padding: "2px 6px" }}
          >
            ×
          </button>
        </div>

        {/* Bilgi pilleri */}
        <div className="flex flex-col gap-1">
          {(props.bilgiPilleri ?? BILGI_PILLERI).map((p) => (
            <Fragment key={p.path}>{Satir({ etiket: p.etiket, secili: p.etiket === "Ana Sayfa" ? props.anaSayfaSecili : undefined, onSecim: p.etiket === "Ana Sayfa" ? props.onAnaSayfa : undefined, path: p.etiket === "Ana Sayfa" ? (props.anaSayfaYolu ?? p.path) : p.path, tamEslesme: true })}</Fragment>
          ))}
        </div>

        <div className="h-px my-3" style={{ background: "var(--tema-mobil-menu-ayirici)" }} />

        {/* Fonksiyonel ağaç */}
        <div className="flex flex-col gap-4">
          {gruplar.map((grup) => {
            const gorunur = grup.oglar.filter((o) => o.gate(props));
            if (gorunur.length === 0) return null;

            if (grup.baslikGoster === false) {
              return (
                <div key={grup.baslik} className="flex flex-col gap-1">
                  {gorunur.map(oge => <Fragment key={oge.anahtar ?? oge.etiket}>{OgeBlogu({ oge })}</Fragment>)}
                </div>
              );
            }

            const acik = !kapaliGruplar.has(grup.baslik);
            return (
              <div key={grup.baslik} className="flex flex-col gap-1">
                <button
                  type="button"
                  data-kity-menu={encodeURIComponent(grup.baslik)}
                  aria-expanded={acik}
                  onClick={() => grupToggle(grup.baslik)}
                  className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent"
                  style={{ minHeight: "44px", fontSize: "12px", fontWeight: 800, color: grup.baslik === "HBStore" ? "var(--tema-hbstore-vurgu)" : "var(--tema-baslik)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 12px 4px", fontFamily: "'Nunito', sans-serif" }}
                >
                  <span>{grup.baslik}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tema-baslik)" strokeWidth={2.5}
                    style={{ transform: acik ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {acik && gorunur.map(oge => <Fragment key={oge.anahtar ?? oge.etiket}>{OgeBlogu({ oge, girintili: true })}</Fragment>)}
              </div>
            );
          })}
        </div>

        <div className="h-px my-3" style={{ background: "var(--tema-mobil-menu-ayirici)" }} />
        <button
          onClick={cikis}
          className="w-full flex items-center gap-2 rounded-lg border-none bg-transparent px-3 py-2.5 text-left font-semibold cursor-pointer"
          style={{ color: "var(--tema-vurgu)", fontSize: "14px", fontFamily: "'Nunito', sans-serif" }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış
        </button>
      </div>
    </div>
  );
}
