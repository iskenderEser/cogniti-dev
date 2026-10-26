-- Viva 2.1 iş kuralı testi. KULLANICI ÇALIŞTIRACAK; ajan çalıştırmaz.
-- Önce viva_asama2_1.sql kurulmalı. Dosyanın tamamını çalıştırın; ROLLBACK'i koruyun.
-- Daily API çağrısı yapmaz; gerçek kullanıcı/eczane/üyelik kayıtlarını değiştirmez.
-- Aktif kullanıcı kimliği yalnız okunur. Sadece yeni test etkinliği/oda kaydı yazılır,
-- hepsi son ROLLBACK ile geri alınır. Sağlayıcı oda kimliği sentetik test değeridir.
BEGIN;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
CREATE TEMP TABLE viva_oda_test_sonuclari(sira integer GENERATED ALWAYS AS IDENTITY,test text,sonuc text,detay text) ON COMMIT DROP;
CREATE FUNCTION pg_temp.viva_oda_kontrol(p_test text,p_ok boolean,p_detay text DEFAULT NULL) RETURNS void LANGUAGE sql AS $$
 INSERT INTO pg_temp.viva_oda_test_sonuclari(test,sonuc,detay)
 VALUES(p_test,CASE WHEN p_ok IS TRUE THEN 'BAŞARILI' ELSE 'BAŞARISIZ' END,p_detay);
$$;
DO $test$
DECLARE sahip uuid; yabanci uuid:=gen_random_uuid(); etkinlik uuid:=gen_random_uuid();
 r jsonb; q jsonb; govde jsonb; kira uuid; eski_kira uuid; ad text; red boolean;
