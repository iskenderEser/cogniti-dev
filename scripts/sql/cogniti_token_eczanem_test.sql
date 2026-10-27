-- Önce bu testi tek sekmede çalıştırın. Gerçek kayıtlar değiştirilmez.
-- Sonunda tüm test tabloları/işlevleri ROLLBACK ile geri alınır.
-- Kurulu müşteri gönderim RPC'si ve token işlevleri geçici tablolara yönlendirilir.
-- Personelin eczane yetki kontrolü testte sahte yetki kaydıyla temsil edilir;
-- gerçek oturum/erişim, push teslimatı ve eş zamanlılık doğrulaması değildir.
BEGIN;
CREATE TEMP TABLE token_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari (LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri (LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketimleri (LIKE public.cogniti_token_tuketimleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketim_dagilimlari (LIKE public.cogniti_token_tuketim_dagilimlari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE v_yayin_detay(yayin_id uuid PRIMARY KEY,firma_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE yayin_yonetimi(yayin_id uuid PRIMARY KEY,durum text) ON COMMIT DROP;
CREATE TEMP TABLE eczanem_eczane_gonderimleri(yayin_id uuid,eczane_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE eczanem_musteriler(musteri_id uuid PRIMARY KEY,aktif_mi boolean) ON COMMIT DROP;
CREATE TEMP TABLE eczanem_uyelikler(musteri_id uuid,eczane_id uuid,aktif_mi boolean) ON COMMIT DROP;
CREATE TEMP TABLE eczanem_eclub_gecis_talepleri(musteri_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE personel_yetkileri(kisi_id uuid,eczane_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE eczanem_gonderimler(gonderim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 yayin_id uuid NOT NULL,eczane_id uuid NOT NULL,musteri_id uuid NOT NULL,gonderen_kisi_id uuid NOT NULL,
 UNIQUE(yayin_id,musteri_id,eczane_id)) ON COMMIT DROP;
CREATE FUNCTION pg_temp.eczanem_personel_eczane_yetkili_mi(p_kisi uuid,p_eczane uuid)
RETURNS boolean LANGUAGE sql AS 'SELECT EXISTS(SELECT 1 FROM pg_temp.personel_yetkileri WHERE kisi_id=p_kisi AND eczane_id=p_eczane)';
DO $klon$
DECLARE imza text; kaynak text;
BEGIN
 FOREACH imza IN ARRAY ARRAY[
  'public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)',
  'public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)',
  'public.eczanem_musterilere_video_gonder(uuid,uuid,uuid,uuid[])'
 ] LOOP
  SELECT pg_get_functiondef(to_regprocedure(imza)) INTO kaynak;
  IF kaynak IS NULL THEN RAISE EXCEPTION 'Önkoşul eksik: %',imza; END IF;
  EXECUTE replace(kaynak,'public.','pg_temp.');
 END LOOP;
END $klon$;

CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_eczanem_musteri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 -- Eczanenin veya personelin firması değil, gönderilen yayının sahibi firma.
 SELECT firma_id INTO v_firma FROM pg_temp.v_yayin_detay WHERE yayin_id=NEW.yayin_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:yayin_firma_yok' USING ERRCODE='P0001';
 END IF;
 BEGIN
  PERFORM pg_temp.cogniti_token_tuket(v_firma,'eclub_kisi',NEW.gonderen_kisi_id,
   'eczanem_musteri',NEW.musteri_id::text,'eczanem_musteri',NEW.yayin_id,'eczanem-gonderim:'||NEW.gonderim_id::text);
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
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_eczanem_toplu_gonder(
 p_eczane_id uuid,p_gonderen_kisi_id uuid,p_yayin_idler uuid[],p_musteri_idler uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_yayin uuid; v_musteriler uuid[]; v_bas integer; v_sonuc record;
 v_hedefler uuid[]; v_gonderilen integer:=0; v_atlanan integer:=0; v_sonuclar jsonb:='[]'::jsonb;
BEGIN
 IF p_eczane_id IS NULL OR p_gonderen_kisi_id IS NULL OR coalesce(cardinality(p_yayin_idler),0)=0
 OR coalesce(cardinality(p_musteri_idler),0)=0 OR array_position(p_yayin_idler,NULL) IS NOT NULL
 OR array_position(p_musteri_idler,NULL) IS NOT NULL
 OR cardinality(p_yayin_idler)::bigint*cardinality(p_musteri_idler)>10000 THEN
  RAISE EXCEPTION 'Tek istekte 1–10.000 yayın-müşteri gönderimi seçilmelidir.' USING ERRCODE='22023';
 END IF;
 SELECT array_agg(DISTINCT id ORDER BY id) INTO v_musteriler FROM unnest(p_musteri_idler) AS x(id);
 FOR v_yayin IN SELECT DISTINCT id FROM unnest(p_yayin_idler) AS x(id) ORDER BY id LOOP
  v_hedefler:=ARRAY[]::uuid[];
  v_bas:=1;
  WHILE v_bas<=cardinality(v_musteriler) LOOP
   SELECT * INTO v_sonuc FROM pg_temp.eczanem_musterilere_video_gonder(
    p_eczane_id,p_gonderen_kisi_id,v_yayin,v_musteriler[v_bas:v_bas+99]);
   IF NOT FOUND THEN RAISE EXCEPTION 'Müşteri gönderim sonucu alınamadı.' USING ERRCODE='P0001'; END IF;
   IF v_sonuc.ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION '%',coalesce(v_sonuc.hata,'Müşteri gönderimi tamamlanamadı.') USING ERRCODE='P0001';
   END IF;
   v_gonderilen:=v_gonderilen+v_sonuc.gonderilen;
   v_atlanan:=v_atlanan+v_sonuc.atlanan;
   v_hedefler:=v_hedefler||coalesce(v_sonuc.gonderilen_musteri_idler,ARRAY[]::uuid[]);
   v_bas:=v_bas+100;
  END LOOP;
  v_sonuclar:=v_sonuclar||jsonb_build_array(jsonb_build_object('yayin_id',v_yayin,'musteri_idler',v_hedefler));
 END LOOP;
 RETURN jsonb_build_object('ok',true,'gonderilen',v_gonderilen,'atlanan',v_atlanan,'sonuclar',v_sonuclar);
END $$;

CREATE TRIGGER token_eczanem_test AFTER INSERT ON pg_temp.eczanem_gonderimler
 FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_eczanem_musteri_kaydet();
DO $test$
DECLARE f uuid:=gen_random_uuid(); f2 uuid:=gen_random_uuid(); hesapsiz uuid:=gen_random_uuid();
 e uuid:=gen_random_uuid(); kisi uuid:=gen_random_uuid(); m1 uuid:=gen_random_uuid(); m2 uuid:=gen_random_uuid();
 m3 uuid:=gen_random_uuid(); pasif uuid:=gen_random_uuid(); y1 uuid:=gen_random_uuid(); y2 uuid:=gen_random_uuid();
 y3 uuid:=gen_random_uuid(); y4 uuid:=gen_random_uuid(); y5 uuid:=gen_random_uuid();
 r jsonb; kalan bigint; diger bigint; once bigint; n bigint; borc bigint; kalabalik uuid[];
BEGIN
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode'),(f2,'kullandigin_kadar_ode');
 PERFORM pg_temp.cogniti_token_yukle(f,'kko',2,'firma1');
 PERFORM pg_temp.cogniti_token_yukle(f2,'kko',2,'firma2');
 INSERT INTO pg_temp.v_yayin_detay VALUES(y1,f),(y2,f),(y3,f),(y4,f2),(y5,hesapsiz);
 INSERT INTO pg_temp.yayin_yonetimi SELECT yayin_id,'yayinda' FROM pg_temp.v_yayin_detay;
 INSERT INTO pg_temp.eczanem_eczane_gonderimleri SELECT yayin_id,e FROM pg_temp.v_yayin_detay;
 INSERT INTO pg_temp.personel_yetkileri VALUES(kisi,e);
 INSERT INTO pg_temp.eczanem_musteriler VALUES(m1,true),(m2,true),(m3,true),(pasif,false);
 INSERT INTO pg_temp.eczanem_uyelikler VALUES(m1,e,true),(m2,e,true),(m3,e,true),(pasif,e,false);
 SELECT count(*) INTO n FROM pg_temp.cogniti_token_tuketimleri;
 IF n<>0 THEN RAISE EXCEPTION 'Eczaneye aktarımda tüketim oluştu.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Eczaneye aktarımda müşteri tüketimi oluşmaz','BAŞARILI');
 r:=pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y1],ARRAY[m1]);
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 SELECT sum(z.kalan) INTO diger FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f2;
 IF kalan IS DISTINCT FROM 1 OR diger IS DISTINCT FROM 2 OR NOT EXISTS(
  SELECT 1 FROM pg_temp.cogniti_token_tuketimleri WHERE firma_id=f AND gonderen_turu='eclub_kisi'
   AND gonderen_id=kisi AND alici_turu='eczanem_musteri' AND alici_kimligi=m1::text
   AND kaynak_id=y1 AND islem_turu='eczanem_musteri') THEN RAISE EXCEPTION 'Yayın sahibi firmadan tüketim hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Müşteri gönderimi yayının sahibi firmadan bir token düşer','BAŞARILI');
 r:=pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y1],ARRAY[m1]);
 IF (r->>'gonderilen')::int<>0 OR (r->>'atlanan')::int<>1
 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>1 THEN RAISE EXCEPTION 'Tekrar gönderim tüketildi.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Önceden gönderilmiş müşteri tekrar tüketilmez','BAŞARILI');
 SELECT count(*) INTO once FROM pg_temp.eczanem_gonderimler;
 BEGIN
  PERFORM pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y1],ARRAY[m2,m3]);
  RAISE EXCEPTION 'Yetersiz toplu müşteri gönderimi kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'COGNITI_TOKEN:bakiye_yetersiz' THEN RAISE; END IF;
 END;
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF kalan IS DISTINCT FROM 1 OR (SELECT count(*) FROM pg_temp.eczanem_gonderimler)<>once THEN
  RAISE EXCEPTION 'Yetersiz toplu müşteri işleminde kısmi kayıt kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yetersiz toplu müşteri işleminde tümü geri alınır','BAŞARILI');
 BEGIN
  PERFORM pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y2,y3],ARRAY[m1]);
  RAISE EXCEPTION 'Yetersiz çoklu yayın gönderimi kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'COGNITI_TOKEN:bakiye_yetersiz' THEN RAISE; END IF;
 END;
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF kalan IS DISTINCT FROM 1 OR (SELECT count(*) FROM pg_temp.eczanem_gonderimler)<>once THEN
  RAISE EXCEPTION 'Çoklu yayın işleminde kısmi kayıt kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yetersiz çoklu yayın işleminde önceki yayınlar da geri alınır','BAŞARILI');
 r:=pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y1],ARRAY[m2,pasif]);
 IF (r->>'gonderilen')::int<>1 OR (r->>'atlanan')::int<>1 THEN RAISE EXCEPTION 'Pasif müşteri ayrımı hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Pasif müşteri atlanır yalnız gönderilen müşteri tüketilir','BAŞARILI');
 r:=pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y4],ARRAY[m1]);
 SELECT sum(z.kalan) INTO diger FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f2;
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f;
 IF diger IS DISTINCT FROM 1 OR kalan IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'Diğer yayının firması yanlış borçlandı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aynı eczanede her yayın kendi firmasından tüketir','BAŞARILI');
 BEGIN
  PERFORM pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y5],ARRAY[m1]);
  RAISE EXCEPTION 'Hesapsız firma gönderimi kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'COGNITI_TOKEN:hesap_yok' THEN RAISE; END IF;
 END;
 IF EXISTS(SELECT 1 FROM pg_temp.eczanem_gonderimler WHERE yayin_id=y5) THEN RAISE EXCEPTION 'Hesapsız firma gönderimi kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Token hesabı olmayan yayın sahibinin gönderimi durur','BAŞARILI');
 UPDATE pg_temp.cogniti_token_hesaplari SET paket_turu='aylik' WHERE firma_id=f;
 r:=pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y2],ARRAY[m1,m2]);
 SELECT asim_borcu INTO borc FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=f;
 IF borc IS DISTINCT FROM 2 OR (r->>'gonderilen')::int<>2 THEN RAISE EXCEPTION 'Aylık aşım hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aylık pakette müşteri gönderimleri paket aşımına geçer','BAŞARILI');
 SELECT count(*) INTO once FROM pg_temp.eczanem_gonderimler;
 BEGIN
  PERFORM pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y4],ARRAY[m2]);
  RAISE EXCEPTION 'test_sonraki_hata';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'test_sonraki_hata' THEN RAISE; END IF;
 END;
 SELECT sum(z.kalan) INTO diger FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f2;
 IF diger IS DISTINCT FROM 1 OR (SELECT count(*) FROM pg_temp.eczanem_gonderimler)<>once THEN
  RAISE EXCEPTION 'Geri alınan gönderimde tüketim kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Gönderim geri alındığında token tüketimi de geri alınır','BAŞARILI');
 -- İlk yüzlü parça başarılı olsa bile 101. müşteri token bulamazsa hepsi geri alınır.
 PERFORM pg_temp.cogniti_token_yukle(f2,'kko',99,'yuzlu-parca');
 SELECT array_agg(gen_random_uuid()) INTO kalabalik FROM generate_series(1,101);
 INSERT INTO pg_temp.eczanem_musteriler SELECT id,true FROM unnest(kalabalik) AS x(id);
 INSERT INTO pg_temp.eczanem_uyelikler SELECT id,e,true FROM unnest(kalabalik) AS x(id);
 SELECT count(*) INTO n FROM pg_temp.cogniti_token_tuketimleri;
 BEGIN
  PERFORM pg_temp.cogniti_token_eczanem_toplu_gonder(e,kisi,ARRAY[y4],kalabalik);
  RAISE EXCEPTION 'İkinci müşteri parçasında yetersiz bakiye kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN
  IF SQLERRM<>'COGNITI_TOKEN:bakiye_yetersiz' THEN RAISE; END IF;
 END;
 SELECT sum(z.kalan) INTO diger FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=f2;
 IF diger IS DISTINCT FROM 100 OR (SELECT count(*) FROM pg_temp.eczanem_gonderimler)<>once
 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>n THEN
  RAISE EXCEPTION 'İkinci parça hatasında önceki yüzlü parçadan kayıt kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('101 müşteride yetersiz bakiye ilk yüzlü parçayı da geri alır','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.token_test_sonuclari ORDER BY test;
ROLLBACK;
