-- KULLANICI ÇALIŞTIRACAK. Önkoşul: Viva 2.5. Daily/HTTP çağrısı yapmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-indirme-7gun'));
ALTER TABLE public.viva_etkinlikler ADD COLUMN IF NOT EXISTS sona_erme_zamani timestamptz;
-- Eski bitmiş yayınlarda eldeki kapanış zamanı; sonraki metadata değişikliği süreyi uzatmaz.
UPDATE public.viva_etkinlikler SET sona_erme_zamani=least(updated_at,bitis)
 WHERE durum IN ('sona_erdi','iptal') AND sona_erme_zamani IS NULL;
CREATE OR REPLACE FUNCTION public.viva_kapanis_zamani_sabitle() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.sona_erme_zamani IS NOT NULL THEN
  NEW.sona_erme_zamani:=OLD.sona_erme_zamani;
 ELSIF NEW.durum IN ('sona_erdi','iptal') THEN
  NEW.sona_erme_zamani:=least(clock_timestamp(),NEW.bitis);
 ELSE NEW.sona_erme_zamani:=NULL;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS viva_kapanis_zamani ON public.viva_etkinlikler;
CREATE TRIGGER viva_kapanis_zamani BEFORE INSERT OR UPDATE ON public.viva_etkinlikler
 FOR EACH ROW EXECUTE FUNCTION public.viva_kapanis_zamani_sabitle();
REVOKE ALL ON FUNCTION public.viva_kapanis_zamani_sabitle() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.viva_daily_indirme_islem(p_auth uuid,p_etkinlik uuid,p_islem text,p_veri jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v jsonb; e viva_etkinlikler%ROWTYPE; son timestamptz;
BEGIN
 IF p_islem NOT IN ('liste','link') OR p_auth IS NULL THEN
  RAISE EXCEPTION 'Yayıncı oturumu gerekli.' USING ERRCODE='42501';
 END IF;
 -- Mevcut fonksiyon aktif firma/organizasyon ve yayın sahibi kontrolünü uygular.
 v:=viva_daily_kayit_islem(p_auth,p_etkinlik,p_islem,p_veri);
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=p_etkinlik;
 son:=coalesce(e.sona_erme_zamani,CASE WHEN e.bitis<=now() THEN e.bitis ELSE NULL END);
 RETURN v || jsonb_build_object('indirme_bitis',son+interval '168 hours',
  'suresi_doldu',coalesce(son+interval '168 hours'<=now(),false));
END $$;
REVOKE ALL ON FUNCTION public.viva_daily_indirme_islem(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_daily_indirme_islem(uuid,uuid,text,jsonb) TO service_role;
COMMIT;
-- Kurulum kontrolü: yalnız metadata okur; gerçek yayın başlatmaz.
SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public'
 AND table_name='viva_etkinlikler' AND column_name='sona_erme_zamani') AS kapanis_zamani,
 to_regprocedure('public.viva_daily_indirme_islem(uuid,uuid,text,jsonb)') IS NOT NULL AS indirme_fonksiyonu,
 NOT has_function_privilege('authenticated','public.viva_daily_indirme_islem(uuid,uuid,text,jsonb)','EXECUTE') AS istemci_rpc_kapali;
