-- Sıfırlanıp yeniden tamamlanan 39 test izlemesi için iki soru atar,
-- mevcut E-Club cevap yazma fonksiyonuyla ikisini de yanlış (0 puan) kaydeder.
-- İzleme puanlarını değiştirmez. Tüm işlem tek transaction'dır.
-- Proje sahibi Supabase SQL Editor'da dosyanın tamamını çalıştırır.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE TEMP TABLE hedef_39_cevap ON COMMIT DROP AS
SELECT i.izleme_id, i.kisi_id, i.yayin_id, i.oneri_id
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
  IF (SELECT count(*) FROM hedef_39_cevap) <> 39
     OR (SELECT count(DISTINCT h.izleme_id) FROM hedef_39_cevap h) <> 39
     OR (SELECT count(*)
         FROM hedef_39_cevap h
         JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
         JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
         JOIN public.v_yayin_detay y ON y.yayin_id = i.yayin_id
         WHERE i.kisi_id = h.kisi_id
           AND i.yayin_id = h.yayin_id
           AND i.oneri_id = h.oneri_id
           AND i.arac_turu = 'video'
           AND i.tamamlandi_mi IS TRUE
           AND i.izleme_bitis IS NOT NULL
           AND i.soru_hakki_nedeni = 'soru_yok'
           AND i.soru_hakki_var_mi IS FALSE
           AND i.soru_erisimi_acik_mi IS FALSE
           AND coalesce(cardinality(i.soru_indeksleri), 0) = 0
           AND o.kisi_id = i.kisi_id
           AND o.yayin_id = i.yayin_id
           AND clock_timestamp() BETWEEN o.oneri_baslangic AND o.oneri_bitis
           AND y.video_basi_soru_sayisi = 2
           AND jsonb_typeof(y.sorular) = 'array'
           AND jsonb_array_length(y.sorular) >= 2
           AND jsonb_typeof(y.sorular->0->'secenekler') = 'array'
           AND jsonb_typeof(y.sorular->1->'secenekler') = 'array'
           AND EXISTS (
             SELECT 1
             FROM jsonb_array_elements(y.sorular->0->'secenekler') s(secenek)
             WHERE s.secenek->'dogru' = 'false'::jsonb
           )
           AND EXISTS (
             SELECT 1
             FROM jsonb_array_elements(y.sorular->1->'secenekler') s(secenek)
             WHERE s.secenek->'dogru' = 'false'::jsonb
           )) <> 39
     OR EXISTS (
         SELECT 1 FROM public.eclub_dogru_cevap_kayitlari c
         JOIN hedef_39_cevap h ON h.izleme_id = c.izleme_id
     )
     OR EXISTS (
         SELECT 1 FROM public.eclub_yanlis_cevap_kayitlari c
         JOIN hedef_39_cevap h ON h.izleme_id = c.izleme_id
     )
     OR EXISTS (
         SELECT 1 FROM public.eclub_kazanilan_puanlar p
         JOIN hedef_39_cevap h ON h.izleme_id = p.izleme_id
         WHERE p.puan_turu = 'cevaplama'
     )
  THEN
    RAISE EXCEPTION '39 izlemenin soru veya cevap durumu beklenenden farklı; işlem geri alındı.';
  END IF;
END;
$kontrol$;

-- Test için her soru setinin ilk iki sorusu atanır.
UPDATE public.eclub_izleme_kayitlari i
SET soru_indeksleri = ARRAY[0, 1]::integer[],
    soru_hakki_var_mi = true,
    soru_erisimi_acik_mi = true,
    soru_hakki_nedeni = 'hak_var'
FROM hedef_39_cevap h
WHERE i.izleme_id = h.izleme_id;

CREATE TEMP TABLE sonuc_39_cevap AS
SELECT h.izleme_id, h.kisi_id, h.yayin_id, sonuc.kazanilan_puan
FROM hedef_39_cevap h
CROSS JOIN LATERAL public.eclub_cevaplari_kaydet(
  h.izleme_id,
  h.kisi_id,
  jsonb_build_array(
    jsonb_build_object('soru_index', 0, 'dogru_mu', false, 'kazanilan_puan', 0),
    jsonb_build_object('soru_index', 1, 'dogru_mu', false, 'kazanilan_puan', 0)
  )
) AS sonuc;

DO $son_kontrol$
BEGIN
  IF (SELECT count(*) FROM sonuc_39_cevap) <> 39
     OR EXISTS (SELECT 1 FROM sonuc_39_cevap s WHERE s.kazanilan_puan <> 0)
     OR (SELECT count(*)
         FROM public.eclub_yanlis_cevap_kayitlari c
         JOIN hedef_39_cevap h ON h.izleme_id = c.izleme_id) <> 78
     OR EXISTS (
         SELECT 1
         FROM hedef_39_cevap h
         JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
         WHERE i.soru_indeksleri IS DISTINCT FROM ARRAY[0, 1]::integer[]
            OR i.soru_hakki_nedeni IS DISTINCT FROM 'hak_var'
            OR i.soru_hakki_var_mi IS DISTINCT FROM true
            OR i.soru_erisimi_acik_mi IS DISTINCT FROM false
            OR (SELECT count(*)
                FROM public.eclub_yanlis_cevap_kayitlari c
                WHERE c.izleme_id = h.izleme_id
                  AND c.soru_index IN (0, 1)
                  AND c.kaybedilen_puan = 0) <> 2
     )
     OR EXISTS (
         SELECT 1 FROM public.eclub_dogru_cevap_kayitlari c
         JOIN hedef_39_cevap h ON h.izleme_id = c.izleme_id
     )
     OR EXISTS (
         SELECT 1 FROM public.eclub_kazanilan_puanlar p
         JOIN hedef_39_cevap h ON h.izleme_id = p.izleme_id
         WHERE p.puan_turu = 'cevaplama'
     )
  THEN
    RAISE EXCEPTION '39 izlemenin iki yanlış cevabı doğrulanamadı; işlem geri alındı.';
  END IF;
END;
$son_kontrol$;

COMMIT;

SELECT s.izleme_id, s.kisi_id, s.yayin_id,
       i.soru_indeksleri,
       count(c.kayit_id) AS yanlis_cevap_sayisi,
       s.kazanilan_puan AS cevap_puani,
       i.soru_hakki_nedeni,
       i.soru_erisimi_acik_mi
FROM pg_temp.sonuc_39_cevap s
JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = s.izleme_id
LEFT JOIN public.eclub_yanlis_cevap_kayitlari c ON c.izleme_id = s.izleme_id
GROUP BY s.izleme_id, s.kisi_id, s.yayin_id, i.soru_indeksleri,
         s.kazanilan_puan, i.soru_hakki_nedeni, i.soru_erisimi_acik_mi
ORDER BY s.izleme_id;
