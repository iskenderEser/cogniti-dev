-- Adres yönetimi ve sipariş adres alanları tamamen kaldırılır.
-- Önkoşul: firmastore_adres_temizligi_hazir kurulumu yapılmış olmalıdır.
BEGIN;
DO $temizle$
DECLARE kaynak text; yeni text; v_imza text;
BEGIN
 kaynak:=pg_get_functiondef('public.store_siparis_olustur_adressiz_cekirdek(uuid,uuid,integer)'::regprocedure);
 IF strpos(kaynak,'store_adresler')>0 THEN RAISE EXCEPTION 'Yeni sipariş çekirdeğinde adres sorgusu var; işlem durduruldu.'; END IF;
 yeni:=regexp_replace(kaynak,'[[:space:]]*v_adres_kullanici uuid;','','g');
 yeni:=regexp_replace(yeni,'[[:space:]]*v_adres_snapshot jsonb;','','g');
 yeni:=regexp_replace(yeni,'v_adres_snapshot[[:space:]]*:=[[:space:]]*''\{\}''::jsonb;','','g');
 yeni:=regexp_replace(yeni,'adres_id,[[:space:]]*adres_snapshot,[[:space:]]*','','g');
 yeni:=regexp_replace(yeni,'NULL::uuid,[[:space:]]*v_adres_snapshot,[[:space:]]*','','g');
 IF strpos(yeni,'adres_id')>0 OR strpos(yeni,'adres_snapshot')>0 THEN
  RAISE EXCEPTION 'Adres alanları beklenen yapıda değil; işlem durduruldu.';
 END IF;
 EXECUTE yeni;
 IF to_regprocedure('public.get_kapsamli_siparisler(uuid,uuid,uuid,uuid,uuid,text,timestamp with time zone,timestamp with time zone,integer,integer)') IS NOT NULL THEN
  v_imza:='public.get_kapsamli_siparisler(uuid,uuid,uuid,uuid,uuid,text,timestamp with time zone,timestamp with time zone,integer,integer)';
 ELSE
  SELECT p.oid::regprocedure::text INTO v_imza FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_kapsamli_siparisler';
 END IF;
 IF v_imza IS NOT NULL THEN
  kaynak:=pg_get_functiondef(v_imza::regprocedure);
  yeni:=regexp_replace(kaynak,'''adres_snapshot'',[[:space:]]*s[.]adres_snapshot,[[:space:]]*','','g');
  IF strpos(yeni,'adres_snapshot')>0 OR strpos(yeni,'adres_id')>0 THEN RAISE EXCEPTION 'Ekip sipariş raporundaki adres alanları beklenen yapıda değil.'; END IF;
  EXECUTE yeni;
 END IF;
 -- Test takvimini geri alma işlemi eski adresli sipariş fonksiyonunu yeniden oluşturmasın.
 IF to_regclass('public.firmastore_takvim_test_yedegi') IS NOT NULL THEN
  DELETE FROM public.firmastore_takvim_test_yedegi WHERE imza='public.store_siparis_olustur_cekirdek(uuid,uuid,uuid,integer)';
 END IF;
END $temizle$;
DROP FUNCTION IF EXISTS public.store_siparis_olustur(uuid,uuid,uuid,integer);
DROP FUNCTION IF EXISTS public.store_siparis_olustur_cekirdek(uuid,uuid,uuid,integer);
ALTER TABLE public.store_siparisler DROP COLUMN IF EXISTS adres_id;
ALTER TABLE public.store_siparisler DROP COLUMN IF EXISTS adres_snapshot;
DROP TABLE IF EXISTS public.store_adresler;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regclass('public.store_adresler') IS NULL AS firmastore_adres_yonetimi_kaldirildi;
