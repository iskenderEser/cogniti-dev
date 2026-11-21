import type { SupabaseClient } from "@supabase/supabase-js";

export const AGORA_PARTNER_KOMISYON_ANAHTARI = "agora_partner_komisyon_orani";
export const VARSAYILAN_PARTNER_KOMISYON_ORANI = 15;

/** Partner komisyon oranı (%): 0 < oran < 100 ve en fazla 2 ondalık basamak olmalıdır. */
export function partnerKomisyonOraniGecerli(deger: unknown): deger is number {
  if (typeof deger !== "number" || !Number.isFinite(deger)) return false;
  if (deger <= 0 || deger >= 100) return false;
  return Math.abs(deger - Math.round(deger * 100) / 100) < 1e-9;
}

/** sistem_ayarlari.agora_partner_komisyon_orani değerini sunucu veritabanından okur. */
export async function partnerKomisyonOraniOku(
  db: Pick<SupabaseClient, "from">,
): Promise<number> {
  const { data, error } = await db
    .from("sistem_ayarlari")
    .select("deger")
    .eq("anahtar", AGORA_PARTNER_KOMISYON_ANAHTARI)
    .maybeSingle();

  const deger = Number(data?.deger);
  if (error || !partnerKomisyonOraniGecerli(deger)) {
    console.error(
      `[UYARI] ${AGORA_PARTNER_KOMISYON_ANAHTARI} okunamadı, varsayılan (${VARSAYILAN_PARTNER_KOMISYON_ORANI}) kullanılıyor:`,
      error?.message ?? data?.deger,
    );
    return VARSAYILAN_PARTNER_KOMISYON_ORANI;
  }

  return Math.round(deger * 100) / 100;
}
