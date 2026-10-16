-- eclub_hoyk_9_tamamlanan_gorunumu_20261015.sql ile sıfırlanan 21 tamamlanmayı geri yükler.
-- Kullanıcı bu kayıtları tekrar izlediyse geri alma durur; yedek saklanır.

BEGIN;
SET LOCAL timezone = 'Europe/Istanbul';
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.eclub_oneri_kayitlari, public.eclub_izleme_kayitlari
  IN SHARE ROW EXCLUSIVE MODE;

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM public.eclub_hoyk_tamamlanan_9_yedek_20261015) <> 21 THEN
    RAISE EXCEPTION 'Yedekte beklenen 21 kayıt yok.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.eclub_hoyk_tamamlanan_9_yedek_20261015 AS b
    LEFT JOIN public.eclub_oneri_kayitlari AS o USING (oneri_id)
    LEFT JOIN public.eclub_izleme_kayitlari AS i USING (izleme_id)
    WHERE o.oneri_id IS NULL OR i.izleme_id IS NULL
       OR o.izlendi_mi IS DISTINCT FROM false
       OR i.tamamlandi_mi IS DISTINCT FROM false
       OR i.izleme_bitis IS NOT NULL
       OR i.ilerleme_durumu IS DISTINCT FROM '{}'::jsonb
  ) THEN
    RAISE EXCEPTION 'Testten sonra kayıtlar değişmiş; otomatik geri alma durduruldu.';
  END IF;
END;
$kontrol$;

DO $geri_al$
DECLARE v_izleme integer; v_oneri integer;
BEGIN
  UPDATE public.eclub_izleme_kayitlari AS i
  SET tamamlandi_mi = b.eski_tamamlandi_mi,
      izleme_bitis = b.eski_izleme_bitis,
      ilerleme_durumu = b.eski_ilerleme_durumu,
      tamamlama_kaniti = b.eski_tamamlama_kaniti,
      soru_hakki_var_mi = b.eski_soru_hakki_var_mi,
      soru_erisimi_acik_mi = b.eski_soru_erisimi_acik_mi,
      soru_hakki_nedeni = b.eski_soru_hakki_nedeni,
      soru_indeksleri = b.eski_soru_indeksleri
  FROM public.eclub_hoyk_tamamlanan_9_yedek_20261015 AS b
  WHERE i.izleme_id = b.izleme_id;
  GET DIAGNOSTICS v_izleme = ROW_COUNT;

  UPDATE public.eclub_oneri_kayitlari AS o
  SET izlendi_mi = b.eski_izlendi_mi
  FROM public.eclub_hoyk_tamamlanan_9_yedek_20261015 AS b
  WHERE o.oneri_id = b.oneri_id;
  GET DIAGNOSTICS v_oneri = ROW_COUNT;

  IF v_izleme <> 21 OR v_oneri <> 21 THEN
    RAISE EXCEPTION '21 yerine izleme % ve öneri % geri alındı.', v_izleme, v_oneri;
  END IF;
END;
$geri_al$;

COMMIT;

SELECT count(*) AS geri_alinan_adet
FROM public.eclub_hoyk_tamamlanan_9_yedek_20261015;
