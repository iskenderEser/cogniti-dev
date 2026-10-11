"use client";
import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";
import type { EclubGezinmeFirmasi } from "@/lib/eclub/firmaGezinme";
import type { EclubEczaneStoreOzetItem } from "./eclubStoreTipler";

export interface VitrinVerisi {
  firma?: EclubGezinmeFirmasi | null;
  cek_yayinlar?: EclubEczaneStoreOzetItem[];
  hata?: string;
  adim?: string;
  detay?: string;
}
export const vitrinOnbellegi = sayfaOkumaOnbellegiOlustur<VitrinVerisi>("cek_vitrin");
