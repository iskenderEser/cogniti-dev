-- Salt okunur: E-Club gönderim akışının ve token işlevlerinin kurulum durumunu gösterir.
-- Veri veya şema değiştirmez.
SELECT
 to_regprocedure('public.eclub_yayin_gonder(uuid,uuid,uuid,uuid)') IS NOT NULL AS eclub_gonderim_var,
 to_regprocedure('public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamp with time zone,uuid,boolean)') IS NOT NULL AS eclub_toplu_var,
 to_regprocedure('public.eclub_planlanan_gonderimi_isle(text[])') IS NOT NULL AS eclub_plan_isleyici_var,
 to_regprocedure('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)') IS NOT NULL AS token_tuketim_var,
 EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('public.eclub_oneri_kayitlari') AND tgname='trg_cogniti_token_eclub_oneri' AND NOT tgisinternal) AS token_tetikleyicisi_var,
 (SELECT count(*) FROM public.firmalar f WHERE f.eclub_aktif AND f.aktif AND NOT EXISTS
  (SELECT 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id=f.firma_id)) AS token_hesabi_olmayan_aktif_eclub_firma_sayisi;
