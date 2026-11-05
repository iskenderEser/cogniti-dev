-- Adım 7. Önceki partner kurulumlarından sonra tamamını çalıştırın.
-- Video Stream GUID'leri ve podcast Storage nesneleri ayrı tablolardadır.
BEGIN;
CREATE TABLE IF NOT EXISTS public.agora_partner_videolari (
 yukleme_id uuid PRIMARY KEY, egitim_id uuid NOT NULL REFERENCES public.agora_partner_egitimleri(egitim_id),
 rol text NOT NULL CHECK(rol IN ('egitim','tanitim')), video_guid uuid NOT NULL UNIQUE,
 dosya_adi text NOT NULL CHECK(char_length(dosya_adi) BETWEEN 1 AND 255),
 dosya_boyutu bigint NOT NULL CHECK(dosya_boyutu>0 AND dosya_boyutu<=5368709120),
 durum text NOT NULL DEFAULT 'yukleniyor' CHECK(durum IN ('yukleniyor','isleniyor','hazir','hata')),
 sure_saniye integer CHECK(sure_saniye>0), olusturuldu_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.agora_partner_podcastleri (
 yukleme_id uuid PRIMARY KEY, egitim_id uuid NOT NULL REFERENCES public.agora_partner_egitimleri(egitim_id),
 dosya_yolu text NOT NULL UNIQUE, dosya_adi text NOT NULL CHECK(char_length(dosya_adi) BETWEEN 1 AND 255),
 dosya_boyutu bigint NOT NULL CHECK(dosya_boyutu>0 AND dosya_boyutu<=262144000),
 mime_type text NOT NULL CHECK(mime_type IN ('audio/mpeg','audio/mp4','audio/aac','audio/x-m4a')),
 checksum_sha256 text NOT NULL CHECK(checksum_sha256 ~ '^[0-9a-f]{64}$'),
 durum text NOT NULL DEFAULT 'yukleniyor' CHECK(durum IN ('yukleniyor','hazir')),
 olusturuldu_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agora_partner_video_egitim ON public.agora_partner_videolari(egitim_id,rol,olusturuldu_at DESC);
CREATE INDEX IF NOT EXISTS agora_partner_podcast_egitim ON public.agora_partner_podcastleri(egitim_id,olusturuldu_at DESC);
ALTER TABLE public.agora_partner_videolari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_partner_podcastleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_videolari,public.agora_partner_podcastleri FROM PUBLIC,anon,authenticated,service_role;

-- Aynı form anahtarıyla yalnız bir eğitim; mevcut eğitimin sahipliği tekrar kontrol edilir.
CREATE OR REPLACE FUNCTION public.agora_partner_medya_egitimi(p_token_ozeti text,p_egitim_id uuid,p_egitim_adi text,p_istek_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_partner uuid; v public.agora_partner_egitimleri%ROWTYPE;
BEGIN
 SELECT p.partner_id INTO v_partner FROM public.agora_is_partnerleri p
 JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
 WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi' FOR UPDATE OF p;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF p_egitim_id IS NULL THEN
  IF p_istek_id IS NULL OR p_egitim_adi IS NULL OR char_length(btrim(p_egitim_adi)) NOT BETWEEN 3 AND 200 OR p_egitim_adi ~ '[[:cntrl:]]' THEN RETURN NULL; END IF;
  INSERT INTO public.agora_partner_egitimleri(partner_id,egitim_adi,olusturma_istegi) VALUES(v_partner,btrim(p_egitim_adi),p_istek_id) ON CONFLICT(partner_id,olusturma_istegi) DO NOTHING;
  SELECT * INTO v FROM public.agora_partner_egitimleri WHERE partner_id=v_partner AND olusturma_istegi=p_istek_id FOR UPDATE;
 ELSE
  SELECT * INTO v FROM public.agora_partner_egitimleri WHERE partner_id=v_partner AND egitim_id=p_egitim_id FOR UPDATE;
 END IF;
 IF v.egitim_id IS NULL OR v.silindi_at IS NOT NULL OR v.durum<>'taslak' THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('egitim_id',v.egitim_id,'surum',v.surum);
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_video_ekle(p_token_ozeti text,p_egitim_id uuid,p_yukleme_id uuid,p_rol text,p_guid uuid,p_dosya_adi text,p_boyut bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF public.agora_partner_medya_egitimi(p_token_ozeti,p_egitim_id,NULL,NULL) IS NULL THEN RETURN false; END IF;
 INSERT INTO public.agora_partner_videolari(yukleme_id,egitim_id,rol,video_guid,dosya_adi,dosya_boyutu) VALUES(p_yukleme_id,p_egitim_id,p_rol,p_guid,p_dosya_adi,p_boyut);
 RETURN true;
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_video_aktarim(p_token_ozeti text,p_egitim_id uuid,p_yukleme_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF public.agora_partner_medya_egitimi(p_token_ozeti,p_egitim_id,NULL,NULL) IS NULL THEN RETURN false; END IF;
 UPDATE public.agora_partner_videolari SET durum=CASE WHEN durum='yukleniyor' THEN 'isleniyor' ELSE durum END WHERE yukleme_id=p_yukleme_id AND egitim_id=p_egitim_id;
 RETURN FOUND;
END;
$f$;
-- Yalnız sunucunun Bunny'den doğruladığı sonuç; webhook ve mutabakat aynı işlevi kullanır.
CREATE OR REPLACE FUNCTION public.agora_partner_video_sonucu(p_guid uuid,p_hazir boolean,p_hatali boolean,p_sure integer)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' AS $f$
 UPDATE public.agora_partner_videolari SET
 durum=CASE WHEN p_hatali OR (p_hazir AND rol='tanitim' AND p_sure>120) THEN 'hata' WHEN p_hazir AND p_sure>0 THEN 'hazir' ELSE durum END,
 sure_saniye=CASE WHEN p_hazir AND p_sure>0 THEN p_sure ELSE sure_saniye END
 WHERE video_guid=p_guid;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_podcast_ekle(p_token_ozeti text,p_egitim_id uuid,p_yukleme_id uuid,p_yol text,p_dosya_adi text,p_boyut bigint,p_mime text,p_checksum text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF public.agora_partner_medya_egitimi(p_token_ozeti,p_egitim_id,NULL,NULL) IS NULL THEN RETURN false; END IF;
 INSERT INTO public.agora_partner_podcastleri(yukleme_id,egitim_id,dosya_yolu,dosya_adi,dosya_boyutu,mime_type,checksum_sha256) VALUES(p_yukleme_id,p_egitim_id,p_yol,p_dosya_adi,p_boyut,p_mime,p_checksum);
 RETURN true;
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_podcast_tamamla(p_token_ozeti text,p_egitim_id uuid,p_yukleme_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF public.agora_partner_medya_egitimi(p_token_ozeti,p_egitim_id,NULL,NULL) IS NULL THEN RETURN false; END IF;
 UPDATE public.agora_partner_podcastleri SET durum='hazir' WHERE yukleme_id=p_yukleme_id AND egitim_id=p_egitim_id;
 RETURN FOUND;
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_medya_oku(p_token_ozeti text,p_egitim_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $f$
 SELECT jsonb_build_object('videolar',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.olusturuldu_at DESC,v.yukleme_id) FROM public.agora_partner_videolari v WHERE v.egitim_id=e.egitim_id),'[]'::jsonb),
 'podcastler',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.olusturuldu_at DESC,a.yukleme_id) FROM public.agora_partner_podcastleri a WHERE a.egitim_id=e.egitim_id),'[]'::jsonb))
 FROM public.agora_partner_egitimleri e JOIN public.agora_is_partnerleri p USING(partner_id)
 JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
 WHERE e.egitim_id=p_egitim_id AND e.silindi_at IS NULL AND s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi';
$f$;
DO $do$ DECLARE f record; BEGIN
 FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('agora_partner_medya_egitimi','agora_partner_video_ekle','agora_partner_video_aktarim','agora_partner_video_sonucu','agora_partner_podcast_ekle','agora_partner_podcast_tamamla','agora_partner_medya_oku') LOOP
  EXECUTE 'REVOKE ALL ON FUNCTION '||f.signature||' FROM PUBLIC,anon,authenticated,service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION '||f.signature||' TO service_role';
 END LOOP;
END $do$;
COMMIT;
SELECT to_regclass('public.agora_partner_videolari') IS NOT NULL AND to_regclass('public.agora_partner_podcastleri') IS NOT NULL
 AND has_function_privilege('service_role','public.agora_partner_medya_oku(text,uuid)','EXECUTE')
 AND NOT has_function_privilege('authenticated','public.agora_partner_medya_oku(text,uuid)','EXECUTE') AS agora_partner_medya_yukleme_hazir;
