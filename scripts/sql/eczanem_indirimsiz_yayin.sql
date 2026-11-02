-- Eczanem: yayın bazında İndirimli / İndirimsiz seçimi.
-- Supabase SQL Editor'da tamamı kullanıcı tarafından çalıştırılır.
-- Eski Eczanem yayınları mevcut indirimli modelde kalır.
-- Puan, tarife, sipariş ve gönderim geçmişi silinmez/değiştirilmez.
-- İndirimsiz yayınlarda tamamlama ve cevaplar kaydedilir; puan kazanımı yoktur.
BEGIN;

SELECT pg_advisory_xact_lock(hashtextextended('eczanem-indirimsiz-yayin-v1', 0));

ALTER TABLE public.yayin_yonetimi
  ADD COLUMN IF NOT EXISTS eczanem_kazanim_modeli text;
ALTER TABLE public.yayin_yonetimi ALTER COLUMN eczanem_kazanim_modeli DROP DEFAULT;

-- Önceki yayın kapısı tüm Eczanem içeriklerinde puan ve tarife gerektiriyordu.
-- Yalnız bu mevcut hedef grubunun modelini kayda al; oran veya puan uydurma.
UPDATE public.yayin_yonetimi
SET eczanem_kazanim_modeli = 'indirimli'
WHERE hedef_roller @> ARRAY['eczanem']::text[]
  AND eczanem_kazanim_modeli IS NULL;

DO $kisit$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.yayin_yonetimi'::regclass
      AND conname='yayin_eczanem_kazanim_modeli_ck'
  ) THEN
    ALTER TABLE public.yayin_yonetimi ADD CONSTRAINT yayin_eczanem_kazanim_modeli_ck
    CHECK (CASE WHEN hedef_roller @> ARRAY['eczanem']::text[]
      THEN eczanem_kazanim_modeli IS NOT NULL
        AND eczanem_kazanim_modeli IN ('indirimli','indirimsiz')
      ELSE eczanem_kazanim_modeli IS NULL END);
  END IF;
END;
$kisit$;

CREATE OR REPLACE FUNCTION public.tg_eczanem_yayin_kazanim_modeli()
RETURNS trigger LANGUAGE plpgsql SET search_path=public
AS $fn$
BEGIN
  IF TG_OP='UPDATE' AND NEW.eczanem_kazanim_modeli IS DISTINCT FROM OLD.eczanem_kazanim_modeli THEN
    RAISE EXCEPTION 'Oluşturulmuş yayının Eczanem kazanım modeli değiştirilemez.' USING ERRCODE='23514';
  END IF;
  IF NEW.hedef_roller @> ARRAY['eczanem']::text[] THEN
    IF NEW.eczanem_kazanim_modeli IS NULL
       OR NEW.eczanem_kazanim_modeli NOT IN ('indirimli','indirimsiz') THEN
      RAISE EXCEPTION 'Eczanem yayını için İndirimli veya İndirimsiz seçin.' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.eczanem_kazanim_modeli IS NOT NULL THEN
    RAISE EXCEPTION 'Eczanem kazanım modeli bu hedefte kullanılamaz.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.tg_eczanem_yayin_kazanim_modeli() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_eczanem_yayin_kazanim_modeli ON public.yayin_yonetimi;
CREATE TRIGGER trg_eczanem_yayin_kazanim_modeli
BEFORE INSERT OR UPDATE ON public.yayin_yonetimi
FOR EACH ROW EXECUTE FUNCTION public.tg_eczanem_yayin_kazanim_modeli();

