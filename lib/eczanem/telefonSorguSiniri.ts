import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const TELEFON_SORGU_PENCERE_DAKIKA = 15;
export const TELEFON_SORGU_KISI_LIMIT = 20;
export const TELEFON_SORGU_ECZANE_LIMIT = 40;

export function telefonSorguHash(telefon: string): string {
  return createHash("sha256").update(`eczanem-tel-sorgu:${telefon}`).digest("hex");
}

export async function eczanemTelefonSorguIzniAl(
  db: SupabaseClient,
  params: { eczaneId: string; kisiId: string; telefon: string },
): Promise<{ ok: boolean; izinli: boolean; kalan?: number; hata?: string; dbHatasi?: unknown }> {
  const { data, error } = await db.rpc("eczanem_telefon_sorgu_kontrol", {
    p_eczane_id: params.eczaneId,
    p_kisi_id: params.kisiId,
    p_telefon_hash: telefonSorguHash(params.telefon),
    p_pencere_dakika: TELEFON_SORGU_PENCERE_DAKIKA,
    p_kisi_limit: TELEFON_SORGU_KISI_LIMIT,
    p_eczane_limit: TELEFON_SORGU_ECZANE_LIMIT,
  });

  if (error) {
    return {
      ok: false,
      izinli: false,
      hata: "Telefon sorgulama sınırı doğrulanamadı.",
      dbHatasi: error,
    };
  }

  const sonuc = Array.isArray(data) ? data[0] : data;
  if (!sonuc?.izinli) {
    return {
      ok: true,
      izinli: false,
      kalan: 0,
      hata: sonuc?.hata ?? "Çok fazla telefon sorgulaması yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.",
    };
  }

  return {
    ok: true,
    izinli: true,
    kalan: Number(sonuc.kalan ?? 0),
  };
}
