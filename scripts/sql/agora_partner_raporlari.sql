-- KULLANICI ÇALIŞTIRACAK. Önkoşul: Agora eğitim, satın alma ve vitrin kurulumları.
-- Her eğitim bir satırdır. Satış toplamı satış anındaki bedellerin toplamıdır.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_partner_rapor_kayitlari(p_partner_id uuid, p_sayfa integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE kayitlar jsonb; toplam bigint;
BEGIN
  IF p_sayfa IS NULL OR p_sayfa < 1 OR p_sayfa > 100000 THEN
    RAISE EXCEPTION 'Geçersiz rapor sayfası.' USING ERRCODE = '22023';
  END IF;
  -- Silinen eğitimin gerçekleşmiş satışları rapordan düşmez.
  SELECT count(*) INTO toplam FROM public.agora_partner_egitimleri e
  WHERE e.partner_id = p_partner_id AND (e.silindi_at IS NULL OR EXISTS (
    SELECT 1 FROM public.agora_siparisleri s WHERE s.partner_id = p_partner_id AND s.egitim_id = e.egitim_id
  ));
  SELECT coalesce(jsonb_agg(to_jsonb(k) ORDER BY k.partner_egitim_id COLLATE "C", k.egitim_id), '[]'::jsonb)
  INTO kayitlar FROM (
    SELECT e.egitim_id, e.partner_egitim_id, e.egitim_adi, e.fiyat_tl AS satis_fiyati,
      s.satilan_adet, s.toplam_satis, i.begeni_sayisi, i.favori_sayisi
    FROM (
      SELECT e.egitim_id, e.partner_egitim_id, e.egitim_adi, e.fiyat_tl
      FROM public.agora_partner_egitimleri e
      WHERE e.partner_id = p_partner_id AND (e.silindi_at IS NULL OR EXISTS (
        SELECT 1 FROM public.agora_siparisleri s WHERE s.partner_id = p_partner_id AND s.egitim_id = e.egitim_id
      ))
      ORDER BY e.partner_egitim_id COLLATE "C", e.egitim_id
      LIMIT 20 OFFSET (p_sayfa - 1) * 20
    ) e
    CROSS JOIN LATERAL (
      SELECT count(*) AS satilan_adet, coalesce(sum(satin_alma_bedeli), 0) AS toplam_satis
      FROM public.agora_siparisleri WHERE partner_id = p_partner_id AND egitim_id = e.egitim_id
    ) s
    CROSS JOIN LATERAL (
      SELECT count(*) FILTER (WHERE i.begeni) AS begeni_sayisi,
        count(*) FILTER (WHERE i.favori) AS favori_sayisi
      FROM public.agora_vitrin_etkilesimleri i
      JOIN public.kullanicilar u ON u.kullanici_id = i.auth_id
      JOIN public.firmalar f ON f.firma_id = u.firma_id
      WHERE i.egitim_id = e.egitim_id AND u.aktif_mi AND f.aktif
    ) i
  ) k;
  RETURN jsonb_build_object('partner_id', p_partner_id, 'toplam', toplam,
    'sayfa', p_sayfa, 'sayfa_boyutu', 20, 'kayitlar', kayitlar);
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_raporlari_oku(p_token_ozeti text, p_sayfa integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE partner uuid;
BEGIN
  SELECT p.partner_id INTO partner FROM public.agora_partner_oturumlari s
  JOIN public.agora_is_partnerleri p USING(partner_id)
  JOIN public.agora_partner_profilleri f USING(partner_id)
  WHERE s.token_ozeti = p_token_ozeti AND s.bitis_at > now()
    AND s.giris_surum = p.giris_surum AND p.erisim_acik
    AND p.ilk_giris_durumu = 'onaylandi' AND p.uyelik_durumu = 'onaylandi';
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN public.agora_partner_rapor_kayitlari(partner, p_sayfa);
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_admin_raporlari_oku(
  p_admin_id uuid, p_partner_id uuid, p_sayfa integer DEFAULT 1
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF NOT EXISTS(SELECT 1 FROM public.agora_partner_profilleri WHERE partner_id = p_partner_id) THEN RETURN NULL; END IF;
  RETURN public.agora_partner_rapor_kayitlari(p_partner_id, p_sayfa);
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_rapor_kayitlari(uuid,integer),
  public.agora_partner_raporlari_oku(text,integer),
  public.agora_partner_admin_raporlari_oku(uuid,uuid,integer)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_raporlari_oku(text,integer),
  public.agora_partner_admin_raporlari_oku(uuid,uuid,integer) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS agora_partner_raporlari_hazir;
