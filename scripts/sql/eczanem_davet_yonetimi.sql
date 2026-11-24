-- Adım 3: Eczanem davet durumu yönetimi, aktif üye eşiği/dağıtım ayrımı,
-- bekleyen davette bilgi düzeltme ve bekleyen daveti iptal etme sözleşmeleri.
-- Bu dosyayı kullanıcı Supabase SQL Editor'da çalıştırır.

BEGIN;

-- 1) Eczane üye listesi görünümüne davet durumu ve ad/soyad alanlarını ekle
--    (mevcut 7 kolonun sırası ve tipi korunur).
CREATE OR REPLACE VIEW public.v_eczanem_musteri_liste_admin
WITH (security_barrier = true)
AS
SELECT
  u.eczane_id,
  u.musteri_id,
  m.ad_soyad,
  m.telefon,
  au.email::text AS eposta,
  u.aktif_mi,
  u.created_at,
  m.ad,
  m.soyad,
  (d.auth_user_id IS NOT NULL AND d.durum <> 'tamamlandi') AS davet_bekliyor,
  COALESCE(d.gonderildi, false) AS davet_gonderildi
FROM public.eczanem_uyelikler u
JOIN public.eczanem_musteriler m ON m.musteri_id = u.musteri_id
LEFT JOIN auth.users au ON au.id = m.auth_user_id
LEFT JOIN public.eczanem_uyelik_davetleri d ON d.auth_user_id = m.auth_user_id;

REVOKE ALL ON TABLE public.v_eczanem_musteri_liste_admin FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.v_eczanem_musteri_liste_admin TO service_role;

