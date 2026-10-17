// lib/store/sabitler.ts
// HBStore sabitleri ve durum/etiket eşlemeleri.
//
// Kod sabitleri: deploy gerektirir değişimi.

import type { SiparisDurum } from "@/lib/tclub/store/tipler";

// ─── KOD SABİTLERİ ───────────────────────────────────────────────────────────

/** Kullanıcının kendi siparişini iptal edebileceği süre (saat cinsinden). */
export const IPTAL_SURE_SAATI = 12;

/** Stok azlığı uyarısı için eşik (UI üstünde "son N tane" göstermek için). */
export const STOK_AZ_ESIK = 5;

// ─── DURUM ETİKETLERİ (UI için Türkçe karşılıklar) ───────────────────────────

export const DURUM_ETIKETLERI: Record<SiparisDurum, string> = {
  beklemede: "Beklemede",
  kargoda: "Kargoda",
  teslim_edildi: "Teslim Edildi",
  iptal: "İptal Edildi",
};

/**
 * Durum bazlı renk kodları (Tailwind/inline style için).
 * UI tutarlılığı için tek yerde tanımlı.
 */
export const DURUM_RENKLERI: Record<SiparisDurum, { metin: string; arka: string; kenar: string }> = {
  beklemede: { metin: "var(--tema-yerel-magaza-islevsel-metin-14)", arka: "var(--tema-yerel-magaza-islevsel-zemin-20)", kenar: "var(--tema-yerel-magaza-islevsel-cizgi-01)" },
  kargoda: { metin: "var(--tema-yerel-magaza-islevsel-metin-15)", arka: "var(--tema-yerel-magaza-islevsel-zemin-21)", kenar: "var(--tema-yerel-magaza-islevsel-cizgi-07)" },
  teslim_edildi: { metin: "var(--tema-yerel-magaza-islevsel-metin-16)", arka: "var(--tema-yerel-magaza-islevsel-zemin-22)", kenar: "var(--tema-yerel-magaza-islevsel-cizgi-08)" },
  iptal: { metin: "var(--tema-yerel-magaza-islevsel-metin-17)", arka: "var(--tema-yerel-magaza-islevsel-zemin-23)", kenar: "var(--tema-yerel-magaza-islevsel-cizgi-09)" },
};