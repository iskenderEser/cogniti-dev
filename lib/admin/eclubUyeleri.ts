export const ECLUB_UYE_SUTUNLARI = [
  { anahtar: "takim_id", baslik: "Takım (Bölüm)", tumu: "Tüm takımlar" },
  { anahtar: "bolge_id", baslik: "Bölge", tumu: "Tüm bölgeler" },
  { anahtar: "temsilci_id", baslik: "Sorumlu Temsilci", tumu: "Tüm temsilciler" },
  { anahtar: "il", baslik: "Eczanenin İli", tumu: "Tüm iller" },
  { anahtar: "ilce", baslik: "Eczanenin İlçesi", tumu: "Tüm ilçeler" },
  { anahtar: "gln", baslik: "GLN", tumu: "Tüm GLN’ler" },
  { anahtar: "eczane_id", baslik: "Eczane", tumu: "Tüm eczaneler" },
  { anahtar: "rol", baslik: "Unvan (Rol)", tumu: "Tüm unvanlar" },
  { anahtar: "kisi_id", baslik: "Ad Soyad", tumu: "Tüm üyeler" },
  { anahtar: "telefon", baslik: "Cep Telefonu", tumu: "Tüm telefonlar" },
  { anahtar: "eposta", baslik: "E-posta", tumu: "Tüm e-postalar" },
  { anahtar: "durum", baslik: "Durum", tumu: "Tüm durumlar" },
] as const;

export type EclubUyeSutunu = typeof ECLUB_UYE_SUTUNLARI[number]["anahtar"];

export interface AdminEclubSorumlu {
  temsilci_id: string;
  temsilci_adi: string;
  takim_adi: string | null;
  bolge_adi: string | null;
}

export interface AdminEclubUye {
  uyelik_id: string;
  kisi_id: string;
  eczane_id: string;
  ad: string;
  soyad: string;
  rol: string;
  telefon: string | null;
  eposta: string | null;
  aktif_mi: boolean;
  eczane_adi: string;
  gln: string;
  il: string | null;
  ilce: string | null;
  sorumlular: AdminEclubSorumlu[];
}

export interface AdminEclubUyeVerisi {
  uyeler: AdminEclubUye[];
  secenekler: Record<EclubUyeSutunu, Array<{ deger: string; etiket: string }>>;
  sayfalama: { toplam: number; sayfa: number; toplam_sayfa: number; limit: number };
}
