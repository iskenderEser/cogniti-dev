-- Token işlevlerini geçici verilerle test eder. Sonunda tüm değişiklikler ROLLBACK edilir.
-- Testler için henüz token hesabı olmayan bir mevcut firma seçilir; firma kaydı değiştirilmez.
-- Canlı veritabanına iki bağlantılı eşzamanlılık testi yapmaz.
BEGIN;
CREATE TEMP TABLE cogniti_token_test_sonuclari (test text, sonuc text) ON COMMIT DROP;
DO $$
DECLARE
  f uuid; g uuid := gen_random_uuid(); k uuid := gen_random_uuid();
  eski uuid; yeni uuid; t uuid; tekrar uuid;
  ay_once date := date_trunc('month', now() AT TIME ZONE 'Europe/Istanbul')::date - interval '1 month';
  bu_ay date := date_trunc('month', now() AT TIME ZONE 'Europe/Istanbul')::date;
  n bigint; borc bigint;
BEGIN
  SELECT firma_id INTO f FROM public.firmalar x
  WHERE NOT EXISTS (SELECT 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id=x.firma_id)
  ORDER BY firma_id LIMIT 1;
  IF f IS NULL THEN RAISE EXCEPTION 'Test için token hesabı olmayan bir firma bulunamadı; hiçbir değişiklik yapılmadı.'; END IF;
  INSERT INTO public.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'aylik');
  eski := public.cogniti_token_yukle(f,'aylik_paket',2,'test-eski',extract(year from ay_once)::int,extract(month from ay_once)::int);
  yeni := public.cogniti_token_yukle(f,'aylik_paket',1,'test-yeni',extract(year from bu_ay)::int,extract(month from bu_ay)::int);
  IF eski IS DISTINCT FROM public.cogniti_token_yukle(f,'aylik_paket',2,'test-eski',extract(year from ay_once)::int,extract(month from ay_once)::int) THEN
    RAISE EXCEPTION 'Yükleme tekrarı yeni kayıt oluşturdu.'; END IF;
  INSERT INTO cogniti_token_test_sonuclari VALUES('Yüklemenin tekrarında tek kayıt','BAŞARILI');
  t := public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',k::text,'yayin',gen_random_uuid(),'test-tuketim-1');
  SELECT kalan INTO n FROM public.cogniti_token_yuklemeleri WHERE yukleme_id=eski;
  IF n<>1 THEN RAISE EXCEPTION 'Eski yükleme öncelikle tüketilmedi.'; END IF;
  INSERT INTO cogniti_token_test_sonuclari VALUES('Önce eski token tüketimi','BAŞARILI');
  SELECT kalan INTO n FROM public.cogniti_token_yuklemeleri WHERE yukleme_id=yeni;
  IF n<>1 THEN RAISE EXCEPTION 'Yeni yükleme erken tüketildi.'; END IF;
  PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',k::text,'yayin',gen_random_uuid(),'test-tuketim-2');
  PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',k::text,'yayin',gen_random_uuid(),'test-tuketim-3');
  PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',k::text,'yayin',gen_random_uuid(),'test-tuketim-4');
  SELECT asim_borcu INTO borc FROM public.cogniti_token_hesaplari WHERE firma_id=f;
  IF borc<>1 THEN RAISE EXCEPTION 'Aylık paket aşımı doğru hesaplanmadı.'; END IF;
  INSERT INTO cogniti_token_test_sonuclari VALUES('Aylık paket aşımı','BAŞARILI');
  PERFORM public.cogniti_token_yukle(f,'aylik_paket',2,'test-mahsup',extract(year from bu_ay)::int,extract(month from bu_ay)::int);
  SELECT asim_borcu INTO borc FROM public.cogniti_token_hesaplari WHERE firma_id=f;
  SELECT kalan INTO n FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='test-mahsup';
  IF borc<>0 OR n<>1 THEN RAISE EXCEPTION 'Yükleme paket aşımını doğru kapatmadı.'; END IF;
  INSERT INTO cogniti_token_test_sonuclari VALUES('Yeni yüklemeyle aşım mahsubu','BAŞARILI');
  t := public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',k::text,'viva_davet',k,'test-viva-1');
  tekrar := public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',k::text,'viva_davet',k,'test-viva-2');
  IF tekrar IS DISTINCT FROM t THEN RAISE EXCEPTION 'Aynı Viva etkinliği ve kişisi tekrar tüketildi.'; END IF;
  INSERT INTO cogniti_token_test_sonuclari VALUES('Viva aynı etkinlik ve kişi tek tüketim','BAŞARILI');
  UPDATE public.cogniti_token_hesaplari SET paket_turu='kullandigin_kadar_ode' WHERE firma_id=f;
  BEGIN
    PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',k::text,'yayin',gen_random_uuid(),'test-kko-yetersiz');
    RAISE EXCEPTION 'KKÖ yetersiz bakiye ile tüketim yapıldı.';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    IF SQLERRM <> 'Yetersiz token bakiyesi.' THEN RAISE; END IF;
  END;
  INSERT INTO cogniti_token_test_sonuclari VALUES('KKÖ yetersiz bakiye engeli','BAŞARILI');
  PERFORM public.cogniti_token_yukle(f,'kko',2,'test-kko');
  SELECT kalan INTO n FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='test-kko' AND son_kullanim_at IS NULL;
  IF n<>2 THEN RAISE EXCEPTION 'KKÖ yüklemesi veya süresiz kullanımı hatalı.'; END IF;
  INSERT INTO cogniti_token_test_sonuclari VALUES('KKÖ süresiz token yükleme','BAŞARILI');
END $$;
SELECT * FROM cogniti_token_test_sonuclari ORDER BY test;
ROLLBACK;
