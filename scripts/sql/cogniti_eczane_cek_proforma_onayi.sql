-- Kullanıcı çalıştıracak. E-Club çek talebi ve TM onayı şeması kurulu olmalıdır.
BEGIN;

CREATE TABLE IF NOT EXISTS public.cogniti_eczane_cek_proforma_onaylari (
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
  donem text NOT NULL,
  onaylayan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
  onaylayan_ad text NOT NULL,
  onay_tarihi timestamptz NOT NULL DEFAULT statement_timestamp(),
  belge jsonb NOT NULL,
  PRIMARY KEY (firma_id, donem)
);
ALTER TABLE public.cogniti_eczane_cek_proforma_onaylari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_eczane_cek_proforma_onaylari FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cogniti_eczane_cek_proforma(
  p_auth uuid, p_firma uuid, p_donem text, p_onayli boolean, p_onay_anahtari text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  kisi public.kullanicilar%ROWTYPE;
  firma public.firmalar%ROWTYPE;
  onay public.cogniti_eczane_cek_proforma_onaylari%ROWTYPE;
  liste jsonb;
  taslak jsonb;
  anahtar text;
BEGIN
  IF p_donem IS NULL OR p_donem !~ '^20[0-9]{2}-P[1-6]$' OR p_onayli IS NULL THEN
    RAISE EXCEPTION 'Geçersiz dönem.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO kisi FROM public.kullanicilar WHERE kullanici_id = p_auth AND aktif_mi;
  SELECT * INTO firma FROM public.firmalar WHERE firma_id = p_firma;
  IF firma.firma_id IS NULL OR NOT coalesce(
    lower(kisi.rol) = 'admin' AND p_onay_anahtari IS NULL OR
    lower(kisi.rol) = 'firma_admin' AND kisi.firma_id = p_firma AND firma.aktif AND firma.firma_admin_aktif AND NOT p_onayli,
    false
  ) THEN
    RAISE EXCEPTION 'Firma kapsamına erişiminiz bulunmuyor.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO onay FROM public.cogniti_eczane_cek_proforma_onaylari
  WHERE firma_id = p_firma AND donem = p_donem;

  IF NOT p_onayli AND (onay.firma_id IS NULL OR p_onay_anahtari IS NULL) THEN
    WITH talepler AS (
      SELECT t.talep_id AS id, t.created_at AS tarih, t.tm_onay_tarihi AS tm_onayi,
        coalesce(em.eczane_adi, 'Eczane') AS eczane,
        coalesce(u.urun_adi, 'Ürün') AS urun,
        t.talep_edilen_cek_tl AS tl
      FROM public.eclub_store_cek_talepleri t
      LEFT JOIN public.eclub_eczaneler e ON e.eczane_id = t.eczane_id
      LEFT JOIN public.eclub_eczane_master em ON em.gln = e.gln
      LEFT JOIN public.v_yayin_kunye k ON k.yayin_id = t.yayin_id
      LEFT JOIN public.urunler u ON u.urun_id = k.urun_id
      WHERE t.firma_id = p_firma AND t.donem_kodu = p_donem
        AND t.tm_id IS NOT NULL AND t.tm_onay_tarihi IS NOT NULL
        AND t.durum IN ('onaylandi', 'teslimat_bekliyor', 'cek_kodlari_gonderildi')
    )
    SELECT jsonb_build_object(
      'talepler', coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.tm_onayi DESC, t.id), '[]'::jsonb),
      'adet', count(*),
      'toplam_tl', CASE WHEN count(*) FILTER (WHERE t.tl > 0) = count(*) THEN coalesce(sum(t.tl), 0) END
    )
    INTO liste FROM talepler t;

    IF onay.firma_id IS NULL AND (liste->>'adet')::bigint > 0 AND liste->>'toplam_tl' IS NOT NULL THEN
      taslak := liste || jsonb_build_object(
        'belge_no', 'PF-EC-' || p_firma::text || '-' || p_donem,
        'duzenleyen', jsonb_build_object('unvan', 'Mill Danışmanlık Org. ve Eğt. Hiz. Ltd. Şti',
          'adres', 'Göktürk Merkez M. İstanbul C. Üstüküme S. No: D51 Göktürk-Eyüp-İstanbul',
          'vergi_dairesi', 'Gaziosmanpaşa', 'vergi_numarasi', '6210464784'),
        'alici', jsonb_build_object('unvan', firma.firma_adi, 'adres', coalesce(firma.adres, ''),
          'vergi_dairesi', coalesce(firma.vergi_dairesi, ''), 'vergi_numarasi', coalesce(firma.vergi_numarasi, ''))
      );
      anahtar := md5(taslak::text);
    END IF;

    IF p_onay_anahtari IS NOT NULL THEN
      IF taslak IS NULL OR anahtar IS DISTINCT FROM p_onay_anahtari THEN
        RAISE EXCEPTION 'Proforma değişti veya henüz onaya hazır değil.' USING ERRCODE = '22023';
      END IF;
      INSERT INTO public.cogniti_eczane_cek_proforma_onaylari (firma_id, donem, onaylayan_id, onaylayan_ad, belge)
      VALUES (p_firma, p_donem, p_auth, concat_ws(' ', kisi.ad, kisi.soyad), taslak)
      ON CONFLICT (firma_id, donem) DO NOTHING;
      SELECT * INTO STRICT onay FROM public.cogniti_eczane_cek_proforma_onaylari
      WHERE firma_id = p_firma AND donem = p_donem;
    END IF;
  END IF;

  RETURN jsonb_build_object('liste', liste, 'belge', coalesce(onay.belge, taslak),
    'onay_anahtari', CASE WHEN lower(kisi.rol) = 'firma_admin' AND onay.firma_id IS NULL THEN anahtar END,
    'onay', CASE WHEN onay.firma_id IS NOT NULL
      THEN jsonb_build_object('tarih', onay.onay_tarihi, 'ad', onay.onaylayan_ad) END);
END;
$$;

REVOKE ALL ON FUNCTION public.cogniti_eczane_cek_proforma(uuid, uuid, text, boolean, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_eczane_cek_proforma(uuid, uuid, text, boolean, text) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS eczane_cek_proforma_onayi_kuruldu;
