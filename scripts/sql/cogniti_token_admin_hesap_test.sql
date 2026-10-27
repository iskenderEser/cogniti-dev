-- Geçici hesap ve yüklemeler işlem sonunda geri alınır.
BEGIN;
CREATE TEMP TABLE cogniti_token_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
DO $$
DECLARE f uuid; a uuid; r jsonb; r2 jsonb; n bigint; b bigint;
BEGIN
 SELECT firma_id INTO f FROM public.firmalar x WHERE NOT EXISTS
  (SELECT 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id=x.firma_id)
 ORDER BY firma_id LIMIT 1;
 SELECT kullanici_id INTO a FROM public.kullanicilar WHERE rol='admin' AND aktif_mi=true ORDER BY kullanici_id LIMIT 1;
 IF f IS NULL OR a IS NULL THEN RAISE EXCEPTION 'Test için token hesabı olmayan firma ve aktif admin gerekli.'; END IF;
 r:=public.cogniti_token_hesap_olustur(f,'kullandigin_kadar_ode',NULL,a,'test-admin-kko');
 SELECT kalan INTO b FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='test-admin-kko';
 IF b<>1500 THEN RAISE EXCEPTION 'KKÖ başlangıç yüklemesi hatalı.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('KKÖ hesabında 1.500 token yüklenir','BAŞARILI');
 r2:=public.cogniti_token_hesap_olustur(f,'kullandigin_kadar_ode',NULL,a,'test-admin-kko');
 SELECT count(*) INTO n FROM public.cogniti_token_yuklemeleri WHERE firma_id=f;
 IF n<>1 OR r->>'yukleme_id' IS DISTINCT FROM r2->>'yukleme_id' THEN RAISE EXCEPTION 'Tekrar hesap oluşturma çift yükleme yaptı.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Tekrar isteği ikinci yükleme yapmaz','BAŞARILI');
 BEGIN
  PERFORM public.cogniti_token_hesap_olustur(f,'kullandigin_kadar_ode',NULL,gen_random_uuid(),'test-yetki');
  RAISE EXCEPTION 'Admin olmayan kullanıcı kabul edildi.';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
 END;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Admin yetkisi zorunlu','BAŞARILI');
 DELETE FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='test-admin-kko';
 DELETE FROM public.cogniti_token_hesaplari WHERE firma_id=f;
 r:=public.cogniti_token_hesap_olustur(f,'aylik',10000,a,'test-admin-aylik');
 SELECT kalan INTO b FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='test-admin-aylik';
 IF b<>10000 THEN RAISE EXCEPTION 'Aylık ilk yükleme hatalı.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Aylık pakette seçilen token yüklenir','BAŞARILI');
END $$;
SELECT * FROM cogniti_token_test_sonuclari ORDER BY test;
ROLLBACK;
