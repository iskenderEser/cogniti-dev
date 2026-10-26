import { vivaGirdi, vivaHata, vivaKullanici, vivaYanit, VivaHatasi } from "@/lib/viva/sunucu";
import { vivaUuidMu } from "@/lib/viva/sozlesme";
import { vivaAnketTaslagi } from "@/lib/viva/anket";
export const dynamic = "force-dynamic";
async function islem(etkinlik: unknown, is: string, veri: Record<string, unknown> = {}) {
  if (!vivaUuidMu(etkinlik)) throw new VivaHatasi("Geçersiz etkinlik.");
  const { db, user } = await vivaKullanici();
  const { data, error } = await db.rpc("viva_anket_islem", { p_auth: user.id, p_etkinlik: etkinlik, p_islem: is, p_veri: veri });
  if (error) throw error;
  return vivaYanit(data);
}
export async function GET(req: Request) {
  try { const q = new URL(req.url).searchParams, is = q.get("islem") ?? "liste";
    if (!["liste", "aktif"].includes(is)) throw new VivaHatasi("Geçersiz anket işlemi.");
    return await islem(q.get("etkinlik_id"), is);
  } catch (e) { return vivaHata(e); }
}
export async function POST(req: Request) {
  try {
    const p = await vivaGirdi(req, 256_000), is = String(p.islem);
    if (!["soru_ekle", "sorular_yukle", "soru_sil", "ac", "kapat", "cevap"].includes(is)) throw new VivaHatasi("Geçersiz anket işlemi.");
    if (["ac", "soru_sil"].includes(is) && !vivaUuidMu(p.soru_id)) throw new VivaHatasi("Geçersiz soru.");
    if (["ac", "kapat", "cevap"].includes(is) && !vivaUuidMu(p.oturum_id)) throw new VivaHatasi("Geçersiz anket.");
    if (is === "cevap" && (!Number.isInteger(p.secim) || Number(p.secim) < 0 || Number(p.secim) > 7)) throw new VivaHatasi("Geçersiz cevap.");
    if (["soru_ekle", "sorular_yukle"].includes(is)) {
      const liste = is === "soru_ekle" ? [p.soru] : p.sorular;
      if (!Array.isArray(liste) || !liste.length || liste.length > 50) throw new VivaHatasi("Geçersiz soru listesi.");
      const sorular = liste.map(v => {
        const d = v as Record<string, unknown> | null;
        if (!d || !vivaUuidMu(d.id)) throw new VivaHatasi("Geçersiz soru.");
        try { return { ...vivaAnketTaslagi(d), id: d.id }; } catch (e) { throw new VivaHatasi(e instanceof Error ? e.message : "Geçersiz soru."); }
      });
      if (is === "soru_ekle") p.soru = sorular[0]; else p.sorular = sorular;
    }
    const veri = { ...p }; delete veri.etkinlik_id; delete veri.islem;
    return await islem(p.etkinlik_id, is, veri);
  } catch (e) { return vivaHata(e); }
}
