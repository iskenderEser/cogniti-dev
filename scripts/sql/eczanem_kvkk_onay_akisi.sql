-- Adım 2: Eczanem KVKK / açık rıza onayı danışanın kendi davet kabulüne bağlanır.
-- Davet bekleyen yeni üyede kvkk_onay_tarihi NULL bırakılır; üye şifre oluşturma
-- ekranında KVKK aydınlatma metnini onaylayıp daveti tamamladığında atomik olarak yazılır.
-- Bu dosyayı kullanıcı Supabase SQL Editor'da çalıştırır.

BEGIN;

ALTER TABLE public.eczanem_musteriler
  ALTER COLUMN kvkk_onay_tarihi DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.eczanem_yeni_musteri_provizyonu_izli(
  p_telefon text,
  p_ad_soyad text,
  p_auth_user_id uuid,
  p_eczane_id uuid,
  p_islem_yapan_kisi_id uuid,
  p_ad text DEFAULT NULL,
  p_soyad text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fonksiyon$
DECLARE
  v_musteri_id uuid;
  v_uyelik_id uuid;
  v_ad text;
  v_soyad text;
  v_ad_soyad text;
  v_davet_bekliyor boolean := false;
BEGIN
  IF NOT public.eczanem_personel_eczane_yetkili_mi(p_islem_yapan_kisi_id, p_eczane_id) THEN
    RAISE EXCEPTION 'Bu eczanede aktif işlem yetkiniz yok.' USING ERRCODE = 'P0001';
  END IF;

  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Müşteri Auth kimliği olmadan aktifleştirilemez.' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE((au.raw_app_meta_data->>'eczanem_davet_bekliyor') = 'true', false)
  INTO v_davet_bekliyor
  FROM auth.users au
  WHERE au.id = p_auth_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Müşteri Auth hesabı bulunamadı.' USING ERRCODE = 'P0001';
  END IF;

  v_ad := COALESCE(NULLIF(trim(p_ad), ''), split_part(trim(p_ad_soyad), ' ', 1));
  v_soyad := COALESCE(NULLIF(trim(p_soyad), ''), substr(trim(p_ad_soyad), length(split_part(trim(p_ad_soyad), ' ', 1)) + 2));
  v_ad_soyad := COALESCE(NULLIF(trim(p_ad_soyad), ''), trim(concat_ws(' ', v_ad, v_soyad)));

  INSERT INTO public.eczanem_musteriler (
    telefon, ad, soyad, ad_soyad, kvkk_onay_tarihi, aktif_mi, auth_user_id
  ) VALUES (
    p_telefon,
    v_ad,
    v_soyad,
    v_ad_soyad,
    CASE WHEN v_davet_bekliyor THEN NULL ELSE now() END,
    true,
    p_auth_user_id
  ) RETURNING musteri_id INTO v_musteri_id;

  INSERT INTO public.eczanem_uyelikler (
    musteri_id, eczane_id, aktif_mi, son_islem_yapan_kisi_id, son_islem_tarihi
  ) VALUES (
    v_musteri_id, p_eczane_id, true, p_islem_yapan_kisi_id, now()
  ) RETURNING uyelik_id INTO v_uyelik_id;

  INSERT INTO public.eczanem_personel_islemleri (
    eczane_id, kisi_id, islem_turu, hedef_turu, hedef_id,
    detay
  ) VALUES (
    p_eczane_id, p_islem_yapan_kisi_id, 'musteri_olusturuldu', 'musteri', v_musteri_id,
    jsonb_build_object('uyelik_id', v_uyelik_id)
  );

  RETURN v_musteri_id;
END;
$fonksiyon$;

REVOKE ALL ON FUNCTION public.eczanem_yeni_musteri_provizyonu_izli(text, text, uuid, uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_yeni_musteri_provizyonu_izli(text, text, uuid, uuid, uuid, text, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.eczanem_davet_islem_bitir(
  p_auth uuid,
  p_lease uuid,
  p_basarili boolean
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_guncellendi boolean := false;
BEGIN
  UPDATE public.eczanem_uyelik_davetleri
  SET
    durum = CASE WHEN p_basarili THEN 'tamamlandi' ELSE 'bekliyor' END,
    lease_id = NULL,
    lease_sonu = NULL
  WHERE auth_user_id = p_auth
    AND lease_id = p_lease
    AND durum = 'isleniyor';

  v_guncellendi := FOUND;

  IF v_guncellendi AND p_basarili THEN
    UPDATE public.eczanem_musteriler
    SET kvkk_onay_tarihi = COALESCE(kvkk_onay_tarihi, now())
    WHERE auth_user_id = p_auth;
  END IF;

  RETURN v_guncellendi;
END;
$$;

REVOKE ALL ON FUNCTION public.eczanem_davet_islem_bitir(uuid, uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_davet_islem_bitir(uuid, uuid, boolean)
  TO service_role;

COMMIT;
