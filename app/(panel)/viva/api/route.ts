import { vivaListeSorgusu } from "@/lib/viva/liste";
import { vivaListeEkraniOku } from "@/lib/viva/listeSunucu";
import { vivaGirdi, vivaHata, vivaOku, vivaYanit, vivaYaz, VivaHatasi } from "@/lib/viva/sunucu";
import { vivaSunucuMutabakat } from "@/lib/viva/yasamSunucu";
import { vivaUuidMu } from "@/lib/viva/sozlesme";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const islem = q.get("islem") ?? "liste";
    if (islem === "liste_ekrani") {
      let sorgu;
      try { sorgu = vivaListeSorgusu(q); } catch { throw new VivaHatasi("Geçersiz etkinlik filtresi."); }
      return vivaYanit(await vivaListeEkraniOku(sorgu, req.signal));
    }
    if (!["baglam", "liste", "detay"].includes(islem)) throw new VivaHatasi("Geçersiz işlem.");
    const id = q.get("etkinlik_id");
    if (islem === "detay" && !vivaUuidMu(id)) throw new VivaHatasi("Geçersiz etkinlik.");
    const offset = Number(q.get("offset") ?? 0);
    if (!Number.isSafeInteger(offset) || offset < 0) throw new VivaHatasi("Geçersiz sayfa.");
    return vivaYanit(await vivaOku(islem, { etkinlik_id: id, offset }));
  } catch (err) { return vivaHata(err); }
}
export async function POST(req: Request) {
  try {
    const { islem, ...veri } = await vivaGirdi(req);
    const sonuc = await vivaYaz(String(islem), veri);
    if (["kaydet", "iptal", "davet_iptal", "davet_ekle"].includes(String(islem)) && vivaUuidMu(veri.etkinlik_id)) {
      try { await vivaSunucuMutabakat(veri.etkinlik_id); }
      catch { return vivaYanit({ ...sonuc, uyari: "Değişiklik kaydedildi; Daily erişim işlemi sunucuda yeniden denenecek." }, 202); }
    }
    return vivaYanit(sonuc);
  } catch (err) { return vivaHata(err); }
}
