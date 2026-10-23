-- YAPKA: rol ve firma/üretici kapsamında, tüm zamanlardaki yayın adetleri.
-- Dönem içindeki yeni yayın sayısı veya kullanıcıya özgü Yeni rafı değildir.
-- Mevcut puan, tüketim ve tarih hesaplarına dokunmaz. Kullanıcı SQL Editor üzerinde çalıştırır.
BEGIN;
CREATE OR REPLACE FUNCTION public.get_yayin_raporlari_arac_toplamlari_v1(
  p_yonetici_id uuid,
  p_rapor_rolu text DEFAULT 'tumu'
)
RETURNS TABLE (arac_turu text, toplam_yayin_sayisi bigint)
LANGUAGE sql STABLE SECURITY INVOKER
AS $function$
WITH rapor_scope AS (
  SELECT k.firma_id,
    CASE WHEN k.rol IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per')
      THEN k.kullanici_id ELSE NULL::uuid END AS uretici_id
  FROM public.kullanicilar k
  WHERE k.kullanici_id = p_yonetici_id AND k.aktif_mi = true AND k.firma_id IS NOT NULL
    AND k.rol IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per')
    AND p_rapor_rolu IN ('tumu','utt','bm','eczaci','eczane_teknisyeni','eczanem')
), yayinlar AS (
  SELECT y.yayin_id, y.arac_turu::text
  FROM public.v_rapor_arac_turu_ozet y
  JOIN rapor_scope rs ON (
    (rs.uretici_id IS NOT NULL AND y.uretici_id = rs.uretici_id)
    OR (rs.uretici_id IS NULL AND y.firma_id = rs.firma_id)
  )
  WHERE y.arac_turu IN ('video','podcast','gorsel','flip_pdf')
    AND (
      p_rapor_rolu = 'tumu'
      OR (y.firma_id = rs.firma_id AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy WHERE yy.yayin_id = y.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY[p_rapor_rolu]::text[]
      ))
    )
), turler(sira, arac_turu) AS (
  VALUES (1,'video'::text),(2,'podcast'::text),(3,'gorsel'::text),(4,'flip_pdf'::text)
)
SELECT t.arac_turu, COUNT(DISTINCT y.yayin_id)::bigint
FROM turler t LEFT JOIN yayinlar y ON y.arac_turu = t.arac_turu
GROUP BY t.sira, t.arac_turu ORDER BY t.sira;
$function$;
REVOKE ALL ON FUNCTION public.get_yayin_raporlari_arac_toplamlari_v1(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_yayin_raporlari_arac_toplamlari_v1(uuid,text) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT to_regprocedure('public.get_yayin_raporlari_arac_toplamlari_v1(uuid,text)') IS NOT NULL AS arac_toplamlari_hazir;
