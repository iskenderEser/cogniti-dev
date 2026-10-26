-- KULLANICI ÇALIŞTIRACAK. Yalnız yeni sentetik kayıtlar. Daily/HTTP yok. Tamamı ROLLBACK.
BEGIN;
SET LOCAL statement_timeout='30s';
CREATE TEMP TABLE viva_kayit_test(sira int GENERATED ALWAYS AS IDENTITY,test text,sonuc text) ON COMMIT DROP;
CREATE FUNCTION pg_temp.viva_kayit_kontrol(t text,b boolean) RETURNS void LANGUAGE sql AS $$
 INSERT INTO pg_temp.viva_kayit_test(test,sonuc) VALUES(t,CASE WHEN b IS TRUE THEN 'BAŞARILI' ELSE 'BAŞARISIZ' END);
$$;
DO $$
DECLARE sahip uuid;eid uuid:=gen_random_uuid();rid uuid:=gen_random_uuid();rid2 uuid:=gen_random_uuid();sid uuid:=gen_random_uuid();iid uuid:=gen_random_uuid();
 a text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);r jsonb;b jsonb;v jsonb;red boolean;oda text;k uuid;
BEGIN
 SELECT kullanici_id INTO sahip FROM public.kullanicilar WHERE public.viva_duzenleyen_aktif(kullanici_id) ORDER BY kullanici_id LIMIT 1;
 IF sahip IS NULL THEN INSERT INTO pg_temp.viva_kayit_test(test,sonuc) VALUES('Aktif düzenleyen bulunamadı','ATLANDI');RETURN;END IF;
 PERFORM public.viva_islem(sahip,'olustur',jsonb_build_object('etkinlik_id',eid,'baslik','[VIVA 2.5 TEST — ROLLBACK]','aciklama','',
  'baslangic',now()+interval '1 hour','bitis',now()+interval '2 hours','durum','planlandi','katilimcilar','[]'::jsonb));
 r:=public.viva_daily_oda_islem(sahip,eid,'ayir','{"domain":"cogniti-viva.daily.co"}');
 PERFORM public.viva_daily_oda_islem(sahip,eid,'tamamla',jsonb_build_object('kira_anahtari',r#>>'{istek,kira_anahtari}','oda_id','sentetik-kayit-oda'));
 SELECT oda_adi INTO oda FROM public.viva_daily_odalar WHERE etkinlik_id=eid;
 b:=jsonb_build_object('domain','cogniti-viva.daily.co','oda_adi',oda,'id',rid,'oturum_id',sid,'instance_id',iid,'baslangic',extract(epoch FROM now()),'sure',40,'durum','hazir');
 PERFORM public.viva_daily_kayit_islem(NULL,NULL,'esle',b);
 PERFORM public.viva_daily_kayit_islem(NULL,NULL,'esle',b||jsonb_build_object('id',rid2,'instance_id',NULL));
 PERFORM pg_temp.viva_kayit_kontrol('01 — Bir etkinlikte iki kayıt parçası korunur',(SELECT count(*)=2 FROM public.viva_daily_kayitlar WHERE etkinlik_id=eid));
 PERFORM public.viva_daily_kayit_islem(NULL,NULL,'esle',b||'{"durum":"kaydediliyor"}'::jsonb);
 PERFORM public.viva_daily_kayit_islem(NULL,NULL,'kayit_hata',b);
 PERFORM pg_temp.viva_kayit_kontrol('02 — Tekrar/geç başlama ve geç hata hazır kaydı geriye götürmez',(SELECT count(*)=2 AND bool_and(durum='hazir') FROM public.viva_daily_kayitlar WHERE etkinlik_id=eid));
 red:=false;BEGIN PERFORM public.viva_daily_kayit_islem(gen_random_uuid(),eid,'liste');EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 r:=public.viva_daily_kayit_islem(sahip,eid,'link',jsonb_build_object('id',rid));
 PERFORM pg_temp.viva_kayit_kontrol('03 — Yabancı kayıt göremez; sahibi hazır kimliğe erişir',red AND r->>'id'=rid::text AND NOT(r ? 'url'));
 UPDATE public.viva_etkinlikler SET durum='sona_erdi',surum=surum+1 WHERE etkinlik_id=eid;
 PERFORM public.viva_daily_kayit_islem(NULL,NULL,'esle',b);
 PERFORM pg_temp.viva_kayit_kontrol('04 — Geç hazır olayı bitmiş etkinliği yeniden açmaz',(SELECT durum='sona_erdi' FROM public.viva_etkinlikler WHERE etkinlik_id=eid));
 r:=public.viva_daily_kayit_islem(NULL,NULL,'oda',b||'{"domain":"diger.daily.co"}'::jsonb);
 PERFORM pg_temp.viva_kayit_kontrol('05 — Yabancı domain/oda eşleşmez',r IS NULL);
 v:=jsonb_build_object('anahtar',a,'domain','cogniti-viva.daily.co','tur','recording.started','veri',jsonb_build_object('recording_id',rid,'user_name','saklanmaz','share_token','saklanmaz'));
 PERFORM public.viva_daily_kayit_islem(NULL,NULL,'olay_al',v);PERFORM public.viva_daily_kayit_islem(NULL,NULL,'olay_al',v);
 r:=public.viva_daily_kayit_islem(NULL,NULL,'olay_ayir',jsonb_build_object('anahtar',a));
 k:=(r->>'kira')::uuid;
 red:=false;BEGIN PERFORM public.viva_daily_kayit_islem(NULL,NULL,'olay_tamam',jsonb_build_object('anahtar',a,'kira',gen_random_uuid()));EXCEPTION WHEN serialization_failure THEN red:=true;END;
 PERFORM public.viva_daily_kayit_islem(NULL,NULL,'olay_tamam',jsonb_build_object('anahtar',a,'kira',k));
 PERFORM pg_temp.viva_kayit_kontrol('06 — Olay tekildir, kişisel alanlar atılır, yanlış kira reddedilir',red AND (SELECT count(*)=1 AND bool_and(durum='tamam' AND NOT(veri ? 'user_name') AND NOT(veri ? 'share_token')) FROM public.viva_daily_olaylar WHERE anahtar=a));
 PERFORM pg_temp.viva_kayit_kontrol('07 — Kayıt/olay tabloları ve RPC istemciye kapalıdır',
  NOT has_table_privilege('authenticated','public.viva_daily_kayitlar','SELECT') AND NOT has_table_privilege('anon','public.viva_daily_olaylar','INSERT')
  AND NOT has_function_privilege('authenticated','public.viva_daily_kayit_islem(uuid,uuid,text,jsonb)','EXECUTE'));
END $$;
SELECT * FROM pg_temp.viva_kayit_test ORDER BY sira;
ROLLBACK;
