-- Kullanıcı çalıştıracak. Üretim bildirimi, alıcı ve kayıt başına tek satırdır.
BEGIN;

CREATE OR REPLACE FUNCTION public.uretim_bildirim_yaz(
  p_alici_id uuid,
  p_gonderen_id uuid,
  p_kayit_turu text,
  p_kayit_id uuid,
  p_talep_id uuid,
  p_gorev_id uuid,
  p_mesaj text
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $fonksiyon$
BEGIN
  IF p_alici_id IS NULL THEN RETURN; END IF;

  UPDATE public.bildirimler b
     SET goruldu_mu = true
   WHERE b.alici_id = p_alici_id
     AND b.talep_id = p_talep_id
     AND b.goruldu_mu IS FALSE;

  INSERT INTO public.bildirimler (
    alici_id, gonderen_id, kayit_turu, kayit_id,
    talep_id, gorev_id, mesaj, goruldu_mu
  ) VALUES (
    p_alici_id, p_gonderen_id, p_kayit_turu, p_kayit_id,
    p_talep_id, p_gorev_id, p_mesaj, false
  )
  ON CONFLICT ON CONSTRAINT uq_bildirimler_alici_kayit_turu_kayit_id
  DO UPDATE SET
    gonderen_id = EXCLUDED.gonderen_id,
    talep_id = EXCLUDED.talep_id,
    gorev_id = EXCLUDED.gorev_id,
    mesaj = EXCLUDED.mesaj,
    goruldu_mu = false,
    created_at = EXCLUDED.created_at;
END;
$fonksiyon$;

REVOKE ALL ON FUNCTION public.uretim_bildirim_yaz(uuid, uuid, text, uuid, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.uretim_bildirim_yaz(uuid, uuid, text, uuid, uuid, uuid, text)
  TO service_role;

COMMIT;
SELECT true AS uretim_bildirim_tekil_kayit_duzeltildi;
