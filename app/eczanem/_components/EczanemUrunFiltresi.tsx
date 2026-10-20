"use client";

import { SadeKontrolGrubu, SadeKontrolButonu } from "@/components/kontrol/SadeKontroller";
import type { EczanemSidebarFirma, EczanemSidebarSecim } from "../_types";

interface Props {
  eczaneId: string;
  firma: EczanemSidebarFirma;
  secim: EczanemSidebarSecim;
  onSecim: (secim: EczanemSidebarSecim) => void;
}

/** Ürün kimlikleri yalnız seçili eczane ve firma kapsamında kullanılır. */
export default function EczanemUrunFiltresi({ eczaneId, firma, secim, onSecim }: Props) {
  const urunSecili = (secim.tip === "urun" || secim.tip === "arac") && secim.eczane_id === eczaneId && secim.firma_id === firma.firma_id;
  return <SadeKontrolGrubu tur="sekme" aria-label="Ürün filtresi" className="!flex-nowrap overflow-x-auto">
    <SadeKontrolButonu aria-pressed={!urunSecili} onClick={() => onSecim({ tip: "firma", eczane_id: eczaneId, firma_id: firma.firma_id })}>Tüm Ürünler</SadeKontrolButonu>
    {firma.urunler.map(urun => <SadeKontrolButonu key={JSON.stringify(urun.urun_id)}
      aria-pressed={urunSecili && secim.urun_id === urun.urun_id}
      onClick={() => onSecim({ tip: "urun", eczane_id: eczaneId, firma_id: firma.firma_id, urun_id: urun.urun_id })}>
      {urun.urun_id === null ? "Genel İçerikler" : urun.urun_adi ?? "İsimsiz Ürün"}
    </SadeKontrolButonu>)}
  </SadeKontrolGrubu>;
}
