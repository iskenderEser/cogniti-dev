/** Plan veri sözleşmesi; Adım 6 API akışında kullanılır. */
export const ECLUB_GONDERIM_PLAN_DURUMLARI = [
  "bekliyor",
  "isleniyor",
  "gerceklesti",
  "gerceklesmedi",
] as const;

export type EclubGonderimPlanDurumu = typeof ECLUB_GONDERIM_PLAN_DURUMLARI[number];

interface EclubGonderimPlanTemeli {
  plan_id: string;
  utt_id: string;
  kisi_id: string;
  yayin_id: string;
  urun_id: string;
  /** Veritabanındaki eski kolon adı korunur; değer artık YYYY-MM-DD tarihidir. */
  hedef_gonderim_at: string;
  islem_anahtari: string;
  deneme_sayisi: number;
  isleme_alindi_at: string | null;
  son_hata_kodu: string | null;
  son_hata_at: string | null;
  created_at: string;
  guncellenme_at: string;
}

export type EclubGonderimPlani = EclubGonderimPlanTemeli & (
  | {
    durum: "bekliyor";
    oneri_id: null;
    gerceklesti_at: null;
    lease_bitis: null;
  }
  | {
    durum: "isleniyor";
    oneri_id: null;
    gerceklesti_at: null;
    isleme_alindi_at: string;
    lease_bitis: string;
  }
  | {
    durum: "gerceklesti";
    oneri_id: string;
    gerceklesti_at: string;
    lease_bitis: null;
  }
  | {
    durum: "gerceklesmedi";
    oneri_id: null;
    gerceklesti_at: null;
    lease_bitis: null;
    son_hata_kodu: string;
    son_hata_at: string;
  }
);

/** Adım 6: bütün seçim için ortak SQL uygunluk/yazım sonucu. */
export interface GonderimKontrolSonucu {
  kisi_id: string;
  yayin_id: string;
  uygun?: boolean;
  sebep: string | null;
  kaydedildi: boolean;
  urun_id?: string;
  haftalik_kullanilan?: number;
  haftalik_kalan?: number;
  haftalik_kalan_secim_sonrasi?: number;
  adayla_donemlik_tekrar?: number;
  tekrar_durumu?: 'ilk_gonderim' | 'yeniden_gonderim' | null;
  onceki_gonderim_at?: string | null;
  sonraki_gonderim_at?: string | null;
  yeniden_gonderilebilir_at?: string | null;
  oneri_id?: string | null;
  plan_id?: string | null;
  durum?: EclubGonderimPlanDurumu;
}
