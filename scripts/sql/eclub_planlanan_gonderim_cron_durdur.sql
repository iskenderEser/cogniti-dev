-- Yalnız yayın gönderim plan işini pasife alır. Plan/öneri kayıtlarını silmez.
-- Kullanıcı çalıştırır; halen çalışan HTTP isteği bu işlemle iptal edilmez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eclub-plan-cron-v1',0));
DO $durdur$
DECLARE v_job_id bigint;
BEGIN
 FOR v_job_id IN SELECT jobid FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari' LOOP
  PERFORM cron.alter_job(job_id:=v_job_id,active:=false);
 END LOOP;
END;
$durdur$;
COMMIT;
SELECT count(*) AS plan_cron_kayit_sayisi,coalesce(bool_or(active),false) AS plan_cron_aktif
FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari';
