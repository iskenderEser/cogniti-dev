-- Adım 7 cron kurulumu. Önce eclub_planlanan_gonderim_isleyici.sql çalıştırılır.
-- Mevcut Vault adları kullanılır; gizli değerler bu dosyada veya sonuçta yer almaz.
-- Uygulama dağıtımı Adım 12'de tamamlanana kadar yeni cron pasif kurulur.
-- Yeniden kurulum mevcut işin aktif/pasif tercihini korur.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eclub-plan-cron-v1',0));
DO $kontrol$
BEGIN
  IF to_regclass('cron.job') IS NULL THEN RAISE EXCEPTION 'pg_cron etkin değil.'; END IF;
  IF to_regnamespace('net') IS NULL THEN RAISE EXCEPTION 'pg_net etkin değil.'; END IF;
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN RAISE EXCEPTION 'Supabase Vault etkin değil.'; END IF;
  IF to_regprocedure('public.eclub_planlanan_gonderimi_isle(text[])') IS NULL THEN
    RAISE EXCEPTION 'Önce plan işleyicisi SQL kurulmalıdır.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_base_url'
    AND nullif(trim(decrypted_secret),'') IS NOT NULL) THEN
    RAISE EXCEPTION 'Vault içinde hapbilgi_cron_base_url bulunamadı.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret'
    AND nullif(trim(decrypted_secret),'') IS NOT NULL) THEN
    RAISE EXCEPTION 'Vault içinde hapbilgi_cron_secret bulunamadı.';
  END IF;
END;
$kontrol$;
DO $kurulum$
DECLARE v_job_id bigint; v_aktif boolean := false;
BEGIN
  SELECT coalesce(bool_or(active),false) INTO v_aktif FROM cron.job
    WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari';
  FOR v_job_id IN SELECT jobid FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari' LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
  v_job_id := cron.schedule('hapbilgi_eclub_yayin_gonderim_planlari','* * * * *',$is$
    SELECT net.http_post(
      url := rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name='hapbilgi_cron_base_url' LIMIT 1),'/') || '/api/cron/eclub-yayin-gonderim',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret' LIMIT 1)),
      body := '{}'::jsonb, timeout_milliseconds := 55000
    );
  $is$);
  PERFORM cron.alter_job(job_id := v_job_id, active := v_aktif);
END;
$kurulum$;
COMMIT;
SELECT
  count(*)=1 AS plan_cron_tek_kayit,
  coalesce(bool_and(schedule='* * * * *'),false) AS plan_cron_dakikalik,
  coalesce(bool_or(active),false) AS plan_cron_aktif
FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari';
