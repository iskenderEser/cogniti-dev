// lib/firma/kolonlar.ts
// firmalar tablosunun standart tam-kolon listesi (tek-kaynak).
// firmalar SELECT'lerinde bu sabit kullanılır; DB'ye kolon eklenince
// yalnızca burası güncellenir, tüm kullanıcılar otomatik güncel olur.

export const FIRMA_KOLONLARI =
  "firma_id, firma_adi, firma_admin_aktif, hbstore_aktif, aktif, cc_aktif, eclub_aktif, eczanem_aktif, logo_url, ogrenme_platformu_aktif, son_export_at, created_at";

// Kurum ve iletişim alanları yalnız firma bilgisi okuma/düzenlemesinde istenir.
export const FIRMA_KURUM_KOLONLARI = `${FIRMA_KOLONLARI}, adres, vergi_dairesi, vergi_numarasi, sorumlu_ad_soyad, sorumlu_telefon, sorumlu_eposta, il_id, ilce_id, vergi_dairesi_kodu`;
