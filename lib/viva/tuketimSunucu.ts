import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { KKO_TOKEN_FIYATI, VIVA_KISI_DAKIKA_USD, VIVA_USD_TL, VIVA_SATIS_KATSAYISI } from "@/lib/token/fiyatlandirma";
import { vivaDailyAyar } from "./daily";
import { vivaDailyKullanimi, type VivaDailyKullanim } from "./tuketimDaily.mjs";

type Rpc = (islem: string, veri?: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
export async function vivaDailyTuketimOku(oda: string, sonTarih: number): Promise<VivaDailyKullanim> {
  const { anahtar } = vivaDailyAyar();
  return vivaDailyKullanimi({ oda, oku: async yol => {
    const kalan = Math.min(10000, sonTarih - Date.now());
    if (kalan <= 0) throw Error("VIVA_TUKETIM_BUTCE");
    const r = await fetch(`https://api.daily.co/v1/${yol}`, { cache: "no-store", redirect: "error",
      headers: { Authorization: `Bearer ${anahtar}` }, signal: AbortSignal.timeout(kalan) });
    if (!r.ok) throw Error("VIVA_TUKETIM_DAILY_BEKLIYOR");
    return r.json();
  }});
}

export async function vivaTuketimIsle(rpc: Rpc, oku: typeof vivaDailyTuketimOku, sonTarih: number) {
  let islenen = 0, bekleyen = 0, hatali = 0;
  for (let i = 0; i < 5 && Date.now() < sonTarih; i++) {
    const is = await rpc("ayir", { kko_fiyat: KKO_TOKEN_FIYATI, usd_dakika: VIVA_KISI_DAKIKA_USD, kur: VIVA_USD_TL, katsayi: VIVA_SATIS_KATSAYISI });
    if (!is) break;
    if (is.tamam === true) { islenen++; continue; }
    const kimlik = { etkinlik_id: is.etkinlik_id, kira: is.kira };
    try {
      if (typeof is.oda_adi !== "string" || is.domain !== vivaDailyAyar().domain) throw Error("VIVA_TUKETIM_ODA_ESLESMEDI");
      const kullanim = await oku(is.oda_adi, sonTarih);
      const ozet = createHash("sha256").update(JSON.stringify(kullanim)).digest("hex");
      const r = await rpc("kaydet", { ...kimlik, ...kullanim, ozet });
      if (r?.tamam) islenen++; else bekleyen++;
    } catch {
      await rpc("hata", kimlik); hatali++;
    }
  }
  return { islenen, bekleyen, hatali };
}
export async function vivaTuketimMutabakat(db = createAdminClient(), sonTarih = Date.now() + 20000) {
  const rpc: Rpc = async (islem, veri = {}) => {
    const { data, error } = await db.rpc("cogniti_token_viva_islem", { p_islem: islem, p_veri: veri });
    if (error) throw error;
    return data;
  };
  return vivaTuketimIsle(rpc, vivaDailyTuketimOku, sonTarih);
}
