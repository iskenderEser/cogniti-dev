// app/admin/store/_types.ts
//
// HBStore admin panelinde ortak kullanılan tipler.
// Hook'lar ve sekme bileşenleri arasında paylaşılır.

import type { Urun, Siparis } from "@/lib/tclub/store/tipler";

// ─── ÜRÜN ─────────────────────────────────────────────

/**
 * Admin ürün tablosunda gösterilen ürün.
 * Merkezî çek bilgilerini içerir.
 */
export interface UrunGosterim extends Urun {
  minimum_siparis_tl?: number | null;
}

// ─── SİPARİŞ (ürün ve kullanıcı join'li) ─────────────────────────────────────

/**
 * Admin sipariş listesinde gösterilen sipariş.
 * Mevcut Siparis tipine iki join ekler:
 *   - store_urunler: Ürün adı + görsel
 *   - kullanicilar: Sipariş veren kullanıcı bilgisi (ad, soyad, email, rol)
 */
export interface SiparisGosterim extends Siparis {
  store_urunler: {
    ad: string;
    gorsel_url: string | null;
  } | null;
  kullanicilar: {
    ad: string;
    soyad: string;
    eposta: string;
    rol: string;
  } | null;
}

