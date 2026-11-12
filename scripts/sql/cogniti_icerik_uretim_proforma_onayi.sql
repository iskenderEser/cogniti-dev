-- Kullanıcı çalıştıracak. İçerik üretimi tahsilatı ve merkezi fiyat tarifesi gerekir.
BEGIN;

ALTER TABLE public.cogniti_icerik_uretim_alimlari
  ADD COLUMN IF NOT EXISTS birim_fiyat numeric CHECK (birim_fiyat > 0);

CREATE OR REPLACE FUNCTION public.cogniti_icerik_uretim_alim_fiyati()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  SELECT (degerler->>'kko_token_tl')::numeric INTO NEW.birim_fiyat
  FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR SHARE;
  IF NEW.birim_fiyat IS NULL OR NEW.birim_fiyat <= 0 THEN
    RAISE EXCEPTION 'İçerik üretimi için KKÖ birim fiyatı bulunamadı.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_cogniti_icerik_uretim_alim_fiyati ON public.cogniti_icerik_uretim_alimlari;
CREATE TRIGGER trg_cogniti_icerik_uretim_alim_fiyati
  BEFORE INSERT ON public.cogniti_icerik_uretim_alimlari
  FOR EACH ROW EXECUTE FUNCTION public.cogniti_icerik_uretim_alim_fiyati();

CREATE TABLE IF NOT EXISTS public.cogniti_icerik_proforma_onaylari (
  talep_id uuid PRIMARY KEY REFERENCES public.cogniti_icerik_uretim_alimlari(talep_id),
  onaylayan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
  onaylayan_ad text NOT NULL,
  onay_turu text NOT NULL CHECK (onay_turu IN ('admin', 'firma')),
  aciklama text NOT NULL CHECK (length(aciklama) <= 2000 AND (onay_turu <> 'admin' OR btrim(aciklama) <> '')),
  onay_tarihi timestamptz NOT NULL DEFAULT statement_timestamp(),
  belge jsonb NOT NULL
);
ALTER TABLE public.cogniti_icerik_proforma_onaylari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_icerik_proforma_onaylari FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cogniti_icerik_proforma_belgesi(p_talep uuid, p_firma uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'belge_no', 'PF-I-' || a.talep_id::text, 'tarih', a.tahsilat_at,
    'duzenleyen', jsonb_build_object('unvan', 'Mill Danışmanlık Org. ve Eğt. Hiz. Ltd. Şti',
      'adres', 'Göktürk Merkez M. İstanbul C. Üstüküme S. No: D51 Göktürk-Eyüp-İstanbul',
      'vergi_dairesi', 'Gaziosmanpaşa', 'vergi_numarasi', '6210464784'),
    'alici', jsonb_build_object('unvan', f.firma_adi, 'adres', coalesce(f.adres,''),
      'vergi_dairesi', coalesce(f.vergi_dairesi,''), 'vergi_numarasi', coalesce(f.vergi_numarasi,'')),
    'hizmet', 'İçerik Üretimi', 'icerik', coalesce(u.urun_adi, t.urun_adi, t.teknik_adi, 'İçerik'),
    'token_adedi', a.token_adedi, 'birim_fiyat', a.birim_fiyat, 'toplam_tutar', hesap.net,
    'kdv', round(hesap.net * 0.20, 2)
  )
  FROM public.cogniti_icerik_uretim_alimlari a
  JOIN public.talepler t USING (talep_id)
  JOIN public.firmalar f ON f.firma_id = a.firma_id
  LEFT JOIN public.urunler u ON u.urun_id = t.urun_id
  CROSS JOIN LATERAL (SELECT round(a.token_adedi * a.birim_fiyat, 2) AS net) hesap
  WHERE a.talep_id = p_talep AND a.firma_id = p_firma AND a.birim_fiyat IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.cogniti_icerik_proforma_yetkisi(p_auth uuid, p_firma uuid, p_onayli boolean)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  kisi record;
BEGIN
  SELECT lower(btrim(k.rol)) rol, k.firma_id INTO kisi
  FROM public.kullanicilar k WHERE k.kullanici_id = p_auth AND k.aktif_mi;
  IF NOT FOUND OR kisi.rol IS NULL OR kisi.rol NOT IN ('admin', 'firma_admin')
    OR (kisi.rol = 'firma_admin' AND (p_onayli OR kisi.firma_id IS DISTINCT FROM p_firma OR NOT EXISTS (
      SELECT 1 FROM public.firmalar WHERE firma_id = p_firma AND aktif AND firma_admin_aktif
    ))) THEN
    RAISE EXCEPTION 'Firma kapsamına erişiminiz bulunmuyor.' USING ERRCODE = '42501';
  END IF;
  RETURN kisi.rol;
END;
$$;

