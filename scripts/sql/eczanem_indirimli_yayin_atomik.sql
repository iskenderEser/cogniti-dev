-- İndirimli Eczanem yayını, barkod ve tarife aynı işlemde kaydedilir.
-- Önce eczanem_indirimsiz_yayin.sql ve Eczanem token hesabı kurulumu uygulanmış olmalıdır.
BEGIN;

CREATE OR REPLACE FUNCTION public.eczanem_indirimli_yayin_olustur(
  p_uretici_id uuid,
  p_soru_seti_durum_id uuid,
  p_barkod text,
  p_satis_fiyati numeric,
  p_hesap_turu text,
  p_planli_tarih timestamptz
)
RETURNS TABLE (yayin_id uuid, durum text, yayin_tarihi timestamptz)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_urun_id uuid;
  v_firma_id uuid;
  v_arac_durum_id uuid;
  v_hedef_roller text[];
  v_puan integer;
  v_tl numeric;
  v_simdi timestamptz;
  v_tarife public.eczanem_urun_tarifeleri%ROWTYPE;
BEGIN
  IF nullif(btrim(p_barkod), '') IS NULL
     OR p_satis_fiyati IS NULL OR p_satis_fiyati <= 0
     OR p_satis_fiyati IN ('NaN'::numeric, 'Infinity'::numeric)
     OR p_hesap_turu IS NULL OR p_hesap_turu NOT IN ('kisisel', 'firma_ortak') THEN
    RAISE EXCEPTION 'Barkod, satış fiyatı veya token hesabı geçersiz.' USING ERRCODE = '22023';
  END IF;

  SELECT u.urun_id, u.firma_id, s.arac_durum_id, t.hedef_roller
    INTO v_urun_id, v_firma_id, v_arac_durum_id, v_hedef_roller
    FROM public.soru_seti_durumu d
    JOIN public.soru_setleri s ON s.soru_seti_id = d.soru_seti_id
    JOIN public.talepler t ON t.talep_id = s.talep_id
    JOIN public.urunler u ON u.urun_id = t.urun_id AND u.firma_id = t.firma_id
   WHERE d.soru_seti_durum_id = p_soru_seti_durum_id
     AND d.durum = 'onaylandi'
     AND t.uretici_id = p_uretici_id
     AND t.hedef_roller @> ARRAY['eczanem']::text[]
   FOR NO KEY UPDATE OF u;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Yayının ürünü veya talep sahipliği doğrulanamadı.' USING ERRCODE = '42501';
  END IF;

  SELECT f.karsilik_puan, f.karsilik_tl INTO v_puan, v_tl
    FROM public.eczanem_firma_cek_tanimlari f
   WHERE f.firma_id = v_firma_id;
  IF v_puan IS NULL OR v_puan <= 0 OR v_tl IS NULL OR v_tl <= 0 THEN
    RAISE EXCEPTION 'Firma için Eczanem puan–TL karşılığı tanımlanmalıdır.' USING ERRCODE = '23514';
  END IF;

  v_simdi := clock_timestamp();
  UPDATE public.urunler SET barkod = btrim(p_barkod) WHERE urun_id = v_urun_id;

  SELECT x.* INTO v_tarife
    FROM public.eczanem_urun_tarifeleri x
   WHERE x.urun_id = v_urun_id AND x.gecerlilik_baslangic <= v_simdi
   ORDER BY x.gecerlilik_baslangic DESC
   LIMIT 1;

  IF NOT FOUND OR v_tarife.puan IS DISTINCT FROM v_puan
     OR v_tarife.tl IS DISTINCT FROM v_tl
     OR v_tarife.satis_fiyati IS DISTINCT FROM p_satis_fiyati THEN
    INSERT INTO public.eczanem_urun_tarifeleri
      (urun_id, puan, tl, satis_fiyati, gecerlilik_baslangic, olusturan_id)
    VALUES (v_urun_id, v_puan, v_tl, p_satis_fiyati, v_simdi, p_uretici_id);
  END IF;

  RETURN QUERY
    INSERT INTO public.yayin_yonetimi AS y (
      soru_seti_durum_id, arac_durum_id, uretici_id, eczanem_token_hesap_turu,
      eczanem_kazanim_modeli, durum, yayin_tarihi, ileri_sarma_acik, extra_puan,
      hedef_roller, tekrar_periyot_gun, satis_sarti_tipi, gizli_sart_katlama_orani,
      barem_tablosu, karsilik_puan, karsilik_tl, cek_karsiligi_var_mi, saha_puan_modeli
    )
    VALUES (
      p_soru_seti_durum_id, v_arac_durum_id, p_uretici_id, p_hesap_turu,
      'indirimli', CASE WHEN p_planli_tarih IS NULL THEN 'yayinda' ELSE 'planlandi' END,
      coalesce(p_planli_tarih, v_simdi), false, NULL,
      v_hedef_roller, NULL, NULL, NULL, NULL, NULL, NULL, true, NULL
    )
    RETURNING y.yayin_id, y.durum::text, y.yayin_tarihi;
END;
$$;

REVOKE ALL ON FUNCTION public.eczanem_indirimli_yayin_olustur(uuid, uuid, text, numeric, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_indirimli_yayin_olustur(uuid, uuid, text, numeric, text, timestamptz)
  TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT to_regprocedure('public.eczanem_indirimli_yayin_olustur(uuid,uuid,text,numeric,text,timestamptz)')
  IS NOT NULL AS eczanem_indirimli_yayin_atomik_hazir;
