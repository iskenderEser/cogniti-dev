-- Yalnız test ortamında, ilk P4 test talebini ekledikten sonra çalıştırılır.
BEGIN;

CREATE TEMP TABLE eczane_p4_test_plan ON COMMIT DROP AS
SELECT n,
       md5('cogniti-p4-proforma-test-talep:' || n)::uuid AS talep_id,
       md5('cogniti-p4-proforma-test-eczane:' || n)::uuid AS eczane_id,
       gln_kok || ((10 - (
         SELECT sum(substr(gln_kok, i, 1)::integer * CASE WHEN i % 2 = 0 THEN 3 ELSE 1 END)
         FROM generate_series(1, 12) AS basamak(i)
       ) % 10) % 10)::text AS gln,
       1000 + 100 * n AS tutar
FROM generate_series(2, 10) AS seri(n)
CROSS JOIN LATERAL (SELECT '200261104' || lpad(n::text, 3, '0') AS gln_kok) kok;

DO $test$
DECLARE
  v_firma constant uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
  v_ilk_id constant uuid := 'e1500000-0000-4000-8000-000000000004';
  v_donem constant text := '2026-P4';
  v_ilk public.eclub_store_cek_talepleri%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('cogniti:eczane-cek-proforma:test:hepifarma:2026-P4', 0));
  SELECT t.* INTO v_ilk
  FROM public.eclub_store_cek_talepleri t
  JOIN public.firmalar f ON f.firma_id = t.firma_id
  JOIN public.eclub_eczaneler e ON e.eczane_id = t.eczane_id
  JOIN public.eclub_eczane_master m ON m.gln = e.gln
  WHERE t.talep_id = v_ilk_id AND t.firma_id = v_firma AND f.firma_adi = 'Hepifarma'
    AND t.donem_kodu = v_donem AND t.durum = 'onaylandi' AND t.cek_kodu IS NULL
    AND t.tm_id IS NOT NULL AND t.tm_onay_tarihi IS NOT NULL
    AND t.talep_edilen_cek_tl IN (80, 1100)
    AND t.siparis_tipi = 'siparissiz_cek' AND m.kaynak = 'test'
  FOR UPDATE OF t;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'İlk Hepifarma P4 test talebi doğrulanamadı.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.cogniti_eczane_cek_proforma_onaylari
    WHERE firma_id = v_firma AND donem = v_donem
  ) OR EXISTS (
    SELECT 1 FROM public.eclub_store_cek_talepleri
    WHERE firma_id = v_firma AND donem_kodu = v_donem AND durum <> 'iptal' AND talep_id <> v_ilk_id
  ) THEN
    RAISE EXCEPTION 'Dönemde başka talep veya onaylı proforma var. Veri değiştirilmedi.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.eclub_eczane_master m JOIN eczane_p4_test_plan p USING (gln))
    OR EXISTS (SELECT 1 FROM public.eclub_eczaneler e JOIN eczane_p4_test_plan p USING (eczane_id))
    OR EXISTS (SELECT 1 FROM public.eclub_store_cek_talepleri t JOIN eczane_p4_test_plan p USING (talep_id))
  THEN
    RAISE EXCEPTION 'Test kimlikleri mevcut kayıtlarla çakışıyor. Veri değiştirilmedi.';
  END IF;

  INSERT INTO public.eclub_eczane_master (gln, eczane_adi, il, ilce, kaynak, onay_durumu)
  SELECT gln, 'Proforma Test Eczanesi ' || lpad(n::text, 2, '0'), 'Test', 'E-Club', 'test', 'onayli'
  FROM eczane_p4_test_plan;

  INSERT INTO public.eclub_eczaneler (eczane_id, gln)
  SELECT eczane_id, gln FROM eczane_p4_test_plan;

  UPDATE public.eclub_store_cek_talepleri
  SET talep_edilen_cek_tl = 1100, toplanan_puan = 5500
  WHERE talep_id = v_ilk_id;

  INSERT INTO public.eclub_store_cek_talepleri (
    talep_id, eczane_id, firma_id, yayin_id, talep_eden_kisi_id,
    toplanan_puan, talep_edilen_cek_tl, siparis_tipi, siparis_verildi_mi,
    siparis_adet, siparis_mal_fazlasi, durum, utt_id, bm_id, tm_id,
    utt_onay_tarihi, bm_onay_tarihi, tm_onay_tarihi, devreden_puan,
    donem_kodu, created_at, guncellenme_at
  )
  SELECT p.talep_id, p.eczane_id, v_firma, v_ilk.yayin_id, v_ilk.talep_eden_kisi_id,
    p.tutar * 5, p.tutar, 'siparissiz_cek', false, 0, 0, 'onaylandi', v_ilk.utt_id, v_ilk.bm_id, v_ilk.tm_id,
    v_ilk.utt_onay_tarihi, v_ilk.bm_onay_tarihi, v_ilk.tm_onay_tarihi, 0,
    v_donem, v_ilk.created_at, v_ilk.guncellenme_at
  FROM eczane_p4_test_plan p;

  IF EXISTS (
    SELECT 1 FROM public.eclub_cek_teslimat_outbox o
    WHERE o.talep_id = v_ilk_id OR o.talep_id IN (SELECT talep_id FROM eczane_p4_test_plan)
  ) OR EXISTS (
    SELECT 1 FROM public.eclub_bildirimler b
    WHERE b.kayit_turu = 'cek' AND (b.kayit_id = v_ilk_id OR b.kayit_id IN (SELECT talep_id FROM eczane_p4_test_plan))
  ) THEN
    RAISE EXCEPTION 'Test taleplerine teslimat veya bildirim kaydı bağlı. İşlem geri alındı.';
  END IF;
END;
$test$;

SELECT count(DISTINCT eczane_id) AS eczane_sayisi,
       count(DISTINCT talep_edilen_cek_tl) AS farkli_tutar,
       min(talep_edilen_cek_tl) AS en_dusuk_tl,
       max(talep_edilen_cek_tl) AS en_yuksek_tl,
       sum(talep_edilen_cek_tl) AS toplam_tl
FROM public.eclub_store_cek_talepleri
WHERE talep_id = 'e1500000-0000-4000-8000-000000000004'
   OR talep_id IN (SELECT talep_id FROM eczane_p4_test_plan);

COMMIT;
