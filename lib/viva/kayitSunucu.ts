import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { createVivaDailyApi, VivaDailyHatasi, type VivaDailyKayitApi } from "./daily";
import { vivaYasamBaslat } from "./yasam";
import { vivaSunucuMutabakat, vivaYasamRpc } from "./yasamSunucu";

export function vivaKayitRpc(db: ReturnType<typeof createAdminClient>, auth: string | null = null, etkinlik: string | null = null) {
  return async (islem: string, veri: Record<string, unknown> = {}) => {
    const { data, error } = await db.rpc(auth && ["liste", "link"].includes(islem) ? "viva_daily_indirme_islem" : "viva_daily_kayit_islem", { p_auth: auth, p_etkinlik: etkinlik, p_islem: islem, p_veri: veri });
    if (error) throw error;
    return data;
  };
}
export async function vivaKayitMutabakat(db = createAdminClient(), api: VivaDailyKayitApi = createVivaDailyApi(), butce = 15_000) {
  const rpc = vivaKayitRpc(db); const bas = Date.now(); let islenen = 0, hatali = 0;
  // Kalıcı lease ile işler yanıt sonrası belleğe bırakılmaz; hata 1 dk sonra yeniden denenir.
  for (let i = 0; i < 10 && Date.now() - bas < butce; i++) {
    const is = await rpc("olay_ayir"); if (!is) break;
    try {
      if (is.domain !== api.domain) throw new Error("DOMAIN_ESLESMEDI");
      const p = is.veri as Record<string, unknown>;
      let oda = String(p.room_name ?? p.room ?? "");
      const id = typeof p.recording_id === "string" ? p.recording_id : null;
      let kayit;
      if (is.tur.startsWith("recording.") && id) { kayit = await api.kayitOku(id); oda = kayit.oda_adi; }
      const baglam = await rpc("oda", { oda_adi: oda, domain: api.domain });
      if (baglam) {
        if (kayit) await rpc("esle", { ...kayit, domain: api.domain, instance_id: p.instance_id ?? null,
          // 'ready' olayı API eventual consistency nedeniyle henüz finished değilse yeniden denenir.
        });
        if (is.tur === "recording.ready-to-download" && kayit?.durum !== "hazir") throw new Error("KAYIT_BEKLIYOR");
        if (is.tur === "recording.error") await rpc("kayit_hata", { oda_adi: oda, domain: api.domain, instance_id: p.instance_id });
        if (is.tur === "meeting.ended" && typeof p.meeting_id === "string") await vivaYasamRpc(db, baglam.etkinlik_id, null)("saglayici_bitti", { oturum_id: p.meeting_id, nesil: baglam.nesil });
        if (is.tur === "meeting.started") {
          // meeting.started ilk katılımcıdır; ancak gerçek sunucu presence ile doğrulanır.
          if (["planlandi", "canli"].includes(baglam.durum)) await vivaYasamBaslat(vivaYasamRpc(db, baglam.etkinlik_id, baglam.sahip_id), api);
        }
        if (is.tur.startsWith("participant.")) await vivaSunucuMutabakat(baglam.etkinlik_id, db);
      }
      await rpc("olay_tamam", { anahtar: is.anahtar, kira: is.kira }); islenen++;
    } catch (e) {
      if (e instanceof VivaDailyHatasi && e.kod === "KAPSAM_DISI") { await rpc("olay_tamam", { anahtar: is.anahtar, kira: is.kira }); islenen++; }
      else { await rpc("olay_hata", { anahtar: is.anahtar, kira: is.kira }); hatali++; }
    }
  }
  // Kaçırılan kayıt bildirimleri: oda başına 5 dakikada bir, kapanıştan sonra 48 saat.
  // Sayfalama imleci kalıcıdır; çok parçalı kayıtlar aynı ilk sayfaya takılmaz.
  if (Date.now() - bas < butce) {
    const hedef = await rpc("tarama_ayir");
    if (hedef) try {
      if (hedef.domain !== api.domain) throw new Error("DOMAIN_ESLESMEDI");
      const r = await api.kayitListe(hedef.oda_adi, hedef.imlec ?? undefined);
      for (const k of r.kayitlar) await rpc("esle", { ...k, domain: api.domain });
      await rpc("tarama_tamam", { etkinlik_id: hedef.etkinlik_id, kira: hedef.kira, imlec: r.devam });
    } catch { hatali++; /* lease süresi dolunca aynı sayfa yeniden işlenir */ }
  }
  return { islenen, hatali };
}
