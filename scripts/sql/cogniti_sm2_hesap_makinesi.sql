-- KULLANICI ÇALIŞTIRACAK. Ön koşul: merkezi tarife ve SM2 oranları kurulmuş olmalı.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_sm2_fiyatlari_oku()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE d jsonb; v integer;
BEGIN
 SELECT degerler,surum INTO STRICT d,v FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 RETURN jsonb_build_object('surum',v,'sm2',public.cogniti_sm2_fiyat_matrisi((d->>'kko_token_tl')::numeric),
 'paketler',jsonb_build_array(
 jsonb_build_object('ad','Paket 1','token',(d->>'paket_10k_token_miktari')::numeric*6,'birim',(d->>'paket_10k_token_tl')::numeric,'aylik',(d->>'paket_10k_token_miktari')::numeric*(d->>'paket_10k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 2','token',(d->>'paket_30k_token_miktari')::numeric*6,'birim',(d->>'paket_30k_token_tl')::numeric,'aylik',(d->>'paket_30k_token_miktari')::numeric*(d->>'paket_30k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 3','token',(d->>'paket_75k_token_miktari')::numeric*6,'birim',(d->>'paket_75k_token_tl')::numeric,'aylik',(d->>'paket_75k_token_miktari')::numeric*(d->>'paket_75k_token_tl')::numeric)));
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_sm2_fiyatlari_oku() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_sm2_fiyatlari_oku() TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_sm2_hesap_makinesi_hazir;
