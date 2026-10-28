-- KKÖ aylık 1.500 sınırı. Mevcut cari ay bakiyeleri korunur; geçmiş silinmez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-kko-aylik-v1',0));
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h JOIN public.cogniti_token_yuklemeleri y ON y.firma_id=h.firma_id WHERE h.paket_turu='kullandigin_kadar_ode' AND (y.son_kullanim_at IS NULL OR y.son_kullanim_at>statement_timestamp()) GROUP BY h.firma_id,h.asim_borcu HAVING sum(y.kalan)-h.asim_borcu>1500) THEN
  RAISE EXCEPTION 'KKÖ bakiyesi 1500 üzerinde firma var; geçiş için kayıtlar incelenmeli.'; END IF;
 IF to_regclass('cron.job') IS NULL THEN RAISE EXCEPTION 'pg_cron kurulu değil.'; END IF;
END $$;
ALTER TABLE public.cogniti_token_hesaplari ADD COLUMN IF NOT EXISTS kko_donem date;
UPDATE public.cogniti_token_hesaplari SET kko_donem=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date WHERE paket_turu='kullandigin_kadar_ode' AND kko_donem IS NULL;
ALTER TABLE public.cogniti_token_hesaplari ALTER COLUMN kko_donem SET DEFAULT date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date;
-- Sıfır bakiye artık firma erişimini kapatmaz; sadece yeni gönderimi engeller.
DROP TRIGGER IF EXISTS trg_cogniti_token_sifirda_pasif ON public.cogniti_token_yuklemeleri;
REVOKE ALL ON FUNCTION public.cogniti_token_kko_onayla(uuid,uuid),public.cogniti_token_kko_durum(uuid),public.cogniti_token_kko_yetkili(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.cogniti_token_kko_aylik_yukle(p_firma uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; f record; v_ay date:=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date; v_id uuid;
BEGIN
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=p_firma FOR UPDATE;
 IF NOT FOUND OR h.paket_turu<>'kullandigin_kadar_ode' THEN RETURN false; END IF;
 SELECT aktif INTO f FROM public.firmalar WHERE firma_id=p_firma;
 IF NOT FOUND OR (NOT f.aktif AND h.token_pasif_neden IS DISTINCT FROM 'token_bitti') THEN RETURN false; END IF;
 IF h.kko_donem IS NULL THEN RAISE EXCEPTION 'KKÖ dönemi eksik.' USING ERRCODE='22023'; END IF;
 IF h.kko_donem>=v_ay THEN RETURN false; END IF;
 -- Tarihçe silinmez; kalan miktar önce açıklama kaydında korunur.
 INSERT INTO public.cogniti_token_kko_devir_kayitlari(firma_id,donem,yukleme_id,sifirlanan)
 SELECT p_firma,h.kko_donem,yukleme_id,kalan FROM public.cogniti_token_yuklemeleri WHERE firma_id=p_firma AND kalan>0;
 UPDATE public.cogniti_token_yuklemeleri SET kalan=0 WHERE firma_id=p_firma AND kalan>0;
 v_id:=public.cogniti_token_yukle(p_firma,'kko',1500,'kko-aylik:'||to_char(v_ay,'YYYY-MM'),NULL,NULL,NULL,'KKÖ aylık yenileme');
 UPDATE public.cogniti_token_hesaplari SET kko_donem=v_ay,updated_at=now() WHERE firma_id=p_firma;
 IF NOT f.aktif AND h.token_pasif_neden='token_bitti' THEN UPDATE public.firmalar SET aktif=true WHERE firma_id=p_firma; END IF;
 RETURN true;
END $$;
CREATE TABLE IF NOT EXISTS public.cogniti_token_kko_devir_kayitlari(
 firma_id uuid NOT NULL REFERENCES public.cogniti_token_hesaplari(firma_id),donem date NOT NULL,
 yukleme_id uuid NOT NULL,sifirlanan bigint NOT NULL CHECK(sifirlanan>0),created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(firma_id,donem,yukleme_id));
ALTER TABLE public.cogniti_token_kko_devir_kayitlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_token_kko_devir_kayitlari FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.cogniti_token_kko_devir_kayitlari TO service_role;
CREATE OR REPLACE FUNCTION public.cogniti_token_kko_yukleme_kontrol()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; bakiye bigint;
BEGIN
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=NEW.firma_id FOR UPDATE;
 IF NOT FOUND OR h.paket_turu<>'kullandigin_kadar_ode' THEN RETURN NEW; END IF;
 SELECT coalesce(sum(kalan) FILTER(WHERE son_kullanim_at IS NULL OR son_kullanim_at>statement_timestamp()),0) INTO bakiye FROM public.cogniti_token_yuklemeleri WHERE firma_id=NEW.firma_id;
 IF NEW.yukleme_turu<>'kko' OR NEW.miktar<>1500 OR bakiye+NEW.kalan>1500 OR
  (EXISTS(SELECT 1 FROM public.cogniti_token_yuklemeleri WHERE firma_id=NEW.firma_id) AND NEW.islem_anahtari<>'kko-aylik:'||to_char(date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul'),'YYYY-MM')) THEN
  RAISE EXCEPTION 'KKÖ aylık 1500 token sınırı aşılamaz.' USING ERRCODE='22023'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cogniti_token_kko_yukleme_kontrol ON public.cogniti_token_yuklemeleri;
CREATE TRIGGER trg_cogniti_token_kko_yukleme_kontrol BEFORE INSERT ON public.cogniti_token_yuklemeleri FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_kko_yukleme_kontrol();
CREATE OR REPLACE FUNCTION public.cogniti_token_kko_aylik_isle()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE f uuid;
BEGIN
 FOR f IN SELECT firma_id FROM public.cogniti_token_hesaplari WHERE paket_turu='kullandigin_kadar_ode' ORDER BY firma_id LOOP
  BEGIN PERFORM public.cogniti_token_kko_aylik_yukle(f);
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'KKÖ aylık yenileme başarısız: firma %, %',f,SQLERRM; END;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_kko_aylik_yukle(uuid),public.cogniti_token_kko_aylik_isle(),public.cogniti_token_kko_yukleme_kontrol() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_kko_aylik_yukle(uuid),public.cogniti_token_kko_aylik_isle() TO service_role;
DO $patch$
DECLARE kaynak text; nokta text:=' -- cogniti-token-aylik-yenile-v1'; ek text:=E' -- cogniti-token-kko-aylik-v1\n IF h.paket_turu=''kullandigin_kadar_ode'' THEN PERFORM public.cogniti_token_kko_aylik_yukle(p_firma); END IF;\n';
BEGIN
 kaynak:=pg_get_functiondef('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)'::regprocedure);
 IF strpos(kaynak,'-- cogniti-token-kko-aylik-v1')=0 THEN
  IF (length(kaynak)-length(replace(kaynak,nokta,'')))/length(nokta)<>1 THEN RAISE EXCEPTION 'Token tüketim bağlantısı bulunamadı.'; END IF;
  kaynak:=replace(kaynak,nokta,ek||nokta); EXECUTE kaynak;
 END IF;
END $patch$;
SELECT cron.schedule('cogniti_token_kko_aylik','0 * * * *','SELECT public.cogniti_token_kko_aylik_isle();');
COMMIT;
SELECT to_regprocedure('public.cogniti_token_kko_aylik_isle()') IS NOT NULL AS kko_aylik_isleyici_kuruldu,
 EXISTS(SELECT 1 FROM cron.job WHERE jobname='cogniti_token_kko_aylik' AND schedule='0 * * * *' AND active) AS kko_aylik_cron_aktif;
