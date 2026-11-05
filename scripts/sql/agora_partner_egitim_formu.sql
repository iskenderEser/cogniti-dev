-- Agora / Adım 6: hazır içerik ve soru seti form bilgileri. Medya yükleme ayrı adımdır.
BEGIN;
ALTER TABLE public.agora_partner_egitimleri ADD COLUMN IF NOT EXISTS bilgiler jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(bilgiler)='object');
CREATE OR REPLACE FUNCTION public.agora_partner_egitim_detay_oku(p_token_ozeti text,p_egitim_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $f$
  SELECT jsonb_build_object('egitim_id',e.egitim_id,'egitim_adi',e.egitim_adi,'surum',e.surum,'durum',e.durum,'bilgiler',e.bilgiler)
  FROM public.agora_partner_egitimleri e JOIN public.agora_is_partnerleri p USING(partner_id)
  JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
  WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi'
    AND e.egitim_id=p_egitim_id AND e.silindi_at IS NULL;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_egitim_formu_kaydet(p_token_ozeti text,p_egitim_id uuid,p_egitim_adi text,p_surum integer,p_istek_id uuid,p_kategori text,p_yayin_araci text,p_fiyat_tl numeric,p_bilgiler jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v_partner uuid; v public.agora_partner_egitimleri%ROWTYPE;
BEGIN
  SELECT p.partner_id INTO v_partner FROM public.agora_is_partnerleri p
    JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
    WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi' FOR UPDATE OF p;
  IF NOT FOUND THEN RETURN 'yetkisiz'; END IF;
  IF p_egitim_adi IS NULL OR char_length(btrim(p_egitim_adi)) NOT BETWEEN 3 AND 200 OR p_egitim_adi ~ '[[:cntrl:]]' OR p_istek_id IS NULL OR p_surum IS NULL THEN RAISE EXCEPTION 'Geçersiz eğitim'; END IF;
  IF p_kategori IS NULL OR p_yayin_araci IS NULL OR p_kategori NOT IN ('urun','urun_medikal','medikal','egitim','yonetim','ik') OR p_yayin_araci NOT IN ('video','podcast') OR p_fiyat_tl IS NULL OR p_fiyat_tl<0 OR p_fiyat_tl>9999999999.99 OR jsonb_typeof(p_bilgiler) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Geçersiz eğitim bilgileri'; END IF;
  IF p_egitim_id IS NULL THEN
    IF p_surum<>0 THEN RETURN 'cakisma'; END IF;
    INSERT INTO public.agora_partner_egitimleri(partner_id,egitim_adi,olusturma_istegi,kategori,yayin_araci,fiyat_tl,bilgiler) VALUES(v_partner,btrim(p_egitim_adi),p_istek_id,p_kategori,p_yayin_araci,p_fiyat_tl,p_bilgiler) ON CONFLICT(partner_id,olusturma_istegi) DO NOTHING;
    RETURN 'tamam';
  END IF;
  SELECT * INTO v FROM public.agora_partner_egitimleri WHERE egitim_id=p_egitim_id AND partner_id=v_partner AND silindi_at IS NULL FOR UPDATE;
  IF NOT FOUND OR v.surum<>p_surum OR v.durum<>'taslak' THEN RETURN 'cakisma'; END IF;
  UPDATE public.agora_partner_egitimleri SET egitim_adi=btrim(p_egitim_adi),kategori=p_kategori,yayin_araci=p_yayin_araci,fiyat_tl=p_fiyat_tl,bilgiler=p_bilgiler,surum=surum+1,guncellendi_at=now() WHERE egitim_id=v.egitim_id;
  RETURN 'tamam';
END;
$f$;

REVOKE ALL ON FUNCTION public.agora_partner_egitim_detay_oku(text,uuid),public.agora_partner_egitim_formu_kaydet(text,uuid,text,integer,uuid,text,text,numeric,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_egitim_detay_oku(text,uuid),public.agora_partner_egitim_formu_kaydet(text,uuid,text,integer,uuid,text,text,numeric,jsonb) TO service_role;
COMMIT;
SELECT (
 to_regprocedure('public.agora_partner_egitim_detay_oku(text,uuid)') IS NOT NULL
 AND to_regprocedure('public.agora_partner_egitim_formu_kaydet(text,uuid,text,integer,uuid,text,text,numeric,jsonb)') IS NOT NULL
 AND NOT has_function_privilege('authenticated','public.agora_partner_egitim_detay_oku(text,uuid)','EXECUTE')
 AND has_function_privilege('service_role','public.agora_partner_egitim_formu_kaydet(text,uuid,text,integer,uuid,text,text,numeric,jsonb)','EXECUTE')
) AS agora_partner_egitim_formu_hazir;
