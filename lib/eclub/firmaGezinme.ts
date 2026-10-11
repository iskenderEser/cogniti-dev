export interface EclubGezinmeFirmasi {
  firma_id: string;
  firma_adi: string;
  eclub_store_aktif: boolean;
  logo_url?: string | null;
}

export type EclubFirmaSayfasi = "yayinlar" | "performans" | "hediye-cekleri" | "cek-talepleri";

export function eclubFirmaAdiYolu(firmaAdi: string): string {
  return firmaAdi.trim().toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Eski UUID bağlantıları da çözülür; aynı ada sahip firmalarda belirsiz eşleşme yapılmaz. */
export function eclubFirmaRotasiKapsami<T extends {
  firma_id: string; firma_adi: string; aktif: boolean | null;
  eclub_aktif: boolean | null; eclub_store_aktif: boolean | null;
}>(firmalar: T[], rota: string, cekSayfasi = false): T[] {
  const kapsam = eclubFirmaKapsami(firmalar, null);
  const eslesen = kapsam.filter((firma) => firma.firma_id === rota || eclubFirmaAdiYolu(firma.firma_adi) === rota);
  return eslesen.length === 1 && (!cekSayfasi || eslesen[0].eclub_store_aktif === true) ? eslesen : [];
}

export function eclubFirmaYolu(firmaAdi: string, sayfa: EclubFirmaSayfasi): string {
  const yollar: Record<EclubFirmaSayfasi, string> = {
    yayinlar: "yayinlar",
    performans: "yayin-tamamlama-performansi",
    "hediye-cekleri": "hediye-ceki-talebi",
    "cek-talepleri": "hediye-ceki-takibi",
  };
  return `/eclub/firma/${encodeURIComponent(eclubFirmaAdiYolu(firmaAdi))}/${yollar[sayfa]}`;
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

export function eclubUrunIcerigi<T extends { urun_id?: string | null }>(icerikler: T[], urunId: string | null): T[] {
  return urunId ? icerikler.filter((icerik) => icerik.urun_id === urunId) : [];
}
