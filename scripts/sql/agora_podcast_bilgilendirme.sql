-- Önkoşul: partner podcast ekleri kurulumu. Satın alma kurulumu gerekmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_vitrin_podcast_bilgileri(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM public.agora_vitrin_yetki(p_auth_id);
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('egitim_id',e.egitim_id,
  'kapak_yolu',x.kapak_yolu,'kapak_var',x.kapak_yolu IS NOT NULL,
  'transkript_var',coalesce(x.transkript->>'durum'='onaylandi' AND length(btrim(x.transkript->>'onaylanan_metin'))>=10,false))), '[]')
 FROM public.agora_yayindaki_egitimler y JOIN public.agora_partner_egitimleri e USING(egitim_id)
 LEFT JOIN public.agora_partner_podcast_ekleri x ON x.yukleme_id=e.yayin_podcast_id
 WHERE y.yayin_araci='podcast');
END $f$;
CREATE OR REPLACE FUNCTION public.agora_vitrin_medya(p_auth_id uuid,p_egitim_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM public.agora_vitrin_yetki(p_auth_id);
 RETURN (SELECT CASE WHEN y.yayin_araci='video' THEN jsonb_build_object('tur','video','guid',v.video_guid)
 ELSE jsonb_build_object('tur','podcast','dosya_yolu',a.dosya_yolu,'mime_type',a.mime_type,
 'kapak_yolu',x.kapak_yolu,'transkript_metni',CASE WHEN x.transkript->>'durum'='onaylandi' THEN x.transkript->>'onaylanan_metin' ELSE NULL END) END
 FROM public.agora_yayindaki_egitimler y JOIN public.agora_partner_egitimleri e USING(egitim_id)
 LEFT JOIN public.agora_partner_videolari v ON v.yukleme_id=e.yayin_egitim_video_id
 LEFT JOIN public.agora_partner_podcastleri a ON a.yukleme_id=e.yayin_podcast_id
 LEFT JOIN public.agora_partner_podcast_ekleri x ON x.yukleme_id=a.yukleme_id
 WHERE y.egitim_id=p_egitim_id);
END $f$;
REVOKE ALL ON FUNCTION public.agora_vitrin_podcast_bilgileri(uuid),public.agora_vitrin_medya(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_vitrin_podcast_bilgileri(uuid),public.agora_vitrin_medya(uuid,uuid) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_vitrin_podcast_bilgileri(uuid)') IS NOT NULL AS agora_podcast_bilgilendirme_hazir;
