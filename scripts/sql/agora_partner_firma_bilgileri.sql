-- 9.1: Mevcut partner kaydını admin Firma Bilgileri sayfasında okumak.
-- Veri kopyalamaz, değiştirmez; mevcut admin yetki kontrolünü kullanır.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_partner_firma_bilgileri_oku(p_admin_id uuid,p_partner_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM public.agora_partner_admin_dogrula(p_admin_id);
 RETURN (
  SELECT jsonb_build_object('partner_id',p.partner_id,'ad_soyad',p.ad_soyad,'eposta',p.eposta,'cep_telefonu',p.cep_telefonu,
   'uyelik_durumu',p.uyelik_durumu,'uyelik_surum',p.uyelik_surum,'uyelik_karar_at',p.uyelik_karar_at,'profil',to_jsonb(f)-'partner_id')
  FROM public.agora_is_partnerleri p JOIN public.agora_partner_profilleri f USING(partner_id)
  WHERE p.partner_id=p_partner_id AND p.ilk_giris_durumu='onaylandi'
 );
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_firma_bilgileri_oku(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_firma_bilgileri_oku(uuid,uuid) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_partner_firma_bilgileri_oku(uuid,uuid)') IS NOT NULL
 AND has_function_privilege('service_role','public.agora_partner_firma_bilgileri_oku(uuid,uuid)','EXECUTE')
 AND NOT has_function_privilege('authenticated','public.agora_partner_firma_bilgileri_oku(uuid,uuid)','EXECUTE')
 AS agora_partner_firma_bilgileri_hazir;
