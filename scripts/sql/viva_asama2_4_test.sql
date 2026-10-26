-- KULLANICI ÇALIŞTIRACAK. Yeni sentetik Viva kayıtları; mevcut kullanıcılar yalnız okunur.
-- Daily/e-posta çağrısı yoktur. Dosyanın tamamını çalıştırın; test kayıtları ROLLBACK.
BEGIN;
SET LOCAL statement_timeout='30s';
CREATE TEMP TABLE viva_yasam_test(sira int GENERATED ALWAYS AS IDENTITY,test text,sonuc text) ON COMMIT DROP;
CREATE FUNCTION pg_temp.viva_yasam_kontrol(t text,b boolean) RETURNS void LANGUAGE sql AS $$
 INSERT INTO pg_temp.viva_yasam_test(test,sonuc) VALUES(t,CASE WHEN b IS TRUE THEN 'BAŞARILI' ELSE 'BAŞARISIZ' END);
$$;
DO $$
DECLARE sahip uuid; eid uuid:=gen_random_uuid(); yabanci uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid();
 h text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text); oh text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);
 did uuid:=gen_random_uuid(); kira uuid; r jsonb; q jsonb; red boolean; s integer;
BEGIN
 SELECT kullanici_id INTO sahip FROM public.kullanicilar WHERE public.viva_duzenleyen_aktif(kullanici_id) ORDER BY kullanici_id LIMIT 1;
 IF sahip IS NULL THEN INSERT INTO pg_temp.viva_yasam_test(test,sonuc) VALUES('Aktif düzenleyen bulunamadı','ATLANDI');RETURN;END IF;
 PERFORM public.viva_islem(sahip,'olustur',jsonb_build_object('etkinlik_id',eid,'baslik','[VIVA 2.4 TEST — ROLLBACK]','aciklama','',
  'baslangic',now()+interval '1 hour','bitis',now()+interval '2 hours','durum','planlandi','katilimcilar','[]'::jsonb));
 r:=public.viva_daily_oda_islem(sahip,eid,'ayir','{"domain":"cogniti-viva.daily.co"}');
 PERFORM public.viva_daily_oda_islem(sahip,eid,'tamamla',jsonb_build_object('kira_anahtari',r#>>'{istek,kira_anahtari}','oda_id','sentetik-oda'));
 red:=false;BEGIN PERFORM public.viva_daily_yasam_islem(yabanci,eid,'bitir','{"surum":1}');EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_yasam_kontrol('01 — Başkası görüşmeyi bitiremez',red);
 r:=public.viva_daily_yasam_islem(sahip,eid,'oku');
 red:=false;BEGIN PERFORM public.viva_daily_yasam_islem(sahip,eid,'basladi',r||jsonb_build_object('oturum_id',sid));EXCEPTION WHEN serialization_failure THEN red:=true;END;
 PERFORM pg_temp.viva_yasam_kontrol('02 — Başlangıç saatinden önce canlıya geçilemez',red);
 UPDATE public.viva_etkinlikler SET baslangic=now()-interval '1 minute',surum=surum+1 WHERE etkinlik_id=eid;
 UPDATE public.viva_daily_odalar SET hedef_baslangic=now()-interval '1 minute',hedef_surumu=2,eslesen_surumu=2 WHERE etkinlik_id=eid;
 r:=public.viva_daily_yasam_islem(sahip,eid,'oku');
 q:=public.viva_daily_yasam_islem(sahip,eid,'basladi',r||jsonb_build_object('oturum_id',sid));
 r:=public.viva_daily_yasam_islem(sahip,eid,'basladi',r||jsonb_build_object('oturum_id',sid));
 PERFORM pg_temp.viva_yasam_kontrol('03 — Geçerli başlangıç canlı yapar; tekrar sürüm artırmaz',q->>'durum'='canli' AND r->>'surum'=q->>'surum' AND (public.viva_daily_oda_ozet(eid)->>'guncel')::boolean);
 r:=public.viva_daily_yasam_islem(NULL,eid,'saglayici_bitti',jsonb_build_object('oturum_id',gen_random_uuid(),'nesil',1));
 PERFORM pg_temp.viva_yasam_kontrol('04 — Eski sağlayıcı oturumu yeni görüşmeyi kapatmaz',(r->>'eski')::boolean AND (SELECT durum='canli' FROM public.viva_etkinlikler WHERE etkinlik_id=eid));
 INSERT INTO public.viva_davetler(davet_id,etkinlik_id,ad,eposta,token_hash,oturum_hash,oturum_bitis)
 VALUES(did,eid,'Sentetik misafir','viva-test@example.invalid',h,oh,now()+interval '1 hour');
 PERFORM public.viva_daily_yasam_islem(NULL,eid,'erisim_kaydet',jsonb_build_object('surum',3,'nesil',1,'daily_user_id','vi_00000000000000000000000000000001','davet_hash',h,'oturum_hash',oh));
 UPDATE public.viva_davetler SET iptal=true WHERE davet_id=did;
 r:=public.viva_daily_yasam_islem(NULL,eid,'ayir');kira:=(r->>'kira')::uuid;
 PERFORM pg_temp.viva_yasam_kontrol('05 — İptal davet kalıcı çıkarma/ban işine girer',r->'user_ids'='["vi_00000000000000000000000000000001"]'::jsonb AND (r->>'kapat')::boolean IS FALSE);
 red:=false;BEGIN PERFORM public.viva_daily_yasam_islem(NULL,eid,'tamamla',jsonb_build_object('kira',gen_random_uuid()));EXCEPTION WHEN serialization_failure THEN red:=true;END;
 PERFORM public.viva_daily_yasam_islem(NULL,eid,'hata',jsonb_build_object('kira',kira));
 PERFORM pg_temp.viva_yasam_kontrol('06 — Eski iş sonucu reddedilir; hata yeniden denenebilir',red AND (SELECT j.durum='hata' AND j.kira IS NULL FROM public.viva_daily_yasam j WHERE j.etkinlik_id=eid));
 r:=public.viva_daily_yasam_islem(sahip,eid,'bitir','{"surum":3}');
 q:=public.viva_daily_yasam_islem(sahip,eid,'bitir','{"surum":3}');
 red:=false;BEGIN PERFORM public.viva_daily_katilim_baglam(sahip,eid,NULL,NULL);EXCEPTION WHEN insufficient_privilege THEN red:=true;END;
 PERFORM pg_temp.viva_yasam_kontrol('07 — Herkes için bitir kalıcıdır; tekrar ve eski katılım açamaz',red AND r->>'durum'='sona_erdi' AND r->>'surum'=q->>'surum');
 UPDATE public.viva_etkinlikler SET durum='planlandi',baslangic=now()-interval '2 hours',bitis=now()-interval '1 hour' WHERE etkinlik_id=eid;
 r:=public.viva_daily_yasam_islem(NULL,eid,'ayir');
 PERFORM pg_temp.viva_yasam_kontrol('08 — Süre sonu tarayıcı olmadan kapanış işine dönüşür',(r->>'kapat')::boolean AND (SELECT durum='sona_erdi' FROM public.viva_etkinlikler WHERE etkinlik_id=eid));
 PERFORM pg_temp.viva_yasam_kontrol('09 — Yaşam döngüsü tablo ve RPC istemciye kapalıdır',NOT has_table_privilege('anon','public.viva_daily_erisimler','SELECT')
 AND NOT has_function_privilege('authenticated','public.viva_daily_yasam_islem(uuid,uuid,text,jsonb)','EXECUTE'));
EXCEPTION WHEN OTHERS THEN
 INSERT INTO pg_temp.viva_yasam_test(test,sonuc) VALUES('SQLSTATE='||SQLSTATE||'; '||SQLERRM,'BAŞARISIZ');
END $$;
SELECT * FROM pg_temp.viva_yasam_test ORDER BY sira;
ROLLBACK;
