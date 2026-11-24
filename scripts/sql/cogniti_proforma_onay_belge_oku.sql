-- Kullanıcı Supabase SQL Editor'de çalıştıracak.
-- Proforma onay e-postalarının belge numarası ve tutarını güvenli şekilde okumak için salt okuma işlevi.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_proforma_onay_belge_oku(
  p_tur text,
  p_firma uuid,
  p_anahtar text
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_belge jsonb;
BEGIN
  IF p_tur IS NULL OR p_firma IS NULL OR coalesce(btrim(p_anahtar), '') = '' THEN
    RETURN NULL;
  END IF;

  CASE p_tur
    WHEN 'esnek' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_esnek_proforma_onaylari o
      WHERE o.firma_id = p_firma AND o.siparis_id = p_anahtar::uuid;
    WHEN 'abonelik' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_abonelik_proforma_onaylari o
      WHERE o.firma_id = p_firma AND o.kayit_id = p_anahtar::uuid;
    WHEN 'kko' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_kko_proforma_onaylari o
      WHERE o.firma_id = p_firma AND o.yukleme_id = p_anahtar::uuid;
    WHEN 'viva' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_viva_proforma_onaylari o
      WHERE o.firma_id = p_firma AND o.donem = p_anahtar::date;
    WHEN 'banner' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_banner_proforma_onaylari o
      WHERE o.firma_id = p_firma AND o.donem = p_anahtar::date;
    WHEN 'agora' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_agora_proforma_onaylari o
      WHERE o.firma_id = p_firma AND o.siparis_id = p_anahtar::uuid;
    WHEN 'icerik' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_icerik_proforma_onaylari o
      JOIN public.cogniti_icerik_uretim_alimlari a ON a.talep_id = o.talep_id
      WHERE a.firma_id = p_firma AND o.talep_id = p_anahtar::uuid;
    WHEN 'firmastore' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_firmastore_proforma_onaylari o
      WHERE o.firma_id = p_firma AND o.donem = p_anahtar::date;
    WHEN 'eczane' THEN
      SELECT o.belge INTO v_belge
      FROM public.cogniti_eczane_cek_proforma_onaylari o
      WHERE o.firma_id = p_firma AND o.donem = p_anahtar;
    ELSE
      RETURN NULL;
  END CASE;

  RETURN v_belge;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_proforma_onay_belge_oku(text, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_proforma_onay_belge_oku(text, uuid, text)
  TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS cogniti_proforma_onay_belge_oku_kuruldu;
