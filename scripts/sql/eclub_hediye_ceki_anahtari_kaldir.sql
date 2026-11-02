-- 7. ve son adım: kullanılmayan firma hediye çeki izin sütununu kaldırır.
-- Proje sahibi Supabase SQL Editor'da çalıştırır.
-- Önkoşul: eclub_hediye_ceki_anahtari_sql_temizligi.sql başarılı çalışmış olmalı.
-- Üreticinin yayın düzeyindeki kararı, puan/talep/onay/teslimat kayıtları korunur.
-- Bağımlı nesneler silinmez. Beklenmeyen bir bağımlılıkta transaction geri alınır.

BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eclub-hediye-ceki-eski-izin-sql-v1', 1));
LOCK TABLE public.firmalar IN ACCESS EXCLUSIVE MODE;

DO $onkontrol$
DECLARE
  r record;
  v_oid regprocedure;
  v_imza text;
  v_attnum smallint;
  v_tip oid;
  v_kalan text;
BEGIN
  -- Beşinci adımın doğrulanmış temiz fonksiyonları yerinde olmalıdır.
  FOR r IN
    SELECT * FROM (VALUES
      ('public.eclub_odul_siparis_oku(uuid,uuid,uuid)', 'e4da1ae158ed766466c82146e4271f09'),
      ('public.eclub_siparis_bm_onayla(uuid,uuid)', 'eddae163549c3d15ca222529ffb45d71'),
      ('public.eclub_siparis_utt_onayla(uuid,uuid)', '77ccdd8320c2843fda228b5fe3877e46')
    ) AS f(imza, beklenen_md5)
  LOOP
    v_oid := to_regprocedure(r.imza);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'Temizlenen fonksiyon bulunamadı: %. Sütun kaldırılmadı.', r.imza;
    END IF;
    IF md5(pg_get_functiondef(v_oid)) <> r.beklenen_md5 THEN
      RAISE EXCEPTION 'Fonksiyon temizleme sonrasındaki tanımdan farklı: %. Sütun kaldırılmadı.', r.imza;
    END IF;
  END LOOP;

  -- PL/pgSQL gövde başvuruları katalog bağımlılığında görünmeyebilir.
  SELECT string_agg(format('%I.%I(%s)', n.nspname, p.proname,
    pg_get_function_identity_arguments(p.oid)), ', ' ORDER BY p.oid)
  INTO v_kalan
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname !~ '^pg_'
    AND CASE WHEN p.prokind IN ('f', 'p', 'w') THEN pg_get_functiondef(p.oid) ELSE '' END
      ~* '\meclub_store_aktif\M';
  IF v_kalan IS NOT NULL THEN
    RAISE EXCEPTION 'Eski sütuna başvuran fonksiyonlar var: %. Sütun kaldırılmadı.', v_kalan;
  END IF;

  -- Kapalı fiziksel mağaza yeniden kurulmaz veya açılmaz.
  FOREACH v_imza IN ARRAY ARRAY[
    'public.eclub_store_siparis_olustur(uuid,uuid,uuid,integer)',
    'public.eclub_store_siparis_iptal(uuid,uuid,boolean,text)',
    'public.eclub_store_teslim_aldim(uuid,uuid)',
    'public.get_eclub_utt_siparisler(uuid,uuid,uuid,text,timestamptz,timestamptz,integer,integer)',
    'public.get_eclub_store_firma_bakiye(uuid)',
    'public.eclub_store_siparis_donemi_acik_mi(timestamptz)'
  ] LOOP
    IF to_regprocedure(v_imza) IS NOT NULL THEN
      RAISE EXCEPTION 'Fiziksel mağaza durumu ön kontrolden farklı: %. Sütun kaldırılmadı.', v_imza;
    END IF;
  END LOOP;

  SELECT attnum, atttypid INTO v_attnum, v_tip FROM pg_attribute
  WHERE attrelid = 'public.firmalar'::regclass
    AND attname = 'eclub_store_aktif' AND attnum > 0 AND NOT attisdropped;
  IF v_attnum IS NOT NULL THEN
    IF v_tip <> 'boolean'::regtype THEN
      RAISE EXCEPTION 'Eski izin sütununun tipi beklenenden farklı. Sütun kaldırılmadı.';
    END IF;
    -- Yalnız sütunun kendi varsayılanı ve NOT NULL niteliği kaldırılır.
    -- Görünüm, politika, tetikleyici, kısıt, indeks vb. yeni bağımlılıkta durulur.
    SELECT string_agg(pg_describe_object(d.classid, d.objid, d.objsubid), ', ' ORDER BY d.classid, d.objid)
    INTO v_kalan
    FROM pg_depend d
    WHERE d.refclassid = 'pg_class'::regclass
      AND d.refobjid = 'public.firmalar'::regclass AND d.refobjsubid = v_attnum
      AND NOT (
        (d.classid = 'pg_attrdef'::regclass AND EXISTS (
          SELECT 1 FROM pg_attrdef a WHERE a.oid = d.objid
            AND a.adrelid = 'public.firmalar'::regclass AND a.adnum = v_attnum
        )) OR
        (d.classid = 'pg_constraint'::regclass AND EXISTS (
          SELECT 1 FROM pg_constraint k WHERE k.oid = d.objid
            AND k.conrelid = 'public.firmalar'::regclass
            AND k.contype = 'n' AND k.conkey = ARRAY[v_attnum]
        ))
      );
    IF v_kalan IS NOT NULL THEN
      RAISE EXCEPTION 'Eski sütunun beklenmeyen bağımlılıkları var: %. Sütun kaldırılmadı.', v_kalan;
    END IF;
  END IF;
END
$onkontrol$;

ALTER TABLE public.firmalar DROP COLUMN IF EXISTS eclub_store_aktif RESTRICT;
NOTIFY pgrst, 'reload schema';

SELECT NOT EXISTS (
  SELECT 1 FROM pg_attribute
  WHERE attrelid = 'public.firmalar'::regclass AND attname = 'eclub_store_aktif'
    AND attnum > 0 AND NOT attisdropped
) AS eclub_hediye_ceki_anahtari_kaldirildi;
COMMIT;
