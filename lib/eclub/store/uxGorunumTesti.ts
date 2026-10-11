import { baremBul, cekTutariHesapla, type EclubEczaneStoreOzetItem } from "./eclubStoreTipler";

export const ECLUB_UX_TEST_KISI_ID = "3b0b6c01-428e-4797-a8ad-67d5d2400b5f";
const URUN_ID = "90c0ca99-8d17-40d9-97d7-5b209bd730b0";
const ECZANE_ID = "0d8385df-4eed-429e-b691-81acee1ad606";

export function eclubUxTestYayiniMi(yayinId: string): boolean {
  return /^e1400000-0000-4000-8000-00000000000[1-9]$|^e1400000-0000-4000-8000-00000000001[01]$/i.test(yayinId);
}

export interface EclubUxTestSatiri {
  senaryo_id: string; kisi_id: string; eczane_id: string;
  firma_id: string; urun_id: string; sira: number; etiket: string;
  veri: EclubEczaneStoreOzetItem;
}

/** Yalnız hedef test hesabının yetkili tek ürününü UX örnekleriyle gösterir. */
export function eclubUxKartlariniBirlestir(
  yayinlar: EclubEczaneStoreOzetItem[], satirlar: EclubUxTestSatiri[],
  kapsam: { kisiId: string; eczaneIdler: string[]; firmaIdler: string[] },
): EclubEczaneStoreOzetItem[] {
  if (kapsam.kisiId !== ECLUB_UX_TEST_KISI_ID) return yayinlar;
  const uygun = satirlar.filter((s) =>
    s.kisi_id === kapsam.kisiId && s.eczane_id === ECZANE_ID && s.urun_id === URUN_ID
    && kapsam.eczaneIdler.includes(s.eczane_id) && kapsam.firmaIdler.includes(s.firma_id)
    && eclubUxTestYayiniMi(s.senaryo_id),
  ).sort((a, b) => a.sira - b.sira);
  if (!uygun.length) return yayinlar;
  const kartlar = uygun.map((s): EclubEczaneStoreOzetItem => {
    const veri = s.veri;
    const hesap = (siparis: boolean) => cekTutariHesapla({
      puan: veri.toplanan_puan, satis_sarti_tipi: veri.satis_sarti_tipi,
      siparis_verildi: siparis, katlama_orani: veri.gizli_sart_katlama_orani,
      karsilik_puan: veri.karsilik_puan, karsilik_tl: veri.karsilik_tl,
      baremler: veri.barem_tablosu,
    });
    const baz = hesap(veri.satis_sarti_tipi === "satis_sartli");
    const artirilmis = veri.satis_sarti_tipi === "serbest_siparis" ? hesap(true) : baz;
    const barem = baremBul(veri.toplanan_puan, veri.barem_tablosu);
    const adet = veri.satis_sarti_tipi === "siparissiz_cek" ? 0 : barem?.adet ?? 0;
    const mf = veri.satis_sarti_tipi === "siparissiz_cek" ? 0 : barem?.mal_fazlasi ?? 0;
    return {
      ...veri, yayin_id: s.senaryo_id, firma_id: s.firma_id,
      urun_id: s.urun_id, eczane_id: s.eczane_id,
      gorunum_testi_mi: true, gorunum_testi_etiketi: `Test ${String(s.sira).padStart(2, "0")} · ${s.etiket}`,
      gorunum_testi_kalan_puan: baz.devreden_puan,
      havuz_toplam_puan: veri.toplanan_puan,
      uygun_adet: adet, aktif_barem_adet: adet,
      uygun_mal_fazlasi: mf, aktif_barem_mal_fazlasi: mf,
      hak_edilen_cek_tl: baz.cek_tutari_tl, baz_cek_tutari_tl: baz.cek_tutari_tl,
      katlanmis_cek_tl: artirilmis.cek_tutari_tl, katlanmis_cek_tutari_tl: artirilmis.cek_tutari_tl,
      talep_durumu: null, cek_kodu: null, cek_tutari_tl: null,
    };
  });
  return [
    ...yayinlar.filter((y) => !uygun.some((s) => s.eczane_id === y.eczane_id && s.firma_id === y.firma_id && s.urun_id === y.urun_id)),
    ...kartlar,
  ];
}
