-- Tek oturumda sahte veriler; sonunda ROLLBACK, gerçek firma değiştirilmez.
BEGIN;
CREATE TEMP TABLE sonuclar(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari(firma_id uuid PRIMARY KEY,paket_turu text,asim_borcu bigint DEFAULT 0,token_pasif_at timestamptz,token_pasif_neden text,updated_at timestamptz DEFAULT now()) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri(yukleme_id uuid PRIMARY KEY,firma_id uuid,kalan bigint,son_kullanim_at timestamptz) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesap_durum_gecmisi(olay_id uuid DEFAULT gen_random_uuid(),firma_id uuid,olay text,created_at timestamptz DEFAULT now()) ON COMMIT DROP;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_sifirda_pasiflestir()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE h pg_temp.cogniti_token_hesaplari%ROWTYPE; v_bakiye bigint;
BEGIN
 IF NEW.kalan>=OLD.kalan THEN RETURN NEW; END IF;
 SELECT * INTO h FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=NEW.firma_id FOR UPDATE;
 IF NOT FOUND OR h.paket_turu<>'kullandigin_kadar_ode' THEN RETURN NEW; END IF;
 SELECT coalesce(sum(kalan) FILTER(WHERE son_kullanim_at IS NULL OR son_kullanim_at>statement_timestamp()),0)-h.asim_borcu
 INTO v_bakiye FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=NEW.firma_id;
 IF v_bakiye<=0 THEN
  UPDATE pg_temp.firmalar SET aktif=false WHERE firma_id=NEW.firma_id AND aktif=true;
  IF FOUND THEN
   UPDATE pg_temp.cogniti_token_hesaplari SET token_pasif_at=now(),token_pasif_neden='token_bitti',updated_at=now() WHERE firma_id=NEW.firma_id;
   INSERT INTO pg_temp.cogniti_token_hesap_durum_gecmisi(firma_id,olay) VALUES(NEW.firma_id,'token_bitti');
  END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cogniti_token_sifirda_pasif ON pg_temp.cogniti_token_yuklemeleri;
CREATE TRIGGER trg_cogniti_token_sifirda_pasif AFTER UPDATE OF kalan ON pg_temp.cogniti_token_yuklemeleri
 FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_sifirda_pasiflestir();
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_yeniden_acilis_kontrol()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE h pg_temp.cogniti_token_hesaplari%ROWTYPE; v_bakiye bigint;
BEGIN
 IF OLD.aktif IS NOT FALSE OR NEW.aktif IS NOT TRUE THEN RETURN NEW; END IF;
 SELECT * INTO h FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=NEW.firma_id FOR UPDATE;
 IF NOT FOUND OR h.token_pasif_neden IS DISTINCT FROM 'token_bitti' THEN RETURN NEW; END IF;
 SELECT coalesce(sum(kalan) FILTER(WHERE son_kullanim_at IS NULL OR son_kullanim_at>statement_timestamp()),0)-h.asim_borcu
 INTO v_bakiye FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=NEW.firma_id;
 IF v_bakiye<=0 THEN RAISE EXCEPTION 'COGNITI_TOKEN:yeniden_acilis_bakiye_gerekli' USING ERRCODE='P0001'; END IF;
 UPDATE pg_temp.cogniti_token_hesaplari SET token_pasif_at=NULL,token_pasif_neden=NULL,updated_at=now() WHERE firma_id=NEW.firma_id;
 INSERT INTO pg_temp.cogniti_token_hesap_durum_gecmisi(firma_id,olay) VALUES(NEW.firma_id,'yeniden_acildi');
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cogniti_token_yeniden_acilis ON pg_temp.firmalar;
CREATE TRIGGER trg_cogniti_token_yeniden_acilis BEFORE UPDATE OF aktif ON pg_temp.firmalar
 FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_yeniden_acilis_kontrol();
DO $test$
DECLARE f uuid:=gen_random_uuid(); ay uuid:=gen_random_uuid();f2 uuid:=gen_random_uuid();y uuid:=gen_random_uuid();y2 uuid:=gen_random_uuid();ya uuid:=gen_random_uuid();yu uuid:=gen_random_uuid();
BEGIN
 INSERT INTO pg_temp.firmalar VALUES(f,true),(ay,true),(f2,true);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode'),(ay,'aylik'),(f2,'kullandigin_kadar_ode');
 INSERT INTO pg_temp.cogniti_token_yuklemeleri VALUES(y,f,2,NULL),(y2,f,1,NULL),(ya,ay,1,NULL),(yu,f2,1,NULL);
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=1 WHERE yukleme_id=y;
 IF NOT (SELECT aktif FROM pg_temp.firmalar WHERE firma_id=f) THEN RAISE EXCEPTION 'Pozitif bakiyede pasif'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('Pozitif KKÖ bakiyesi firmayı pasife almaz','BAŞARILI');
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=0 WHERE yukleme_id=y;
 IF NOT (SELECT aktif FROM pg_temp.firmalar WHERE firma_id=f) THEN RAISE EXCEPTION 'Diğer yükleme yok sayıldı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('Diğer yüklemede token varsa firma aktif kalır','BAŞARILI');
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=0 WHERE yukleme_id=y2;
 IF (SELECT aktif FROM pg_temp.firmalar WHERE firma_id=f) OR (SELECT token_pasif_neden FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=f)<>'token_bitti' OR (SELECT count(*) FROM pg_temp.cogniti_token_hesap_durum_gecmisi WHERE firma_id=f AND olay='token_bitti')<>1 THEN RAISE EXCEPTION 'Son token pasife almadı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('Son token firmayı pasife alır ve nedenini kaydeder','BAŞARILI');
 BEGIN UPDATE pg_temp.firmalar SET aktif=true WHERE firma_id=f; RAISE EXCEPTION 'Bakiye olmadan açıldı'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'COGNITI_TOKEN:yeniden_acilis_bakiye_gerekli' THEN RAISE; END IF; END;
 INSERT INTO pg_temp.sonuclar VALUES('Bakiye olmadan yeniden açılış engellenir','BAŞARILI');
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=100 WHERE yukleme_id=y;
 IF (SELECT aktif FROM pg_temp.firmalar WHERE firma_id=f) THEN RAISE EXCEPTION 'Yükleme tek başına yeniden açtı'; END IF;
 UPDATE pg_temp.firmalar SET aktif=true WHERE firma_id=f;
 IF NOT (SELECT aktif FROM pg_temp.firmalar WHERE firma_id=f) OR (SELECT token_pasif_neden FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=f) IS NOT NULL OR (SELECT count(*) FROM pg_temp.cogniti_token_hesap_durum_gecmisi WHERE firma_id=f AND olay='yeniden_acildi')<>1 THEN RAISE EXCEPTION 'Yeniden açma hatalı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('Token yüklenip admin açınca neden temizlenir geçmiş korunur','BAŞARILI');
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=0 WHERE yukleme_id=ya;
 IF NOT (SELECT aktif FROM pg_temp.firmalar WHERE firma_id=ay) THEN RAISE EXCEPTION 'Aylık paket pasif oldu'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('Aylık pakette sıfır bakiye pasife almaz','BAŞARILI');
 BEGIN UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=0 WHERE yukleme_id=yu; RAISE EXCEPTION 'test_geri_al'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'test_geri_al' THEN RAISE; END IF; END;
 IF NOT (SELECT aktif FROM pg_temp.firmalar WHERE firma_id=f2) OR (SELECT kalan FROM pg_temp.cogniti_token_yuklemeleri WHERE yukleme_id=yu)<>1 OR EXISTS(SELECT 1 FROM pg_temp.cogniti_token_hesap_durum_gecmisi WHERE firma_id=f2) THEN RAISE EXCEPTION 'Geri alma başarısız'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('İşlem hatasında pasife alma ve tüketim birlikte geri alınır','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.sonuclar ORDER BY test;
ROLLBACK;
