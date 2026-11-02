export const ECZANEM_UYE_SUTUNLARI = [
  ["ad_soyad", "Üye"], ["telefon", "Cep Telefonu"], ["eposta", "E-posta"],
  ["eczane_adi", "Üye Yapan Eczane"], ["gln", "GLN"], ["il", "İl"],
  ["ilce", "İlçe"], ["uyelik", "Üyelik"], ["kayit_tarihi", "Kayıt Tarihi"],
] as const;
export type EczanemUyeSutunu = (typeof ECZANEM_UYE_SUTUNLARI)[number][0];
