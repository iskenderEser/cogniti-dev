-- İşlem sonunda bütün test verileri geri alınır.
BEGIN;
CREATE TEMP TABLE cogniti_token_bakiye_test_sonuclari (test text, sonuc text) ON COMMIT DROP;
DO $$
DECLARE f uuid; g uuid:=gen_random_uuid(); y uuid; b record;
 ay date:=date_trunc('month',now() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
 SELECT firma_id INTO f FROM public.firmalar x WHERE NOT EXISTS
  (SELECT 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id=x.firma_id)
 ORDER BY firma_id LIMIT 1;
 IF f IS NULL THEN RAISE EXCEPTION 'Token hesabı olmayan firma bulunamadı.'; END IF;
 INSERT INTO public.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'aylik');
 y:=public.cogniti_token_yukle(f,'aylik_paket',2,'bakiye-eski',extract(year from ay)::int,extract(month from ay)::int);
 UPDATE public.cogniti_token_yuklemeleri SET son_kullanim_at=now()-interval '1 second' WHERE yukleme_id=y;
 PERFORM public.cogniti_token_yukle(f,'aylik_paket',1,'bakiye-gecerli',extract(year from ay)::int,extract(month from ay)::int);
 SELECT * INTO b FROM public.cogniti_token_bakiye(f);
 IF b.kullanilabilir_token<>1 OR b.paket_asimi<>0 OR b.net_bakiye<>1 THEN RAISE EXCEPTION 'Geçerli bakiye hatalı.'; END IF;
 INSERT INTO cogniti_token_bakiye_test_sonuclari VALUES('Süresi dolmuş token bakiyeye eklenmez','BAŞARILI');
 PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',g::text,'yayin',gen_random_uuid(),'bakiye-tuketim-1');
 PERFORM public.cogniti_token_tuket(f,'firma_kullanicisi',g,'firma_kullanicisi',g::text,'yayin',gen_random_uuid(),'bakiye-tuketim-2');
 SELECT * INTO b FROM public.cogniti_token_bakiye(f);
 IF b.kullanilabilir_token<>0 OR b.paket_asimi<>1 OR b.net_bakiye<>-1 THEN RAISE EXCEPTION 'Paket aşımı veya net bakiye hatalı.'; END IF;
 INSERT INTO cogniti_token_bakiye_test_sonuclari VALUES('Paket aşımı ve negatif bakiye gösterimi','BAŞARILI');
 PERFORM public.cogniti_token_yukle(f,'aylik_paket',3,'bakiye-mahsup',extract(year from ay)::int,extract(month from ay)::int);
 SELECT * INTO b FROM public.cogniti_token_bakiye(f);
 IF b.kullanilabilir_token<>2 OR b.paket_asimi<>0 OR b.net_bakiye<>2 THEN RAISE EXCEPTION 'Yükleme sonrası bakiye hatalı.'; END IF;
 INSERT INTO cogniti_token_bakiye_test_sonuclari VALUES('Yükleme sonrası aşım mahsubu','BAŞARILI');
 IF has_function_privilege('anon','public.cogniti_token_bakiye(uuid)','EXECUTE')
   OR has_function_privilege('authenticated','public.cogniti_token_bakiye(uuid)','EXECUTE')
   OR NOT has_function_privilege('service_role','public.cogniti_token_bakiye(uuid)','EXECUTE') THEN
   RAISE EXCEPTION 'Bakiye işlevi yetkileri hatalı.';
 END IF;
 INSERT INTO cogniti_token_bakiye_test_sonuclari VALUES('Bakiye işlevi sunucu erişimi','BAŞARILI');
END $$;
SELECT * FROM cogniti_token_bakiye_test_sonuclari ORDER BY test;
ROLLBACK;
