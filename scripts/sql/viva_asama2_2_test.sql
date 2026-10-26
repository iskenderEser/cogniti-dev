-- Viva 2.2 yetki sınırı testi. KULLANICI ÇALIŞTIRACAK; ajan çalıştırmaz.
-- Önce viva_asama2_2.sql kurulu olmalı. Dosyanın tamamını çalıştırın.
-- Mevcut kullanıcı/firma/üyelikler yalnız okunur; yalnız yeni rastgele Viva test kayıtları yazılır.
-- Test görüşme, Daily HTTP, e-posta veya gerçek kullanıcı oturumu açmaz. Tümü ROLLBACK.
BEGIN;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
CREATE TEMP TABLE viva_katilim_test_sonuclari(sira integer GENERATED ALWAYS AS IDENTITY,test text,sonuc text,detay text) ON COMMIT DROP;
CREATE FUNCTION pg_temp.viva_katilim_kontrol(p_test text,p_ok boolean,p_detay text DEFAULT NULL) RETURNS void LANGUAGE sql AS $$
 INSERT INTO pg_temp.viva_katilim_test_sonuclari(test,sonuc,detay)
 VALUES(p_test,CASE WHEN p_ok IS TRUE THEN 'BAŞARILI' ELSE 'BAŞARISIZ' END,p_detay);
$$;
DO $test$
DECLARE sahip uuid; uye uuid; etkinlik uuid:=gen_random_uuid(); davet uuid:=gen_random_uuid(); yabanci uuid:=gen_random_uuid();
 ec_sahip uuid; ec_kisi uuid; ec_auth uuid; ec_etkinlik uuid:=gen_random_uuid();
 govde jsonb; r jsonb; q jsonb; red boolean; h text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);
 oh text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text); yeni_h text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text); yeni_oh text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);
