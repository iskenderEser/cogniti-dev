import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SOSYAL_IKON_BUCKET,
  SOSYAL_LINKLER_TABLO,
  sosyalLinkKurulumuEksik,
  type KamuSosyalLink,
  type SosyalLinkItem,
} from "./sosyalLinkler";

interface SosyalLinkSatir {
  id: string;
  ad: string;
  url: string;
  ikon_yolu: string;
  sira: number;
  gorunur: boolean;
  created_at?: string;
}

function ikonPublicUrl(admin: SupabaseClient, yol: string): string {
  return admin.storage.from(SOSYAL_IKON_BUCKET).getPublicUrl(yol).data.publicUrl;
}

export async function kamuSosyalLinkleriniOku(admin: SupabaseClient): Promise<KamuSosyalLink[]> {
  const { data, error } = await admin
    .from(SOSYAL_LINKLER_TABLO)
    .select("id, ad, url, ikon_yolu")
    .eq("gorunur", true)
    .order("sira", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (!sosyalLinkKurulumuEksik(error)) {
      console.error("[lib/sosyalLinklerSunucu] kamuSosyalLinkleriniOku hatası:", error.message);
    }
    return [];
  }

  return ((data ?? []) as Pick<SosyalLinkSatir, "id" | "ad" | "url" | "ikon_yolu">[]).map((satir) => ({
    id: satir.id,
    ad: satir.ad,
    url: satir.url,
    ikonUrl: ikonPublicUrl(admin, satir.ikon_yolu),
  }));
}

export async function adminSosyalLinkleriniOku(admin: SupabaseClient): Promise<{
  linkler: SosyalLinkItem[];
  kurulumHazir: boolean;
  error: { code?: string; message?: string } | null;
}> {
  const { data, error } = await admin
    .from(SOSYAL_LINKLER_TABLO)
    .select("id, ad, url, ikon_yolu, sira, gorunur, created_at")
    .order("sira", { ascending: true })
    .order("created_at", { ascending: true });

  if (sosyalLinkKurulumuEksik(error)) {
    return { linkler: [], kurulumHazir: false, error: null };
  }
  if (error) {
    return { linkler: [], kurulumHazir: true, error };
  }

  const linkler: SosyalLinkItem[] = ((data ?? []) as SosyalLinkSatir[]).map((satir) => ({
    id: satir.id,
    ad: satir.ad,
    url: satir.url,
    ikonUrl: ikonPublicUrl(admin, satir.ikon_yolu),
    sira: satir.sira,
    gorunur: satir.gorunur,
    createdAt: satir.created_at,
  }));

  return { linkler, kurulumHazir: true, error: null };
}
