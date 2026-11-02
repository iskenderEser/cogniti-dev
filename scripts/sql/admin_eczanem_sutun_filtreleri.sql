-- Admin Eczanem üye listesi: tüm kayıtlar üzerinde sütun filtreleri.
-- Veri değiştirmez; mevcut üyelik durumu değiştirme fonksiyonuna dokunmaz.
BEGIN;

CREATE OR REPLACE FUNCTION public.admin_eczanem_uyeleri_sutun_filtreli_oku(
  p_firma_id uuid,
  p_arama text DEFAULT '',
  p_sutun_filtreleri jsonb DEFAULT '{}'::jsonb,
  p_sayfa integer DEFAULT 1,
  p_limit integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fonksiyon$
DECLARE v_sonuc jsonb;
BEGIN
  IF p_sayfa IS NULL OR p_sayfa < 1 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50
    OR length(coalesce(p_arama, '')) > 80
    OR p_sutun_filtreleri IS NULL OR jsonb_typeof(p_sutun_filtreleri) <> 'object' THEN
    RAISE EXCEPTION 'Geçersiz liste parametreleri.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_each(p_sutun_filtreleri) f
    WHERE f.key NOT IN ('ad_soyad','telefon','eposta','eczane_adi','gln','il','ilce','uyelik','kayit_tarihi')
      OR jsonb_typeof(f.value) <> 'string' OR length(f.value #>> '{}') > 300) THEN
    RAISE EXCEPTION 'Geçersiz sütun filtresi.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.firmalar WHERE firma_id = p_firma_id) THEN
    RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE = 'P0002';
  END IF;

  WITH eczaneler AS MATERIALIZED (
    SELECT e.eczane_id, e.gln, coalesce(em.eczane_adi, 'Eczane adı bulunamadı') AS eczane_adi,
      em.il, em.ilce
    FROM public.eclub_eczaneler e
    LEFT JOIN public.eclub_eczane_master em ON em.gln = e.gln
    WHERE EXISTS (SELECT 1 FROM public.eclub_eczane_firma ef
      WHERE ef.firma_id = p_firma_id AND ef.eczane_id = e.eczane_id AND ef.aktif_mi = true)
  ), kayitlar AS MATERIALIZED (
    SELECT v.musteri_id, v.eczane_id, v.ad_soyad,
      '••• ••• ' || right(regexp_replace(v.telefon, '[^0-9]', '', 'g'), 4) AS telefon,
      v.eposta, v.aktif_mi, v.created_at, u.son_islem_tarihi, m.aktif_mi AS hesap_aktif_mi,
      e.eczane_adi, e.gln, e.il, e.ilce,
      CASE WHEN v.aktif_mi THEN 'Aktif' ELSE 'Pasif' END AS uyelik,
      to_char(v.created_at AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY') AS kayit_tarihi
    FROM public.v_eczanem_musteri_liste_admin v
    JOIN eczaneler e ON e.eczane_id = v.eczane_id
    JOIN public.eczanem_uyelikler u ON u.musteri_id = v.musteri_id AND u.eczane_id = v.eczane_id
    JOIN public.eczanem_musteriler m ON m.musteri_id = v.musteri_id
    WHERE coalesce(p_arama, '') = ''
      OR position(lower(p_arama) in lower(v.ad_soyad)) > 0
      OR (regexp_replace(p_arama, '[^0-9]', '', 'g') <> '' AND
        position(regexp_replace(p_arama, '[^0-9]', '', 'g') in v.telefon) > 0)
  ), filtreli AS MATERIALIZED (
    SELECT k.* FROM kayitlar k
    WHERE NOT EXISTS (SELECT 1 FROM jsonb_each_text(p_sutun_filtreleri) f
      WHERE f.value <> '' AND coalesce(to_jsonb(k)->>f.key, '—') IS DISTINCT FROM f.value)
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
    'sayfalama', (SELECT to_jsonb(s) || jsonb_build_object('limit', p_limit) FROM sayfalama s),
    'secenekler', (SELECT jsonb_object_agg(anahtar, coalesce((
      SELECT jsonb_agg(jsonb_build_object('deger', d.deger, 'etiket', d.deger) ORDER BY d.deger)
      FROM (SELECT DISTINCT coalesce(to_jsonb(k)->>anahtar, '—') AS deger FROM kayitlar k) d
    ), '[]'::jsonb)) FROM unnest(ARRAY['ad_soyad','telefon','eposta','eczane_adi','gln','il','ilce','uyelik','kayit_tarihi']) AS sutunlar(anahtar))
  ) INTO v_sonuc;
  RETURN v_sonuc;
END;
$fonksiyon$;

REVOKE ALL ON FUNCTION public.admin_eczanem_uyeleri_sutun_filtreli_oku(uuid, text, jsonb, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_eczanem_uyeleri_sutun_filtreli_oku(uuid, text, jsonb, integer, integer) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS admin_eczanem_sutun_filtreleri_hazir;
