export const FATURA_KALEMLERI = [
  { id: "kko", baslik: "Kullandığın Kadar Öde", grup: "paket" },
  { id: "esnek", baslik: "Esnek Paket", grup: "paket" },
  { id: "abonelik", baslik: "Aylık Abonelik Paketleri", grup: "paket" },
  { id: "viva", baslik: "Viva Kullanımı", grup: "diger" },
  { id: "banner", baslik: "Banner Alımı", grup: "diger" },
  { id: "agora", baslik: "Agora Yayını Alımı", grup: "diger" },
  { id: "icerik", baslik: "İçerik Üretimi Alımı", grup: "diger" },
  { id: "firmstore", baslik: "FirmaStore Çekleri", grup: "cek" },
  { id: "eczane", baslik: "Eczane Çekleri", grup: "cek" },
] as const;
export const FATURA_BOLUMLERI = [
  { id: "proforma", baslik: "Onaylı Proforma Faturalar", eskiSayfa: "proforma-fatura" },
  { id: "giden", baslik: "Giden Faturalar", eskiSayfa: "faturalar" },
] as const;
export type FaturaKalemi = typeof FATURA_KALEMLERI[number]["id"];
export type FaturaBolumu = typeof FATURA_BOLUMLERI[number]["id"];
export type FaturaSayfasi = `${FaturaBolumu}-${FaturaKalemi}`;
export const FATURA_SAYFALARI = Object.fromEntries(FATURA_BOLUMLERI.flatMap(bolum =>
  FATURA_KALEMLERI.map(kalem => [`${bolum.id}-${kalem.id}`, {
    baslik: kalem.baslik, grup: "Abonelik Yönetimi", bolum, kalem,
  }]),
)) as Record<FaturaSayfasi, {
  baslik: string; grup: string;
  bolum: typeof FATURA_BOLUMLERI[number];
  kalem: typeof FATURA_KALEMLERI[number];
}>;
export function faturaSayfasiBilgisi(sayfa: string) {
  return Object.hasOwn(FATURA_SAYFALARI, sayfa) ? FATURA_SAYFALARI[sayfa as FaturaSayfasi] : undefined;
}
