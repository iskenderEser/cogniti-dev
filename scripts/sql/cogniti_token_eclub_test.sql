-- ÖNCE BU TEST ÇALIŞTIRILIR, SONRA KURULUM DOSYASI.
-- Tek SQL sekmesinde çalışır. Gerçek firma, öneri ve bakiye kayıtlarına yazmaz.
-- Test tabloları ve test işlevleri pg_temp altında oluşturulur; sonunda ROLLBACK edilir.
-- Bu test öneri kayıt katmanı ile token işlevlerinin bağını doğrular.
-- Mevcut E-Club kota/erişim kuralları ve cron uçtan uca testi bunun kapsamında değildir.
BEGIN;
CREATE TEMP TABLE cogniti_eclub_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari (LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri (LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketimleri (LIKE public.cogniti_token_tuketimleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketim_dagilimlari (LIKE public.cogniti_token_tuketim_dagilimlari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE eclub_oneri_kayitlari(
 oneri_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), oneren_id uuid NOT NULL,
 kisi_id uuid NOT NULL,yayin_id uuid NOT NULL,plan_id uuid
) ON COMMIT DROP;
CREATE TEMP TABLE eclub_yayin_gonderim_planlari(plan_id uuid PRIMARY KEY, durum text NOT NULL) ON COMMIT DROP;
DO $klon$
DECLARE imza text; kaynak text;
BEGIN
 FOREACH imza IN ARRAY ARRAY[
  'public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)',
  'public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)'
 ] LOOP
  SELECT pg_get_functiondef(to_regprocedure(imza)) INTO kaynak;
  IF kaynak IS NULL THEN RAISE EXCEPTION 'Test önkoşulu eksik: %',imza; END IF;
  EXECUTE replace(kaynak,'public.cogniti_token_','pg_temp.cogniti_token_');
 END LOOP;
END $klon$;

CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_eclub_oneri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 SELECT firma_id INTO v_firma FROM pg_temp.kullanicilar WHERE kullanici_id=NEW.oneren_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'ECLUB_GONDERIM:token_gonderici_firma_yok' USING ERRCODE='P0001';
 END IF;
 -- Hesap bulunmaması muafiyet değildir. Tüketim başarısızsa öneri INSERT'i de geri alınır.
 BEGIN
  PERFORM pg_temp.cogniti_token_tuket(v_firma,'firma_kullanicisi',NEW.oneren_id,
   'eclub_kisi',NEW.kisi_id::text,'eclub_oneri',NEW.yayin_id,'eclub-oneri:'||NEW.oneri_id::text);
 EXCEPTION WHEN SQLSTATE '22023' THEN
  IF SQLERRM='Yetersiz token bakiyesi.' THEN
   RAISE EXCEPTION 'ECLUB_GONDERIM:token_bakiyesi_yetersiz' USING ERRCODE='P0001';
  ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
   RAISE EXCEPTION 'ECLUB_GONDERIM:token_hesabi_yok' USING ERRCODE='P0001';
  ELSE RAISE;
  END IF;
 END;
 RETURN NEW;
END $$;

CREATE TRIGGER trg_cogniti_token_eclub_test AFTER INSERT ON pg_temp.eclub_oneri_kayitlari
 FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_eclub_oneri_kaydet();
DO $test$
DECLARE f uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); uye uuid:=gen_random_uuid();
 y uuid:=gen_random_uuid(); o uuid:=gen_random_uuid(); p uuid:=gen_random_uuid();
 hesapsiz_u uuid:=gen_random_uuid(); b bigint; n bigint; once bigint;
BEGIN
 INSERT INTO pg_temp.kullanicilar VALUES(u,f),(hesapsiz_u,gen_random_uuid());
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode');
 PERFORM pg_temp.cogniti_token_yukle(f,'kko',2,'test-ilk');

 -- Plan kaydı gerçek gönderim değildir.
 INSERT INTO pg_temp.eclub_yayin_gonderim_planlari VALUES(p,'bekliyor');
 SELECT sum(kalan) INTO b FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f;
 SELECT count(*) INTO n FROM pg_temp.cogniti_token_tuketimleri;
 IF b IS DISTINCT FROM 2 OR n<>0 THEN RAISE EXCEPTION 'Plan kaydı token tüketti.'; END IF;
 INSERT INTO pg_temp.cogniti_eclub_test_sonuclari VALUES('Plan kaydı token tüketmez','BAŞARILI');

 INSERT INTO pg_temp.eclub_oneri_kayitlari(oneri_id,oneren_id,kisi_id,yayin_id) VALUES(o,u,uye,y);
 SELECT sum(kalan) INTO b FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f;
 IF b IS DISTINCT FROM 1 OR NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri
  WHERE firma_id=f AND gonderen_id=u AND alici_kimligi=uye::text
   AND kaynak_id=y AND islem_turu='eclub_oneri' AND islem_anahtari='eclub-oneri:'||o::text) THEN
  RAISE EXCEPTION 'Gönderim tüketimi veya kimlikleri hatalı.'; END IF;
 INSERT INTO pg_temp.cogniti_eclub_test_sonuclari VALUES('Gerçek gönderim doğru firmadan bir token tüketir','BAŞARILI');

 INSERT INTO pg_temp.eclub_oneri_kayitlari(oneri_id,oneren_id,kisi_id,yayin_id) VALUES(o,u,uye,y) ON CONFLICT DO NOTHING;
 SELECT count(*) INTO n FROM pg_temp.cogniti_token_tuketimleri;
 IF n<>1 THEN RAISE EXCEPTION 'Aynı öneri kaydı ikinci kez tüketildi.'; END IF;
 INSERT INTO pg_temp.cogniti_eclub_test_sonuclari VALUES('Aynı öneri kaydı tekrar tüketmez','BAŞARILI');

 INSERT INTO pg_temp.eclub_oneri_kayitlari(oneren_id,kisi_id,yayin_id,plan_id) VALUES(u,uye,y,p);
 UPDATE pg_temp.eclub_yayin_gonderim_planlari SET durum='gerceklesti' WHERE plan_id=p;
 SELECT sum(kalan) INTO b FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f;
 IF b IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'Planın gerçek önerisi tüketilmedi.'; END IF;
 INSERT INTO pg_temp.cogniti_eclub_test_sonuclari VALUES('Planın gerçek gönderimi token tüketir','BAŞARILI');
 SELECT count(*) INTO once FROM pg_temp.eclub_oneri_kayitlari;
 BEGIN
  INSERT INTO pg_temp.eclub_oneri_kayitlari(oneren_id,kisi_id,yayin_id) VALUES(u,uye,y);
  RAISE EXCEPTION 'Yetersiz bakiye ile gönderim kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'ECLUB_GONDERIM:token_bakiyesi_yetersiz' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO n FROM pg_temp.eclub_oneri_kayitlari;
 IF n<>once THEN RAISE EXCEPTION 'Başarısız öneri kaydı kaldı.'; END IF;
 INSERT INTO pg_temp.cogniti_eclub_test_sonuclari VALUES('KKÖ yetersiz bakiyede öneri oluşmaz','BAŞARILI');

 -- Bir tokenla iki gönderimin tek işlemde denenmesi bütünüyle geri alınır.
 PERFORM pg_temp.cogniti_token_yukle(f,'kko',1,'test-toplu');
 BEGIN
  INSERT INTO pg_temp.eclub_oneri_kayitlari(oneren_id,kisi_id,yayin_id) VALUES(u,uye,y),(u,gen_random_uuid(),y);
  RAISE EXCEPTION 'Yetersiz bakiyeyle toplu gönderim kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'ECLUB_GONDERIM:token_bakiyesi_yetersiz' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO n FROM pg_temp.eclub_oneri_kayitlari;
 SELECT sum(kalan) INTO b FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f;
 IF n<>once OR b IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Toplu işlemde kısmi öneri/tüketim kaldı.'; END IF;
 INSERT INTO pg_temp.cogniti_eclub_test_sonuclari VALUES('Yetersiz toplu işlemde öneriler ve tüketim geri alınır','BAŞARILI');

 -- İşleyicinin exception bloğu gibi, farklı bir hatada da ikisi geri alınır.
 BEGIN
  INSERT INTO pg_temp.eclub_oneri_kayitlari(oneren_id,kisi_id,yayin_id) VALUES(u,uye,y);
  RAISE EXCEPTION 'test_sonraki_islem_hatasi';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'test_sonraki_islem_hatasi' THEN RAISE; END IF;
 END;
 SELECT sum(kalan) INTO b FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f;
 IF b IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Gönderim geri alınırken token geri alınmadı.'; END IF;
 INSERT INTO pg_temp.cogniti_eclub_test_sonuclari VALUES('Sonraki işlem hatasında tüketim de geri alınır','BAŞARILI');

 BEGIN
  INSERT INTO pg_temp.eclub_oneri_kayitlari(oneren_id,kisi_id,yayin_id) VALUES(hesapsiz_u,uye,y);
  RAISE EXCEPTION 'Hesapsız firma gönderimi kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'ECLUB_GONDERIM:token_hesabi_yok' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO n FROM pg_temp.eclub_oneri_kayitlari WHERE oneren_id=hesapsiz_u;
 IF n<>0 THEN RAISE EXCEPTION 'Hesapsız firma öneri kaydı kaldı.'; END IF;
 INSERT INTO pg_temp.cogniti_eclub_test_sonuclari VALUES('Token hesabı yoksa ücretsiz gönderim yapılmaz','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.cogniti_eclub_test_sonuclari ORDER BY test;
ROLLBACK;
