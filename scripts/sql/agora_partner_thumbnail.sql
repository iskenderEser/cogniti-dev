-- Kart kapağı eğitim videosundan gelir; logo veya tanıtım videosu kullanılmaz.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_partner_kart_video_guid(p_egitim_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT CASE WHEN e.yayin_araci='video' THEN
  CASE WHEN e.yayinlandi_at IS NOT NULL THEN
   (SELECT v.video_guid FROM public.agora_partner_videolari v WHERE v.yukleme_id=e.yayin_egitim_video_id AND v.egitim_id=e.egitim_id AND v.rol='egitim' AND v.durum='hazir')
  ELSE
   (SELECT CASE WHEN v.durum='hazir' THEN v.video_guid END FROM public.agora_partner_videolari v WHERE v.egitim_id=e.egitim_id AND v.rol='egitim' ORDER BY v.olusturuldu_at DESC,v.yukleme_id LIMIT 1)
  END END
 FROM public.agora_partner_egitimleri e WHERE e.egitim_id=p_egitim_id AND e.silindi_at IS NULL;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_kart_video_guid(uuid) FROM PUBLIC,anon,authenticated,service_role;
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
    SELECT egitim_id,partner_egitim_id,public.agora_partner_kart_video_guid(egitim_id) AS kapak_video_guid,egitim_adi,kategori,yayin_araci,fiyat_tl,durum,surum,olusturuldu_at,guncellendi_at FROM public.agora_partner_egitimleri
    WHERE partner_id=v_partner AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum) ORDER BY olusturuldu_at DESC,egitim_id LIMIT 20 OFFSET (p_sayfa-1)*20
  ) r;
  RETURN jsonb_build_object('kayitlar',v_liste,'toplam',v_toplam);
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_admin_yayinlari(p_admin_id uuid,p_partner_id uuid,p_durum text DEFAULT 'tumu',p_sayfa integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE toplam integer; kayitlar jsonb;
BEGIN
 PERFORM public.agora_partner_admin_dogrula(p_admin_id);
 IF p_durum IS NULL OR p_durum NOT IN ('tumu','taslak','yayinda','pasif') OR p_sayfa IS NULL OR p_sayfa<1 OR p_sayfa>100000 THEN RAISE EXCEPTION 'Geçersiz seçim'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.agora_partner_profilleri WHERE partner_id=p_partner_id) THEN RETURN NULL; END IF;
 SELECT count(*) INTO toplam FROM public.agora_partner_egitimleri WHERE partner_id=p_partner_id AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum);
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.olusturuldu_at DESC,r.egitim_id),'[]'::jsonb) INTO kayitlar FROM (
  SELECT egitim_id,partner_egitim_id,public.agora_partner_kart_video_guid(egitim_id) AS kapak_video_guid,egitim_adi,kategori,yayin_araci,fiyat_tl,durum,surum,olusturuldu_at,guncellendi_at,yayinlandi_at
  FROM public.agora_partner_egitimleri WHERE partner_id=p_partner_id AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum)
  ORDER BY olusturuldu_at DESC,egitim_id LIMIT 20 OFFSET (p_sayfa-1)*20
 ) r;
 RETURN jsonb_build_object('toplam',toplam,'kayitlar',kayitlar);
END;
$f$;
COMMIT;
SELECT true AS agora_partner_thumbnail_hazir;
