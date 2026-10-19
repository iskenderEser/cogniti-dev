-- Cogniti marka dönüşümü: salt okunur ön kontrol.
-- Supabase SQL Editor'da tamamını çalıştırıp sonuç satırlarını paylaşın.
-- Hiçbir kayıt, fonksiyon veya yetki değiştirilmez.
WITH platform_firmalari AS (
  SELECT firma_id, firma_adi, logo_url, aktif, eclub_aktif, eczanem_aktif
  FROM public.firmalar
  WHERE lower(btrim(firma_adi)) IN ('hapbilgi', 'cogniti')
)
SELECT '1_firma_kayitlari' AS kontrol,
       coalesce(jsonb_agg(to_jsonb(f) ORDER BY f.firma_adi, f.firma_id), '[]'::jsonb) AS sonuc
FROM platform_firmalari f
UNION ALL
SELECT '2_eclub_bannerlari',
       coalesce(jsonb_agg(to_jsonb(b) ORDER BY b.firma_id, b.sira), '[]'::jsonb)
FROM (
  SELECT b.firma_id, b.sira, b.dosya_yolu, b.updated_at
  FROM public.eclub_firma_bannerlari b
  JOIN platform_firmalari f ON f.firma_id = b.firma_id
) b
UNION ALL
SELECT '3_eczanem_bannerlari',
       coalesce(jsonb_agg(to_jsonb(b) ORDER BY b.firma_id, b.alan, b.sira), '[]'::jsonb)
FROM (
  SELECT b.firma_id, b.alan, b.sira, b.dosya_yolu, b.updated_at
  FROM public.eczanem_sayfa_bannerlari b
  JOIN platform_firmalari f ON f.firma_id = b.firma_id
) b
UNION ALL
SELECT '4_banner_kurali',
       jsonb_build_object(
         'fonksiyon', 'public.eclub_banner_sira_kontrolu()',
         'tanim', pg_get_functiondef(to_regprocedure('public.eclub_banner_sira_kontrolu()'))
       )
UNION ALL
SELECT '5_kimlik_mesajlari',
       jsonb_build_object(
         'fonksiyon', 'public.hapbilgi_kimlik_telefon_ayir_trg()',
         'tanim', pg_get_functiondef(to_regprocedure('public.hapbilgi_kimlik_telefon_ayir_trg()'))
       )
ORDER BY kontrol;
