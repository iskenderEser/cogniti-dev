-- Admin Yayınlar kartına mevcut partner eğitim kodunu döndürür.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_partner_admin_yayinlari(p_admin_id uuid,p_partner_id uuid,p_durum text DEFAULT 'tumu',p_sayfa integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE toplam integer; kayitlar jsonb;
BEGIN
 PERFORM public.agora_partner_admin_dogrula(p_admin_id);
 IF p_durum IS NULL OR p_durum NOT IN ('tumu','taslak','yayinda','pasif') OR p_sayfa IS NULL OR p_sayfa<1 OR p_sayfa>100000 THEN RAISE EXCEPTION 'Geçersiz seçim'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.agora_partner_profilleri WHERE partner_id=p_partner_id) THEN RETURN NULL; END IF;
 SELECT count(*) INTO toplam FROM public.agora_partner_egitimleri WHERE partner_id=p_partner_id AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum);
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.olusturuldu_at DESC,r.egitim_id),'[]'::jsonb) INTO kayitlar FROM (
  SELECT egitim_id,partner_egitim_id,egitim_adi,kategori,yayin_araci,fiyat_tl,durum,surum,olusturuldu_at,guncellendi_at,yayinlandi_at
  FROM public.agora_partner_egitimleri WHERE partner_id=p_partner_id AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum)
  ORDER BY olusturuldu_at DESC,egitim_id LIMIT 20 OFFSET (p_sayfa-1)*20
 ) r;
 RETURN jsonb_build_object('toplam',toplam,'kayitlar',kayitlar);
END;
$f$;
COMMIT;
SELECT position('partner_egitim_id' in pg_get_functiondef('public.agora_partner_admin_yayinlari(uuid,uuid,text,integer)'::regprocedure))>0 AS agora_partner_admin_kart_id_hazir;
