-- KULLANICI ÇALIŞTIRACAK. Mevcut Vault/pg_cron/pg_net düzenini kullanır.
-- İlk kurulum PASİF. /api/cron/viva deployment sonrası erişilebilir olduğunda etkinleştirilir.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-cron'));
DO $$
DECLARE jid bigint; aktif boolean:=false;
BEGIN
 IF to_regclass('cron.job') IS NULL OR to_regclass('vault.decrypted_secrets') IS NULL OR to_regnamespace('net') IS NULL
 THEN RAISE EXCEPTION 'Mevcut pg_cron/Vault/pg_net kurulumu gerekli.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_base_url' AND nullif(trim(decrypted_secret),'') IS NOT NULL)
 OR NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret' AND nullif(trim(decrypted_secret),'') IS NOT NULL)
 THEN RAISE EXCEPTION 'Mevcut cron Vault ayarları eksik.'; END IF;
 SELECT coalesce(bool_or(active),false) INTO aktif FROM cron.job WHERE jobname='cogniti_viva_yasam';
 FOR jid IN SELECT jobid FROM cron.job WHERE jobname='cogniti_viva_yasam' LOOP PERFORM cron.unschedule(jid); END LOOP;
 jid:=cron.schedule('cogniti_viva_yasam','* * * * *',$is$
 SELECT net.http_post(
  url:=rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_base_url' LIMIT 1),'/')||'/api/cron/viva',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret' LIMIT 1)),
  body:='{}'::jsonb,timeout_milliseconds:=55000);
 $is$);
 PERFORM cron.alter_job(job_id:=jid,active:=aktif);
END $$;
COMMIT;
SELECT count(*)=1 AS cron_tek_kayit,coalesce(bool_or(active),false) AS cron_aktif FROM cron.job WHERE jobname='cogniti_viva_yasam';
-- SADECE deployment sonrasında etkinleştirme (ayrı çalıştırılır):
-- SELECT cron.alter_job(job_id:=jobid,active:=true) FROM cron.job WHERE jobname='cogniti_viva_yasam';
