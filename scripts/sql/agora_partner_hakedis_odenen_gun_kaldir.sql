-- KULLANICI ÇALIŞTIRACAK.
-- agora_siparisleri ve agora_canli_siparisleri tablolarından odenen_gun kolonunu kaldırır
-- ve agora_partner_hakedis_filtre_kayitlari RPC'sini odenen_gun olmadan günceller.

BEGIN;

CREATE OR REPLACE FUNCTION public.agora_partner_hakedis_filtre_kayitlari(
  p_partner_id uuid,
  p_sayfa integer,
  p_arama text,
  p_baslangic date,
  p_bitis date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_oran numeric(4,2);
  kayitlar jsonb;
  toplam bigint;
  genel_toplam jsonb;
  filtre_toplam jsonb;
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

  v_oran := public.agora_partner_komisyon_orani_oku();

  WITH ham_siparisler AS (
    SELECT siparis_id, partner_id, partner_egitim_id, egitim_adi, siparis_tarihi,
           round(satin_alma_bedeli, 2) AS satin_alma_bedeli,
           planlanan_odeme_gunu
    FROM public.agora_siparisleri
    WHERE partner_id = p_partner_id
    UNION ALL
    SELECT siparis_id, partner_id, partner_egitim_id, egitim_adi, siparis_tarihi,
           round(satin_alma_bedeli, 2) AS satin_alma_bedeli,
           planlanan_odeme_gunu
    FROM public.agora_canli_siparisleri
    WHERE partner_id = p_partner_id
  ),
  hesapli_siparisler AS (
    SELECT siparis_id, partner_id, partner_egitim_id, egitim_adi, siparis_tarihi,
           satin_alma_bedeli,
           v_oran AS hizmet_orani,
           round(satin_alma_bedeli * v_oran / 100.0, 2) AS hizmet_bedeli,
           satin_alma_bedeli - round(satin_alma_bedeli * v_oran / 100.0, 2) AS odenecek_tutar,
           planlanan_odeme_gunu
    FROM ham_siparisler
  ),
  tum_siparisler AS (
    SELECT siparis_id, partner_id, partner_egitim_id, egitim_adi, siparis_tarihi,
           satin_alma_bedeli, hizmet_orani, hizmet_bedeli, odenecek_tutar,
           round(odenecek_tutar * 0.20, 2) AS kdv_tutari,
           round(odenecek_tutar * 1.20, 2) AS kdvli_odenecek_tutar,
           planlanan_odeme_gunu
    FROM hesapli_siparisler
  ),
  filtrelenmis AS (
    SELECT *
    FROM tum_siparisler
    WHERE (p_baslangic IS NULL OR siparis_tarihi >= (p_baslangic::timestamp AT TIME ZONE 'Europe/Istanbul'))
      AND (p_bitis IS NULL OR siparis_tarihi < ((p_bitis + 1)::timestamp AT TIME ZONE 'Europe/Istanbul'))
      AND (
        strpos(lower(translate(partner_egitim_id, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0
        OR strpos(lower(translate(egitim_adi, 'Iİ', 'ıi')), lower(translate(btrim(p_arama), 'Iİ', 'ıi'))) > 0
      )
  )
  SELECT
    (SELECT count(*) FROM filtrelenmis),
    (SELECT jsonb_build_object(
      'satin_alma_bedeli', coalesce(sum(satin_alma_bedeli), 0),
      'hizmet_bedeli', coalesce(sum(hizmet_bedeli), 0),
      'hak_edis', coalesce(sum(odenecek_tutar), 0),
      'kdv_tutari', coalesce(sum(kdv_tutari), 0),
      'kdvli_odenecek_tutar', coalesce(sum(kdvli_odenecek_tutar), 0)
    ) FROM filtrelenmis),
    (SELECT jsonb_build_object(
      'satin_alma_bedeli', coalesce(sum(satin_alma_bedeli), 0),
      'hizmet_bedeli', coalesce(sum(hizmet_bedeli), 0),
      'hak_edis', coalesce(sum(odenecek_tutar), 0),
      'kdv_tutari', coalesce(sum(kdv_tutari), 0),
      'kdvli_odenecek_tutar', coalesce(sum(kdvli_odenecek_tutar), 0)
    ) FROM tum_siparisler),
    (SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.siparis_tarihi DESC, s.siparis_id DESC), '[]'::jsonb)
     FROM (
       SELECT siparis_id, partner_egitim_id, egitim_adi, siparis_tarihi,
              satin_alma_bedeli, hizmet_orani, hizmet_bedeli, odenecek_tutar AS hak_edis,
              kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu
       FROM filtrelenmis
       ORDER BY siparis_tarihi DESC, siparis_id DESC
       LIMIT 20 OFFSET (p_sayfa - 1) * 20
     ) s)
  INTO toplam, filtre_toplam, genel_toplam, kayitlar;

  RETURN jsonb_build_object(
    'komisyon_orani', v_oran,
    'partner_id', p_partner_id,
    'toplam', toplam,
    'sayfa', p_sayfa,
    'sayfa_boyutu', 20,
    'kayitlar', kayitlar,
    'genel_toplam', genel_toplam,
    'filtre_toplam', filtre_toplam
  );
END $f$;

REVOKE ALL ON FUNCTION public.agora_partner_hakedis_filtre_kayitlari(uuid, integer, text, date, date)
  FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public.agora_siparisleri DROP COLUMN IF EXISTS odenen_gun;
ALTER TABLE public.agora_canli_siparisleri DROP COLUMN IF EXISTS odenen_gun;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name IN ('agora_siparisleri', 'agora_canli_siparisleri')
     AND column_name = 'odenen_gun') AS kalan_odenen_gun_kolonu,
  true AS agora_partner_hakedis_odenen_gun_kaldir_hazir;