BEGIN
 SELECT s.kullanici_id,h.kullanici_id INTO sahip,uye FROM public.kullanicilar s
 LEFT JOIN LATERAL(SELECT k.kullanici_id FROM public.kullanicilar k WHERE k.kullanici_id<>s.kullanici_id AND public.viva_ic_kapsam(s.kullanici_id,k.kullanici_id) ORDER BY k.kullanici_id LIMIT 1) h ON true
 WHERE public.viva_duzenleyen_aktif(s.kullanici_id) ORDER BY (h.kullanici_id IS NULL),s.kullanici_id LIMIT 1;
 IF sahip IS NULL THEN
  INSERT INTO pg_temp.viva_katilim_test_sonuclari(test,sonuc,detay) VALUES('Önkoşul','ATLANDI','Aktif düzenleyen bulunamadı; mevcut kayıtlara müdahale edilmedi.');RETURN;
 END IF;
 govde:=jsonb_build_object('etkinlik_id',etkinlik,'baslik','[VIVA 2.2 SQL TEST — ROLLBACK]',
  'aciklama','Kalıcı olmayan katılım yetki testi.','baslangic',now()+interval '1 hour','bitis',now()+interval '2 hours',
  'durum','taslak','katilimcilar',CASE WHEN uye IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(jsonb_build_object('id',uye,'tur','ic')) END);
 PERFORM public.viva_islem(sahip,'olustur',govde);
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(sahip,etkinlik,NULL,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('01 — Taslak etkinlikte sahip de katılım alamaz',red);
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(sahip,etkinlik,h,oh);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('02 — Üye ve misafir kimliği karıştırılamaz',red);
 PERFORM public.viva_islem(sahip,'kaydet',govde||jsonb_build_object('durum','planlandi','surum',1));
 r:=public.viva_daily_katilim_baglam(sahip,etkinlik,NULL,NULL);
 PERFORM pg_temp.viva_katilim_kontrol('03 — Yalnız etkinlik sahibi sunucu rolü alır',r->>'rol'='sunucu' AND r->>'kimlik'='uye:'||sahip::text AND r->>'sahip_id'=sahip::text AND NOT(r?'eposta') AND NOT(r?'token'));
 PERFORM pg_temp.viva_katilim_kontrol('04 — Başlangıç ve bitiş katılım kapısına taşınır',(r->>'baslangic')::timestamptz=now()+interval '1 hour' AND (r->>'bitis')::timestamptz=now()+interval '2 hours','Başlangıç öncesi token vermeme kuralı uygulama katmanında ayrıca sınanır.');
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(yabanci,etkinlik,NULL,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('05 — Davet edilmemiş kullanıcı katılım alamaz',red);
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(sahip,gen_random_uuid(),NULL,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('06 — Başka veya olmayan etkinliğe geçilemez',red);
 INSERT INTO public.viva_davetler(davet_id,etkinlik_id,ad,eposta,token_hash)
 VALUES(davet,etkinlik,'Sentetik Viva misafiri','viva-sql-test@example.invalid',h);
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(NULL,NULL,h,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('07 — Yalnız davet bağlantısı katılım sağlamaz',red);
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(NULL,NULL,h,oh);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('08 — Doğrulanmamış e-posta oturumu reddedilir',red);
 -- Yalnız yeni test davetinde doğrulanmış oturum koşulunu kurar. Gerçek e-posta göndermez.
 UPDATE public.viva_davetler SET oturum_hash=oh,oturum_bitis=now()+interval '30 minutes' WHERE davet_id=davet;
 r:=public.viva_daily_katilim_baglam(NULL,NULL,h,oh);
 PERFORM pg_temp.viva_katilim_kontrol('09 — Doğrulanmış misafir yalnız etkinliğe özel izleyicidir',r->>'rol'='izleyici' AND r->>'kimlik'='davet:'||davet::text AND r->>'etkinlik_id'=etkinlik::text AND (r->>'oturum_bitis')::timestamptz=now()+interval '30 minutes' AND NOT(r?'eposta'));
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(NULL,NULL,h,yeni_oh);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('10 — Yanlış cookie özetiyle katılım reddedilir',red);
 UPDATE public.viva_davetler SET oturum_bitis=now()-interval '1 second' WHERE davet_id=davet;
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(NULL,NULL,h,oh);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('11 — Süresi dolmuş misafir oturumu reddedilir',red);
 UPDATE public.viva_davetler SET oturum_hash=yeni_oh,oturum_bitis=now()+interval '30 minutes' WHERE davet_id=davet;
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(NULL,NULL,h,oh);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('12 — Oturum yenilenince eski cookie erişemez',red);
 r:=public.viva_daily_katilim_baglam(NULL,NULL,h,yeni_oh);
 PERFORM pg_temp.viva_katilim_kontrol('13 — Yeni doğrulanmış oturum izleyici kalır',r->>'rol'='izleyici');
 UPDATE public.viva_davetler SET iptal=true WHERE davet_id=davet;
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(NULL,NULL,h,yeni_oh);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('14 — İptal edilmiş davet yeni token alamaz',red);
 INSERT INTO public.viva_davetler(etkinlik_id,ad,eposta,token_hash,oturum_hash,oturum_bitis)
 VALUES(etkinlik,'Yenilenen sentetik davet','viva-sql-test@example.invalid',yeni_h,yeni_oh,now()+interval '30 minutes');
 r:=public.viva_daily_katilim_baglam(NULL,NULL,yeni_h,yeni_oh);
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(NULL,NULL,h,yeni_oh);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('15 — Yenilenen davet eski bağlantıyı açmaz',red AND r->>'rol'='izleyici' AND r->>'kimlik'<>'davet:'||davet::text);
 q:=public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');
 PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'tamamla',jsonb_build_object('kira_anahtari',q#>>'{istek,kira_anahtari}','oda_id','sql-test-oda'));
 UPDATE public.viva_daily_odalar SET durum='kapali' WHERE etkinlik_id=etkinlik;
 r:=public.viva_daily_katilim_baglam(sahip,etkinlik,NULL,NULL);
 PERFORM pg_temp.viva_katilim_kontrol('16 — Kapalı oda hazır eşleşme olarak dönmez',r#>>'{oda,durum}'='kapali' AND (r#>>'{oda,guncel}')::boolean IS FALSE);
 UPDATE public.viva_daily_odalar SET durum='hazir' WHERE etkinlik_id=etkinlik;
 UPDATE public.viva_etkinlikler SET bitis=bitis+interval '1 hour',surum=surum+1 WHERE etkinlik_id=etkinlik;
 r:=public.viva_daily_katilim_baglam(sahip,etkinlik,NULL,NULL);
 PERFORM pg_temp.viva_katilim_kontrol('17 — Değişen tarihte eski oda güncel sayılmaz',(r#>>'{oda,guncel}')::boolean IS FALSE AND (r->>'surum')::integer=3);
 IF uye IS NOT NULL THEN
  r:=public.viva_daily_katilim_baglam(uye,etkinlik,NULL,NULL);
  PERFORM pg_temp.viva_katilim_kontrol('18 — Firma üyesi sunucu değil katılımcı rolü alır',r->>'rol'='katilimci' AND r->>'kimlik'='uye:'||uye::text);
  DELETE FROM public.viva_katilimcilar WHERE etkinlik_id=etkinlik AND kullanici_id=uye;
  red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(uye,etkinlik,NULL,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
  PERFORM pg_temp.viva_katilim_kontrol('19 — Çıkarılmış firma üyesi yeni katılım alamaz',red);
 ELSE
  INSERT INTO pg_temp.viva_katilim_test_sonuclari(test,sonuc,detay) VALUES('18–19 — Firma üyesi senaryoları','ATLANDI','Kapsamı uygun ikinci iç kullanıcı bulunamadı.');
 END IF;
 UPDATE public.viva_etkinlikler SET durum='iptal',surum=surum+1 WHERE etkinlik_id=etkinlik;
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(sahip,etkinlik,NULL,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 BEGIN PERFORM public.viva_daily_katilim_baglam(NULL,NULL,yeni_h,yeni_oh);red:=false;EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM pg_temp.viva_katilim_kontrol('20 — İptal etkinliğe sahip ve misafir katılamaz',red);
 UPDATE public.viva_etkinlikler SET durum='planlandi',baslangic=now()-interval '2 hours',bitis=now()-interval '1 hour' WHERE etkinlik_id=etkinlik;
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(sahip,etkinlik,NULL,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_katilim_kontrol('21 — Bitişi geçmiş etkinliğe katılım reddedilir',red);
 SELECT s.kullanici_id,k.kisi_id,k.auth_user_id INTO ec_sahip,ec_kisi,ec_auth
 FROM public.kullanicilar s JOIN public.eclub_kisiler k ON k.auth_user_id IS NOT NULL
 WHERE k.auth_user_id<>s.kullanici_id AND public.viva_eclub_kapsam(s.kullanici_id,k.kisi_id) ORDER BY s.kullanici_id,k.kisi_id LIMIT 1;
 IF ec_sahip IS NOT NULL THEN
  PERFORM public.viva_islem(ec_sahip,'olustur',jsonb_build_object('etkinlik_id',ec_etkinlik,'baslik','[VIVA 2.2 ECLUB TEST — ROLLBACK]',
   'aciklama','','baslangic',now()+interval '1 hour','bitis',now()+interval '2 hours','durum','planlandi',
   'katilimcilar',jsonb_build_array(jsonb_build_object('id',ec_kisi,'tur','eclub'))));
  r:=public.viva_daily_katilim_baglam(ec_auth,ec_etkinlik,NULL,NULL);
  PERFORM pg_temp.viva_katilim_kontrol('22 — EClub üyesi katılımcıdır, sunucu değildir',r->>'rol'='katilimci' AND r->>'kimlik'='uye:'||ec_auth::text);
  DELETE FROM public.viva_katilimcilar WHERE etkinlik_id=ec_etkinlik AND kisi_id=ec_kisi;
  red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(ec_auth,ec_etkinlik,NULL,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
  PERFORM pg_temp.viva_katilim_kontrol('23 — Çıkarılmış EClub üyesi yeni katılım alamaz',red);
 ELSE
  INSERT INTO pg_temp.viva_katilim_test_sonuclari(test,sonuc,detay) VALUES('22–23 — EClub senaryoları','ATLANDI','Kapsamı uygun düzenleyen ve auth bağlantılı EClub üyesi bulunamadı.');
 END IF;
 PERFORM pg_temp.viva_katilim_kontrol('24 — Katılım RPCsi yalnız sunucuya açıktır',
  NOT has_function_privilege('anon','public.viva_daily_katilim_baglam(uuid,uuid,text,text)','EXECUTE')
  AND NOT has_function_privilege('authenticated','public.viva_daily_katilim_baglam(uuid,uuid,text,text)','EXECUTE')
  AND has_function_privilege('service_role','public.viva_daily_katilim_baglam(uuid,uuid,text,text)','EXECUTE'));
 INSERT INTO pg_temp.viva_katilim_test_sonuclari(test,sonuc,detay) VALUES('Kapsam','BİLGİ','Yetki RPCsi ve sıralı SQL kuralları. Daily token/medya, gerçek e-posta/cookie akışı ve iki bağlantılı yarış sınanmaz. Test kayıtları ROLLBACK ile geri alınır.');
EXCEPTION WHEN OTHERS THEN
 INSERT INTO pg_temp.viva_katilim_test_sonuclari(test,sonuc,detay) VALUES('SQL test akışı tamamlanamadı','BAŞARISIZ','SQLSTATE='||SQLSTATE||'; '||SQLERRM);
END;
$test$;
SELECT * FROM pg_temp.viva_katilim_test_sonuclari ORDER BY sira;
ROLLBACK;
