import { NextResponse } from "next/server";
import { hataYaniti, isKuraluHatasi } from "@/lib/utils/hataIsle";

/** Veritabanı iş kuralı mesajlarını işlem ekranına taşır. */
export function cekOnayHataYaniti(error: { code: string; message: string }, mesaj: string, adim: string) {
  if (["22023", "23514"].includes(error.code)) return isKuraluHatasi(error.message);
  if (error.code === "42501") return NextResponse.json({ hata: error.message }, { status: 403 });
  if (error.code === "40001") return NextResponse.json({ hata: error.message }, { status: 409 });
  if (["42P01", "42703", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(error.code)) {
    return NextResponse.json({ hata: "Çek onay zinciri için eclub_talep_onay_zinciri.sql kurulumu gerekiyor." }, { status: 503 });
  }
  return hataYaniti(mesaj, adim, error);
}
