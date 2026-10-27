-- Sadece son gerçek tüketim sıfıra düşürürse KKÖ firması pasife alınır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-token-pasif-v1'));
ALTER TABLE public.cogniti_token_hesaplari ADD COLUMN IF NOT EXISTS token_pasif_at timestamptz,
 ADD COLUMN IF NOT EXISTS token_pasif_neden text;
CREATE TABLE IF NOT EXISTS public.cogniti_token_hesap_durum_gecmisi (
 olay_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid NOT NULL REFERENCES public.cogniti_token_hesaplari(firma_id),
 olay text NOT NULL CHECK(olay IN ('token_bitti','yeniden_acildi')),created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.cogniti_token_hesap_durum_gecmisi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_token_hesap_durum_gecmisi FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.cogniti_token_hesap_durum_gecmisi TO service_role;
CREATE OR REPLACE FUNCTION public.cogniti_token_sifirda_pasiflestir()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; v_bakiye bigint;
BEGIN
 IF NEW.kalan>=OLD.kalan THEN RETURN NEW; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=NEW.firma_id FOR UPDATE;
 IF NOT FOUND OR h.paket_turu<>'kullandigin_kadar_ode' THEN RETURN NEW; END IF;
 SELECT coalesce(sum(kalan) FILTER(WHERE son_kullanim_at IS NULL OR son_kullanim_at>statement_timestamp()),0)-h.asim_borcu
 INTO v_bakiye FROM public.cogniti_token_yuklemeleri WHERE firma_id=NEW.firma_id;
 IF v_bakiye<=0 THEN
  UPDATE public.firmalar SET aktif=false WHERE firma_id=NEW.firma_id AND aktif=true;
  IF FOUND THEN
   UPDATE public.cogniti_token_hesaplari SET token_pasif_at=now(),token_pasif_neden='token_bitti',updated_at=now() WHERE firma_id=NEW.firma_id;
   INSERT INTO public.cogniti_token_hesap_durum_gecmisi(firma_id,olay) VALUES(NEW.firma_id,'token_bitti');
  END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cogniti_token_sifirda_pasif ON public.cogniti_token_yuklemeleri;
CREATE TRIGGER trg_cogniti_token_sifirda_pasif AFTER UPDATE OF kalan ON public.cogniti_token_yuklemeleri
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_sifirda_pasiflestir();
CREATE OR REPLACE FUNCTION public.cogniti_token_yeniden_acilis_kontrol()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; v_bakiye bigint;
BEGIN
 IF OLD.aktif IS NOT FALSE OR NEW.aktif IS NOT TRUE THEN RETURN NEW; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=NEW.firma_id FOR UPDATE;
 IF NOT FOUND OR h.token_pasif_neden IS DISTINCT FROM 'token_bitti' THEN RETURN NEW; END IF;
 SELECT coalesce(sum(kalan) FILTER(WHERE son_kullanim_at IS NULL OR son_kullanim_at>statement_timestamp()),0)-h.asim_borcu
 INTO v_bakiye FROM public.cogniti_token_yuklemeleri WHERE firma_id=NEW.firma_id;
 IF v_bakiye<=0 THEN RAISE EXCEPTION 'COGNITI_TOKEN:yeniden_acilis_bakiye_gerekli' USING ERRCODE='P0001'; END IF;
 UPDATE public.cogniti_token_hesaplari SET token_pasif_at=NULL,token_pasif_neden=NULL,updated_at=now() WHERE firma_id=NEW.firma_id;
 INSERT INTO public.cogniti_token_hesap_durum_gecmisi(firma_id,olay) VALUES(NEW.firma_id,'yeniden_acildi');
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cogniti_token_yeniden_acilis ON public.firmalar;
CREATE TRIGGER trg_cogniti_token_yeniden_acilis BEFORE UPDATE OF aktif ON public.firmalar
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_yeniden_acilis_kontrol();
REVOKE ALL ON FUNCTION public.cogniti_token_sifirda_pasiflestir(),public.cogniti_token_yeniden_acilis_kontrol() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.cogniti_token_yuklemeleri'::regclass AND tgname='trg_cogniti_token_sifirda_pasif' AND tgenabled='O' AND NOT tgisinternal) AS sifirda_pasiflestirme_kuruldu,
 EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.firmalar'::regclass AND tgname='trg_cogniti_token_yeniden_acilis' AND tgenabled='O' AND NOT tgisinternal) AS yeniden_acilis_kontrolu_kuruldu;
