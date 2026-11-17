-- Agora: Tek aşamalı iş partneri başvurusu, CV bucket'ı ve e-posta davetli şifre oluşturma akışı.
-- Önce agora_partner_uyelik_kaydi.sql ve agora_partner_ilk_giris_onayi.sql kurulmuş olmalıdır.
-- Tam dosyayı tek parça çalıştırın. Mevcut kayıtları korur.
BEGIN;

ALTER TABLE public.agora_is_partnerleri
  ADD COLUMN IF NOT EXISTS basvuru_turu text NOT NULL DEFAULT 'kisisel'
    CHECK (basvuru_turu IN ('kisisel', 'kurumsal')),
  ADD COLUMN IF NOT EXISTS tc_no text
    CHECK (tc_no IS NULL OR tc_no ~ '^[1-9][0-9]{10}$'),
  ADD COLUMN IF NOT EXISTS uzmanliklar text[],
  ADD COLUMN IF NOT EXISTS kendini_tanitma text
    CHECK (kendini_tanitma IS NULL OR char_length(kendini_tanitma) <= 4000),
  ADD COLUMN IF NOT EXISTS ozgecmis_yolu text,
  ADD COLUMN IF NOT EXISTS ozgecmis_adi text,
  ADD COLUMN IF NOT EXISTS banka_adi text
    CHECK (banka_adi IS NULL OR char_length(banka_adi) <= 120),
  ADD COLUMN IF NOT EXISTS iban text
    CHECK (iban IS NULL OR iban ~ '^TR[0-9]{24}$'),
  ADD COLUMN IF NOT EXISTS hesap_adi text
    CHECK (hesap_adi IS NULL OR char_length(hesap_adi) <= 150),
  ADD COLUMN IF NOT EXISTS firma_adi text
    CHECK (firma_adi IS NULL OR char_length(firma_adi) <= 160),
  ADD COLUMN IF NOT EXISTS web_adresi text
    CHECK (web_adresi IS NULL OR char_length(web_adresi) <= 255),
  ADD COLUMN IF NOT EXISTS vergi_no text
    CHECK (vergi_no IS NULL OR vergi_no ~ '^[0-9]{10}$'),
  ADD COLUMN IF NOT EXISTS vergi_dairesi text
    CHECK (vergi_dairesi IS NULL OR char_length(vergi_dairesi) <= 120),
  ADD COLUMN IF NOT EXISTS adres text
    CHECK (adres IS NULL OR char_length(adres) <= 500),
  ADD COLUMN IF NOT EXISTS davet_hash text
    CHECK (davet_hash IS NULL OR davet_hash ~ '^[a-f0-9]{64}$'),
  ADD COLUMN IF NOT EXISTS davet_bitis_at timestamptz,
  ADD COLUMN IF NOT EXISTS uyelik_karar_at timestamptz,
  ADD COLUMN IF NOT EXISTS uyelik_karar_veren uuid;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agora-partner-cvleri',
  'agora-partner-cvleri',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.agora_partner_basvuru_kaydet(
  p_basvuru_turu text,
  p_ad_soyad text,
  p_eposta text,
  p_cep_telefonu text,
  p_tc_no text DEFAULT NULL,
  p_uzmanliklar text[] DEFAULT NULL,
  p_kendini_tanitma text DEFAULT NULL,
  p_banka_adi text DEFAULT NULL,
  p_iban text DEFAULT NULL,
  p_hesap_adi text DEFAULT NULL,
  p_firma_adi text DEFAULT NULL,
  p_web_adresi text DEFAULT NULL,
  p_vergi_no text DEFAULT NULL,
  p_vergi_dairesi text DEFAULT NULL,
  p_adres text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fonksiyon$
DECLARE
  v_partner_id uuid;
BEGIN
  INSERT INTO public.agora_is_partnerleri (
    basvuru_turu,
    ad_soyad,
    eposta,
    cep_telefonu,
    tc_no,
    uzmanliklar,
    kendini_tanitma,
    banka_adi,
    iban,
    hesap_adi,
    firma_adi,
    web_adresi,
    vergi_no,
    vergi_dairesi,
    adres
  )
  VALUES (
    p_basvuru_turu,
    p_ad_soyad,
    p_eposta,
    p_cep_telefonu,
    p_tc_no,
    p_uzmanliklar,
    p_kendini_tanitma,
    p_banka_adi,
    p_iban,
    p_hesap_adi,
    p_firma_adi,
    p_web_adresi,
    p_vergi_no,
    p_vergi_dairesi,
    p_adres
  )
  ON CONFLICT DO NOTHING
  RETURNING partner_id INTO v_partner_id;

  RETURN v_partner_id;
END;
$fonksiyon$;

CREATE OR REPLACE FUNCTION public.agora_partner_ozgecmis_bagla(
  p_partner_id uuid,
  p_ozgecmis_yolu text,
  p_ozgecmis_adi text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fonksiyon$
BEGIN
  UPDATE public.agora_is_partnerleri
  SET ozgecmis_yolu = p_ozgecmis_yolu,
      ozgecmis_adi = p_ozgecmis_adi
  WHERE partner_id = p_partner_id;
  RETURN FOUND;
END;
$fonksiyon$;

CREATE OR REPLACE FUNCTION public.agora_partner_basvuru_geri_al(
  p_partner_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fonksiyon$
BEGIN
  DELETE FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id;
END;
$fonksiyon$;

CREATE OR REPLACE FUNCTION public.agora_partner_basvurulari(
  p_admin_id uuid,
  p_durum text DEFAULT 'bekliyor',
  p_sayfa integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_liste jsonb;
  v_toplam integer;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF p_durum IS NULL OR p_durum NOT IN ('bekliyor', 'onaylandi', 'reddedildi', 'tumu')
     OR p_sayfa IS NULL OR p_sayfa < 1 OR p_sayfa > 100000 THEN
    RAISE EXCEPTION 'Geçersiz seçim';
  END IF;

  SELECT count(*) INTO v_toplam
  FROM public.agora_is_partnerleri
  WHERE p_durum = 'tumu' OR ilk_giris_durumu = p_durum;

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.olusturuldu_at DESC, r.partner_id), '[]'::jsonb)
  INTO v_liste
  FROM (
    SELECT
      partner_id,
      basvuru_turu,
      ad_soyad,
      eposta,
      cep_telefonu,
      tc_no,
      coalesce(uzmanliklar, ARRAY[]::text[]) AS uzmanliklar,
      kendini_tanitma,
      ozgecmis_adi,
      (ozgecmis_yolu IS NOT NULL) AS ozgecmis_var,
      banka_adi,
      iban,
      hesap_adi,
      firma_adi,
      web_adresi,
      vergi_no,
      vergi_dairesi,
      adres,
      olusturuldu_at,
      ilk_giris_durumu,
      uyelik_durumu,
      karar_at,
      giris_surum,
      davet_bitis_at,
      (sifre_ozeti IS NOT NULL) AS sifre_tanimli
    FROM public.agora_is_partnerleri
    WHERE p_durum = 'tumu' OR ilk_giris_durumu = p_durum
    ORDER BY olusturuldu_at DESC, partner_id
    LIMIT 20 OFFSET (p_sayfa - 1) * 20
  ) r;

  RETURN jsonb_build_object('kayitlar', v_liste, 'toplam', v_toplam);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_tek_asama_karar(
  p_admin_id uuid,
  p_partner_id uuid,
  p_karar text,
  p_surum integer,
  p_davet_hash text DEFAULT NULL,
  p_davet_bitis_at timestamptz DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v public.agora_is_partnerleri%ROWTYPE;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF p_karar IS NULL OR p_karar NOT IN ('onaylandi', 'reddedildi') THEN
    RAISE EXCEPTION 'Geçersiz karar';
  END IF;
  IF p_karar = 'onaylandi' AND (
    p_davet_hash IS NULL OR p_davet_hash !~ '^[a-f0-9]{64}$' OR p_davet_bitis_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Davet bilgisi zorunlu';
  END IF;

  SELECT * INTO v FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id FOR UPDATE;
  IF NOT FOUND OR p_surum IS NULL OR v.giris_surum <> p_surum THEN
    RETURN jsonb_build_object('durum', 'cakisma');
  END IF;

  IF p_karar = 'onaylandi' THEN
    UPDATE public.agora_is_partnerleri
    SET
      ilk_giris_durumu = 'onaylandi',
      uyelik_durumu = 'onaylandi',
      davet_hash = p_davet_hash,
      davet_bitis_at = p_davet_bitis_at,
      giris_surum = giris_surum + 1,
      karar_at = now(),
      karar_veren = p_admin_id,
      uyelik_karar_at = now(),
      uyelik_karar_veren = p_admin_id,
      giris_deneme = 0,
      giris_pencere_at = NULL
    WHERE partner_id = p_partner_id;
  ELSE
    UPDATE public.agora_is_partnerleri
    SET
      ilk_giris_durumu = 'reddedildi',
      uyelik_durumu = 'reddedildi',
      sifre_ozeti = NULL,
      davet_hash = NULL,
      davet_bitis_at = NULL,
      giris_surum = giris_surum + 1,
      karar_at = now(),
      karar_veren = p_admin_id,
      uyelik_karar_at = now(),
      uyelik_karar_veren = p_admin_id,
      giris_deneme = 0,
      giris_pencere_at = NULL
    WHERE partner_id = p_partner_id;
  END IF;

  INSERT INTO public.agora_partner_onay_gecmisi(partner_id, admin_id, onceki_durum, yeni_durum, giris_surum)
  VALUES (p_partner_id, p_admin_id, v.ilk_giris_durumu, p_karar, v.giris_surum + 1);

  DELETE FROM public.agora_partner_oturumlari WHERE partner_id = p_partner_id;

  RETURN jsonb_build_object(
    'durum', 'tamam',
    'eposta', v.eposta,
    'ad_soyad', v.ad_soyad,
    'basvuru_turu', v.basvuru_turu,
    'firma_adi', v.firma_adi,
    'giris_surum', v.giris_surum + 1
  );
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_davet_iptal(
  p_admin_id uuid,
  p_partner_id uuid,
  p_davet_hash text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  UPDATE public.agora_is_partnerleri
  SET davet_hash = NULL,
      davet_bitis_at = NULL
  WHERE partner_id = p_partner_id
    AND davet_hash = p_davet_hash;
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_cv_yolu(
  p_admin_id uuid,
  p_partner_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_yol text;
  v_adi text;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  SELECT ozgecmis_yolu, ozgecmis_adi INTO v_yol, v_adi
  FROM public.agora_is_partnerleri
  WHERE partner_id = p_partner_id;
  IF NOT FOUND OR v_yol IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object('yol', v_yol, 'adi', coalesce(v_adi, 'ozgecmis'));
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_davet_dogrula(
  p_davet_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_ad text;
  v_eposta text;
BEGIN
  IF p_davet_hash IS NULL OR p_davet_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN NULL;
  END IF;

  SELECT ad_soyad, eposta INTO v_ad, v_eposta
  FROM public.agora_is_partnerleri
  WHERE davet_hash = p_davet_hash
    AND ilk_giris_durumu = 'onaylandi'
    AND davet_bitis_at > now();

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object('ad_soyad', v_ad, 'eposta', v_eposta);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_davet_sifre_belirle(
  p_davet_hash text,
  p_sifre_ozeti text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
BEGIN
  IF p_davet_hash IS NULL OR p_davet_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN false;
  END IF;
  IF p_sifre_ozeti IS NULL OR p_sifre_ozeti !~ '^scrypt\$32768\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$' THEN
    RETURN false;
  END IF;

  UPDATE public.agora_is_partnerleri
  SET
    sifre_ozeti = p_sifre_ozeti,
    davet_hash = NULL,
    davet_bitis_at = NULL,
    giris_surum = giris_surum + 1,
    giris_deneme = 0,
    giris_pencere_at = NULL
  WHERE davet_hash = p_davet_hash
    AND ilk_giris_durumu = 'onaylandi'
    AND davet_bitis_at > now();

  RETURN FOUND;
END;
$f$;

REVOKE ALL ON FUNCTION public.agora_partner_basvuru_kaydet(text,text,text,text,text,text[],text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_basvuru_kaydet(text,text,text,text,text,text[],text,text,text,text,text,text,text,text,text) TO service_role;

REVOKE ALL ON FUNCTION public.agora_partner_ozgecmis_bagla(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_ozgecmis_bagla(uuid,text,text) TO service_role;

REVOKE ALL ON FUNCTION public.agora_partner_basvuru_geri_al(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_basvuru_geri_al(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.agora_partner_basvurulari(uuid,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_basvurulari(uuid,text,integer) TO service_role;

REVOKE ALL ON FUNCTION public.agora_partner_tek_asama_karar(uuid,uuid,text,integer,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_tek_asama_karar(uuid,uuid,text,integer,text,timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.agora_partner_davet_iptal(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_davet_iptal(uuid,uuid,text) TO service_role;

REVOKE ALL ON FUNCTION public.agora_partner_cv_yolu(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_cv_yolu(uuid,uuid) TO service_role;

REVOKE ALL ON FUNCTION public.agora_partner_davet_dogrula(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_davet_dogrula(text) TO service_role;

REVOKE ALL ON FUNCTION public.agora_partner_davet_sifre_belirle(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_davet_sifre_belirle(text,text) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT (
  to_regprocedure('public.agora_partner_basvuru_kaydet(text,text,text,text,text,text[],text,text,text,text,text,text,text,text,text)') IS NOT NULL
  AND to_regprocedure('public.agora_partner_tek_asama_karar(uuid,uuid,text,integer,text,timestamptz)') IS NOT NULL
  AND to_regprocedure('public.agora_partner_davet_dogrula(text)') IS NOT NULL
  AND to_regprocedure('public.agora_partner_davet_sifre_belirle(text,text)') IS NOT NULL
  AND to_regprocedure('public.agora_partner_cv_yolu(uuid,uuid)') IS NOT NULL
  AND EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'agora-partner-cvleri' AND public = false)
) AS agora_partner_tek_asama_basvuru_hazir;
