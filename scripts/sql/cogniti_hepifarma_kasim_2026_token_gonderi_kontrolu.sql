-- Salt okuma. Hepifarma ve ekrandaki BK hesabı için Kasım 2026 kontrolü.
-- BK tek bir aktif UTT/Kd. UTT ile eşleşmezse aşağıya kullanici_id girin.
WITH ayarlar AS (
  SELECT NULL::uuid AS utt_id, 'BK'::text AS bas_harfler
), donemler AS (
  SELECT *
  FROM (VALUES
    (1, '1–11 Kasım 2026', DATE '2026-11-01', DATE '2026-11-12'),
    (2, 'Kasım 2026 tamamı', DATE '2026-11-01', DATE '2026-12-01')
  ) AS d(sira, donem, baslangic, bitis)
), firma AS (
  SELECT f.firma_id, f.firma_adi
  FROM public.firmalar f
  WHERE lower(btrim(f.firma_adi)) = 'hepifarma' AND f.aktif
), tek_firma AS (
  SELECT f.* FROM firma f WHERE (SELECT count(*) FROM firma) = 1
), adaylar AS (
  SELECT u.kullanici_id, btrim(concat_ws(' ', u.ad, u.soyad)) AS utt
  FROM public.kullanicilar u
  JOIN tek_firma f USING (firma_id)
  CROSS JOIN ayarlar a
  WHERE u.aktif_mi AND lower(btrim(u.rol)) IN ('utt', 'kd_utt')
    AND CASE WHEN a.utt_id IS NOT NULL THEN u.kullanici_id = a.utt_id
      ELSE upper(left(btrim(u.ad), 1) || left(btrim(u.soyad), 1)) = a.bas_harfler END
), secili_utt AS (
  SELECT a.* FROM adaylar a WHERE (SELECT count(*) FROM adaylar) = 1
)
SELECT d.donem, coalesce(f.firma_adi, 'Hepifarma') AS firma, u.utt,
  CASE
    WHEN f.firma_id IS NULL THEN 'Hepifarma için tek bir aktif firma kaydı bulunamadı.'
    WHEN u.kullanici_id IS NULL THEN 'BK için tek bir aktif UTT hesabı bulunamadı. SQL başına UTT UUID değerini girin.'
    ELSE 'UTT hesabı doğrulandı.'
  END AS kapsam_durumu,
  CASE WHEN f.firma_id IS NOT NULL THEN
    tuketim.onceki + tuketim.dogrudan + tuketim.eczanem END AS firma_token_kullanimi,
  CASE WHEN u.kullanici_id IS NOT NULL THEN
    eclub.adet + eczanem.adet END AS toplam_gonderi,
  CASE WHEN u.kullanici_id IS NOT NULL THEN eclub.adet END AS eclub_uyelerine_gonderi,
  CASE WHEN u.kullanici_id IS NOT NULL THEN eczanem.adet END AS eczanem_uyeleri_icin_gonderi
FROM donemler d
LEFT JOIN tek_firma f ON true
LEFT JOIN secili_utt u ON true
CROSS JOIN LATERAL (
  SELECT d.baslangic::timestamp AT TIME ZONE 'Europe/Istanbul' AS baslangic,
         d.bitis::timestamp AT TIME ZONE 'Europe/Istanbul' AS bitis
) zaman
CROSS JOIN LATERAL (
  SELECT
    (SELECT coalesce(sum(t.miktar), 0)
     FROM public.cogniti_token_tuketimleri t
     WHERE t.firma_id = f.firma_id AND t.miktar > 0
       AND t.created_at >= zaman.baslangic AND t.created_at < zaman.bitis
       AND t.islem_turu IN ('yayin', 'tclub_oneri', 'cclub_challenge', 'eclub_oneri',
                            'eczanem_musteri', 'viva_davet', 'viva_sure')) AS onceki,
    (SELECT coalesce(sum(t.miktar), 0)
     FROM public.cogniti_esnek_gonderim_tuketimleri t
     WHERE t.firma_id = f.firma_id AND t.miktar > 0
       AND t.created_at >= zaman.baslangic AND t.created_at < zaman.bitis) AS dogrudan,
    (SELECT count(*)
     FROM public.eczanem_token_bloklari b
     WHERE b.firma_id = f.firma_id AND b.durum = 'tuketildi'
       AND b.tuketildi_at >= zaman.baslangic AND b.tuketildi_at < zaman.bitis) AS eczanem
) tuketim
CROSS JOIN LATERAL (
  SELECT count(*) AS adet
  FROM public.eclub_oneri_kayitlari o
  WHERE o.oneren_id = u.kullanici_id
    AND o.oneri_baslangic >= zaman.baslangic AND o.oneri_baslangic < zaman.bitis
    AND EXISTS (SELECT 1 FROM public.v_yayin_detay y
                WHERE y.yayin_id = o.yayin_id AND y.firma_id = f.firma_id)
) eclub
CROSS JOIN LATERAL (
  SELECT count(*) AS adet
  FROM public.eczanem_gonderimler g
  WHERE g.created_at >= zaman.baslangic AND g.created_at < zaman.bitis
    AND EXISTS (SELECT 1 FROM public.v_yayin_detay y
                WHERE y.yayin_id = g.yayin_id AND y.firma_id = f.firma_id)
    AND EXISTS (SELECT 1 FROM public.eczanem_eczane_gonderimleri e
                WHERE e.yayin_id = g.yayin_id AND e.eczane_id = g.eczane_id
                  AND e.gonderen_utt_id = u.kullanici_id AND e.created_at <= g.created_at)
) eczanem
ORDER BY d.sira;
