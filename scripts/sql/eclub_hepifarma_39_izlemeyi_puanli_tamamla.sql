-- Daha önce sıfırlanan 39 video izlemesini mevcut E-Club tamamlama
-- fonksiyonuyla tamamlar; üye izleme puanı ve UTT puanı bu fonksiyonca yazılır.
-- Yalnız izleme puanı hedeflenir; soru indeksleri atanmaz.
-- Supabase SQL Editor'da dosyanın tamamını tek sorgu olarak çalıştırın.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DROP TABLE IF EXISTS pg_temp.eclub_hepifarma_39_tamamlama_sonucu;

CREATE TEMP TABLE eclub_hepifarma_39_hedef ON COMMIT DROP AS
SELECT i.izleme_id, i.kisi_id, i.yayin_id, i.oneri_id,
       COALESCE(
         (SELECT t.baslangic_tarihi
          FROM public.yayin_tekrar_kayitlari t
          WHERE t.yayin_id = i.yayin_id
          ORDER BY t.tur_no DESC
          LIMIT 1),
         TIMESTAMPTZ '2000-01-01 00:00:00+00'
       ) AS tur_baslangic
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
  ON i.izleme_id = kaynak.izleme_id;

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM eclub_hepifarma_39_hedef) <> 39
     OR (SELECT count(DISTINCT h.izleme_id) FROM eclub_hepifarma_39_hedef h) <> 39
     OR (SELECT count(*)
         FROM eclub_hepifarma_39_hedef h
         JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
         JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = h.oneri_id
         WHERE i.kisi_id = h.kisi_id
           AND i.yayin_id = h.yayin_id
           AND i.oneri_id = h.oneri_id
           AND i.arac_turu = 'video'
           AND i.tamamlandi_mi IS FALSE
           AND i.izleme_bitis IS NULL
           AND o.kisi_id = i.kisi_id
           AND o.yayin_id = i.yayin_id
           AND o.izlendi_mi IS FALSE
           AND clock_timestamp() BETWEEN o.oneri_baslangic AND o.oneri_bitis) <> 39
  THEN
    RAISE EXCEPTION 'Hedef 39 izleme beklenen durumda değil; hiçbir izleme tamamlanmadı.';
  END IF;
END;
$kontrol$;

CREATE TEMP TABLE eclub_hepifarma_39_tamamlama_sonucu AS
SELECT h.izleme_id, h.kisi_id, h.yayin_id,
       sonuc.yeni_tamamlandi,
       sonuc.puan_kazanildi,
       sonuc.izleme_puani,
       sonuc.soru_hakki_nedeni
FROM eclub_hepifarma_39_hedef h
CROSS JOIN LATERAL public.eclub_izleme_tamamla(
  h.izleme_id,
  h.kisi_id,
  h.tur_baslangic,
  ARRAY[]::integer[]
) AS sonuc;

DO $son_kontrol$
BEGIN
  IF (SELECT count(*) FROM eclub_hepifarma_39_tamamlama_sonucu) <> 39
     OR EXISTS (
       SELECT 1
       FROM eclub_hepifarma_39_tamamlama_sonucu s
       JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = s.izleme_id
       WHERE s.yeni_tamamlandi IS DISTINCT FROM true
          OR s.puan_kazanildi IS DISTINCT FROM true
          OR s.izleme_puani <= 0
          OR i.tamamlandi_mi IS DISTINCT FROM true
          OR i.izleme_bitis IS NULL
     )
  THEN
    RAISE EXCEPTION '39 izlemenin tamamı puanlı tamamlanamadı; işlem geri alındı.';
  END IF;
END;
$son_kontrol$;

COMMIT;

SELECT s.izleme_id, s.kisi_id, s.yayin_id,
       s.yeni_tamamlandi, s.puan_kazanildi,
       s.izleme_puani,
       p.puan AS kayitli_izleme_puani,
       s.soru_hakki_nedeni
FROM pg_temp.eclub_hepifarma_39_tamamlama_sonucu s
LEFT JOIN public.eclub_kazanilan_puanlar p
  ON p.izleme_id = s.izleme_id AND p.puan_turu = 'izleme'
ORDER BY s.izleme_id;
