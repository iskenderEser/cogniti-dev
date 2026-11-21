-- KULLANICI ÇALIŞTIRACAK.
-- Pasife alınan canlı yayın takvim oturumunu (durum = 'iptal') 30 dk tampon kontrolüyle tekrar aktife ('musait') alan RPC.
BEGIN;

CREATE OR REPLACE FUNCTION public.agora_partner_canli_oturum_aktif(
  p_partner_id uuid,
  p_oturum_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_oturum public.agora_partner_canli_oturumlar%ROWTYPE;
BEGIN
  PERFORM 1 FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id FOR UPDATE;

  SELECT * INTO v_oturum
  FROM public.agora_partner_canli_oturumlar
  WHERE oturum_id = p_oturum_id
    AND partner_id = p_partner_id
    AND durum = 'iptal'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.agora_partner_canli_oturumlar o
    WHERE o.partner_id = p_partner_id
      AND o.oturum_id <> v_oturum.oturum_id
      AND o.durum IN ('musait', 'siparis_verildi')
      AND v_oturum.baslangic_at < (o.bitis_at + interval '30 minutes')
      AND o.baslangic_at < (v_oturum.bitis_at + interval '30 minutes')
  ) THEN
    RAISE EXCEPTION 'Bu saat aralığı başka bir aktif yayınınızla veya 30 dakikalık ara tamponuyla çakışıyor.' USING ERRCODE = '40001';
  END IF;

  UPDATE public.agora_partner_canli_oturumlar
  SET durum = 'musait', updated_at = now()
  WHERE oturum_id = v_oturum.oturum_id;

  RETURN true;
END $f$;

REVOKE ALL ON FUNCTION public.agora_partner_canli_oturum_aktif(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_canli_oturum_aktif(uuid, uuid)
  TO service_role;

COMMIT;
