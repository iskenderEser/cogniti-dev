-- Kullanıcı çalıştıracak. Mevcut atomik talep ve podcast kesinleştirme RPC'leri gerekir.
BEGIN;

ALTER TABLE public.talepler
  ADD COLUMN IF NOT EXISTS uretim_bedeli_turu text,
  ADD COLUMN IF NOT EXISTS uretim_bedeli_token integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.talepler'::regclass
      AND conname = 'talepler_uretim_bedeli_check'
  ) THEN
    ALTER TABLE public.talepler ADD CONSTRAINT talepler_uretim_bedeli_check CHECK (
      (uretim_bedeli_turu IS NULL AND uretim_bedeli_token IS NULL)
      OR (uretim_bedeli_turu IS NOT DISTINCT FROM 'teklif' AND uretim_bedeli_token IS NULL)
      OR (uretim_bedeli_turu IS NOT DISTINCT FROM 'sabit'
          AND uretim_bedeli_token IS NOT NULL AND uretim_bedeli_token >= 0)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.talep_atomik_olustur(
  p_uretici_id uuid,
  p_islem_anahtari uuid,
  p_talep jsonb,
  p_uretim_bedeli_turu text,
  p_uretim_bedeli_token integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  sonuc jsonb;
BEGIN
  -- Bedel, mevcut RPC'nin idempotency özetine girmez.
  sonuc := public.talep_atomik_olustur(p_uretici_id, p_islem_anahtari, p_talep);
  IF (sonuc->>'mevcut')::boolean IS FALSE THEN
    IF p_uretim_bedeli_turu IS NULL THEN
      RAISE EXCEPTION 'Üretim bedeli türü zorunludur.' USING ERRCODE = '22023';
    END IF;
    UPDATE public.talepler
    SET uretim_bedeli_turu = p_uretim_bedeli_turu,
        uretim_bedeli_token = p_uretim_bedeli_token
    WHERE talep_id = (sonuc->>'talep_id')::uuid
      AND uretici_id = p_uretici_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Üretim bedeli talebe kaydedilemedi.';
    END IF;
  END IF;
  RETURN sonuc;
END;
$$;

REVOKE ALL ON FUNCTION public.talep_atomik_olustur(uuid, uuid, jsonb, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.talep_atomik_olustur(uuid, uuid, jsonb, text, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.podcast_taslak_atomik_kesinlestir(
  p_uretici_id uuid,
  p_talep_id uuid,
  p_islem_anahtari uuid,
  p_talep jsonb,
  p_uretim_bedeli_turu text,
  p_uretim_bedeli_token integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  sonuc jsonb;
BEGIN
  -- Bedel, mevcut RPC'nin idempotency özetine girmez.
  sonuc := public.podcast_taslak_atomik_kesinlestir(p_uretici_id, p_talep_id, p_islem_anahtari, p_talep);
  IF (sonuc->>'mevcut')::boolean IS FALSE THEN
    IF p_uretim_bedeli_turu IS NULL THEN
      RAISE EXCEPTION 'Üretim bedeli türü zorunludur.' USING ERRCODE = '22023';
    END IF;
    UPDATE public.talepler
    SET uretim_bedeli_turu = p_uretim_bedeli_turu,
        uretim_bedeli_token = p_uretim_bedeli_token
    WHERE talep_id = (sonuc->>'talep_id')::uuid
      AND uretici_id = p_uretici_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Üretim bedeli talebe kaydedilemedi.';
    END IF;
  END IF;
  RETURN sonuc;
END;
$$;

REVOKE ALL ON FUNCTION public.podcast_taslak_atomik_kesinlestir(uuid, uuid, uuid, jsonb, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.podcast_taslak_atomik_kesinlestir(uuid, uuid, uuid, jsonb, text, integer)
  TO service_role;

COMMIT;

SELECT
  to_regprocedure('public.talep_atomik_olustur(uuid,uuid,jsonb,text,integer)') IS NOT NULL
  AND to_regprocedure('public.podcast_taslak_atomik_kesinlestir(uuid,uuid,uuid,jsonb,text,integer)') IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.talepler'::regclass
      AND conname = 'talepler_uretim_bedeli_check'
  ) AS icerik_uretim_bedeli_kuruldu;
