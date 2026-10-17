-- Admin > Firma > Eczanem: üye listesi ve izli üyelik durumu yönetimi.
-- Tamamını tek parça çalıştırın. Mevcut puan/gönderim/siparişlere dokunmaz.
BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_eczanem_uyelik_islemleri (
  islem_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  firma_id uuid NOT NULL,
  uyelik_id uuid NOT NULL,
  musteri_id uuid NOT NULL,
  eczane_id uuid NOT NULL,
  onceki_aktif_mi boolean NOT NULL,
  yeni_aktif_mi boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_eczanem_uyelik_islemleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_eczanem_uyelik_islemleri FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.admin_eczanem_uyelik_islemleri TO service_role;

CREATE OR REPLACE FUNCTION public.admin_eczanem_uyeleri_oku(
  p_firma_id uuid,
  p_eczane_id uuid DEFAULT NULL,
  p_durum text DEFAULT 'tumu',
  p_arama text DEFAULT '',
  p_sayfa integer DEFAULT 1,
  p_limit integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fonksiyon$
DECLARE v_sonuc jsonb;
BEGIN
  IF p_durum IS NULL OR p_durum NOT IN ('tumu', 'aktif', 'pasif')
    OR p_sayfa IS NULL OR p_sayfa < 1 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50
    OR length(coalesce(p_arama, '')) > 80 THEN
    RAISE EXCEPTION 'Geçersiz liste parametreleri.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.firmalar WHERE firma_id = p_firma_id) THEN
    RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE = 'P0002';
  END IF;
  IF p_eczane_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.eclub_eczane_firma WHERE firma_id = p_firma_id AND eczane_id = p_eczane_id AND aktif_mi = true
  ) THEN
    RAISE EXCEPTION 'Eczane seçili firma kapsamında değil.' USING ERRCODE = '42501';
  END IF;

  WITH eczaneler AS MATERIALIZED (
    SELECT e.eczane_id, e.gln, coalesce(em.eczane_adi, 'Eczane adı bulunamadı') AS eczane_adi
    FROM public.eclub_eczaneler e
    LEFT JOIN public.eclub_eczane_master em ON em.gln = e.gln
    WHERE EXISTS (SELECT 1 FROM public.eclub_eczane_firma ef
      WHERE ef.firma_id = p_firma_id AND ef.eczane_id = e.eczane_id AND ef.aktif_mi = true)
  ), kayitlar AS MATERIALIZED (
    SELECT v.musteri_id, v.eczane_id, v.ad_soyad, v.telefon, v.eposta, v.aktif_mi,
      v.created_at, u.son_islem_tarihi, m.aktif_mi AS hesap_aktif_mi,
      e.eczane_adi, e.gln
    FROM public.v_eczanem_musteri_liste_admin v
    JOIN eczaneler e ON e.eczane_id = v.eczane_id
    JOIN public.eczanem_uyelikler u ON u.musteri_id = v.musteri_id AND u.eczane_id = v.eczane_id
    JOIN public.eczanem_musteriler m ON m.musteri_id = v.musteri_id
    WHERE (p_eczane_id IS NULL OR v.eczane_id = p_eczane_id)
      AND (coalesce(p_arama, '') = ''
        OR position(lower(p_arama) in lower(v.ad_soyad)) > 0
        OR (regexp_replace(p_arama, '[^0-9]', '', 'g') <> '' AND
          position(regexp_replace(p_arama, '[^0-9]', '', 'g') in v.telefon) > 0))
  ), filtreli AS MATERIALIZED (
    SELECT * FROM kayitlar WHERE p_durum = 'tumu' OR aktif_mi = (p_durum = 'aktif')
  ), sayfalama AS (
    SELECT count(*) AS toplam,
      greatest(1, ceil(count(*)::numeric / p_limit)::integer) AS toplam_sayfa,
      least(p_sayfa, greatest(1, ceil(count(*)::numeric / p_limit)::integer)) AS sayfa
    FROM filtreli
  ), sayfa AS (
    SELECT * FROM filtreli ORDER BY created_at DESC, musteri_id, eczane_id
    LIMIT p_limit OFFSET ((SELECT sayfa FROM sayfalama) - 1)::bigint * p_limit
  )
  SELECT jsonb_build_object(
    'uyeler', coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.created_at DESC, s.musteri_id, s.eczane_id) FROM sayfa s), '[]'::jsonb),
    'eczaneler', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.eczane_adi, e.eczane_id) FROM eczaneler e), '[]'::jsonb),
    'ozet', (SELECT jsonb_build_object('toplam_uye', count(DISTINCT musteri_id),
      'aktif_uyelik', count(*) FILTER (WHERE aktif_mi), 'pasif_uyelik', count(*) FILTER (WHERE NOT aktif_mi)) FROM kayitlar),
    'sayfalama', (SELECT to_jsonb(s) || jsonb_build_object('limit', p_limit) FROM sayfalama s)
  ) INTO v_sonuc;
  RETURN v_sonuc;
