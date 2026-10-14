// lib/eclub/oneriLimit.ts
//
// Adım 5: eski çağrılar için süre köprüsü. Kota ve tekrarın yetkili kaynağı SQL'dir.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ECLUB_OGRENME_GECERLILIK_GUN,
  ECLUB_YAYIN_TEKRAR_ARALIGI_GUN,
} from "@/lib/eclub/gonderiAyarlari";

export async function eclubOneriGecerlilikGun(_supabase: SupabaseClient): Promise<number> {
  void _supabase; // Geçiş sırasında eski çağrı imzası korunur; ayar kaydı süreyi değiştirmez.
  return ECLUB_OGRENME_GECERLILIK_GUN;
}

// ─── Zaman yardımcıları ──────────────────────────────────────────────────────

/** Yeni gerçek gönderimin geçerlilik bitişi; eski çağrıdaki gün değeri etkisizdir. */
export function oneriBitisHesapla(baslangic: Date, _gunSayisi?: number): Date {
  void _gunSayisi;
  return new Date(baslangic.getTime() + ECLUB_OGRENME_GECERLILIK_GUN * 86_400_000);
}

export function ayniYayinTekrarAcikZamani(gonderimBaslangici: Date): Date {
  return new Date(gonderimBaslangici.getTime() + ECLUB_YAYIN_TEKRAR_ARALIGI_GUN * 86_400_000);
}
