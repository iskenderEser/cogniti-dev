export interface EclubGezinmeFirmasi {
  firma_id: string;
  firma_adi: string;
  eclub_store_aktif: boolean;
  logo_url?: string | null;
}

export type EclubFirmaSayfasi = "yayinlar" | "hediye-cekleri" | "cek-talepleri";

export function eclubFirmaYolu(firmaId: string, sayfa: EclubFirmaSayfasi): string {
  return `/eclub/firma/${encodeURIComponent(firmaId)}/${sayfa}`;
}

export function eclubFirmaKapsami<T extends {
  firma_id: string;
  aktif: boolean | null;
  eclub_aktif: boolean | null;
  eclub_store_aktif: boolean | null;
}>(firmalar: T[], firmaId: string | null, cekSayfasi = false): T[] {
  return firmalar.filter((firma) => firma.aktif !== false && firma.eclub_aktif === true
    && (!cekSayfasi || firma.eclub_store_aktif === true)
    && (firmaId === null || firma.firma_id === firmaId));
}

export function eclubUrunGruplari<T extends {
  firma_id: string; firma_adi: string; urun_id: string; urun_adi: string;
}>(yayinlar: T[]) {
  const gruplar = new Map<string, { anahtar: string; firmaAdi: string; urunAdi: string; yayinlar: T[] }>();
  for (const yayin of yayinlar) {
    const anahtar = `${yayin.firma_id}:${yayin.urun_id}`;
    const grup = gruplar.get(anahtar) ?? { anahtar, firmaAdi: yayin.firma_adi, urunAdi: yayin.urun_adi, yayinlar: [] };
    grup.yayinlar.push(yayin);
    gruplar.set(anahtar, grup);
  }
  return [...gruplar.values()].sort((a,b) => a.firmaAdi.localeCompare(b.firmaAdi, "tr") || a.urunAdi.localeCompare(b.urunAdi, "tr"));
}

export interface EclubFirmaUrunu { urun_id: string; urun_adi: string }

export function eclubSeciliUrun(urunler: EclubFirmaUrunu[], istenenId: string | null): EclubFirmaUrunu | null {
  return urunler.find((urun) => urun.urun_id === istenenId) ?? urunler[0] ?? null;
}

export function eclubUrunYolu(firmaId: string, sayfa: EclubFirmaSayfasi, urunId: string | null): string {
  return `${eclubFirmaYolu(firmaId, sayfa)}${urunId ? `?urun_id=${encodeURIComponent(urunId)}` : ""}`;
}

export function eclubUrunIcerigi<T extends { urun_id?: string | null }>(icerikler: T[], urunId: string | null): T[] {
  return urunId ? icerikler.filter((icerik) => icerik.urun_id === urunId) : [];
}
