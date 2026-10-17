// app/admin/_constants.ts

import type { CSSProperties } from "react";
import { TUM_ROLLER, ADMIN_ROLLER } from "@/lib/utils/roller";

// B-31: yerel rol kopyası kalktı — tek kaynaktan (roller.ts) türetilir;
// admin rolleri panelden atanamaz (bilinçli hariç).
export const ROLLER = TUM_ROLLER.filter((r) => !ADMIN_ROLLER.includes(r));

// Tasarım dili login neslinden (K-A3): baykuş grisi + bordo vurgu + Nunito.
// T-3: bordo ailesi TEK kaynak burasıdır — bileşenlerde mavi/yerel renk
// kopyası kalmadı. ANLAMSAL renkler bu dile dahil değildir (İskender kararı,
// 18.07.2026): sipariş durum etiketleri (mavi Hazırlanıyor, mor Kargoda...),
// modül switch renkleri, amber eksik dili ve kırmızı hata dili yerinde kalır.
export const RENK_GRI = "var(--tema-yerel-yonetim-yardimci-metin-01)";
export const RENK_BORDO = "var(--tema-yerel-yonetim-vurgu-metin-01)";
export const RENK_CIZGI = "var(--tema-yerel-yonetim-yardimci-metin-08)";
// Seçili/vurgulu zemin ve kenarlık — bordo ailesinin açık tonları.
export const RENK_BORDO_ZEMIN = "var(--tema-yerel-yonetim-vurgu-zemin-02)";
export const RENK_BORDO_KENAR = "var(--tema-yerel-yonetim-vurgu-cizgi-02)";

export const inputStyle: CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  padding: "8px 10px",
  fontSize: "13px",
  color: "var(--tema-yerel-yonetim-ana-metin-01)",
  background: "var(--tema-yerel-yonetim-kart-01)",
  fontFamily: "'Nunito', sans-serif",
  minWidth: 0,
};

export const readonlyInputStyle: CSSProperties = {
  ...inputStyle,
  background: "var(--tema-yerel-yonetim-sayfa-zemini-02)",
  color: "var(--tema-yerel-yonetim-yardimci-metin-01)",
  cursor: "default",
};

export const labelStyle: CSSProperties = {
  background: RENK_BORDO_ZEMIN,
  color: RENK_BORDO,
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  minWidth: "110px",
  display: "flex",
  alignItems: "center",
  borderRight: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)",
  flexShrink: 0,
  fontFamily: "'Nunito', sans-serif",
};

export const rowStyle: CSSProperties = {
  display: "flex",
  border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)",
  borderRadius: "8px",
  overflow: "hidden",
  marginBottom: "7px",
};

export const btnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Nunito', sans-serif",
  border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)",
};

export const filterSelectStyle: CSSProperties = {
  border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)",
  borderRadius: "6px",
  padding: "5px 8px",
  fontSize: "11px",
  fontFamily: "'Nunito', sans-serif",
  color: "var(--tema-yerel-yonetim-ana-metin-03)",
  background: "var(--tema-yerel-yonetim-kart-01)",
  cursor: "pointer",
  outline: "none",
};
// ─────────────────────────────────────────────────────────────────────────
// M2 — Yönetim kabuğu tek kaynağı (admin modernizasyon planı B.2, K-A3/K-A4).
// firmaAdminGorur: ileride "firma admini" rolü (K-A1) için görünürlük bayrağı —
// sekme/bölüm kapatma tek yerden yapılır, dağınık if'lerle değil.
// ─────────────────────────────────────────────────────────────────────────

export type ModulSekmeId =
  | "kullanicilar"
  | "organizasyon"
  | "urunteknik"
  | "logokimlik"
  | "tclub"
  | "cclub"
  | "eclub"
  | "eczanem";

// Sekme grupları (İskender kararı, 17.07.2026): takım/bölge ve ürün/teknik
// MODÜL değil, firmanın KURULUŞ TANIMLARIDIR (organizasyon şeması firmanın
// altındadır). Sekme çubuğu iki grup halinde çizilir: "Firma" | "Modüller".
export type SekmeGrubu = "firma" | "modul";

export interface ModulSekme {
  id: ModulSekmeId;
  etiket: string;
  grup: SekmeGrubu;
  firmaAdminGorur: boolean;
}

export const MODUL_SEKMELERI: ModulSekme[] = [
  { id: "kullanicilar", etiket: "Kullanıcılar", grup: "firma", firmaAdminGorur: true },
  { id: "organizasyon", etiket: "Organizasyon", grup: "firma", firmaAdminGorur: true },
  { id: "urunteknik", etiket: "Ürün ve Teknik", grup: "firma", firmaAdminGorur: true },
  { id: "logokimlik", etiket: "Logo ve Kimlik", grup: "firma", firmaAdminGorur: true },
  { id: "tclub", etiket: "T-Club", grup: "modul", firmaAdminGorur: true },
  { id: "cclub", etiket: "C-Club", grup: "modul", firmaAdminGorur: true },
  { id: "eclub", etiket: "E-Club", grup: "modul", firmaAdminGorur: true },
  { id: "eczanem", etiket: "Eczanem", grup: "modul", firmaAdminGorur: true },
];

export type GlobalBolumId = "hbstore" | "eclubstore" | "uretim" | "sistem";

export interface GlobalBolum {
  id: GlobalBolumId;
  etiket: string;
  firmaAdminGorur: boolean; // global işler firma adminine KAPALI doğar (K-A1)
}

export const GLOBAL_BOLUMLER: GlobalBolum[] = [
  { id: "hbstore", etiket: "HBStore", firmaAdminGorur: false },
  { id: "eclubstore", etiket: "Çek Teslimatı", firmaAdminGorur: false },
  { id: "uretim", etiket: "İçerik Üretimi", firmaAdminGorur: false },
  { id: "sistem", etiket: "Sistem Ayarları", firmaAdminGorur: false },
];
