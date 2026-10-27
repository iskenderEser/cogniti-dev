-- Tek sekmede çalıştırın: yalnız geçici tablolarda sahte kayıtlar; sonunda ROLLBACK.
-- Kurulu token işlevlerinin kopyaları ve önerilen yayın işlevlerinin aynı kaynakları kullanılır.
-- Gerçek yayın/talep/öğrenme aracı zinciri test bağlamı görünümüyle temsil edilir.
-- Uygulama oturumu, push teslimi ve eş zamanlılık testi değildir.
BEGIN;
CREATE TEMP TABLE token_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari(LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri(LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketimleri(LIKE public.cogniti_token_tuketimleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketim_dagilimlari(LIKE public.cogniti_token_tuketim_dagilimlari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,aktif_mi boolean,takim_id uuid,bolge_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE bolgeler(bolge_id uuid PRIMARY KEY,takim_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE yayin_yonetimi(yayin_id uuid PRIMARY KEY,uretici_id uuid,durum text,hedef_roller text[],yayin_tarihi timestamptz) ON COMMIT DROP;
CREATE TEMP TABLE yayin_test_baglamlari(yayin_id uuid PRIMARY KEY,firma_id uuid,takim_id uuid) ON COMMIT DROP;
CREATE TEMP VIEW v_yayin_detay AS SELECT y.yayin_id,b.firma_id,b.takim_id,'Test içerik'::text AS urun_adi
 FROM pg_temp.yayin_yonetimi y JOIN pg_temp.yayin_test_baglamlari b USING(yayin_id);
CREATE TEMP TABLE yayin_tekrar_kayitlari(yayin_id uuid,tur_no integer,acilis_turu text,baslangic_tarihi timestamptz,UNIQUE(yayin_id,tur_no)) ON COMMIT DROP;
CREATE TEMP TABLE bildirimler(alici_id uuid,gonderen_id uuid,kayit_turu text,kayit_id uuid,mesaj text,goruldu_mu boolean,UNIQUE(alici_id,kayit_turu,kayit_id)) ON COMMIT DROP;
DO $klon$
DECLARE imza text; kaynak text;
BEGIN
 FOREACH imza IN ARRAY ARRAY[
  'public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)',
  'public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)'
 ] LOOP
  SELECT pg_get_functiondef(to_regprocedure(imza)) INTO kaynak;
  IF kaynak IS NULL THEN RAISE EXCEPTION 'Token önkoşulu eksik: %',imza; END IF;
  EXECUTE replace(kaynak,'public.','pg_temp.');
 END LOOP;
END $klon$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_yayin_acilis_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE v_firma uuid; v_takim uuid; v_gonderen_firma uuid; v_alici uuid;
BEGIN
 IF NEW.durum IS DISTINCT FROM 'yayinda' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  -- Devam etme, puan/tarih düzenleme ve teknik tekrar yeni bir gönderim değildir.
  IF OLD.durum IS DISTINCT FROM 'planlandi' THEN RETURN NEW; END IF;
 END IF;
 IF NOT (coalesce(NEW.hedef_roller,ARRAY['utt']) && ARRAY['utt','bm']) THEN RETURN NEW; END IF;
 SELECT firma_id,takim_id INTO v_firma,v_takim FROM pg_temp.v_yayin_detay WHERE yayin_id=NEW.yayin_id;
 SELECT firma_id INTO v_gonderen_firma FROM pg_temp.kullanicilar WHERE kullanici_id=NEW.uretici_id;
 IF v_firma IS NULL OR v_gonderen_firma IS DISTINCT FROM v_firma THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:yayin_firma_yok' USING ERRCODE='P0001';
 END IF;
 -- Hesabı kilitle: toplu tüketimde hesap değişimi veya eş zamanlı yükleme araya giremez.
 PERFORM 1 FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=v_gonderen_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001'; END IF;
 FOR v_alici IN
  SELECT k.kullanici_id FROM pg_temp.kullanicilar k
  LEFT JOIN pg_temp.bolgeler b ON b.bolge_id=k.bolge_id
  WHERE k.firma_id=v_gonderen_firma AND k.aktif_mi=true AND (
   ('bm'=ANY(coalesce(NEW.hedef_roller,ARRAY['utt'])) AND k.rol='bm') OR
   ('utt'=ANY(coalesce(NEW.hedef_roller,ARRAY['utt'])) AND k.rol IN ('utt','kd_utt')
    AND (v_takim IS NULL OR coalesce(k.takim_id,b.takim_id)=v_takim)))
  ORDER BY k.kullanici_id
 LOOP
  BEGIN
   PERFORM pg_temp.cogniti_token_tuket(v_gonderen_firma,'firma_kullanicisi',NEW.uretici_id,
    'firma_kullanicisi',v_alici::text,'yayin',NEW.yayin_id,
    'yayin-acilis:'||NEW.yayin_id::text||':'||v_alici::text);
  EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM='Yetersiz token bakiyesi.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
   ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001';
   ELSE RAISE;
   END IF;
  END;
 END LOOP;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_yayin_gonderim_alicilari(p_yayin_id uuid)
RETURNS TABLE(kullanici_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
 SELECT DISTINCT t.alici_kimligi::uuid FROM pg_temp.cogniti_token_tuketimleri t
 WHERE t.islem_turu='yayin' AND t.kaynak_id=p_yayin_id AND t.alici_turu='firma_kullanicisi'
 ORDER BY 1;
$$;
CREATE OR REPLACE FUNCTION pg_temp.yayin_planlananlari_aktive(p_yayin_id uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE aktive_sayisi integer:=0; y record; v_tarih timestamptz; v_urun_adi text;
BEGIN
 FOR y IN
  SELECT yayin_id,uretici_id,hedef_roller,yayin_tarihi FROM pg_temp.yayin_yonetimi
  WHERE durum='planlandi' AND ((p_yayin_id IS NULL AND yayin_tarihi<=now()) OR yayin_id=p_yayin_id)
  ORDER BY yayin_id FOR UPDATE SKIP LOCKED
 LOOP
  BEGIN
   v_tarih:=least(y.yayin_tarihi,now());
   UPDATE pg_temp.yayin_yonetimi SET durum='yayinda',yayin_tarihi=v_tarih WHERE yayin_id=y.yayin_id;
   INSERT INTO pg_temp.yayin_tekrar_kayitlari(yayin_id,tur_no,acilis_turu,baslangic_tarihi)
    VALUES(y.yayin_id,1,'ilk_yayin',v_tarih) ON CONFLICT(yayin_id,tur_no) DO NOTHING;
   SELECT coalesce(urun_adi,'-') INTO v_urun_adi FROM pg_temp.v_yayin_detay WHERE yayin_id=y.yayin_id;
   INSERT INTO pg_temp.bildirimler(alici_id,gonderen_id,kayit_turu,kayit_id,mesaj,goruldu_mu)
    SELECT k.kullanici_id,y.uretici_id,'yayin',y.yayin_id,'Yeni öğrenme içeriği yayında: '||coalesce(v_urun_adi,'-'),false
    FROM pg_temp.cogniti_token_yayin_gonderim_alicilari(y.yayin_id) k
    ON CONFLICT(alici_id,kayit_turu,kayit_id) DO NOTHING;
   aktive_sayisi:=aktive_sayisi+1;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
   IF p_yayin_id IS NULL AND SQLERRM IN ('COGNITI_TOKEN:bakiye_yetersiz','COGNITI_TOKEN:hesap_yok','COGNITI_TOKEN:yayin_firma_yok') THEN
    RAISE WARNING 'Yayın % planlandı bırakıldı: %',y.yayin_id,SQLERRM;
   ELSE RAISE;
   END IF;
  END;
 END LOOP;
 RETURN aktive_sayisi;
END $$;
CREATE TRIGGER yayin_token_test AFTER INSERT OR UPDATE OF durum ON pg_temp.yayin_yonetimi
 FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_yayin_acilis_kaydet();
DO $test$
DECLARE f uuid:=gen_random_uuid(); az uuid:=gen_random_uuid(); aylik uuid:=gen_random_uuid(); hesapsiz uuid:=gen_random_uuid();
 p uuid:=gen_random_uuid(); p_az uuid:=gen_random_uuid(); p_ay uuid:=gen_random_uuid(); p_yok uuid:=gen_random_uuid();
 t1 uuid:=gen_random_uuid(); t2 uuid:=gen_random_uuid(); b1 uuid:=gen_random_uuid(); b2 uuid:=gen_random_uuid();
 u1 uuid:=gen_random_uuid(); kd uuid:=gen_random_uuid(); u3 uuid:=gen_random_uuid(); pasif uuid:=gen_random_uuid();
 bm1 uuid:=gen_random_uuid(); bm2 uuid:=gen_random_uuid(); yabanci uuid:=gen_random_uuid();
 y uuid:=gen_random_uuid(); y2 uuid; y3 uuid; bekleyen uuid; iyi uuid;
 once bigint; kalan bigint; n integer;
BEGIN
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode'),(az,'kullandigin_kadar_ode'),(aylik,'aylik');
 PERFORM pg_temp.cogniti_token_yukle(f,'kko',100,'ana-hesap');
 PERFORM pg_temp.cogniti_token_yukle(az,'kko',1,'az-hesap');
 INSERT INTO pg_temp.bolgeler VALUES(b1,t1),(b2,t2);
 INSERT INTO pg_temp.kullanicilar VALUES
  (p,f,'pm',true,t1,NULL),(p_az,az,'pm',true,t1,NULL),(p_ay,aylik,'pm',true,t1,NULL),(p_yok,hesapsiz,'pm',true,t1,NULL),
  (u1,f,'utt',true,t1,b1),(kd,f,'kd_utt',true,NULL,b1),(u3,f,'utt',true,t2,b2),
  (pasif,f,'utt',false,t1,b1),(bm1,f,'bm',true,t1,b1),(bm2,f,'bm',true,t2,b2),
  (yabanci,gen_random_uuid(),'utt',true,t1,b1),
  (gen_random_uuid(),az,'utt',true,t1,b1),(gen_random_uuid(),az,'kd_utt',true,t1,b1),
  (gen_random_uuid(),aylik,'utt',true,t1,b1),(gen_random_uuid(),aylik,'kd_utt',true,t1,b1),
  (gen_random_uuid(),hesapsiz,'utt',true,t1,b1);
 INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y,f,t1);
 INSERT INTO pg_temp.yayin_yonetimi VALUES(y,p,'planlandi',ARRAY['utt'],now()+interval '2 days');
 UPDATE pg_temp.yayin_yonetimi SET yayin_tarihi=now()+interval '3 days' WHERE yayin_id=y;
 IF EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri) THEN RAISE EXCEPTION 'Plan/tarih değişimi tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Plan kaydı ve tarih değişimi token tüketmez','BAŞARILI');
 n:=pg_temp.yayin_planlananlari_aktive(y);
 IF n<>1 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>2
 OR NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri WHERE gonderen_id=p AND alici_kimligi=kd::text AND kaynak_id=y)
 OR EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri WHERE alici_kimligi IN (u3::text,pasif::text,bm1::text,yabanci::text)) THEN
  RAISE EXCEPTION 'Takım/rol/firma/pasif kapsamı hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Plan gerçekleşince yalnız doğru takımın aktif UTT ve KD UTT gönderimleri tüketilir','BAŞARILI');
 IF (SELECT count(*) FROM pg_temp.bildirimler WHERE kayit_id=y)<>2
 OR (SELECT count(*) FROM pg_temp.yayin_tekrar_kayitlari WHERE yayin_id=y)<>1 THEN RAISE EXCEPTION 'Tur veya bildirim hedefleri hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Plan aktivasyonunda tur ve gönderim alıcılarının bildirimi oluşur','BAŞARILI');
 n:=pg_temp.yayin_planlananlari_aktive(y);
 IF n<>0 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>2 THEN RAISE EXCEPTION 'Aktivasyon tekrarı tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Teknik aktivasyon tekrarı ikinci tüketim oluşturmaz','BAŞARILI');
 UPDATE pg_temp.yayin_yonetimi SET durum='Durduruldu' WHERE yayin_id=y;
 UPDATE pg_temp.yayin_yonetimi SET durum='yayinda' WHERE yayin_id=y;
 UPDATE pg_temp.yayin_yonetimi SET durum='yayinda' WHERE yayin_id=y;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>2 THEN RAISE EXCEPTION 'Durdur/devam tüketti veya iade etti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Durdurma iade etmez yeniden başlatma ikinci gönderim değildir','BAŞARILI');
 y2:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,f,t1);
 INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p,'yayinda',ARRAY['utt'],now());
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri WHERE kaynak_id=y2)<>2 THEN RAISE EXCEPTION 'Anlık yayın tüketimi hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Anlık yayında da aynı gönderen ve hedefler tüketilir','BAŞARILI');
 y2:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,f,NULL);
 INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p,'yayinda',ARRAY['utt'],now());
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri WHERE kaynak_id=y2)<>3 THEN RAISE EXCEPTION 'Firma geneli hedef hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Takımsız firma geneli yayın firmanın tüm aktif UTT hedeflerine gönderilir','BAŞARILI');
 y2:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,f,t1);
 INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p,'yayinda',ARRAY['bm'],now());
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri WHERE kaynak_id=y2)<>2
 OR NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri WHERE kaynak_id=y2 AND alici_kimligi=bm2::text) THEN RAISE EXCEPTION 'BM firma kapsamı hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('BM yayını firmadaki aktif BM hedeflerine gönderilir','BAŞARILI');
 SELECT count(*) INTO once FROM pg_temp.cogniti_token_tuketimleri;
 y2:=gen_random_uuid();y3:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,f,t1),(y3,f,t1);
 INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p,'yayinda',ARRAY['eczanem'],now()),(y3,p,'yayinda',ARRAY['eczaci','eczane_teknisyeni'],now());
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once THEN RAISE EXCEPTION 'Ara dağıtım aşamasında tüketim oluştu.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Eczanem ve E Club açılışında sonraki kişi gönderiminden önce tüketim olmaz','BAŞARILI');
 y2:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,az,t1);
 BEGIN
  INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p_az,'yayinda',ARRAY['utt'],now());
  RAISE EXCEPTION 'Yetersiz bakiye kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'COGNITI_TOKEN:bakiye_yetersiz' THEN RAISE; END IF; END;
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=az;
 IF kalan<>1 OR EXISTS(SELECT 1 FROM pg_temp.yayin_yonetimi WHERE yayin_id=y2)
 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once THEN RAISE EXCEPTION 'Yetersiz bakiyede kısmi işlem kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yetersiz KKÖ bakiyesinde yayın ve tüm tüketim geri alınır','BAŞARILI');
 y2:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,aylik,t1);
 INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p_ay,'yayinda',ARRAY['utt'],now());
 IF (SELECT asim_borcu FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=aylik)<>2 THEN RAISE EXCEPTION 'Aylık aşım hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aylık pakette bakiyesiz yayın açılır ve paket aşımı kaydedilir','BAŞARILI');
 y2:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,hesapsiz,t1);
 BEGIN
  INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p_yok,'yayinda',ARRAY['utt'],now());
  RAISE EXCEPTION 'Hesapsız firma yayın açtı.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'COGNITI_TOKEN:hesap_yok' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM pg_temp.yayin_yonetimi WHERE yayin_id=y2) THEN RAISE EXCEPTION 'Hesapsız yayın kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Token hesabı olmayan firma ücretsiz yayın açamaz','BAŞARILI');
 SELECT count(*) INTO once FROM pg_temp.cogniti_token_tuketimleri;
 y2:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,f,t1);
 BEGIN
  INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p,'yayinda',ARRAY['utt'],now());
  RAISE EXCEPTION 'test_sonraki_hata';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'test_sonraki_hata' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once
 OR EXISTS(SELECT 1 FROM pg_temp.yayin_yonetimi WHERE yayin_id=y2) THEN RAISE EXCEPTION 'Geri almada token veya yayın kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Sonraki işlem hatasında yayın ve tüketim birlikte geri alınır','BAŞARILI');
 bekleyen:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(bekleyen,az,t1);
 INSERT INTO pg_temp.yayin_yonetimi VALUES(bekleyen,p_az,'planlandi',ARRAY['utt'],now()-interval '1 hour');
 BEGIN
  PERFORM pg_temp.yayin_planlananlari_aktive(bekleyen);
  RAISE EXCEPTION 'Yetersiz hemen yayınla kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'COGNITI_TOKEN:bakiye_yetersiz' THEN RAISE; END IF; END;
 IF (SELECT durum FROM pg_temp.yayin_yonetimi WHERE yayin_id=bekleyen)<>'planlandi'
 OR EXISTS(SELECT 1 FROM pg_temp.yayin_tekrar_kayitlari WHERE yayin_id=bekleyen)
 OR EXISTS(SELECT 1 FROM pg_temp.bildirimler WHERE kayit_id=bekleyen) THEN RAISE EXCEPTION 'Başarısız plan kısmen açıldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yetersiz hemen yayınla isteğinde plan tur ve bildirim değişmez','BAŞARILI');
 iyi:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(iyi,f,t1);
 INSERT INTO pg_temp.yayin_yonetimi VALUES(iyi,p,'planlandi',ARRAY['utt'],now()-interval '1 hour');
 n:=pg_temp.yayin_planlananlari_aktive();
 IF n<>1 OR (SELECT durum FROM pg_temp.yayin_yonetimi WHERE yayin_id=iyi)<>'yayinda'
 OR (SELECT durum FROM pg_temp.yayin_yonetimi WHERE yayin_id=bekleyen)<>'planlandi'
 OR EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri WHERE kaynak_id=bekleyen)
 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri WHERE kaynak_id=iyi)<>2 THEN RAISE EXCEPTION 'Cron diğer firmayı engelledi veya kısmi tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Cron bakiyesi yetersiz firmayı bekletir diğer firmayı açar','BAŞARILI');
 y2:=gen_random_uuid();INSERT INTO pg_temp.yayin_test_baglamlari VALUES(y2,az,t1);
 BEGIN
  INSERT INTO pg_temp.yayin_yonetimi VALUES(y2,p,'yayinda',ARRAY['utt'],now());
  RAISE EXCEPTION 'Farklı firmanın yayını kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'COGNITI_TOKEN:yayin_firma_yok' THEN RAISE; END IF; END;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Gönderen ve yayın firması uyuşmazsa yayın açılmaz','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.token_test_sonuclari ORDER BY test;
ROLLBACK;
