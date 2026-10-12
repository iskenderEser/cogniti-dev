-- Yalnız e150...001–011 Hediye Çeki Takibi görünüm örneklerini siler.
-- Kullanıcı açıkça temizlik istemeden çalıştırılmaz.
BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-cek-takip-11-ux-v1', 0));
LOCK TABLE public.eclub_cek_takip_ux_testleri IN SHARE ROW EXCLUSIVE MODE;

DO $kontrol$
DECLARE
  v_kisi constant uuid := '3b0b6c01-428e-4797-a8ad-67d5d2400b5f';
  v_eczane constant uuid := '0d8385df-4eed-429e-b691-81acee1ad606';
  v_urun constant uuid := '90c0ca99-8d17-40d9-97d7-5b209bd730b0';
  v_yayin constant uuid := 'f364c684-eadc-4ccc-8671-f333da7b555f';
  v_firma uuid;
BEGIN
  SELECT ky.firma_id INTO v_firma
  FROM public.v_yayin_kunye ky WHERE ky.yayin_id = v_yayin;
  IF v_firma IS NULL THEN
    RAISE EXCEPTION 'Kaynak yayın/firma doğrulanamadı; temizlik durduruldu.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.eclub_cek_takip_ux_testleri t
    WHERE t.senaryo_id IN (
      SELECT ('e1500000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
      FROM generate_series(1, 11) n
    ) AND (t.kisi_id IS DISTINCT FROM v_kisi OR t.eczane_id IS DISTINCT FROM v_eczane
      OR t.firma_id IS DISTINCT FROM v_firma
      OR t.urun_id IS DISTINCT FROM v_urun OR t.kaynak_yayin_id IS DISTINCT FROM v_yayin)
  ) THEN
    RAISE EXCEPTION 'Çek Takibi test kimliği başka kapsama ait; temizlik durduruldu.';
  END IF;
END;
$kontrol$;

WITH silinen AS (
  DELETE FROM public.eclub_cek_takip_ux_testleri t
  WHERE t.senaryo_id IN (
    SELECT ('e1500000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
    FROM generate_series(1, 11) n
  ) RETURNING t.senaryo_id
)
SELECT 'TAMAMLANDI' AS sql_sonucu, count(*) AS silinen_test_karti FROM silinen;
COMMIT;
