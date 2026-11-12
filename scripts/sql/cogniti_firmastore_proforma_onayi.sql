-- Kullanıcı çalıştıracak. FirmaStore dönem takvimi ve 12 saat kuralı kurulu olmalıdır.
BEGIN;

CREATE TABLE IF NOT EXISTS public.cogniti_firmastore_proforma_onaylari (
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
  donem date NOT NULL,
  onaylayan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
  onaylayan_ad text NOT NULL,
  onay_tarihi timestamptz NOT NULL DEFAULT statement_timestamp(),
  belge jsonb NOT NULL,
  PRIMARY KEY (firma_id, donem)
);
ALTER TABLE public.cogniti_firmastore_proforma_onaylari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_firmastore_proforma_onaylari FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cogniti_firmastore_proforma(
  p_auth uuid, p_firma uuid, p_donem date, p_onayli boolean, p_onay_anahtari text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  kisi public.kullanicilar%ROWTYPE;
  firma public.firmalar%ROWTYPE;
  onay public.cogniti_firmastore_proforma_onaylari%ROWTYPE;
  simdi timestamptz := statement_timestamp();
  donem_ani timestamptz;
  siparis_kapanisi timestamptz;
  liste jsonb;
  marka_kalemleri jsonb;
  taslak jsonb;
  anahtar text;
  bekleyen boolean;
BEGIN
  IF p_donem IS NULL OR p_donem <> date_trunc('quarter', p_donem::timestamp)::date OR p_onayli IS NULL THEN
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

  SELECT * INTO onay FROM public.cogniti_firmastore_proforma_onaylari
  WHERE firma_id = p_firma AND donem = p_donem;

  IF NOT p_onayli AND (onay.firma_id IS NULL OR p_onay_anahtari IS NULL) THEN
    donem_ani := p_donem::timestamp AT TIME ZONE 'Europe/Istanbul';
    siparis_kapanisi := (p_donem + interval '3 months 7 days') AT TIME ZONE 'Europe/Istanbul';

    WITH donem_siparisleri AS MATERIALIZED (
      SELECT s.*, public.store_bekleme_bitti_mi(s.created_at, simdi) AS kesin
      FROM public.store_siparisler s
      WHERE s.firma_id = p_firma AND s.kaynak_ceyrek_baslangici = donem_ani AND s.durum <> 'iptal'
    ), kesin AS (
      SELECT * FROM donem_siparisleri WHERE kesin
    ), cekler AS (
      SELECT u.urun_id, u.ad
      FROM public.store_urunler u
      JOIN public.store_urun_firma_ayarlari a USING (urun_id)
      WHERE a.firma_id = p_firma AND a.aktif_mi AND u.aktif_mi
      UNION
      SELECT u.urun_id, u.ad FROM kesin s JOIN public.store_urunler u USING (urun_id)
    ), kalemler AS (
      SELECT s.kullanici_id, coalesce(s.toplu_talep_anahtari, s.siparis_id) AS siparis,
        s.urun_id, min(s.siparis_id::text) AS ilk_satir_id, min(s.created_at) AS tarih,
        sum(s.adet) AS adet, sum(s.toplam_puan) AS puan,
        CASE WHEN count(s.toplam_tl) = count(*) THEN sum(s.toplam_tl) END AS tl
      FROM kesin s GROUP BY 1, 2, 3
    ), marka_toplamlari AS (
      SELECT l.urun_id, u.ad, sum(l.adet) AS adet, sum(l.tl) AS tl
      FROM kalemler l JOIN public.store_urunler u USING (urun_id)
      GROUP BY l.urun_id, u.ad
    ), siparisler AS (
      SELECT min(l.ilk_satir_id) AS id, min(l.tarih) AS tarih, concat_ws(' ', k.ad, k.soyad) AS ad,
        coalesce(k.rol, '') AS rol, jsonb_object_agg(l.urun_id, l.adet) AS adetler, sum(l.puan) AS puan,
        CASE WHEN count(l.tl) = count(*) THEN sum(l.tl) END AS tl
      FROM kalemler l LEFT JOIN public.kullanicilar k USING (kullanici_id)
      GROUP BY l.kullanici_id, l.siparis, k.ad, k.soyad, k.rol
    )
    SELECT jsonb_build_object(
      'cekler', coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.ad, c.urun_id) FROM cekler c), '[]'::jsonb),
      'siparisler', coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.tarih DESC, s.id), '[]'::jsonb),
      'toplam_tl', CASE WHEN count(s.tl) = count(*) THEN coalesce(sum(s.tl), 0) END
    ), EXISTS (SELECT 1 FROM donem_siparisleri WHERE NOT kesin),
      (SELECT jsonb_agg(to_jsonb(m) ORDER BY m.ad, m.urun_id) FROM marka_toplamlari m)
    INTO liste, bekleyen, marka_kalemleri FROM siparisler s;

    IF onay.firma_id IS NULL AND simdi >= siparis_kapanisi AND NOT bekleyen
       AND jsonb_array_length(liste->'siparisler') > 0 AND liste->>'toplam_tl' IS NOT NULL THEN
      taslak := liste || jsonb_build_object(
        'marka_kalemleri', marka_kalemleri,
        'belge_no', 'PF-FS-' || p_firma::text || '-' || to_char(p_donem, 'YYYY-"Q"Q'),
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
      INSERT INTO public.cogniti_firmastore_proforma_onaylari (firma_id, donem, onaylayan_id, onaylayan_ad, belge)
      VALUES (p_firma, p_donem, p_auth, concat_ws(' ', kisi.ad, kisi.soyad), taslak)
      ON CONFLICT (firma_id, donem) DO NOTHING;
      SELECT * INTO STRICT onay FROM public.cogniti_firmastore_proforma_onaylari
      WHERE firma_id = p_firma AND donem = p_donem;
    END IF;
  END IF;

  RETURN jsonb_build_object('liste', liste, 'belge', coalesce(onay.belge, taslak),
    'onay_anahtari', CASE WHEN lower(kisi.rol) = 'firma_admin' AND onay.firma_id IS NULL THEN anahtar END,
    'onay', CASE WHEN onay.firma_id IS NOT NULL
      THEN jsonb_build_object('tarih', onay.onay_tarihi, 'ad', onay.onaylayan_ad) END);
END;
$$;

REVOKE ALL ON FUNCTION public.cogniti_firmastore_proforma(uuid, uuid, date, boolean, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_firmastore_proforma(uuid, uuid, date, boolean, text) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS firmastore_proforma_onayi_kuruldu;
