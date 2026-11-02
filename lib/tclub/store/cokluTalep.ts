import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { bazPuanGecerliMi, minimumSiparisTlGecerliMi } from "./katalog";

export interface CokluCekTalebi {
  urun_id: string;
  adet: number;
  beklenen_baz_puan: number;
  beklenen_birim_tl: number;
}

export function cokluTalebiDogrula(cekler: unknown, anahtar: unknown):
  { gecerli: true; cekler: CokluCekTalebi[]; anahtar: string } | { gecerli: false; hata: string } {
  if (!uuidGecerliMi(anahtar)) return { gecerli: false, hata: "Talep onayını yeniden açın." };
  if (!Array.isArray(cekler) || !cekler.length || cekler.length > 100) return { gecerli: false, hata: "1–100 farklı çek seçin." };
  const sonuc: CokluCekTalebi[] = [], kimlikler = new Set<string>();
  for (const cek of cekler) {
    if (!cek || typeof cek !== "object" || !uuidGecerliMi(cek.urun_id)
      || !Number.isInteger(cek.adet) || cek.adet < 1 || cek.adet > 2147483647
      || !bazPuanGecerliMi(cek.beklenen_baz_puan) || !minimumSiparisTlGecerliMi(cek.beklenen_birim_tl)) {
      return { gecerli: false, hata: "Seçilen çeklerin adet, puan ve TL bilgilerini kontrol edin." };
    }
    const id = cek.urun_id.toLowerCase();
    if (kimlikler.has(id)) return { gecerli: false, hata: "Aynı çek birden fazla satırda gönderilemez." };
    kimlikler.add(id);
    sonuc.push({ urun_id: id, adet: cek.adet, beklenen_baz_puan: cek.beklenen_baz_puan, beklenen_birim_tl: cek.beklenen_birim_tl });
  }
  if (!Number.isSafeInteger(sonuc.reduce((sum, cek) => sum + cek.adet * cek.beklenen_baz_puan, 0))
    || sonuc.reduce((sum, cek) => sum + cek.adet * cek.beklenen_baz_puan, 0) > 2147483647) {
    return { gecerli: false, hata: "Toplam talep puanı izin verilen sınırı aşıyor." };
  }
  return { gecerli: true, cekler: sonuc, anahtar: anahtar.toLowerCase() };
}
