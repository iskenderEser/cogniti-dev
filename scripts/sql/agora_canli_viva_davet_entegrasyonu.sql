-- KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: agora_canli_yayinlarim_kurulum.sql uygulanmış olmalıdır.
-- Canlı Agora Yayınları -> Yayın Daveti (Viva ekranında otomatik/kilitli doldurma,
-- kontenjan sınırı ve partner-üretici-davetli ortak yayın odası bağlantısı).

BEGIN;

-- 1. Canlı Agora siparişi ile Viva etkinliği arasındaki tekil bağ indeksi
CREATE UNIQUE INDEX IF NOT EXISTS idx_agora_canli_siparisleri_viva_etkinlik
  ON public.agora_canli_siparisleri(viva_etkinlik_id)
  WHERE viva_etkinlik_id IS NOT NULL;

-- 2. Viva süre adımı tetikleyicisi: Standart Viva (30/60/90 dk) yanında
-- Agora canlı yayın siparişine bağlı etkinliklerde (45/60/120/180 dk) sürelerine izin verir.
CREATE OR REPLACE FUNCTION public.viva_sure_adimi_dogrula() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  saniye numeric;
  v_agora_bagli boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.baslangic IS NOT DISTINCT FROM OLD.baslangic
     AND NEW.bitis IS NOT DISTINCT FROM OLD.bitis THEN
    RETURN NEW;
  END IF;

  saniye := extract(epoch FROM (NEW.bitis - NEW.baslangic));
  v_agora_bagli := (NEW.olusturma_ozeti ? 'agora_siparis_id')
    OR EXISTS (
      SELECT 1 FROM public.agora_canli_siparisleri s
      WHERE s.viva_etkinlik_id = NEW.etkinlik_id
    );

  IF v_agora_bagli THEN
    IF saniye IS NULL OR saniye NOT IN (2700, 3600, 7200, 10800) THEN
      RAISE EXCEPTION 'Agora canlı yayın süresi 45, 60, 120 veya 180 dakika olmalıdır.' USING ERRCODE = '22023';
    END IF;
    RETURN NEW;
  END IF;

  IF saniye IS NULL OR saniye NOT BETWEEN 1800 AND 5400 OR mod(saniye, 1800) <> 0 THEN
    RAISE EXCEPTION 'Yayın süresi yalnızca 30, 60 veya 90 dakika olabilir.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.viva_sure_adimi_dogrula() FROM PUBLIC, anon, authenticated;