CREATE OR REPLACE FUNCTION public.eczanem_yayin_indirimli_mi(p_yayin_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path=public
AS $fn$
  SELECT COALESCE((
    SELECT y.eczanem_kazanim_modeli='indirimli'
    FROM public.yayin_yonetimi y
    WHERE y.yayin_id=p_yayin_id AND y.hedef_roller @> ARRAY['eczanem']::text[]
  ),false);
$fn$;
REVOKE ALL ON FUNCTION public.eczanem_yayin_indirimli_mi(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_yayin_indirimli_mi(uuid) TO service_role;

-- Kurulu görünümün mevcut kolonlarını/sırasını ve dört araç çözümlemesini koru.
-- İndirimsiz yayındaki eski taslak puanları bile kart/rapor kazanımı sayılamaz.
DO $gorunum$
DECLARE
  v_govde text;
  v_kolonlar text;
BEGIN
  v_govde := pg_get_viewdef('public.v_yayin_detay'::regclass,true);
  IF strpos(v_govde,'eczanem_kazanim_kaynagi')>0 THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.v_yayin_detay'::regclass
    AND attname='eczanem_kazanim_modeli' AND attnum>0 AND NOT attisdropped) THEN
    RAISE EXCEPTION 'Yayın görünümünde beklenmeyen Eczanem modeli var; kurulum geri alındı.';
  END IF;
  SELECT string_agg(
    CASE WHEN a.attname IN ('video_puani','ogrenme_araci_puani','soru_puani')
      THEN format('CASE WHEN ym_eczanem.eczanem_kazanim_modeli=''indirimsiz'' THEN 0 ELSE eczanem_kazanim_kaynagi.%I END AS %I',a.attname,a.attname)
      ELSE format('eczanem_kazanim_kaynagi.%I',a.attname) END,
    ', ' ORDER BY a.attnum)
  INTO v_kolonlar
  FROM pg_attribute a
  WHERE a.attrelid='public.v_yayin_detay'::regclass AND a.attnum>0 AND NOT a.attisdropped;
  IF v_kolonlar IS NULL THEN RAISE EXCEPTION 'Yayın görünümü kolonları bulunamadı.'; END IF;
  EXECUTE format(
    'CREATE OR REPLACE VIEW public.v_yayin_detay AS SELECT %s, ym_eczanem.eczanem_kazanim_modeli FROM (%s) eczanem_kazanim_kaynagi JOIN public.yayin_yonetimi ym_eczanem ON ym_eczanem.yayin_id=eczanem_kazanim_kaynagi.yayin_id',
    v_kolonlar,regexp_replace(v_govde,';\s*$',''));
END;
$gorunum$;

-- Güncel dört araçlı tamamlama ve sabit soru/cevap güvenliği aynen korunur.
-- Bilinmeyen bir kurulu fonksiyon varsa hiçbir kısmi değişiklik bırakılmaz.
DO $kazanım$
DECLARE
  v_govde text;
  v_eski text;
BEGIN
  v_govde := pg_get_functiondef('public.eczanem_izleme_tamamla(uuid,uuid,integer[])'::regprocedure);
  IF strpos(v_govde,'-- eczanem-indirimsiz-izleme')=0 THEN
    v_eski := 'IF v_arac_puani > 0 THEN';
    IF strpos(v_govde,'tamamlama_kaniti')=0 OR strpos(v_govde,v_eski)=0 THEN
      RAISE EXCEPTION 'Kurulu Eczanem tamamlama işlevi beklenen dört araç yapısında değil; kurulum geri alındı.';
    END IF;
    v_govde := replace(v_govde,v_eski,
      'IF v_arac_puani > 0 AND public.eczanem_yayin_indirimli_mi(v_izleme.yayin_id) THEN -- eczanem-indirimsiz-izleme');
    EXECUTE v_govde;
  END IF;

  v_govde := pg_get_functiondef('public.eczanem_cevaplari_kaydet_cekirdek(uuid,uuid,jsonb)'::regprocedure);
  IF strpos(v_govde,'-- eczanem-indirimsiz-cevap')=0 THEN
    v_eski := 'IF v_toplam > 0 THEN';
    IF strpos(v_govde,'soru_erisimi_acik_mi')=0 OR strpos(v_govde,v_eski)=0 THEN
      RAISE EXCEPTION 'Kurulu Eczanem cevap işlevi beklenen yapıda değil; kurulum geri alındı.';
    END IF;
    v_govde := replace(v_govde,v_eski,$yeni$
    -- eczanem-indirimsiz-cevap
    IF NOT public.eczanem_yayin_indirimli_mi(v_izleme.yayin_id) THEN
      v_toplam := 0;
    END IF;
    IF v_toplam > 0 THEN$yeni$);
    EXECUTE v_govde;
  END IF;
END;
$kazanım$;

NOTIFY pgrst,'reload schema';
COMMIT;

SELECT
  EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public.yayin_yonetimi'::regclass AND conname='yayin_eczanem_kazanim_modeli_ck')
  AND strpos(pg_get_viewdef('public.v_yayin_detay'::regclass,true),'eczanem_kazanim_kaynagi')>0
  AND strpos(pg_get_functiondef('public.eczanem_izleme_tamamla(uuid,uuid,integer[])'::regprocedure),'-- eczanem-indirimsiz-izleme')>0
  AND strpos(pg_get_functiondef('public.eczanem_cevaplari_kaydet_cekirdek(uuid,uuid,jsonb)'::regprocedure),'-- eczanem-indirimsiz-cevap')>0
  AS eczanem_indirimsiz_yayin_hazir;