CREATE OR REPLACE FUNCTION public.cogniti_icerik_proformalari_oku(
  p_auth uuid, p_firma uuid, p_ay date, p_sayfa integer, p_onayli boolean
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  rol text;
  ilk_an timestamptz;
  son_an timestamptz;
  sonuc jsonb;
BEGIN
  IF p_ay IS NULL OR extract(day FROM p_ay) <> 1 OR p_sayfa IS NULL
    OR p_sayfa NOT BETWEEN 0 AND 1000000 OR p_onayli IS NULL THEN
    RAISE EXCEPTION 'Geçersiz liste isteği.' USING ERRCODE = '22023';
  END IF;
  rol := public.cogniti_icerik_proforma_yetkisi(p_auth, p_firma, p_onayli);
  ilk_an := p_ay::timestamp AT TIME ZONE 'Europe/Istanbul';
  son_an := (p_ay + interval '1 month') AT TIME ZONE 'Europe/Istanbul';

  WITH eslesen AS MATERIALIZED (
    SELECT a.talep_id, a.tahsilat_at, a.token_adedi, a.bakiye_turu,
      coalesce(u.urun_adi, t.urun_adi, t.teknik_adi, 'İçerik') AS icerik,
      concat_ws(' ', k.ad, k.soyad) AS uretici,
      o.belge, o.onay_turu, o.onaylayan_ad, o.onay_tarihi, o.aciklama
    FROM public.cogniti_icerik_uretim_alimlari a
    JOIN public.talepler t USING (talep_id)
    JOIN public.kullanicilar k ON k.kullanici_id = a.uretici_id
    LEFT JOIN public.urunler u ON u.urun_id = t.urun_id
    LEFT JOIN public.cogniti_icerik_proforma_onaylari o ON o.talep_id = a.talep_id
    WHERE a.firma_id = p_firma AND a.tahsilat_at >= ilk_an AND a.tahsilat_at < son_an
      AND (NOT p_onayli OR o.talep_id IS NOT NULL)
  ), sayfa AS (
    SELECT * FROM eslesen ORDER BY tahsilat_at DESC, talep_id DESC LIMIT 20 OFFSET p_sayfa * 20
  )
  SELECT jsonb_build_object('firma_id', p_firma, 'sayfa', p_sayfa, 'toplam', (SELECT count(*) FROM eslesen),
    'admin_onayi', rol = 'admin', 'alimlar', coalesce(jsonb_agg(jsonb_build_object(
      'talep_id', s.talep_id, 'tarih', s.tahsilat_at, 'icerik', s.icerik, 'uretici', s.uretici,
      'bakiye_turu', s.bakiye_turu, 'token_adedi', s.token_adedi,
      'belge', coalesce(s.belge, public.cogniti_icerik_proforma_belgesi(s.talep_id, p_firma)),
      'onay', CASE WHEN s.onay_turu IS NOT NULL THEN jsonb_build_object(
        'tur', s.onay_turu, 'onaylayan', s.onaylayan_ad, 'tarih', s.onay_tarihi, 'aciklama', s.aciklama
      ) END
    ) ORDER BY s.tahsilat_at DESC, s.talep_id DESC), '[]'::jsonb))
  INTO sonuc FROM sayfa s;
  RETURN sonuc;
END;
$$;

CREATE OR REPLACE FUNCTION public.cogniti_icerik_proforma_onayla(
  p_auth uuid, p_firma uuid, p_talep uuid, p_aciklama text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  onaylayan_rol text;
  gerekce text := btrim(coalesce(p_aciklama, ''));
  belge_verisi jsonb;
  onay public.cogniti_icerik_proforma_onaylari%ROWTYPE;
BEGIN
  onaylayan_rol := public.cogniti_icerik_proforma_yetkisi(p_auth, p_firma, false);
  IF length(gerekce) > 2000 OR (onaylayan_rol = 'admin' AND gerekce = '') THEN
    RAISE EXCEPTION 'Admin onayı için açıklama zorunludur.' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.cogniti_icerik_uretim_alimlari
  WHERE talep_id = p_talep AND firma_id = p_firma FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'İçerik alımı bulunamadı.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO onay FROM public.cogniti_icerik_proforma_onaylari WHERE talep_id = p_talep;
  IF NOT FOUND THEN
    belge_verisi := public.cogniti_icerik_proforma_belgesi(p_talep, p_firma);
    IF belge_verisi IS NULL THEN
      RAISE EXCEPTION 'Alımın tahsilat anındaki birim fiyatı kayıtlı değil.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.cogniti_icerik_proforma_onaylari
      (talep_id, onaylayan_id, onaylayan_ad, onay_turu, aciklama, belge)
    SELECT p_talep, p_auth, concat_ws(' ', ad, soyad),
      CASE WHEN onaylayan_rol = 'admin' THEN 'admin' ELSE 'firma' END, gerekce, belge_verisi
    FROM public.kullanicilar WHERE kullanici_id = p_auth
    RETURNING * INTO onay;
  END IF;
  RETURN jsonb_build_object('tur', onay.onay_turu, 'onaylayan', onay.onaylayan_ad,
    'tarih', onay.onay_tarihi, 'aciklama', onay.aciklama);
END;
$$;

REVOKE ALL ON FUNCTION public.cogniti_icerik_uretim_alim_fiyati(),
  public.cogniti_icerik_proforma_belgesi(uuid, uuid),
  public.cogniti_icerik_proforma_yetkisi(uuid, uuid, boolean),
  public.cogniti_icerik_proformalari_oku(uuid, uuid, date, integer, boolean),
  public.cogniti_icerik_proforma_onayla(uuid, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_icerik_proformalari_oku(uuid, uuid, date, integer, boolean),
  public.cogniti_icerik_proforma_onayla(uuid, uuid, uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS icerik_uretim_proforma_onayi_kuruldu;