-- 3. Viva ekranında Agora canlı yayın sipariş bağlamını okuma
CREATE OR REPLACE FUNCTION public.agora_canli_viva_siparis_baglami(
  p_auth_id uuid,
  p_siparis_id uuid DEFAULT NULL,
  p_etkinlik_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_firma uuid;
  v_sonuc jsonb;
BEGIN
  IF p_siparis_id IS NULL AND p_etkinlik_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_firma := public.agora_satin_alma_yetki(p_auth_id);

  SELECT jsonb_build_object(
    'siparis_id', s.siparis_id,
    'oturum_id', s.oturum_id,
    'canli_egitim_id', s.canli_egitim_id,
    'partner_id', s.partner_id,
    'sirket_adi', coalesce(p.sirket_adi, 'İş Partneri'),
    'partner_egitim_id', s.partner_egitim_id,
    'egitim_adi', s.egitim_adi,
    'kategori_kodu', e.kategori_kodu,
    'kategori', e.kategori,
    'aciklama', e.aciklama,
    'baslangic_at', s.baslangic_at,
    'bitis_at', o.bitis_at,
    'sure_dakika', s.sure_dakika,
    'kapasite', s.kapasite,
    'durum', o.durum,
    'viva_etkinlik_id', s.viva_etkinlik_id
  )
  INTO v_sonuc
  FROM public.agora_canli_siparisleri s
  JOIN public.agora_partner_canli_oturumlar o ON o.oturum_id = s.oturum_id
  JOIN public.agora_partner_canli_egitimler e ON e.canli_egitim_id = s.canli_egitim_id
  LEFT JOIN public.agora_partner_profilleri p ON p.partner_id = s.partner_id
  WHERE s.alici_id = p_auth_id
    AND s.firma_id = v_firma
    AND (
      (p_siparis_id IS NOT NULL AND s.siparis_id = p_siparis_id)
      OR (p_siparis_id IS NULL AND p_etkinlik_id IS NOT NULL AND s.viva_etkinlik_id = p_etkinlik_id)
    )
  LIMIT 1;

  IF p_siparis_id IS NOT NULL AND v_sonuc IS NULL THEN
    RAISE EXCEPTION 'Bu canlı yayın siparişine erişim yetkiniz yok veya sipariş bulunamadı.' USING ERRCODE = '42501';
  END IF;

  RETURN v_sonuc;
END $f$;

-- 4. Viva etkinliği oluşturulduğunda/güncellendiğinde Agora siparişine bağlama ve kontenjan doğrulaması
CREATE OR REPLACE FUNCTION public.agora_canli_viva_etkinlik_bagla(
  p_auth_id uuid,
  p_siparis_id uuid,
  p_etkinlik_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_firma uuid;
  v_siparis public.agora_canli_siparisleri%ROWTYPE;
  v_oturum public.agora_partner_canli_oturumlar%ROWTYPE;
  v_etkinlik public.viva_etkinlikler%ROWTYPE;
  v_davetli_sayisi integer;
  v_oda_adi text;
BEGIN
  v_firma := public.agora_satin_alma_yetki(p_auth_id);

  SELECT * INTO v_siparis
  FROM public.agora_canli_siparisleri
  WHERE siparis_id = p_siparis_id
    AND alici_id = p_auth_id
    AND firma_id = v_firma
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canlı yayın siparişi bulunamadı veya yetkiniz yok.' USING ERRCODE = '42501';
  END IF;

  IF v_siparis.viva_etkinlik_id IS NOT NULL AND v_siparis.viva_etkinlik_id <> p_etkinlik_id THEN
    RAISE EXCEPTION 'Bu canlı yayın siparişi için zaten bir Viva daveti oluşturulmuş.' USING ERRCODE = '40001';
  END IF;

  SELECT * INTO v_oturum
  FROM public.agora_partner_canli_oturumlar
  WHERE oturum_id = v_siparis.oturum_id
  FOR UPDATE;

  IF NOT FOUND OR v_oturum.durum <> 'siparis_verildi' THEN
    RAISE EXCEPTION 'Yalnızca aktif sipariş verilmiş canlı yayınlar için davet yönetilebilir.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_etkinlik
  FROM public.viva_etkinlikler
  WHERE etkinlik_id = p_etkinlik_id
    AND sahip_id = p_auth_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Viva etkinliği bulunamadı.' USING ERRCODE = '22023';
  END IF;

  SELECT
    (SELECT count(*)::integer FROM public.viva_katilimcilar vk WHERE vk.etkinlik_id = p_etkinlik_id)
    + (SELECT count(*)::integer FROM public.viva_davetler vd WHERE vd.etkinlik_id = p_etkinlik_id AND NOT vd.iptal)
  INTO v_davetli_sayisi;

  IF v_davetli_sayisi > v_siparis.kapasite THEN
    RAISE EXCEPTION 'Bu canlı yayının davetli kontenjanı (siz hariç) en fazla % kişidir.', v_siparis.kapasite
      USING ERRCODE = '22023';
  END IF;

  v_oda_adi := 'viva-' || replace(p_etkinlik_id::text, '-', '') || '-n1';

  UPDATE public.agora_canli_siparisleri
  SET viva_etkinlik_id = p_etkinlik_id
  WHERE siparis_id = p_siparis_id;

  UPDATE public.agora_partner_canli_oturumlar
  SET viva_oda_adi = v_oda_adi,
      updated_at = now()
  WHERE oturum_id = v_siparis.oturum_id;

  RETURN jsonb_build_object(
    'siparis_id', v_siparis.siparis_id,
    'viva_etkinlik_id', p_etkinlik_id,
    'davetli_sayisi', v_davetli_sayisi,
    'kapasite', v_siparis.kapasite
  );
END $f$;

-- 5. Canlı Agora Yayınları listesinde davetli sayısını da döndür
CREATE OR REPLACE FUNCTION public.agora_canli_yayinlarim_oku(p_auth_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_firma uuid;
BEGIN
  v_firma := public.agora_satin_alma_yetki(p_auth_id);

  RETURN (
    SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.baslangic_at ASC, r.siparis_tarihi DESC), '[]'::jsonb)
    FROM (
      SELECT
        s.siparis_id,
        s.oturum_id,
        s.canli_egitim_id,
        s.partner_id,
        coalesce(p.sirket_adi, 'İş Partneri') AS sirket_adi,
        s.partner_egitim_id,
        s.egitim_adi,
        e.kategori_kodu,
        e.kategori,
        e.hedef_roller,
        e.aciklama,
        s.baslangic_at,
        o.bitis_at,
        s.sure_dakika,
        s.kapasite,
        s.satin_alma_bedeli,
        s.token_tutari,
        s.siparis_tarihi,
        o.durum,
        s.viva_etkinlik_id,
        CASE
          WHEN s.viva_etkinlik_id IS NULL THEN 0
          ELSE (
            (SELECT count(*)::integer FROM public.viva_katilimcilar vk WHERE vk.etkinlik_id = s.viva_etkinlik_id)
            + (SELECT count(*)::integer FROM public.viva_davetler vd WHERE vd.etkinlik_id = s.viva_etkinlik_id AND NOT vd.iptal)
          )
        END AS davetli_sayisi
      FROM public.agora_canli_siparisleri s
      JOIN public.agora_partner_canli_oturumlar o ON o.oturum_id = s.oturum_id
      JOIN public.agora_partner_canli_egitimler e ON e.canli_egitim_id = s.canli_egitim_id
      LEFT JOIN public.agora_partner_profilleri p ON p.partner_id = s.partner_id
      WHERE s.alici_id = p_auth_id
        AND s.firma_id = v_firma
    ) r
  );
END $f$;

-- 6. Oda bilgisi okuma RPC'sine viva_etkinlik_id ve alici_id ekle (Partner ve üretici aynı Viva odasına bağlanır)
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
  v_ad text;
  v_viva_etkinlik_id uuid;
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
    IF v_oturum.alici_id IS DISTINCT FROM p_auth_id THEN
      RAISE EXCEPTION 'Bu canlı yayın oturumu için sipariş kaydınız bulunmuyor.' USING ERRCODE = '42501';
    END IF;
    SELECT nullif(btrim(coalesce(ad, '') || ' ' || coalesce(soyad, '')), '')
    INTO v_ad
    FROM public.kullanicilar WHERE kullanici_id = p_auth_id;
    v_ad := coalesce(v_ad, 'Katılımcı');
  ELSE
    RAISE EXCEPTION 'Yetkisiz istek.' USING ERRCODE = '42501';
  END IF;

  SELECT s.viva_etkinlik_id
  INTO v_viva_etkinlik_id
  FROM public.agora_canli_siparisleri s
  WHERE s.oturum_id = v_oturum.oturum_id
    AND s.alici_id = v_oturum.alici_id
  ORDER BY s.siparis_tarihi DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'oturum_id', v_oturum.oturum_id,
    'baslangic_at', v_oturum.baslangic_at,
    'bitis_at', v_oturum.bitis_at,
    'durum', v_oturum.durum,
    'viva_oda_adi', v_oturum.viva_oda_adi,
    'viva_domain', v_oturum.viva_domain,
    'viva_etkinlik_id', v_viva_etkinlik_id,
    'alici_id', v_oturum.alici_id,
    'kullanici_adi', coalesce(v_ad, 'Katılımcı')
  );