-- 2) Aynı e-postaya 60 sn hız sınırı korunur; yanlış girilen e-posta düzeltildiyse
--    yeni adrese davet bekletilmeden gönderilebilir.
CREATE OR REPLACE FUNCTION public.eczanem_davet_yenile(
  p_auth uuid,
  p_hash text,
  p_eposta text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v public.eczanem_uyelik_davetleri;
  v_id uuid := gen_random_uuid();
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auth::text, 29));
  SELECT * INTO v
  FROM public.eczanem_uyelik_davetleri
  WHERE auth_user_id = p_auth
  FOR UPDATE;

  IF v.durum = 'tamamlandi' THEN
    RAISE EXCEPTION 'Üyelik zaten tamamlanmış.';
  END IF;
  IF v.lease_sonu > now() THEN
    RAISE EXCEPTION 'Şifre oluşturma işlemi sürüyor.';
  END IF;
  IF v.gonderildi
     AND lower(COALESCE(v.eposta, '')) = lower(COALESCE(p_eposta, ''))
     AND v.created_at > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'Yeni davet için bir dakika bekleyin.';
  END IF;

  INSERT INTO public.eczanem_uyelik_davetleri (
    auth_user_id, davet_id, token_hash, eposta, sona_erme
  )
  VALUES (
    p_auth, v_id, p_hash, p_eposta, now() + interval '24 hours'
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    davet_id = v_id,
    token_hash = p_hash,
    eposta = p_eposta,
    sona_erme = now() + interval '24 hours',
    durum = 'bekliyor',
    lease_id = NULL,
    lease_sonu = NULL,
    gonderildi = false,
    created_at = now();

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.eczanem_davet_yenile(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_davet_yenile(uuid, text, text) TO service_role;

-- 3) UTT → eczane gönderiminde davet aşamasındaki üyeler aktif üye eşiğine sayılmaz.
CREATE OR REPLACE FUNCTION public.eczanem_utt_eczaneye_gonder(
  p_utt_id uuid,
  p_yayin_id uuid,
  p_eczane_id uuid
)
RETURNS TABLE(ok boolean, hata text, gonderim_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fonksiyon$
DECLARE
  v_firma_id uuid;
  v_takim_id uuid;
  v_yayin_firma_id uuid;
  v_yayin_takim_id uuid;
  v_yayin_durum text;
  v_hedef_roller text[];
  v_esik integer := 10;
  v_aktif_uye integer := 0;
  v_gonderim_id uuid;
BEGIN
  IF p_utt_id IS NULL OR p_yayin_id IS NULL OR p_eczane_id IS NULL THEN
    RETURN QUERY SELECT false, 'UTT, yayın ve eczane zorunludur.', NULL::uuid;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('eczanem_utt_gonderim:' || p_yayin_id::text || ':' || p_eczane_id::text, 0)
  );

  SELECT k.firma_id, k.takim_id
  INTO v_firma_id, v_takim_id
  FROM public.kullanicilar k
  JOIN public.firmalar f ON f.firma_id = k.firma_id
  WHERE k.kullanici_id = p_utt_id
    AND k.rol IN ('utt', 'kd_utt')
    AND k.aktif_mi = true
    AND f.aktif = true
    AND f.eczanem_aktif = true;

  IF NOT FOUND OR v_firma_id IS NULL THEN
    RETURN QUERY SELECT false, 'UTT veya Eczanem firma erişimi geçerli değil.', NULL::uuid;
    RETURN;
  END IF;

  PERFORM 1
  FROM public.yayin_yonetimi yy
  WHERE yy.yayin_id = p_yayin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Yayın bulunamadı.', NULL::uuid;
    RETURN;
  END IF;

  SELECT y.firma_id, y.takim_id, y.durum, y.hedef_roller
  INTO v_yayin_firma_id, v_yayin_takim_id, v_yayin_durum, v_hedef_roller
  FROM public.v_yayin_detay y
  WHERE y.yayin_id = p_yayin_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Yayın bulunamadı.', NULL::uuid;
    RETURN;
  END IF;
  IF v_yayin_durum IS DISTINCT FROM 'yayinda' THEN
    RETURN QUERY SELECT false, 'Bu yayın şu an yayında değil.', NULL::uuid;
    RETURN;
  END IF;
  IF NOT ('eczanem' = ANY(COALESCE(v_hedef_roller, ARRAY[]::text[]))) THEN
    RETURN QUERY SELECT false, 'Bu yayın Eczanem kanalına ait değil.', NULL::uuid;
    RETURN;
  END IF;
  IF v_yayin_firma_id IS DISTINCT FROM v_firma_id
     OR (v_yayin_takim_id IS NOT NULL AND v_yayin_takim_id IS DISTINCT FROM v_takim_id) THEN
    RETURN QUERY SELECT false, 'Bu yayın firma veya takım kapsamınızda değil.', NULL::uuid;
    RETURN;
  END IF;

  PERFORM 1
  FROM public.eclub_eczane_firma ef
  JOIN public.eclub_utt_eczane ue ON ue.eczane_firma_id = ef.id
  WHERE ue.utt_id = p_utt_id
    AND ue.aktif_mi = true
    AND ef.eczane_id = p_eczane_id
    AND ef.firma_id = v_firma_id
    AND ef.aktif_mi = true
  FOR UPDATE OF ef, ue;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Bu eczane aktif listenizde değil.', NULL::uuid;
    RETURN;
  END IF;

  SELECT CASE
    WHEN (sa.deger #>> '{}') ~ '^[0-9]+$' THEN (sa.deger #>> '{}')::integer
    ELSE 10
  END
  INTO v_esik
  FROM public.sistem_ayarlari sa
  WHERE sa.anahtar = 'eczanem_aktif_uye_esigi';
  v_esik := COALESCE(v_esik, 10);

  PERFORM 1
  FROM public.eczanem_uyelikler u
  WHERE u.eczane_id = p_eczane_id
    AND u.aktif_mi = true
  FOR UPDATE;

  SELECT count(*)::integer
  INTO v_aktif_uye
  FROM public.eczanem_uyelikler u
  JOIN public.eczanem_musteriler m
    ON m.musteri_id = u.musteri_id
   AND m.aktif_mi = true
  WHERE u.eczane_id = p_eczane_id
    AND u.aktif_mi = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.eczanem_uyelik_davetleri d
      WHERE d.auth_user_id = m.auth_user_id
        AND d.durum <> 'tamamlandi'
    );

  IF v_aktif_uye < v_esik THEN
    RETURN QUERY SELECT false, format('Bu eczane eşiğin altında (%s/%s aktif üye).', v_aktif_uye, v_esik), NULL::uuid;
    RETURN;
  END IF;

  INSERT INTO public.eczanem_eczane_gonderimleri (yayin_id, eczane_id, gonderen_utt_id)
  VALUES (p_yayin_id, p_eczane_id, p_utt_id)
  ON CONFLICT (yayin_id, eczane_id) DO NOTHING
  RETURNING eczanem_eczane_gonderimleri.gonderim_id INTO v_gonderim_id;

  IF v_gonderim_id IS NULL THEN
    RETURN QUERY SELECT false, 'Bu öğrenme aracı bu eczaneye daha önce gönderilmiş.', NULL::uuid;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::text, v_gonderim_id;
END;
$fonksiyon$;

REVOKE ALL ON FUNCTION public.eczanem_utt_eczaneye_gonder(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_utt_eczaneye_gonder(uuid, uuid, uuid)
  TO service_role;

-- 4) Eczane → üye içerik dağıtımında davet aşamasındaki üyeler (ve E-Club geçişindekiler) hariç tutulur.
CREATE OR REPLACE FUNCTION public.eczanem_musterilere_video_gonder(
  p_eczane_id uuid,
  p_gonderen_kisi_id uuid,
  p_yayin_id uuid,
  p_musteri_idler uuid[]
)
RETURNS TABLE(ok boolean, hata text, gonderilen integer, atlanan integer, gonderilen_musteri_idler uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fonksiyon$
DECLARE
  v_istenen integer;
  v_gonderilen integer;
  v_gonderilen_musteri_idler uuid[];
  v_yayin_durum text;
BEGIN
  SELECT count(*)::integer INTO v_istenen
  FROM (SELECT DISTINCT unnest(p_musteri_idler) AS musteri_id) x;

  IF v_istenen = 0 THEN
    RETURN QUERY SELECT false, 'En az bir müşteri seçin.', 0, 0, ARRAY[]::uuid[];
    RETURN;
  END IF;
  IF v_istenen > 100 THEN
    RETURN QUERY SELECT false, 'Tek işlemde en fazla 100 müşteriye gönderim yapılabilir.', 0, v_istenen, ARRAY[]::uuid[];
    RETURN;
  END IF;
  IF NOT public.eczanem_personel_eczane_yetkili_mi(p_gonderen_kisi_id, p_eczane_id) THEN
    RETURN QUERY SELECT false, 'Bu eczanede aktif işlem yetkiniz yok.', 0, v_istenen, ARRAY[]::uuid[];
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.eczanem_eczane_gonderimleri eg
    WHERE eg.eczane_id = p_eczane_id AND eg.yayin_id = p_yayin_id
  ) THEN
    RETURN QUERY SELECT false, 'Bu video eczanenize gönderilmemiş.', 0, v_istenen, ARRAY[]::uuid[];
    RETURN;
  END IF;

  SELECT yy.durum
  INTO v_yayin_durum
  FROM public.yayin_yonetimi yy
  WHERE yy.yayin_id = p_yayin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Yayın bulunamadı.', 0, v_istenen, ARRAY[]::uuid[];
    RETURN;
  END IF;
  IF v_yayin_durum IS DISTINCT FROM 'yayinda' THEN
    RETURN QUERY SELECT false, 'Bu yayın şu an yayında değil.', 0, v_istenen, ARRAY[]::uuid[];
    RETURN;
  END IF;

  WITH istenen AS (
    SELECT DISTINCT unnest(p_musteri_idler) AS musteri_id
  ), uygun AS (
    SELECT i.musteri_id
    FROM istenen i
    JOIN public.eczanem_uyelikler uy
      ON uy.musteri_id = i.musteri_id
     AND uy.eczane_id = p_eczane_id
     AND uy.aktif_mi = true
    JOIN public.eczanem_musteriler m
      ON m.musteri_id = i.musteri_id
     AND m.aktif_mi = true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.eczanem_eclub_gecis_talepleri g
      WHERE g.musteri_id = i.musteri_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.eczanem_uyelik_davetleri d
      WHERE d.auth_user_id = m.auth_user_id
        AND d.durum <> 'tamamlandi'
    )
  ), eklenen AS (
    INSERT INTO public.eczanem_gonderimler (
      yayin_id, eczane_id, musteri_id, gonderen_kisi_id
    )
    SELECT p_yayin_id, p_eczane_id, u.musteri_id, p_gonderen_kisi_id
    FROM uygun u
    ON CONFLICT (yayin_id, musteri_id, eczane_id) DO NOTHING
    RETURNING musteri_id
  )
  SELECT count(*)::integer, COALESCE(array_agg(musteri_id), ARRAY[]::uuid[])
  INTO v_gonderilen, v_gonderilen_musteri_idler
  FROM eklenen;

  RETURN QUERY SELECT true, NULL::text, v_gonderilen, v_istenen - v_gonderilen, v_gonderilen_musteri_idler;
