-- Geçici test verileri; her değişiklik en sonda geri alınır.
BEGIN;
CREATE TEMP TABLE cogniti_token_test_sonuclari (test text,sonuc text) ON COMMIT DROP;
DO $$
DECLARE f uuid; g uuid:=gen_random_uuid(); k uuid:=gen_random_uuid(); a jsonb; b bigint; n bigint; sonuc jsonb;
BEGIN
 SELECT firma_id INTO f FROM public.firmalar x WHERE NOT EXISTS
  (SELECT 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id=x.firma_id)
 ORDER BY firma_id LIMIT 1;
 IF f IS NULL THEN RAISE EXCEPTION 'Token hesabı olmayan firma bulunamadı.'; END IF;
 INSERT INTO public.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode');
 PERFORM public.cogniti_token_yukle(f,'kko',2,'toplu-yukleme');
 a:=jsonb_build_array(
  jsonb_build_object('gonderen_turu','firma_kullanicisi','gonderen_id',g,'alici_turu','firma_kullanicisi','alici_kimligi','1','islem_turu','yayin','kaynak_id',k,'islem_anahtari','toplu-1'),
  jsonb_build_object('gonderen_turu','firma_kullanicisi','gonderen_id',g,'alici_turu','firma_kullanicisi','alici_kimligi','2','islem_turu','yayin','kaynak_id',k,'islem_anahtari','toplu-2'),
  jsonb_build_object('gonderen_turu','firma_kullanicisi','gonderen_id',g,'alici_turu','firma_kullanicisi','alici_kimligi','3','islem_turu','yayin','kaynak_id',k,'islem_anahtari','toplu-3'));
 BEGIN
  PERFORM public.cogniti_token_toplu_tuket(f,a);
  RAISE EXCEPTION 'Yetersiz bakiyeyle toplu tüketim kabul edildi.';
 EXCEPTION WHEN SQLSTATE '22023' THEN
  IF SQLERRM <> 'Yetersiz token bakiyesi.' THEN RAISE; END IF;
 END;
 SELECT kalan INTO b FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='toplu-yukleme';
 SELECT count(*) INTO n FROM public.cogniti_token_tuketimleri WHERE firma_id=f;
 IF b<>2 OR n<>0 THEN RAISE EXCEPTION 'Yetersiz bakiye işleminde kısmi tüketim kaldı.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('KKÖ yetersiz bakiye: toplu işlemin tamamı geri alınır','BAŞARILI');
 sonuc:=public.cogniti_token_toplu_tuket(f,a-2);
 SELECT kalan INTO b FROM public.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='toplu-yukleme';
 SELECT count(*) INTO n FROM public.cogniti_token_tuketimleri WHERE firma_id=f;
 IF b<>0 OR n<>2 OR jsonb_array_length(sonuc)<>2 THEN RAISE EXCEPTION 'Toplu tüketim hatalı.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Yeterli bakiye: her gönderim için bir token','BAŞARILI');
 PERFORM public.cogniti_token_toplu_tuket(f,a-2);
 SELECT count(*) INTO n FROM public.cogniti_token_tuketimleri WHERE firma_id=f;
 IF n<>2 THEN RAISE EXCEPTION 'Toplu işlem tekrarı yeniden tüketim oluşturdu.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Toplu teknik tekrar ikinci tüketim oluşturmaz','BAŞARILI');
 IF has_function_privilege('anon','public.cogniti_token_toplu_tuket(uuid,jsonb)','EXECUTE')
   OR has_function_privilege('authenticated','public.cogniti_token_toplu_tuket(uuid,jsonb)','EXECUTE')
   OR NOT has_function_privilege('service_role','public.cogniti_token_toplu_tuket(uuid,jsonb)','EXECUTE') THEN
   RAISE EXCEPTION 'Toplu işlev yetkileri hatalı.'; END IF;
 INSERT INTO cogniti_token_test_sonuclari VALUES('Toplu işlev yalnız sunucuya açık','BAŞARILI');
END $$;
SELECT * FROM cogniti_token_test_sonuclari ORDER BY test;
ROLLBACK;
