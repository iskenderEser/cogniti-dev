import { createAdminClient } from "@/lib/supabase/server";
import { vivaEpostaKuyrugunuIsle } from "@/lib/viva/epostaGonderimSunucu";
import {
  vivaEtkinlikIptalEpostalariGonder,
  vivaKatilimciDavetEpostalariGonder,
} from "@/lib/viva/katilimciEposta";
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
    const agoraSiparisId = q.get("agora_siparis");
    if (agoraSiparisId !== null && !vivaUuidMu(agoraSiparisId)) throw new VivaHatasi("Geçersiz canlı yayın siparişi.");
    const offset = Number(q.get("offset") ?? 0);
    if (!Number.isSafeInteger(offset) || offset < 0) throw new VivaHatasi("Geçersiz sayfa.");
    return vivaYanit(await vivaOku(islem, { etkinlik_id: id, agora_siparis_id: agoraSiparisId, offset }));
  } catch (err) { return vivaHata(err); }
}
export async function POST(req: Request) {
  try {
    const { islem, ...veri } = await vivaGirdi(req);
    const islemAdi = String(islem);
    const sonuc = await vivaYaz(islemAdi, veri);
    if (vivaUuidMu(veri.etkinlik_id)) {
      const origin = new URL(req.url).origin;
      if (["olustur", "kaydet", "davet_yeniden_dene"].includes(islemAdi)) {
        const db = createAdminClient();
        try {
          await vivaEpostaKuyrugunuIsle(db, origin, Date.now() + 8000);
        } catch {
          // Kuyruk cron tarafından yeniden işlenir.
        }
        if (["olustur", "kaydet"].includes(islemAdi)) {
          try {
            await vivaKatilimciDavetEpostalariGonder(db, String(veri.etkinlik_id), origin);
          } catch {
            // Kayıt işlemi e-posta hatasından bağımsızdır.
          }
        }
      } else if (islemAdi === "iptal") {
        const db = createAdminClient();
        try {
          await vivaEtkinlikIptalEpostalariGonder(db, String(veri.etkinlik_id));
        } catch {
          // İptal kaydı e-posta hatasından bağımsızdır.
        }
      }
    }
    if (["kaydet", "iptal", "davet_iptal", "davet_ekle"].includes(islemAdi) && vivaUuidMu(veri.etkinlik_id)) {
      try { await vivaSunucuMutabakat(veri.etkinlik_id); }
      catch { return vivaYanit({ ...sonuc, uyari: "Değişiklik kaydedildi; Daily erişim işlemi sunucuda yeniden denenecek." }, 202); }
    }
    return vivaYanit(sonuc);
  } catch (err) { return vivaHata(err); }
}
