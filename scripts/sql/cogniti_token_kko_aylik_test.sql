-- Tek oturumda geçici sahte veriler; sonuç sonrası ROLLBACK.
BEGIN;
CREATE TEMP TABLE sonuc(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE zaman(an timestamptz) ON COMMIT DROP;
INSERT INTO zaman VALUES('2030-10-31 20:59:59+00');
CREATE FUNCTION pg_temp.test_saati() RETURNS timestamptz LANGUAGE sql VOLATILE AS 'SELECT an FROM pg_temp.zaman';
CREATE TEMP TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari(LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
ALTER TABLE pg_temp.cogniti_token_hesaplari ADD COLUMN IF NOT EXISTS kko_donem date;
CREATE TEMP TABLE cogniti_token_yuklemeleri(LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_kko_devir_kayitlari(firma_id uuid,donem date,yukleme_id uuid,sifirlanan bigint,created_at timestamptz DEFAULT now(),PRIMARY KEY(firma_id,donem,yukleme_id)) ON COMMIT DROP;
DO $klon$
DECLARE kaynak text;
BEGIN
 SELECT pg_get_functiondef('public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)'::regprocedure) INTO kaynak;
 kaynak:=replace(kaynak,'public.','pg_temp.');
 kaynak:=regexp_replace(kaynak,'SET search_path TO [^\n]+','SET search_path TO pg_temp, pg_catalog','g');
 EXECUTE kaynak;
END $klon$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_kko_aylik_yukle(p_firma uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE h pg_temp.cogniti_token_hesaplari%ROWTYPE; f record; v_ay date:=date_trunc('month',pg_temp.test_saati() AT TIME ZONE 'Europe/Istanbul')::date; v_id uuid;
BEGIN
 SELECT * INTO h FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=p_firma FOR UPDATE;
 IF NOT FOUND OR h.paket_turu<>'kullandigin_kadar_ode' THEN RETURN false; END IF;
 SELECT aktif INTO f FROM pg_temp.firmalar WHERE firma_id=p_firma;
 IF NOT FOUND OR (NOT f.aktif AND h.token_pasif_neden IS DISTINCT FROM 'token_bitti') THEN RETURN false; END IF;
 IF h.kko_donem IS NULL THEN RAISE EXCEPTION 'KKÖ dönemi eksik.' USING ERRCODE='22023'; END IF;
 IF h.kko_donem>=v_ay THEN RETURN false; END IF;
 -- Tarihçe silinmez; kalan miktar önce açıklama kaydında korunur.
 INSERT INTO pg_temp.cogniti_token_kko_devir_kayitlari(firma_id,donem,yukleme_id,sifirlanan)
 SELECT p_firma,h.kko_donem,yukleme_id,kalan FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=p_firma AND kalan>0;
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=0 WHERE firma_id=p_firma AND kalan>0;
 v_id:=pg_temp.cogniti_token_yukle(p_firma,'kko',1500,'kko-aylik:'||to_char(v_ay,'YYYY-MM'),NULL,NULL,NULL,'KKÖ aylık yenileme');
 UPDATE pg_temp.cogniti_token_hesaplari SET kko_donem=v_ay,updated_at=now() WHERE firma_id=p_firma;
 IF NOT f.aktif AND h.token_pasif_neden='token_bitti' THEN UPDATE pg_temp.firmalar SET aktif=true WHERE firma_id=p_firma; END IF;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_kko_yukleme_kontrol()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE h pg_temp.cogniti_token_hesaplari%ROWTYPE; bakiye bigint;
BEGIN
 SELECT * INTO h FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=NEW.firma_id FOR UPDATE;
 IF NOT FOUND OR h.paket_turu<>'kullandigin_kadar_ode' THEN RETURN NEW; END IF;
 SELECT coalesce(sum(kalan) FILTER(WHERE son_kullanim_at IS NULL OR son_kullanim_at>pg_temp.test_saati()),0) INTO bakiye FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=NEW.firma_id;
 IF NEW.yukleme_turu<>'kko' OR NEW.miktar<>1500 OR bakiye+NEW.kalan>1500 OR
  (EXISTS(SELECT 1 FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=NEW.firma_id) AND NEW.islem_anahtari<>'kko-aylik:'||to_char(date_trunc('month',pg_temp.test_saati() AT TIME ZONE 'Europe/Istanbul'),'YYYY-MM')) THEN
  RAISE EXCEPTION 'KKÖ aylık 1500 token sınırı aşılamaz.' USING ERRCODE='22023'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cogniti_token_kko_yukleme_kontrol ON pg_temp.cogniti_token_yuklemeleri;
CREATE TRIGGER trg_cogniti_token_kko_yukleme_kontrol BEFORE INSERT ON pg_temp.cogniti_token_yuklemeleri FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_kko_yukleme_kontrol();
DO $test$
DECLARE f uuid:=gen_random_uuid(); diger uuid:=gen_random_uuid(); eski uuid; r boolean;
BEGIN
 INSERT INTO pg_temp.firmalar VALUES(f,true),(diger,true);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu,kko_donem) VALUES(f,'kullandigin_kadar_ode','2030-10-01'),(diger,'kullandigin_kadar_ode','2030-10-01');
 eski:=pg_temp.cogniti_token_yukle(f,'kko',1500,'ilk');
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=400 WHERE yukleme_id=eski;
 IF pg_temp.cogniti_token_kko_aylik_yukle(f) THEN RAISE EXCEPTION 'Mevcut ayda erken yenileme'; END IF;
 INSERT INTO pg_temp.sonuc VALUES('Ay sonuna kadar kalan token korunur','BAŞARILI');
 UPDATE pg_temp.zaman SET an='2030-10-31 21:00:00+00';
 r:=pg_temp.cogniti_token_kko_aylik_yukle(f);
 IF NOT r OR (SELECT sum(kalan) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f)<>1500 OR (SELECT sifirlanan FROM pg_temp.cogniti_token_kko_devir_kayitlari WHERE firma_id=f)<>400 THEN RAISE EXCEPTION 'Yeni ay yenilemesi hatalı'; END IF;
 INSERT INTO pg_temp.sonuc VALUES('Türkiye ay başında eski bakiye sıfırlanır ve 1500 yüklenir','BAŞARILI');
 IF pg_temp.cogniti_token_kko_aylik_yukle(f) OR (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f)<>2 THEN RAISE EXCEPTION 'Tekrarda ikinci yükleme'; END IF;
 INSERT INTO pg_temp.sonuc VALUES('Tekrar çalışma aynı aya ikinci yükleme yapmaz','BAŞARILI');
 BEGIN PERFORM pg_temp.cogniti_token_yukle(f,'admin_duzeltme',1,'admin-ek'); RAISE EXCEPTION 'Manuel ek yükleme yapıldı'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 INSERT INTO pg_temp.sonuc VALUES('KKÖ manuel ek yükleme sınırı aşamaz','BAŞARILI');
 PERFORM pg_temp.cogniti_token_yukle(diger,'kko',1500,'ilk');
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=0 WHERE firma_id=diger;
 IF NOT (SELECT aktif FROM pg_temp.firmalar WHERE firma_id=diger) THEN RAISE EXCEPTION 'Sıfırda firma pasif'; END IF;
 INSERT INTO pg_temp.sonuc VALUES('Sıfır bakiye firma hesabını kapatmaz','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.sonuc ORDER BY test;
ROLLBACK;
