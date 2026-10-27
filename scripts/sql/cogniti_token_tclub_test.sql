-- Önce bu dosyayı tek sekmede çalıştırın. Gerçek firma, öneri ve bakiyelere yazmaz.
-- Kurulumdaki tetikleyici gövdesi ve kurulu token işlevleri geçici tablolarda test edilir.
-- Mevcut API yetki/kota kontrolleri ve eşzamanlılık testi bu dosyanın kapsamında değildir.
BEGIN;
CREATE TEMP TABLE token_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari (LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri (LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketimleri (LIKE public.cogniti_token_tuketimleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketim_dagilimlari (LIKE public.cogniti_token_tuketim_dagilimlari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE oneri_kayitlari(oneri_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 oneren_id uuid NOT NULL,kullanici_id uuid NOT NULL,yayin_id uuid NOT NULL,oneri_baslangic timestamptz) ON COMMIT DROP;
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

CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_tclub_oneri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 SELECT firma_id INTO v_firma FROM pg_temp.kullanicilar WHERE kullanici_id=NEW.oneren_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:gonderici_firma_yok' USING ERRCODE='P0001';
 END IF;
 BEGIN
  PERFORM pg_temp.cogniti_token_tuket(v_firma,'firma_kullanicisi',NEW.oneren_id,
   'firma_kullanicisi',NEW.kullanici_id::text,'tclub_oneri',NEW.yayin_id,'tclub-oneri:'||NEW.oneri_id::text);
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

CREATE TRIGGER token_tclub_test AFTER INSERT ON pg_temp.oneri_kayitlari
 FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_tclub_oneri_kaydet();
DO $test$
DECLARE f uuid:=gen_random_uuid(); bm uuid:=gen_random_uuid(); utt uuid:=gen_random_uuid();
 y uuid:=gen_random_uuid(); o uuid:=gen_random_uuid(); hesapsiz uuid:=gen_random_uuid();
 once bigint; n bigint; kalan bigint; borc bigint;
BEGIN
 INSERT INTO pg_temp.kullanicilar VALUES(bm,f),(hesapsiz,gen_random_uuid());
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode');
 PERFORM pg_temp.cogniti_token_yukle(f,'kko',2,'ilk');
 INSERT INTO pg_temp.oneri_kayitlari(oneri_id,oneren_id,kullanici_id,yayin_id,oneri_baslangic)
 VALUES(o,bm,utt,y,now()+interval '2 days');
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF kalan IS DISTINCT FROM 1 OR NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri
  WHERE firma_id=f AND gonderen_id=bm AND alici_kimligi=utt::text AND kaynak_id=y
   AND islem_turu='tclub_oneri' AND islem_anahtari='tclub-oneri:'||o::text) THEN
  RAISE EXCEPTION 'BM önerisi doğru token kaydı oluşturmadı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('BM önerisi gönderildiğinde doğru firmadan bir token düşer','BAŞARILI');
 INSERT INTO pg_temp.oneri_kayitlari(oneri_id,oneren_id,kullanici_id,yayin_id) VALUES(o,bm,utt,y) ON CONFLICT DO NOTHING;
 SELECT count(*) INTO n FROM pg_temp.cogniti_token_tuketimleri;
 IF n<>1 THEN RAISE EXCEPTION 'Aynı öneri kaydı tekrar tüketildi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aynı öneri kaydı ikinci tüketim oluşturmaz','BAŞARILI');
 SELECT count(*) INTO once FROM pg_temp.oneri_kayitlari;
 BEGIN
  INSERT INTO pg_temp.oneri_kayitlari(oneren_id,kullanici_id,yayin_id) VALUES(bm,utt,y),(bm,gen_random_uuid(),y);
  RAISE EXCEPTION 'Yetersiz toplu gönderim kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'COGNITI_TOKEN:bakiye_yetersiz' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO n FROM pg_temp.oneri_kayitlari;
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF n<>once OR kalan IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Toplu işlem kısmen kaydedildi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yetersiz KKÖ bakiyesinde toplu öneriler ve tüketim geri alınır','BAŞARILI');
 BEGIN
  INSERT INTO pg_temp.oneri_kayitlari(oneren_id,kullanici_id,yayin_id) VALUES(bm,utt,y);
  RAISE EXCEPTION 'test_sonraki_hata';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'test_sonraki_hata' THEN RAISE; END IF;
 END;
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF kalan IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Geri alınan öneride tüketim kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Öneri geri alındığında tüketim de geri alınır','BAŞARILI');
 BEGIN
  INSERT INTO pg_temp.oneri_kayitlari(oneren_id,kullanici_id,yayin_id) VALUES(hesapsiz,utt,y);
  RAISE EXCEPTION 'Hesapsız firma önerisi kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'COGNITI_TOKEN:hesap_yok' THEN RAISE; END IF;
 END;
 IF EXISTS(SELECT 1 FROM pg_temp.oneri_kayitlari WHERE oneren_id=hesapsiz) THEN
  RAISE EXCEPTION 'Hesapsız firmanın önerisi kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Token hesabı olmayan firmanın önerisi durdurulur','BAŞARILI');
 -- Fixture paket türü yalnız test için değiştirilir.
 UPDATE pg_temp.cogniti_token_hesaplari SET paket_turu='aylik' WHERE firma_id=f;
 INSERT INTO pg_temp.oneri_kayitlari(oneren_id,kullanici_id,yayin_id) VALUES(bm,utt,y),(bm,gen_random_uuid(),y);
 SELECT asim_borcu INTO borc FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=f;
 SELECT count(*) INTO n FROM pg_temp.oneri_kayitlari;
 IF borc IS DISTINCT FROM 1 OR n<>once+2 THEN RAISE EXCEPTION 'Aylık aşım hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aylık pakette öneriler gönderilir ve aşım kaydedilir','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.token_test_sonuclari ORDER BY test;
ROLLBACK;
