BEGIN;

CREATE TABLE IF NOT EXISTS public.cogniti_kurumsal_on_basvuru (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_adi text NOT NULL,
  ad_soyad text NOT NULL,
  eposta text NOT NULL UNIQUE,
  cep_tel text NOT NULL,
  olusturuldu_at timestamptz NOT NULL DEFAULT now(),
  davet_hash text UNIQUE,
  davet_bitis_at timestamptz,
  kabul_at timestamptz,
  aday_auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT
);

ALTER TABLE public.cogniti_kurumsal_on_basvuru ADD COLUMN IF NOT EXISTS web_sitesi text;

ALTER TABLE public.cogniti_kurumsal_on_basvuru ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_kurumsal_on_basvuru FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cogniti_kurumsal_on_basvuru TO service_role;

COMMIT;
