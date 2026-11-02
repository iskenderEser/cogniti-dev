-- 5. adım: yalnız eski firma hediye çeki izninin SQL bağımlılıklarını kaldırır.
-- Supabase SQL Editor'da proje sahibi çalıştırır.
-- Kaynak: 31.10.2026 canlı ön kontrolündeki üç fonksiyonun doğrulanmış tanımları.
-- Sütun silinmez; puan, talep, onay ve teslimat kayıtları değiştirilmez.
-- Tanım değişmişse işlem bütünüyle geri alınır; güncel işleyişin üzerine yazılmaz.
-- Eski fiziksel mağazanın kaldırılmış fonksiyonları oluşturulmaz.

BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eclub-hediye-ceki-eski-izin-sql-v1', 1));

DO $temizlik$
DECLARE
  r record;
  v_imza text;
  v_oid regprocedure;
  v_tanim text;
  v_yeni_tanim text;
  v_ozellikler jsonb;
  v_son_ozellikler jsonb;
  v_kalan text;
BEGIN
  -- İlk envanterde bulunmayan fiziksel mağaza işlevleri kapalı kalmalıdır.
  FOREACH v_imza IN ARRAY ARRAY[
    'public.eclub_store_siparis_olustur(uuid,uuid,uuid,integer)',
    'public.eclub_store_siparis_iptal(uuid,uuid,boolean,text)',
    'public.eclub_store_teslim_aldim(uuid,uuid)',
    'public.get_eclub_utt_siparisler(uuid,uuid,uuid,text,timestamptz,timestamptz,integer,integer)',
    'public.get_eclub_store_firma_bakiye(uuid)',
    'public.eclub_store_siparis_donemi_acik_mi(timestamptz)'
  ] LOOP
    IF to_regprocedure(v_imza) IS NOT NULL THEN
      RAISE EXCEPTION 'Fiziksel mağaza durumu ön kontrolden farklı: %. Hiçbir değişiklik uygulanmadı.', v_imza;
    END IF;
  END LOOP;

  FOR r IN
    SELECT * FROM (VALUES
      ('public.eclub_odul_siparis_oku(uuid,uuid,uuid)', 'ad562a0d484abc76dc4376ccef07987c', 'e4da1ae158ed766466c82146e4271f09', ' AND f.eclub_store_aktif'),
      ('public.eclub_siparis_bm_onayla(uuid,uuid)', 'a32b060bc070fbb05f93999d747b1868', 'eddae163549c3d15ca222529ffb45d71', ' AND f.eclub_store_aktif = true'),
      ('public.eclub_siparis_utt_onayla(uuid,uuid)', '4743c3f393d728e758d7fc0d8e6ad419', '77ccdd8320c2843fda228b5fe3877e46', ' AND f.eclub_store_aktif = true')
    ) AS f(imza, once_md5, sonra_md5, eski_kosul)
  LOOP
    v_oid := to_regprocedure(r.imza);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'Ön kontroldeki fonksiyon bulunamadı: %. İşlem geri alındı.', r.imza;
    END IF;
    v_tanim := pg_get_functiondef(v_oid);
    IF md5(v_tanim) = r.sonra_md5 THEN
      CONTINUE; -- Aynı SQL'in yeniden çalıştırılması değişiklik yapmaz.
    END IF;
    IF md5(v_tanim) <> r.once_md5 THEN
      RAISE EXCEPTION 'Fonksiyon tanımı ön kontrolden farklı: %. Güncel tanım incelenmeden işlem yapılmaz.', r.imza;
    END IF;

    SELECT jsonb_build_object('sahip', proowner, 'yetkiler', proacl::text,
      'ayarlar', proconfig, 'security_definer', prosecdef)
    INTO v_ozellikler FROM pg_proc WHERE oid = v_oid;

    v_yeni_tanim := replace(v_tanim, r.eski_kosul, '');
    IF md5(v_yeni_tanim) <> r.sonra_md5 THEN
      RAISE EXCEPTION 'Beklenen tek koşul değişikliği doğrulanamadı: %.', r.imza;
    END IF;
    EXECUTE v_yeni_tanim; -- Mevcut fonksiyon; imza, gövdenin kalanı ve yetkiler korunur.

    SELECT jsonb_build_object('sahip', proowner, 'yetkiler', proacl::text,
      'ayarlar', proconfig, 'security_definer', prosecdef)
    INTO v_son_ozellikler FROM pg_proc WHERE oid = v_oid;
    IF md5(pg_get_functiondef(v_oid)) <> r.sonra_md5
      OR v_son_ozellikler IS DISTINCT FROM v_ozellikler THEN
      RAISE EXCEPTION 'Fonksiyon tanımı veya yetkileri beklenen durumda değil: %.', r.imza;
    END IF;
  END LOOP;

  SELECT string_agg(p.oid::regprocedure::text, ', ' ORDER BY p.oid)
  INTO v_kalan
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND CASE WHEN p.prokind IN ('f', 'p') THEN pg_get_functiondef(p.oid) ELSE '' END
      ~ '\meclub_store_aktif\M';
  IF v_kalan IS NOT NULL THEN
    RAISE EXCEPTION 'Eski izne başvuran başka fonksiyonlar var: %. İşlem geri alındı.', v_kalan;
  END IF;
END
$temizlik$;

NOTIFY pgrst, 'reload schema';
SELECT true AS eclub_hediye_ceki_sql_temizligi_hazir;
COMMIT;
