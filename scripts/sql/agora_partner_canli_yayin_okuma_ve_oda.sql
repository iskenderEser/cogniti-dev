-- KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: agora_partner_canli_yayin_kurulum.sql uygulanmış olmalıdır.
-- Cogniti güvenlik standardına uygun olarak canlı yayın okuma, iptal ve Viva oda RPC'leri.
BEGIN;

-- 1. Partner paneli için canlı eğitim ve oturum listesi okuma
CREATE OR REPLACE FUNCTION public.agora_partner_canli_verileri_oku(p_partner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_egitimler jsonb;
  v_oturumlar jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id
  ) THEN
    RAISE EXCEPTION 'Partner bulunamadı.' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_egitimler
  FROM (
    SELECT canli_egitim_id, egitim_adi, kategori_kodu, kategori, hedef_roller, aciklama,
           sure_dakika, kapasite, fiyat_tl, viva_maliyeti_tl, hizmet_bedeli_tl, net_hakedis_tl, aktif_mi, created_at
    FROM public.agora_partner_canli_egitimler
    WHERE partner_id = p_partner_id
  ) r;

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.baslangic_at ASC), '[]'::jsonb)
  INTO v_oturumlar
  FROM (
    SELECT o.oturum_id, o.canli_egitim_id, o.baslangic_at, o.bitis_at, o.durum,
           o.satin_alan_firma_id, f.firma_adi AS satin_alan_firma_adi, o.created_at
    FROM public.agora_partner_canli_oturumlar o
    LEFT JOIN public.firmalar f ON f.firma_id = o.satin_alan_firma_id
    WHERE o.partner_id = p_partner_id
  ) r;

  RETURN jsonb_build_object('egitimler', v_egitimler, 'oturumlar', v_oturumlar);
END $f$;

-- 2. Partnerin henüz satın alınmamış (müsait) oturumu iptal etmesi
CREATE OR REPLACE FUNCTION public.agora_partner_canli_oturum_iptal(
  p_partner_id uuid,
  p_oturum_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_id uuid;
BEGIN
  UPDATE public.agora_partner_canli_oturumlar
  SET durum = 'iptal', updated_at = now()
  WHERE oturum_id = p_oturum_id
    AND partner_id = p_partner_id
    AND durum = 'musait'
  RETURNING oturum_id INTO v_id;

  RETURN v_id IS NOT NULL;
END $f$;

-- 3. Agora vitrini için müsait ve firmanın kendi rezerve ettiği canlı yayın oturumları
CREATE OR REPLACE FUNCTION public.agora_vitrin_canli_oturumlar_oku(p_auth_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_firma uuid;
  v_oturumlar jsonb;
BEGIN
  PERFORM public.agora_vitrin_yetki(p_auth_id);
  SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id = p_auth_id;

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.baslangic_at ASC), '[]'::jsonb)
  INTO v_oturumlar
  FROM (
    SELECT o.oturum_id, o.canli_egitim_id, o.partner_id,
           coalesce(p.sirket_adi, 'İş Partneri') AS sirket_adi,
           e.egitim_adi, e.kategori, e.hedef_roller, e.aciklama,
           e.sure_dakika, e.kapasite, e.fiyat_tl,
           o.baslangic_at, o.bitis_at, o.durum,
           (v_firma IS NOT NULL AND o.satin_alan_firma_id = v_firma) AS kendi_firmam_rezerve
    FROM public.agora_partner_canli_oturumlar o
    JOIN public.agora_partner_canli_egitimler e ON e.canli_egitim_id = o.canli_egitim_id
    JOIN public.agora_partner_profilleri p ON p.partner_id = o.partner_id
    WHERE e.aktif_mi
      AND o.bitis_at > now()
      AND (o.durum = 'musait' OR (v_firma IS NOT NULL AND o.durum = 'rezerve' AND o.satin_alan_firma_id = v_firma))
  ) r;

  RETURN jsonb_build_object('firma_id', v_firma, 'oturumlar', v_oturumlar);
END $f$;

-- 4. Viva canlı oda girişi için yetki + oturum bilgisi okuma
CREATE OR REPLACE FUNCTION public.agora_canli_oda_bilgisi_oku(
  p_oturum_id uuid,
  p_partner_id uuid DEFAULT NULL,
  p_auth_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_oturum public.agora_partner_canli_oturumlar%ROWTYPE;
  v_firma uuid;
  v_ad text;
BEGIN
  SELECT * INTO v_oturum FROM public.agora_partner_canli_oturumlar WHERE oturum_id = p_oturum_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF p_partner_id IS NOT NULL THEN
    IF v_oturum.partner_id <> p_partner_id THEN
      RAISE EXCEPTION 'Bu canlı yayın oturumuna erişim yetkiniz yok.' USING ERRCODE = '42501';
    END IF;
    SELECT coalesce(sirket_adi, 'İş Partneri') INTO v_ad
    FROM public.agora_partner_profilleri WHERE partner_id = p_partner_id;
  ELSIF p_auth_id IS NOT NULL THEN
    SELECT firma_id, nullif(btrim(coalesce(ad, '') || ' ' || coalesce(soyad, '')), '')
    INTO v_firma, v_ad
    FROM public.kullanicilar WHERE kullanici_id = p_auth_id;
    IF v_firma IS NULL OR v_oturum.satin_alan_firma_id IS DISTINCT FROM v_firma THEN
      RAISE EXCEPTION 'Bu canlı yayın firmanız için rezerve edilmemiş.' USING ERRCODE = '42501';
    END IF;
    v_ad := coalesce(v_ad, 'Katılımcı');
  ELSE
    RAISE EXCEPTION 'Yetkisiz istek.' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'oturum_id', v_oturum.oturum_id,
    'baslangic_at', v_oturum.baslangic_at,
    'bitis_at', v_oturum.bitis_at,
    'durum', v_oturum.durum,
    'viva_oda_adi', v_oturum.viva_oda_adi,
    'viva_domain', v_oturum.viva_domain,
    'kullanici_adi', coalesce(v_ad, 'Katılımcı')
  );
END $f$;

-- 5. Viva oda adını ve alanını kaydetme
CREATE OR REPLACE FUNCTION public.agora_canli_oda_kaydet(
  p_oturum_id uuid,
  p_oda_adi text,
  p_domain text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
BEGIN
  UPDATE public.agora_partner_canli_oturumlar
  SET viva_oda_adi = p_oda_adi, viva_domain = p_domain, updated_at = now()
  WHERE oturum_id = p_oturum_id;
END $f$;

REVOKE ALL ON FUNCTION
  public.agora_partner_canli_verileri_oku(uuid),
  public.agora_partner_canli_oturum_iptal(uuid, uuid),
  public.agora_vitrin_canli_oturumlar_oku(uuid),
  public.agora_canli_oda_bilgisi_oku(uuid, uuid, uuid),
  public.agora_canli_oda_kaydet(uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.agora_partner_canli_verileri_oku(uuid),
  public.agora_partner_canli_oturum_iptal(uuid, uuid),
  public.agora_vitrin_canli_oturumlar_oku(uuid),
  public.agora_canli_oda_bilgisi_oku(uuid, uuid, uuid),
  public.agora_canli_oda_kaydet(uuid, text, text)
TO service_role;

COMMIT;
