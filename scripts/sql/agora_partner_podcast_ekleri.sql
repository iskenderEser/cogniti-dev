-- Önkoşul: agora_partner_podcast_sure.sql. Kullanıcı uygular.
BEGIN;
CREATE TABLE IF NOT EXISTS public.agora_partner_podcast_ekleri (
 yukleme_id uuid PRIMARY KEY REFERENCES public.agora_partner_podcastleri(yukleme_id),
 kapak_yolu text, transkript jsonb NOT NULL DEFAULT '{"durum":"yok"}',
 surum integer NOT NULL DEFAULT 1 CHECK(surum>0), guncellendi_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.agora_partner_transkript_isleri (
 is_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), yukleme_id uuid NOT NULL REFERENCES public.agora_partner_podcastleri(yukleme_id),
 girisim_id uuid NOT NULL UNIQUE, model text NOT NULL, durum text NOT NULL DEFAULT 'bekliyor' CHECK(durum IN ('bekliyor','isleniyor','tamam','iptal','hata')),
 lease uuid, lease_bitis timestamptz, deneme integer NOT NULL DEFAULT 0,
 tekrar timestamptz NOT NULL DEFAULT now(), olusturuldu_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_partner_podcast_ekleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_partner_transkript_isleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_podcast_ekleri,public.agora_partner_transkript_isleri FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.agora_partner_podcast_ekleri_islem(p_token_ozeti text,p_egitim_id uuid,p_yukleme_id uuid,p_islem text,p_surum integer DEFAULT NULL,p_veri jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE partner uuid; e public.agora_partner_podcast_ekleri%ROWTYPE; a public.agora_partner_podcastleri%ROWTYPE; metin text; girisim uuid;
BEGIN
 SELECT p.partner_id INTO partner FROM public.agora_is_partnerleri p JOIN public.agora_partner_oturumlari s USING(partner_id)
 WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum
 AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi' FOR UPDATE OF p;
 IF NOT FOUND THEN RAISE EXCEPTION 'Partner oturumu doğrulanamadı.' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.agora_partner_egitimleri t WHERE t.egitim_id=p_egitim_id AND t.partner_id=partner AND t.silindi_at IS NULL
 AND (p_islem='oku' OR t.durum='taslak') FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Eğitim düzenlemeye kapalı.' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.agora_partner_podcastleri WHERE yukleme_id=p_yukleme_id AND egitim_id=p_egitim_id AND durum='hazir';
 IF NOT FOUND THEN RAISE EXCEPTION 'Önce podcast sesini yükleyin.' USING ERRCODE='22023'; END IF;
 INSERT INTO public.agora_partner_podcast_ekleri(yukleme_id) VALUES(a.yukleme_id) ON CONFLICT DO NOTHING;
 SELECT * INTO e FROM public.agora_partner_podcast_ekleri WHERE yukleme_id=a.yukleme_id FOR UPDATE;
 IF p_islem='oku' THEN RETURN to_jsonb(e); END IF;
 IF p_surum IS DISTINCT FROM e.surum THEN RAISE EXCEPTION 'Podcast bilgileri değişti. Yenileyin.' USING ERRCODE='40001'; END IF;
 IF p_islem='kapak' THEN
  IF p_veri->>'yol' IS NOT NULL AND (p_veri->>'yol' NOT LIKE 'agora/'||partner||'/'||p_egitim_id||'/'||a.yukleme_id||'/kapak/%') THEN
   RAISE EXCEPTION 'Geçersiz yayın görseli.' USING ERRCODE='22023'; END IF;
  UPDATE public.agora_partner_podcast_ekleri SET kapak_yolu=p_veri->>'yol' WHERE yukleme_id=a.yukleme_id;
 ELSIF p_islem IN ('metin','onayla') THEN
  metin:=btrim(p_veri->>'metin');
  IF metin IS NULL OR length(metin) NOT BETWEEN 10 AND 100000 THEN RAISE EXCEPTION 'Transkript 10–100000 karakter olmalıdır.' USING ERRCODE='22023'; END IF;
  UPDATE public.agora_partner_podcast_ekleri SET transkript=jsonb_build_object(
   'durum',CASE WHEN p_islem='onayla' THEN 'onaylandi' ELSE 'manuel_taslak' END,
   'kaynak',coalesce(e.transkript->>'kaynak','manuel'),'taslak_metin',metin,
   'onaylanan_metin',CASE WHEN p_islem='onayla' THEN metin ELSE NULL END,
   'bagli_ses_checksum',a.checksum_sha256,'onay_tarihi',CASE WHEN p_islem='onayla' THEN now() ELSE NULL END)
  WHERE yukleme_id=a.yukleme_id;
  UPDATE public.agora_partner_transkript_isleri SET durum='iptal',lease=NULL,lease_bitis=NULL WHERE yukleme_id=a.yukleme_id AND durum IN ('bekliyor','isleniyor');
 ELSIF p_islem='iptal' THEN
  UPDATE public.agora_partner_podcast_ekleri SET transkript='{"durum":"iptal"}' WHERE yukleme_id=a.yukleme_id;
  UPDATE public.agora_partner_transkript_isleri SET durum='iptal',lease=NULL,lease_bitis=NULL WHERE yukleme_id=a.yukleme_id AND durum IN ('bekliyor','isleniyor');
 ELSIF p_islem='ai' THEN
  IF a.sure_saniye IS NULL OR a.sure_saniye<=0 THEN RAISE EXCEPTION 'Podcast süresi tamamlanmalıdır.' USING ERRCODE='22023'; END IF;
  IF e.transkript->>'durum' IN ('ai_bekliyor','ai_isleniyor') THEN RETURN to_jsonb(e); END IF;
  girisim:=gen_random_uuid();
  UPDATE public.agora_partner_podcast_ekleri SET transkript=jsonb_build_object('durum','ai_bekliyor','kaynak','ai','girisim_id',girisim,'bagli_ses_checksum',a.checksum_sha256) WHERE yukleme_id=a.yukleme_id;
  INSERT INTO public.agora_partner_transkript_isleri(yukleme_id,girisim_id,model) VALUES(a.yukleme_id,girisim,coalesce(nullif(p_veri->>'model',''),'gemini-3.5-flash'));
 ELSE RAISE EXCEPTION 'Geçersiz podcast işlemi.' USING ERRCODE='22023'; END IF;
 UPDATE public.agora_partner_podcast_ekleri SET surum=surum+1,guncellendi_at=now() WHERE yukleme_id=a.yukleme_id RETURNING * INTO e;
 RETURN to_jsonb(e);
END $f$;

CREATE OR REPLACE FUNCTION public.agora_partner_transkript_isi(p_islem text,p_veri jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE j public.agora_partner_transkript_isleri%ROWTYPE; e public.agora_partner_podcast_ekleri%ROWTYPE; anahtar uuid;
BEGIN
 IF p_islem='al' THEN
  SELECT x.* INTO e FROM public.agora_partner_podcast_ekleri x
  WHERE EXISTS(SELECT 1 FROM public.agora_partner_transkript_isleri i WHERE i.yukleme_id=x.yukleme_id
   AND ((i.durum='bekliyor' AND i.tekrar<=now()) OR (i.durum='isleniyor' AND i.lease_bitis<=now()))
   AND x.transkript->>'girisim_id'=i.girisim_id::text AND x.transkript->>'durum' IN ('ai_bekliyor','ai_isleniyor'))
  ORDER BY x.guncellendi_at LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO j FROM public.agora_partner_transkript_isleri WHERE yukleme_id=e.yukleme_id AND girisim_id::text=e.transkript->>'girisim_id' FOR UPDATE;
  IF j.deneme>=5 THEN
   UPDATE public.agora_partner_transkript_isleri SET durum='hata',lease=NULL,lease_bitis=NULL WHERE is_id=j.is_id;
   UPDATE public.agora_partner_podcast_ekleri SET transkript=jsonb_set(transkript,'{durum}','"hata"'),surum=surum+1 WHERE yukleme_id=e.yukleme_id;
   RETURN NULL;
  END IF;
  anahtar:=gen_random_uuid();
  UPDATE public.agora_partner_transkript_isleri SET durum='isleniyor',lease=anahtar,lease_bitis=now()+interval '180 seconds',deneme=deneme+1 WHERE is_id=j.is_id RETURNING * INTO j;
  -- Sonuç kaydı ile kullanıcı düzenlemesi aynı ek kaydını kilitler.
  UPDATE public.agora_partner_podcast_ekleri SET transkript=jsonb_set(transkript,'{durum}','"ai_isleniyor"') WHERE yukleme_id=j.yukleme_id AND transkript->>'girisim_id'=j.girisim_id::text AND transkript->>'durum' IN ('ai_bekliyor','ai_isleniyor');
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN (SELECT to_jsonb(j)||jsonb_build_object('dosya_yolu',a.dosya_yolu,'mime_type',a.mime_type,'dosya_adi',a.dosya_adi) FROM public.agora_partner_podcastleri a WHERE a.yukleme_id=j.yukleme_id);
 END IF;
 -- Ek kaydı önce kilitlenir; düzenle/iptal ile worker aynı kilit sırasını kullanır.
 SELECT x.* INTO e FROM public.agora_partner_podcast_ekleri x JOIN public.agora_partner_transkript_isleri i USING(yukleme_id) WHERE i.is_id=(p_veri->>'is_id')::uuid FOR UPDATE OF x;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO j FROM public.agora_partner_transkript_isleri WHERE is_id=(p_veri->>'is_id')::uuid FOR UPDATE;
 IF j.durum<>'isleniyor' OR j.lease IS DISTINCT FROM (p_veri->>'lease')::uuid OR j.lease_bitis<=now()
 OR e.transkript->>'girisim_id' IS DISTINCT FROM j.girisim_id::text OR e.transkript->>'durum'<>'ai_isleniyor' THEN RETURN NULL; END IF;
 IF p_islem='tamamla' THEN
  IF length(btrim(p_veri->>'metin')) NOT BETWEEN 10 AND 100000 OR p_veri->>'metin' IS NULL THEN RAISE EXCEPTION 'Geçersiz transkript.' USING ERRCODE='22023'; END IF;
  UPDATE public.agora_partner_podcast_ekleri SET transkript=transkript||jsonb_build_object('durum','ai_taslak','taslak_metin',btrim(p_veri->>'metin')),surum=surum+1,guncellendi_at=now() WHERE yukleme_id=j.yukleme_id;
  UPDATE public.agora_partner_transkript_isleri SET durum='tamam',lease=NULL,lease_bitis=NULL WHERE is_id=j.is_id;
 ELSIF p_islem='hata' THEN
  IF j.deneme>=5 OR coalesce((p_veri->>'kalici')::boolean,false) THEN
   UPDATE public.agora_partner_podcast_ekleri SET transkript=transkript||jsonb_build_object('durum','hata'),surum=surum+1 WHERE yukleme_id=j.yukleme_id;
   UPDATE public.agora_partner_transkript_isleri SET durum='hata',lease=NULL,lease_bitis=NULL WHERE is_id=j.is_id;
  ELSE
   UPDATE public.agora_partner_transkript_isleri SET durum='bekliyor',lease=NULL,lease_bitis=NULL,tekrar=now()+interval '30 seconds' WHERE is_id=j.is_id;
   UPDATE public.agora_partner_podcast_ekleri SET transkript=jsonb_set(transkript,'{durum}','"ai_bekliyor"') WHERE yukleme_id=j.yukleme_id;
  END IF;
 ELSE RAISE EXCEPTION 'Geçersiz kuyruk işlemi.' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('tamam',true);
END $f$;
-- Satın alma paketine yalnız onaylı metin ve kayıtlı görsel aktarılır.
CREATE OR REPLACE FUNCTION public.agora_partner_podcast_ek_paket(p_yukleme_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT coalesce((SELECT jsonb_build_object('kapak_yolu',x.kapak_yolu,'transkript',
  CASE WHEN x.transkript->>'durum'='onaylandi' THEN jsonb_build_object('durum','onaylandi','kaynak',x.transkript->>'kaynak','onaylanan_metin',x.transkript->>'onaylanan_metin') ELSE NULL END)
 FROM public.agora_partner_podcast_ekleri x WHERE x.yukleme_id=p_yukleme_id),'{"kapak_yolu":null,"transkript":null}'::jsonb);
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_podcast_ek_paket(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_podcast_ek_paket(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.agora_partner_podcast_ek_yayin_kapisi()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF NEW.durum='yayinda' AND NEW.yayin_araci='podcast' AND (OLD.durum IS DISTINCT FROM NEW.durum OR OLD.yayin_podcast_id IS DISTINCT FROM NEW.yayin_podcast_id) THEN
  PERFORM 1 FROM public.agora_partner_podcast_ekleri WHERE yukleme_id=NEW.yayin_podcast_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.agora_partner_podcast_ekleri x WHERE x.yukleme_id=NEW.yayin_podcast_id AND coalesce(x.transkript->>'durum','yok') NOT IN ('yok','onaylandi','iptal')) THEN
   RAISE EXCEPTION 'Transkripti onaylayın veya transkriptsiz devam edin.' USING ERRCODE='22023'; END IF;
 END IF;
 RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS agora_partner_podcast_ek_yayin_kapisi ON public.agora_partner_egitimleri;
CREATE TRIGGER agora_partner_podcast_ek_yayin_kapisi BEFORE UPDATE ON public.agora_partner_egitimleri FOR EACH ROW EXECUTE FUNCTION public.agora_partner_podcast_ek_yayin_kapisi();
REVOKE ALL ON FUNCTION public.agora_partner_podcast_ekleri_islem(text,uuid,uuid,text,integer,jsonb),public.agora_partner_transkript_isi(text,jsonb),public.agora_partner_podcast_ek_yayin_kapisi() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_podcast_ekleri_islem(text,uuid,uuid,text,integer,jsonb),public.agora_partner_transkript_isi(text,jsonb) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_partner_podcast_ekleri_islem(text,uuid,uuid,text,integer,jsonb)') IS NOT NULL AS agora_partner_podcast_ekleri_hazir;
