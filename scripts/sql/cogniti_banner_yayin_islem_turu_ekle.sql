-- Mevcut tüketim kuralına yalnızca banner_yayin işlem türünü ekler.
BEGIN;

LOCK TABLE public.cogniti_token_tuketimleri IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  mevcut_kural text;
BEGIN
  SELECT pg_get_expr(conbin, conrelid)
  INTO mevcut_kural
  FROM pg_constraint
  WHERE conrelid = 'public.cogniti_token_tuketimleri'::regclass
    AND conname = 'cogniti_token_tuketimleri_islem_turu_check'
    AND contype = 'c';

  IF mevcut_kural IS NULL THEN
    RAISE EXCEPTION 'Token tüketimi işlem türü kuralı bulunamadı.';
  END IF;

  IF strpos(mevcut_kural, quote_literal('banner_yayin')) = 0 THEN
    EXECUTE format(
      'ALTER TABLE public.cogniti_token_tuketimleri
       DROP CONSTRAINT cogniti_token_tuketimleri_islem_turu_check,
       ADD CONSTRAINT cogniti_token_tuketimleri_islem_turu_check
       CHECK ((%s) OR islem_turu = %L)',
      mevcut_kural,
      'banner_yayin'
    );
  END IF;
END;
$$;

COMMIT;

SELECT true AS cogniti_banner_yayin_islem_turu_eklendi;
