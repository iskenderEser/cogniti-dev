-- Önce bu testi tek sekmede çalıştırın; sonunda tüm test nesneleri ROLLBACK edilir.
-- Gerçek firma, challenge, puan ve bakiye kayıtlarına yazmaz.
-- Yeni tetikleyici ve toplu gönderim işlevi birebir geçici şemaya yönlendirilir.
-- cc_challenge_gonder burada sahte challenge/puan yazıcısıdır: mevcut CC yetki,
-- kota ve tur kurallarının canlı uçtan uca doğrulaması değildir.
BEGIN;
CREATE TEMP TABLE token_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari (LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri (LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketimleri (LIKE public.cogniti_token_tuketimleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketim_dagilimlari (LIKE public.cogniti_token_tuketim_dagilimlari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,puan_hatasi boolean DEFAULT false) ON COMMIT DROP;
CREATE TEMP TABLE challenge_kayitlari(challenge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gonderen_id uuid NOT NULL,alan_id uuid NOT NULL,yayin_id uuid NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE cc_kazanilan_puanlar(challenge_id uuid PRIMARY KEY,puan integer) ON COMMIT DROP;
DO $klon$
DECLARE imza text; kaynak text;
BEGIN
 FOREACH imza IN ARRAY ARRAY[
  'public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)',
  'public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)'
 ] LOOP
  SELECT pg_get_functiondef(to_regprocedure(imza)) INTO kaynak;
  IF kaynak IS NULL THEN RAISE EXCEPTION 'Önkoşul eksik: %',imza; END IF;
  EXECUTE replace(kaynak,'public.cogniti_token_','pg_temp.cogniti_token_');
 END LOOP;
END $klon$;
CREATE FUNCTION pg_temp.cc_challenge_gonder(p_gonderen_id uuid,p_alan_id uuid,p_yayin_id uuid,p_son_tarih timestamptz DEFAULT NULL)
RETURNS TABLE(challenge_id uuid,gonderme_puani integer) LANGUAGE plpgsql AS $fixture$
DECLARE c uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_temp.kullanicilar WHERE kullanici_id=p_alan_id AND rol='bm') THEN
  RAISE EXCEPTION 'Alıcı aktif bir BM değil.' USING ERRCODE='P0001';
 END IF;
 INSERT INTO pg_temp.challenge_kayitlari(gonderen_id,alan_id,yayin_id) VALUES(p_gonderen_id,p_alan_id,p_yayin_id)
 RETURNING challenge_kayitlari.challenge_id INTO c;
 INSERT INTO pg_temp.cc_kazanilan_puanlar VALUES(c,10);
 IF EXISTS(SELECT 1 FROM pg_temp.kullanicilar WHERE kullanici_id=p_alan_id AND puan_hatasi) THEN
  RAISE EXCEPTION 'test_puan_yazma_hatasi' USING ERRCODE='23514';
 END IF;
 RETURN QUERY SELECT c,10;
END $fixture$;

CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_cclub_challenge_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 SELECT firma_id INTO v_firma FROM pg_temp.kullanicilar WHERE kullanici_id=NEW.gonderen_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:gonderici_firma_yok' USING ERRCODE='P0001';
 END IF;
 BEGIN
  PERFORM pg_temp.cogniti_token_tuket(v_firma,'firma_kullanicisi',NEW.gonderen_id,
   'firma_kullanicisi',NEW.alan_id::text,'cclub_challenge',NEW.yayin_id,'cclub-challenge:'||NEW.challenge_id::text);
 EXCEPTION WHEN SQLSTATE '22023' THEN
  IF SQLERRM='Yetersiz token bakiyesi.' THEN
   RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
  ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
   RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001';
  ELSE RAISE;
  END IF;
 END;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_cclub_toplu_gonder(
 p_gonderen_id uuid,p_yayin_id uuid,p_alan_idler uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_alan uuid; v_challenge record;
 v_gonderilen jsonb:='[]'::jsonb; v_atlanan jsonb:='[]'::jsonb;
BEGIN
 IF p_gonderen_id IS NULL OR p_yayin_id IS NULL OR coalesce(cardinality(p_alan_idler),0) NOT BETWEEN 1 AND 100
 OR array_position(p_alan_idler,NULL) IS NOT NULL THEN
  RAISE EXCEPTION 'Geçersiz toplu challenge bilgileri.' USING ERRCODE='22023';
 END IF;
 -- Her alıcının yetki, firma, tur ve kota kontrolü mevcut kanonik işlevde yapılır.
 FOR v_alan IN SELECT a.id FROM unnest(p_alan_idler) WITH ORDINALITY AS a(id,sira)
   GROUP BY a.id ORDER BY min(a.sira)
 LOOP
  BEGIN
   SELECT * INTO v_challenge FROM pg_temp.cc_challenge_gonder(p_gonderen_id,v_alan,p_yayin_id);
   IF NOT FOUND OR v_challenge.challenge_id IS NULL THEN
    RAISE EXCEPTION 'Challenge oluşturulamadı.' USING ERRCODE='P0001';
   END IF;
   v_gonderilen:=v_gonderilen||jsonb_build_array(jsonb_build_object(
     'alan_id',v_alan,'challenge_id',v_challenge.challenge_id));
  EXCEPTION WHEN SQLSTATE 'P0001' OR SQLSTATE '22023' OR SQLSTATE '23505' THEN
   -- Token sorunu sıradan alıcı reddi değildir: öncekiler dahil tüm istek geri alınır.
   IF SQLSTATE='P0001' AND SQLERRM LIKE 'COGNITI_TOKEN:%' THEN RAISE; END IF;
   v_atlanan:=v_atlanan||jsonb_build_array(jsonb_build_object('alan_id',v_alan,'sebep',SQLERRM));
  END;
 END LOOP;
 RETURN jsonb_build_object('gonderilen',v_gonderilen,'atlanan',v_atlanan);
END $$;

CREATE TRIGGER token_cclub_test AFTER INSERT ON pg_temp.challenge_kayitlari
 FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_cclub_challenge_kaydet();
DO $test$
DECLARE f uuid:=gen_random_uuid(); bm uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
 y uuid:=gen_random_uuid(); hesapsiz uuid:=gen_random_uuid(); gecersiz uuid:=gen_random_uuid(); puan_hatasi uuid:=gen_random_uuid();
 r jsonb; c uuid; n bigint; once bigint; bakiye bigint; borc bigint;
BEGIN
 INSERT INTO pg_temp.kullanicilar(kullanici_id,firma_id,rol) VALUES(bm,f,'bm'),(a,f,'bm'),(b,f,'bm'),
 (hesapsiz,gen_random_uuid(),'bm'),(gecersiz,f,'utt');
 INSERT INTO pg_temp.kullanicilar VALUES(puan_hatasi,f,'bm',true);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode');
 PERFORM pg_temp.cogniti_token_yukle(f,'kko',2,'ilk');
 r:=pg_temp.cogniti_token_cclub_toplu_gonder(bm,y,ARRAY[a]);
 c:=(r->'gonderilen'->0->>'challenge_id')::uuid;
 SELECT sum(z.kalan) INTO bakiye FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF bakiye IS DISTINCT FROM 1 OR NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri
  WHERE firma_id=f AND gonderen_id=bm AND alici_kimligi=a::text AND kaynak_id=y
   AND islem_turu='cclub_challenge' AND islem_anahtari='cclub-challenge:'||c::text)
 OR NOT EXISTS(SELECT 1 FROM pg_temp.cc_kazanilan_puanlar WHERE challenge_id=c) THEN
  RAISE EXCEPTION 'Challenge, puan veya tüketim hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Challenge ve gönderme puanı oluşurken bir token düşer','BAŞARILI');
 INSERT INTO pg_temp.challenge_kayitlari(challenge_id,gonderen_id,alan_id,yayin_id) VALUES(c,bm,a,y) ON CONFLICT DO NOTHING;
 SELECT count(*) INTO n FROM pg_temp.cogniti_token_tuketimleri;
 IF n<>1 THEN RAISE EXCEPTION 'Aynı challenge kaydı tekrar tüketildi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aynı challenge kaydı ikinci tüketim oluşturmaz','BAŞARILI');
 SELECT count(*) INTO once FROM pg_temp.challenge_kayitlari;
 BEGIN
  PERFORM pg_temp.cogniti_token_cclub_toplu_gonder(bm,y,ARRAY[a,b]);
  RAISE EXCEPTION 'Yetersiz toplu gönderim kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'COGNITI_TOKEN:bakiye_yetersiz' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO n FROM pg_temp.challenge_kayitlari;
 SELECT sum(z.kalan) INTO bakiye FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF n<>once OR bakiye IS DISTINCT FROM 1 OR (SELECT count(*) FROM pg_temp.cc_kazanilan_puanlar)<>once
 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once THEN
  RAISE EXCEPTION 'Yetersiz toplu işlemde kısmi kayıt kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yetersiz toplu işlemde challenge puan ve tüketim birlikte geri alınır','BAŞARILI');
 r:=pg_temp.cogniti_token_cclub_toplu_gonder(bm,y,ARRAY[gecersiz]);
 IF jsonb_array_length(r->'gonderilen')<>0 OR jsonb_array_length(r->'atlanan')<>1
 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once THEN
  RAISE EXCEPTION 'Atlanan alıcı tüketildi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Alıcı kuralıyla atlanan challenge token tüketmez','BAŞARILI');
 BEGIN
  PERFORM pg_temp.cogniti_token_cclub_toplu_gonder(bm,y,ARRAY[puan_hatasi]);
  RAISE EXCEPTION 'Puan hatası görünmedi.';
 EXCEPTION WHEN SQLSTATE '23514' THEN
  IF SQLERRM<>'test_puan_yazma_hatasi' THEN RAISE; END IF;
 END;
 SELECT sum(z.kalan) INTO bakiye FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF bakiye IS DISTINCT FROM 1 OR (SELECT count(*) FROM pg_temp.challenge_kayitlari)<>once
 OR (SELECT count(*) FROM pg_temp.cc_kazanilan_puanlar)<>once THEN
  RAISE EXCEPTION 'Puan hatasında kısmi kayıt kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Puan yazma hatasında challenge ve token geri alınır','BAŞARILI');
 BEGIN
  PERFORM pg_temp.cogniti_token_cclub_toplu_gonder(hesapsiz,y,ARRAY[a]);
  RAISE EXCEPTION 'Hesapsız firma kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'COGNITI_TOKEN:hesap_yok' THEN RAISE; END IF;
 END;
 IF EXISTS(SELECT 1 FROM pg_temp.challenge_kayitlari WHERE gonderen_id=hesapsiz) THEN
  RAISE EXCEPTION 'Hesapsız firmanın challenge kaydı kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Token hesabı olmayan firmanın challenge gönderimi durur','BAŞARILI');
 PERFORM pg_temp.cogniti_token_yukle(f,'kko',1,'ikinci');
 r:=pg_temp.cogniti_token_cclub_toplu_gonder(bm,y,ARRAY[a,a,b]);
 SELECT sum(z.kalan) INTO bakiye FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF jsonb_array_length(r->'gonderilen')<>2 OR bakiye IS DISTINCT FROM 0 THEN
  RAISE EXCEPTION 'Benzersiz alıcı hesabı hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Toplu listede tekrarlanan alıcı tek gönderim sayılır','BAŞARILI');
 UPDATE pg_temp.cogniti_token_hesaplari SET paket_turu='aylik' WHERE firma_id=f;
 r:=pg_temp.cogniti_token_cclub_toplu_gonder(bm,y,ARRAY[a,b]);
 SELECT asim_borcu INTO borc FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=f;
 IF borc IS DISTINCT FROM 2 OR jsonb_array_length(r->'gonderilen')<>2 THEN
  RAISE EXCEPTION 'Aylık aşım hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aylık pakette challenge gönderilir ve aşım kaydedilir','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.token_test_sonuclari ORDER BY test;
ROLLBACK;
