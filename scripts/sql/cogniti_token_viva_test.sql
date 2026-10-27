-- Tek sekmede çalıştırın. Tüm kayıtlar geçici; en sonda ROLLBACK.
-- Kurulu Viva yazıcılarının ve token işlevlerinin geçici kopyaları kullanılır.
-- Yetki/ayrıntı yardımcıları sahte kayıtlarla temsil edilir; gerçek oturum,
-- e-posta/push teslimi, Daily bağlantısı ve eş zamanlılık testi değildir.
-- SET CONSTRAINTS komutları RPC transaction sonundaki kesinleşmeyi burada sınar.
BEGIN;
CREATE TEMP TABLE token_test_sonuclari(test text,sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari(LIKE public.cogniti_token_hesaplari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri(LIKE public.cogniti_token_yuklemeleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketimleri(LIKE public.cogniti_token_tuketimleri INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketim_dagilimlari(LIKE public.cogniti_token_tuketim_dagilimlari INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_viva_kimlikleri(firma_id uuid,etkinlik_id uuid,kimlik text,tuketim_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(firma_id,etkinlik_id,kimlik,tuketim_id)) ON COMMIT DROP;
CREATE TEMP TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,aktif_mi boolean,rol text,eposta text) ON COMMIT DROP;
CREATE TEMP TABLE eclub_kisiler(kisi_id uuid PRIMARY KEY,eposta text,auth_user_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE viva_etkinlikler(LIKE public.viva_etkinlikler INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE viva_katilimcilar(LIKE public.viva_katilimcilar INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE viva_davetler(LIKE public.viva_davetler INCLUDING ALL) ON COMMIT DROP;
CREATE TEMP TABLE viva_eposta_gonderimleri(LIKE public.viva_eposta_gonderimleri INCLUDING ALL) ON COMMIT DROP;
CREATE FUNCTION pg_temp.viva_duzenleyen_aktif(p_id uuid) RETURNS boolean LANGUAGE sql AS
 'SELECT EXISTS(SELECT 1 FROM pg_temp.kullanicilar WHERE kullanici_id=p_id AND aktif_mi)';
CREATE FUNCTION pg_temp.viva_sahip_aktif(p_id uuid) RETURNS boolean LANGUAGE sql AS
 'SELECT EXISTS(SELECT 1 FROM pg_temp.viva_etkinlikler e JOIN pg_temp.kullanicilar k ON k.kullanici_id=e.sahip_id AND k.firma_id=e.firma_id WHERE e.etkinlik_id=p_id AND k.aktif_mi)';
CREATE FUNCTION pg_temp.viva_ic_kapsam(p_sahip uuid,p_id uuid) RETURNS boolean LANGUAGE sql AS
 'SELECT EXISTS(SELECT 1 FROM pg_temp.kullanicilar WHERE kullanici_id=p_id AND aktif_mi)';
CREATE FUNCTION pg_temp.viva_eclub_kapsam(p_sahip uuid,p_id uuid) RETURNS boolean LANGUAGE sql AS
 'SELECT EXISTS(SELECT 1 FROM pg_temp.eclub_kisiler WHERE kisi_id=p_id)';
CREATE FUNCTION pg_temp.viva_detay(p_auth uuid,p_id uuid) RETURNS jsonb LANGUAGE sql AS
 'SELECT jsonb_build_object(''etkinlik_id'',p_id)';
CREATE FUNCTION pg_temp.viva_eposta_detay(p_auth uuid,p_id uuid) RETURNS jsonb LANGUAGE sql AS
 'SELECT pg_temp.viva_detay(p_auth,p_id)';
CREATE FUNCTION pg_temp.viva_test_form(p_id uuid,p_durum text,p_katilimcilar jsonb,p_surum integer DEFAULT 1) RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_build_object('etkinlik_id',p_id,'baslik','Token testi','aciklama','','yayin_turu','planli',
 'durum',p_durum,'baslangic',now()+interval '1 day','bitis',now()+interval '2 days',
 'katilimcilar',p_katilimcilar,'surum',p_surum)
$$;
CREATE FUNCTION pg_temp.viva_test_aday(p_adres text) RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_build_array(jsonb_build_object('eposta',p_adres,'davet_id',gen_random_uuid(),
 'token_hash',md5(p_adres||gen_random_uuid()::text)||md5(gen_random_uuid()::text)))
$$;
DO $klon$
DECLARE imza text; kaynak text;
BEGIN
 FOREACH imza IN ARRAY ARRAY[
  'public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)',
  'public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)',
  'public.viva_islem(uuid,text,jsonb)', 'public.viva_eposta_kaydet(uuid,text,jsonb,jsonb)'
 ] LOOP
  SELECT pg_get_functiondef(to_regprocedure(imza)) INTO kaynak;
  IF kaynak IS NULL THEN RAISE EXCEPTION 'Önkoşul eksik: %',imza; END IF;
  kaynak:=replace(kaynak,'public.','pg_temp.');
  kaynak:=regexp_replace(kaynak,'SET search_path TO [^\n]+','SET search_path TO pg_temp, pg_catalog','g');
  -- PostgreSQL geçici şemayı niteliksiz işlev aramasında kullanmaz.
  kaynak:=regexp_replace(kaynak,'(^|[^a-zA-Z0-9_.])(viva_[a-z_]+)\(','\1pg_temp.\2(','g');
  EXECUTE kaynak;
 END LOOP;
END $klon$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_viva_davet_kaydet(
 p_etkinlik uuid,p_tur text,p_kisi uuid,p_eposta text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE e pg_temp.viva_etkinlikler%ROWTYPE; v_firma uuid; v_eposta text;
 v_tur text; v_alici text; v_kimlikler text[]; v_tuketim uuid; v_eslesmeler uuid[]; v_id uuid; v_auth uuid;
BEGIN
 SELECT * INTO e FROM pg_temp.viva_etkinlikler WHERE etkinlik_id=p_etkinlik FOR SHARE;
 IF NOT FOUND OR e.durum NOT IN ('planlandi','canli') THEN RETURN NULL; END IF;
 SELECT firma_id INTO v_firma FROM pg_temp.kullanicilar WHERE kullanici_id=e.sahip_id;
 IF v_firma IS NULL OR v_firma IS DISTINCT FROM e.firma_id THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:viva_firma_yok' USING ERRCODE='P0001'; END IF;
 IF p_tur='ic' THEN
  SELECT lower(btrim(eposta)) INTO v_eposta FROM pg_temp.kullanicilar WHERE kullanici_id=p_kisi;
  IF NOT FOUND THEN RAISE EXCEPTION 'Viva katılımcısı bulunamadı.' USING ERRCODE='22023'; END IF;
  v_tur:='firma_kullanicisi';v_alici:=p_kisi::text;v_kimlikler:=ARRAY['ic:'||v_alici];
  FOR v_id IN SELECT kisi_id FROM pg_temp.eclub_kisiler WHERE auth_user_id=p_kisi LOOP
   v_kimlikler:=array_append(v_kimlikler,'eclub:'||v_id::text);
  END LOOP;
 ELSIF p_tur='eclub' THEN
  SELECT lower(btrim(eposta)),auth_user_id INTO v_eposta,v_auth FROM pg_temp.eclub_kisiler WHERE kisi_id=p_kisi;
  IF NOT FOUND THEN RAISE EXCEPTION 'Viva katılımcısı bulunamadı.' USING ERRCODE='22023'; END IF;
  v_tur:='eclub_kisi';v_alici:=p_kisi::text;v_kimlikler:=ARRAY['eclub:'||v_alici];
  IF v_auth IS NOT NULL AND EXISTS(SELECT 1 FROM pg_temp.kullanicilar WHERE kullanici_id=v_auth) THEN
   v_kimlikler:=array_append(v_kimlikler,'ic:'||v_auth::text);
  END IF;
 ELSIF p_tur='ozel' THEN
  v_eposta:=lower(btrim(p_eposta));
  IF coalesce(length(v_eposta),0) NOT BETWEEN 3 AND 254 THEN
   RAISE EXCEPTION 'Viva davet adresi geçersiz.' USING ERRCODE='22023'; END IF;
  v_tur:='viva_ozel_davetli';v_alici:=v_eposta;v_kimlikler:=ARRAY[]::text[];
 ELSE RAISE EXCEPTION 'Viva davet türü geçersiz.' USING ERRCODE='22023'; END IF;
 -- Aynı firmanın davet/tüketim işlemlerini seri hale getirir; tekrar davet sıfır bakiyede de geçer.
 PERFORM 1 FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=v_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001'; END IF;
 -- Kayıtlı kişi kimlikleri önce gelir; aynı e-posta iki farklı kişinin
 -- kimliğini kendiliğinden birleştirmez. Aynı Auth hesabı birleşik kimliktir.
 SELECT array_agg(DISTINCT k.tuketim_id) INTO v_eslesmeler
 FROM pg_temp.cogniti_token_viva_kimlikleri k
 WHERE k.firma_id=v_firma AND k.etkinlik_id=p_etkinlik AND k.kimlik=ANY(v_kimlikler);
 IF coalesce(cardinality(v_eslesmeler),0)>1 THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:viva_kimlik_belirsiz' USING ERRCODE='P0001'; END IF;
 v_tuketim:=v_eslesmeler[1];
 IF v_tuketim IS NULL AND coalesce(v_eposta,'')<>'' THEN
  IF p_tur='ozel' THEN
   SELECT array_agg(DISTINCT k.tuketim_id) INTO v_eslesmeler
   FROM pg_temp.cogniti_token_viva_kimlikleri k
   WHERE k.firma_id=v_firma AND k.etkinlik_id=p_etkinlik AND k.kimlik='eposta:'||v_eposta;
  ELSE
   -- Daha önce özel adres olarak davet edilmiş ve henüz başka bir kişiye
   -- bağlanmamış e-posta bu kişinin aynı daveti olarak eşleşir.
   SELECT array_agg(DISTINCT k.tuketim_id) INTO v_eslesmeler
   FROM pg_temp.cogniti_token_viva_kimlikleri k
   JOIN pg_temp.cogniti_token_tuketimleri t ON t.firma_id=k.firma_id AND t.tuketim_id=k.tuketim_id
   WHERE k.firma_id=v_firma AND k.etkinlik_id=p_etkinlik AND k.kimlik='eposta:'||v_eposta
    AND t.alici_turu='viva_ozel_davetli'
    AND NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_viva_kimlikleri diger
     WHERE diger.firma_id=k.firma_id AND diger.etkinlik_id=k.etkinlik_id AND diger.tuketim_id=k.tuketim_id
     AND (diger.kimlik LIKE 'ic:%' OR diger.kimlik LIKE 'eclub:%') AND NOT diger.kimlik=ANY(v_kimlikler));
  END IF;
  IF coalesce(cardinality(v_eslesmeler),0)>1 THEN
   RAISE EXCEPTION 'COGNITI_TOKEN:viva_kimlik_belirsiz' USING ERRCODE='P0001'; END IF;
  v_tuketim:=v_eslesmeler[1];
 END IF;
 IF coalesce(v_eposta,'')<>'' THEN v_kimlikler:=array_append(v_kimlikler,'eposta:'||v_eposta); END IF;
 IF v_tuketim IS NULL THEN
  BEGIN
   v_tuketim:=pg_temp.cogniti_token_tuket(v_firma,'firma_kullanicisi',e.sahip_id,v_tur,v_alici,
    'viva_davet',p_etkinlik,'viva-davet:'||p_etkinlik::text||':'||v_tur||':'||v_alici);
  EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM='Yetersiz token bakiyesi.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
   ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001';
   ELSE RAISE;
   END IF;
  END;
 END IF;
 INSERT INTO pg_temp.cogniti_token_viva_kimlikleri(firma_id,etkinlik_id,kimlik,tuketim_id)
 SELECT v_firma,p_etkinlik,x,v_tuketim FROM unnest(v_kimlikler) k(x)
 ON CONFLICT(firma_id,etkinlik_id,kimlik,tuketim_id) DO NOTHING;
 RETURN v_tuketim;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_viva_davet_tetikle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE d record; k record;
BEGIN
 IF TG_TABLE_NAME='viva_katilimcilar' THEN
  IF EXISTS(SELECT 1 FROM pg_temp.viva_katilimcilar WHERE etkinlik_id=NEW.etkinlik_id AND tur=NEW.tur
   AND kullanici_id IS NOT DISTINCT FROM NEW.kullanici_id AND kisi_id IS NOT DISTINCT FROM NEW.kisi_id) THEN
   PERFORM pg_temp.cogniti_token_viva_davet_kaydet(NEW.etkinlik_id,NEW.tur,coalesce(NEW.kullanici_id,NEW.kisi_id),NULL);
  END IF;
 ELSIF TG_TABLE_NAME='viva_davetler' THEN
  IF TG_OP='UPDATE' THEN
   -- OTP/oturum/e-posta durumu güncellemeleri yeni davet değildir.
   IF NOT OLD.iptal OR NEW.iptal THEN RETURN NEW; END IF;
  END IF;
  SELECT * INTO d FROM pg_temp.viva_davetler WHERE davet_id=NEW.davet_id AND NOT iptal;
  IF FOUND THEN PERFORM pg_temp.cogniti_token_viva_davet_kaydet(d.etkinlik_id,'ozel',NULL,d.eposta); END IF;
 ELSE
  -- Durum değişiminde eski taslak adaylar değil son listede kalan kişiler tüketilir.
  FOR k IN SELECT * FROM pg_temp.viva_katilimcilar WHERE etkinlik_id=NEW.etkinlik_id LOOP
   PERFORM pg_temp.cogniti_token_viva_davet_kaydet(k.etkinlik_id,k.tur,coalesce(k.kullanici_id,k.kisi_id),NULL);
  END LOOP;
  FOR d IN SELECT * FROM pg_temp.viva_davetler WHERE etkinlik_id=NEW.etkinlik_id AND NOT iptal LOOP
   PERFORM pg_temp.cogniti_token_viva_davet_kaydet(d.etkinlik_id,'ozel',NULL,d.eposta);
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER trg_cogniti_token_viva_katilimci AFTER INSERT ON pg_temp.viva_katilimcilar
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_viva_davet_tetikle();
CREATE CONSTRAINT TRIGGER trg_cogniti_token_viva_ozel AFTER INSERT OR UPDATE ON pg_temp.viva_davetler
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION pg_temp.cogniti_token_viva_davet_tetikle();
CREATE CONSTRAINT TRIGGER trg_cogniti_token_viva_durum AFTER UPDATE ON pg_temp.viva_etkinlikler
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
 WHEN(OLD.durum='taslak' AND NEW.durum IN ('planlandi','canli'))
 EXECUTE FUNCTION pg_temp.cogniti_token_viva_davet_tetikle();
DO $test$
DECLARE f uuid:=gen_random_uuid(); az uuid:=gen_random_uuid(); ay uuid:=gen_random_uuid(); yok uuid:=gen_random_uuid();
 sahip uuid:=gen_random_uuid(); az_sahip uuid:=gen_random_uuid(); ay_sahip uuid:=gen_random_uuid(); yok_sahip uuid:=gen_random_uuid();
 ic1 uuid:=gen_random_uuid(); ic2 uuid:=gen_random_uuid(); ic3 uuid:=gen_random_uuid(); ec uuid:=gen_random_uuid(); ec_bagli uuid:=gen_random_uuid();
 id uuid:=gen_random_uuid(); baska uuid; eposta_id uuid; davet uuid; once bigint; kalan bigint; form jsonb; secimler jsonb;
BEGIN
 INSERT INTO pg_temp.cogniti_token_hesaplari(firma_id,paket_turu) VALUES(f,'kullandigin_kadar_ode'),(az,'kullandigin_kadar_ode'),(ay,'aylik');
 PERFORM pg_temp.cogniti_token_yukle(f,'kko',100,'ana');PERFORM pg_temp.cogniti_token_yukle(az,'kko',1,'az');
 INSERT INTO pg_temp.kullanicilar VALUES(sahip,f,true,'pm','sahip@example.invalid'),(az_sahip,az,true,'pm','az@example.invalid'),
 (ay_sahip,ay,true,'pm','ay@example.invalid'),(yok_sahip,yok,true,'pm','yok@example.invalid'),
 (ic1,f,true,'utt','bir@example.invalid'),(ic2,f,true,'bm','iki@example.invalid'),(ic3,f,true,'utt','bir@example.invalid');
 INSERT INTO pg_temp.eclub_kisiler VALUES(ec,'eczaci@example.invalid',NULL),(ec_bagli,'bagli@example.invalid',ic1);
 secimler:=jsonb_build_array(jsonb_build_object('tur','ic','id',ic1),jsonb_build_object('tur','eclub','id',ec));
 form:=pg_temp.viva_test_form(id,'taslak',secimler)||jsonb_build_object('davet_epostalari',jsonb_build_array('ozel@example.invalid'));
 PERFORM pg_temp.viva_eposta_kaydet(sahip,'olustur',form,pg_temp.viva_test_aday('ozel@example.invalid'));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri) THEN RAISE EXCEPTION 'Taslak tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Taslak iç E Club ve özel davetlileri token tüketmez','BAŞARILI');
 -- Taslakta seçilmiş ic1 ve özel adres çıkarılır; yalnız E Club kişisi davet edilir.
 form:=pg_temp.viva_test_form(id,'planlandi',jsonb_build_array(jsonb_build_object('tur','eclub','id',ec)))
  ||jsonb_build_object('davet_epostalari','[]'::jsonb);
 PERFORM pg_temp.viva_eposta_kaydet(sahip,'kaydet',form,'[]');
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>1
 OR NOT EXISTS(SELECT 1 FROM pg_temp.cogniti_token_tuketimleri WHERE kaynak_id=id AND alici_turu='eclub_kisi' AND alici_kimligi=ec::text) THEN
 RAISE EXCEPTION 'Taslak eski adayları tüketti veya son kişi eksik.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Taslak planlanınca yalnız son listedeki davetliler tüketilir','BAŞARILI');
 form:=pg_temp.viva_test_form(id,'planlandi',secimler,2);
 PERFORM pg_temp.viva_islem(sahip,'kaydet',form);
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>2 THEN RAISE EXCEPTION 'Yeni iç katılımcı veya tekrar E Club hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Planlı etkinliğe yeni iç katılımcı eklenince bir token düşer','BAŞARILI');
 form:=pg_temp.viva_test_form(id,'planlandi',secimler,3);
 PERFORM pg_temp.viva_islem(sahip,'kaydet',form);
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>2 THEN RAISE EXCEPTION 'Düzenleme ikinci tüketim oluşturdu.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Katılımcı listesinin silinip yeniden yazılması tekrar tüketmez','BAŞARILI');
 form:=pg_temp.viva_test_form(id,'planlandi','[]',4);PERFORM pg_temp.viva_islem(sahip,'kaydet',form);
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 form:=pg_temp.viva_test_form(id,'planlandi',secimler,5);PERFORM pg_temp.viva_islem(sahip,'kaydet',form);
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>2 THEN RAISE EXCEPTION 'Çıkarıp tekrar ekleme tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aynı etkinlikte çıkarılıp tekrar davet edilen kişi yeniden tüketmez','BAŞARILI');
 form:=pg_temp.viva_test_form(id,'planlandi',secimler,6)||jsonb_build_object('davet_epostalari',jsonb_build_array(' BIR@EXAMPLE.INVALID '));
 PERFORM pg_temp.viva_eposta_kaydet(sahip,'kaydet',form,pg_temp.viva_test_aday('bir@example.invalid'));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>2 THEN RAISE EXCEPTION 'İç kişi özel adres olarak tekrar tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('İç kişinin e posta adresine özel davet ikinci token tüketmez','BAŞARILI');
 form:=pg_temp.viva_test_form(id,'planlandi',secimler,7)||jsonb_build_object('davet_epostalari',jsonb_build_array('misafir@example.invalid'));
 PERFORM pg_temp.viva_eposta_kaydet(sahip,'kaydet',form,pg_temp.viva_test_aday('misafir@example.invalid'));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>3 THEN RAISE EXCEPTION 'Yeni özel davet tüketimi hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yeni özel davet e posta gönderimini beklemeden bir token tüketir','BAŞARILI');
 SELECT davet_id INTO davet FROM pg_temp.viva_davetler WHERE etkinlik_id=id AND eposta='misafir@example.invalid' AND NOT iptal;
 UPDATE pg_temp.viva_davetler SET kod_hash='kod',oturum_hash='oturum' WHERE davet_id=davet;
 UPDATE pg_temp.viva_eposta_gonderimleri SET durum='hata',hata_kodu='test' WHERE davet_id=davet;
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>3 THEN RAISE EXCEPTION 'Kod veya e posta denemesi tekrar tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('E posta hatası doğrulama kodu ve oturum yenileme tekrar tüketmez','BAŞARILI');
 UPDATE pg_temp.viva_davetler SET iptal=true WHERE davet_id=davet;
 PERFORM pg_temp.viva_islem(sahip,'davet_ekle',jsonb_build_object('etkinlik_id',id,'surum',8,'ad','Misafir','eposta','MISAFIR@example.invalid','hash',md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text)));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>3 THEN RAISE EXCEPTION 'Yeni bağlantı ikinci tüketim oluşturdu.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aynı adrese iptal sonrası yeni davet bağlantısı tekrar tüketmez','BAŞARILI');
 -- Özel adres önce gelir, ardından aynı iç kişi seçilir.
 eposta_id:=gen_random_uuid();form:=pg_temp.viva_test_form(eposta_id,'planlandi','[]')||jsonb_build_object('davet_epostalari',jsonb_build_array('iki@example.invalid'));
 PERFORM pg_temp.viva_eposta_kaydet(sahip,'olustur',form,pg_temp.viva_test_aday('iki@example.invalid'));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 SELECT count(*) INTO once FROM pg_temp.cogniti_token_tuketimleri;
 PERFORM pg_temp.viva_islem(sahip,'kaydet',pg_temp.viva_test_form(eposta_id,'planlandi',jsonb_build_array(jsonb_build_object('tur','ic','id',ic2)),1));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once THEN RAISE EXCEPTION 'Özelden iç kişiye geçiş tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Önce özel adres sonra iç kişi seçimi aynı etkinlikte tek tüketimdir','BAŞARILI');
 baska:=gen_random_uuid();form:=pg_temp.viva_test_form(baska,'planlandi',secimler);
 PERFORM pg_temp.viva_islem(sahip,'olustur',form);
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once+2 THEN RAISE EXCEPTION 'Yeni etkinlik tüketimi hatalı.'; END IF;
 PERFORM pg_temp.viva_islem(sahip,'olustur',form);
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once+2 THEN RAISE EXCEPTION 'Oluşturma tekrarı tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Farklı etkinlik yeni tüketir aynı oluşturma isteğinin tekrarı tüketmez','BAŞARILI');
 UPDATE pg_temp.viva_etkinlikler SET durum='canli' WHERE etkinlik_id=baska;
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once+2 THEN RAISE EXCEPTION 'Canlıya geçiş tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Canlıya geçiş oda ve oturumdan bağımsızdır ek tüketmez','BAŞARILI');
 baska:=gen_random_uuid();SELECT count(*) INTO once FROM pg_temp.cogniti_token_tuketimleri;
 BEGIN
  PERFORM pg_temp.viva_islem(az_sahip,'olustur',pg_temp.viva_test_form(baska,'planlandi',secimler));
  SET CONSTRAINTS ALL IMMEDIATE;
  RAISE EXCEPTION 'Yetersiz Viva toplu daveti kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'COGNITI_TOKEN:bakiye_yetersiz' THEN RAISE; END IF; END;
 SET CONSTRAINTS ALL DEFERRED;
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=az;
 IF kalan<>1 OR EXISTS(SELECT 1 FROM pg_temp.viva_etkinlikler WHERE etkinlik_id=baska)
 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once THEN RAISE EXCEPTION 'Yetersiz bakiyede kısmi etkinlik veya tüketim kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Yetersiz KKÖ bakiyesinde etkinlik tüm davetler ve tüketim geri alınır','BAŞARILI');
 baska:=gen_random_uuid();PERFORM pg_temp.viva_islem(ay_sahip,'olustur',pg_temp.viva_test_form(baska,'planlandi',secimler));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT asim_borcu FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=ay)<>2 THEN RAISE EXCEPTION 'Viva aylık aşımı hatalı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aylık pakette Viva davetleri paket aşımına geçer','BAŞARILI');
 baska:=gen_random_uuid();BEGIN
  PERFORM pg_temp.viva_islem(yok_sahip,'olustur',pg_temp.viva_test_form(baska,'planlandi',secimler));
  SET CONSTRAINTS ALL IMMEDIATE;RAISE EXCEPTION 'Hesapsız Viva daveti kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'COGNITI_TOKEN:hesap_yok' THEN RAISE; END IF; END;
 SET CONSTRAINTS ALL DEFERRED;
 IF EXISTS(SELECT 1 FROM pg_temp.viva_etkinlikler WHERE etkinlik_id=baska) THEN RAISE EXCEPTION 'Hesapsız etkinlik kaldı.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Token hesabı olmayan firma ücretsiz Viva daveti oluşturamaz','BAŞARILI');
 -- Aynı adrese sahip farklı hesaplar ayrı kişi; aynı Auth hesabına bağlı
 -- iç ve E Club kimlikleri ise aynı kişidir.
 baska:=gen_random_uuid();SELECT count(*) INTO once FROM pg_temp.cogniti_token_tuketimleri;
 PERFORM pg_temp.viva_islem(sahip,'olustur',pg_temp.viva_test_form(baska,'planlandi',jsonb_build_array(
  jsonb_build_object('tur','ic','id',ic1),jsonb_build_object('tur','ic','id',ic3),jsonb_build_object('tur','eclub','id',ec_bagli))));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once+2 THEN RAISE EXCEPTION 'Ortak e posta veya ortak Auth kimlikleri hatalı eşleşti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aynı e postalı farklı kişiler ayrı aynı Auth hesabı tek tüketimdir','BAŞARILI');
 BEGIN
  PERFORM pg_temp.viva_islem(sahip,'davet_ekle',jsonb_build_object('etkinlik_id',baska,'surum',1,
   'ad','Davetli','eposta','bir@example.invalid','hash',md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text)));
  SET CONSTRAINTS ALL IMMEDIATE;RAISE EXCEPTION 'Belirsiz e posta kabul edildi.';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'COGNITI_TOKEN:viva_kimlik_belirsiz' THEN RAISE; END IF; END;
 SET CONSTRAINTS ALL DEFERRED;
 IF EXISTS(SELECT 1 FROM pg_temp.viva_davetler WHERE etkinlik_id=baska)
 OR (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri)<>once+2 THEN RAISE EXCEPTION 'Belirsiz e posta kısmi kayıt oluşturdu.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Birden çok kişiyle eşleşen özel adres hatayla geri alınır','BAŞARILI');
 baska:=gen_random_uuid();form:=pg_temp.viva_test_form(baska,'planlandi',jsonb_build_array(jsonb_build_object('tur','ic','id',ic2)));
 PERFORM pg_temp.viva_islem(az_sahip,'olustur',form);
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 SELECT sum(z.kalan) INTO kalan FROM pg_temp.cogniti_token_yuklemeleri z WHERE firma_id=az;
 IF kalan<>0 THEN RAISE EXCEPTION 'Son token tüketilmedi.'; END IF;
 PERFORM pg_temp.viva_islem(az_sahip,'kaydet',form||jsonb_build_object('surum',1));
 SET CONSTRAINTS ALL IMMEDIATE;SET CONSTRAINTS ALL DEFERRED;
 IF (SELECT count(*) FROM pg_temp.cogniti_token_tuketimleri WHERE firma_id=az AND kaynak_id=baska)<>1 THEN RAISE EXCEPTION 'Sıfır bakiyede mevcut davet tekrarı tüketti.'; END IF;
 INSERT INTO pg_temp.token_test_sonuclari VALUES('Aynı davet sıfır bakiyede düzenlenebilir ve tekrar tüketmez','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.token_test_sonuclari ORDER BY test;
ROLLBACK;
