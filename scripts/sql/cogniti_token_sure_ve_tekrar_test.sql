-- Geçici token hesabı kullanır; bütün değişiklikler işlem sonunda geri alınır.
BEGIN;
CREATE TEMP TABLE cogniti_token_test_sonuclari (test text, sonuc text) ON COMMIT DROP;
DO $$
DECLARE
 f uuid; g uuid:=gen_random_uuid(); kaynak uuid:=gen_random_uuid(); eski uuid; yeni uuid; n bigint;
 ay date:=date_trunc('month',now() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
 SELECT firma_id INTO f FROM public.firmalar x WHERE NOT EXISTS
   (SELECT 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id=x.firma_id)
 ORDER BY firma_id LIMIT 1;
 IF f IS NULL THEN RAISE EXCEPTION 'Token hesabı olmayan firma bulunamadı.'; END IF;
 INSERT INTO public.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'aylik');
 eski:=public.cogniti_token_yukle(f,'aylik_paket',2,'sure-eski',extract(year from ay)::int,extract(month from ay)::int);
 UPDATE public.cogniti_token_yuklemeleri SET son_kullanim_at=now()-interval '1 second' WHERE yukleme_id=eski;
 yeni:=public.cogniti_token_yukle(f,'aylik_paket',1,'sure-yeni',extract(year from ay)::int,extract(month from ay)::int);
 PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',g::text,'yayin',kaynak,'sure-tuketim');
 SELECT kalan INTO n FROM public.cogniti_token_yuklemeleri WHERE yukleme_id=eski;
 IF n<>2 THEN RAISE EXCEPTION 'Süresi dolmuş token tüketildi.'; END IF;
 SELECT kalan INTO n FROM public.cogniti_token_yuklemeleri WHERE yukleme_id=yeni;
 IF n<>0 THEN RAISE EXCEPTION 'Geçerli token tüketilmedi.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Süresi dolan token kullanılmaz','BAŞARILI');
 PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',g::text,'yayin',kaynak,'sure-tuketim');
 SELECT count(*) INTO n FROM public.cogniti_token_tuketimleri WHERE firma_id=f AND islem_anahtari='sure-tuketim';
 IF n<>1 THEN RAISE EXCEPTION 'Teknik tekrar ikinci tüketim oluşturdu.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Teknik tekrar ikinci tüketim oluşturmaz','BAŞARILI');
 BEGIN
   PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi','farkli-alici','yayin',kaynak,'sure-tuketim');
   RAISE EXCEPTION 'Farklı tüketimde aynı anahtar kabul edildi.';
 EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM <> 'İşlem anahtarı farklı tüketimde kullanılmış.' THEN RAISE; END IF;
 END;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Farklı tüketimde aynı anahtar reddedilir','BAŞARILI');
 BEGIN
   PERFORM public.cogniti_token_yukle(f,'aylik_paket',4,'sure-yeni',extract(year from ay)::int,extract(month from ay)::int);
   RAISE EXCEPTION 'Farklı yüklemede aynı anahtar kabul edildi.';
 EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM <> 'İşlem anahtarı farklı yüklemede kullanılmış.' THEN RAISE; END IF;
 END;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Farklı yüklemede aynı anahtar reddedilir','BAŞARILI');
END $$;
SELECT * FROM cogniti_token_test_sonuclari ORDER BY test;
ROLLBACK;
