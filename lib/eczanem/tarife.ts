// Puan–TL: merkezi firma tanımı. Barkod ve satış fiyatı: ürün bazında.
// Mevcut tarife tarihçesi korunur; indirim talebi oranı snapshot olarak saklar.
import { SupabaseClient } from "@supabase/supabase-js";

export interface TarifeGiris {
  urun_id: string;
  barkod: string;
  satis_fiyati: number;
  olusturan_id: string;
}

export interface TarifeSonuc {
  ok: boolean;
  hata?: string;
  // Yeni tarife satırı açıldı mı (değer değiştiyse true, aynıysa false).
  yeniTarife?: boolean;
}

export interface GuncelTarife {
  puan: number;
  tl: number;
  satis_fiyati: number | null;
}

// Ürünün şu an geçerli tarifesi: gecerlilik_baslangic <= now olan en son satır.
// Hiç tarife yoksa null (ürün ilk kez eczanem yayınına giriyor).
export async function guncelTarife(
  adminSupabase: SupabaseClient,
  urun_id: string
): Promise<GuncelTarife | null> {
  const simdi = new Date().toISOString();
  const { data } = await adminSupabase
    .from("eczanem_merkezi_urun_tarifeleri")
    .select("puan, tl, satis_fiyati")
    .eq("urun_id", urun_id)
    .lte("gecerlilik_baslangic", simdi)
    .order("gecerlilik_baslangic", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { puan: data.puan, tl: Number(data.tl), satis_fiyati: data.satis_fiyati == null ? null : Number(data.satis_fiyati) };
}

// Barkod + Karşılık'ı ürün seviyesine yazar:
//  1) urunler.barkod her hâlükârda güncellenir (ürün kimliği — tek güncel değer).
//  2) Karşılık yalnız değiştiyse yeni tarife satırı açılır (append-only, ileriye
//     işler); değişmediyse tarihçe şişirilmez (K-E3: değer aynıysa satır açılmaz).
export async function tarifeVeBarkodYaz(
  adminSupabase: SupabaseClient,
  giris: TarifeGiris
): Promise<TarifeSonuc> {
  const { urun_id, barkod, satis_fiyati, olusturan_id } = giris;
  const { data: urun, error: urunHatasi } = await adminSupabase.from("urunler").select("firma_id").eq("urun_id", urun_id).single();
  if (urunHatasi || !urun?.firma_id) return { ok: false, hata: "Ürünün firması doğrulanamadı." };
  const { data: oran, error: oranHatasi } = await adminSupabase.from("eczanem_firma_cek_tanimlari").select("karsilik_puan,karsilik_tl").eq("firma_id", urun.firma_id).maybeSingle();
  if (oranHatasi || !oran) return { ok: false, hata: "Firma için Eczanem puan–TL karşılığı tanımlanmalıdır." };
  const puan = oran.karsilik_puan, tl = Number(oran.karsilik_tl);

  // 1) Barkod — ürün seviyesinde tek güncel değer.
  const { error: barkodHatasi } = await adminSupabase
    .from("urunler")
    .update({ barkod })
    .eq("urun_id", urun_id);

  if (barkodHatasi) return { ok: false, hata: "Barkod yazılamadı." };

  // 2) Karşılık — puan, tl veya satış fiyatı değişmediyse yeni satır açma.
  const { data: mevcut } = await adminSupabase.from("eczanem_urun_tarifeleri").select("puan,tl,satis_fiyati")
    .eq("urun_id", urun_id).lte("gecerlilik_baslangic", new Date().toISOString()).order("gecerlilik_baslangic", { ascending: false }).limit(1).maybeSingle();
  if (mevcut && mevcut.puan === puan && Number(mevcut.tl) === Number(tl) && Number(mevcut.satis_fiyati) === Number(satis_fiyati)) {
    return { ok: true, yeniTarife: false };
  }

  const { error: tarifeHatasi } = await adminSupabase
    .from("eczanem_urun_tarifeleri")
    .insert({
      urun_id,
      puan,
      tl,
      satis_fiyati,
      gecerlilik_baslangic: new Date().toISOString(),
      olusturan_id,
    });

  if (tarifeHatasi) return { ok: false, hata: "Karşılık (tarife) yazılamadı." };

  return { ok: true, yeniTarife: true };
}
