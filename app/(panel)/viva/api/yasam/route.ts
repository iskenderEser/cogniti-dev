import { vivaGirdi, vivaHata, vivaKullanici, vivaYanit, VivaHatasi } from "@/lib/viva/sunucu";
import { vivaUuidMu } from "@/lib/viva/sozlesme";
import { VivaDailyHatasi } from "@/lib/viva/daily";
import { vivaYasamBaslat } from "@/lib/viva/yasam";
import { vivaSunucuMutabakat, vivaYasamRpc } from "@/lib/viva/yasamSunucu";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const v = await vivaGirdi(req);
    if (!vivaUuidMu(v.etkinlik_id) || !["basladi", "bitir", "katilimci_cikar"].includes(String(v.islem))) throw new VivaHatasi("Geçersiz yayın işlemi.");
    const { db, user } = await vivaKullanici();
    const rpc = vivaYasamRpc(db, v.etkinlik_id, user.id);
    if (v.islem === "basladi") { const r = await vivaYasamBaslat(rpc); return vivaYanit(r, r.bekle ? 202 : 200); }
    if (!Number.isInteger(v.surum) || Number(v.surum) < 1) throw new VivaHatasi("Etkinliğin güncel halini açın.", 409);
    if (v.islem === "katilimci_cikar" && (!vivaUuidMu(v.kisi_id) || !["ic", "eclub"].includes(String(v.tur)))) throw new VivaHatasi("Geçersiz katılımcı.");
    await rpc(String(v.islem), { surum: v.surum, kisi_id: v.kisi_id, tur: v.tur });
    try { const m = await vivaSunucuMutabakat(v.etkinlik_id, db); if (m.bekle || m.islem_durumu !== "tamam") return vivaYanit({ mesaj: "Erişim kapatıldı; Daily işlemi tamamlanıyor.", tekrar_gerekli: true }, 202); }
    catch { return vivaYanit({ mesaj: "Erişim kapatıldı; Daily işlemi yeniden denenecek.", tekrar_gerekli: true }, 202); }
    return vivaYanit({ mesaj: v.islem === "bitir" ? "Görüşme herkes için bitirildi." : "Katılımcı çıkarıldı." });
  } catch (err) { return err instanceof VivaDailyHatasi ? vivaYanit({ hata: err.message }, err.status) : vivaHata(err); }
}