END $f$;

-- 7. Viva katılım bağlamında Agora partner kimliğini de döndür (Partner odadayken davetliler beklemeden katılabilir)
CREATE OR REPLACE FUNCTION public.viva_daily_katilim_baglam(
  p_auth uuid,
  p_etkinlik uuid,
  p_davet_hash text,
  p_oturum_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  e viva_etkinlikler%ROWTYPE;
  d viva_davetler%ROWTYPE;
  id uuid;
  v_ad text;
  v_kimlik text;
  v_rol text;
  v_oturum_bitis timestamptz;
  v_partner_id uuid;
BEGIN
  IF p_auth IS NOT NULL AND p_etkinlik IS NOT NULL AND p_davet_hash IS NULL AND p_oturum_hash IS NULL THEN
    id := p_etkinlik;
  ELSIF p_auth IS NULL AND p_etkinlik IS NULL
    AND coalesce(p_davet_hash, '') ~ '^[a-f0-9]{64}$' AND coalesce(p_oturum_hash, '') ~ '^[a-f0-9]{64}$' THEN
    SELECT etkinlik_id INTO id FROM viva_davetler WHERE token_hash = p_davet_hash;
  ELSE
    RAISE EXCEPTION 'Katılım kimliği geçersiz.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id = id FOR SHARE;
  IF NOT FOUND OR NOT viva_sahip_aktif(id) OR e.durum NOT IN ('planlandi', 'canli') OR e.bitis <= now() THEN
    RAISE EXCEPTION 'Etkinliğe şu anda katılınamaz.' USING ERRCODE = '42501';
  END IF;

  IF p_auth IS NOT NULL THEN
    IF NOT viva_erisim(p_auth, id) THEN
      RAISE EXCEPTION 'Katılım yetkiniz yok.' USING ERRCODE = '42501';
    END IF;
    v_rol := CASE WHEN e.sahip_id = p_auth THEN 'sunucu' ELSE 'katilimci' END;
    v_kimlik := 'uye:' || p_auth::text;
    SELECT k.ad || ' ' || k.soyad INTO v_ad
    FROM kullanicilar k
    WHERE k.kullanici_id = p_auth AND k.aktif_mi
      AND (e.sahip_id = p_auth OR EXISTS(
        SELECT 1 FROM viva_katilimcilar x
        WHERE x.etkinlik_id = id AND x.tur = 'ic' AND x.kullanici_id = p_auth AND viva_ic_kapsam(e.sahip_id, p_auth)
      ));
    IF v_ad IS NULL THEN
      SELECT k.ad || ' ' || k.soyad INTO v_ad
      FROM eclub_kisiler k
      JOIN viva_katilimcilar x ON x.kisi_id = k.kisi_id AND x.tur = 'eclub'
      WHERE x.etkinlik_id = id AND k.auth_user_id = p_auth AND viva_eclub_kapsam(e.sahip_id, k.kisi_id)
      ORDER BY k.kisi_id LIMIT 1;
    END IF;
  ELSE
    SELECT * INTO d FROM viva_davetler WHERE token_hash = p_davet_hash AND etkinlik_id = id FOR SHARE;
    IF NOT FOUND OR d.iptal OR d.oturum_hash IS DISTINCT FROM p_oturum_hash OR d.oturum_bitis IS NULL OR d.oturum_bitis <= now() THEN
      RAISE EXCEPTION 'Davet e-postası doğrulanmamış veya davet süresi dolmuş.' USING ERRCODE = '42501';
    END IF;
    v_rol := 'izleyici';
    v_kimlik := 'davet:' || d.davet_id::text;
    v_ad := d.ad;
    v_oturum_bitis := d.oturum_bitis;
  END IF;

  IF coalesce(length(btrim(v_ad)), 0) = 0 THEN
    RAISE EXCEPTION 'Katılım kimliği doğrulanamadı.' USING ERRCODE = '42501';
  END IF;

  SELECT s.partner_id INTO v_partner_id
  FROM public.agora_canli_siparisleri s
  WHERE s.viva_etkinlik_id = e.etkinlik_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'etkinlik_id', e.etkinlik_id,
    'surum', e.surum,
    'sahip_id', e.sahip_id,
    'kimlik', v_kimlik,
    'ad', v_ad,
    'rol', v_rol,
    'baslangic', e.baslangic,
    'bitis', e.bitis,
    'oturum_bitis', v_oturum_bitis,
    'partner_id', v_partner_id,
    'oda', viva_daily_oda_ozet(id)
  );
END $$;

REVOKE ALL ON FUNCTION
  public.agora_canli_viva_siparis_baglami(uuid, uuid, uuid),
  public.agora_canli_viva_etkinlik_bagla(uuid, uuid, uuid),
  public.agora_canli_yayinlarim_oku(uuid),
  public.agora_canli_oda_bilgisi_oku(uuid, uuid, uuid),
  public.viva_daily_katilim_baglam(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.agora_canli_viva_siparis_baglami(uuid, uuid, uuid),
  public.agora_canli_viva_etkinlik_bagla(uuid, uuid, uuid),
  public.agora_canli_yayinlarim_oku(uuid),
  public.agora_canli_oda_bilgisi_oku(uuid, uuid, uuid),
  public.viva_daily_katilim_baglam(uuid, uuid, text, text)
TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
