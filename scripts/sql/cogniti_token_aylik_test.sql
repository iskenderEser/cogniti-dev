-- Adım 6 testi: tek sekme, geçici sahte kayıtlar; sonunda ROLLBACK.
-- Kurulu yükleme/tüketim/bakiye işlevleri kopyalanır. Saat çağrıları yalnız
-- test kopyalarında geçici saate yönlendirilir; Aralık/Ocak/Şubat sınırları sınanır.
-- Gerçek firma/bakiye değiştirilmez; cron kurulmaz. Eş zamanlılık testi değildir.
BEGIN;
CREATE TEMP TABLE token_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE token_test_zamani(an timestamptz) ON COMMIT DROP;
INSERT INTO token_test_zamani VALUES('2030-12-01 00:00:00+03');
CREATE FUNCTION pg_temp.token_test_saati() RETURNS timestamptz LANGUAGE sql VOLATILE AS 'SELECT an FROM pg_temp.token_test_zamani';
CREATE TEMP TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari(LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri(LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketimleri(LIKE public.cogniti_token_tuketimleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketim_dagilimlari(LIKE public.cogniti_token_tuketim_dagilimlari INCLUDING ALL) ON COMMIT DROP;
CREATE UNIQUE INDEX IF NOT EXISTS cogniti_token_aylik_donem_tek_test
 ON pg_temp.cogniti_token_yuklemeleri(firma_id,donem_yil,donem_ay) WHERE yukleme_turu='aylik_paket';
DO $klon$
DECLARE imza text; kaynak text;
BEGIN
 FOREACH imza IN ARRAY ARRAY[
  'public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)',
  'public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)',
  'public.cogniti_token_bakiye(uuid)'
 ] LOOP
  SELECT pg_get_functiondef(to_regprocedure(imza)) INTO kaynak;
  IF kaynak IS NULL THEN RAISE EXCEPTION 'Önkoşul eksik: %',imza; END IF;
  kaynak:=replace(kaynak,'public.','pg_temp.');
  kaynak:=regexp_replace(kaynak,'SET search_path TO [^\n]+','SET search_path TO pg_temp, pg_catalog','g');
  kaynak:=replace(replace(kaynak,'statement_timestamp()','pg_temp.token_test_saati()'),'now()','pg_temp.token_test_saati()');
  EXECUTE kaynak;
 END LOOP;
END $klon$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_aylik_donemi_yukle(p_firma uuid)
RETURNS TABLE(yukleme_id uuid,yuklendi boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE h pg_temp.cogniti_token_hesaplari%ROWTYPE; v_id uuid;
 v_ay date:=date_trunc('month',pg_temp.token_test_saati() AT TIME ZONE 'Europe/Istanbul')::date;
 v_yil integer; v_ay_no integer;
BEGIN
 SELECT * INTO h FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Token hesabı bulunamadı.' USING ERRCODE='22023'; END IF;
 IF h.paket_turu<>'aylik' OR NOT EXISTS(SELECT 1 FROM pg_temp.firmalar WHERE firma_id=p_firma AND aktif=true) THEN
  RETURN QUERY SELECT NULL::uuid,false;RETURN; END IF;
 v_yil:=extract(year from v_ay)::integer;v_ay_no:=extract(month from v_ay)::integer;
 SELECT y.yukleme_id INTO v_id FROM pg_temp.cogniti_token_yuklemeleri y
 WHERE y.firma_id=p_firma AND y.yukleme_turu='aylik_paket' AND y.donem_yil=v_yil AND y.donem_ay=v_ay_no;
 IF FOUND THEN RETURN QUERY SELECT v_id,false;RETURN; END IF;
 IF h.aylik_paket_miktari IS NULL OR h.aylik_paket_miktari NOT IN(10000,30000,75000) THEN
  RAISE EXCEPTION 'Aylık paket miktarı tanımlı değil veya geçersiz.' USING ERRCODE='22023'; END IF;
 v_id:=pg_temp.cogniti_token_yukle(p_firma,'aylik_paket',h.aylik_paket_miktari,
  'aylik-paket:'||to_char(v_ay,'YYYY-MM'),v_yil,v_ay_no,NULL,'Otomatik aylık paket');
 RETURN QUERY SELECT v_id,true;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_aylik_yuklemeleri_isle()
RETURNS TABLE(firma_id uuid,yukleme_id uuid,sonuc text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE v_firma uuid; r record;
BEGIN
 FOR v_firma IN SELECT h.firma_id FROM pg_temp.cogniti_token_hesaplari h
  JOIN pg_temp.firmalar f ON f.firma_id=h.firma_id AND f.aktif=true
  WHERE h.paket_turu='aylik' ORDER BY h.firma_id
 LOOP
  BEGIN
   SELECT * INTO r FROM pg_temp.cogniti_token_aylik_donemi_yukle(v_firma);
   RETURN QUERY SELECT v_firma,r.yukleme_id,CASE WHEN r.yukleme_id IS NULL THEN 'atlandi' WHEN r.yuklendi THEN 'yuklendi' ELSE 'zaten_yuklu' END;
  EXCEPTION WHEN SQLSTATE '22023' THEN
   RAISE WARNING 'Aylık token yüklenemedi; firma %, neden %',v_firma,SQLERRM;
   RETURN QUERY SELECT v_firma,NULL::uuid,'paket_bilgisi_hatasi'::text;
  END;
 END LOOP;
END $$;
DO $bagla$
DECLARE kaynak text; nokta text:=' SELECT * INTO y FROM pg_temp.cogniti_token_yuklemeleri';
 ek text:=E' -- cogniti-token-aylik-yenile-v1\n IF h.paket_turu=''aylik'' THEN\n  PERFORM 1 FROM pg_temp.cogniti_token_aylik_donemi_yukle(p_firma);\n END IF;\n';
BEGIN
 kaynak:=pg_get_functiondef('pg_temp.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)'::regprocedure);
 IF strpos(kaynak,'-- cogniti-token-aylik-yenile-v1')=0 THEN
  IF (length(kaynak)-length(replace(kaynak,nokta,'')))/length(nokta)<>1 THEN
   RAISE EXCEPTION 'Kurulu tüketim işlevinde beklenen bağlantı noktası bulunamadı; değişiklik uygulanmadı.'; END IF;
  kaynak:=replace(kaynak,nokta,ek||nokta);
  kaynak:=replace(kaynak,'son_kullanim_at>pg_temp.token_test_saati()','son_kullanim_at>pg_temp.token_test_saati()');
  EXECUTE kaynak;
 END IF;
END $bagla$;
DO $test$
DECLARE f uuid:=gen_random_uuid(); kko uuid:=gen_random_uuid(); pasif uuid:=gen_random_uuid();
 borclu uuid:=gen_random_uuid(); bozuk uuid:=gen_random_uuid(); diger uuid:=gen_random_uuid(); sifir uuid:=gen_random_uuid(); geri uuid:=gen_random_uuid();
 gonderen uuid:=gen_random_uuid(); kaynak uuid:=gen_random_uuid(); y uuid; y_eski uuid; r record; n bigint; bakiye bigint; kalan bigint;
BEGIN
 INSERT INTO pg_temp.firmalar VALUES(f,true),(kko,true),(pasif,false);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu,aylik_paket_miktari) VALUES
 (f,'aylik',10000),(kko,'kullandigin_kadar_ode',NULL),(pasif,'aylik',10000);
 y_eski:=pg_temp.cogniti_token_yukle(f,'aylik_paket',10000,'admin-ilk-paket',2030,12,NULL,'İlk aylık paket');
 PERFORM pg_temp.cogniti_token_yukle(kko,'kko',1500,'kko-ilk');
 SELECT * INTO r FROM pg_temp.cogniti_token_aylik_donemi_yukle(f);
 IF r.yuklendi OR r.yukleme_id IS DISTINCT FROM y_eski
 OR (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f)<>1 THEN RAISE EXCEPTION 'İlk ay ikinci kez yüklendi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Adminin ilk aylık yüklemesi otomatik işlemde tekrarlanmaz','BAŞARILI');
 BEGIN
  PERFORM pg_temp.cogniti_token_yukle(f,'aylik_paket',10000,'baska-anahtar',2030,12,NULL,'Aynı ay tekrar');
  RAISE EXCEPTION 'Aynı ay farklı anahtar ikinci paketi açtı.';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f)<>1 THEN RAISE EXCEPTION 'Dönem tekilliği bozuldu.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aynı firma ve ay farklı anahtarla da ikinci paket alamaz','BAŞARILI');
 PERFORM * FROM pg_temp.cogniti_token_aylik_yuklemeleri_isle();
 IF EXISTS(SELECT 1 FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=pasif)
 OR (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=kko)<>1 THEN RAISE EXCEPTION 'KKÖ veya pasif firma aylık yüklendi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Zamanlanmış işlem KKÖ ve pasif firmaya aylık paket yüklemez','BAŞARILI');
 -- UTC'de hâlâ 31 Aralık; Türkiye'de yeni ay tam 21:00 UTC'de başlar.
 UPDATE pg_temp.token_test_zamani SET an='2030-12-31 20:59:59.999+00';
 PERFORM pg_temp.cogniti_token_tuket(f,'firma_kullanicisi',gonderen,'firma_kullanicisi','alici-1','yayin',kaynak,'aralik-son');
 IF (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f)<>1 THEN RAISE EXCEPTION 'Türkiye ayı erken değişti.'; END IF;
 UPDATE pg_temp.token_test_zamani SET an='2030-12-31 21:00:00+00';
 PERFORM pg_temp.cogniti_token_tuket(f,'firma_kullanicisi',gonderen,'firma_kullanicisi','alici-2','yayin',kaynak,'ocak-ilk');
 IF NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f AND donem_yil=2031 AND donem_ay=1 AND miktar=10000)
 OR (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f)<>2 THEN RAISE EXCEPTION 'Türkiye yıl/ay geçişi yanlış.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Türkiye gece yarısı ve yıl geçişinde ilk gönderim yeni ayı yükler','BAŞARILI');
 SELECT z.kalan INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE z.yukleme_id=y_eski;
 SELECT b.net_bakiye INTO bakiye FROM pg_temp.cogniti_token_bakiye(f) b;
 IF kalan<>9998 OR bakiye<>19998
 OR (SELECT z.kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f AND donem_yil=2031 AND donem_ay=1)<>10000 THEN RAISE EXCEPTION 'Önce eski token tüketilmedi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Devreden eski token yeni ay paketinden önce tüketilir','BAŞARILI');
 IF (SELECT son_kullanim_at FROM pg_temp.cogniti_token_yuklemeleri WHERE yukleme_id=y_eski) IS DISTINCT FROM '2031-02-01 00:00:00+03'::timestamptz THEN RAISE EXCEPTION 'İki aylık takvim süresi yanlış.'; END IF;
 UPDATE pg_temp.token_test_zamani SET an='2031-01-31 20:59:59.999+00';
 PERFORM pg_temp.cogniti_token_tuket(f,'firma_kullanicisi',gonderen,'firma_kullanicisi','alici-3','yayin',kaynak,'sure-sonu-oncesi');
 UPDATE pg_temp.token_test_zamani SET an='2031-01-31 21:00:00+00';
 SELECT b.net_bakiye INTO bakiye FROM pg_temp.cogniti_token_bakiye(f) b;
 IF bakiye<>10000 OR (SELECT z.kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE yukleme_id=y_eski)<>9997 THEN RAISE EXCEPTION 'Süresi dolan bakiye veya tarihçe hatalı.'; END IF;
 PERFORM pg_temp.cogniti_token_tuket(f,'firma_kullanicisi',gonderen,'firma_kullanicisi','alici-4','yayin',kaynak,'sure-sonu-sonrasi');
 SELECT b.net_bakiye INTO bakiye FROM pg_temp.cogniti_token_bakiye(f) b;
 IF bakiye<>19999 OR EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketim_dagilimlari d
 JOIN pg_temp.cogniti_token_tuketimleri t ON t.tuketim_id=d.tuketim_id WHERE t.islem_anahtari='sure-sonu-sonrasi' AND d.yukleme_id=y_eski) THEN RAISE EXCEPTION 'Dolmuş token harcandı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('İkinci ayın son milisaniyesi geçerli tam sınırda geçersiz tarihçe korunur','BAŞARILI');
 PERFORM * FROM pg_temp.cogniti_token_aylik_yuklemeleri_isle();
 PERFORM * FROM pg_temp.cogniti_token_aylik_yuklemeleri_isle();
 IF (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=f)<>3 THEN RAISE EXCEPTION 'İşleyici tekrarı yükledi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('İşleyici tekrar çalışsa da ay başına tek paket yükler','BAŞARILI');
 SELECT b.net_bakiye INTO bakiye FROM pg_temp.cogniti_token_bakiye(kko) b;
 IF bakiye<>1500 OR EXISTS(SELECT 1 FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=kko AND son_kullanim_at IS NOT NULL) THEN RAISE EXCEPTION 'KKÖ süresi değişti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('KKÖ tokenları ay geçişlerinden etkilenmez süresiz kalır','BAŞARILI');
 INSERT INTO pg_temp.firmalar VALUES(borclu,true);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu,aylik_paket_miktari,asim_borcu) VALUES(borclu,'aylik',75000,20);
 SELECT * INTO r FROM pg_temp.cogniti_token_aylik_donemi_yukle(borclu);
 SELECT b.net_bakiye INTO bakiye FROM pg_temp.cogniti_token_bakiye(borclu) b;
 IF NOT r.yuklendi OR bakiye<>74980 OR (SELECT asim_borcu FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=borclu)<>0 THEN RAISE EXCEPTION 'Aşım yeni yüklemeden düşmedi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yeni aylık paket önce önceki paket aşımını kapatır','BAŞARILI');
 INSERT INTO pg_temp.firmalar VALUES(bozuk,true),(diger,true);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu,aylik_paket_miktari) VALUES(bozuk,'aylik',123),(diger,'aylik',30000);
 SELECT count(*) INTO n FROM pg_temp.cogniti_token_aylik_yuklemeleri_isle() x WHERE x.firma_id=bozuk AND x.sonuc='paket_bilgisi_hatasi';
 IF n<>1 OR NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=diger AND miktar=30000)
 OR EXISTS(SELECT 1 FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=bozuk) THEN RAISE EXCEPTION 'Hatalı firma diğerlerini engelledi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Geçersiz paket kaydı diğer firmaların yüklemesini engellemez','BAŞARILI');
 INSERT INTO pg_temp.firmalar VALUES(sifir,true);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu,aylik_paket_miktari) VALUES(sifir,'aylik',10000);
 PERFORM pg_temp.cogniti_token_tuket(sifir,'firma_kullanicisi',gonderen,'firma_kullanicisi','ilk-alici','yayin',kaynak,'cron-oncesi-ilk');
 SELECT b.net_bakiye INTO bakiye FROM pg_temp.cogniti_token_bakiye(sifir) b;
 IF bakiye<>9999 OR EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri WHERE firma_id=sifir AND asim_miktari<>0) THEN RAISE EXCEPTION 'Cron beklenirken gereksiz aşım oluştu.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Cron beklenmeden ilk gerçek gönderim paketi yükler aşım oluşturmaz','BAŞARILI');
 UPDATE pg_temp.cogniti_token_yuklemeleri SET kalan=0 WHERE firma_id=sifir;
 PERFORM pg_temp.cogniti_token_tuket(sifir,'firma_kullanicisi',gonderen,'firma_kullanicisi','asim-alici','yayin',kaynak,'gercek-asim');
 SELECT b.net_bakiye INTO bakiye FROM pg_temp.cogniti_token_bakiye(sifir) b;
 IF bakiye<>-1 OR (SELECT count(*) FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=sifir)<>1 THEN RAISE EXCEPTION 'Biten paket aynı ay tekrar yüklendi veya aşım kayboldu.'; END IF;
 UPDATE pg_temp.token_test_zamani SET an='2031-03-01 00:00:00+03';
 PERFORM pg_temp.cogniti_token_tuket(sifir,'firma_kullanicisi',gonderen,'firma_kullanicisi','yeni-alici','yayin',kaynak,'yeni-ay-mahsup');
 SELECT b.net_bakiye INTO bakiye FROM pg_temp.cogniti_token_bakiye(sifir) b;
 IF bakiye<>9998 OR (SELECT asim_borcu FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=sifir)<>0 THEN RAISE EXCEPTION 'Yeni ay aşım mahsubu yanlış.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Paket bitince negatif bakiye oluşur sonraki ay mahsup edilir','BAŞARILI');
 INSERT INTO pg_temp.firmalar VALUES(geri,true);
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu,aylik_paket_miktari,asim_borcu) VALUES(geri,'aylik',10000,7);
 BEGIN
  PERFORM * FROM pg_temp.cogniti_token_aylik_donemi_yukle(geri);
  RAISE EXCEPTION 'test_sonraki_hata';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'test_sonraki_hata' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM pg_temp.cogniti_token_yuklemeleri WHERE firma_id=geri)
 OR (SELECT asim_borcu FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=geri)<>7 THEN RAISE EXCEPTION 'Geri alınan yükleme borcu değiştirdi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Sonraki işlem hatasında otomatik yükleme ve mahsup geri alınır','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.token_test_sonuclari ORDER BY test;
ROLLBACK;
