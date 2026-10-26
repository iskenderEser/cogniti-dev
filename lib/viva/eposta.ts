/** Viva davet adresleri için uygulama doğrulaması; gönderimde sunucuda da doğrulanır. */
export function vivaEpostaGecerliMi(adres: string): boolean {
  if (adres.length > 254) return false;
  const [yerel, alan, fazla] = adres.split("@");
  if (!yerel || !alan || fazla !== undefined || yerel.length > 64) return false;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(yerel) || yerel.startsWith(".") || yerel.endsWith(".") || yerel.includes("..")) return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(alan);
}

/** HTTP girdisi sunucuda yeniden kontrol edilir; bir hatalı adres bütün listeyi durdurur. */
export function vivaDavetEpostalariDogrula(girdi: unknown): { adresler: string[]; hata: string | null } {
  if (girdi === undefined) return { adresler: [], hata: null };
  if (!Array.isArray(girdi)) return { adresler: [], hata: "Davet e-posta listesi geçersiz." };
  const adresler = new Set<string>();
  for (const deger of girdi) {
    if (typeof deger !== "string" || !vivaEpostaGecerliMi(deger.trim())) {
      return { adresler: [], hata: "Davet listesinde hatalı veya tamamlanmamış e-posta adresi var." };
    }
    adresler.add(deger.trim().toLowerCase());
  }
  return { adresler: [...adresler], hata: null };
}

/** Yalnız ayırıcıyla tamamlanan adresler alınır; blur/yapıştırmada son adres de tamamlanabilir. */
export function vivaEpostalariAyir(girdi: string, mevcut: readonly string[], sonuncuyuTamamla = false) {
  const parcalar = girdi.split(/[,;\r\n]+/);
  const son = sonuncuyuTamamla ? "" : parcalar.pop() ?? "";
  const adresler = [...mevcut];
  const bilinenler = new Set(mevcut.map(adres => adres.toLowerCase()));
  const hatalilar: string[] = [];
  let tekrarVar = false;
  for (const parca of parcalar) {
    const adres = parca.trim();
    if (!adres) continue;
    if (!vivaEpostaGecerliMi(adres)) { hatalilar.push(adres); continue; }
    const anahtar = adres.toLowerCase();
    if (bilinenler.has(anahtar)) { tekrarVar = true; continue; }
    bilinenler.add(anahtar);
    adresler.push(anahtar);
  }
  return { adresler, girdi: [...hatalilar, ...(son ? [son] : [])].join(", "), hatali: hatalilar.length > 0, tekrarVar };
}
