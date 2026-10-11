import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { eclubKisiErisimi } from "@/lib/eclub/kisiErisim";
import { eclubFirmaKapsami } from "@/lib/eclub/firmaGezinme";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import { rolHatasi, sunucuHatasi, validasyonHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";
import { eclubPerformansDonemi, eclubPerformansiHesapla, type PerformansBagi, type PerformansIzlemesi, type PerformansPuani, type PerformansKaybi, type PerformansUyesi } from "@/lib/eclub/performans";

type Sorgu<T> = { range: (ilk: number, son: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }> };
/** PostgREST'in satır sınırı nedeniyle dönem verisi eksik toplanmamalı. */
async function tumSatirlar<T>(sorgu: () => Sorgu<T>): Promise<T[]> {
  const sonuc: T[] = [];
  for (let ilk = 0; ; ilk += 500) {
    const { data, error } = await sorgu().range(ilk, ilk + 499);
    if (error) throw new Error(error.message);
    sonuc.push(...(data ?? []));
    if ((data?.length ?? 0) < 500) return sonuc;
  }
}
async function parcalar<T>(idler: string[], sorgu: (ids: string[]) => Sorgu<T>): Promise<T[]> {
  const sonuc: T[] = [];
  for (let i = 0; i < idler.length; i += 100) sonuc.push(...await tumSatirlar(() => sorgu(idler.slice(i, i + 100))));
  return sonuc;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const admin = createAdminClient();
    const erisim = await eclubKisiErisimi(admin, user.id);
    if (!erisim.kisi || !ECLUB_TUKETICI_ROLLERI.includes(erisim.kisi.rol)) return rolHatasi("Bu alan yalnız E-Club üyelerine açıktır.");
    const sorgu = new URL(request.url).searchParams;
    const firmaId = sorgu.get("firma_id"), urunId = sorgu.get("urun_id");
    if (!uuidGecerliMi(firmaId ?? "") || !uuidGecerliMi(urunId ?? "")) return validasyonHatasi("Geçersiz firma veya ürün.", ["firma_id", "urun_id"]);
    if (eclubFirmaKapsami(erisim.firmalar, firmaId).length === 0) return rolHatasi("Bu firmaya erişiminiz bulunmuyor.");
    const { data: urun, error: urunHatasi } = await admin.from("urunler").select("urun_id").eq("firma_id", firmaId!).eq("urun_id", urunId!).maybeSingle();
    if (urunHatasi) throw new Error(urunHatasi.message);
    if (!urun) return rolHatasi("Bu ürün seçilen firmaya ait değil.");
    const firmaBaglari = await tumSatirlar<{ eczane_id: string }>(() => admin.from("eclub_eczane_firma").select("eczane_id").in("eczane_id", erisim.eczane_idler).eq("firma_id", firmaId!).eq("aktif_mi", true).order("eczane_id"));
    const eczaneIdler = [...new Set(firmaBaglari.map(b => b.eczane_id))];
    if (!eczaneIdler.length) return rolHatasi("Aktif eczane–firma bağlantısı bulunamadı.");
    const donem = eclubPerformansDonemi();
    const yayinlar = await tumSatirlar<{ yayin_id: string }>(() => admin.from("v_yayin_kunye").select("yayin_id").eq("firma_id", firmaId!).eq("urun_id", urunId!).order("yayin_id"));
    const yayinIdler = [...new Set(yayinlar.map(y => y.yayin_id))];
    const bosVeri = () => eclubPerformansiHesapla({ donem, izlemeler: [], puanlar: [], kayiplar: [], uyeler: [], baglar: [], eczaneIdler, yayinIdler });
    if (!yayinIdler.length) return NextResponse.json(bosVeri(), { headers: { "Cache-Control": "private, no-store" } });
    const baglar = await tumSatirlar<PerformansBagi>(() => admin.from("eclub_kisi_eczane").select("kisi_id, eczane_id, baslangic_tarihi, bitis_tarihi, created_at, aktif_mi").in("eczane_id", eczaneIdler).order("id"));
    // Eski üyelerin kazanım anındaki eczane snapshot'ı korunur.
    const kapsamPuanlari = await parcalar<{ izleme_id: string; kisi_id: string }>(yayinIdler, ids => admin.from("eclub_kazanilan_puanlar").select("izleme_id, kisi_id").in("eczane_id", eczaneIdler).in("yayin_id", ids).gte("created_at", donem.baslangic).lt("created_at", donem.bitisHaric).lte("created_at", donem.simdi).order("kazanilan_puan_id"));
    const kisiIdler = [...new Set([...baglar.map(b => b.kisi_id), ...kapsamPuanlari.map(p => p.kisi_id)])];
    const izlemeler: PerformansIzlemesi[] = [];
    for (let i = 0; i < yayinIdler.length; i += 100) {
      const ids = yayinIdler.slice(i, i + 100);
      izlemeler.push(...await parcalar<PerformansIzlemesi>(kisiIdler, kisiler => admin.from("eclub_izleme_kayitlari")
        .select("izleme_id, kisi_id, yayin_id, arac_turu, izleme_bitis, tamamlandi_mi, ilerleme_durumu")
        .in("kisi_id", kisiler).in("yayin_id", ids).eq("tamamlandi_mi", true)
        .gte("izleme_bitis", donem.baslangic).lt("izleme_bitis", donem.bitisHaric).lte("izleme_bitis", donem.simdi).order("izleme_id")));
    }
    const izlemeIdler = [...new Set(izlemeler.map(i => i.izleme_id))];
    const [puanlar, kayiplar, uyeler] = await Promise.all([
      parcalar<PerformansPuani>(izlemeIdler, ids => admin.from("eclub_kazanilan_puanlar").select("kazanilan_puan_id, izleme_id, kisi_id, yayin_id, eczane_id, puan").in("izleme_id", ids).lte("created_at", donem.simdi).order("kazanilan_puan_id")),
      parcalar<PerformansKaybi>(izlemeIdler, ids => admin.from("eclub_ileri_sarma_kayitlari").select("kayit_id, izleme_id, kisi_id, yayin_id, kaybedilen_puan").in("izleme_id", ids).lte("created_at", donem.simdi).order("kayit_id")),
      parcalar<PerformansUyesi>([...new Set(izlemeler.map(i => i.kisi_id))], ids => admin.from("eclub_kisiler").select("kisi_id, ad, soyad").in("kisi_id", ids).order("kisi_id")),
    ]);
    return NextResponse.json(eclubPerformansiHesapla({ donem, izlemeler, puanlar, kayiplar, uyeler, baglar, eczaneIdler, yayinIdler }), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return sunucuHatasi(error, "GET /eclub/api/performans"); }
}
