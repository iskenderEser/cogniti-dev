-- KULLANICI ÇALIŞTIRACAK. Ön koşul: son Esnek Paket ve dört aylık abonelik fiyatları kurulu.
-- Yalnız fiyat okuma fonksiyonuna KKÖ bilgisi eklenir. Kayıtlı fiyatlar ve token miktarları değişmez.
-- Doğrudan tablo izni açılmaz; yalnız mevcut service_role fonksiyon erişimi korunur.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_sm2_fiyatlari_oku()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE d jsonb; v integer;
BEGIN
 SELECT degerler,surum INTO STRICT d,v FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 RETURN jsonb_build_object('surum',v,'kko',jsonb_build_object('limit',(d->>'kko_token_miktari')::integer,'birim',(d->>'kko_token_tl')::numeric),'sm2',public.cogniti_sm2_fiyat_matrisi((d->>'kko_token_tl')::numeric),
 'paketler',jsonb_build_array(
 jsonb_build_object('ad','Paket 1','token',(d->>'paket_10k_token_miktari')::numeric,'birim',(d->>'paket_10k_token_tl')::numeric,'aylik',(d->>'paket_10k_token_miktari')::numeric*(d->>'paket_10k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 2','token',(d->>'paket_30k_token_miktari')::numeric,'birim',(d->>'paket_30k_token_tl')::numeric,'aylik',(d->>'paket_30k_token_miktari')::numeric*(d->>'paket_30k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 3','token',(d->>'paket_75k_token_miktari')::numeric,'birim',(d->>'paket_75k_token_tl')::numeric,'aylik',(d->>'paket_75k_token_miktari')::numeric*(d->>'paket_75k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 4','token',(d->>'paket_25k_token_miktari')::numeric,'birim',(d->>'paket_25k_token_tl')::numeric,'aylik',(d->>'paket_25k_token_miktari')::numeric*(d->>'paket_25k_token_tl')::numeric)));
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_sm2_fiyatlari_oku() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_sm2_fiyatlari_oku() TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_planlama_tarife_okuma_hazir;
