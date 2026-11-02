// UTT/KD_UTT/BM vitrini: firma seçimi ve firmaya özel Baz Puan.
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, sunucuHatasi, yetkiHatasi, rolHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { STORE_ALABILEN_ROLLER } from "@/lib/utils/roller";
import { harcamaBakiyesi } from "@/lib/tclub/store/bakiye";
import { hbstoreFirmaBaglami } from "@/lib/tclub/store/firmaUrun";
import { firmaMagazaCekleri } from "@/lib/tclub/store/firmaCekleri";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { hbstoreTakvimDurumu } from "@/lib/tclub/store/takvim";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

const CEVAP_BASLIKLARI = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();
    const db = createAdminClient();
    const rol = await rolCozucu(db, user.id);
    if (!STORE_ALABILEN_ROLLER.includes(rol)) return rolHatasi("FirmaStore'a erişim yetkiniz yok.");
    const firma = await hbstoreFirmaBaglami(db, user.id);
    if (firma.hata) return hataYaniti("Firma bilgisi alınamadı.", "FirmaStore firma bağlamı", firma.hata);
    if (!firma.firmaId || !firma.hbstoreAktif) return rolHatasi("Firmanız için FirmaStore kullanıma açık değil.");
    const q = new URL(request.url).searchParams;
    const tip = q.get("tip") || "urunler";
    if (tip === "takvim") return NextResponse.json({ takvim: hbstoreTakvimDurumu() }, { headers: CEVAP_BASLIKLARI });
    if (tip === "bakiye") {
      const bakiye = await harcamaBakiyesi(db, user.id);
      return NextResponse.json({ bakiye, takvim: hbstoreTakvimDurumu() }, { headers: CEVAP_BASLIKLARI });
    }
    if (!["urunler", "urun", "istatistikler"].includes(tip)) {
      return validasyonHatasi(`Geçersiz tip parametresi: ${tip}`, ["tip"]);
    }
    const urunId = tip === "urun" ? q.get("urun_id") : null;
    if (tip === "urun" && !uuidGecerliMi(urunId)) return validasyonHatasi("Geçerli ürün kimliği zorunludur.", ["urun_id"]);
    const { cekler, hata } = await firmaMagazaCekleri(db, firma.firmaId, urunId ?? undefined);
    if (hata) return hataYaniti("Firma çekleri alınamadı.", "FirmaStore firma çek vitrini", hata);

    if (tip === "urunler") {
      return NextResponse.json({
        urunler: cekler,
        takvim: hbstoreTakvimDurumu(),
      }, { headers: CEVAP_BASLIKLARI });
    }
    if (tip === "urun") {
      const urun = cekler[0];
      if (!urun) return NextResponse.json({ hata: "Ürün bulunamadı." }, { status: 404, headers: CEVAP_BASLIKLARI });
      return NextResponse.json({ urun, takvim: hbstoreTakvimDurumu() }, { headers: CEVAP_BASLIKLARI });
    }

    // Firma genelindeki sipariş adet/puan toplamı; iptaller hariç, sayfalı okuma.
    let toplamCekAdedi = 0, toplamPuan = 0, offset = 0;
    const sayfaBoyutu = 500;
    while (true) {
      const { data, count, error } = await db.from("store_siparisler")
        .select("adet,toplam_puan,kullanicilar!inner(firma_id,rol)", { count: "exact" })
        .eq("kullanicilar.firma_id", firma.firmaId).in("kullanicilar.rol", STORE_ALABILEN_ROLLER)
        .neq("durum", "iptal").order("siparis_id", { ascending: true }).range(offset, offset + sayfaBoyutu - 1);
      if (error) return hataYaniti("Sipariş toplamları alınamadı.", "FirmaStore firma siparişleri", error);
      const siparisler = data ?? [];
      for (const siparis of siparisler) { toplamCekAdedi += siparis.adet; toplamPuan += siparis.toplam_puan; }
      offset += siparisler.length;
      if (!siparisler.length || (count !== null && offset >= count)) break;
    }
    return NextResponse.json({ cek_sayisi: cekler.length, toplam_cek_adedi: toplamCekAdedi, toplam_puan: toplamPuan }, { headers: CEVAP_BASLIKLARI });
  } catch (error) { return sunucuHatasi(error, "GET /store/api"); }
}
