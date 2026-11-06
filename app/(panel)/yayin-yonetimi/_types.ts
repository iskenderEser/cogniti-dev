// app/yayin-yonetimi/_types.ts
//
// Yayın yönetimi sayfasının paylaşılan tip sözleşmeleri ve sabitleri.
// page.tsx, hook ve alt bileşenler buradan import eder.

import type { EczanemKazanimModeli } from "@/lib/eczanem/kazanimModeli";
import type { HedefRoller, Soru } from "@/app/(panel)/talepler/_types";
import { ECLUB_ORTAK_YAYIN_GRUBU, YAYIN_HEDEF_GRUP_SIRASI, type YayinHedefGrubu } from "@/lib/utils/roller";
import {
  type SatisSartiTipi,
  type BaremSatiri,
  VARSAYILAN_BAREM_TABLOSU,
} from "@/lib/eclub/store/eclubStoreTipler";

export type { SatisSartiTipi, BaremSatiri };
export { VARSAYILAN_BAREM_TABLOSU };

// ============================================================================
// Tipler
// ============================================================================

// Bekleyen: onaylanmış, henüz yayınlanmamış soru seti + video (puanlama bekliyor).
export interface Bekleyen {
  talep_id?: string;
  agora_siparis_id?: string | null;
  agora_ayarlandi?: boolean;
  soru_seti_durum_id: string;
  soru_seti_id: string;
  arac_id?: string | null;
  arac_durum_id: string;
  arac_turu?: "video" | "podcast" | "gorsel" | "flip_pdf";
  sorular: Soru[];
  video_url: string | null;
  thumbnail_url: string | null;
  video_isleniyor?: boolean | null;
  video_puan_id: string | null;
  video_puani: number | null;
  soru_puan_map: Record<number, { soru_seti_puan_id: string; soru_puani: number }>;
  talep_no: number;
  firma_adi: string;
  urun_adi: string;
  teknik_adi: string;
  turu_adi: string | null; // içerik/eğitim türü etiketi ("Medikal Eğitim" vb.)
  hedef_roller: HedefRoller;
  soru_seti_buyuklugu: number | null;
  video_basi_soru_sayisi: number | null;
  onay_tarihi: string;
  yayin_oncesi_silme_durumu: "isleniyor" | "hata" | null;
  yayin_oncesi_silme_tarihi: string | null;
  satis_sarti_tipi?: SatisSartiTipi;
  gizli_sart_katlama_orani?: number;
  barem_tablosu?: BaremSatiri[];
  karsilik_puan?: number;
  karsilik_tl?: number;
  cek_karsiligi_var_mi?: boolean;
}

// Yayin: yayınlanmış (yayında veya durdurulmuş) içerik.
export interface Yayin {
  yayin_id: string;
  eczanem_kazanim_modeli?: EczanemKazanimModeli | null;
  arac_id?: string | null;
  soru_seti_durum_id: string;
  durum: string;
  yayin_tarihi: string;
  durdurma_tarihi: string | null;
  talep_no: number;
  firma_adi: string;
  urun_adi: string;
  teknik_adi: string;
  turu_adi: string | null; // içerik/eğitim türü etiketi ("Medikal Eğitim" vb.)
  video_url: string | null;
  thumbnail_url: string | null;
  video_puani: number | null;
  soru_puani: number | null;
  sorular: Soru[];
  hedef_roller: HedefRoller;
  arac_turu?: "video" | "podcast" | "gorsel" | "flip_pdf" | string;
  video_isleniyor?: boolean | null;
  cek_karsiligi_var_mi?: boolean | null;
  karsilik_puan?: number | null;
  karsilik_tl?: number | null;
  satis_sarti_tipi?: SatisSartiTipi | null;
  gizli_sart_katlama_orani?: number | null;
  barem_tablosu?: BaremSatiri[] | null;
}

// Ortak önizleme hedefi (4 öğrenme aracı da desteklenir)
export interface OnizlemeHedefi {
  arac_turu: "video" | "podcast" | "gorsel" | "flip_pdf" | string;
  video_url?: string | null;
  arac_id?: string | null;
  urun_adi?: string | null;
  yayin_id?: string | null;
}

// Alt sekme (durum filtresi) tipi.
export type AltSekme = "bekleyen" | "yayinda" | "durdurulan";

// Yayına hazır içeriklerin hedef kitle bazındaki canlı dağılımı.
// Sidebar toplam sayıyı, Yayın Merkezi ise bu dağılımı gösterir.
export type BekleyenHedefSayilari = Record<YayinHedefGrubu, number>;

// ============================================================================
// Sabitler
// ============================================================================

// Ana sekme (hedef rol) etiketleri. Renkler HEDEF_ROL_TASARIM'dan gelir;
// etiketler bu sayfaya özgü tam isimlerdir (kisaEtiket'ten türetilemez —
// örn. teknisyen için "Ecz. Tek." değil "Eczane Teknisyeni" istenir).
export const ANA_SEKME_ETIKETLERI: Record<YayinHedefGrubu, string> = {
  utt: "UTT Yayınları",
  bm: "BM Yayınları",
  eczaci: "Eczacı Yayınları",
  eczane_teknisyeni: "Eczane Teknisyeni Yayınları",
  [ECLUB_ORTAK_YAYIN_GRUBU]: "Eczacı ve Eczane Teknisyeni Ortak Yayınları",
  eczanem: "Eczanem Yayınları",
};

// Ana sekmelerin gösterim sırası. Sıra tek kaynakta (roller.ts) tutulur.
// Eczanem sekmesi U5'te açıldı — PM eczanem bekleyen videolarını buradan yayına
// alır (barkod + Karşılık formu satır içinde).
export const ANA_SEKMELER: YayinHedefGrubu[] = YAYIN_HEDEF_GRUP_SIRASI;
