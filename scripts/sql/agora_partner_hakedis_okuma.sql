-- Agora partner hak edişleri: yalnız yetkili ve sayfalı okuma.
-- KULLANICI ÇALIŞTIRACAK. Önce agora_partner_hakedis_alanlari.sql kurulmalıdır.
BEGIN;

CREATE INDEX IF NOT EXISTS agora_siparis_partner_tarih
  ON public.agora_siparisleri(partner_id, siparis_tarihi DESC, siparis_id DESC);

-- Ortak listeleyici dışarıdan çağrılmaz; iki yetkili giriş tarafından kullanılır.
CREATE OR REPLACE FUNCTION public.agora_partner_hakedis_kayitlari(p_partner_id uuid, p_sayfa integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
DECLARE kayitlar jsonb; toplam bigint;
BEGIN
  IF p_sayfa IS NULL OR p_sayfa < 1 OR p_sayfa > 100000 THEN
    RAISE EXCEPTION 'Geçersiz hak ediş sayfası.' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO toplam FROM public.agora_siparisleri WHERE partner_id = p_partner_id;
  SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.siparis_tarihi DESC, s.siparis_id DESC), '[]'::jsonb)
    INTO kayitlar FROM (
      SELECT siparis_id, partner_egitim_id, egitim_adi, siparis_tarihi,
        satin_alma_bedeli, hizmet_bedeli, odenecek_tutar AS hak_edis,
        kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu, odenen_gun
      FROM public.agora_siparisleri WHERE partner_id = p_partner_id
      ORDER BY siparis_tarihi DESC, siparis_id DESC LIMIT 20 OFFSET (p_sayfa - 1) * 20
    ) s;
  RETURN jsonb_build_object('partner_id', p_partner_id, 'toplam', toplam,
    'sayfa', p_sayfa, 'sayfa_boyutu', 20, 'kayitlar', kayitlar);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_hakedisleri_oku(p_token_ozeti text, p_sayfa integer DEFAULT 1)
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
  RETURN public.agora_partner_hakedis_kayitlari(partner, p_sayfa);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_admin_hakedisleri_oku(
  p_admin_id uuid, p_partner_id uuid, p_sayfa integer DEFAULT 1
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $f$
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF NOT EXISTS(SELECT 1 FROM public.agora_partner_profilleri WHERE partner_id = p_partner_id) THEN RETURN NULL; END IF;
  RETURN public.agora_partner_hakedis_kayitlari(p_partner_id, p_sayfa);
END;
$f$;

REVOKE ALL ON FUNCTION public.agora_partner_hakedis_kayitlari(uuid,integer),
  public.agora_partner_hakedisleri_oku(text,integer),
  public.agora_partner_admin_hakedisleri_oku(uuid,uuid,integer)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_hakedisleri_oku(text,integer),
  public.agora_partner_admin_hakedisleri_oku(uuid,uuid,integer) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT true AS agora_partner_hakedis_okuma_hazir;
