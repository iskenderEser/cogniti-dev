-- Süreç 14 & 15: Agora e-posta bildirimleri için salt okunur SECURITY DEFINER okuma yardımcısı.
-- Kullanıcı çalıştırır. Tablo izinlerini (REVOKE) açmaz; yalnız service_role çağırabilir.
BEGIN;

CREATE OR REPLACE FUNCTION public.agora_eposta_bildirim_oku(
  p_tur text,
  p_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_sonuc jsonb;
BEGIN
  IF p_id IS NULL OR p_tur IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_tur = 'partner' THEN
    SELECT jsonb_build_object(
      'partner_id', p.partner_id,
      'ad_soyad', p.ad_soyad,
      'eposta', p.eposta,
      'firma_adi', coalesce(pf.sirket_adi, p.firma_adi)
    )
    INTO v_sonuc
    FROM public.agora_is_partnerleri p
    LEFT JOIN public.agora_partner_profilleri pf ON pf.partner_id = p.partner_id
    WHERE p.partner_id = p_id;
    RETURN v_sonuc;
  END IF;

  IF p_tur = 'yayin_siparis' THEN
    SELECT jsonb_build_object(
      'siparis_id', s.siparis_id,
      'egitim_id', s.egitim_id,
      'partner_id', s.partner_id,
      'partner_egitim_id', s.partner_egitim_id,
      'egitim_adi', s.egitim_adi,
      'yayin_araci', coalesce(s.paket->>'yayin_araci', 'video'),
      'satin_alma_bedeli', s.satin_alma_bedeli,
      'odenecek_tutar', s.odenecek_tutar,
      'token_tutari', s.token_tutari,
      'partner_ad_soyad', p.ad_soyad,
      'partner_eposta', p.eposta,
      'partner_sirket_adi', coalesce(pf.sirket_adi, p.firma_adi, p.ad_soyad),
      'alici_ad_soyad', btrim(concat_ws(' ', k.ad, k.soyad)),
      'alici_eposta', k.eposta,
      'alici_firma_adi', coalesce(f.firma_adi, 'Firma')
    )
    INTO v_sonuc
    FROM public.agora_siparisleri s
    JOIN public.agora_is_partnerleri p ON p.partner_id = s.partner_id
    LEFT JOIN public.agora_partner_profilleri pf ON pf.partner_id = s.partner_id
    LEFT JOIN public.kullanicilar k ON k.kullanici_id = s.alici_id
    LEFT JOIN public.firmalar f ON f.firma_id = s.firma_id
    WHERE s.siparis_id = p_id;
    RETURN v_sonuc;
  END IF;

  IF p_tur = 'canli_siparis' THEN
    SELECT jsonb_build_object(
      'siparis_id', s.siparis_id,
      'oturum_id', s.oturum_id,
      'canli_egitim_id', s.canli_egitim_id,
      'partner_id', s.partner_id,
      'partner_egitim_id', s.partner_egitim_id,
      'egitim_adi', s.egitim_adi,
      'baslangic_at', s.baslangic_at,
      'sure_dakika', s.sure_dakika,
      'kapasite', s.kapasite,
      'satin_alma_bedeli', s.satin_alma_bedeli,
      'odenecek_tutar', s.odenecek_tutar,
      'token_tutari', s.token_tutari,
      'partner_ad_soyad', p.ad_soyad,
      'partner_eposta', p.eposta,
      'partner_sirket_adi', coalesce(pf.sirket_adi, p.firma_adi, p.ad_soyad),
      'alici_ad_soyad', btrim(concat_ws(' ', k.ad, k.soyad)),
      'alici_eposta', k.eposta,
      'alici_firma_adi', coalesce(f.firma_adi, 'Firma')
    )
    INTO v_sonuc
    FROM public.agora_canli_siparisleri s
    JOIN public.agora_is_partnerleri p ON p.partner_id = s.partner_id
    LEFT JOIN public.agora_partner_profilleri pf ON pf.partner_id = s.partner_id
    LEFT JOIN public.kullanicilar k ON k.kullanici_id = s.alici_id
    LEFT JOIN public.firmalar f ON f.firma_id = s.firma_id
    WHERE s.siparis_id = p_id;
    RETURN v_sonuc;
  END IF;

  RETURN NULL;
END;
$f$;

REVOKE ALL ON FUNCTION public.agora_eposta_bildirim_oku(text, uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_eposta_bildirim_oku(text, uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
