-- Partner Video ve Podcast Yayınlarım ekranındaki yatay hedef kitle filtresi için
-- agora_partner_egitimleri_filtrele fonksiyonuna p_hedef_rol parametresini ekler.
-- Liste kayıtları ve 3'lü stat kartı sayıları seçilen hedef kitleye göre filtrelenir.
BEGIN;

DROP FUNCTION IF EXISTS public.agora_partner_egitimleri_filtrele(text, text, integer, text, numeric, date, date);

CREATE OR REPLACE FUNCTION public.agora_partner_egitimleri_filtrele(
  p_token_ozeti text,
  p_durum text,
  p_sayfa integer,
  p_arama text,
  p_fiyat numeric,
  p_baslangic date,
  p_bitis date,
  p_hedef_rol text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  sonuc jsonb;
  v_partner uuid;
BEGIN
  SELECT p.partner_id INTO v_partner
  FROM public.agora_is_partnerleri p
  JOIN public.agora_partner_oturumlari s USING (partner_id)
  JOIN public.agora_partner_profilleri f USING (partner_id)
  WHERE s.token_ozeti = p_token_ozeti
    AND s.bitis_at > now()
    AND s.giris_surum = p.giris_surum
    AND p.erisim_acik
    AND p.ilk_giris_durumu = 'onaylandi'
    AND p.uyelik_durumu = 'onaylandi';
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF p_durum IS NULL OR p_durum NOT IN ('tumu', 'taslak', 'yayinda', 'pasif')
    OR p_sayfa IS NULL OR p_sayfa < 1 OR p_sayfa > 100000
    OR (p_baslangic IS NOT NULL AND p_bitis IS NOT NULL AND p_baslangic > p_bitis)
    OR p_arama IS NULL OR char_length(p_arama) > 200
    OR (p_fiyat IS NOT NULL AND (p_fiyat < 0 OR p_fiyat > 9999999999.99))
    OR (p_hedef_rol IS NOT NULL AND p_hedef_rol NOT IN ('utt', 'bm', 'eczaci', 'eczane_teknisyeni', 'eczanem')) THEN
    RAISE EXCEPTION 'Geçersiz seçim';
  END IF;

  WITH eslesen AS MATERIALIZED (
    SELECT e.*
    FROM public.agora_partner_egitimleri e
    WHERE e.partner_id = v_partner
      AND e.silindi_at IS NULL
      AND (p_durum = 'tumu' OR e.durum = p_durum)
      AND (p_baslangic IS NULL OR e.yayinlandi_at >= (p_baslangic::timestamp AT TIME ZONE 'Europe/Istanbul'))
      AND (p_bitis IS NULL OR e.yayinlandi_at < ((p_bitis + 1)::timestamp AT TIME ZONE 'Europe/Istanbul'))
      AND (
        p_hedef_rol IS NULL
        OR (
          jsonb_typeof(e.bilgiler -> 'hedef_roller') = 'array'
          AND (e.bilgiler -> 'hedef_roller') @> jsonb_build_array(p_hedef_rol)
        )
      )
      AND (
        btrim(p_arama) = ''
        OR strpos(lower(translate(e.egitim_adi, 'Iİı', 'iii')), lower(translate(btrim(p_arama), 'Iİı', 'iii'))) > 0
        OR strpos(lower(e.partner_egitim_id), lower(btrim(p_arama))) > 0
        OR (p_fiyat IS NOT NULL AND e.fiyat_tl = p_fiyat)
      )
  ), sayfa AS (
    SELECT
      egitim_id,
      partner_egitim_id,
      public.agora_partner_kart_video_guid(egitim_id) AS kapak_video_guid,
      egitim_adi,
      kategori,
      yayin_araci,
      fiyat_tl,
      durum,
      surum,
      olusturuldu_at,
      guncellendi_at,
      yayinlandi_at
    FROM eslesen
    ORDER BY olusturuldu_at DESC, egitim_id
    LIMIT 20 OFFSET (p_sayfa - 1) * 20
  )
  SELECT jsonb_build_object(
    'toplam', (SELECT count(*)::integer FROM eslesen),
    'video_sayisi', (SELECT count(*) FILTER (WHERE yayin_araci = 'video')::integer FROM eslesen),
    'podcast_sayisi', (SELECT count(*) FILTER (WHERE yayin_araci = 'podcast')::integer FROM eslesen),
    'kayitlar', coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.olusturuldu_at DESC, s.egitim_id) FROM sayfa s), '[]'::jsonb)
  )
  INTO sonuc;

  RETURN sonuc;
END;
$f$;

REVOKE ALL ON FUNCTION public.agora_partner_egitimleri_filtrele(text, text, integer, text, numeric, date, date, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_egitimleri_filtrele(text, text, integer, text, numeric, date, date, text) TO service_role;

COMMIT;

SELECT
  to_regprocedure('public.agora_partner_egitimleri_filtrele(text,text,integer,text,numeric,date,date)') IS NULL
  AND to_regprocedure('public.agora_partner_egitimleri_filtrele(text,text,integer,text,numeric,date,date,text)') IS NOT NULL
  AND NOT has_function_privilege('authenticated', 'public.agora_partner_egitimleri_filtrele(text,text,integer,text,numeric,date,date,text)', 'EXECUTE')
  AS agora_partner_yayin_hedef_filtresi_hazir;
