import type { NavContext, NavGrup, NavOge } from "@/components/panel/panelNav.config";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import type { EczanemSidebarAgaci, EczanemSidebarSecim } from "../_types";

interface IcerikKapsami {
  agac: EczanemSidebarAgaci;
  secim?: EczanemSidebarSecim;
  tumIceriklerSecili?: boolean;
  onSecim: (secim: EczanemSidebarSecim) => void;
}

const uyeGorur = (baglam: NavContext) => baglam.kimlikTuru === MUSTERI_ROLU;

/** Görünen adlardan bağımsız; tüm üst kapsam kimliklerini içerir. */
function secimAnahtari(secim: EczanemSidebarSecim): string {
  switch (secim.tip) {
    case "tum": return JSON.stringify(["tum"]);
    case "eczane": return JSON.stringify(["eczane", secim.eczane_id]);
    case "firma": return JSON.stringify(["firma", secim.eczane_id, secim.firma_id]);
    case "urun": return JSON.stringify(["urun", secim.eczane_id, secim.firma_id, secim.urun_id]);
    case "arac": return JSON.stringify(["arac", secim.eczane_id, secim.firma_id, secim.urun_id, secim.yayin_id, secim.arac_id]);
  }
}

/** Ortak masaüstü/mobil menü verisi; API çağrısı yapmaz, verilen ağacı değiştirmez. */
export function eczanemUyeMenusuOlustur(kapsam?: IcerikKapsami): NavGrup[] {
  const menuSecimi = kapsam?.secim && (kapsam.secim.tip === "urun" || kapsam.secim.tip === "arac")
    ? { tip: "firma" as const, eczane_id: kapsam.secim.eczane_id, firma_id: kapsam.secim.firma_id }
    : kapsam?.secim;
  const seciliAnahtar = menuSecimi ? secimAnahtari(menuSecimi) : null;
  const kapsamOgesi = (etiket: string, secim: EczanemSidebarSecim, altOglar?: NavOge[]): NavOge => ({
    anahtar: secimAnahtari(secim),
    etiket,
    secili: kapsam?.secim ? secimAnahtari(secim) === seciliAnahtar : undefined,
    onSecim: kapsam ? () => kapsam.onSecim(secim) : undefined,
    altOglar,
    gate: uyeGorur,
  });

  const gruplar: NavGrup[] = [{
    baslik: "Eczanem",
    oglar: [
      { ...kapsamOgesi("Tüm İçerikler", { tip: "tum" }), ...(kapsam?.tumIceriklerSecili !== undefined ? { secili: kapsam.tumIceriklerSecili && kapsam.secim?.tip === "tum" } : {}), path: "/eczanem", tamEslesme: true },
      { anahtar: "eczanem-puanlarim", etiket: "Puanlarım", path: "/eczanem/puanlarim", gate: uyeGorur },
    ],
  }];
  if (!kapsam || kapsam.agac.length === 0) return gruplar;

  gruplar.push({
    baslik: "Eczanelerim",
    oglar: kapsam.agac.map(eczane => kapsamOgesi(
      eczane.eczane_adi,
      { tip: "eczane", eczane_id: eczane.eczane_id },
      eczane.firmalar.map(firma => kapsamOgesi(
        firma.firma_adi,
        { tip: "firma", eczane_id: eczane.eczane_id, firma_id: firma.firma_id },
      )),
    )),
  });
  return gruplar;
}

/** Diğer üye sayfalarından içerik kapsamına dönülecek adres. */
export function eczanemKapsamYolu(secim: EczanemSidebarSecim): string {
  if (secim.tip === "tum") return "/eczanem";
  const sorgu = new URLSearchParams({ eczane_id: secim.eczane_id });
  if (secim.tip !== "eczane") sorgu.set("firma_id", secim.firma_id);
  return `/eczanem?${sorgu}`;
}
