-- Partner podcast süresi. Kullanıcı tarafından uygulanır; mevcut dosyalar değişmez.
BEGIN;
ALTER TABLE public.agora_partner_podcastleri ADD COLUMN IF NOT EXISTS sure_saniye integer CHECK(sure_saniye>0);
-- Süresiz hazır işaretleme yolu kapatılır; yeni akış pozitif tam saniye ister.
DROP FUNCTION IF EXISTS public.agora_partner_podcast_tamamla(text,uuid,uuid);
CREATE OR REPLACE FUNCTION public.agora_partner_podcast_tamamla(p_token_ozeti text,p_egitim_id uuid,p_yukleme_id uuid,p_sure integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF p_sure IS NULL OR p_sure<=0 THEN RAISE EXCEPTION 'Podcast süresi geçersiz.' USING ERRCODE='22023'; END IF;
 IF public.agora_partner_medya_egitimi(p_token_ozeti,p_egitim_id,NULL,NULL) IS NULL THEN RETURN false; END IF;
 UPDATE public.agora_partner_podcastleri SET durum='hazir',sure_saniye=p_sure
 WHERE yukleme_id=p_yukleme_id AND egitim_id=p_egitim_id AND (sure_saniye IS NULL OR sure_saniye=p_sure);
 RETURN FOUND;
END $f$;
-- Eski hazır podcastler partner ekranında okunurken yalnız eksik süreleri tamamlanır.
CREATE OR REPLACE FUNCTION public.agora_partner_podcast_sure_kaydet(p_token_ozeti text,p_egitim_id uuid,p_yukleme_id uuid,p_sure integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_partner uuid;
BEGIN
 IF p_sure IS NULL OR p_sure<=0 THEN RAISE EXCEPTION 'Podcast süresi geçersiz.' USING ERRCODE='22023'; END IF;
 SELECT p.partner_id INTO v_partner FROM public.agora_is_partnerleri p
 JOIN public.agora_partner_oturumlari s USING(partner_id)
 WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum
 AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi' FOR UPDATE OF p;
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM 1 FROM public.agora_partner_egitimleri e WHERE e.egitim_id=p_egitim_id AND e.partner_id=v_partner AND e.silindi_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.agora_partner_podcastleri SET sure_saniye=coalesce(sure_saniye,p_sure)
 WHERE yukleme_id=p_yukleme_id AND egitim_id=p_egitim_id AND durum='hazir' AND (sure_saniye IS NULL OR sure_saniye=p_sure);
 RETURN FOUND;
END $f$;
REVOKE ALL ON FUNCTION public.agora_partner_podcast_tamamla(text,uuid,uuid,integer),public.agora_partner_podcast_sure_kaydet(text,uuid,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_podcast_tamamla(text,uuid,uuid,integer),public.agora_partner_podcast_sure_kaydet(text,uuid,uuid,integer) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_partner_podcast_tamamla(text,uuid,uuid,integer)') IS NOT NULL
 AND to_regprocedure('public.agora_partner_podcast_sure_kaydet(text,uuid,uuid,integer)') IS NOT NULL AS agora_partner_podcast_sure_hazir;
