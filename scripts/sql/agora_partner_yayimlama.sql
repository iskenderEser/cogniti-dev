-- Adım 8: Partnerin tamamladığı eğitimi ek admin onayı olmadan Agora'ya açması.
BEGIN;
ALTER TABLE public.agora_partner_egitimleri
 ADD COLUMN IF NOT EXISTS yayinlandi_at timestamptz,
 ADD COLUMN IF NOT EXISTS yayin_egitim_video_id uuid REFERENCES public.agora_partner_videolari(yukleme_id),
 ADD COLUMN IF NOT EXISTS yayin_podcast_id uuid REFERENCES public.agora_partner_podcastleri(yukleme_id),
 ADD COLUMN IF NOT EXISTS yayin_tanitim_video_id uuid REFERENCES public.agora_partner_videolari(yukleme_id);

CREATE OR REPLACE FUNCTION public.agora_partner_egitim_yayimla(p_token_ozeti text,p_egitim_id uuid,p_surum integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_partner uuid; e public.agora_partner_egitimleri%ROWTYPE;
 v public.agora_partner_videolari%ROWTYPE; t public.agora_partner_videolari%ROWTYPE; a public.agora_partner_podcastleri%ROWTYPE;
BEGIN
 SELECT p.partner_id INTO v_partner FROM public.agora_is_partnerleri p
 JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
 WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi' FOR UPDATE OF p;
 IF NOT FOUND THEN RETURN 'yetkisiz'; END IF;
 SELECT * INTO e FROM public.agora_partner_egitimleri WHERE egitim_id=p_egitim_id AND partner_id=v_partner AND silindi_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RETURN 'bulunamadi'; END IF;
 IF e.durum='yayinda' THEN RETURN 'tamam'; END IF;
 IF e.durum<>'taslak' THEN RETURN 'kapali'; END IF;
 IF p_surum IS NULL OR e.surum<>p_surum THEN RETURN 'cakisma'; END IF;
 IF e.kategori IS NULL OR e.yayin_araci IS NULL OR e.fiyat_tl IS NULL
  OR jsonb_typeof(e.bilgiler->'hedef_roller') IS DISTINCT FROM 'array'
  OR coalesce(e.bilgiler->>'aciklama','')='' OR jsonb_typeof(e.bilgiler->'soru_taslaklari') IS DISTINCT FROM 'array' THEN RETURN 'bilgiler_eksik'; END IF;
 IF jsonb_array_length(e.bilgiler->'hedef_roller')=0 OR jsonb_array_length(e.bilgiler->'soru_taslaklari')=0 THEN RETURN 'bilgiler_eksik'; END IF;
 SELECT * INTO t FROM public.agora_partner_videolari WHERE egitim_id=e.egitim_id AND rol='tanitim' ORDER BY olusturuldu_at DESC,yukleme_id LIMIT 1 FOR UPDATE;
 IF t.yukleme_id IS NULL OR t.durum<>'hazir' OR t.sure_saniye IS NULL OR t.sure_saniye>120 THEN RETURN 'tanitim_eksik'; END IF;
 IF e.yayin_araci='video' THEN
  SELECT * INTO v FROM public.agora_partner_videolari WHERE egitim_id=e.egitim_id AND rol='egitim' ORDER BY olusturuldu_at DESC,yukleme_id LIMIT 1 FOR UPDATE;
  IF v.yukleme_id IS NULL OR v.durum<>'hazir' OR v.sure_saniye IS NULL THEN RETURN 'video_eksik'; END IF;
 ELSE
  SELECT * INTO a FROM public.agora_partner_podcastleri WHERE egitim_id=e.egitim_id ORDER BY olusturuldu_at DESC,yukleme_id LIMIT 1 FOR UPDATE;
  IF a.yukleme_id IS NULL OR a.durum<>'hazir' THEN RETURN 'podcast_eksik'; END IF;
 END IF;
 UPDATE public.agora_partner_egitimleri SET durum='yayinda',yayinlandi_at=now(),surum=surum+1,guncellendi_at=now(),
 yayin_egitim_video_id=v.yukleme_id,yayin_podcast_id=a.yukleme_id,yayin_tanitim_video_id=t.yukleme_id WHERE egitim_id=e.egitim_id;
 RETURN 'tamam';
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_egitim_yayimla(text,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_egitim_yayimla(text,uuid,integer) TO service_role;

-- Katalog yalnız tanıtım bilgilerini taşır; eğitim dosyası, cevap, banka/iletişim alanı içermez.
CREATE OR REPLACE VIEW public.agora_yayindaki_egitimler AS
 SELECT e.egitim_id,e.partner_id,f.sirket_adi,e.egitim_adi,e.kategori,e.yayin_araci,e.fiyat_tl,
 e.bilgiler->'hedef_roller' AS hedef_roller,e.bilgiler->>'aciklama' AS aciklama,e.yayinlandi_at
 FROM public.agora_partner_egitimleri e JOIN public.agora_is_partnerleri p USING(partner_id)
 JOIN public.agora_partner_profilleri f USING(partner_id)
 JOIN public.agora_partner_videolari t ON t.yukleme_id=e.yayin_tanitim_video_id AND t.egitim_id=e.egitim_id AND t.rol='tanitim' AND t.durum='hazir' AND t.sure_saniye<=120
 LEFT JOIN public.agora_partner_videolari v ON v.yukleme_id=e.yayin_egitim_video_id AND v.egitim_id=e.egitim_id AND v.rol='egitim' AND v.durum='hazir'
 LEFT JOIN public.agora_partner_podcastleri a ON a.yukleme_id=e.yayin_podcast_id AND a.egitim_id=e.egitim_id AND a.durum='hazir'
 WHERE e.durum='yayinda' AND e.silindi_at IS NULL AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi'
 AND ((e.yayin_araci='video' AND v.yukleme_id IS NOT NULL) OR (e.yayin_araci='podcast' AND a.yukleme_id IS NOT NULL));
REVOKE ALL ON public.agora_yayindaki_egitimler FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.agora_yayindaki_egitimler TO service_role;
COMMIT;
SELECT to_regclass('public.agora_yayindaki_egitimler') IS NOT NULL
 AND has_function_privilege('service_role','public.agora_partner_egitim_yayimla(text,uuid,integer)','EXECUTE')
 AND NOT has_function_privilege('authenticated','public.agora_partner_egitim_yayimla(text,uuid,integer)','EXECUTE')
 AS agora_partner_yayimlama_hazir;
