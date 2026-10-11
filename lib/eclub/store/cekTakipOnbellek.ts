"use client";
import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";
import type { EclubGezinmeFirmasi } from "@/lib/eclub/firmaGezinme";
import type { CekTalepDurumu } from "./eclubStoreTipler";

export interface CekTalebi {
  gorunum_testi_mi?: boolean;
  firma_id: string;
  talep_id: string;
  firma_adi: string;
  urun_id: string | null;
  urun_adi: string;
  talep_eden_kisi_id: string;
  toplanan_puan: number;
  talep_edilen_cek_tl: number;
  siparis_verildi_mi: boolean;
  siparis_adet: number;
  siparis_mal_fazlasi: number;
  durum: CekTalepDurumu;
  cek_kodu: string | null;
  created_at: string;
}

export interface CekTakipVerisi {
  firma?: EclubGezinmeFirmasi | null;
  talepler?: CekTalebi[];
}
export const cekTakipOnbellegi = sayfaOkumaOnbellegiOlustur<CekTakipVerisi>("cek_takip");
