import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { esnekPaketBakiyeTuru, esnekPaketSiparisIstegiGecerli, type BakiyeTuru } from "./esnekPaket";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

/** Hesap sahibi ve firma oturumdan belirlenir; beklenen hesap yalnız onay kontrolüdür. */
export async function esnekPaketSiparisiOlustur(istek: unknown, beklenenHesap?: BakiyeTuru) {
  try {
    const oturum = await createClient();
    const { data: { user }, error } = await oturum.auth.getUser();
    if (error || !user) return { ok: false as const, status: 401, hata: "Oturum açmanız gerekiyor." };
    const db = createAdminClient(AbortSignal.timeout(10000));
    const rol = await rolCozucu(db, user.id);
    if (!esnekPaketBakiyeTuru(rol)) return { ok: false as const, status: 403, hata: "Satın alma yetkiniz bulunmuyor." };
    if (beklenenHesap && esnekPaketBakiyeTuru(rol) !== beklenenHesap) return { ok: false as const, status: 403, hata: "Hesap yetkiniz değişti. Sayfayı yenileyin." };
    if (!esnekPaketSiparisIstegiGecerli(istek)) return { ok: false as const, status: 400, hata: "Sipariş bilgileri geçersiz." };
    const sonuc = await db.rpc("cogniti_esnek_paket_siparis_olustur", {
      p_auth_id: user.id,
      p_token_adedi: istek.tokenAdedi,
      p_tarife_surumu: istek.tarifeSurumu,
      p_birim_fiyat: istek.birimFiyat,
      p_anahtar: istek.islemAnahtari,
    });
    if (sonuc.error) {
      const kod = sonuc.error.code;
      if (kod === "42501") return { ok: false as const, status: 403, hata: "Satın alma yetkiniz bulunmuyor." };
      if (kod === "P0001") return { ok: false as const, status: 409, hata: "Fiyat güncellendi. Güncel tutarı yeniden onaylayın." };
      if (kod === "22023") return { ok: false as const, status: 400, hata: "Sipariş bilgileri doğrulanamadı. Seçiminizi yenileyin." };
      return { ok: false as const, status: 503, hata: "Sipariş sonucu doğrulanamadı. Aynı işlemle yeniden deneyin." };
    }
    const veri = sonuc.data;
    if (!veri || !uuidGecerliMi(veri.siparis_id) || typeof veri.yeniden_deneme !== "boolean") {
      return { ok: false as const, status: 503, hata: "Sipariş sonucu doğrulanamadı. Aynı işlemle yeniden deneyin." };
    }
    return { ok: true as const, siparisId: veri.siparis_id as string, yenidenDeneme: veri.yeniden_deneme as boolean };
  } catch {
    return { ok: false as const, status: 503, hata: "Sipariş sonucu doğrulanamadı. Aynı işlemle yeniden deneyin." };
  }
}
