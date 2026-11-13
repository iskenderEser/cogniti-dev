-- KULLANICI AÇIKÇA TEMİZLİK İSTEDİĞİNDE ÇALIŞTIRACAK.
-- Yalnız SİLİNECEK KKÖ örneğini ve varsa örneğin proforma onayını siler.
BEGIN;
DO $test$
DECLARE
 y constant uuid := 'c06a2026-1110-4000-8000-000000000001';
 f constant uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
 b uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('cogniti-test:kko-proforma:hepifarma:2026-10',0));
 SELECT yk.bakiye_id INTO b FROM public.cogniti_esnek_paket_yuklemeleri yk
 JOIN public.cogniti_satin_alma_bakiyeleri h ON h.bakiye_id=yk.bakiye_id AND h.firma_id=yk.firma_id
 WHERE yk.yukleme_id=y AND yk.firma_id=f AND yk.kko_donem=date '2026-10-01'
 AND h.sahip_id='b0838fab-302c-49b3-af44-9bad88945a0f'::uuid AND h.bakiye_turu='kisisel'
 AND yk.siparis_id IS NULL AND yk.abonelik_siparis_id IS NULL AND yk.miktar=1500 AND yk.kalan=1400 FOR UPDATE OF yk;
 IF b IS NULL THEN
  IF EXISTS(SELECT 1 FROM public.cogniti_esnek_paket_yuklemeleri WHERE yukleme_id=y) THEN
   RAISE EXCEPTION 'Kimlikte beklenmeyen kayıt var; silme yapılmadı.';
  END IF;
  RETURN;
 END IF;
 IF (SELECT count(*) FROM public.cogniti_esnek_gonderim_tuketimleri
     WHERE yukleme_id=y AND firma_id=f AND bakiye_id=b AND gonderen_id='b0838fab-302c-49b3-af44-9bad88945a0f'::uuid
     AND islem_kimligi LIKE 'cogniti-test:kko-proforma:hepifarma:2026-10:%')<>100
 OR (SELECT count(*) FROM public.cogniti_esnek_gonderim_tuketimleri WHERE yukleme_id=y)<>100 THEN
  RAISE EXCEPTION 'Yüklemenin tamamı test verisi olarak doğrulanamadı; silme yapılmadı.';
 END IF;
 DELETE FROM public.cogniti_kko_proforma_onaylari WHERE yukleme_id=y AND firma_id=f;
 DELETE FROM public.cogniti_esnek_gonderim_tuketimleri WHERE yukleme_id=y AND firma_id=f AND bakiye_id=b
 AND islem_kimligi LIKE 'cogniti-test:kko-proforma:hepifarma:2026-10:%';
 DELETE FROM public.cogniti_esnek_paket_yuklemeleri WHERE yukleme_id=y AND firma_id=f AND bakiye_id=b;
END;
$test$;
COMMIT;
SELECT true AS cogniti_kko_silinecek_ornek_temizlendi;
