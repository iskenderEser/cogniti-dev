import referans from "./referans/vergi-daireleri.json";

// GİB'in 18.06.2026 tarihli listesindeki 859 müdürlük ve vergi/tahsil
// dairesi sıfatı bulunan Eskişehir Defterdarlığı. Kodsuz şubeler dahil değildir.
const secilebilirKayitlar = referans.vergi_daireleri.filter(kayit =>
  kayit.tur === "vergi_dairesi_mudurlugu"
  || (kayit.tur === "defterdarlik" && kayit.il_id === 26 && kayit.vergi_dairesi_kodu === "26250")
);

/** Vergi dairesi seçenekleri yalnız seçilen ile bağlıdır; ilçe kapsamı yoktur. */
export function ilinVergiDaireleri(ilId: number | null) {
  return secilebilirKayitlar
    .filter(kayit => kayit.il_id === ilId)
    .map(kayit => ({
      deger: kayit.vergi_dairesi_kodu,
      etiket: kayit.vergi_dairesi_adi,
    }))
    .sort((a, b) => a.etiket.localeCompare(b.etiket, "tr-TR"));
}
