BEGIN;

CREATE TABLE IF NOT EXISTS public.cogniti_kurumsal_isim_listesi (
  firma_id uuid PRIMARY KEY REFERENCES public.firmalar(firma_id) ON DELETE CASCADE,
  satirlar jsonb NOT NULL CHECK (jsonb_typeof(satirlar) = 'array'),
  gonderildi_at timestamptz
);

ALTER TABLE public.cogniti_kurumsal_isim_listesi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_kurumsal_isim_listesi FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cogniti_kurumsal_isim_listesi TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_kurumsal_isim_listesi_yaz(
  p_firma uuid, p_satirlar jsonb, p_gonder boolean
) RETURNS boolean LANGUAGE sql SET search_path = pg_catalog AS $$
  WITH kayit AS (
    INSERT INTO public.cogniti_kurumsal_isim_listesi AS liste (firma_id, satirlar, gonderildi_at)
    VALUES (p_firma, p_satirlar, CASE WHEN p_gonder THEN now() END)
    ON CONFLICT (firma_id) DO UPDATE
      SET satirlar = excluded.satirlar, gonderildi_at = excluded.gonderildi_at
      WHERE liste.gonderildi_at IS NULL
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM kayit);
$$;

REVOKE ALL ON FUNCTION public.cogniti_kurumsal_isim_listesi_yaz(uuid,jsonb,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_kurumsal_isim_listesi_yaz(uuid,jsonb,boolean) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT true AS cogniti_kurumsal_isim_listesi_hazir;
