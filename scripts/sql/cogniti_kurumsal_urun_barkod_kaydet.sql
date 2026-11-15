-- Önkoşul: cogniti_kurumsal_urun_listesi.sql kurulmuş olmalı.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_kurumsal_urun_listesi_yaz(
  p_firma uuid, p_satirlar jsonb, p_gonder boolean
) RETURNS boolean LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
  v_satir record;
  v_barkod text;
  v_urunler uuid[];
  v_urun_id uuid;
  v_gorulen_urunler uuid[] := ARRAY[]::uuid[];
BEGIN
  -- Firma başına liste kaydını kilitle. Hata olursa liste ve barkodlar birlikte geri alınır.
  INSERT INTO public.cogniti_kurumsal_urun_listesi AS liste (firma_id, satirlar, gonderildi_at)
  VALUES (p_firma, p_satirlar, CASE WHEN p_gonder THEN now() END)
  ON CONFLICT (firma_id) DO UPDATE
    SET satirlar = excluded.satirlar, gonderildi_at = excluded.gonderildi_at
    WHERE liste.gonderildi_at IS NULL;
  IF NOT FOUND THEN RETURN false; END IF;

  IF jsonb_array_length(p_satirlar) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'Ürün listesi 1–2000 satır içermelidir.' USING ERRCODE = '22023';
  END IF;

  FOR v_satir IN
    SELECT satir, sira FROM jsonb_array_elements(p_satirlar) WITH ORDINALITY AS x(satir, sira)
  LOOP
    v_barkod := v_satir.satir ->> 1;
    IF jsonb_typeof(v_satir.satir) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Satır %: Ürün satırı geçersiz.', v_satir.sira USING ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(v_satir.satir) <> 4
       OR jsonb_typeof(v_satir.satir -> 1) IS DISTINCT FROM 'string'
       OR v_barkod !~ '^[0-9]{1,13}$' THEN
      RAISE EXCEPTION 'Satır %: Barkod 1–13 rakamdan oluşmalıdır.', v_satir.sira USING ERRCODE = '22023';
    END IF;

    SELECT array_agg(eslesen.urun_id) INTO v_urunler
    FROM (
      SELECT u.urun_id
      FROM public.urunler u
      JOIN public.takimlar t ON t.takim_id = u.takim_id AND t.firma_id = u.firma_id
      WHERE u.firma_id = p_firma
        AND t.takim_adi = btrim(v_satir.satir ->> 0)
        AND u.urun_adi = btrim(v_satir.satir ->> 2)
      LIMIT 2
      FOR NO KEY UPDATE OF u
    ) AS eslesen;

    IF cardinality(v_urunler) IS DISTINCT FROM 1 THEN
      RAISE EXCEPTION 'Satır %: Firma kataloğunda takım ve ürün adıyla tek ürün eşleşmelidir.', v_satir.sira USING ERRCODE = '22023';
    END IF;

    v_urun_id := v_urunler[1];
    IF v_urun_id = ANY(v_gorulen_urunler) THEN
      RAISE EXCEPTION 'Satır %: Aynı ürün listeye birden fazla kez eklenmiş.', v_satir.sira USING ERRCODE = '22023';
    END IF;
    v_gorulen_urunler := array_append(v_gorulen_urunler, v_urun_id);

    UPDATE public.urunler SET barkod = v_barkod
    WHERE urun_id = v_urun_id AND firma_id = p_firma AND barkod IS DISTINCT FROM v_barkod;
  END LOOP;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.cogniti_kurumsal_urun_listesi_yaz(uuid,jsonb,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_kurumsal_urun_listesi_yaz(uuid,jsonb,boolean) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT true AS cogniti_kurumsal_urun_barkod_kaydet_hazir;
