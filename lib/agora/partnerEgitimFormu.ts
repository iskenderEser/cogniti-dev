import { TALEP_TURU_SIRA, TALEP_TURU_KURALLARI, type TalepTuru } from "@/lib/uretici/yetenekler";
import { TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";
import { taslaklariDogrula, type SoruTaslagi } from "@/lib/soru/taslak";
import { egitimAdiDogrula } from "@/lib/agora/partnerEgitimleri";

export interface PartnerEgitimFormVerisi {
  egitim_adi: string; kategori: TalepTuru | ""; hedef_roller: HedefRol[];
  yayin_araci: "video" | "podcast"; aciklama: string; fiyat_tl: string;
  soru_seti_buyuklugu: number; secenek_sayisi: number; yayin_basi_soru: number;
  soru_taslaklari: SoruTaslagi[];
}
export const bosPartnerEgitimFormu = (): PartnerEgitimFormVerisi => ({
  egitim_adi: "", kategori: "", hedef_roller: [], yayin_araci: "video", aciklama: "", fiyat_tl: "",
  soru_seti_buyuklugu: 10, secenek_sayisi: 2, yayin_basi_soru: 2, soru_taslaklari: [],
});
export const partnerKelimeSayisi = (metin: string) => metin.trim().split(/\s+/u).filter(Boolean).length;
export function partnerEgitimFormDogrula(body: Record<string, unknown>) {
  const ad = egitimAdiDogrula(body.egitim_adi);
  if (!ad) return { ok: false as const, hata: "Eğitim Adı 3–200 karakter olmalıdır." };
  if (typeof body.kategori !== "string" || !TALEP_TURU_SIRA.includes(body.kategori as TalepTuru)) return { ok: false as const, hata: "Eğitim Kategorisi seçin." };
  // Agora eğitimi birden çok kitleye sunulabilir; firma yayın grubunun tekli kuralı uygulanmaz.
  const hedefler = body.hedef_roller;
  const roller = Array.isArray(hedefler) && hedefler.length > 0
    && hedefler.every((r: unknown) => typeof r === "string" && TUM_HEDEF_ROLLER.includes(r as HedefRol))
    ? TUM_HEDEF_ROLLER.filter(r => hedefler.includes(r)) : null;
  if (!roller) return { ok: false as const, hata: "Geçerli bir Hedef Kitle seçin." };
  if (body.yayin_araci !== "video" && body.yayin_araci !== "podcast") return { ok: false as const, hata: "Video veya Podcast seçin." };
  if (typeof body.aciklama !== "string" || !body.aciklama.trim() || body.aciklama.length > 10000 || partnerKelimeSayisi(body.aciklama) > 500) return { ok: false as const, hata: "Eğitim Hakkında alanına en fazla 500 kelime yazın." };
  if (typeof body.fiyat_tl !== "string" || !/^\d{1,10}([.,]\d{1,2})?$/.test(body.fiyat_tl)) return { ok: false as const, hata: "Fiyatı TL olarak, en fazla iki ondalıkla girin." };
  const fiyat = Number(body.fiyat_tl.replace(",", "."));
  if (!Number.isFinite(fiyat) || fiyat < 0 || fiyat > 9999999999.99) return { ok: false as const, hata: "Fiyat geçersiz." };
  const sayi = Number(body.soru_seti_buyuklugu), secenek = Number(body.secenek_sayisi), basi = Number(body.yayin_basi_soru);
  if (![10,15,20,25].includes(sayi) || ![2,3,4].includes(secenek) || !Number.isSafeInteger(basi) || basi < 1 || basi > sayi) return { ok: false as const, hata: "Soru Seti Ayarları geçersiz." };
  if (!Array.isArray(body.soru_taslaklari) || body.soru_taslaklari.length > 25) return { ok: false as const, hata: "Soru Seti geçersiz." };
  const taslaklar: SoruTaslagi[] = [];
  for (const r of body.soru_taslaklari) {
    if (!r || typeof r !== "object" || typeof r.soru_metni !== "string" || r.soru_metni.length > 4000 || !Array.isArray(r.secenekler) || r.secenekler.length !== secenek || !r.secenekler.every((s: unknown) => typeof s === "string" && s.length <= 2000) || !(r.dogru === null || (Number.isInteger(r.dogru) && r.dogru >= 0 && r.dogru < secenek))) return { ok: false as const, hata: "Soru veya seçenek bilgileri geçersiz." };
    taslaklar.push({ soru_metni: r.soru_metni, secenekler: r.secenekler, dogru: r.dogru });
  }
  const eksik = taslaklariDogrula(taslaklar, sayi);
  if (eksik) return { ok: false as const, hata: eksik };
  return { ok: true as const, veri: {
    egitim_adi: ad, kategori: TALEP_TURU_KURALLARI[body.kategori as TalepTuru].icerikTuru,
    yayin_araci: body.yayin_araci, fiyat_tl: fiyat,
    bilgiler: { egitim_adi: ad, kategori: body.kategori, yayin_araci: body.yayin_araci, hedef_roller: roller, fiyat_tl: fiyat.toFixed(2), aciklama: body.aciklama.trim(), soru_seti_buyuklugu: sayi, secenek_sayisi: secenek, yayin_basi_soru: basi, soru_taslaklari: taslaklar, hazir_icerik: true, hazir_soru_seti: true },
  } };
}