END;
$fonksiyon$;

REVOKE ALL ON FUNCTION public.eczanem_musterilere_video_gonder(uuid, uuid, uuid, uuid[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_musterilere_video_gonder(uuid, uuid, uuid, uuid[])
  TO service_role;

-- 5) Personel işlem günlüğü türlerine davet güncelleme ve iptal ekle.
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
    'davet_iptal_edildi'
  ));

-- 6) Henüz kabul edilmemiş davette ad/soyad/e-posta güncellemesi (yalnız davet beklerken).
CREATE OR REPLACE FUNCTION public.eczanem_bekleyen_davet_bilgi_guncelle(
  p_musteri_id uuid,
  p_eczane_id uuid,
  p_islem_yapan_kisi_id uuid,
  p_ad text,
  p_soyad text,
  p_ad_soyad text,
  p_eposta text
)
RETURNS TABLE(ok boolean, hata text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_id uuid;
  v_davet public.eczanem_uyelik_davetleri;
  v_baska_eczane boolean := false;
BEGIN
  IF NOT public.eczanem_personel_eczane_yetkili_mi(p_islem_yapan_kisi_id, p_eczane_id) THEN
    RETURN QUERY SELECT false, 'Bu eczanede aktif işlem yetkiniz yok.';
    RETURN;
  END IF;

  SELECT m.auth_user_id
  INTO v_auth_id
  FROM public.eczanem_musteriler m
  JOIN public.eczanem_uyelikler u
    ON u.musteri_id = m.musteri_id
   AND u.eczane_id = p_eczane_id
  WHERE m.musteri_id = p_musteri_id
  FOR UPDATE OF m, u;

  IF NOT FOUND OR v_auth_id IS NULL THEN
    RETURN QUERY SELECT false, 'Üye eczane listenizde bulunamadı.';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.eczanem_uyelikler u2
    WHERE u2.musteri_id = p_musteri_id AND u2.eczane_id <> p_eczane_id
  ) INTO v_baska_eczane;

  IF v_baska_eczane THEN
    RETURN QUERY SELECT false, 'Birden fazla eczaneye bağlı üyenin bilgileri değiştirilemez.';
    RETURN;
  END IF;

  SELECT * INTO v_davet
  FROM public.eczanem_uyelik_davetleri
  WHERE auth_user_id = v_auth_id
  FOR UPDATE;

  IF NOT FOUND OR v_davet.durum = 'tamamlandi' THEN
    RETURN QUERY SELECT false, 'Üyelik daveti zaten tamamlanmış; bilgiler değiştirilemez.';
    RETURN;
  END IF;

  IF v_davet.lease_sonu > now() THEN
    RETURN QUERY SELECT false, 'Şifre oluşturma işlemi sürüyor; biraz sonra tekrar deneyin.';
    RETURN;
  END IF;

  UPDATE public.eczanem_musteriler
  SET ad = p_ad,
      soyad = p_soyad,
      ad_soyad = p_ad_soyad
  WHERE musteri_id = p_musteri_id;

  UPDATE public.eczanem_uyelik_davetleri
  SET eposta = p_eposta,
      gonderildi = CASE
        WHEN lower(COALESCE(eposta, '')) <> lower(COALESCE(p_eposta, '')) THEN false
        ELSE gonderildi
      END
  WHERE auth_user_id = v_auth_id;

  INSERT INTO public.eczanem_personel_islemleri (
    eczane_id, kisi_id, islem_turu, hedef_turu, hedef_id
  ) VALUES (
    p_eczane_id, p_islem_yapan_kisi_id, 'davet_guncellendi', 'musteri', p_musteri_id
  );

  RETURN QUERY SELECT true, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.eczanem_bekleyen_davet_bilgi_guncelle(uuid, uuid, uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_bekleyen_davet_bilgi_guncelle(uuid, uuid, uuid, text, text, text, text)
  TO service_role;

-- 7) Henüz kabul edilmemiş davetin iptali — üyelik, davet ve aktifleşmemiş müşteri kaydını temizler.
CREATE OR REPLACE FUNCTION public.eczanem_bekleyen_davet_iptal(
  p_musteri_id uuid,
  p_eczane_id uuid,
  p_islem_yapan_kisi_id uuid
)
RETURNS TABLE(ok boolean, hata text, auth_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_id uuid;
  v_davet public.eczanem_uyelik_davetleri;
  v_baska_eczane boolean := false;
BEGIN
  IF NOT public.eczanem_personel_eczane_yetkili_mi(p_islem_yapan_kisi_id, p_eczane_id) THEN
    RETURN QUERY SELECT false, 'Bu eczanede aktif işlem yetkiniz yok.', NULL::uuid;
    RETURN;
  END IF;

  SELECT m.auth_user_id
  INTO v_auth_id
  FROM public.eczanem_musteriler m
  JOIN public.eczanem_uyelikler u
    ON u.musteri_id = m.musteri_id
   AND u.eczane_id = p_eczane_id
  WHERE m.musteri_id = p_musteri_id
  FOR UPDATE OF m, u;

  IF NOT FOUND OR v_auth_id IS NULL THEN
    RETURN QUERY SELECT false, 'Üye eczane listenizde bulunamadı.', NULL::uuid;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.eczanem_uyelikler u2
    WHERE u2.musteri_id = p_musteri_id AND u2.eczane_id <> p_eczane_id
  ) INTO v_baska_eczane;

  IF v_baska_eczane THEN
    RETURN QUERY SELECT false, 'Birden fazla eczaneye bağlı üyenin daveti iptal edilemez.', NULL::uuid;
    RETURN;
  END IF;

  SELECT * INTO v_davet
  FROM public.eczanem_uyelik_davetleri
  WHERE public.eczanem_uyelik_davetleri.auth_user_id = v_auth_id
  FOR UPDATE;

  IF NOT FOUND OR v_davet.durum = 'tamamlandi' THEN
    RETURN QUERY SELECT false, 'Aktifleşmiş üyelik davet iptaliyle silinemez.', NULL::uuid;
    RETURN;
  END IF;

  IF v_davet.lease_sonu > now() THEN
    RETURN QUERY SELECT false, 'Şifre oluşturma işlemi sürüyor; biraz sonra tekrar deneyin.', NULL::uuid;
    RETURN;
  END IF;

  DELETE FROM public.eczanem_uyelik_davetleri WHERE public.eczanem_uyelik_davetleri.auth_user_id = v_auth_id;
  DELETE FROM public.eczanem_uyelikler WHERE musteri_id = p_musteri_id AND eczane_id = p_eczane_id;
  DELETE FROM public.eczanem_musteriler WHERE musteri_id = p_musteri_id;

  INSERT INTO public.eczanem_personel_islemleri (
    eczane_id, kisi_id, islem_turu, hedef_turu, hedef_id
  ) VALUES (
    p_eczane_id, p_islem_yapan_kisi_id, 'davet_iptal_edildi', 'musteri', p_musteri_id
  );

  RETURN QUERY SELECT true, NULL::text, v_auth_id;
END;
$$;

REVOKE ALL ON FUNCTION public.eczanem_bekleyen_davet_iptal(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_bekleyen_davet_iptal(uuid, uuid, uuid)
  TO service_role;

NOTIFY pgrst, $$reload schema$$;

COMMIT;
