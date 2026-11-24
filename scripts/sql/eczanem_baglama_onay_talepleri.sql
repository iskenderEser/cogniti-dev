-- Adım 4 (Seçenek A): Kayıtlı Eczanem üyesini başka bir eczaneye bağlama ve
-- pasife alınmış üyeliği yeniden aktifleştirme işlemlerinde danışan onayı.
-- Üye onaylamadan eczanem_uyelikler bağı kurulmaz veya yeniden aktifleşmez.
-- Bu dosyayı kullanıcı Supabase SQL Editor'da çalıştırır.

BEGIN;

CREATE TABLE IF NOT EXISTS public.eczanem_baglama_talepleri (
  talep_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  musteri_id uuid NOT NULL REFERENCES public.eczanem_musteriler(musteri_id) ON DELETE CASCADE,
  eczane_id uuid NOT NULL REFERENCES public.eclub_eczaneler(eczane_id) ON DELETE CASCADE,
  talep_turu text NOT NULL CHECK (talep_turu IN ('yeni_bag', 'yeniden_aktivasyon')),
  durum text NOT NULL DEFAULT 'bekliyor'
    CHECK (durum IN ('bekliyor', 'onaylandi', 'reddedildi', 'iptal')),
  isteyen_kisi_id uuid NOT NULL,
  sona_erme timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  karar_tarihi timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_eczanem_baglama_tek_bekleyen
  ON public.eczanem_baglama_talepleri (musteri_id, eczane_id)
  WHERE durum = 'bekliyor';

CREATE INDEX IF NOT EXISTS idx_eczanem_baglama_talepleri_musteri
  ON public.eczanem_baglama_talepleri (musteri_id, durum, sona_erme DESC);

CREATE INDEX IF NOT EXISTS idx_eczanem_baglama_talepleri_eczane
  ON public.eczanem_baglama_talepleri (eczane_id, durum, sona_erme DESC);

ALTER TABLE public.eczanem_baglama_talepleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eczanem_baglama_talepleri FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.eczanem_baglama_talepleri TO service_role;

-- Personel işlem günlüğü türlerine bağlama onay talebi olaylarını ekle.
ALTER TABLE public.eczanem_personel_islemleri
  DROP CONSTRAINT IF EXISTS eczanem_personel_islemleri_islem_turu_check;

ALTER TABLE public.eczanem_personel_islemleri
  ADD CONSTRAINT eczanem_personel_islemleri_islem_turu_check
  CHECK (islem_turu IN (
    'musteri_olusturuldu',
    'musteri_baglandi',
    'musteri_yeniden_aktiflestirildi',
    'musteri_aktiflestirildi',
    'musteri_pasife_alindi',
    'siparis_onaylandi',
    'siparis_reddedildi',
    'davet_guncellendi',
    'davet_iptal_edildi',
    'baglama_talebi_acildi',
    'baglama_talebi_iptal_edildi',
    'baglama_talebi_onaylandi',
    'baglama_talebi_reddedildi'
  ));

-- 1) Eczane personeli kayıtlı üye için bağlama / yeniden aktifleştirme onay talebi açar.
--    eczanem_uyelikler tablosu bu adımda aktif edilmez.
CREATE OR REPLACE FUNCTION public.eczanem_baglama_talebi_olustur(
  p_musteri_id uuid,
  p_eczane_id uuid,
  p_islem_yapan_kisi_id uuid
)
RETURNS TABLE(ok boolean, hata text, talep_id uuid, talep_turu text, mevcut_bekleyen boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_musteri_aktif boolean;
  v_auth_user_id uuid;
  v_mevcut_uyelik uuid;
  v_mevcut_aktif boolean;
  v_talep_turu text;
  v_acik_talep public.eczanem_baglama_talepleri;
  v_yeni_talep_id uuid;
BEGIN
  IF NOT public.eczanem_personel_eczane_yetkili_mi(p_islem_yapan_kisi_id, p_eczane_id) THEN
    RETURN QUERY SELECT false, 'Bu eczanede aktif işlem yetkiniz yok.', NULL::uuid, NULL::text, false;
    RETURN;
  END IF;

  SELECT m.aktif_mi, m.auth_user_id
  INTO v_musteri_aktif, v_auth_user_id
  FROM public.eczanem_musteriler m
  WHERE m.musteri_id = p_musteri_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Üye bulunamadı.', NULL::uuid, NULL::text, false;
    RETURN;
  END IF;
  IF NOT v_musteri_aktif OR v_auth_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Üyenin genel hesabı aktif değil; bağlantı talebi oluşturulamaz.', NULL::uuid, NULL::text, false;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.eczanem_uyelik_davetleri d
    WHERE d.auth_user_id = v_auth_user_id
      AND d.durum <> 'tamamlandi'
  ) THEN
    RETURN QUERY SELECT false, 'Bu üyenin bekleyen üyelik daveti henüz tamamlanmamış.', NULL::uuid, NULL::text, false;
    RETURN;
  END IF;

  SELECT u.uyelik_id, u.aktif_mi
  INTO v_mevcut_uyelik, v_mevcut_aktif
  FROM public.eczanem_uyelikler u
  WHERE u.musteri_id = p_musteri_id
    AND u.eczane_id = p_eczane_id
  FOR UPDATE;

  IF v_mevcut_uyelik IS NOT NULL AND v_mevcut_aktif THEN
    RETURN QUERY SELECT false, 'Bu müşteri zaten eczanenizin aktif üyesi.', NULL::uuid, NULL::text, false;
    RETURN;
  END IF;

  v_talep_turu := CASE WHEN v_mevcut_uyelik IS NULL THEN 'yeni_bag' ELSE 'yeniden_aktivasyon' END;

  SELECT *
  INTO v_acik_talep
  FROM public.eczanem_baglama_talepleri t
  WHERE t.musteri_id = p_musteri_id
    AND t.eczane_id = p_eczane_id
    AND t.durum = 'bekliyor'
  FOR UPDATE;

  IF FOUND THEN
    IF v_acik_talep.sona_erme > now() THEN
      RETURN QUERY SELECT true, NULL::text, v_acik_talep.talep_id, v_acik_talep.talep_turu, true;
      RETURN;
    END IF;
    UPDATE public.eczanem_baglama_talepleri
    SET durum = 'iptal', karar_tarihi = now()
    WHERE public.eczanem_baglama_talepleri.talep_id = v_acik_talep.talep_id;
  END IF;

  INSERT INTO public.eczanem_baglama_talepleri (
    musteri_id, eczane_id, talep_turu, durum, isteyen_kisi_id, sona_erme
  ) VALUES (
    p_musteri_id, p_eczane_id, v_talep_turu, 'bekliyor', p_islem_yapan_kisi_id, now() + interval '7 days'
  ) RETURNING public.eczanem_baglama_talepleri.talep_id INTO v_yeni_talep_id;

  INSERT INTO public.eczanem_personel_islemleri (
    eczane_id, kisi_id, islem_turu, hedef_turu, hedef_id, detay
  ) VALUES (
    p_eczane_id,
    p_islem_yapan_kisi_id,
    'baglama_talebi_acildi',
    'musteri',
    p_musteri_id,
    jsonb_build_object('talep_id', v_yeni_talep_id, 'talep_turu', v_talep_turu)
  );

  RETURN QUERY SELECT true, NULL::text, v_yeni_talep_id, v_talep_turu, false;
