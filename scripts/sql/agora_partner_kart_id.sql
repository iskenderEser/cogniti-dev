-- Mevcut PE kodunu partner kartının liste verisine ekler. Yeni kod üretmez.
BEGIN;
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
    SELECT egitim_id,partner_egitim_id,egitim_adi,kategori,yayin_araci,fiyat_tl,durum,surum,olusturuldu_at,guncellendi_at FROM public.agora_partner_egitimleri
    WHERE partner_id=v_partner AND silindi_at IS NULL AND (p_durum='tumu' OR durum=p_durum) ORDER BY olusturuldu_at DESC,egitim_id LIMIT 20 OFFSET (p_sayfa-1)*20
  ) r;
  RETURN jsonb_build_object('kayitlar',v_liste,'toplam',v_toplam);
END;
$f$;
COMMIT;
SELECT true AS agora_partner_kart_id_hazir;
