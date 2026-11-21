-- Agora vitrin ve Agora Yayınları ekranlarında onaylı partner logosunun yolunu okur.
BEGIN;

CREATE OR REPLACE FUNCTION public.agora_vitrin_partner_logo_oku(
  p_auth_id uuid,
  p_partner_id uuid
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_logo text;
BEGIN
  PERFORM public.agora_vitrin_yetki(p_auth_id);

  SELECT p.logo_yolu
  INTO v_logo
  FROM public.agora_partner_profilleri p
  JOIN public.agora_is_partnerleri a ON a.partner_id = p.partner_id
  WHERE p.partner_id = p_partner_id
    AND a.uyelik_durumu = 'onaylandi';

  RETURN v_logo;
END $f$;

REVOKE ALL ON FUNCTION public.agora_vitrin_partner_logo_oku(uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_vitrin_partner_logo_oku(uuid, uuid) TO service_role;

COMMIT;