END;
$$;

-- 2) Danışan (üye) kendi hesabına gelen bağlama/yeniden aktifleştirme talebini onaylar veya reddeder.
CREATE OR REPLACE FUNCTION public.eczanem_baglama_talebi_karar_ver(
  p_talep_id uuid,
  p_auth_user_id uuid,
  p_karar text
)
RETURNS TABLE(ok boolean, hata text, eczane_id uuid, talep_turu text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_talep public.eczanem_baglama_talepleri;
  v_musteri_id uuid;
  v_uyelik_id uuid;
BEGIN
  IF p_karar NOT IN ('onayla', 'reddet') THEN
    RETURN QUERY SELECT false, 'Geçersiz karar.', NULL::uuid, NULL::text;
    RETURN;
  END IF;

  SELECT m.musteri_id
  INTO v_musteri_id
  FROM public.eczanem_musteriler m
  WHERE m.auth_user_id = p_auth_user_id
    AND m.aktif_mi = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Aktif üye hesabınız bulunamadı.', NULL::uuid, NULL::text;
    RETURN;
  END IF;

  SELECT *
  INTO v_talep
  FROM public.eczanem_baglama_talepleri t
  WHERE t.talep_id = p_talep_id
    AND t.musteri_id = v_musteri_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Bağlantı talebi bulunamadı.', NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF v_talep.durum <> 'bekliyor' THEN
    RETURN QUERY SELECT false, 'Bu bağlantı talebi zaten sonuçlanmış.', NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF v_talep.sona_erme <= now() THEN
    UPDATE public.eczanem_baglama_talepleri
    SET durum = 'iptal', karar_tarihi = now()
    WHERE talep_id = v_talep.talep_id;
    RETURN QUERY SELECT false, 'Bu bağlantı talebinin süresi dolmuş.', NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF p_karar = 'reddet' THEN
    UPDATE public.eczanem_baglama_talepleri
    SET durum = 'reddedildi', karar_tarihi = now()
    WHERE talep_id = v_talep.talep_id;

    INSERT INTO public.eczanem_personel_islemleri (
      eczane_id, kisi_id, islem_turu, hedef_turu, hedef_id, detay
    ) VALUES (
      v_talep.eczane_id,
      v_talep.isteyen_kisi_id,
      'baglama_talebi_reddedildi',
      'musteri',
      v_musteri_id,
      jsonb_build_object('talep_id', v_talep.talep_id, 'talep_turu', v_talep.talep_turu)
    );

    RETURN QUERY SELECT true, NULL::text, v_talep.eczane_id, v_talep.talep_turu;
    RETURN;
  END IF;

  -- Onay: talebi kapat ve eczane üyeliğini aynı transaction içinde aktif et.
  UPDATE public.eczanem_baglama_talepleri
  SET durum = 'onaylandi', karar_tarihi = now()
  WHERE talep_id = v_talep.talep_id;

  INSERT INTO public.eczanem_uyelikler (
    musteri_id, eczane_id, aktif_mi, son_islem_yapan_kisi_id, son_islem_tarihi
  ) VALUES (
    v_musteri_id, v_talep.eczane_id, true, v_talep.isteyen_kisi_id, now()
  )
  ON CONFLICT (musteri_id, eczane_id) DO UPDATE
  SET aktif_mi = true,
      son_islem_yapan_kisi_id = EXCLUDED.son_islem_yapan_kisi_id,
      son_islem_tarihi = EXCLUDED.son_islem_tarihi
  RETURNING uyelik_id INTO v_uyelik_id;

  INSERT INTO public.eczanem_personel_islemleri (
    eczane_id, kisi_id, islem_turu, hedef_turu, hedef_id, detay
  ) VALUES (
    v_talep.eczane_id,
    v_talep.isteyen_kisi_id,
    'baglama_talebi_onaylandi',
    'uyelik',
    v_uyelik_id,
    jsonb_build_object('talep_id', v_talep.talep_id, 'talep_turu', v_talep.talep_turu)
  );

  RETURN QUERY SELECT true, NULL::text, v_talep.eczane_id, v_talep.talep_turu;
END;
$$;

-- 3) Eczane personeli bekleyen kendi bağlantı talebini iptal edebilir.
CREATE OR REPLACE FUNCTION public.eczanem_baglama_talebi_iptal_et(
  p_talep_id uuid,
  p_eczane_id uuid,
  p_islem_yapan_kisi_id uuid
)
RETURNS TABLE(ok boolean, hata text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_talep public.eczanem_baglama_talepleri;
BEGIN
  IF NOT public.eczanem_personel_eczane_yetkili_mi(p_islem_yapan_kisi_id, p_eczane_id) THEN
    RETURN QUERY SELECT false, 'Bu eczanede aktif işlem yetkiniz yok.';
    RETURN;
  END IF;

  SELECT *
  INTO v_talep
  FROM public.eczanem_baglama_talepleri t
  WHERE t.talep_id = p_talep_id
    AND t.eczane_id = p_eczane_id
  FOR UPDATE;

  IF NOT FOUND OR v_talep.durum <> 'bekliyor' THEN
    RETURN QUERY SELECT false, 'Bekleyen bağlantı talebi bulunamadı.';
    RETURN;
  END IF;

  UPDATE public.eczanem_baglama_talepleri
  SET durum = 'iptal', karar_tarihi = now()
  WHERE talep_id = v_talep.talep_id;

  INSERT INTO public.eczanem_personel_islemleri (
    eczane_id, kisi_id, islem_turu, hedef_turu, hedef_id, detay
  ) VALUES (
    p_eczane_id,
    p_islem_yapan_kisi_id,
    'baglama_talebi_iptal_edildi',
    'musteri',
    v_talep.musteri_id,
    jsonb_build_object('talep_id', v_talep.talep_id, 'talep_turu', v_talep.talep_turu)
  );

  RETURN QUERY SELECT true, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION
  public.eczanem_baglama_talebi_olustur(uuid, uuid, uuid),
  public.eczanem_baglama_talebi_karar_ver(uuid, uuid, text),
  public.eczanem_baglama_talebi_iptal_et(uuid, uuid, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.eczanem_baglama_talebi_olustur(uuid, uuid, uuid),
  public.eczanem_baglama_talebi_karar_ver(uuid, uuid, text),
  public.eczanem_baglama_talebi_iptal_et(uuid, uuid, uuid)
TO service_role;

NOTIFY pgrst, $$reload schema$$;

COMMIT;
