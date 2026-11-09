import { URETICI_ROLLER, YONETICI_ROLLER, FIRMA_ADMIN_ROLU } from "@/lib/utils/roller";

export type KkoHesapTuru = "kisisel" | "firma_ortak";

/** Ekran ve sunucu aynı KKÖ rol kuralını kullanır; Esnek Paket akışından bağımsızdır. */
export function kkoHesapTuru(rol: string | null | undefined): KkoHesapTuru | null {
  const deger = (rol ?? "").trim().toLowerCase();
  if (URETICI_ROLLER.includes(deger)) return "kisisel";
  if (YONETICI_ROLLER.includes(deger) || deger === FIRMA_ADMIN_ROLU) return "firma_ortak";
  return null;
}

/** Durum, kayıt adımında kilitlenen ilgili hesaptan okunmalıdır; istemciden alınmaz. */
export function kkoEtkinlestirmeKontrol(
  rol: string | null | undefined,
  beklenenHesap: unknown,
  etkinMi: boolean | null,
) {
  const hesapTuru = kkoHesapTuru(rol);
  if (!hesapTuru || hesapTuru !== beklenenHesap) {
    return { ok: false as const, status: 403, hata: "Bu hesap için KKÖ seçme yetkiniz bulunmuyor." };
  }
  if (etkinMi !== false) {
    return etkinMi === true
      ? { ok: false as const, status: 409, hata: "Bu hesapta KKÖ zaten etkin." }
      : { ok: false as const, status: 503, hata: "KKÖ hesap durumu doğrulanamadı." };
  }
  return { ok: true as const, hesapTuru };
}
