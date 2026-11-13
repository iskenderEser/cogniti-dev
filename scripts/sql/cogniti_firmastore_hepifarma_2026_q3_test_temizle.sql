-- Test tamamlandığında kullanıcı çalıştırır. Yalnız bu paketin test kayıtları.
BEGIN;
DO $temizle$
DECLARE
  firma constant uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
  test_ids uuid[];
  onayli_belge jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('firmastore-hepifarma-2026-q3-test', 0));
  SELECT array_agg(s.siparis_id) INTO test_ids
  FROM public.store_siparisler s
  WHERE s.firma_id = firma AND s.kaynak_ceyrek_baslangici = timestamptz '2026-07-01 00:00:00+03'
    AND s.siparis_id = md5('firmastore-hepifarma-2026-q3-test:' || s.kullanici_id::text)::uuid
    AND s.toplu_talep_anahtari = s.siparis_id;
  IF test_ids IS NULL THEN
    RETURN;
  END IF;
  SELECT belge INTO onayli_belge FROM public.cogniti_firmastore_proforma_onaylari
  WHERE firma_id = firma AND donem = date '2026-07-01' FOR UPDATE;
  IF onayli_belge IS NOT NULL THEN
    IF jsonb_array_length(onayli_belge->'siparisler') IS DISTINCT FROM cardinality(test_ids)
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(onayli_belge->'siparisler') AS satir
        WHERE NOT coalesce((satir->>'id')::uuid = ANY(test_ids), false)
      ) THEN
      RAISE EXCEPTION 'Onaylı proforma yalnız test siparişlerinden oluşmuyor. Temizlik durduruldu.';
    END IF;
    DELETE FROM public.cogniti_firmastore_proforma_onaylari
    WHERE firma_id = firma AND donem = date '2026-07-01';
  END IF;
  DELETE FROM public.store_siparisler WHERE siparis_id = ANY(test_ids);
END $temizle$;
COMMIT;
SELECT true AS firmastore_test_temizligi_tamamlandi;
