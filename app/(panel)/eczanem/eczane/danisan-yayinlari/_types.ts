import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";

export interface EczaneDagitimYayini {
  yayin_id: string;
  firma_adi: string | null;
  talep_no: number | null;
  video_puani: number | null;
  urun_adi: string;
  gorunen_urun_id: string | null;
  teknik_adi: string;
  icerik_turu: string | null;
  yayin_tarihi: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  gelis_tarihi: string;
  arac_id: string;
  arac_turu: OgrenmeAraciTuru;
}

export interface EczaneDagitimDanisani {
  musteri_id: string;
  ad_soyad: string;
  telefon_maskeli: string;
  gonderildi_mi: boolean;
}

export interface EczaneDagitimOzeti {
  yayin_id: string;
  aktif_uye_sayisi: number;
  gonderilen_uye_sayisi: number;
  gonderilebilir_uye_sayisi: number;
}

export interface EczaneDanisanGonderimi {
  yayin_id: string;
  musteri_id: string;
}

export interface EczaneDagitimVerisi {
  videolar: EczaneDagitimYayini[];
  uyeler: EczaneDagitimDanisani[];
  video_ozetleri: EczaneDagitimOzeti[];
  ozet: {
    video_sayisi: number;
    aktif_uye_sayisi: number;
    gonderilen_uye_sayisi: number;
    gonderilebilir_uye_sayisi: number;
  };
}
