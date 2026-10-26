// Hem video hem sohbet indirmesi aynı yayın sonu sınırına tabidir.
export function vivaIndirmeAcik(baglam: { indirme_bitis?: unknown; suresi_doldu?: unknown }, simdi = Date.now()) {
  if (baglam.suresi_doldu === true) return false;
  if (baglam.indirme_bitis == null) return true; // Yayın sürerken henüz son tarih yok.
  const bitis = typeof baglam.indirme_bitis === "string" ? Date.parse(baglam.indirme_bitis) : NaN;
  return Number.isFinite(bitis) && simdi < bitis;
}
