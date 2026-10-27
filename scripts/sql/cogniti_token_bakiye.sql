-- Firma token bakiyesini hesaplar; veri değiştirmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_bakiye(p_firma uuid)
RETURNS TABLE(paket_turu text, kullanilabilir_token bigint, paket_asimi bigint, net_bakiye bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT h.paket_turu,
   COALESCE(sum(y.kalan) FILTER (WHERE y.son_kullanim_at IS NULL OR y.son_kullanim_at>statement_timestamp()),0)::bigint,
   h.asim_borcu,
   (COALESCE(sum(y.kalan) FILTER (WHERE y.son_kullanim_at IS NULL OR y.son_kullanim_at>statement_timestamp()),0)-h.asim_borcu)::bigint
 FROM public.cogniti_token_hesaplari h
 LEFT JOIN public.cogniti_token_yuklemeleri y ON y.firma_id=h.firma_id
 WHERE h.firma_id=p_firma
 GROUP BY h.firma_id,h.paket_turu,h.asim_borcu;
$$;
REVOKE ALL ON FUNCTION public.cogniti_token_bakiye(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_bakiye(uuid) TO service_role;
COMMIT;
