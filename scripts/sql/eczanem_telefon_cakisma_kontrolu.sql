-- Adım 6: Eczanem üye kaydı ve sorgulamasında iç kullanıcı (kullanicilar) ve
-- iş partneri (agora_is_partnerleri) telefon çakışmasını engeller.
-- Bu dosyayı kullanıcı Supabase SQL Editor'da çalıştırır.

BEGIN;

CREATE OR REPLACE FUNCTION public.eczanem_telefon_baska_kimlik_kontrol(
  p_telefon text
)
RETURNS TABLE(cakisma_var boolean, kimlik_turu text, mesaj text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_telefon text;
BEGIN
  v_telefon := public.hapbilgi_telefon_normalize(p_telefon);
  IF v_telefon IS NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.kullanicilar k
    WHERE k.telefon IS NOT NULL
      AND public.hapbilgi_telefon_normalize(k.telefon) = v_telefon
  ) THEN
    RETURN QUERY SELECT
      true,
      'ic_kullanici'::text,
      'Bu telefon numarası Cogniti kurumsal kullanıcısına kayıtlı olduğu için Eczanem üyesi olarak kaydedilemez.'::text;
    RETURN;
  END IF;

  IF to_regclass('public.agora_is_partnerleri') IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.agora_is_partnerleri p
    WHERE p.cep_telefonu = v_telefon
  ) THEN
    RETURN QUERY SELECT
      true,
      'is_partneri'::text,
      'Bu telefon numarası Cogniti iş partnerine kayıtlı olduğu için Eczanem üyesi olarak kaydedilemez.'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, NULL::text, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.eczanem_telefon_baska_kimlik_kontrol(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_telefon_baska_kimlik_kontrol(text)
  TO service_role;

-- Mevcut E-Club ↔ Eczanem telefon ayırma tetikleyicisini kurumsal kullanıcı ve
-- iş partneri çakışmalarını da veritabanı düzeyinde engelleyecek şekilde genişlet.
CREATE OR REPLACE FUNCTION public.hapbilgi_kimlik_telefon_ayir_trg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fonksiyon$
DECLARE
  v_telefon text;
BEGIN
  v_telefon := public.hapbilgi_telefon_normalize(NEW.telefon);
  IF v_telefon IS NULL THEN
    RAISE EXCEPTION 'Geçerli bir cep telefonu zorunludur.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_telefon, 0));

  IF TG_TABLE_NAME = 'eclub_kisiler' THEN
    IF EXISTS (
      SELECT 1 FROM public.eczanem_musteriler m
      WHERE public.hapbilgi_telefon_normalize(m.telefon) = v_telefon
    ) THEN
      RAISE EXCEPTION 'Bu kişi Cogniti''de Eczanem müşterisi olduğu için E-Club üyesi olarak kaydedilemez.'
        USING ERRCODE = 'P0001';
    END IF;
  ELSIF TG_TABLE_NAME = 'eczanem_musteriler' THEN
    IF EXISTS (
      SELECT 1 FROM public.eclub_kisiler k
      WHERE public.hapbilgi_telefon_normalize(k.telefon) = v_telefon
    ) THEN
      RAISE EXCEPTION 'Cogniti''de E-Club üyesi olduğunuz için müşteri olarak kayıt olmazsınız'
        USING ERRCODE = 'P0001';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.kullanicilar ku
      WHERE ku.telefon IS NOT NULL
        AND public.hapbilgi_telefon_normalize(ku.telefon) = v_telefon
    ) THEN
      RAISE EXCEPTION 'Bu telefon numarası Cogniti kurumsal kullanıcısına kayıtlı olduğu için Eczanem üyesi olarak kaydedilemez.'
        USING ERRCODE = 'P0001';
    END IF;

    IF to_regclass('public.agora_is_partnerleri') IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agora_is_partnerleri ap
      WHERE ap.cep_telefonu = v_telefon
    ) THEN
      RAISE EXCEPTION 'Bu telefon numarası Cogniti iş partnerine kayıtlı olduğu için Eczanem üyesi olarak kaydedilemez.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$fonksiyon$;

NOTIFY pgrst, $$reload schema$$;

COMMIT;
