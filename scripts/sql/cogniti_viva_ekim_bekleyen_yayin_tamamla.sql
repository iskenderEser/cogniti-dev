-- Yalnız Hepifarma, Ekim 2026.
BEGIN;
DO $f$
DECLARE
 v_firma uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
 v_ay date := '2026-10-01';
 v_id uuid;
 v_kapanis timestamptz;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.firmalar WHERE firma_id=v_firma AND firma_adi='Hepifarma') THEN
  RAISE EXCEPTION 'Hepifarma kaydı doğrulanamadı.';
 END IF;

 SELECT j.etkinlik_id,coalesce(j.kapanis,e.bitis)
 INTO STRICT v_id,v_kapanis
 FROM public.cogniti_viva_tuketim_isleri j
 JOIN public.viva_etkinlikler e ON e.etkinlik_id=j.etkinlik_id AND e.firma_id=j.firma_id
 WHERE j.firma_id=v_firma AND e.durum<>'iptal' AND (
   (j.durum<>'tamam' AND date_trunc('month',coalesce(j.kapanis,e.bitis) AT TIME ZONE 'Europe/Istanbul')::date=v_ay)
   OR (j.durum='tamam' AND j.donem=v_ay AND j.toplam_saniye>0
       AND (j.usd_dakika IS NULL OR j.kur IS NULL OR j.katsayi IS NULL))
 )
 FOR UPDATE OF j,e;

 IF EXISTS (SELECT 1 FROM public.cogniti_viva_proforma_onaylari WHERE firma_id=v_firma AND donem=v_ay) THEN
  RAISE EXCEPTION 'Ekim proforması zaten onaylanmış.';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM public.viva_etkinlikler e
  JOIN public.cogniti_viva_tuketim_isleri j USING(etkinlik_id)
  WHERE e.etkinlik_id=v_id AND e.durum='sona_erdi'
  AND j.durum<>'tamam' AND j.tuketim_id IS NULL
  AND (j.kira_bitis IS NULL OR j.kira_bitis<=statement_timestamp())
  AND v_kapanis<=statement_timestamp()-interval '45 seconds'
 ) THEN
  RAISE EXCEPTION 'Yayın % için güvenli tamamlama koşulları sağlanmadı. Kayıt değişmedi.',v_id;
 END IF;

 -- Mevcut Viva işleyicisinin sıfır kullanım kuralı. Ölçüm izi varsa yeniden okutulur.
 IF NOT EXISTS (SELECT 1 FROM public.viva_daily_odalar WHERE etkinlik_id=v_id AND oda_adi IS NOT NULL)
    AND EXISTS (SELECT 1 FROM public.cogniti_viva_tuketim_isleri
                WHERE etkinlik_id=v_id AND coalesce(toplam_saniye,0)=0 AND olcum_at IS NULL) THEN
  UPDATE public.cogniti_viva_tuketim_isleri
  SET durum='tamam',token=0,toplam_saniye=0,tamamlandi=statement_timestamp(),donem=v_ay,kira=NULL,kira_bitis=NULL
  WHERE etkinlik_id=v_id;
  RAISE NOTICE 'Yayın % sıfır kullanımla tamamlandı.',v_id;
 ELSE
  UPDATE public.cogniti_viva_tuketim_isleri SET tekrar=statement_timestamp() WHERE etkinlik_id=v_id;
  RAISE NOTICE 'Yayın % mevcut Daily mutabakatında yeniden işlenmeye hazır.',v_id;
 END IF;
EXCEPTION
 WHEN no_data_found OR too_many_rows THEN
  RAISE EXCEPTION 'Seçilen firmada Ekim proformasını bekleten tam bir kayıt bulunamadı. Kayıt değişmedi.';
END;
$f$;
COMMIT;
