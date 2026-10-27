BEGIN;
CREATE TEMP TABLE cogniti_token_test_sonuclari (test text, sonuc text) ON COMMIT DROP;
DO $$
DECLARE f uuid; g uuid:=gen_random_uuid(); b bigint; v bigint;
 eski date:=(date_trunc('month',now() AT TIME ZONE 'Europe/Istanbul') - interval '3 months')::date;
 su_an date:=date_trunc('month',now() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
 SELECT firma_id INTO f FROM public.firmalar x WHERE NOT EXISTS
  (SELECT 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id=x.firma_id)
 ORDER BY firma_id LIMIT 1;
 IF f IS NULL THEN RAISE EXCEPTION 'Token hesabı olmayan firma bulunamadı.'; END IF;
 INSERT INTO public.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'aylik');
 PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',g::text,'yayin',gen_random_uuid(),'test-asim');
 BEGIN
   PERFORM public.cogniti_token_yukle(f,'aylik_paket',2,'test-eski',extract(year from eski)::int,extract(month from eski)::int);
   RAISE EXCEPTION 'Süresi dolmuş yükleme kabul edildi.';
 EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM <> 'Süresi dolmuş aylık paket yüklenemez.' THEN RAISE; END IF;
 END;
 SELECT asim_borcu INTO b FROM public.cogniti_token_hesaplari WHERE firma_id=f;
 SELECT count(*) INTO v FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='test-eski';
 IF b<>1 OR v<>0 THEN RAISE EXCEPTION 'Süresi dolan yükleme bakiyeyi değiştirdi.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Süresi dolmuş yükleme reddedilir, borç korunur','BAŞARILI');
 PERFORM public.cogniti_token_yukle(f,'aylik_paket',2,'test-gecerli',extract(year from su_an)::int,extract(month from su_an)::int);
 SELECT asim_borcu INTO b FROM public.cogniti_token_hesaplari WHERE firma_id=f;
 SELECT kalan INTO v FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='test-gecerli';
 IF b<>0 OR v<>1 THEN RAISE EXCEPTION 'Geçerli yükleme borcu doğru kapatmadı.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Geçerli yükleme borcu kapatır','BAŞARILI');
END $$;
SELECT * FROM cogniti_token_test_sonuclari ORDER BY test;
ROLLBACK;
