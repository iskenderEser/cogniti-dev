import { BARKOD_DESENI } from "../barkod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolHatasi, sunucuHatasi, validasyonHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";

const headers = { "Cache-Control": "private, no-store" };

async function listeErisimi() {
  const { data: { user }, error: oturumHatasi } = await (await createClient()).auth.getUser();
  if (oturumHatasi || !user) return { gecerli: false as const, yanit: yetkiHatasi() };

  const db = createAdminClient();
  const { data: kimlik, error } = await db.from("kullanicilar").select("rol,firma_id,aktif_mi")
    .eq("kullanici_id", user.id).maybeSingle();
  if (error) throw error;
  if (kimlik?.aktif_mi !== true) return { gecerli: false as const, yanit: rolHatasi() };
  if (kimlik.rol?.toLowerCase() === "admin") return { gecerli: true as const, db, firmaId: null };
  if (!kimlik.firma_id) return { gecerli: false as const, yanit: rolHatasi() };

  const { data: firma, error: firmaHatasi } = await db.from("firmalar").select("aktif")
    .eq("firma_id", kimlik.firma_id).maybeSingle();
  if (firmaHatasi) throw firmaHatasi;
  if (firma?.aktif !== true) return { gecerli: false as const, yanit: rolHatasi() };
  return { gecerli: true as const, db, firmaId: kimlik.firma_id as string };
}

function satirlarGecerli(veri: unknown, sutunSayisi: number): veri is string[][] {
  return Array.isArray(veri) && veri.length > 0 && veri.length <= 2000 && veri.every(satir =>
    Array.isArray(satir) && satir.length === sutunSayisi && satir.every(hucre => typeof hucre === "string" && hucre.length <= 254),
  );
}

function urunSatirlariniTamamla(satirlar: unknown): unknown {
  if (!Array.isArray(satirlar)) return satirlar;
  return satirlar.map(satir => Array.isArray(satir) && satir.length === 3
    ? [satir[0], "", satir[1], satir[2]]
    : satir);
}

export function listeIslemleri(tur: "isim" | "urun") {
  const urunListesi = tur === "urun";
  const tablo = urunListesi ? "cogniti_kurumsal_urun_listesi" : "cogniti_kurumsal_isim_listesi";
  const rpc = urunListesi ? "cogniti_kurumsal_urun_listesi_yaz" : "cogniti_kurumsal_isim_listesi_yaz";

  async function GET() {
    try {
      const yetki = await listeErisimi();
      if (!yetki.gecerli) return yetki.yanit;
      const sorgu = yetki.db.from(tablo).select("firma_id,satirlar,gonderildi_at");
      const { data, error } = yetki.firmaId
        ? await sorgu.eq("firma_id", yetki.firmaId).maybeSingle()
        : await sorgu.not("gonderildi_at", "is", null).order("gonderildi_at", { ascending: false });
      if (error) throw error;
      if (!urunListesi || !data) return Response.json(data, { headers });
      const liste = Array.isArray(data)
        ? data.map(kayit => ({ ...kayit, satirlar: urunSatirlariniTamamla(kayit.satirlar) }))
        : { ...data, satirlar: urunSatirlariniTamamla(data.satirlar) };
      return Response.json(liste, { headers });
    } catch (error) {
      return sunucuHatasi(error, "Kurumsal liste okuma");
    }
  }

  async function PUT(istek: Request) {
    try {
      const yetki = await listeErisimi();
      if (!yetki.gecerli) return yetki.yanit;
      if (!yetki.firmaId) return rolHatasi();
      const girdi = await istek.json().catch(() => null);
      const satirlar: unknown = urunListesi ? urunSatirlariniTamamla(girdi?.satirlar) : girdi?.satirlar;
      const gonder: unknown = girdi?.gonder;
      if (!satirlarGecerli(satirlar, urunListesi ? 4 : 6) || typeof gonder !== "boolean") {
        return validasyonHatasi("Geçerli bir liste girin.");
      }
      if (urunListesi && satirlar.some(satir => !BARKOD_DESENI.test(satir[1]))) {
        return validasyonHatasi("Barkod 1–13 rakamdan oluşmalıdır.");
      }
      if (gonder && satirlar.some(satir => satir.some(hucre => !hucre.trim())
        || (!urunListesi && (!/^[^\s@]+@[^\s@]+$/.test(satir[4].trim()) || !/^5[0-9]{9}$/.test(satir[5].trim()))))) {
        return validasyonHatasi("Göndermeden önce eksik ve hatalı alanları düzeltin.");
      }
      const { data, error } = await yetki.db.rpc(rpc, {
        p_firma: yetki.firmaId, p_satirlar: satirlar, p_gonder: gonder,
      });
      if (urunListesi && error?.code === "22023") return validasyonHatasi(error.message);
      if (error) throw error;
      if (!data) return Response.json({ hata: "Liste daha önce gönderildi." }, { status: 409, headers });
      return Response.json({ ok: true }, { headers });
    } catch (error) {
      return sunucuHatasi(error, "Kurumsal liste kaydetme");
    }
  }

  async function DELETE() {
    try {
      const yetki = await listeErisimi();
      if (!yetki.gecerli) return yetki.yanit;
      if (!yetki.firmaId) return rolHatasi();
      const { error } = await yetki.db.from(tablo).delete().eq("firma_id", yetki.firmaId).is("gonderildi_at", null);
      if (error) throw error;
      return Response.json({ ok: true }, { headers });
    } catch (error) {
      return sunucuHatasi(error, "Kurumsal liste silme");
    }
  }

  return { GET, PUT, DELETE };
}
