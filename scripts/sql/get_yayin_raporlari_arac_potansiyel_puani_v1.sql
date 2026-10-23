-- YAPKA / 2. alt kart: Potansiyel Puan.
-- Kullanıcı tarafından SQL Editor'da çalıştırılır; uygulama bağlantısı ayrı yapılır.
--
-- Kaynak: Yayın Yönetimi sayfasının kullandığı public.v_yayin_detay.video_puani.
-- Bu alanın asıl kaynağı ogrenme_araci_puanlari.arac_puani'dır.
-- 1. alt kartla aynı üretici/firma, hedef rol ve yayın tarihi kapsamı kullanılır.
-- Yalnız şu anda durum='yayinda' olan yayınlar alınır; planlı/durdurulanlar alınmaz.
-- Seçili aralık: yayin_tarihi >= p_baslangic AND yayin_tarihi < p_bitis.
-- Her yayın kendi tanımlı puanıyla bir kez toplanır.
-- Aynı puana sahip farklı yayınlar ayrı ayrı katkı verir; SUM(DISTINCT puan) yapılmaz.
-- Soru/extra puanı, kullanıcı sayısı ve tüketim/tekrar adedi bu toplama katılmaz.
-- Video, Podcast, Dijital Broşür ve Literatür kendi araç türünde ayrı toplanır.
-- Mevcut tüketim ve kazanılan/kaybedilen/net puan fonksiyonları değiştirilmez.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_yayin_raporlari_arac_potansiyel_puani_v1(
  p_yonetici_id uuid,
  p_baslangic timestamptz,
  p_bitis timestamptz,
  p_rapor_rolu text DEFAULT 'tumu'
)
RETURNS TABLE (
  arac_turu text,
  potansiyel_puan bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $function$
WITH rapor_scope AS (
  SELECT k.firma_id,
    CASE WHEN k.rol IN (
      'pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz',
      'ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'
    ) THEN k.kullanici_id ELSE NULL::uuid END AS uretici_id
  FROM public.kullanicilar k
  WHERE k.kullanici_id = p_yonetici_id
    AND k.aktif_mi = true
    AND k.firma_id IS NOT NULL
    AND k.rol IN (
      'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm',
      'pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz',
      'ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'
    )
    AND p_rapor_rolu IN ('tumu','utt','bm','eczaci','eczane_teknisyeni','eczanem')
), yayinlar AS (
  SELECT DISTINCT y.yayin_id, y.arac_turu::text,
    COALESCE(y.video_puani, 0)::bigint AS arac_puani
  FROM public.v_yayin_detay y
  JOIN rapor_scope rs ON (
    (rs.uretici_id IS NOT NULL AND y.uretici_id = rs.uretici_id)
    OR (rs.uretici_id IS NULL AND y.firma_id = rs.firma_id)
  )
  WHERE y.durum = 'yayinda'
    AND y.yayin_tarihi >= p_baslangic
    AND y.yayin_tarihi < p_bitis
    AND y.arac_turu IN ('video','podcast','gorsel','flip_pdf')
    AND (
      p_rapor_rolu = 'tumu'
      OR (
        y.firma_id = rs.firma_id
        AND COALESCE(y.hedef_roller, ARRAY['utt']::text[]) && ARRAY[p_rapor_rolu]::text[]
      )
    )
), turler(sira, arac_turu) AS (
  VALUES (1,'video'::text), (2,'podcast'::text), (3,'gorsel'::text), (4,'flip_pdf'::text)
)
SELECT t.arac_turu, COALESCE(SUM(y.arac_puani), 0)::bigint
FROM turler t
LEFT JOIN yayinlar y ON y.arac_turu = t.arac_turu
GROUP BY t.sira, t.arac_turu
ORDER BY t.sira;
$function$;

REVOKE ALL ON FUNCTION public.get_yayin_raporlari_arac_potansiyel_puani_v1(uuid,timestamptz,timestamptz,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_yayin_raporlari_arac_potansiyel_puani_v1(uuid,timestamptz,timestamptz,text)
  TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT to_regprocedure(
  'public.get_yayin_raporlari_arac_potansiyel_puani_v1(uuid,timestamptz,timestamptz,text)'
) IS NOT NULL AS yapka_potansiyel_puan_hazir;