END;
$fonksiyon$;

CREATE OR REPLACE FUNCTION public.admin_eczanem_uyelik_durum_degistir(
  p_admin_id uuid, p_firma_id uuid, p_musteri_id uuid, p_eczane_id uuid,
  p_aktif_mi boolean, p_mevcut_aktif_mi boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fonksiyon$
DECLARE v_uyelik public.eczanem_uyelikler%ROWTYPE; v_hesap public.eczanem_musteriler%ROWTYPE;
BEGIN
  IF p_aktif_mi IS NULL OR p_mevcut_aktif_mi IS NULL THEN
    RAISE EXCEPTION 'Üyelik durumu zorunludur.' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.kullanicilar WHERE kullanici_id = p_admin_id
    AND lower(rol) = 'admin' AND aktif_mi IS NOT FALSE FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin yetkisi bulunamadı.' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.eclub_eczane_firma WHERE firma_id = p_firma_id
    AND eczane_id = p_eczane_id AND aktif_mi = true FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Eczane seçili firma kapsamında değil.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_hesap FROM public.eczanem_musteriler WHERE musteri_id = p_musteri_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Üye bulunamadı.' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_uyelik FROM public.eczanem_uyelikler
    WHERE musteri_id = p_musteri_id AND eczane_id = p_eczane_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Üyelik bulunamadı.' USING ERRCODE = 'P0002'; END IF;
  IF v_uyelik.aktif_mi IS DISTINCT FROM p_mevcut_aktif_mi THEN
    RAISE EXCEPTION 'Üyelik durumu başka bir işlemde değişti. Listeyi yenileyin.' USING ERRCODE = '40001';
  END IF;
  IF v_uyelik.aktif_mi = p_aktif_mi THEN RETURN jsonb_build_object('ok', true, 'degisti', false); END IF;
  IF p_aktif_mi AND (NOT v_hesap.aktif_mi OR v_hesap.auth_user_id IS NULL) THEN
    RAISE EXCEPTION 'Hesabı kapalı üyenin üyeliği aktifleştirilemez.' USING ERRCODE = '23514';
  END IF;

  UPDATE public.eczanem_uyelikler SET aktif_mi = p_aktif_mi,
    son_islem_yapan_kisi_id = NULL, son_islem_tarihi = now()
    WHERE uyelik_id = v_uyelik.uyelik_id;
  INSERT INTO public.admin_eczanem_uyelik_islemleri
    (admin_id, firma_id, uyelik_id, musteri_id, eczane_id, onceki_aktif_mi, yeni_aktif_mi)
    VALUES (p_admin_id, p_firma_id, v_uyelik.uyelik_id, p_musteri_id, p_eczane_id, v_uyelik.aktif_mi, p_aktif_mi);
  RETURN jsonb_build_object('ok', true, 'degisti', true);
END;
$fonksiyon$;

REVOKE ALL ON FUNCTION public.admin_eczanem_uyeleri_oku(uuid, uuid, text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_eczanem_uyelik_durum_degistir(uuid, uuid, uuid, uuid, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_eczanem_uyeleri_oku(uuid, uuid, text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_eczanem_uyelik_durum_degistir(uuid, uuid, uuid, uuid, boolean, boolean) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'TAMAMLANDI' AS sql_sonucu, to_regclass('public.admin_eczanem_uyelik_islemleri') AS islem_tablosu;
