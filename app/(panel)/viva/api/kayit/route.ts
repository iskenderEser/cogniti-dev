import { vivaGirdi, vivaHata, vivaKullanici, vivaYanit, VivaHatasi } from "@/lib/viva/sunucu";
import { vivaUuidMu } from "@/lib/viva/sozlesme";
import { createVivaDailyApi, VivaDailyHatasi } from "@/lib/viva/daily";
import { vivaIndirmeAcik } from "@/lib/viva/indirme";
import { vivaKayitRpc } from "@/lib/viva/kayitSunucu";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function hata(e: unknown) { return e instanceof VivaDailyHatasi ? vivaYanit({ hata: e.message }, e.status) : vivaHata(e); }
export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams; const id = p.get("etkinlik_id"), kayitId = p.get("id"); const tur = p.get("tur") ?? "video";
    if (!["video", "sohbet"].includes(tur) || !vivaUuidMu(id) || (kayitId && !vivaUuidMu(kayitId))) throw new VivaHatasi("Geçersiz kayıt.");
    const { db, user } = await vivaKullanici(); const rpc = vivaKayitRpc(db, user.id, id);
    if (!kayitId) return vivaYanit(await rpc("liste"));
    const b = await rpc("link", { id: kayitId }); const api = createVivaDailyApi();
    if (!vivaIndirmeAcik(b)) throw new VivaHatasi("Bu yayının 7 günlük indirme süresi doldu.", 410);
    const k = await api.kayitOku(kayitId);
    if (k.oda_adi !== b.oda_adi || k.oturum_id !== b.oturum_id || k.durum !== "hazir") throw new VivaHatasi("Kayıt henüz hazır değil.", 409);
    const link = await api.kayitLinki(kayitId, tur as "video" | "sohbet");
    // Sağlayıcı çağrısı sürerken sahiplik/hesap durumu değişmiş olabilir.
    const son = await rpc("link", { id: kayitId });
    if (!vivaIndirmeAcik(son)) throw new VivaHatasi("Bu yayının 7 günlük indirme süresi doldu.", 410);
    return vivaYanit(link);
  } catch (e) { return hata(e); }
}
export async function POST(req: Request) {
  try {
    const p = await vivaGirdi(req);
    if (!vivaUuidMu(p.etkinlik_id) || !["durdu", "yenile"].includes(String(p.islem)) || (p.islem === "durdu" && !vivaUuidMu(p.instance_id))) throw new VivaHatasi("Geçersiz kayıt işlemi.");
    const { db, user } = await vivaKullanici();
    return vivaYanit(await vivaKayitRpc(db, user.id, p.etkinlik_id)(String(p.islem), { instance_id: p.instance_id }));
  } catch (e) { return hata(e); }
}
