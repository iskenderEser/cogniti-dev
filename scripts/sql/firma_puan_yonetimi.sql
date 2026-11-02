-- Firma bazlı yayın / doğru cevap / extra puan aralıkları.
-- Kullanıcı SQL Editor'da çalıştırır. Geçmiş puanlar ve yayınlar değiştirilmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.firma_puan_araliklari_gecerli(p_ayar jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $fn$
DECLARE tur text; a jsonb; alt numeric; ust numeric; adim numeric;
BEGIN
 IF p_ayar IS NULL THEN RETURN true; END IF;
 IF jsonb_typeof(p_ayar) <> 'object' THEN RETURN false; END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(p_ayar)) <> 3 THEN RETURN false; END IF;
 FOREACH tur IN ARRAY ARRAY['yayin','cevap','extra'] LOOP
  a:=p_ayar->tur;
  IF a IS NULL OR jsonb_typeof(a)<>'object' THEN RETURN false; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(a)) <> 3 THEN RETURN false; END IF;
  IF jsonb_typeof(a->'minimum') IS DISTINCT FROM 'number'
    OR jsonb_typeof(a->'maksimum') IS DISTINCT FROM 'number'
    OR jsonb_typeof(a->'artis') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
  alt:=(a->>'minimum')::numeric;ust:=(a->>'maksimum')::numeric;adim:=(a->>'artis')::numeric;
  IF alt<1 OR ust<alt OR adim<1 OR alt>2147483647 OR ust>2147483647 OR adim>2147483647
    OR trunc(alt)<>alt OR trunc(ust)<>ust OR trunc(adim)<>adim
    OR floor((ust-alt)/adim)>=1000 THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RETURN false;
END $fn$;
ALTER TABLE public.firmalar ADD COLUMN IF NOT EXISTS yayin_puan_araliklari jsonb;
DO $kurulum$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid='public.firmalar'::regclass AND conname='firmalar_yayin_puan_araliklari_check') THEN
  ALTER TABLE public.firmalar ADD CONSTRAINT firmalar_yayin_puan_araliklari_check CHECK(public.firma_puan_araliklari_gecerli(yayin_puan_araliklari));
 END IF;
END $kurulum$;
COMMENT ON COLUMN public.firmalar.yayin_puan_araliklari IS 'Puan Yönetimi: yayın, cevap ve extra için minimum/maksimum/artis. NULL ise mevcut seçenekler korunur.';
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='firmalar' AND column_name='yayin_puan_araliklari') AS firma_puan_yonetimi_hazir;
