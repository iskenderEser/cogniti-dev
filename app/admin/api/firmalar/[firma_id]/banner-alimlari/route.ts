import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

const SAYFA_BOYUTU = 20;

export async function GET(request: Request, { params }: { params: Promise<{ firma_id: string }> }) {
  try {
    const { firma_id } = await params;
    if (!uuidGecerliMi(firma_id)) return partnerYanit({ hata: "Geçersiz firma." }, 400);
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;

    const q = new URL(request.url).searchParams;
    const ay = q.get("ay") ?? "";
    const sayfaMetni = q.get("sayfa") ?? "0";
    if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(ay) || !/^\d{1,5}$/.test(sayfaMetni)
      || q.getAll("ay").length !== 1 || q.getAll("sayfa").length > 1) {
      return partnerYanit({ hata: "Geçersiz ay veya sayfa." }, 400);
    }

    const sayfa = Number(sayfaMetni);
    const baslangic = new Date(ay + "-01T00:00:00+03:00");
    const [yil, ayNo] = ay.split("-").map(Number);
    const sonrakiAy = new Date(Date.UTC(yil, ayNo, 1) - 3 * 3600_000);
    const db = createAdminClient(AbortSignal.timeout(10000));
    const { data: alımlar, error, count } = await db.from("cogniti_token_tuketimleri")
      .select("tuketim_id,kaynak_id,islem_turu,miktar,created_at", { count: "exact" })
      .eq("firma_id", firma_id)
      .in("islem_turu", ["banner_yayin", "banner_iptal"])
      .gte("created_at", baslangic.toISOString()).lt("created_at", sonrakiAy.toISOString())
      .order("created_at", { ascending: false }).order("tuketim_id", { ascending: false })
      .range(sayfa * SAYFA_BOYUTU, (sayfa + 1) * SAYFA_BOYUTU - 1);
    if (error || !alımlar || count === null) throw Error("Banner alımları okunamadı.");

    const satirlar = [];
    if (alımlar.length) {
      const { data: rezervasyonlar, error: rezervasyonHatasi } = await db.from("firma_banner_rezervasyonlari")
        .select("rezervasyon_id,alan,sira,baslangic,hafta_sayisi,haftalik_token")
        .eq("firma_id", firma_id).in("rezervasyon_id", alımlar.map(alim => alim.kaynak_id));
      if (rezervasyonHatasi || !rezervasyonlar) throw Error("Banner bilgileri okunamadı.");
      const rezervasyonById = new Map(rezervasyonlar.map(r => [r.rezervasyon_id, r]));
      for (const alim of alımlar) {
        const rezervasyon = rezervasyonById.get(alim.kaynak_id);
        if (!rezervasyon) throw Error("Banner bilgileri doğrulanamadı.");
        satirlar.push({ ...rezervasyon, ...alim });
      }
    }

    return partnerYanit({ firma_id, ay, sayfa, toplam: count, sayfa_boyutu: SAYFA_BOYUTU, satirlar });
  } catch {
    return partnerYanit({ hata: "Banner alımları alınamadı. Yeniden deneyin." }, 503);
  }
}
