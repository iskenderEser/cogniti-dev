type SayilacakOneri = {
  firma_id: string | null;
  izlendi_mi: boolean;
  izleme_baslangic: string | null;
  oneri_durumu: string;
};

export function eclubYeniYayinMi(oneri: Pick<SayilacakOneri, "izlendi_mi" | "izleme_baslangic" | "oneri_durumu">) {
  return !oneri.izlendi_mi && !oneri.izleme_baslangic && oneri.oneri_durumu === "aktif";
}

export function eclubFirmaYayinSayilari(oneriler: SayilacakOneri[]) {
  const sayilar = new Map<string, { yeni: number; toplam: number }>();
  for (const oneri of oneriler) {
    if (!oneri.firma_id) continue;
    const firma = sayilar.get(oneri.firma_id) ?? { yeni: 0, toplam: 0 };
    firma.toplam += 1;
    if (eclubYeniYayinMi(oneri)) firma.yeni += 1;
    sayilar.set(oneri.firma_id, firma);
  }
  return sayilar;
}
