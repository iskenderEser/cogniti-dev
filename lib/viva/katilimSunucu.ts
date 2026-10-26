import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { vivaHash, vivaKullanici, vivaTokenGecerli, VivaHatasi } from "./sunucu";
import { vivaUuidMu } from "./sozlesme";
import type { VivaKatilimDeposu } from "./katilim";

export async function vivaUyeKatilimDeposu(id: unknown): Promise<VivaKatilimDeposu> {
  if (!vivaUuidMu(id)) throw new VivaHatasi("Geçersiz etkinlik.");
  const { db, user } = await vivaKullanici();
  return {
    async erisimKaydet(d, dailyUserId) {
      const { error } = await db.rpc("viva_daily_yasam_islem", { p_auth: user.id, p_etkinlik: id, p_islem: "erisim_kaydet",
        p_veri: { surum: d.surum, nesil: d.oda!.nesil, daily_user_id: dailyUserId } });
      if (error) throw error;
    },
    async oku() {
      const { data, error } = await db.rpc("viva_daily_katilim_baglam", { p_auth: user.id, p_etkinlik: id, p_davet_hash: null, p_oturum_hash: null });
      if (error) throw error;
      return data;
    },
    odaDeposu: { async islem(islem, veri = {}) {
      const { data, error } = await db.rpc("viva_daily_oda_islem", { p_auth: user.id, p_etkinlik: id, p_islem: islem, p_veri: veri });
      if (error) throw error;
      return data;
    } },
  };
}
export function vivaMisafirKatilimDeposu(token: string, oturum: string | undefined): VivaKatilimDeposu {
  if (!vivaTokenGecerli(token) || !oturum || !vivaTokenGecerli(oturum)) throw new VivaHatasi("Davet e-postanızı doğrulamanız gerekiyor.", 403);
  const db = createAdminClient();
  return { async erisimKaydet(d, dailyUserId) {
    const { error } = await db.rpc("viva_daily_yasam_islem", { p_auth: null, p_etkinlik: d.etkinlik_id, p_islem: "erisim_kaydet",
      p_veri: { surum: d.surum, nesil: d.oda!.nesil, daily_user_id: dailyUserId, davet_hash: vivaHash(token), oturum_hash: vivaHash(oturum) } });
    if (error) throw error;
  }, async oku() {
    const { data, error } = await db.rpc("viva_daily_katilim_baglam", {
      p_auth: null, p_etkinlik: null, p_davet_hash: vivaHash(token), p_oturum_hash: vivaHash(oturum),
    });
    if (error) throw error;
    return data;
  } };
}
