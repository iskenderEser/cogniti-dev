-- Eczanem üyelik daveti — geçici şifre yerine 24 saat geçerli tek kullanımlık şifre oluşturma akışı.
-- Bu dosyayı kullanıcı Supabase SQL Editor'da çalıştırır.

BEGIN;

CREATE TABLE IF NOT EXISTS public.eczanem_uyelik_davetleri (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  davet_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  eposta text NOT NULL,
  sona_erme timestamptz NOT NULL,
  durum text NOT NULL DEFAULT 'bekliyor'
    CHECK (durum IN ('bekliyor', 'isleniyor', 'tamamlandi')),
  lease_id uuid,
  lease_sonu timestamptz,
  gonderildi boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eczanem_uyelik_davetleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eczanem_uyelik_davetleri FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.eczanem_uyelik_davetleri TO service_role;

-- Davet bekleyen Eczanem üyesi ve davet satırı mevcut provizyon transaction'ında oluşur.
-- E-posta servisi kesilse bile bekleyen davet kaydı korunur ve yeniden gönderilebilir.
CREATE OR REPLACE FUNCTION public.eczanem_davet_bekleyen_kayit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.eczanem_uyelik_davetleri (auth_user_id, token_hash, eposta, sona_erme)
  SELECT
    u.id,
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    u.email,
    now() + interval '24 hours'
  FROM auth.users u
  WHERE u.id = NEW.auth_user_id
    AND u.raw_app_meta_data->>'eczanem_davet_bekliyor' = 'true'
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS eczanem_davet_bekleyen_kayit ON public.eczanem_musteriler;
CREATE TRIGGER eczanem_davet_bekleyen_kayit
  AFTER INSERT OR UPDATE OF auth_user_id ON public.eczanem_musteriler
  FOR EACH ROW EXECUTE FUNCTION public.eczanem_davet_bekleyen_kayit();

REVOKE ALL ON FUNCTION public.eczanem_davet_bekleyen_kayit() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.eczanem_davet_yenile(
  p_auth uuid,
  p_hash text,
  p_eposta text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v public.eczanem_uyelik_davetleri;
  v_id uuid := gen_random_uuid();
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auth::text, 29));
  SELECT * INTO v
  FROM public.eczanem_uyelik_davetleri
  WHERE auth_user_id = p_auth
  FOR UPDATE;

  IF v.durum = 'tamamlandi' THEN
    RAISE EXCEPTION 'Üyelik zaten tamamlanmış.';
  END IF;
  IF v.lease_sonu > now() THEN
    RAISE EXCEPTION 'Şifre oluşturma işlemi sürüyor.';
  END IF;
  IF v.gonderildi AND v.created_at > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'Yeni davet için bir dakika bekleyin.';
  END IF;

  INSERT INTO public.eczanem_uyelik_davetleri (
    auth_user_id, davet_id, token_hash, eposta, sona_erme
  )
  VALUES (
    p_auth, v_id, p_hash, p_eposta, now() + interval '24 hours'
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    davet_id = v_id,
    token_hash = p_hash,
    eposta = p_eposta,
    sona_erme = now() + interval '24 hours',
    durum = 'bekliyor',
    lease_id = NULL,
    lease_sonu = NULL,
    gonderildi = false,
    created_at = now();

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.eczanem_davet_islem_al(
  p_hash text,
  p_lease uuid
) RETURNS SETOF public.eczanem_uyelik_davetleri
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.eczanem_uyelik_davetleri
  SET
    durum = 'isleniyor',
    lease_id = p_lease,
    lease_sonu = now() + interval '2 minutes'
  WHERE token_hash = p_hash
    AND sona_erme > now()
    AND (durum = 'bekliyor' OR (durum = 'isleniyor' AND lease_sonu < now()))
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION public.eczanem_davet_islem_bitir(
  p_auth uuid,
  p_lease uuid,
  p_basarili boolean
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.eczanem_uyelik_davetleri
  SET
    durum = CASE WHEN p_basarili THEN 'tamamlandi' ELSE 'bekliyor' END,
    lease_id = NULL,
    lease_sonu = NULL
  WHERE auth_user_id = p_auth
    AND lease_id = p_lease
    AND durum = 'isleniyor';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION
  public.eczanem_davet_yenile(uuid, text, text),
  public.eczanem_davet_islem_al(text, uuid),
  public.eczanem_davet_islem_bitir(uuid, uuid, boolean)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.eczanem_davet_yenile(uuid, text, text),
  public.eczanem_davet_islem_al(text, uuid),
  public.eczanem_davet_islem_bitir(uuid, uuid, boolean)
TO service_role;

COMMIT;
