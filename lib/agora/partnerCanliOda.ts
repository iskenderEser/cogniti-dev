import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createVivaDailyApi, vivaDailyOdaAdi } from "@/lib/viva/daily";
import { vivaDailyKisiKimligi } from "@/lib/viva/katilim";
import { vivaDailyOdaHazirla } from "@/lib/viva/oda";

const ERKEN_GIRIS_MS = 15 * 60_000;
const BITIS_TOLERANS_MS = 10 * 60_000;

interface OdaBilgisi {
  oturum_id: string;
  baslangic_at: string;
  bitis_at: string;
  durum: string;
  viva_oda_adi: string | null;
  viva_domain: string | null;
  viva_etkinlik_id?: string | null;
  alici_id?: string | null;
  kullanici_adi: string;
}

export async function partnerCanliOdaVeTokenHazirla({
  db,
  oturumId,
  partnerId,
  authId,
  sunucuMu,
}: {
  db: SupabaseClient;
  oturumId: string;
  partnerId?: string;
  authId?: string;
  sunucuMu: boolean;
}): Promise<{ ok: true; url: string } | { ok: false; status: number; hata: string }> {
  const { data, error } = await db.rpc("agora_canli_oda_bilgisi_oku", {
    p_oturum_id: oturumId,
    p_partner_id: partnerId ?? null,
    p_auth_id: authId ?? null,
  });

  if (error) {
    if (error.code === "42501") {
      return { ok: false, status: 403, hata: error.message || "Bu canlı yayın oturumuna erişim yetkiniz yok." };
    }
    return { ok: false, status: 503, hata: "Canlı yayın oturumu okunamadı." };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, status: 404, hata: "Canlı yayın oturumu bulunamadı." };
  }

  const oturum = data as OdaBilgisi;
  if (oturum.durum !== "siparis_verildi") {
    return {
      ok: false,
      status: 409,
      hata: "Canlı yayın odası yalnızca sipariş verilmiş oturumlar için açılabilir.",
    };
  }

  const simdi = Date.now();
  const basMs = Date.parse(oturum.baslangic_at);
  const bitMs = Date.parse(oturum.bitis_at);
  if (simdi < basMs - ERKEN_GIRIS_MS) {
    return {
      ok: false,
      status: 409,
      hata: "Yayın odasına başlangıç saatinden en fazla 15 dakika önce giriş yapılabilir.",
    };
  }
  if (simdi > bitMs + BITIS_TOLERANS_MS) {
    return { ok: false, status: 410, hata: "Bu canlı yayın oturumunun süresi dolmuştur." };
  }

  const daily = createVivaDailyApi();
  const odaAdi = oturum.viva_etkinlik_id
    ? vivaDailyOdaAdi(oturum.viva_etkinlik_id, 1)
    : oturum.viva_oda_adi || vivaDailyOdaAdi(oturum.oturum_id, 1);
  const nbfBas = new Date(Math.min(basMs - ERKEN_GIRIS_MS, simdi)).toISOString();
  const expBit = new Date(bitMs + BITIS_TOLERANS_MS).toISOString();

  if (oturum.viva_etkinlik_id && oturum.alici_id) {
    await vivaDailyOdaHazirla(
      {
        async islem(islem, veri = {}) {
          const { data: odaYanit, error: odaHatasi } = await db.rpc("viva_daily_oda_islem", {
            p_auth: oturum.alici_id,
            p_etkinlik: oturum.viva_etkinlik_id,
            p_islem: islem,
            p_veri: veri,
          });
          if (odaHatasi) throw odaHatasi;
          return odaYanit;
        },
      },
      daily,
    ).catch(() => undefined);
  }

  await daily.odaHazirla({
    domain: daily.domain,
    oda_adi: odaAdi,
    baslangic: nbfBas,
    bitis: expBit,
  });

  if (oturum.viva_oda_adi !== odaAdi || oturum.viva_domain !== daily.domain) {
    await db.rpc("agora_canli_oda_kaydet", {
      p_oturum_id: oturum.oturum_id,
      p_oda_adi: odaAdi,
      p_domain: daily.domain,
    });
  }

  const dailyUserId = partnerId
    ? vivaDailyKisiKimligi(`partner:${partnerId}`)
    : vivaDailyKisiKimligi(`uye:${authId ?? oturum.oturum_id}`);

  const token = await daily.tokenOlustur({
    room_name: odaAdi,
    user_id: dailyUserId,
    user_name: oturum.kullanici_adi.slice(0, 80) || (sunucuMu ? "İş Partneri" : "Katılımcı"),
    is_owner: true,
    nbf: Math.floor(Date.parse(nbfBas) / 1000),
    exp: Math.ceil(Date.parse(expBit) / 1000),
    eject_at_token_exp: true,
    enable_screenshare: true,
    enable_prejoin_ui: false,
    enable_recording_ui: false,
    enable_recording: false,
    start_video_off: true,
    start_audio_off: true,
    start_cloud_recording: false,
    auto_start_transcription: false,
    knocking: false,
    lang: "tr",
    permissions: {
      hasPresence: true,
      canSend: true,
      canReceive: { base: true },
      canAdmin: true,
    },
  });

  return { ok: true, url: `https://${daily.domain}/${odaAdi}?t=${encodeURIComponent(token)}` };
}
