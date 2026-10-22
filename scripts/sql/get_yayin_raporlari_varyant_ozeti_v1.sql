-- Yayın Raporları / Yayın Üretim Yöntemleri (V1-V4)
-- Kullanıcı tarafından SQL Editor'da çalıştırılır.
-- Temsilci için getTemsilciVaryantOzeti.ts içindeki sayımı SQL'e taşır.
-- Uygulamaya yayın/talep listeleri yerine yalnız dört sayı döner.
-- Tümü istenirse mevcut üretici/yönetici özetlerine yönlenir; onların hesabı değiştirilmez.
-- p_yonetici_id: API'deki kapsam.raporKimligi (admin için çözülen firma yöneticisi).
-- p_rapor_rolu: 'tumu', 'utt', 'bm', 'eczaci', 'eczane_teknisyeni', 'eczanem'. Ortak yayınlar her hedefte kendi rolüyle sayılır.
--
-- Korunan kurallar:
-- * Firma/üretici kapsamı; hedefi NULL olan tarihsel yayınlar UTT kabul edilir.
-- * Yayın tarihi başlangıç ve bitiş sınırları dahil; durum filtresi eklenmez.
-- * Aynı yayın bir kez sayılır; aynı künye tekrarları sayıyı artırmaz.
-- * Üreticide NULL hazır bayrakları false; firma kapsamında NULL bayraklar korunur.
-- * Talep bağlantısı bulunmayan yayınlar sayılmaz.
-- Mevcut SQL fonksiyonları/görünümleri ve kayıtlar değiştirilmez.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_yayin_raporlari_varyant_ozeti_v1(
  p_yonetici_id uuid,
  p_baslangic timestamptz,
  p_bitis timestamptz,
  p_rapor_rolu text DEFAULT 'tumu'
)
RETURNS TABLE (
  donem_normal_uretim bigint,
  donem_hazir_video bigint,
  donem_hazir_soru_seti bigint,
  donem_hazir_video_ve_soru_seti bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $function$
WITH rapor_scope AS (
  SELECT
    k.firma_id,
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
),
donem_yayinlari AS (
  SELECT DISTINCT ON (yy.yayin_id)
    yy.yayin_id, ky.talep_id, rs.uretici_id
  FROM public.yayin_yonetimi yy
  JOIN public.v_yayin_kunye ky ON ky.yayin_id = yy.yayin_id
  JOIN rapor_scope rs
    ON rs.firma_id = ky.firma_id
   AND (rs.uretici_id IS NULL OR ky.uretici_id = rs.uretici_id)
  WHERE p_rapor_rolu IN ('utt','bm','eczaci','eczane_teknisyeni','eczanem')
    AND ky.talep_id IS NOT NULL
    AND yy.yayin_tarihi >= p_baslangic
    AND yy.yayin_tarihi <= p_bitis
    AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY[p_rapor_rolu]::text[]
  -- Önceki kod yayin_id/talep_id artan sırasıyla Map'e yazıyordu.
  -- Bir yayın için birden fazla künye varsa son NULL olmayan talep bağlantısı korunur.
  ORDER BY yy.yayin_id, ky.talep_id DESC
),
varyantlar AS (
  SELECT
    CASE WHEN dy.uretici_id IS NOT NULL THEN COALESCE(t.hazir_video, false)
      ELSE t.hazir_video END AS hazir_video,
    CASE WHEN dy.uretici_id IS NOT NULL THEN COALESCE(t.hazir_soru_seti, false)
      ELSE t.hazir_soru_seti END AS hazir_soru_seti
  FROM donem_yayinlari dy
  JOIN public.talepler t ON t.talep_id = dy.talep_id
),
utt_ozet AS (
  SELECT
    COUNT(*) FILTER (WHERE hazir_video = false AND hazir_soru_seti = false) AS donem_normal_uretim,
    COUNT(*) FILTER (WHERE hazir_video = true AND hazir_soru_seti = false) AS donem_hazir_video,
    COUNT(*) FILTER (WHERE hazir_video = false AND hazir_soru_seti = true) AS donem_hazir_soru_seti,
    COUNT(*) FILTER (WHERE hazir_video = true AND hazir_soru_seti = true) AS donem_hazir_video_ve_soru_seti
  FROM varyantlar
)
SELECT
  o.donem_normal_uretim::bigint, o.donem_hazir_video::bigint,
  o.donem_hazir_soru_seti::bigint, o.donem_hazir_video_ve_soru_seti::bigint
FROM rapor_scope rs
CROSS JOIN LATERAL public.get_uretici_yayin_ana_ozet_v1(
  rs.uretici_id, p_baslangic, p_bitis
) o
WHERE p_rapor_rolu = 'tumu' AND rs.uretici_id IS NOT NULL

UNION ALL

SELECT
  o.donem_normal_uretim::bigint, o.donem_hazir_video::bigint,
  o.donem_hazir_soru_seti::bigint, o.donem_hazir_video_ve_soru_seti::bigint
FROM rapor_scope rs
CROSS JOIN LATERAL public.get_yonetici_rapor_ana_ozet_v2(
  p_yonetici_id, p_baslangic, p_bitis
) o
WHERE p_rapor_rolu = 'tumu' AND rs.uretici_id IS NULL

UNION ALL

SELECT u.donem_normal_uretim, u.donem_hazir_video,
  u.donem_hazir_soru_seti, u.donem_hazir_video_ve_soru_seti
FROM utt_ozet u
WHERE p_rapor_rolu IN ('utt','bm','eczaci','eczane_teknisyeni','eczanem');
$function$;

REVOKE ALL ON FUNCTION public.get_yayin_raporlari_varyant_ozeti_v1(uuid,timestamptz,timestamptz,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_yayin_raporlari_varyant_ozeti_v1(uuid,timestamptz,timestamptz,text) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT to_regprocedure('public.get_yayin_raporlari_varyant_ozeti_v1(uuid,timestamptz,timestamptz,text)') IS NOT NULL AS varyant_ozeti_hazir;

