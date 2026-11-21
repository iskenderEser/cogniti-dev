import {
  TUM_HEDEF_ROLLER,
  URETICI_ROLLER,
  YONETICI_ROLLER,
  type HedefRol,
} from "@/lib/utils/roller";

export const BOLIS_RENGI = "#0F766E";
export const BOLIS_RENGI_HOVER = "#115E59";
export const BOLIS_YUMUSAK_ZEMIN = "rgb(15 118 110 / 0.09)";
export const BOLIS_YUMUSAK_CIZGI = "rgb(15 118 110 / 0.28)";

export const BOLIS_YONETEN_ROLLER: readonly string[] = [
  ...URETICI_ROLLER,
  ...YONETICI_ROLLER,
];

export const BOLIS_HEDEF_ROLLER: readonly HedefRol[] = TUM_HEDEF_ROLLER;
export type BolisHedefRol = HedefRol;

export const BOLIS_HEDEF_ROL_ETIKETLERI: Record<BolisHedefRol, string> = {
  utt: "Temsilci",
  bm: "Bölge Müdürü",
  eczaci: "Eczacı",
  eczane_teknisyeni: "Eczane Teknisyeni",
  eczanem: "Danışan",
};

export const BOLIS_YAYIN_ARACLARI = [
  "yayin_yok",
  "video",
  "podcast",
  "gorsel",
  "flip_pdf",
] as const;
export type BolisYayinAraci = (typeof BOLIS_YAYIN_ARACLARI)[number];

export const BOLIS_YAYIN_ARACI_ETIKETLERI: Record<BolisYayinAraci, string> = {
  yayin_yok: "Yayın Yok (Salt Sınav)",
  video: "Video",
  podcast: "Podcast",
  gorsel: "Görsel",
  flip_pdf: "PDF",
};

export const BOLIS_KAYIT_TIPLERI = ["hazir_liste", "kendi_kaydi", "anonim"] as const;
export type BolisKayitTipi = (typeof BOLIS_KAYIT_TIPLERI)[number];

export const BOLIS_KAYIT_TIPI_ETIKETLERI: Record<BolisKayitTipi, string> = {
  hazir_liste: "Hazır Liste (Manuel / Toplu)",
  kendi_kaydi: "Katılımcı Kendi Kaydı",
  anonim: "Kimliksiz (Anonim)",
};

export const BOLIS_DURUMLARI = ["taslak", "yayinda", "kapali"] as const;
export type BolisSinavDurumu = (typeof BOLIS_DURUMLARI)[number];

export const BOLIS_DURUM_ETIKETLERI: Record<BolisSinavDurumu, string> = {
  taslak: "Taslak",
  yayinda: "Yayında",
  kapali: "Kapalı",
};

export interface BolisSecenek {
  anahtar: string;
  metin: string;
}

export interface BolisSoru {
  soru_id: string;
  sinav_id: string;
  sira: number;
  soru_metni: string;
  secenekler: BolisSecenek[];
  dogru_secenek?: string;
  puan: number;
}

export interface BolisSinavOzeti {
  sinav_id: string;
  erisim_kodu: string;
  baslik: string;
  aciklama: string;
  hedef_roller: BolisHedefRol[];
  yayin_araci: BolisYayinAraci;
  sure_dakika: number;
  baslangic_at: string | null;
  bitis_at: string | null;
  kayit_tipi: BolisKayitTipi;
  durum: BolisSinavDurumu;
  soru_sayisi: number;
  katilimci_sayisi: number;
  olusturuldu_at: string;
  katildi_mi?: boolean;
  kullanici_puani?: number | null;
  maksimum_puan?: number | null;
}

export function bolisYoneticiMi(rol: string | null | undefined): boolean {
  if (!rol) return false;
  return BOLIS_YONETEN_ROLLER.includes(rol.trim().toLowerCase());
}

/** İç kullanıcı rolünü BOLIS hedef rolüne eşler (TM dahil değildir). */
export function kullaniciRolundenBolisHedefi(rol: string | null | undefined): BolisHedefRol | null {
  const r = (rol ?? "").trim().toLowerCase();
  if (r === "utt" || r === "kd_utt") return "utt";
  if (r === "bm") return "bm";
  if (r === "eczaci") return "eczaci";
  if (r === "eczane_teknisyeni") return "eczane_teknisyeni";
  if (r === "musteri" || r === "eczanem") return "eczanem";
  return null;
}
