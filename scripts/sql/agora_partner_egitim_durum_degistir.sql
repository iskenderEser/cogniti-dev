-- KULLANICI ÇALIŞTIRACAK.
-- Partnerin kendi yayımlanmış Video veya Podcast eğitimini pasife/aktife alması için RPC.
BEGIN;

CREATE OR REPLACE FUNCTION public.agora_partner_egitim_durum_degistir(
  p_token_ozeti text,
  p_egitim_id uuid,
  p_surum integer,
  p_durum text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_partner uuid;
  e public.agora_partner_egitimleri%ROWTYPE;
BEGIN
  IF p_durum IS NULL OR p_durum NOT IN ('yayinda', 'pasif') OR p_surum IS NULL OR p_surum < 1 THEN
    RETURN 'gecersiz';
  END IF;

  SELECT p.partner_id INTO v_partner
  FROM public.agora_is_partnerleri p
  JOIN public.agora_partner_oturumlari s USING (partner_id)
  JOIN public.agora_partner_profilleri f USING (partner_id)
  WHERE s.token_ozeti = p_token_ozeti
    AND s.bitis_at > now()
    AND s.giris_surum = p.giris_surum
    AND p.ilk_giris_durumu = 'onaylandi'
    AND p.uyelik_durumu = 'onaylandi'
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RETURN 'yetkisiz';
  END IF;

  SELECT * INTO e
  FROM public.agora_partner_egitimleri
  WHERE egitim_id = p_egitim_id
    AND partner_id = v_partner
    AND silindi_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'bulunamadi';
  END IF;

  IF e.durum = p_durum THEN
    RETURN 'tamam';
  END IF;

  IF e.surum <> p_surum THEN
    RETURN 'cakisma';
  END IF;

  IF e.durum = 'taslak' OR e.yayinlandi_at IS NULL THEN
    RETURN 'taslak';
  END IF;

  IF p_durum = 'yayinda' THEN
    IF (e.yayin_araci = 'video' AND NOT EXISTS (
      SELECT 1 FROM public.agora_partner_videolari
      WHERE yukleme_id = e.yayin_egitim_video_id
        AND egitim_id = e.egitim_id
        AND rol = 'egitim'
        AND durum = 'hazir'
        AND sure_saniye > 0
    )) OR (e.yayin_araci = 'podcast' AND NOT EXISTS (
      SELECT 1 FROM public.agora_partner_podcastleri
      WHERE yukleme_id = e.yayin_podcast_id
        AND egitim_id = e.egitim_id
        AND durum = 'hazir'
    )) THEN
      RETURN 'dosya_eksik';
    END IF;

    IF e.koruma_surumu <> 1
      OR e.koruma_kaynak_id IS NULL
      OR e.koruma_kaynak_id IS DISTINCT FROM (
        CASE WHEN e.yayin_araci = 'video' THEN e.yayin_egitim_video_id ELSE e.yayin_podcast_id END
      ) THEN
      RETURN 'koruma_eksik';
    END IF;
  END IF;

  UPDATE public.agora_partner_egitimleri
  SET durum = p_durum,
      surum = surum + 1,
      guncellendi_at = now()
  WHERE egitim_id = e.egitim_id;

  RETURN 'tamam';
END;
$f$;

REVOKE ALL ON FUNCTION public.agora_partner_egitim_durum_degistir(text, uuid, integer, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_egitim_durum_degistir(text, uuid, integer, text)
  TO service_role;

COMMIT;
