-- Uygulama dağıtıldıktan ve RESEND_API_KEY + FIRMASTORE_CEK_EMAIL_FROM
-- (veya mevcut ECLUB_CEK_EMAIL_FROM) ayarlandıktan sonra kullanıcı çalıştırır.
-- Vault'taki mevcut cron kök adresi ve secret kullanılır; gizli değer içermez.
BEGIN;
DO $kontrol$ BEGIN
 IF to_regclass('cron.job') IS NULL OR to_regnamespace('net') IS NULL OR to_regclass('vault.decrypted_secrets') IS NULL THEN RAISE EXCEPTION 'pg_cron, pg_net ve Vault gerekli.';END IF;
 IF NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_base_url' AND decrypted_secret ~ '^https://') OR NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret' AND length(decrypted_secret)>0) THEN RAISE EXCEPTION 'Mevcut Vault cron adresi/secret hazır değil.';END IF;
END;$kontrol$;
DO $sil$DECLARE r record;BEGIN FOR r IN SELECT jobid FROM cron.job WHERE jobname='cogniti_firmastore_cek_eposta' LOOP PERFORM cron.unschedule(r.jobid);END LOOP;END;$sil$;
SELECT cron.schedule('cogniti_firmastore_cek_eposta','* * * * *',$job$
 SELECT net.http_post(url:=rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_base_url' LIMIT 1),'/')||'/api/cron/firmastore-cek-eposta',
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret' LIMIT 1)),body:='{}'::jsonb,timeout_milliseconds:=55000);
$job$);
COMMIT;
SELECT count(*)=1 AND bool_and(active) AS firmastore_cek_eposta_cron_hazir FROM cron.job WHERE jobname='cogniti_firmastore_cek_eposta';
