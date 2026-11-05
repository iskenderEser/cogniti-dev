-- 9.2: Partner üyeliği ve erişim yönetimi. Mevcut hesaplar açık kalır.
BEGIN;
ALTER TABLE public.agora_is_partnerleri
 ADD COLUMN IF NOT EXISTS erisim_acik boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS erisim_surum integer NOT NULL DEFAULT 1 CHECK(erisim_surum>0),
 ADD COLUMN IF NOT EXISTS erisim_karar_at timestamptz;
CREATE TABLE IF NOT EXISTS public.agora_partner_erisim_gecmisi (
 islem_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
 admin_id uuid NOT NULL,onceki_acik boolean NOT NULL,yeni_acik boolean NOT NULL,surum integer NOT NULL,karar_at timestamptz NOT NULL DEFAULT now(),UNIQUE(partner_id,surum)
);
ALTER TABLE public.agora_partner_erisim_gecmisi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_erisim_gecmisi FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.agora_partner_erisim_bilgileri(p_admin_id uuid,p_partner_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM public.agora_partner_admin_dogrula(p_admin_id);
 RETURN (SELECT jsonb_build_object('partner_id',p.partner_id,'sirket_adi',f.sirket_adi,'ad_soyad',p.ad_soyad,'eposta',p.eposta,
  'ilk_giris_durumu',p.ilk_giris_durumu,'ilk_giris_karar_at',p.karar_at,'uyelik_durumu',p.uyelik_durumu,'uyelik_karar_at',p.uyelik_karar_at,
  'erisim_acik',p.erisim_acik,'erisim_surum',p.erisim_surum,'erisim_karar_at',p.erisim_karar_at)
  FROM public.agora_is_partnerleri p JOIN public.agora_partner_profilleri f USING(partner_id) WHERE p.partner_id=p_partner_id);
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_erisim_degistir(p_admin_id uuid,p_partner_id uuid,p_acik boolean,p_surum integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE p public.agora_is_partnerleri%ROWTYPE;
BEGIN
 PERFORM public.agora_partner_admin_dogrula(p_admin_id);
 IF p_acik IS NULL OR p_surum IS NULL OR p_surum<1 THEN RAISE EXCEPTION 'Geçersiz erişim kararı'; END IF;
 SELECT * INTO p FROM public.agora_is_partnerleri WHERE partner_id=p_partner_id FOR UPDATE;
 IF NOT FOUND THEN RETURN 'bulunamadi'; END IF;
 IF p.erisim_acik=p_acik THEN RETURN 'tamam'; END IF;
 IF p.erisim_surum<>p_surum THEN RETURN 'cakisma'; END IF;
 UPDATE public.agora_is_partnerleri SET erisim_acik=p_acik,erisim_surum=erisim_surum+1,erisim_karar_at=now(),giris_surum=giris_surum+1 WHERE partner_id=p_partner_id;
 DELETE FROM public.agora_partner_oturumlari WHERE partner_id=p_partner_id;
 INSERT INTO public.agora_partner_erisim_gecmisi(partner_id,admin_id,onceki_acik,yeni_acik,surum) VALUES(p_partner_id,p_admin_id,p.erisim_acik,p_acik,p.erisim_surum+1);
 RETURN 'tamam';
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_giris_hazirla(p_eposta text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v public.agora_is_partnerleri%ROWTYPE;
BEGIN
 SELECT * INTO v FROM public.agora_is_partnerleri WHERE eposta=p_eposta FOR UPDATE;
 IF NOT FOUND OR NOT v.erisim_acik OR v.ilk_giris_durumu<>'onaylandi' OR v.sifre_ozeti IS NULL THEN RETURN NULL; END IF;
 IF v.giris_pencere_at IS NULL OR v.giris_pencere_at<=now()-interval '15 minutes' THEN
  UPDATE public.agora_is_partnerleri SET giris_pencere_at=now(),giris_deneme=1 WHERE partner_id=v.partner_id;
 ELSE
  IF v.giris_deneme>=5 THEN RETURN NULL; END IF;
  UPDATE public.agora_is_partnerleri SET giris_deneme=giris_deneme+1 WHERE partner_id=v.partner_id;
 END IF;
 RETURN jsonb_build_object('partner_id',v.partner_id,'sifre_ozeti',v.sifre_ozeti,'giris_surum',v.giris_surum);
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_oturum_ac(p_partner_id uuid,p_surum integer,p_token_ozeti text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v public.agora_is_partnerleri%ROWTYPE;
BEGIN
 SELECT * INTO v FROM public.agora_is_partnerleri WHERE partner_id=p_partner_id FOR UPDATE;
 IF NOT FOUND OR NOT v.erisim_acik OR p_surum IS NULL OR v.ilk_giris_durumu<>'onaylandi' OR v.sifre_ozeti IS NULL OR v.giris_surum<>p_surum THEN RETURN false; END IF;
 DELETE FROM public.agora_partner_oturumlari WHERE partner_id=p_partner_id AND bitis_at<=now();
 INSERT INTO public.agora_partner_oturumlari(token_ozeti,partner_id,giris_surum) VALUES(p_token_ozeti,p_partner_id,p_surum);
 UPDATE public.agora_is_partnerleri SET giris_deneme=0,giris_pencere_at=NULL WHERE partner_id=p_partner_id;
 RETURN true;
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_erisim_bilgileri(uuid,uuid),public.agora_partner_erisim_degistir(uuid,uuid,boolean,integer),public.agora_partner_giris_hazirla(text),public.agora_partner_oturum_ac(uuid,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_erisim_bilgileri(uuid,uuid),public.agora_partner_erisim_degistir(uuid,uuid,boolean,integer),public.agora_partner_giris_hazirla(text),public.agora_partner_oturum_ac(uuid,integer,text) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_partner_erisim_degistir(uuid,uuid,boolean,integer)') IS NOT NULL
 AND has_function_privilege('service_role','public.agora_partner_erisim_bilgileri(uuid,uuid)','EXECUTE')
 AND NOT has_function_privilege('authenticated','public.agora_partner_erisim_degistir(uuid,uuid,boolean,integer)','EXECUTE')
 AS agora_partner_uyelik_yetkiler_hazir;
