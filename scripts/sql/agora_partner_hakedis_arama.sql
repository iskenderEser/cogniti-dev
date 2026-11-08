-- KULLANICI ÇALIŞTIRACAK. Hak ediş kurulumu üzerine eklenir.
-- ID/eğitim adı araması tüm kayıtları kapsar; admin listesi değişmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_partner_hakedis_arama_kayitlari(p_partner_id uuid, p_sayfa integer, p_arama text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE kayitlar jsonb; toplam bigint;
BEGIN
  IF p_sayfa IS NULL OR p_sayfa < 1 OR p_sayfa > 100000 THEN
    RAISE EXCEPTION 'Geçersiz hak ediş sayfası.' USING ERRCODE = '22023';
  END IF;
  IF p_arama IS NULL OR char_length(p_arama) > 200 THEN
    RAISE EXCEPTION 'Geçersiz arama.' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO toplam FROM public.agora_siparisleri WHERE partner_id = p_partner_id AND (strpos(lower(translate(partner_egitim_id, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0 OR strpos(lower(translate(egitim_adi, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0);
  SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.siparis_tarihi DESC, s.siparis_id DESC), '[]'::jsonb)
    INTO kayitlar FROM (
      SELECT siparis_id, partner_egitim_id, egitim_adi, siparis_tarihi,
        satin_alma_bedeli, hizmet_bedeli, odenecek_tutar AS hak_edis,
        kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu, odenen_gun
      FROM public.agora_siparisleri WHERE partner_id = p_partner_id AND (strpos(lower(translate(partner_egitim_id, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0 OR strpos(lower(translate(egitim_adi, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0)
      ORDER BY siparis_tarihi DESC, siparis_id DESC LIMIT 20 OFFSET (p_sayfa - 1) * 20
    ) s;
  RETURN jsonb_build_object('partner_id', p_partner_id, 'toplam', toplam,
    'sayfa', p_sayfa, 'sayfa_boyutu', 20, 'kayitlar', kayitlar);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_hakedis_ara(p_token_ozeti text, p_sayfa integer, p_arama text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE partner uuid;
BEGIN
  SELECT p.partner_id INTO partner
    FROM public.agora_partner_oturumlari s
    JOIN public.agora_is_partnerleri p USING(partner_id)
    JOIN public.agora_partner_profilleri f USING(partner_id)
    WHERE s.token_ozeti = p_token_ozeti AND s.bitis_at > now()
      AND s.giris_surum = p.giris_surum AND p.erisim_acik
      AND p.ilk_giris_durumu = 'onaylandi' AND p.uyelik_durumu = 'onaylandi';
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN public.agora_partner_hakedis_arama_kayitlari(partner, p_sayfa, p_arama);
END;
$f$;

REVOKE ALL ON FUNCTION public.agora_partner_hakedis_arama_kayitlari(uuid,integer,text),
 public.agora_partner_hakedis_ara(text,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_hakedis_ara(text,integer,text) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS agora_partner_hakedis_arama_hazir;
