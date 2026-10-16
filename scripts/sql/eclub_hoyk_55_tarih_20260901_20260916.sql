BEGIN;

SET LOCAL timezone = 'Europe/Istanbul';
SET LOCAL lock_timeout = '5s';

LOCK TABLE public.eclub_oneri_kayitlari IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.eclub_hoyk_renk_deneme_yedek_20261015
  ) <> 55 THEN
    RAISE EXCEPTION 'Beklenen 55 test kaydı bulunamadı.';
  END IF;
END;
$$;

ALTER TABLE public.eclub_oneri_kayitlari
  DISABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;

ALTER TABLE public.eclub_oneri_kayitlari
  DISABLE TRIGGER trg_eclub_gonderim_sure_kapisi;

DO $$
DECLARE
  degisen_sayi integer;
BEGIN
  UPDATE public.eclub_oneri_kayitlari AS o
  SET oneri_baslangic = TIMESTAMPTZ '2026-09-01 00:00:00+03',
      oneri_bitis     = TIMESTAMPTZ '2026-09-16 00:00:00+03'
  FROM public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
  WHERE o.oneri_id = d.oneri_id;

  GET DIAGNOSTICS degisen_sayi = ROW_COUNT;

  IF degisen_sayi <> 55 THEN
    RAISE EXCEPTION '55 yerine % kayıt güncellendi.', degisen_sayi;
  END IF;
END;
$$;

SET CONSTRAINTS ALL IMMEDIATE;

ALTER TABLE public.eclub_oneri_kayitlari
  ENABLE TRIGGER trg_eclub_gonderim_sure_kapisi;

ALTER TABLE public.eclub_oneri_kayitlari
  ENABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;

COMMIT;

SELECT COUNT(*) AS hedef_tarihe_ayarlanan
FROM public.eclub_oneri_kayitlari AS o
JOIN public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
  ON d.oneri_id = o.oneri_id
WHERE o.oneri_baslangic = TIMESTAMPTZ '2026-09-01 00:00:00+03'
  AND o.oneri_bitis = TIMESTAMPTZ '2026-09-16 00:00:00+03';
