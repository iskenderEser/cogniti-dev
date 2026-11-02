-- Adım 4: Firmanın seçtiği FirmaStore çekleri ve çeke özel baz puan.
-- Kurulum mevcut ürün/seçim/puan/sipariş kayıtlarına değer atamaz.
BEGIN;

ALTER TABLE public.store_urun_firma_ayarlari
  ADD COLUMN IF NOT EXISTS baz_puan integer;
DO $kurulum$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.store_urun_firma_ayarlari'::regclass
      AND conname = 'store_urun_firma_baz_puan_check'
  ) THEN
    ALTER TABLE public.store_urun_firma_ayarlari
      ADD CONSTRAINT store_urun_firma_baz_puan_check
      CHECK (baz_puan IS NULL OR baz_puan > 0);
  END IF;
END $kurulum$;

COMMENT ON COLUMN public.store_urun_firma_ayarlari.baz_puan IS
  'Firmanın bu çekin minimum TL tutarı karşılığında belirlediği pozitif tam sayı puan.';

CREATE OR REPLACE FUNCTION public.admin_firmastore_cek_tanimlarini_kaydet(
  p_firma_id uuid,
  p_cekler jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $fn$
DECLARE
  v_cek jsonb;
  v_id uuid;
  v_idler uuid[] := ARRAY[]::uuid[];
  v_puan numeric;
BEGIN
  IF p_firma_id IS NULL OR jsonb_typeof(p_cekler) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Geçerli firma ve çek listesi zorunludur.';
  END IF;

  -- Aynı firmanın iki ayar kaydı tek transaction sırasıyla uygulanır.
  PERFORM 1 FROM public.firmalar WHERE firma_id = p_firma_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Firma bulunamadı.';
  END IF;

  FOR v_cek IN SELECT value FROM jsonb_array_elements(p_cekler)
  LOOP
    IF jsonb_typeof(v_cek) IS DISTINCT FROM 'object'
       OR jsonb_typeof(v_cek->'urun_id') IS DISTINCT FROM 'string'
       OR COALESCE(v_cek->>'urun_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       OR jsonb_typeof(v_cek->'baz_puan') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Her seçilen çek için geçerli kimlik ve baz puan zorunludur.';
    END IF;
    v_id := (v_cek->>'urun_id')::uuid;
    v_puan := (v_cek->>'baz_puan')::numeric;
    IF v_id = ANY(v_idler) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Aynı çek birden fazla seçilemez.';
    END IF;
    IF v_puan < 1 OR v_puan > 2147483647 OR v_puan <> trunc(v_puan) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Baz puan pozitif tam sayı olmalıdır.';
    END IF;
    v_idler := array_append(v_idler, v_id);
  END LOOP;

  -- Seçilen katalog tutarları doğrulama ve kayıt arasında değişmesin.
  PERFORM 1 FROM public.store_urunler
  WHERE urun_id = ANY(v_idler) ORDER BY urun_id FOR SHARE;
  IF (SELECT count(*) FROM public.store_urunler
      WHERE urun_id = ANY(v_idler) AND aktif_mi IS TRUE
        AND minimum_siparis_tl > 0 AND minimum_siparis_tl <= 9999999999.99)
      <> cardinality(v_idler) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Yalnız aktif ve minimum TL tutarı tanımlanmış çekler seçilebilir.';
  END IF;

  -- Yalnız bu firmanın seçimi değiştirilir. Boş liste tüm seçimleri kaldırır.
  UPDATE public.store_urun_firma_ayarlari
    SET aktif_mi = false, baz_puan = NULL, updated_at = now()
    WHERE firma_id = p_firma_id AND (aktif_mi OR baz_puan IS NOT NULL);

  INSERT INTO public.store_urun_firma_ayarlari (urun_id, firma_id, aktif_mi, baz_puan, updated_at)
    SELECT (value->>'urun_id')::uuid, p_firma_id, true,
      (value->>'baz_puan')::numeric::integer, now()
    FROM jsonb_array_elements(p_cekler)
  ON CONFLICT (urun_id, firma_id) DO UPDATE SET
    aktif_mi = true, baz_puan = EXCLUDED.baz_puan, updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('firma_id', p_firma_id, 'secili_cek_sayisi', cardinality(v_idler));
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_firmastore_cek_tanimlarini_kaydet(uuid,jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_firmastore_cek_tanimlarini_kaydet(uuid,jsonb)
  TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT to_regprocedure('public.admin_firmastore_cek_tanimlarini_kaydet(uuid,jsonb)') IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'store_urun_firma_ayarlari'
      AND column_name = 'baz_puan'
  ) AS firmastore_firma_cek_tanimlari_hazir;
