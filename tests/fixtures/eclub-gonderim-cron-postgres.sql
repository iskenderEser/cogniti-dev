-- Yalnız operasyon SQL'inin yerel söz dizimi/yetki testleri için pg_cron/Vault taklidi.
-- Gerçek cron zamanlamaz veya HTTP çağırmaz. Supabase uzantı testi değildir.
CREATE SCHEMA cron;
CREATE SCHEMA net;
CREATE SCHEMA vault;
CREATE TABLE cron.job(jobid bigserial PRIMARY KEY,jobname text,schedule text,command text,active boolean DEFAULT true);
CREATE TABLE vault.decrypted_secrets(name text,decrypted_secret text);
INSERT INTO vault.decrypted_secrets VALUES('hapbilgi_cron_base_url','https://test.invalid'),('hapbilgi_cron_secret','SAHTE_TEST_ANAHTARI');
CREATE ROLE eclub_test_cron_operator;
GRANT USAGE ON SCHEMA cron,net,vault TO eclub_test_cron_operator;
GRANT SELECT ON cron.job,vault.decrypted_secrets TO eclub_test_cron_operator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO eclub_test_cron_operator;
CREATE FUNCTION cron.schedule(text,text,text) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=cron,pg_temp AS $$
DECLARE v bigint;
BEGIN INSERT INTO cron.job(jobname,schedule,command) VALUES($1,$2,$3) RETURNING jobid INTO v;RETURN v;END;
$$;
CREATE FUNCTION cron.unschedule(bigint) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=cron,pg_temp AS $$
BEGIN DELETE FROM cron.job WHERE jobid=$1;RETURN FOUND;END;
$$;
CREATE FUNCTION cron.alter_job(job_id bigint,active boolean) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=cron,pg_temp AS $$
 UPDATE cron.job SET active=$2 WHERE jobid=$1;
$$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cron TO eclub_test_cron_operator;
