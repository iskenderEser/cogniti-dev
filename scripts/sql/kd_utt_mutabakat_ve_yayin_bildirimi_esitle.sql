-- KD_UTT: UTT ile aynı Mutabakat erişimi ve yayın aktivasyonu bildirimi.
-- Bu dosyanın TAMAMI Supabase SQL Editor'de kullanıcı tarafından çalıştırılır.
-- Mevcut DB fonksiyonlarının yalnız rol koşulları değiştirilir.
-- Kullanıcı rolleri, kayıtlar, tutarlar, puanlar ve cron takvimi değiştirilmez.
-- Eksik fonksiyon veya beklenmeyen koşul varsa işlem bütünüyle geri alınır.
-- Tekrar çalıştırılabilir. Geçmiş yayınlara geriye dönük bildirim oluşturmaz.

BEGIN;

DO $duzeltme$
DECLARE
  v_imza text;
  v_oid oid;
  v_tanim text;
  v_eski text := 'LOWER(k.rol) = ''utt''';
  v_yeni text := 'LOWER(k.rol) IN (''utt'', ''kd_utt'')';
BEGIN
  FOREACH v_imza IN ARRAY ARRAY[
    'public.eczanem_utt_mutabakat_yetkili_mi(uuid,uuid,uuid,uuid)',
    'public.eczanem_utt_mutabakat_listele(uuid,date,text,integer,integer)',
    'public.eczanem_utt_mutabakat_urunleri_listele(uuid,date,text,integer,integer)',
    'public.eczanem_utt_mutabakat_urun_islemleri_listele(uuid,date,uuid,text,integer,integer)',
    'public.eczanem_utt_mutabakat_eczaneleri_listele(uuid,date,text,integer,integer)',
    'public.eczanem_utt_mutabakat_eczane_islemleri_listele(uuid,date,uuid,text,integer,integer)',
    'public.eczanem_utt_mutabakat_eczane_islemleri_filtreli_listele(uuid,date,uuid,text,uuid,integer,integer)'
  ] LOOP
    v_oid := to_regprocedure(v_imza);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'Gerekli fonksiyon bulunamadı: %', v_imza;
    END IF;
    v_tanim := pg_get_functiondef(v_oid);
    IF strpos(v_tanim, v_eski) > 0 THEN
      EXECUTE replace(v_tanim, v_eski, v_yeni);
    ELSIF strpos(v_tanim, v_yeni) = 0 THEN
      RAISE EXCEPTION 'Beklenen Mutabakat rol koşulu bulunamadı: %', v_imza;
    END IF;
  END LOOP;

  v_imza := 'public.yayin_planlananlari_aktive(uuid)';
  v_oid := to_regprocedure(v_imza);
  IF v_oid IS NULL THEN
    RAISE EXCEPTION 'Gerekli fonksiyon bulunamadı: %', v_imza;
  END IF;
  v_tanim := pg_get_functiondef(v_oid);
  v_eski := 'k.rol = ANY(COALESCE(y.hedef_roller, ARRAY[''utt'']))';
  v_yeni := '(CASE WHEN k.rol = ''kd_utt'' THEN ''utt'' ELSE k.rol END) = ANY(COALESCE(y.hedef_roller, ARRAY[''utt'']))';
  IF strpos(v_tanim, v_eski) > 0 THEN
    EXECUTE replace(v_tanim, v_eski, v_yeni);
  ELSIF strpos(v_tanim, v_yeni) = 0 THEN
    RAISE EXCEPTION 'Beklenen yayın bildirimi rol koşulu bulunamadı: %', v_imza;
  END IF;
END;
$duzeltme$;

COMMIT;

-- Sonuç: sekiz satırın tamamında kd_utt_esitlendi = true beklenir.
WITH beklenen(imza, kosul) AS (
  VALUES
    ('public.eczanem_utt_mutabakat_yetkili_mi(uuid,uuid,uuid,uuid)', 'LOWER(k.rol) IN (''utt'', ''kd_utt'')'),
    ('public.eczanem_utt_mutabakat_listele(uuid,date,text,integer,integer)', 'LOWER(k.rol) IN (''utt'', ''kd_utt'')'),
    ('public.eczanem_utt_mutabakat_urunleri_listele(uuid,date,text,integer,integer)', 'LOWER(k.rol) IN (''utt'', ''kd_utt'')'),
    ('public.eczanem_utt_mutabakat_urun_islemleri_listele(uuid,date,uuid,text,integer,integer)', 'LOWER(k.rol) IN (''utt'', ''kd_utt'')'),
    ('public.eczanem_utt_mutabakat_eczaneleri_listele(uuid,date,text,integer,integer)', 'LOWER(k.rol) IN (''utt'', ''kd_utt'')'),
    ('public.eczanem_utt_mutabakat_eczane_islemleri_listele(uuid,date,uuid,text,integer,integer)', 'LOWER(k.rol) IN (''utt'', ''kd_utt'')'),
    ('public.eczanem_utt_mutabakat_eczane_islemleri_filtreli_listele(uuid,date,uuid,text,uuid,integer,integer)', 'LOWER(k.rol) IN (''utt'', ''kd_utt'')'),
    ('public.yayin_planlananlari_aktive(uuid)', '(CASE WHEN k.rol = ''kd_utt'' THEN ''utt'' ELSE k.rol END) = ANY(COALESCE(y.hedef_roller, ARRAY[''utt'']))')
)
SELECT imza AS fonksiyon,
  COALESCE(strpos(pg_get_functiondef(to_regprocedure(imza)), kosul) > 0, false) AS kd_utt_esitlendi
FROM beklenen
ORDER BY imza;
