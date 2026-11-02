-- ADIM 1 / YALNIZ OKUMA
-- public.firmalar.eclub_store_aktif kaldırılmadan önce canlı durum envanteri.
-- Tek SELECT çalışır; kayıt, ayar, fonksiyon veya şema değiştirilmez.
-- Proje sahibi Supabase SQL Editor'da çalıştırır. Sonucu JSON olarak dışa
-- aktararak saklayın: firma değerleri ile ilgili nesnelerin tanımları içerilir.
-- Bu çıktı tam veritabanı yedeği veya silme onayı değildir.
-- pg_depend tek başına PL/pgSQL gövdelerini kapsamaz; metin taraması da yapılır.
-- Metin taraması, parçalardan dinamik kurulan kolon adlarını garanti edemez.

WITH RECURSIVE
hedef AS (
  SELECT c.oid AS tablo_oid, a.attnum, a.atttypid, a.atttypmod,
    a.attnotnull, a.attacl, a.attgenerated, a.attidentity,
    pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) AS varsayilan,
    pg_catalog.col_description(c.oid, a.attnum) AS aciklama
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
  LEFT JOIN pg_catalog.pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
  WHERE n.nspname = 'public' AND c.relname = 'firmalar'
    AND a.attname = 'eclub_store_aktif' AND a.attnum > 0 AND NOT a.attisdropped
),
dogrudan AS (
  SELECT d.*
  FROM pg_catalog.pg_depend d
  JOIN hedef h ON d.refclassid = 'pg_catalog.pg_class'::regclass
    AND d.refobjid = h.tablo_oid AND d.refobjsubid = h.attnum
),
fonksiyonlar AS MATERIALIZED (
  SELECT p.oid, n.nspname, p.proname,
    format('%I.%I(%s)', n.nspname, p.proname,
      pg_catalog.pg_get_function_identity_arguments(p.oid)) AS ad,
    pg_catalog.pg_get_functiondef(p.oid) AS tanim,
    jsonb_build_object('sahip', pg_catalog.pg_get_userbyid(p.proowner),
      'yetkiler', p.proacl, 'security_definer', p.prosecdef,
      'ayarlar', p.proconfig, 'aciklama', pg_catalog.obj_description(p.oid, 'pg_proc')) AS ozellikler
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p', 'w')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname !~ '^pg_toast'
),
bagimlilik_agaci(classid, objid, objsubid) AS (
  (
    SELECT 'pg_catalog.pg_class'::regclass::oid, tablo_oid, attnum::integer FROM hedef
    UNION
    SELECT 'pg_catalog.pg_proc'::regclass::oid, f.oid, 0 FROM fonksiyonlar f
    WHERE f.tanim ~* '\meclub_store_aktif\M'
  )
  UNION
  SELECT
    CASE WHEN d.classid = 'pg_catalog.pg_rewrite'::regclass
      THEN 'pg_catalog.pg_class'::regclass::oid ELSE d.classid END,
    CASE WHEN d.classid = 'pg_catalog.pg_rewrite'::regclass
      THEN r.ev_class ELSE d.objid END,
    CASE WHEN d.classid = 'pg_catalog.pg_rewrite'::regclass
      THEN 0 ELSE d.objsubid END
  FROM bagimlilik_agaci b
  JOIN pg_catalog.pg_depend d ON d.refclassid = b.classid AND d.refobjid = b.objid
    AND (b.objsubid = 0 OR d.refobjsubid = b.objsubid)
  LEFT JOIN pg_catalog.pg_rewrite r
    ON d.classid = 'pg_catalog.pg_rewrite'::regclass AND r.oid = d.objid
  WHERE d.deptype <> 'e'
),
ilgili_fonksiyonlar AS (
  SELECT f.* FROM fonksiyonlar f
  WHERE f.tanim ~* '\meclub_store_aktif\M'
    OR EXISTS (SELECT 1 FROM bagimlilik_agaci b
      WHERE b.classid = 'pg_catalog.pg_proc'::regclass AND b.objid = f.oid)
),
nesneler AS MATERIALIZED (
  SELECT 'pg_catalog.pg_proc'::regclass::oid AS classid, f.oid AS objid,
    'FONKSIYON'::text AS tur, f.ad, f.tanim, f.ozellikler
  FROM ilgili_fonksiyonlar f

  UNION ALL
  SELECT 'pg_catalog.pg_class'::regclass::oid, c.oid,
    CASE WHEN c.relkind = 'm' THEN 'MATERIALIZED_VIEW' ELSE 'VIEW' END,
    format('%I.%I', n.nspname, c.relname), pg_catalog.pg_get_viewdef(c.oid, true),
    jsonb_build_object('sahip', pg_catalog.pg_get_userbyid(c.relowner),
      'yetkiler', c.relacl, 'ayarlar', c.reloptions)
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('v', 'm') AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname !~ '^pg_toast'

  UNION ALL
  SELECT 'pg_catalog.pg_policy'::regclass::oid, p.oid, 'RLS_POLITIKASI',
    format('%I.%I / %I', n.nspname, c.relname, p.polname),
    concat('USING: ', pg_catalog.pg_get_expr(p.polqual, p.polrelid),
      ' | WITH CHECK: ', pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid)),
    jsonb_build_object('tablo', format('%I.%I', n.nspname, c.relname),
      'komut', p.polcmd, 'permissive', p.polpermissive,
      'roller', (SELECT jsonb_agg(CASE WHEN x.rol = 0 THEN 'public'
        ELSE pg_catalog.pg_get_userbyid(x.rol)::text END ORDER BY x.rol)
        FROM unnest(p.polroles) AS x(rol)),
      'rls_acik', c.relrowsecurity, 'rls_zorunlu', c.relforcerowsecurity)
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname !~ '^pg_toast'

  UNION ALL
  SELECT 'pg_catalog.pg_trigger'::regclass::oid, t.oid, 'TETIKLEYICI',
    format('%I.%I / %I', n.nspname, c.relname, t.tgname),
    pg_catalog.pg_get_triggerdef(t.oid, true),
    jsonb_build_object('etkinlik_kodu', t.tgenabled,
      'fonksiyon', t.tgfoid::regprocedure::text,
      'fonksiyon_anahtara_basvuruyor', EXISTS (
        SELECT 1 FROM ilgili_fonksiyonlar f WHERE f.oid = t.tgfoid))
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname !~ '^pg_toast'

  UNION ALL
  SELECT 'pg_catalog.pg_rewrite'::regclass::oid, r.oid, 'KURAL',
    format('%I.%I / %I', n.nspname, c.relname, r.rulename),
    pg_catalog.pg_get_ruledef(r.oid, true), jsonb_build_object('etkinlik_kodu', r.ev_enabled)
  FROM pg_catalog.pg_rewrite r
  JOIN pg_catalog.pg_class c ON c.oid = r.ev_class
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE r.rulename <> '_RETURN' AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname !~ '^pg_toast'

  UNION ALL
  SELECT 'pg_catalog.pg_constraint'::regclass::oid, k.oid, 'KISIT',
    format('%I.%I / %I', n.nspname, c.relname, k.conname),
    pg_catalog.pg_get_constraintdef(k.oid, true),
    jsonb_build_object('dogrulanmis', k.convalidated, 'tur', k.contype)
  FROM pg_catalog.pg_constraint k
  JOIN pg_catalog.pg_class c ON c.oid = k.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname !~ '^pg_toast'

  UNION ALL
  SELECT 'pg_catalog.pg_class'::regclass::oid, c.oid, 'INDEKS',
    format('%I.%I', n.nspname, c.relname), pg_catalog.pg_get_indexdef(c.oid),
    jsonb_build_object('gecerli', i.indisvalid, 'benzersiz', i.indisunique)
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_index i ON i.indexrelid = c.oid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname !~ '^pg_toast'

  UNION ALL
  SELECT 'pg_catalog.pg_attrdef'::regclass::oid, d.oid, 'KOLON_IFADESI',
    format('%I.%I.%I', n.nspname, c.relname, a.attname),
    pg_catalog.pg_get_expr(d.adbin, d.adrelid),
    jsonb_build_object('generated', a.attgenerated, 'identity', a.attidentity)
  FROM pg_catalog.pg_attrdef d
  JOIN pg_catalog.pg_class c ON c.oid = d.adrelid
  JOIN pg_catalog.pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname !~ '^pg_toast'
),
ilgili_nesneler AS (
  SELECT n.*,
    n.tanim ~* '\meclub_store_aktif\M' AS metinde_basvuru,
    EXISTS (SELECT 1 FROM bagimlilik_agaci b
      WHERE b.classid = n.classid AND b.objid = n.objid) AS bagimlilik_agacinda
  FROM nesneler n
  WHERE n.tanim ~* '\meclub_store_aktif\M'
    OR EXISTS (SELECT 1 FROM bagimlilik_agaci b
      WHERE b.classid = n.classid AND b.objid = n.objid)
    OR (n.tur = 'TETIKLEYICI' AND n.ozellikler->>'fonksiyon_anahtara_basvuruyor' = 'true')
),
eski_magaza_imzalari(imza) AS (
  VALUES
    ('public.eclub_store_siparis_olustur(uuid,uuid,uuid,integer)'),
    ('public.eclub_store_siparis_iptal(uuid,uuid,boolean,text)'),
    ('public.eclub_store_teslim_aldim(uuid,uuid)'),
    ('public.get_eclub_utt_siparisler(uuid,uuid,uuid,text,timestamp with time zone,timestamp with time zone,integer,integer)'),
    ('public.get_eclub_store_firma_bakiye(uuid)'),
    ('public.eclub_store_siparis_donemi_acik_mi(timestamp with time zone)')
),
rapor AS (
  SELECT 0 AS sira, 'KONTROL'::text AS bolum,
    'public.firmalar.eclub_store_aktif'::text AS nesne,
    jsonb_build_object('rapor_zamani', statement_timestamp(),
      'veritabani', current_database(), 'postgres_surumu', current_setting('server_version'),
      'kolon_bulundu', EXISTS (SELECT 1 FROM hedef),
      'kolon_tanimi', (SELECT jsonb_build_object(
        'tip', pg_catalog.format_type(h.atttypid, h.atttypmod),
        'not_null', h.attnotnull, 'varsayilan', h.varsayilan,
        'yetkiler', h.attacl, 'aciklama', h.aciklama,
        'generated', h.attgenerated, 'identity', h.attidentity) FROM hedef h),
      'firma_sayisi', (SELECT count(*) FROM public.firmalar),
      'dogrudan_bagimlilik_sayisi', (SELECT count(*) FROM dogrudan),
      'ilgili_nesne_sayisi', (SELECT count(*) FROM ilgili_nesneler),
      'sinir', 'Katalog ve tanım metni taraması; dinamik üretilen kolon adları ayrıca incelenir. Canlı iş akışı testi yapılmaz.') AS detay

  UNION ALL
  SELECT 1, 'FIRMA_DEGERI', f.firma_id::text,
    jsonb_build_object('firma_id', f.firma_id, 'firma_adi', f.firma_adi,
      'firma_aktif', f.aktif, 'eclub_aktif', f.eclub_aktif,
      'kolon_kayitta_var', to_jsonb(f) ? 'eclub_store_aktif',
      'eclub_store_aktif', to_jsonb(f)->'eclub_store_aktif')
  FROM public.firmalar f

  UNION ALL
  SELECT 2, 'DOGRUDAN_BAGIMLILIK',
    pg_catalog.pg_describe_object(d.classid, d.objid, d.objsubid),
    jsonb_build_object('katalog', d.classid::regclass::text,
      'oid', d.objid, 'alt_nesne', d.objsubid, 'bagimlilik_turu', d.deptype)
  FROM dogrudan d

  UNION ALL
  SELECT 3, 'NESNE_TANIMI', n.ad,
    jsonb_build_object('tur', n.tur, 'katalog', n.classid::regclass::text,
      'oid', n.objid, 'metinde_basvuru', n.metinde_basvuru,
      'bagimlilik_agacinda', n.bagimlilik_agacinda,
      'tanim_md5', md5(n.tanim), 'tanim', n.tanim, 'ozellikler', n.ozellikler)
  FROM ilgili_nesneler n

  UNION ALL
  SELECT 4, 'BAGIMLILIK_AGACI',
    pg_catalog.pg_describe_object(b.classid, b.objid, b.objsubid),
    jsonb_build_object('katalog', b.classid::regclass::text,
      'oid', b.objid, 'alt_nesne', b.objsubid)
  FROM bagimlilik_agaci b
  WHERE NOT EXISTS (SELECT 1 FROM hedef h WHERE b.classid = 'pg_catalog.pg_class'::regclass
      AND b.objid = h.tablo_oid AND b.objsubid = h.attnum)
    AND NOT EXISTS (SELECT 1 FROM dogrudan d
      WHERE d.classid = b.classid AND d.objid = b.objid AND d.objsubid = b.objsubid)

  UNION ALL
  SELECT 5, 'ESKI_FIZIKSEL_MAGAZA', e.imza,
    jsonb_build_object('fonksiyon_var', pg_catalog.to_regprocedure(e.imza) IS NOT NULL,
      'not', 'Bu rapor eski mağaza fonksiyonlarını oluşturmaz veya çalıştırmaz.')
  FROM eski_magaza_imzalari e
)
SELECT bolum, nesne, detay FROM rapor ORDER BY sira, nesne;
