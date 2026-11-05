-- Partner kendi eğitimini listesinden kaldırır; içerik kaydı fiziksel olarak korunur.
BEGIN;
ALTER TABLE public.agora_partner_egitimleri ADD COLUMN IF NOT EXISTS silindi_at timestamptz;
CREATE OR REPLACE FUNCTION public.agora_partner_egitimleri_oku(p_token_ozeti text,p_durum text DEFAULT 'tumu',p_sayfa integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v_partner uuid; v_liste jsonb; v_toplam integer;
BEGIN
  IF p_durum IS NULL OR p_durum NOT IN ('tumu','taslak','yayinda','pasif') OR p_sayfa IS NULL OR p_sayfa<1 OR p_sayfa>100000 THEN RAISE EXCEPTION 'Geçersiz seçim'; END IF;
  SELECT p.partner_id INTO v_partner FROM public.agora_is_partnerleri p
    JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
    WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi';
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT count(*) INTO v_toplam FROM public.agora_partner_egitimleri WHERE partner_id=v_partner AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum);
  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.olusturuldu_at DESC,r.egitim_id),'[]'::jsonb) INTO v_liste FROM (
    SELECT egitim_id,egitim_adi,kategori,yayin_araci,fiyat_tl,durum,surum,olusturuldu_at,guncellendi_at FROM public.agora_partner_egitimleri
    WHERE partner_id=v_partner AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum) ORDER BY olusturuldu_at DESC,egitim_id LIMIT 20 OFFSET (p_sayfa-1)*20
  ) r;
  RETURN jsonb_build_object('kayitlar',v_liste,'toplam',v_toplam);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_egitim_taslagi_kaydet(p_token_ozeti text,p_egitim_id uuid,p_egitim_adi text,p_surum integer,p_istek_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v_partner uuid; v public.agora_partner_egitimleri%ROWTYPE;
BEGIN
  SELECT p.partner_id INTO v_partner FROM public.agora_is_partnerleri p
    JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
    WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi' FOR UPDATE OF p;
  IF NOT FOUND THEN RETURN 'yetkisiz'; END IF;
  IF p_egitim_adi IS NULL OR char_length(btrim(p_egitim_adi)) NOT BETWEEN 3 AND 200 OR p_egitim_adi ~ '[[:cntrl:]]' OR p_istek_id IS NULL OR p_surum IS NULL THEN RAISE EXCEPTION 'Geçersiz eğitim'; END IF;
  IF p_egitim_id IS NULL THEN
    IF p_surum<>0 THEN RETURN 'cakisma'; END IF;
    INSERT INTO public.agora_partner_egitimleri(partner_id,egitim_adi,olusturma_istegi) VALUES(v_partner,btrim(p_egitim_adi),p_istek_id) ON CONFLICT(partner_id,olusturma_istegi) DO NOTHING;
    RETURN 'tamam';
  END IF;
  SELECT * INTO v FROM public.agora_partner_egitimleri WHERE egitim_id=p_egitim_id AND partner_id=v_partner AND silindi_at IS NULL FOR UPDATE;
  IF NOT FOUND OR v.surum<>p_surum OR v.durum<>'taslak' THEN RETURN 'cakisma'; END IF;
  UPDATE public.agora_partner_egitimleri SET egitim_adi=btrim(p_egitim_adi),surum=surum+1,guncellendi_at=now() WHERE egitim_id=v.egitim_id;
  RETURN 'tamam';
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_egitim_sil(p_token_ozeti text,p_egitim_id uuid,p_surum integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v_partner uuid; v public.agora_partner_egitimleri%ROWTYPE;
BEGIN
  SELECT p.partner_id INTO v_partner FROM public.agora_is_partnerleri p
    JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_partner_profilleri f USING(partner_id)
    WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi' FOR UPDATE OF p;
  IF NOT FOUND THEN RETURN 'yetkisiz'; END IF;
  SELECT * INTO v FROM public.agora_partner_egitimleri WHERE egitim_id=p_egitim_id AND partner_id=v_partner FOR UPDATE;
  IF NOT FOUND THEN RETURN 'cakisma'; END IF;
  IF p_surum IS NULL OR p_surum<1 THEN RETURN 'cakisma'; END IF;
  IF v.silindi_at IS NOT NULL THEN RETURN 'tamam'; END IF;
  IF v.surum<>p_surum THEN RETURN 'cakisma'; END IF;
  UPDATE public.agora_partner_egitimleri SET silindi_at=now(),surum=surum+1,guncellendi_at=now() WHERE egitim_id=v.egitim_id;
  RETURN 'tamam';
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_egitim_sil(text,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_egitim_sil(text,uuid,integer) TO service_role;
REVOKE ALL ON FUNCTION public.agora_partner_egitimleri_oku(text,text,integer),public.agora_partner_egitim_taslagi_kaydet(text,uuid,text,integer,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_egitimleri_oku(text,text,integer),public.agora_partner_egitim_taslagi_kaydet(text,uuid,text,integer,uuid) TO service_role;
COMMIT;
SELECT (
  to_regprocedure('public.agora_partner_egitim_sil(text,uuid,integer)') IS NOT NULL
  AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agora_partner_egitimleri' AND column_name='silindi_at')
  AND NOT has_function_privilege('authenticated','public.agora_partner_egitim_sil(text,uuid,integer)','EXECUTE')
  AND has_function_privilege('service_role','public.agora_partner_egitim_sil(text,uuid,integer)','EXECUTE')
) AS agora_partner_egitim_silme_hazir;
