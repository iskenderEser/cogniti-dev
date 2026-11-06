-- KULLANICI ÇALIŞTIRACAK. Önce agora_partner_hakedis_alanlari.sql kurulmalıdır.
-- Planlanan ödeme gününü yalnız aktif Cogniti admini elle belirler.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_partner_admin_odeme_gunu_kaydet(
  p_admin_id uuid, p_partner_id uuid, p_siparis_id uuid,
  p_planlanan_odeme_gunu date, p_onceki_odeme_gunu date
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $f$
DECLARE kayit public.agora_siparisleri%ROWTYPE;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF p_planlanan_odeme_gunu IS NOT NULL AND
    (p_planlanan_odeme_gunu < date '0001-01-01' OR p_planlanan_odeme_gunu > date '9999-12-31') THEN
    RAISE EXCEPTION 'Geçersiz ödeme günü.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO kayit FROM public.agora_siparisleri
    WHERE siparis_id = p_siparis_id AND partner_id = p_partner_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Hak ediş bulunamadı.' USING ERRCODE = 'P0002'; END IF;
  IF kayit.planlanan_odeme_gunu IS DISTINCT FROM p_onceki_odeme_gunu THEN
    RAISE EXCEPTION 'Ödeme günü değişmiş. Listeyi yenileyin.' USING ERRCODE = '40001';
  END IF;
  UPDATE public.agora_siparisleri SET planlanan_odeme_gunu = p_planlanan_odeme_gunu
    WHERE siparis_id = p_siparis_id;
  RETURN jsonb_build_object('siparis_id', p_siparis_id, 'planlanan_odeme_gunu', p_planlanan_odeme_gunu);
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_admin_odeme_gunu_kaydet(uuid,uuid,uuid,date,date)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_admin_odeme_gunu_kaydet(uuid,uuid,uuid,date,date) TO service_role;
COMMENT ON COLUMN public.agora_siparisleri.planlanan_odeme_gunu
  IS 'Adminin elle belirlediği planlanan ödeme günü; otomatik vade hesaplanmaz.';
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS agora_partner_hakedis_odeme_gunu_hazir;
