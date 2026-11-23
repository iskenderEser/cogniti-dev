BEGIN;

CREATE TABLE IF NOT EXISTS public.cogniti_kullanici_davetleri (
  kullanici_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE public.cogniti_kullanici_davetleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_kullanici_davetleri FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.cogniti_kullanici_davetleri TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_kullanici_davet_yenile(
  p_kullanici uuid,
  p_hash text,
  p_eposta text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v public.cogniti_kullanici_davetleri;
  v_id uuid := gen_random_uuid();
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_kullanici::text, 17));
  SELECT * INTO v
  FROM public.cogniti_kullanici_davetleri
  WHERE kullanici_id = p_kullanici
  FOR UPDATE;

  IF v.durum = 'tamamlandi' THEN
    RAISE EXCEPTION 'Kullanıcı şifresini zaten oluşturmuş.';
  END IF;
  IF v.lease_sonu > now() THEN
    RAISE EXCEPTION 'Şifre oluşturma işlemi sürüyor.';
  END IF;
  IF v.gonderildi AND v.created_at > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'Yeni davet için bir dakika bekleyin.';
  END IF;

  INSERT INTO public.cogniti_kullanici_davetleri (
    kullanici_id, davet_id, token_hash, eposta, sona_erme
  )
  VALUES (
    p_kullanici, v_id, p_hash, p_eposta, now() + interval '24 hours'
  )
  ON CONFLICT (kullanici_id) DO UPDATE SET
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

CREATE OR REPLACE FUNCTION public.cogniti_kullanici_davet_islem_al(
  p_hash text,
  p_lease uuid
) RETURNS SETOF public.cogniti_kullanici_davetleri
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.cogniti_kullanici_davetleri
  SET
    durum = 'isleniyor',
    lease_id = p_lease,
    lease_sonu = now() + interval '2 minutes'
  WHERE token_hash = p_hash
    AND sona_erme > now()
    AND (durum = 'bekliyor' OR (durum = 'isleniyor' AND lease_sonu < now()))
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION public.cogniti_kullanici_davet_islem_bitir(
  p_kullanici uuid,
  p_lease uuid,
  p_basarili boolean
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.cogniti_kullanici_davetleri
  SET
    durum = CASE WHEN p_basarili THEN 'tamamlandi' ELSE 'bekliyor' END,
    lease_id = NULL,
    lease_sonu = NULL
  WHERE kullanici_id = p_kullanici
    AND lease_id = p_lease
    AND durum = 'isleniyor';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION
  public.cogniti_kullanici_davet_yenile(uuid, text, text),
  public.cogniti_kullanici_davet_islem_al(text, uuid),
  public.cogniti_kullanici_davet_islem_bitir(uuid, uuid, boolean)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.cogniti_kullanici_davet_yenile(uuid, text, text),
  public.cogniti_kullanici_davet_islem_al(text, uuid),
  public.cogniti_kullanici_davet_islem_bitir(uuid, uuid, boolean)
TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT true AS cogniti_kullanici_davetleri_hazir;
