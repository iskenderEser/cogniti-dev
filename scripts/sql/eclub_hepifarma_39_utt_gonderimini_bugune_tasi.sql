-- Yalnız daha önce sıfırlanan 24 + 15 izlemeye bağlı 39 UTT önerisinin
-- başlangıcını çalıştırma anına, bitişini 15 gün sonrasına taşır.
-- İzleme, yayın, üye ve puan kayıtlarını değiştirmez.
-- Supabase SQL Editor'da proje sahibi çalıştırır.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.eclub_oneri_kayitlari IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.eclub_izleme_kayitlari IN SHARE MODE;

CREATE TEMP TABLE hedef_oneriler ON COMMIT DROP AS
SELECT i.izleme_id, i.oneri_id
FROM (
  SELECT izleme_id
  FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015
  WHERE kaynak = 'izleme'
  UNION ALL
  SELECT izleme_id
  FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015
  WHERE kaynak = 'izleme'
) h
JOIN public.eclub_izleme_kayitlari i USING (izleme_id);

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM hedef_oneriler) <> 39
     OR (SELECT count(DISTINCT izleme_id) FROM hedef_oneriler) <> 39
     OR (SELECT count(DISTINCT oneri_id) FROM hedef_oneriler) <> 39
     OR EXISTS (
       SELECT 1
       FROM hedef_oneriler h
       JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
       JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = h.oneri_id
       WHERE i.tamamlandi_mi IS DISTINCT FROM false
          OR i.izleme_bitis IS NOT NULL
          OR o.izlendi_mi IS DISTINCT FROM false
          OR o.kisi_id IS DISTINCT FROM i.kisi_id
          OR o.yayin_id IS DISTINCT FROM i.yayin_id
          OR o.plan_id IS NOT NULL
          OR o.oneri_baslangic IS DISTINCT FROM TIMESTAMPTZ '2026-09-01 00:00:00+03'
          OR o.oneri_bitis IS DISTINCT FROM TIMESTAMPTZ '2026-09-16 00:00:00+03'
     )
     OR EXISTS (
       SELECT 1
       FROM public.eclub_izleme_kayitlari i
       JOIN hedef_oneriler h USING (oneri_id)
       WHERE i.izleme_id <> h.izleme_id
     )
  THEN
    RAISE EXCEPTION 'Hedef 39 UTT gönderimi beklenen durumda değil; tarih değişmedi.';
  END IF;
END;
$kontrol$;

-- Bu iki tetikleyici gerçekleşmiş gönderim zamanının değiştirilmesini
-- engeller. Yalnız bu işlem boyunca devre dışı bırakılır; hata olursa
-- transaction geri alınır ve tetikleyiciler etkin kalır.
ALTER TABLE public.eclub_oneri_kayitlari
  DISABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;
ALTER TABLE public.eclub_oneri_kayitlari
  DISABLE TRIGGER trg_eclub_gonderim_sure_kapisi;

DO $guncelle$
DECLARE
  v_simdi timestamptz := clock_timestamp();
  v_sayi integer;
BEGIN
  UPDATE public.eclub_oneri_kayitlari o
  SET oneri_baslangic = v_simdi,
      oneri_bitis = v_simdi + interval '15 days'
  FROM hedef_oneriler h
  WHERE o.oneri_id = h.oneri_id;

  GET DIAGNOSTICS v_sayi = ROW_COUNT;
  IF v_sayi <> 39 THEN
    RAISE EXCEPTION '39 yerine % gönderim güncellendi; işlem geri alındı.', v_sayi;
  END IF;
END;
$guncelle$;

ALTER TABLE public.eclub_oneri_kayitlari
  ENABLE TRIGGER trg_eclub_gonderim_sure_kapisi;
ALTER TABLE public.eclub_oneri_kayitlari
  ENABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;

COMMIT;

SELECT i.izleme_id, o.oneri_id,
       o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS yeni_gonderim_tr,
       o.oneri_bitis AT TIME ZONE 'Europe/Istanbul' AS yeni_bitis_tr
FROM (
  SELECT izleme_id
  FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015
  WHERE kaynak = 'izleme'
  UNION ALL
  SELECT izleme_id
  FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015
  WHERE kaynak = 'izleme'
) h
JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
ORDER BY i.izleme_id;
