-- Agora satın alma öncesi koruma paketi. SQL kullanıcı tarafından çalıştırılır.
-- Orijinal medya değiştirilmez. Önizleme oynatıcısı korumayı uygular.
BEGIN;
ALTER TABLE public.agora_partner_egitimleri
 ADD COLUMN IF NOT EXISTS koruma_surumu integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS koruma_kaynak_id uuid,
 ADD COLUMN IF NOT EXISTS koruma_hazir_surum integer;
CREATE OR REPLACE FUNCTION public.agora_partner_egitim_detay_oku(p_token_ozeti text,p_egitim_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $f$
  SELECT jsonb_build_object('egitim_id',e.egitim_id,'egitim_adi',e.egitim_adi,'surum',e.surum,'durum',e.durum,'bilgiler',e.bilgiler,'yayin_araci',e.yayin_araci,'yayin_egitim_video_id',e.yayin_egitim_video_id,'yayin_podcast_id',e.yayin_podcast_id,'koruma_surumu',e.koruma_surumu)
  FROM public.agora_partner_egitimleri e JOIN public.agora_is_partnerleri p USING(partner_id)
  JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
  WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi'
    AND e.egitim_id=p_egitim_id AND e.silindi_at IS NULL;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_koruma_hazirla(p_token_ozeti text,p_egitim_id uuid,p_surum integer,p_kaynak_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE e public.agora_partner_egitimleri%ROWTYPE; kaynak uuid;
BEGIN
 SELECT a.* INTO e FROM public.agora_partner_egitimleri a
 JOIN public.agora_is_partnerleri p USING(partner_id)
 JOIN public.agora_partner_oturumlari s USING(partner_id)
 JOIN public.agora_partner_profilleri f USING(partner_id)
 WHERE a.egitim_id=p_egitim_id AND a.silindi_at IS NULL AND s.token_ozeti=p_token_ozeti
 AND s.bitis_at>now() AND s.giris_surum=p.giris_surum
 AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi' FOR UPDATE OF a;
 IF NOT FOUND OR p_surum IS NULL OR e.surum<>p_surum OR e.durum NOT IN ('taslak','yayinda') THEN RETURN false; END IF;
 IF e.yayin_araci='video' THEN
   SELECT yukleme_id INTO kaynak FROM public.agora_partner_videolari WHERE egitim_id=e.egitim_id AND rol='egitim'
    AND (e.durum='taslak' OR yukleme_id=e.yayin_egitim_video_id) ORDER BY olusturuldu_at DESC,yukleme_id LIMIT 1;
   IF NOT EXISTS(SELECT 1 FROM public.agora_partner_videolari WHERE yukleme_id=kaynak AND durum='hazir') THEN RETURN false; END IF;
 ELSIF e.yayin_araci='podcast' THEN
   SELECT yukleme_id INTO kaynak FROM public.agora_partner_podcastleri WHERE egitim_id=e.egitim_id
    AND (e.durum='taslak' OR yukleme_id=e.yayin_podcast_id) ORDER BY olusturuldu_at DESC,yukleme_id LIMIT 1;
   IF NOT EXISTS(SELECT 1 FROM public.agora_partner_podcastleri WHERE yukleme_id=kaynak AND durum='hazir') THEN RETURN false; END IF;
 ELSE RETURN false;
 END IF;
 IF kaynak IS NULL OR kaynak IS DISTINCT FROM p_kaynak_id THEN RETURN false; END IF;
 UPDATE public.agora_partner_egitimleri SET koruma_surumu=1,koruma_kaynak_id=kaynak,koruma_hazir_surum=e.surum WHERE egitim_id=e.egitim_id;
 RETURN true;
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_koruma_hazirla(text,uuid,integer,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_koruma_hazirla(text,uuid,integer,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.agora_partner_egitim_yayimla(p_token_ozeti text,p_egitim_id uuid,p_surum integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_partner uuid; e public.agora_partner_egitimleri%ROWTYPE;
 v public.agora_partner_videolari%ROWTYPE; a public.agora_partner_podcastleri%ROWTYPE;
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
 IF e.yayin_araci='video' THEN
  SELECT * INTO v FROM public.agora_partner_videolari WHERE egitim_id=e.egitim_id AND rol='egitim' ORDER BY olusturuldu_at DESC,yukleme_id LIMIT 1 FOR UPDATE;
  IF v.yukleme_id IS NULL OR v.durum<>'hazir' OR v.sure_saniye IS NULL THEN RETURN 'video_eksik'; END IF;
 ELSE
  SELECT * INTO a FROM public.agora_partner_podcastleri WHERE egitim_id=e.egitim_id ORDER BY olusturuldu_at DESC,yukleme_id LIMIT 1 FOR UPDATE;
  IF a.yukleme_id IS NULL OR a.durum<>'hazir' THEN RETURN 'podcast_eksik'; END IF;
 END IF;
 IF e.koruma_surumu<>1 OR e.koruma_hazir_surum IS DISTINCT FROM e.surum OR e.koruma_kaynak_id IS DISTINCT FROM coalesce(v.yukleme_id,a.yukleme_id) THEN RETURN 'koruma_eksik'; END IF;
 UPDATE public.agora_partner_egitimleri SET durum='yayinda',yayinlandi_at=now(),surum=surum+1,guncellendi_at=now(),
 yayin_egitim_video_id=v.yukleme_id,yayin_podcast_id=a.yukleme_id,yayin_tanitim_video_id=NULL WHERE egitim_id=e.egitim_id;
 RETURN 'tamam';
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_egitim_yayimla(text,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_egitim_yayimla(text,uuid,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.agora_partner_koruma_yayin_kapisi()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF NEW.durum='yayinda' AND (TG_OP='INSERT' OR OLD.durum IS DISTINCT FROM NEW.durum
   OR OLD.yayin_egitim_video_id IS DISTINCT FROM NEW.yayin_egitim_video_id OR OLD.yayin_podcast_id IS DISTINCT FROM NEW.yayin_podcast_id) THEN
  IF NEW.koruma_surumu<>1 OR NEW.koruma_kaynak_id IS NULL
   OR NEW.koruma_kaynak_id IS DISTINCT FROM (CASE WHEN NEW.yayin_araci='video' THEN NEW.yayin_egitim_video_id ELSE NEW.yayin_podcast_id END) THEN
    RAISE EXCEPTION 'AGORA_KORUMA_EKSIK';
  END IF;
 END IF;
 RETURN NEW;
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_koruma_yayin_kapisi() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS agora_partner_koruma_yayin_kapisi ON public.agora_partner_egitimleri;
CREATE TRIGGER agora_partner_koruma_yayin_kapisi BEFORE INSERT OR UPDATE ON public.agora_partner_egitimleri
 FOR EACH ROW EXECUTE FUNCTION public.agora_partner_koruma_yayin_kapisi();
CREATE OR REPLACE VIEW public.agora_yayindaki_egitimler AS
 SELECT e.egitim_id,e.partner_id,f.sirket_adi,e.egitim_adi,e.kategori,e.yayin_araci,e.fiyat_tl,
 e.bilgiler->'hedef_roller' AS hedef_roller,e.bilgiler->>'aciklama' AS aciklama,e.yayinlandi_at
 FROM public.agora_partner_egitimleri e JOIN public.agora_is_partnerleri p USING(partner_id)
 JOIN public.agora_partner_profilleri f USING(partner_id)
 LEFT JOIN public.agora_partner_videolari v ON v.yukleme_id=e.yayin_egitim_video_id AND v.egitim_id=e.egitim_id AND v.rol='egitim' AND v.durum='hazir'
 LEFT JOIN public.agora_partner_podcastleri a ON a.yukleme_id=e.yayin_podcast_id AND a.egitim_id=e.egitim_id AND a.durum='hazir'
 WHERE e.koruma_surumu=1 AND e.koruma_kaynak_id=CASE WHEN e.yayin_araci='video' THEN e.yayin_egitim_video_id ELSE e.yayin_podcast_id END AND e.durum='yayinda' AND e.silindi_at IS NULL AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi'
 AND ((e.yayin_araci='video' AND v.yukleme_id IS NOT NULL) OR (e.yayin_araci='podcast' AND a.yukleme_id IS NOT NULL));
REVOKE ALL ON public.agora_yayindaki_egitimler FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.agora_yayindaki_egitimler TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_partner_koruma_hazirla(text,uuid,integer,uuid)') IS NOT NULL
 AND NOT has_function_privilege('authenticated','public.agora_partner_koruma_hazirla(text,uuid,integer,uuid)','EXECUTE')
 AND EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='agora_partner_koruma_yayin_kapisi' AND NOT tgisinternal)
 AS agora_partner_koruma_paketi_hazir;
