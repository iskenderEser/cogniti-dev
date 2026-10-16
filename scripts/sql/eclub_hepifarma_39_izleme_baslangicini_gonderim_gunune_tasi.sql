-- Yalnız önceki işlemlerde hedeflenen 39 izleme kaydının izleme_baslangic
-- alanını, bağlı UTT gönderiminin 15 Ekim 2026 tarihine taşır.
-- Tamamlama, cevap ve puan kayıtları değişmez.
-- Eski başlangıç değerleri önceki 24 + 15 izleme yedeklerinde bulunur.
-- Supabase SQL Editor'da dosyanın tamamını tek sorgu olarak çalıştırın.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TEMP TABLE hedef_39_baslangic ON COMMIT DROP AS
SELECT i.izleme_id, i.oneri_id, i.izleme_baslangic AS eski_baslangic,
       o.oneri_baslangic AS yeni_baslangic
FROM (
  SELECT b.izleme_id
  FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
  UNION ALL
  SELECT b.izleme_id
  FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
) AS kaynak
JOIN public.eclub_izleme_kayitlari i
  ON i.izleme_id = kaynak.izleme_id
JOIN public.eclub_oneri_kayitlari o
  ON o.oneri_id = i.oneri_id;

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM hedef_39_baslangic) <> 39
     OR (SELECT count(DISTINCT h.izleme_id) FROM hedef_39_baslangic h) <> 39
     OR (SELECT count(DISTINCT h.oneri_id) FROM hedef_39_baslangic h) <> 39
     OR (SELECT count(*)
         FROM hedef_39_baslangic h
         JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
         JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = h.oneri_id
         WHERE i.oneri_id = h.oneri_id
           AND i.tamamlandi_mi IS TRUE
           AND i.izleme_bitis IS NOT NULL
           AND i.izleme_baslangic = h.eski_baslangic
           AND i.izleme_baslangic < h.yeni_baslangic
           AND o.kisi_id = i.kisi_id
           AND o.yayin_id = i.yayin_id
           AND o.oneri_baslangic = h.yeni_baslangic
           AND (o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul')::date = DATE '2026-10-15'
           AND o.oneri_baslangic <= i.izleme_bitis
           AND i.izleme_bitis <= o.oneri_bitis) <> 39
  THEN
    RAISE EXCEPTION '39 izlemenin tarih sırası beklenenden farklı; işlem geri alındı.';
  END IF;
END;
$kontrol$;

DO $guncelle$
DECLARE v_guncellenen integer;
BEGIN
  UPDATE public.eclub_izleme_kayitlari i
  SET izleme_baslangic = h.yeni_baslangic
  FROM hedef_39_baslangic h
  WHERE i.izleme_id = h.izleme_id;

  GET DIAGNOSTICS v_guncellenen = ROW_COUNT;
  IF v_guncellenen <> 39 THEN
    RAISE EXCEPTION '39 yerine % izleme güncellendi; işlem geri alındı.', v_guncellenen;
  END IF;
END;
$guncelle$;

DO $son_kontrol$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM hedef_39_baslangic h
    JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
    WHERE i.izleme_baslangic IS DISTINCT FROM h.yeni_baslangic
       OR i.izleme_baslangic > i.izleme_bitis
  ) THEN
    RAISE EXCEPTION 'İzleme başlangıçları doğrulanamadı; işlem geri alındı.';
  END IF;
END;
$son_kontrol$;

COMMIT;

SELECT i.izleme_id,
       o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS utt_gonderim_tr,
       i.izleme_baslangic AT TIME ZONE 'Europe/Istanbul' AS izleme_baslangic_tr,
       i.izleme_bitis AT TIME ZONE 'Europe/Istanbul' AS izleme_bitis_tr,
       i.tamamlandi_mi
FROM (
  SELECT b.izleme_id
  FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
  UNION ALL
  SELECT b.izleme_id
  FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
) AS kaynak
JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = kaynak.izleme_id
JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
ORDER BY i.izleme_id;
