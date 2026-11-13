-- Salt okuma. Yalnız Hepifarma ve 1–31 Ekim 2026, Türkiye saati.
WITH donem AS (
  SELECT TIMESTAMP '2026-10-01 00:00' AT TIME ZONE 'Europe/Istanbul' AS baslangic,
         TIMESTAMP '2026-11-01 00:00' AT TIME ZONE 'Europe/Istanbul' AS bitis
), aday AS (
  SELECT firma_id, firma_adi
  FROM public.firmalar
  WHERE lower(btrim(firma_adi)) = 'hepifarma' AND aktif
), firma AS (
  SELECT * FROM aday WHERE (SELECT count(*) FROM aday) = 1
), hareketler AS (
  SELECT (t.created_at AT TIME ZONE 'Europe/Istanbul')::date AS gun,
         'cogniti_token_tuketimleri'::text AS kaynak,
         t.islem_turu AS tur, t.miktar,
         t.islem_turu IN ('yayin','tclub_oneri','cclub_challenge','eclub_oneri',
                          'eczanem_musteri','viva_davet','viva_sure') AS yayin_tuketimi
  FROM public.cogniti_token_tuketimleri t
  JOIN firma f USING (firma_id)
  CROSS JOIN donem d
  WHERE t.miktar > 0 AND t.created_at >= d.baslangic AND t.created_at < d.bitis
  UNION ALL
  SELECT (t.created_at AT TIME ZONE 'Europe/Istanbul')::date,
         'cogniti_esnek_gonderim_tuketimleri', t.alici_turu, t.miktar, true
  FROM public.cogniti_esnek_gonderim_tuketimleri t
  JOIN firma f USING (firma_id)
  CROSS JOIN donem d
  WHERE t.miktar > 0 AND t.created_at >= d.baslangic AND t.created_at < d.bitis
  UNION ALL
  SELECT (b.tuketildi_at AT TIME ZONE 'Europe/Istanbul')::date,
         'eczanem_token_bloklari', 'eczanem_musteri', 1, true
  FROM public.eczanem_token_bloklari b
  JOIN firma f USING (firma_id)
  CROSS JOIN donem d
  WHERE b.durum = 'tuketildi' AND b.tuketildi_at >= d.baslangic AND b.tuketildi_at < d.bitis
), gunluk AS (
  SELECT gun,
    sum(miktar) FILTER (WHERE kaynak = 'cogniti_token_tuketimleri') AS onceki_kart,
    sum(miktar) AS tum_islemler,
    sum(miktar) FILTER (WHERE yayin_tuketimi) AS yayinlar
  FROM hareketler
  GROUP BY gun
), birikim AS (
  SELECT g.gun,
    sum(coalesce(t.onceki_kart,0)) OVER (ORDER BY g.gun) AS onceki_kart,
    sum(coalesce(t.tum_islemler,0)) OVER (ORDER BY g.gun) AS tum_islemler,
    sum(coalesce(t.yayinlar,0)) OVER (ORDER BY g.gun) AS yayinlar
  FROM (SELECT DATE '2026-10-01' + n AS gun FROM generate_series(0,30) AS s(n)) g
  LEFT JOIN gunluk t USING (gun)
), dagilim AS (
  SELECT kaynak, tur, yayin_tuketimi, count(*) AS kayit_sayisi, sum(miktar) AS token
  FROM hareketler
  GROUP BY kaynak, tur, yayin_tuketimi
)
SELECT 'Ekim 2026' AS donem, 'Hepifarma' AS firma,
  CASE WHEN EXISTS (SELECT 1 FROM firma) THEN 'Firma doğrulandı.'
       ELSE 'Tek bir aktif Hepifarma kaydı bulunamadı.' END AS kapsam_durumu,
  CASE WHEN EXISTS (SELECT 1 FROM firma) THEN b.onceki_kart END AS onceki_kart_formulu_ekim_toplami,
  CASE WHEN EXISTS (SELECT 1 FROM firma) THEN b.tum_islemler END AS tum_islemler_ekim_toplami,
  CASE WHEN EXISTS (SELECT 1 FROM firma) THEN b.yayinlar END AS simdiki_kart_formulu_ekim_toplami,
  (SELECT min(gun) FROM birikim WHERE onceki_kart = 202) AS onceki_kart_ilk_202_gun_sonu,
  (SELECT min(gun) FROM birikim WHERE tum_islemler = 202) AS tum_islemler_ilk_202_gun_sonu,
  (SELECT min(gun) FROM birikim WHERE yayinlar = 202) AS simdiki_kart_ilk_202_gun_sonu,
  coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.token DESC, d.kaynak, d.tur) FROM dagilim d), '[]'::jsonb)
    AS islem_turu_dagilimi
FROM birikim b
WHERE b.gun = DATE '2026-10-31';