BEGIN
 SELECT kullanici_id INTO sahip FROM public.kullanicilar WHERE public.viva_duzenleyen_aktif(kullanici_id) ORDER BY kullanici_id LIMIT 1;
 IF sahip IS NULL THEN
  INSERT INTO pg_temp.viva_oda_test_sonuclari(test,sonuc,detay) VALUES('Önkoşul','ATLANDI','Aktif düzenleyen bulunamadı; mevcut kayıtlara müdahale edilmedi.');RETURN;
 END IF;
 govde:=jsonb_build_object('etkinlik_id',etkinlik,'baslik','[VIVA 2.1 SQL TEST — ROLLBACK]',
  'aciklama','Kalıcı olmayan oda iş kuralı testi.','baslangic',now()+interval '1 hour',
  'bitis',now()+interval '2 hours','durum','taslak','katilimcilar','[]'::jsonb);
 PERFORM public.viva_islem(sahip,'olustur',govde);
 PERFORM pg_temp.viva_oda_kontrol('01 — Yeni etkinlikte oda henüz yok',public.viva_daily_oda_islem(sahip,etkinlik,'durum')->'oda'='null'::jsonb);
 red:=false;BEGIN PERFORM public.viva_daily_oda_islem(yabanci,etkinlik,'durum');EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_oda_kontrol('02 — Başkasının oda eşleştirmesi okunamaz',red);
 red:=false;BEGIN PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');EXCEPTION WHEN invalid_parameter_value THEN red:=true;END;
 PERFORM pg_temp.viva_oda_kontrol('03 — Taslak için oda işi ayrılamaz',red);
 govde:=govde||jsonb_build_object('durum','planlandi','surum',1);
 PERFORM public.viva_islem(sahip,'kaydet',govde);
 red:=false;BEGIN PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"evil.test"}');EXCEPTION WHEN invalid_parameter_value THEN red:=true;END;
 PERFORM pg_temp.viva_oda_kontrol('04 — Daily dışı domain reddedilir',red);
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');
 kira:=(r#>>'{istek,kira_anahtari}')::uuid;ad:=r#>>'{istek,oda_adi}';
 PERFORM pg_temp.viva_oda_kontrol('05 — Tek oda kimliği ve iş kirası üretilir',kira IS NOT NULL AND ad='viva-'||replace(etkinlik::text,'-','')||'-n1' AND (r->>'bekle')::boolean IS FALSE);
 q:=public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');
 PERFORM pg_temp.viva_oda_kontrol('06 — İş sürerken ikinci çağrı bekler ve gizli kira dönmez',(q->>'bekle')::boolean IS TRUE AND NOT(q?'istek') AND (SELECT count(*)=1 FROM public.viva_daily_odalar WHERE etkinlik_id=etkinlik));
 red:=false;BEGIN PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'tamamla',jsonb_build_object('kira_anahtari',gen_random_uuid(),'oda_id','sentetik'));EXCEPTION WHEN serialization_failure THEN red:=true;END;
 PERFORM pg_temp.viva_oda_kontrol('07 — Yanlış kira ile iş tamamlanamaz',red);
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'tamamla',jsonb_build_object('kira_anahtari',kira,'oda_id','sql-test-oda'));
 PERFORM pg_temp.viva_oda_kontrol('08 — Doğru kira mevcut sürümü hazır yapar',r#>>'{oda,durum}'='hazir' AND (r#>>'{oda,guncel}')::boolean IS TRUE AND (r#>>'{oda,islem_suruyor}')::boolean IS FALSE AND NOT(r?'istek'));
 govde:=govde||jsonb_build_object('surum',2,'bitis',now()+interval '3 hours');
 PERFORM public.viva_islem(sahip,'kaydet',govde);
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'durum');
 PERFORM pg_temp.viva_oda_kontrol('09 — Tarih/sürüm değişince eski eşleşme güncel sayılmaz',(r#>>'{oda,guncel}')::boolean IS FALSE);
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');
 kira:=(r#>>'{istek,kira_anahtari}')::uuid;
 PERFORM pg_temp.viva_oda_kontrol('10 — Yeniden deneme aynı oda adıyla yeni tarih hedefler',r#>>'{istek,oda_adi}'=ad AND (r#>>'{istek,bitis}')::timestamptz=now()+interval '3 hours');
 govde:=govde||jsonb_build_object('surum',3,'baslik','[VIVA 2.1 DEĞİŞEN TEST]');
 PERFORM public.viva_islem(sahip,'kaydet',govde);
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'tamamla',jsonb_build_object('kira_anahtari',kira,'oda_id','sql-test-oda'));
 PERFORM pg_temp.viva_oda_kontrol('11 — İş sırasında etkinlik değişirse eski sonuç 409 olur',(r->>'status')::integer=409 AND (SELECT kira_anahtari IS NULL AND durum='hata' FROM public.viva_daily_odalar WHERE etkinlik_id=etkinlik));
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');
 eski_kira:=(r#>>'{istek,kira_anahtari}')::uuid;
 UPDATE public.viva_daily_odalar SET kira_bitis=now()-interval '1 second' WHERE etkinlik_id=etkinlik;
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');
 kira:=(r#>>'{istek,kira_anahtari}')::uuid;
 PERFORM pg_temp.viva_oda_kontrol('12 — Süresi dolmuş iş yeni kirayla aynı odada kurtarılır',kira<>eski_kira AND r#>>'{istek,oda_adi}'=ad);
 red:=false;BEGIN PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'hata',jsonb_build_object('kira_anahtari',eski_kira,'hata_kodu','AG_HATASI'));EXCEPTION WHEN serialization_failure THEN red:=true;END;
 PERFORM pg_temp.viva_oda_kontrol('13 — Eski iş yeni işin durumunu ezemez',red);
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'hata',jsonb_build_object('kira_anahtari',kira,'hata_kodu','AG_HATASI'));
 PERFORM pg_temp.viva_oda_kontrol('14 — Sağlayıcı hatası kira bırakılarak kaydedilir',r#>>'{oda,durum}'='hata' AND r#>>'{oda,hata_kodu}'='AG_HATASI' AND (r#>>'{oda,islem_suruyor}')::boolean IS FALSE);
 red:=false;BEGIN PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"other.daily.co"}');EXCEPTION WHEN invalid_parameter_value THEN red:=true;END;
 PERFORM pg_temp.viva_oda_kontrol('15 — Mevcut eşleşme başka Daily alanına taşınamaz',red);
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');
 kira:=(r#>>'{istek,kira_anahtari}')::uuid;
 PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'tamamla',jsonb_build_object('kira_anahtari',kira,'oda_id','sql-test-oda'));
 UPDATE public.viva_daily_odalar SET durum='kapali' WHERE etkinlik_id=etkinlik;
 red:=false;BEGIN PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');EXCEPTION WHEN invalid_parameter_value THEN red:=true;END;
 PERFORM pg_temp.viva_oda_kontrol('16 — Kapalı oda aynı kimlikle tekrar açılamaz',red);
 UPDATE public.viva_daily_odalar SET durum='hazir' WHERE etkinlik_id=etkinlik;
 PERFORM public.viva_islem(sahip,'iptal',jsonb_build_object('etkinlik_id',etkinlik,'surum',4));
 red:=false;BEGIN PERFORM public.viva_daily_oda_islem(sahip,etkinlik,'ayir','{"domain":"cogniti-viva.daily.co"}');EXCEPTION WHEN invalid_parameter_value THEN red:=true;END;
 r:=public.viva_daily_oda_islem(sahip,etkinlik,'durum');
 PERFORM pg_temp.viva_oda_kontrol('17 — İptal edilmiş etkinlikte yeni oda işi kapalıdır',red AND (r#>>'{oda,kapanmis}')::boolean IS TRUE AND (r#>>'{oda,guncel}')::boolean IS FALSE);
 PERFORM pg_temp.viva_oda_kontrol('18 — Anon/authenticated tabloya veya RPCye doğrudan erişemez',
  NOT has_table_privilege('anon','public.viva_daily_odalar','SELECT') AND NOT has_table_privilege('authenticated','public.viva_daily_odalar','INSERT')
  AND NOT has_function_privilege('authenticated','public.viva_daily_oda_islem(uuid,uuid,text,jsonb)','EXECUTE')
  AND has_function_privilege('service_role','public.viva_daily_oda_islem(uuid,uuid,text,jsonb)','EXECUTE'));
 INSERT INTO pg_temp.viva_oda_test_sonuclari(test,sonuc,detay) VALUES('Kapsam','BİLGİ','Sıralı iş kuralı testi; Daily API, iki bağlantılı yarış ve gerçek görüşme sınanmaz. Test kayıtları ROLLBACK ile geri alınır.');
EXCEPTION WHEN OTHERS THEN
 INSERT INTO pg_temp.viva_oda_test_sonuclari(test,sonuc,detay) VALUES('SQL test akışı tamamlanamadı','BAŞARISIZ','SQLSTATE='||SQLSTATE||'; '||SQLERRM);
END;
$test$;
SELECT * FROM pg_temp.viva_oda_test_sonuclari ORDER BY sira;
ROLLBACK;
