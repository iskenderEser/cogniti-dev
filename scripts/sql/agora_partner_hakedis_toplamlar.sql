-- KULLANICI ÇALIŞTIRACAK. Hak ediş kurulumu üzerine eklenir.
-- ID/eğitim adı + Türkiye saatine göre dahil başlangıç/bitiş sipariş tarihi.
-- Arama/tarih filtresi ve tüm sayfaları kapsayan genel/filtreli toplamlar.
-- Önceki filtre SQL’i yerine bu dosya yeterlidir.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_partner_hakedis_filtre_kayitlari(p_partner_id uuid, p_sayfa integer, p_arama text, p_baslangic date, p_bitis date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE kayitlar jsonb; toplam bigint; genel_toplam jsonb; filtre_toplam jsonb;
BEGIN
  IF p_sayfa IS NULL OR p_sayfa < 1 OR p_sayfa > 100000 THEN
    RAISE EXCEPTION 'Geçersiz hak ediş sayfası.' USING ERRCODE = '22023';
  END IF;
  IF p_arama IS NULL OR char_length(p_arama) > 200 THEN
    RAISE EXCEPTION 'Geçersiz arama.' USING ERRCODE = '22023';
  END IF;
  IF p_baslangic IS NOT NULL AND p_bitis IS NOT NULL AND p_baslangic > p_bitis THEN
    RAISE EXCEPTION 'Geçersiz sipariş tarihi aralığı.' USING ERRCODE = '22023';
  END IF;
  SELECT count(*), jsonb_build_object('satin_alma_bedeli', coalesce(sum(satin_alma_bedeli), 0), 'hizmet_bedeli', coalesce(sum(hizmet_bedeli), 0), 'hak_edis', coalesce(sum(odenecek_tutar), 0), 'kdv_tutari', coalesce(sum(kdv_tutari), 0), 'kdvli_odenecek_tutar', coalesce(sum(kdvli_odenecek_tutar), 0)) INTO toplam, filtre_toplam
    FROM public.agora_siparisleri WHERE partner_id = p_partner_id
      AND (p_baslangic IS NULL OR siparis_tarihi >= (p_baslangic::timestamp AT TIME ZONE 'Europe/Istanbul'))
      AND (p_bitis IS NULL OR siparis_tarihi < ((p_bitis + 1)::timestamp AT TIME ZONE 'Europe/Istanbul'))
      AND (strpos(lower(translate(partner_egitim_id, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0 OR strpos(lower(translate(egitim_adi, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0);
  SELECT jsonb_build_object('satin_alma_bedeli', coalesce(sum(satin_alma_bedeli), 0), 'hizmet_bedeli', coalesce(sum(hizmet_bedeli), 0), 'hak_edis', coalesce(sum(odenecek_tutar), 0), 'kdv_tutari', coalesce(sum(kdv_tutari), 0), 'kdvli_odenecek_tutar', coalesce(sum(kdvli_odenecek_tutar), 0)) INTO genel_toplam
    FROM public.agora_siparisleri WHERE partner_id = p_partner_id;
  SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.siparis_tarihi DESC, s.siparis_id DESC), '[]'::jsonb)
    INTO kayitlar FROM (
      SELECT siparis_id, partner_egitim_id, egitim_adi, siparis_tarihi,
        satin_alma_bedeli, hizmet_bedeli, odenecek_tutar AS hak_edis,
        kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu, odenen_gun
      FROM public.agora_siparisleri WHERE partner_id = p_partner_id
      AND (p_baslangic IS NULL OR siparis_tarihi >= (p_baslangic::timestamp AT TIME ZONE 'Europe/Istanbul'))
      AND (p_bitis IS NULL OR siparis_tarihi < ((p_bitis + 1)::timestamp AT TIME ZONE 'Europe/Istanbul'))
      AND (strpos(lower(translate(partner_egitim_id, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0 OR strpos(lower(translate(egitim_adi, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0)
      ORDER BY siparis_tarihi DESC, siparis_id DESC LIMIT 20 OFFSET (p_sayfa - 1) * 20
    ) s;
  RETURN jsonb_build_object('partner_id', p_partner_id, 'toplam', toplam,
    'sayfa', p_sayfa, 'sayfa_boyutu', 20, 'kayitlar', kayitlar,
    'genel_toplam', genel_toplam, 'filtre_toplam', filtre_toplam);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_hakedis_filtrele(p_token_ozeti text, p_sayfa integer, p_arama text, p_baslangic date, p_bitis date)
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
  RETURN public.agora_partner_hakedis_filtre_kayitlari(partner, p_sayfa, p_arama, p_baslangic, p_bitis);
END;
$f$;

REVOKE ALL ON FUNCTION public.agora_partner_hakedis_filtre_kayitlari(uuid,integer,text,date,date),
 public.agora_partner_hakedis_filtrele(text,integer,text,date,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_hakedis_filtrele(text,integer,text,date,date) TO service_role;
-- Mevcut partner/admin okuma RPC'leri de aynı toplamları döndürür.
CREATE OR REPLACE FUNCTION public.agora_partner_hakedis_kayitlari(p_partner_id uuid, p_sayfa integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
BEGIN
  RETURN public.agora_partner_hakedis_filtre_kayitlari(p_partner_id, p_sayfa, '', NULL, NULL);
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_hakedis_kayitlari(uuid,integer)
 FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS agora_partner_hakedis_toplamlar_hazir;
