import { TALEP_TURU_SIRA, TALEP_TURU_KURALLARI, type TalepTuru } from "@/lib/uretici/yetenekler";
import { TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";
import { egitimAdiDogrula } from "@/lib/agora/partnerEgitimleri";
import { partnerKelimeSayisi } from "@/lib/agora/partnerEgitimFormu";

export const CANLI_YAYIN_SURELERI = [45, 60, 120, 180] as const;
export type CanliYayinSuresi = (typeof CANLI_YAYIN_SURELERI)[number];

export const CANLI_YAYIN_KAPASITELERI = [15, 20, 25, 30, 40, 50] as const;
export type CanliYayinKapasitesi = (typeof CANLI_YAYIN_KAPASITELERI)[number];

/** Aynı partnerin art arda iki canlı yayını arasındaki zorunlu tampon süresi (dakika). */
export const CANLI_YAYIN_TAMPON_DAKIKA = 30;
export const AGORA_CANLI_HIZMET_ORANI = 0.15;

export interface CanliMaliyetOzeti {
  fiyatTl: number;
  hizmetBedeliTl: number;
  netHakedisTl: number;
}

const yuvarla2 = (n: number) => Math.round(n * 100) / 100;

export function canliSureGecerliMi(deger: unknown): deger is CanliYayinSuresi {
  return typeof deger === "number" && (CANLI_YAYIN_SURELERI as readonly number[]).includes(deger);
}

export function canliKapasiteGecerliMi(deger: unknown): deger is CanliYayinKapasitesi {
  return typeof deger === "number" && (CANLI_YAYIN_KAPASITELERI as readonly number[]).includes(deger);
}

export function canliHakedisOzetiHesapla(fiyatTl: number): CanliMaliyetOzeti {
  const yuvarliFiyat = yuvarla2(fiyatTl);
  const hizmetBedeliTl = yuvarla2(yuvarliFiyat * AGORA_CANLI_HIZMET_ORANI);
  const netHakedisTl = yuvarla2(yuvarliFiyat - hizmetBedeliTl);
  return { fiyatTl: yuvarliFiyat, hizmetBedeliTl, netHakedisTl };
}

export interface CanliOturumAraligi {
  baslangicMs: number;
  sureDakika: number;
}

/**
 * Yeni oturum ile mevcut oturumların [baslangic, bitis + 30 dk tampon] pencerelerinin
 * kesişip kesişmediğini denetler. Bitiş + 30 dk anında yeni oturum başlatılabilir.
 */
export function canliOturumTamponCakisiyorMu(
  yeni: CanliOturumAraligi,
  mevcutlar: readonly CanliOturumAraligi[],
): boolean {
  const tamponMs = CANLI_YAYIN_TAMPON_DAKIKA * 60_000;
  const yeniBitisTampon = yeni.baslangicMs + yeni.sureDakika * 60_000 + tamponMs;
  for (const m of mevcutlar) {
    const mBitisTampon = m.baslangicMs + m.sureDakika * 60_000 + tamponMs;
    if (yeni.baslangicMs < mBitisTampon && m.baslangicMs < yeniBitisTampon) {
      return true;
    }
  }
  return false;
}

export type CanliYayinKategoriKodu = TalepTuru | "kisisel_gelisim";

export const CANLI_YAYIN_KATEGORILERI: readonly {
  kod: CanliYayinKategoriKodu;
  ad: string;
  kategori: string;
}[] = [
  ...TALEP_TURU_SIRA.map((kod) => ({
    kod,
    ad: TALEP_TURU_KURALLARI[kod].ad,
    kategori: TALEP_TURU_KURALLARI[kod].icerikTuru,
  })),
  {
    kod: "kisisel_gelisim",
    ad: "Kişisel Gelişim Eğitimleri",
    kategori: "Kişisel Gelişim Eğitimleri",
  },
];

export interface PartnerCanliEgitimDogrulamaSonucu {
  egitim_adi: string;
  kategori_kodu: CanliYayinKategoriKodu;
  kategori: string;
  hedef_roller: HedefRol[];
  aciklama: string;
  sure_dakika: CanliYayinSuresi;
  kapasite: CanliYayinKapasitesi;
  fiyat_tl: number;
}

export function partnerCanliEgitimDogrula(
  body: Record<string, unknown>,
): { ok: true; veri: PartnerCanliEgitimDogrulamaSonucu; ozet: CanliMaliyetOzeti } | { ok: false; hata: string } {
  const ad = egitimAdiDogrula(body.egitim_adi);
  if (!ad) return { ok: false, hata: "Yayın Adı 3–200 karakter olmalıdır." };

  const secilenKategori =
    typeof body.kategori === "string"
      ? CANLI_YAYIN_KATEGORILERI.find((k) => k.kod === body.kategori)
      : undefined;
  if (!secilenKategori) {
    return { ok: false, hata: "Yayın Kategorisi seçin." };
  }

  const hedefler = body.hedef_roller;
  const roller = Array.isArray(hedefler) && hedefler.length > 0
    && hedefler.every((r: unknown) => typeof r === "string" && TUM_HEDEF_ROLLER.includes(r as HedefRol))
    ? TUM_HEDEF_ROLLER.filter((r) => hedefler.includes(r))
    : null;
  if (!roller) return { ok: false, hata: "Geçerli bir Hedef Kitle seçin." };

  if (
    typeof body.aciklama !== "string" ||
    !body.aciklama.trim() ||
    body.aciklama.length > 10000 ||
    partnerKelimeSayisi(body.aciklama) > 500
  ) {
    return { ok: false, hata: "Yayın Hakkında alanına en fazla 500 kelime yazın." };
  }

  const sure = Number(body.sure_dakika);
  if (!canliSureGecerliMi(sure)) {
    return { ok: false, hata: "Yayın süresi 45, 60, 120 veya 180 dakika olmalıdır." };
  }

  const kapasite = Number(body.kapasite);
  if (!canliKapasiteGecerliMi(kapasite)) {
    return { ok: false, hata: "Katılımcı kapasitesi 15, 20, 25, 30, 40 veya 50 olmalıdır." };
  }

  const fiyatMetin = typeof body.fiyat_tl === "number" ? String(body.fiyat_tl) : body.fiyat_tl;
  if (typeof fiyatMetin !== "string" || !/^\d{1,10}([.,]\d{1,2})?$/.test(fiyatMetin)) {
    return { ok: false, hata: "Fiyatı TL olarak, en fazla iki ondalıkla girin." };
  }
  const fiyat = yuvarla2(Number(fiyatMetin.replace(",", ".")));
  if (!Number.isFinite(fiyat) || fiyat <= 0 || fiyat > 9999999999.99) {
    return { ok: false, hata: "Fiyat geçersiz." };
  }

  const ozet = canliHakedisOzetiHesapla(fiyat);
  if (ozet.netHakedisTl <= 0) {
    return { ok: false, hata: "Yayın satış fiyatı sıfırdan büyük olmalıdır." };
  }

  return {
    ok: true,
    veri: {
      egitim_adi: ad,
      kategori_kodu: secilenKategori.kod,
      kategori: secilenKategori.kategori,
      hedef_roller: roller,
      aciklama: body.aciklama.trim(),
      sure_dakika: sure,
      kapasite,
      fiyat_tl: fiyat,
    },
    ozet,
  };
}
