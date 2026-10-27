-- Adım 6: saatlik yedek işleyici. İlk gönderim de cari ayın yüklemesini sağlar.
-- İşleyici ay/yılı Türkiye saatinden hesaplar; cron saat dilimine bağlı değildir.
-- Yeni job aktif kurulur; mevcut job'un aktif/pasif tercihi korunur.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-aylik-cron-v1',0));
DO $cron$
DECLARE v_job bigint; v_aktif boolean:=true;
BEGIN
 IF to_regclass('cron.job') IS NULL THEN RAISE EXCEPTION 'pg_cron etkin değil.'; END IF;
 IF to_regprocedure('public.cogniti_token_aylik_yuklemeleri_isle()') IS NULL THEN
  RAISE EXCEPTION 'Önce aylık token işleyicisi kurulmalıdır.'; END IF;
 SELECT active INTO v_aktif FROM cron.job WHERE jobname='cogniti_token_aylik_yukleme';
 IF NOT FOUND THEN v_aktif:=true; END IF;
 v_job:=cron.schedule('cogniti_token_aylik_yukleme','0 * * * *',
  'SELECT public.cogniti_token_aylik_yuklemeleri_isle();');
 PERFORM cron.alter_job(job_id:=v_job,active:=v_aktif);
END $cron$;
COMMIT;
SELECT count(*)=1 AS aylik_cron_tek_kayit,coalesce(bool_and(schedule='0 * * * *'),false) AS aylik_cron_saatlik,
 coalesce(bool_and(active),false) AS aylik_cron_aktif
 FROM cron.job WHERE jobname='cogniti_token_aylik_yukleme';
