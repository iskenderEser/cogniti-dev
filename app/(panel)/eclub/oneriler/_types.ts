// app/eclub/oneriler/_types.ts

import type { GONDERIM_LIMITLERI } from "@/lib/eclub/gonderimApi";
import type { YayindakiVideo } from "@/lib/video/yayindakiVideolar";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import { ECLUB_KISI_ROL_ETIKETLERI, type EclubKisiRol } from "@/lib/utils/roller";
import type { SatisSartiTipi, BaremSatiri } from "@/lib/eclub/store/eclubStoreTipler";

export type EclubHedefRol = "eczaci" | "eczane_teknisyeni";

// Önerilebilir yayın (yayinlar GET).
export interface OneriYayin extends Omit<YayindakiVideo, "hedef_roller" | "arac_id" | "arac_turu"> {
  arac_id: string;
  arac_turu: OgrenmeAraciTuru;
  hedef_roller: EclubHedefRol[];
  soru_sayisi?: number | null;
  cek_karsiligi_var_mi?: boolean | null;
  karsilik_puan?: number | null;
  karsilik_tl?: number | null;
  satis_sarti_tipi?: SatisSartiTipi | null;
  gizli_sart_katlama_orani?: number | null;
  barem_tablosu?: BaremSatiri[] | null;
  gonderim_incelemesi_tamamlandi: boolean;
}

// Öneri alıcısı adayı (kisiler GET'ten türetilir).
export interface OneriKisi {
  kisi_id: string;
  ad: string;
  soyad: string;
  rol: EclubKisiRol;
  eczane_adi: string | null;
  aktif_mi: boolean;
  auth_user_id: string | null;
}

export type OneriLimitler = typeof GONDERIM_LIMITLERI;

export interface OneriGecmisKaydi {
  oneri_id: string;
  yayin_id: string;
  arac_id: string;
  arac_turu: OgrenmeAraciTuru;
  urun_adi: string;
  teknik_adi: string;
  talep_no: number | null;
  firma_adi: string | null;
  hedef_roller: EclubHedefRol[];
  kisi_id: string;
  kisi_ad: string;
  kisi_soyad: string;
  kisi_rol: EclubKisiRol | null;
  eczane_adi: string;
  oneri_baslangic: string;
  oneri_bitis: string;
  izlendi_mi: boolean;
  created_at: string;
}

// POST sonucu (atla-raporla).
export interface OneriGonderSonuc {
  gonderilen_sayisi: number;
  gonderilen: string[];
  atlanan: { yayin_id: string; kisi_id: string; sebep: string; yeniden_gonderilebilir_at?: string }[];
}

export const ROL_ETIKETLERI: Record<EclubHedefRol | EclubKisiRol, string> = {
  ...ECLUB_KISI_ROL_ETIKETLERI,
};

// Atlanma sebebi → kullanıcıya gösterilecek açıklama.
export const ATLANMA_SEBEP_ETIKETLERI: Record<string, string> = {
  bulunamadi: "Kişi bulunamadı",
  sahiplik_yok: "Bu kişi sizin eczanenize bağlı değil",
  pasif: "Kişi pasif durumda",
  rol_uyumsuz: "Kişinin rolü öğrenme içeriğinin hedefiyle uyuşmuyor",
  giris_hesabi_yok: "Kişinin giriş hesabı henüz hazır değil",
  tekrar: "Bu kişi için belirlenen tekrar gönderim süresi henüz dolmadı",
  zaten_gonderildi: "Bu yayın kişiye daha önce gönderildi",
  kayit_hatasi: "Kayıt sırasında hata oluştu",
};

export interface GonderimPlanKaydi {
  plan_id: string; kisi_id: string; yayin_id: string; urun_id: string;
  hedef_gonderim_tarihi: string; durum: import('@/lib/eclub/gonderimPlanTipleri').EclubGonderimPlanDurumu;
  oneri_id: string | null; gerceklesti_at: string | null; son_hata_kodu: string | null; created_at: string;
  kisi_ad: string; kisi_soyad: string; kisi_rol: string | null;
  urun_adi: string; firma_adi: string | null; talep_no: number | null;
  hedef_roller: EclubHedefRol[]; arac_turu: OgrenmeAraciTuru | null;
}
export interface TopluGonderimSonucu extends OneriGonderSonuc {
  mesaj: string; planlanan_sayisi: number;
  sonuclar: import('@/lib/eclub/gonderimPlanTipleri').GonderimKontrolSonucu[];
  haftalik_ozet: { kisi_id: string; urun_id: string; haftalik_kalan: number; haftalik_kullanilan: number }[];
  uygun_tarihler: string[];
}
