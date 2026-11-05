-- 9.3: Admin partner yayın listesi, inceleme ve moderasyon.
BEGIN;
CREATE TABLE IF NOT EXISTS public.agora_partner_yayin_islem_gecmisi (
 islem_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
 egitim_id uuid NOT NULL REFERENCES public.agora_partner_egitimleri(egitim_id),admin_id uuid NOT NULL,
 islem text NOT NULL CHECK(islem IN ('aktif','pasif','sil')),onceki_durum text NOT NULL,yeni_durum text NOT NULL,surum integer NOT NULL,islem_at timestamptz NOT NULL DEFAULT now(),UNIQUE(egitim_id,surum)
);
ALTER TABLE public.agora_partner_yayin_islem_gecmisi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_yayin_islem_gecmisi FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.agora_partner_admin_yayinlari(p_admin_id uuid,p_partner_id uuid,p_durum text DEFAULT 'tumu',p_sayfa integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE toplam integer; kayitlar jsonb;
BEGIN
 PERFORM public.agora_partner_admin_dogrula(p_admin_id);
 IF p_durum IS NULL OR p_durum NOT IN ('tumu','taslak','yayinda','pasif') OR p_sayfa IS NULL OR p_sayfa<1 OR p_sayfa>100000 THEN RAISE EXCEPTION 'Geçersiz seçim'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.agora_partner_profilleri WHERE partner_id=p_partner_id) THEN RETURN NULL; END IF;
 SELECT count(*) INTO toplam FROM public.agora_partner_egitimleri WHERE partner_id=p_partner_id AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum);
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.olusturuldu_at DESC,r.egitim_id),'[]'::jsonb) INTO kayitlar FROM (
  SELECT egitim_id,egitim_adi,kategori,yayin_araci,fiyat_tl,durum,surum,olusturuldu_at,guncellendi_at,yayinlandi_at
  FROM public.agora_partner_egitimleri WHERE partner_id=p_partner_id AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum)
  ORDER BY olusturuldu_at DESC,egitim_id LIMIT 20 OFFSET (p_sayfa-1)*20
 ) r;
 RETURN jsonb_build_object('toplam',toplam,'kayitlar',kayitlar);
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_admin_yayin_detayi(p_admin_id uuid,p_partner_id uuid,p_egitim_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE e public.agora_partner_egitimleri%ROWTYPE;
BEGIN
 PERFORM public.agora_partner_admin_dogrula(p_admin_id);
 SELECT * INTO e FROM public.agora_partner_egitimleri WHERE partner_id=p_partner_id AND egitim_id=p_egitim_id AND silindi_at IS NULL;
 IF NOT FOUND THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('egitim',to_jsonb(e)-'partner_id'-'olusturma_istegi',
  'videolar',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.olusturuldu_at DESC,v.yukleme_id) FROM public.agora_partner_videolari v WHERE v.egitim_id=e.egitim_id),'[]'::jsonb),
  'podcastler',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.olusturuldu_at DESC,a.yukleme_id) FROM public.agora_partner_podcastleri a WHERE a.egitim_id=e.egitim_id),'[]'::jsonb));
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_admin_yayin_islemi(p_admin_id uuid,p_partner_id uuid,p_egitim_id uuid,p_islem text,p_surum integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE p public.agora_is_partnerleri%ROWTYPE; e public.agora_partner_egitimleri%ROWTYPE; yeni text;
BEGIN
 PERFORM public.agora_partner_admin_dogrula(p_admin_id);
 IF p_islem IS NULL OR p_islem NOT IN ('aktif','pasif','sil') OR p_surum IS NULL OR p_surum<1 THEN RAISE EXCEPTION 'Geçersiz işlem'; END IF;
 SELECT * INTO p FROM public.agora_is_partnerleri WHERE partner_id=p_partner_id FOR UPDATE;
 IF NOT FOUND THEN RETURN 'bulunamadi'; END IF;
 SELECT * INTO e FROM public.agora_partner_egitimleri WHERE partner_id=p_partner_id AND egitim_id=p_egitim_id FOR UPDATE;
 IF NOT FOUND THEN RETURN 'bulunamadi'; END IF;
 IF e.silindi_at IS NOT NULL THEN RETURN CASE WHEN p_islem='sil' THEN 'tamam' ELSE 'bulunamadi' END; END IF;
 IF (p_islem='aktif' AND e.durum='yayinda') OR (p_islem='pasif' AND e.durum='pasif') THEN RETURN 'tamam'; END IF;
 IF e.surum<>p_surum THEN RETURN 'cakisma'; END IF;
 IF p_islem IN ('aktif','pasif') AND (e.durum='taslak' OR e.yayinlandi_at IS NULL) THEN RETURN 'taslak'; END IF;
 IF p_islem='aktif' THEN
  IF p.ilk_giris_durumu<>'onaylandi' OR p.uyelik_durumu<>'onaylandi' THEN RETURN 'onay_eksik'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.agora_partner_videolari WHERE yukleme_id=e.yayin_tanitim_video_id AND egitim_id=e.egitim_id AND rol='tanitim' AND durum='hazir' AND sure_saniye<=120) THEN RETURN 'dosya_eksik'; END IF;
  IF (e.yayin_araci='video' AND NOT EXISTS(SELECT 1 FROM public.agora_partner_videolari WHERE yukleme_id=e.yayin_egitim_video_id AND egitim_id=e.egitim_id AND rol='egitim' AND durum='hazir' AND sure_saniye>0))
   OR (e.yayin_araci='podcast' AND NOT EXISTS(SELECT 1 FROM public.agora_partner_podcastleri WHERE yukleme_id=e.yayin_podcast_id AND egitim_id=e.egitim_id AND durum='hazir')) THEN RETURN 'dosya_eksik'; END IF;
 END IF;
 yeni=CASE WHEN p_islem='aktif' THEN 'yayinda' WHEN p_islem='pasif' THEN 'pasif' ELSE e.durum END;
 UPDATE public.agora_partner_egitimleri SET durum=yeni,silindi_at=CASE WHEN p_islem='sil' THEN now() ELSE silindi_at END,surum=surum+1,guncellendi_at=now() WHERE egitim_id=e.egitim_id;
 INSERT INTO public.agora_partner_yayin_islem_gecmisi(partner_id,egitim_id,admin_id,islem,onceki_durum,yeni_durum,surum) VALUES(p_partner_id,e.egitim_id,p_admin_id,p_islem,e.durum,CASE WHEN p_islem='sil' THEN 'silindi' ELSE yeni END,e.surum+1);
 RETURN 'tamam';
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_admin_yayinlari(uuid,uuid,text,integer),public.agora_partner_admin_yayin_detayi(uuid,uuid,uuid),public.agora_partner_admin_yayin_islemi(uuid,uuid,uuid,text,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_admin_yayinlari(uuid,uuid,text,integer),public.agora_partner_admin_yayin_detayi(uuid,uuid,uuid),public.agora_partner_admin_yayin_islemi(uuid,uuid,uuid,text,integer) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_partner_admin_yayin_islemi(uuid,uuid,uuid,text,integer)') IS NOT NULL
 AND has_function_privilege('service_role','public.agora_partner_admin_yayinlari(uuid,uuid,text,integer)','EXECUTE')
 AND NOT has_function_privilege('authenticated','public.agora_partner_admin_yayin_islemi(uuid,uuid,uuid,text,integer)','EXECUTE')
 AS agora_partner_admin_yayinlar_hazir;
