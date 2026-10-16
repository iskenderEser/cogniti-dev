-- eclub_hoyk_55_renk_gorunumu_20261015.sql ile değiştirilen 45 tarihi geri yükler.
-- Yedek tablo silinmez; sonuç doğrulandıktan sonra ayrıca değerlendirilebilir.

BEGIN;
SET LOCAL timezone = 'Europe/Istanbul';
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.eclub_oneri_kayitlari IN ACCESS EXCLUSIVE MODE;

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM public.eclub_hoyk_renk_deneme_yedek_20261015) <> 55
    OR (SELECT count(*) FROM public.eclub_hoyk_renk_deneme_yedek_20261015
        WHERE renk_grubu <> 'degismeyen_kirmizi') <> 45 THEN
    RAISE EXCEPTION 'Yedekte beklenen 55/45 kayıt bulunmuyor.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
    LEFT JOIN public.eclub_oneri_kayitlari AS o USING (oneri_id)
    WHERE o.oneri_id IS NULL
       OR o.oneri_baslangic IS DISTINCT FROM d.yeni_baslangic
       OR o.oneri_bitis IS DISTINCT FROM d.yeni_bitis
       OR o.plan_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Kayıtlar test durumundan değişmiş; otomatik geri alma durduruldu.';
  END IF;
END;
$kontrol$;

ALTER TABLE public.eclub_oneri_kayitlari DISABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;
ALTER TABLE public.eclub_oneri_kayitlari DISABLE TRIGGER trg_eclub_gonderim_sure_kapisi;

DO $geri_al$
DECLARE v_degisen integer;
BEGIN
  UPDATE public.eclub_oneri_kayitlari AS o
     SET oneri_baslangic = d.eski_baslangic,
         oneri_bitis = d.eski_bitis
    FROM public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
   WHERE o.oneri_id = d.oneri_id
     AND d.renk_grubu <> 'degismeyen_kirmizi';
  GET DIAGNOSTICS v_degisen = ROW_COUNT;
  IF v_degisen <> 45 THEN
    RAISE EXCEPTION '45 yerine % kayıt geri alındı; tüm işlem geri alınacak.', v_degisen;
  END IF;
END;
$geri_al$;

-- Ertelenmiş plan/öneri doğrulaması tamamlanmadan ALTER TABLE yapılamaz.
SET CONSTRAINTS ALL IMMEDIATE;

ALTER TABLE public.eclub_oneri_kayitlari ENABLE TRIGGER trg_eclub_gonderim_sure_kapisi;
ALTER TABLE public.eclub_oneri_kayitlari ENABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;

DO $son_kontrol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
    JOIN public.eclub_oneri_kayitlari AS o USING (oneri_id)
    WHERE o.oneri_baslangic IS DISTINCT FROM d.eski_baslangic
       OR o.oneri_bitis IS DISTINCT FROM d.eski_bitis
  ) THEN
    RAISE EXCEPTION 'Geri alınan tarihler yedekle uyuşmuyor.';
  END IF;
END;
$son_kontrol$;

COMMIT;

SELECT count(*) AS geri_alinan_kayit
FROM public.eclub_hoyk_renk_deneme_yedek_20261015
WHERE renk_grubu <> 'degismeyen_kirmizi';
