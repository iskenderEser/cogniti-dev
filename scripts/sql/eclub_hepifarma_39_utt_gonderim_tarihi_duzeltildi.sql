-- 39 sıfırlanmış izlemeye bağlı 39 UTT gönderiminin tarihini bugüne taşır.
-- YALNIZCA BU DOSYANIN TAMAMINI tek sorgu olarak çalıştırın.
-- Üye izlemeleri, yayınlar ve puanlar değişmez.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.eclub_oneri_kayitlari IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.eclub_izleme_kayitlari IN SHARE MODE;

CREATE TEMP TABLE hedef_39_oneri ON COMMIT DROP AS
SELECT i.izleme_id, i.oneri_id
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
  IF (SELECT count(*) FROM hedef_39_oneri) <> 39
     OR (SELECT count(DISTINCT h.izleme_id) FROM hedef_39_oneri h) <> 39
     OR (SELECT count(DISTINCT h.oneri_id) FROM hedef_39_oneri h) <> 39
     OR (SELECT count(*)
         FROM hedef_39_oneri h
         JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
         JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = h.oneri_id
         WHERE i.oneri_id = h.oneri_id
           AND i.kisi_id = o.kisi_id
           AND i.yayin_id = o.yayin_id
           AND i.tamamlandi_mi IS FALSE
           AND i.izleme_bitis IS NULL
           AND o.izlendi_mi IS FALSE
           AND o.plan_id IS NULL
           AND o.oneri_baslangic = TIMESTAMPTZ '2026-09-01 00:00:00+03'
           AND o.oneri_bitis = TIMESTAMPTZ '2026-09-16 00:00:00+03') <> 39
     OR EXISTS (
         SELECT 1
         FROM public.eclub_izleme_kayitlari i
         JOIN hedef_39_oneri h ON h.oneri_id = i.oneri_id
         WHERE i.izleme_id <> h.izleme_id
     )
  THEN
    RAISE EXCEPTION 'Hedef 39 gönderim beklenen durumda değil; işlem geri alındı.';
  END IF;
END;
$kontrol$;

-- Gerçekleşmiş gönderim tarihlerinin değişmesini önleyen iki tetikleyici,
-- yalnızca bu transaction sırasında devre dışı kalır.
ALTER TABLE public.eclub_oneri_kayitlari
  DISABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;
ALTER TABLE public.eclub_oneri_kayitlari
  DISABLE TRIGGER trg_eclub_gonderim_sure_kapisi;

DO $guncelle$
DECLARE
  v_bugun timestamptz := clock_timestamp();
  v_guncellenen integer;
BEGIN
  UPDATE public.eclub_oneri_kayitlari o
  SET oneri_baslangic = v_bugun,
      oneri_bitis = v_bugun + interval '15 days'
  FROM hedef_39_oneri h
  WHERE o.oneri_id = h.oneri_id;

  GET DIAGNOSTICS v_guncellenen = ROW_COUNT;
  IF v_guncellenen <> 39 THEN
    RAISE EXCEPTION '39 yerine % gönderim güncellendi; işlem geri alındı.', v_guncellenen;
  END IF;
END;
$guncelle$;

-- UPDATE ile sıraya giren ertelenmiş constraint trigger olaylarını bitir.
-- Aksi halde PostgreSQL aynı tabloda ALTER TABLE/ENABLE TRIGGER işlemini reddeder.
SET CONSTRAINTS ALL IMMEDIATE;

ALTER TABLE public.eclub_oneri_kayitlari
  ENABLE TRIGGER trg_eclub_gonderim_sure_kapisi;
ALTER TABLE public.eclub_oneri_kayitlari
  ENABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;

COMMIT;

SELECT i.izleme_id,
       o.oneri_id,
       o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS gonderim_tr,
       o.oneri_bitis AT TIME ZONE 'Europe/Istanbul' AS bitis_tr
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
