-- Yalnız geçici sahte veriler; tek işlem sonunda ROLLBACK.
BEGIN;
CREATE TEMP TABLE token_kko_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean) ON COMMIT DROP;
CREATE TEMP TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,aktif_mi boolean) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari(LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
ALTER TABLE pg_temp.cogniti_token_hesaplari ADD COLUMN IF NOT EXISTS kko_onay_surumu uuid NOT NULL DEFAULT gen_random_uuid();
CREATE TEMP TABLE cogniti_token_yuklemeleri(LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
DO $klon$
DECLARE imza text; kaynak text;
BEGIN
 FOREACH imza IN ARRAY ARRAY['public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)','public.cogniti_token_bakiye(uuid)'] LOOP
  SELECT pg_get_functiondef(to_regprocedure(imza)) INTO kaynak;
  IF kaynak IS NULL THEN RAISE EXCEPTION 'Önkoşul eksik: %',imza; END IF;
  kaynak:=replace(kaynak,'public.','pg_temp.');
  kaynak:=regexp_replace(kaynak,'SET search_path TO [^\n]+','SET search_path TO pg_temp, pg_catalog','g');
  EXECUTE kaynak;
 END LOOP;
END $klon$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_kko_yetkili(p_firma uuid,p_kullanici uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_hesaplari h
 JOIN pg_temp.firmalar f ON f.firma_id=h.firma_id AND f.aktif=true
 JOIN pg_temp.kullanicilar k ON k.kullanici_id=p_kullanici AND k.firma_id=h.firma_id AND k.aktif_mi=true
 WHERE h.firma_id=p_firma AND h.paket_turu='kullandigin_kadar_ode'
 AND k.kullanici_id=coalesce(h.onay_yetkili_id,(
 SELECT g.kullanici_id FROM pg_temp.kullanicilar g WHERE g.firma_id=h.firma_id AND g.rol='gm' AND g.aktif_mi=true
 AND (SELECT count(*) FROM pg_temp.kullanicilar x WHERE x.firma_id=h.firma_id AND x.rol='gm' AND x.aktif_mi=true)=1)));
$$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_kko_durum(p_kullanici uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE h pg_temp.cogniti_token_hesaplari%ROWTYPE; v_bakiye bigint;
BEGIN
 SELECT h1.* INTO h FROM pg_temp.cogniti_token_hesaplari h1 JOIN pg_temp.kullanicilar k
 ON k.firma_id=h1.firma_id AND k.kullanici_id=p_kullanici AND k.aktif_mi=true;
 IF NOT FOUND OR NOT pg_temp.cogniti_token_kko_yetkili(h.firma_id,p_kullanici) THEN RETURN jsonb_build_object('onay_gerekli',false); END IF;
 SELECT net_bakiye INTO v_bakiye FROM pg_temp.cogniti_token_bakiye(h.firma_id);
 IF v_bakiye>100 THEN RETURN jsonb_build_object('onay_gerekli',false); END IF;
 RETURN jsonb_build_object('onay_gerekli',true,'bakiye',v_bakiye,'onay_surumu',h.kko_onay_surumu);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_kko_onayla(p_kullanici uuid,p_surum uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE h pg_temp.cogniti_token_hesaplari%ROWTYPE; v_firma uuid; v_bakiye bigint; v_yukleme uuid; y pg_temp.cogniti_token_yuklemeleri%ROWTYPE;
BEGIN
 IF p_kullanici IS NULL OR p_surum IS NULL THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_gecersiz_onay' USING ERRCODE='22023'; END IF;
 SELECT firma_id INTO v_firma FROM pg_temp.kullanicilar WHERE kullanici_id=p_kullanici AND aktif_mi=true;
 SELECT * INTO h FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=v_firma FOR UPDATE;
 IF NOT FOUND OR NOT pg_temp.cogniti_token_kko_yetkili(v_firma,p_kullanici) THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_yetkisiz' USING ERRCODE='42501'; END IF;
 SELECT * INTO y FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=v_firma AND islem_anahtari='kko-devam:'||p_surum::text;
 IF FOUND THEN
  IF y.yukleme_turu<>'kko' OR y.miktar<>1500 THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_gecersiz_onay' USING ERRCODE='22023'; END IF;
  SELECT net_bakiye INTO v_bakiye FROM pg_temp.cogniti_token_bakiye(v_firma);
  RETURN jsonb_build_object('yukleme_id',y.yukleme_id,'bakiye',v_bakiye,'yeniden_deneme',true);
 END IF;
 IF h.kko_onay_surumu<>p_surum THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_guncel_degil' USING ERRCODE='40001'; END IF;
 SELECT net_bakiye INTO v_bakiye FROM pg_temp.cogniti_token_bakiye(v_firma);
 IF v_bakiye>100 THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_esik_asilmadi' USING ERRCODE='22023'; END IF;
 v_yukleme:=pg_temp.cogniti_token_yukle(v_firma,'kko',1500,'kko-devam:'||p_surum::text,NULL,NULL,p_kullanici,'KKÖ yetkili devam onayı');
 UPDATE pg_temp.cogniti_token_hesaplari SET kko_onay_surumu=gen_random_uuid(),updated_at=now() WHERE firma_id=v_firma;
 SELECT coalesce(sum(y1.kalan) FILTER (WHERE y1.son_kullanim_at IS NULL OR y1.son_kullanim_at>statement_timestamp()),0)-h1.asim_borcu INTO v_bakiye FROM pg_temp.cogniti_token_hesaplari h1 LEFT JOIN pg_temp.cogniti_token_yuklemeleri y1 ON y1.firma_id=h1.firma_id WHERE h1.firma_id=v_firma GROUP BY h1.asim_borcu;
 RETURN jsonb_build_object('yukleme_id',v_yukleme,'bakiye',v_bakiye,'yeniden_deneme',false);
END $$;
DO $test$
DECLARE f uuid:=gen_random_uuid(); f2 uuid:=gen_random_uuid(); gm uuid:=gen_random_uuid(); baska uuid:=gen_random_uuid(); yetkili uuid:=gen_random_uuid(); ay uuid:=gen_random_uuid(); v uuid; eski uuid; y uuid; sonuc jsonb; n bigint;
BEGIN
 INSERT INTO pg_temp.firmalar VALUES(f,true),(f2,true);
 INSERT INTO pg_temp.kullanicilar VALUES(gm,f,'gm',true),(baska,f,'bm',true),(yetkili,f,'tm',true),(ay,f2,'gm',true);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode'),(f2,'aylik');
 y:=pg_temp.cogniti_token_yukle(f,'kko',1500,'baslangic');
 sonuc:=pg_temp.cogniti_token_kko_durum(gm);
 IF (sonuc->>'onay_gerekli')::boolean THEN RAISE EXCEPTION '100 üzeri uyarı verdi'; END IF;
 INSERT INTO pg_temp.token_kko_test_sonuclari VALUES('100 üzeri bakiye onay istemez','BAŞARILI');
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=100 WHERE yukleme_id=y;
 sonuc:=pg_temp.cogniti_token_kko_durum(gm);v:=(sonuc->>'onay_surumu')::uuid;
 IF NOT (sonuc->>'onay_gerekli')::boolean OR (sonuc->>'bakiye')::bigint<>100 THEN RAISE EXCEPTION '100 eşiği hatalı'; END IF;
 INSERT INTO pg_temp.token_kko_test_sonuclari VALUES('100 token kalan GM onayını görür','BAŞARILI');
 IF (pg_temp.cogniti_token_kko_durum(baska)->>'onay_gerekli')::boolean OR (pg_temp.cogniti_token_kko_durum(ay)->>'onay_gerekli')::boolean THEN RAISE EXCEPTION 'Yetkisiz uyarı gördü'; END IF;
 BEGIN PERFORM pg_temp.cogniti_token_kko_onayla(baska,v); RAISE EXCEPTION 'Yetkisiz onaylandı'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 INSERT INTO pg_temp.token_kko_test_sonuclari VALUES('Başka kullanıcı ve aylık hesap onay veremez','BAŞARILI');
 UPDATE pg_temp.cogniti_token_hesaplari SET onay_yetkili_id=yetkili WHERE firma_id=f;
 BEGIN PERFORM pg_temp.cogniti_token_kko_onayla(gm,v); RAISE EXCEPTION 'Yetkisi devredilen GM onayladı'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 sonuc:=pg_temp.cogniti_token_kko_onayla(yetkili,v);
 IF (sonuc->>'bakiye')::bigint<>1600 OR (sonuc->>'yeniden_deneme')::boolean THEN RAISE EXCEPTION 'İlk onay hatalı'; END IF;
 INSERT INTO pg_temp.token_kko_test_sonuclari VALUES('Atanmış yetkili 1.500 süresiz token yükler','BAŞARILI');
 sonuc:=pg_temp.cogniti_token_kko_onayla(yetkili,v);
 SELECT count(*) INTO n FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f AND islem_anahtari='kko-devam:'||v::text;
 IF NOT (sonuc->>'yeniden_deneme')::boolean OR n<>1 OR EXISTS(SELECT 1 FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f AND son_kullanim_at IS NOT NULL) THEN RAISE EXCEPTION 'Tekrar çift yükleme'; END IF;
 INSERT INTO pg_temp.token_kko_test_sonuclari VALUES('Aynı onay tekrarında ikinci yükleme oluşmaz','BAŞARILI');
 eski:=v;
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=0 WHERE firma_id=f;
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=99 WHERE yukleme_id=y;
 sonuc:=pg_temp.cogniti_token_kko_durum(yetkili);v:=(sonuc->>'onay_surumu')::uuid;
 IF v=eski OR (sonuc->>'bakiye')::bigint<>99 THEN RAISE EXCEPTION 'Yeni eşik oluşmadı'; END IF;
 PERFORM pg_temp.cogniti_token_kko_onayla(yetkili,eski);
 IF (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f)<>2 THEN RAISE EXCEPTION 'Eski onay yeni dönemde yükledi'; END IF;
 sonuc:=pg_temp.cogniti_token_kko_onayla(yetkili,v);
 IF (sonuc->>'bakiye')::bigint<>1599 THEN RAISE EXCEPTION 'İkinci onay hatalı'; END IF;
 INSERT INTO pg_temp.token_kko_test_sonuclari VALUES('Sonraki 100 eşiğinde yeni onay gerekir','BAŞARILI');
 BEGIN PERFORM pg_temp.cogniti_token_kko_onayla(yetkili,gen_random_uuid()); RAISE EXCEPTION 'Geçersiz sürüm kabul edildi'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 INSERT INTO pg_temp.token_kko_test_sonuclari VALUES('Geçersiz onay sürümü reddedilir','BAŞARILI');
 UPDATE pg_temp.firmalar SET aktif=false WHERE firma_id=f;
 IF (pg_temp.cogniti_token_kko_durum(yetkili)->>'onay_gerekli')::boolean THEN RAISE EXCEPTION 'Pasif firma uyarı gördü'; END IF;
 INSERT INTO pg_temp.token_kko_test_sonuclari VALUES('Pasif firma devam onayı kullanamaz','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.token_kko_test_sonuclari ORDER BY test;
ROLLBACK;
