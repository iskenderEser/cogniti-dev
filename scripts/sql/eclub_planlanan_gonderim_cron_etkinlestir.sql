-- Adım 12 SON işlem: yalnız uygulama dağıtımı ve kurulum kontrolleri doğrulandıktan sonra.
-- Kullanıcı çalıştırır. Etkinleşince zamanı gelen planlar gerçek gönderim oluşturabilir.
-- Önce eclub_gonderim_canli_durum_kontrol.sql ile bekleyen plan sayılarını inceleyin.
-- Bu dosya yeni cron oluşturmaz; doğru adla mevcut tek işi etkinleştirir.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eclub-plan-cron-v1',0));
DO $etkinlestir$
DECLARE v_job_id bigint; v_adet integer; v_rpc text;
BEGIN
 FOREACH v_rpc IN ARRAY ARRAY[
  'public.eclub_yayin_gonder(uuid,uuid,uuid,uuid)',
  'public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamptz,uuid,boolean)',
  'public.eclub_planlanan_gonderimi_isle(text[])'
 ] LOOP
  IF to_regprocedure(v_rpc) IS NULL THEN RAISE EXCEPTION 'Eksik kurulum: %',v_rpc; END IF;
 END LOOP;
 SELECT count(*),min(jobid) INTO v_adet,v_job_id FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari';
 IF v_adet<>1 THEN RAISE EXCEPTION 'Plan cron kaydı tek olmalıdır. Mevcut: %',v_adet; END IF;
 IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobid=v_job_id AND schedule='* * * * *'
  AND position('/api/cron/eclub-yayin-gonderim' IN command)>0) THEN
  RAISE EXCEPTION 'Cron sıklığı veya endpoint uyuşmuyor.';
 END IF;
 IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_base_url')<>1
  OR NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_base_url' AND nullif(trim(decrypted_secret),'') IS NOT NULL)
  OR (SELECT count(*) FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret')<>1
  OR NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret' AND nullif(trim(decrypted_secret),'') IS NOT NULL) THEN
  RAISE EXCEPTION 'Vault base URL veya secret hazır değil/tekil değil.';
 END IF;
 PERFORM cron.alter_job(job_id:=v_job_id,active:=true);
END;
$etkinlestir$;
COMMIT;
SELECT count(*)=1 AS plan_cron_tek_kayit,coalesce(bool_and(schedule='* * * * *'),false) AS plan_cron_dakikalik,
 coalesce(bool_and(active),false) AS plan_cron_aktif FROM cron.job WHERE jobname='hapbilgi_eclub_yayin_gonderim_planlari';
