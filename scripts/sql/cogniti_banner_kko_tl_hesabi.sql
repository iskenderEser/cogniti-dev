-- Banner TL tutarı = toplam token × kayıtlı KKÖ birim fiyatı.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_tarife_bedeli_hesapla(p_tur text,p_miktar numeric,p_degerler jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $f$
DECLARE tl numeric; token numeric; kko numeric; usd numeric; kur numeric; katsayi numeric; haftalik numeric;
BEGIN
 IF p_miktar IS NULL OR p_miktar::text IN ('NaN','Infinity','-Infinity') OR p_miktar<0 OR p_miktar>1000000000000 THEN
  RAISE EXCEPTION 'Geçersiz hizmet miktarı.' USING ERRCODE='22023';
 END IF;
 IF p_tur='viva' THEN
  kko:=(p_degerler->>'kko_token_tl')::numeric; usd:=(p_degerler->>'viva_kisi_dakika_usd')::numeric;
  kur:=(p_degerler->>'viva_usd_tl')::numeric; katsayi:=(p_degerler->>'viva_satis_katsayisi')::numeric;
  IF kko IS NULL OR usd IS NULL OR kur IS NULL OR katsayi IS NULL OR kko<=0 OR usd<=0 OR kur<=0 OR katsayi<=0
   OR kko::text IN('NaN','Infinity','-Infinity') OR usd::text IN('NaN','Infinity','-Infinity')
   OR kur::text IN('NaN','Infinity','-Infinity') OR katsayi::text IN('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION 'Viva fiyatları eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  tl:=p_miktar/60*usd*kur*katsayi; token:=round(tl/kko);
 ELSIF p_tur='banner' AND p_miktar IN(1,2) THEN
  haftalik:=(p_degerler->>'banner_haftalik_token')::numeric;
  IF haftalik IS NULL OR haftalik<=0 OR haftalik>1000000000 OR haftalik<>trunc(haftalik) THEN
   RAISE EXCEPTION 'Banner fiyatı eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  kko:=(p_degerler->>'kko_token_tl')::numeric;
  IF kko IS NULL OR kko<=0 OR kko::text IN ('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION 'KKÖ birim fiyatı eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  token:=p_miktar*haftalik;
  tl:=round(token*kko,2);
 ELSE RAISE EXCEPTION 'Geçersiz hizmet türü veya hafta.' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('token',token,'hesap_bedeli_tl',tl);
END;
$f$;

DO $test$
BEGIN
 IF (public.cogniti_tarife_bedeli_hesapla('banner',1,'{"banner_haftalik_token":200,"kko_token_tl":9.90}'::jsonb)->>'hesap_bedeli_tl')::numeric IS DISTINCT FROM 1980.00
 OR (public.cogniti_tarife_bedeli_hesapla('banner',2,'{"banner_haftalik_token":200,"kko_token_tl":8.75}'::jsonb)->>'hesap_bedeli_tl')::numeric IS DISTINCT FROM 3500.00 THEN
  RAISE EXCEPTION 'Banner TL hesabı doğrulanamadı.';
 END IF;
END;
$test$;

COMMIT;
SELECT true AS cogniti_banner_kko_tl_hesabi_kuruldu;
