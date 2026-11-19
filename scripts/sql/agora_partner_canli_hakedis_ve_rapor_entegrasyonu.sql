-- KULLANICI ÇALIŞTIRACAK.
-- Canlı yayın eğitimlerini ve siparişlerini Partner Hak Edişlerim, Partner Raporlarım ve Admin Hak Ediş / Rapor tablolarına entegre eder.
BEGIN;

-- 1. Canlı eğitimlere standart PE-... eğitim kodu (partner_egitim_id) eklenmesi
ALTER TABLE public.agora_partner_canli_egitimler
  ADD COLUMN IF NOT EXISTS partner_egitim_id text;

DO $m$
DECLARE
  v_kayit record;
BEGIN
  FOR v_kayit IN
    SELECT canli_egitim_id, partner_id
    FROM public.agora_partner_canli_egitimler
    WHERE partner_egitim_id IS NULL
    ORDER BY created_at, canli_egitim_id
  LOOP
    UPDATE public.agora_partner_canli_egitimler
    SET partner_egitim_id = public.agora_partner_egitim_kodu_ayir(v_kayit.partner_id)
    WHERE canli_egitim_id = v_kayit.canli_egitim_id;
  END LOOP;
END $m$;

ALTER TABLE public.agora_partner_canli_egitimler
  ALTER COLUMN partner_egitim_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS agora_partner_canli_egitim_kodu_tekil
  ON public.agora_partner_canli_egitimler(partner_egitim_id);

CREATE OR REPLACE FUNCTION public.agora_partner_canli_egitim_kod_tetikleyici()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id OR NEW.partner_egitim_id IS DISTINCT FROM OLD.partner_egitim_id THEN
      RAISE EXCEPTION 'Partner canlı eğitim kimliği değiştirilemez.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.partner_egitim_id IS NULL THEN
    NEW.partner_egitim_id := public.agora_partner_egitim_kodu_ayir(NEW.partner_id);
  END IF;
  RETURN NEW;
END $f$;

DROP TRIGGER IF EXISTS agora_partner_canli_egitim_kodu ON public.agora_partner_canli_egitimler;
CREATE TRIGGER agora_partner_canli_egitim_kodu
  BEFORE INSERT OR UPDATE ON public.agora_partner_canli_egitimler
  FOR EACH ROW EXECUTE FUNCTION public.agora_partner_canli_egitim_kod_tetikleyici();

REVOKE ALL ON FUNCTION public.agora_partner_canli_egitim_kod_tetikleyici()
  FROM PUBLIC, anon, authenticated, service_role;

-- 2. Canlı yayın siparişlerine partner_egitim_id, %20 KDV ve ödeme günü kolonlarının eklenmesi
ALTER TABLE public.agora_canli_siparisleri
  ADD COLUMN IF NOT EXISTS partner_egitim_id text,
  ADD COLUMN IF NOT EXISTS kdv_tutari numeric(14,2)
    GENERATED ALWAYS AS (round(odenecek_tutar * 0.20, 2)) STORED,
  ADD COLUMN IF NOT EXISTS kdvli_odenecek_tutar numeric(14,2)
    GENERATED ALWAYS AS (round(odenecek_tutar * 1.20, 2)) STORED,
  ADD COLUMN IF NOT EXISTS planlanan_odeme_gunu date,
  ADD COLUMN IF NOT EXISTS odenen_gun date;

UPDATE public.agora_canli_siparisleri s
SET partner_egitim_id = e.partner_egitim_id
FROM public.agora_partner_canli_egitimler e
WHERE s.canli_egitim_id = e.canli_egitim_id
  AND s.partner_egitim_id IS NULL;

ALTER TABLE public.agora_canli_siparisleri
  ALTER COLUMN partner_egitim_id SET NOT NULL;

-- 3. Canlı yayın satın alma RPC'sinde partner_egitim_id kaydı
CREATE OR REPLACE FUNCTION public.agora_canli_oturum_satin_al(
  p_auth_id uuid,
  p_oturum_id uuid,
  p_fiyat numeric,
  p_kko_birim numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_firma uuid;
  v_h public.cogniti_token_hesaplari%ROWTYPE;
  v_oturum public.agora_partner_canli_oturumlar%ROWTYPE;
  v_egitim public.agora_partner_canli_egitimler%ROWTYPE;
  v_siparis public.agora_canli_siparisleri%ROWTYPE;
  v_y record;
  v_toplam bigint;
  v_kalan bigint;
  v_pay bigint;
  v_tid uuid;
BEGIN
  v_firma := public.agora_satin_alma_yetki(p_auth_id);

  SELECT * INTO v_h FROM public.cogniti_token_hesaplari WHERE firma_id = v_firma FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Firmanın token hesabı bulunamadı.' USING ERRCODE = '22023'; END IF;

  SELECT * INTO v_oturum FROM public.agora_partner_canli_oturumlar WHERE oturum_id = p_oturum_id FOR UPDATE;
  IF NOT FOUND OR v_oturum.durum <> 'musait' OR v_oturum.baslangic_at <= now() THEN
    RAISE EXCEPTION 'Bu canlı yayın oturumu artık müsait değil.' USING ERRCODE = '40001';
  END IF;

  SELECT * INTO v_egitim FROM public.agora_partner_canli_egitimler WHERE canli_egitim_id = v_oturum.canli_egitim_id AND aktif_mi;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canlı eğitim artık yayında değil.' USING ERRCODE = '40001';
  END IF;

  IF p_fiyat IS DISTINCT FROM v_egitim.fiyat_tl THEN
    RAISE EXCEPTION 'Yayın fiyatı değişti. Agora’yı yenileyip tekrar onaylayın.' USING ERRCODE = '40001';
  END IF;
  IF p_kko_birim IS NULL OR p_kko_birim <= 0 OR p_kko_birim::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'Token birim fiyatı geçersiz.' USING ERRCODE = '22023';
  END IF;

  IF v_h.paket_turu = 'aylik' THEN PERFORM public.cogniti_token_aylik_donemi_yukle(v_firma);
  ELSE PERFORM public.cogniti_token_kko_aylik_yukle(v_firma); END IF;

  v_toplam := round(v_egitim.fiyat_tl / p_kko_birim);
  v_kalan := v_toplam;

  IF v_toplam > 0 THEN
    INSERT INTO public.cogniti_token_tuketimleri (
      firma_id, gonderen_turu, gonderen_id, alici_turu, alici_kimligi, islem_turu, kaynak_id, islem_anahtari, miktar
    ) VALUES (
      v_firma, 'firma_kullanicisi', p_auth_id, 'firma_kullanicisi', p_auth_id::text, 'agora_satin_alma',
      v_oturum.oturum_id, 'agora-canli:' || v_oturum.oturum_id, v_toplam
    ) RETURNING tuketim_id INTO v_tid;

    FOR v_y IN
      SELECT * FROM public.cogniti_token_yuklemeleri
      WHERE firma_id = v_firma AND kalan > 0 AND (son_kullanim_at IS NULL OR son_kullanim_at > statement_timestamp())
      ORDER BY son_kullanim_at ASC NULLS LAST, created_at, yukleme_id FOR UPDATE
    LOOP
      EXIT WHEN v_kalan = 0;
      v_pay := least(v_kalan, v_y.kalan);
      UPDATE public.cogniti_token_yuklemeleri SET kalan = cogniti_token_yuklemeleri.kalan - v_pay WHERE yukleme_id = v_y.yukleme_id;
      INSERT INTO public.cogniti_token_tuketim_dagilimlari (firma_id, tuketim_id, yukleme_id, miktar)
      VALUES (v_firma, v_tid, v_y.yukleme_id, v_pay);
      v_kalan := v_kalan - v_pay;
    END LOOP;

    UPDATE public.cogniti_token_tuketimleri SET asim_miktari = v_kalan WHERE tuketim_id = v_tid;
    UPDATE public.cogniti_token_hesaplari SET asim_borcu = asim_borcu + v_kalan, updated_at = now() WHERE firma_id = v_firma;
  END IF;

  UPDATE public.agora_partner_canli_oturumlar
  SET durum = 'rezerve', satin_alan_firma_id = v_firma, updated_at = now()
  WHERE oturum_id = v_oturum.oturum_id;

  INSERT INTO public.agora_canli_siparisleri (
    oturum_id, canli_egitim_id, partner_egitim_id, firma_id, alici_id, partner_id, egitim_adi,
    baslangic_at, sure_dakika, kapasite, satin_alma_bedeli, kko_birim_fiyati,
    token_tutari, borca_yazilan_token, hizmet_bedeli, viva_maliyeti, odenecek_tutar, tuketim_id
  ) VALUES (
    v_oturum.oturum_id, v_egitim.canli_egitim_id, v_egitim.partner_egitim_id, v_firma, p_auth_id, v_egitim.partner_id, v_egitim.egitim_adi,
    v_oturum.baslangic_at, v_egitim.sure_dakika, v_egitim.kapasite, v_egitim.fiyat_tl, p_kko_birim,
    v_toplam, v_kalan, v_egitim.hizmet_bedeli_tl, v_egitim.viva_maliyeti_tl, v_egitim.net_hakedis_tl, v_tid
  ) RETURNING * INTO v_siparis;

  RETURN jsonb_build_object(
    'siparis_id', v_siparis.siparis_id,
    'oturum_id', v_oturum.oturum_id,
    'token_tutari', v_toplam,
    'borca_yazilan_token', v_kalan
  );
END $f$;

-- 4. Partner canlı yayın okuma RPC'sine partner_egitim_id eklenmesi
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
    SELECT canli_egitim_id, partner_egitim_id, egitim_adi, kategori_kodu, kategori, hedef_roller, aciklama,
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

-- 5. Partner ve Admin Hak Ediş Okuma / Filtreleme / Toplamlar (Standart + Canlı Siparişler Birlikte)
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

  WITH tum_siparisler AS (
    SELECT siparis_id, partner_id, partner_egitim_id, egitim_adi, siparis_tarihi,
           satin_alma_bedeli, hizmet_bedeli, odenecek_tutar,
           kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu, odenen_gun
    FROM public.agora_siparisleri
    WHERE partner_id = p_partner_id
    UNION ALL
    SELECT siparis_id, partner_id, partner_egitim_id, egitim_adi, siparis_tarihi,
           satin_alma_bedeli, hizmet_bedeli, odenecek_tutar,
           kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu, odenen_gun
    FROM public.agora_canli_siparisleri
    WHERE partner_id = p_partner_id
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
              satin_alma_bedeli, hizmet_bedeli, odenecek_tutar AS hak_edis,
              kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu, odenen_gun
       FROM filtrelenmis
       ORDER BY siparis_tarihi DESC, siparis_id DESC
       LIMIT 20 OFFSET (p_sayfa - 1) * 20
     ) s)
  INTO toplam, filtre_toplam, genel_toplam, kayitlar;

  RETURN jsonb_build_object(
    'partner_id', p_partner_id,
    'toplam', toplam,
    'sayfa', p_sayfa,
    'sayfa_boyutu', 20,
    'kayitlar', kayitlar,
    'genel_toplam', genel_toplam,
    'filtre_toplam', filtre_toplam
  );
END $f$;

-- 6. Admin Planlanan Ödeme Günü Kaydetme (Standart + Canlı Siparişler)
CREATE OR REPLACE FUNCTION public.agora_partner_admin_odeme_gunu_kaydet(
  p_admin_id uuid,
  p_partner_id uuid,
  p_siparis_id uuid,
  p_planlanan_odeme_gunu date,
  p_onceki_odeme_gunu date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_mevcut_gun date;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF p_planlanan_odeme_gunu IS NOT NULL AND
    (p_planlanan_odeme_gunu < date '0001-01-01' OR p_planlanan_odeme_gunu > date '9999-12-31') THEN
    RAISE EXCEPTION 'Geçersiz ödeme günü.' USING ERRCODE = '22023';
  END IF;

  SELECT planlanan_odeme_gunu INTO v_mevcut_gun
  FROM public.agora_siparisleri
  WHERE siparis_id = p_siparis_id AND partner_id = p_partner_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_mevcut_gun IS DISTINCT FROM p_onceki_odeme_gunu THEN
      RAISE EXCEPTION 'Ödeme günü değişmiş. Listeyi yenileyin.' USING ERRCODE = '40001';
    END IF;
    UPDATE public.agora_siparisleri
    SET planlanan_odeme_gunu = p_planlanan_odeme_gunu
    WHERE siparis_id = p_siparis_id;
    RETURN jsonb_build_object('siparis_id', p_siparis_id, 'planlanan_odeme_gunu', p_planlanan_odeme_gunu);
  END IF;

  SELECT planlanan_odeme_gunu INTO v_mevcut_gun
  FROM public.agora_canli_siparisleri
  WHERE siparis_id = p_siparis_id AND partner_id = p_partner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hak ediş bulunamadı.' USING ERRCODE = 'P0002';
  END IF;

  IF v_mevcut_gun IS DISTINCT FROM p_onceki_odeme_gunu THEN
    RAISE EXCEPTION 'Ödeme günü değişmiş. Listeyi yenileyin.' USING ERRCODE = '40001';
  END IF;

  UPDATE public.agora_canli_siparisleri
  SET planlanan_odeme_gunu = p_planlanan_odeme_gunu
  WHERE siparis_id = p_siparis_id;

  RETURN jsonb_build_object('siparis_id', p_siparis_id, 'planlanan_odeme_gunu', p_planlanan_odeme_gunu);
END $f$;

-- 7. Partner ve Admin Raporları (Standart + Canlı Eğitimler Birlikte)
CREATE OR REPLACE FUNCTION public.agora_partner_rapor_kayitlari(p_partner_id uuid, p_sayfa integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  kayitlar jsonb;
  toplam bigint;
BEGIN
  IF p_sayfa IS NULL OR p_sayfa < 1 OR p_sayfa > 100000 THEN
    RAISE EXCEPTION 'Geçersiz rapor sayfası.' USING ERRCODE = '22023';
  END IF;

  WITH tum_egitimler AS (
    SELECT
      e.egitim_id,
      e.partner_egitim_id,
      e.egitim_adi,
      e.fiyat_tl AS satis_fiyati,
      (SELECT count(*) FROM public.agora_siparisleri s WHERE s.partner_id = p_partner_id AND s.egitim_id = e.egitim_id) AS satilan_adet,
      (SELECT coalesce(sum(s.satin_alma_bedeli), 0) FROM public.agora_siparisleri s WHERE s.partner_id = p_partner_id AND s.egitim_id = e.egitim_id) AS toplam_satis,
      (SELECT count(*) FILTER (WHERE i.begeni)
       FROM public.agora_vitrin_etkilesimleri i
       JOIN public.kullanicilar u ON u.kullanici_id = i.auth_id
       JOIN public.firmalar f ON f.firma_id = u.firma_id
       WHERE i.egitim_id = e.egitim_id AND u.aktif_mi AND f.aktif) AS begeni_sayisi,
      (SELECT count(*) FILTER (WHERE i.favori)
       FROM public.agora_vitrin_etkilesimleri i
       JOIN public.kullanicilar u ON u.kullanici_id = i.auth_id
       JOIN public.firmalar f ON f.firma_id = u.firma_id
       WHERE i.egitim_id = e.egitim_id AND u.aktif_mi AND f.aktif) AS favori_sayisi
    FROM public.agora_partner_egitimleri e
    WHERE e.partner_id = p_partner_id
      AND (e.silindi_at IS NULL OR EXISTS (
        SELECT 1 FROM public.agora_siparisleri s WHERE s.partner_id = p_partner_id AND s.egitim_id = e.egitim_id
      ))
    UNION ALL
    SELECT
      ce.canli_egitim_id AS egitim_id,
      ce.partner_egitim_id,
      ce.egitim_adi,
      ce.fiyat_tl AS satis_fiyati,
      (SELECT count(*) FROM public.agora_canli_siparisleri cs WHERE cs.partner_id = p_partner_id AND cs.canli_egitim_id = ce.canli_egitim_id) AS satilan_adet,
      (SELECT coalesce(sum(cs.satin_alma_bedeli), 0) FROM public.agora_canli_siparisleri cs WHERE cs.partner_id = p_partner_id AND cs.canli_egitim_id = ce.canli_egitim_id) AS toplam_satis,
      0::bigint AS begeni_sayisi,
      0::bigint AS favori_sayisi
    FROM public.agora_partner_canli_egitimler ce
    WHERE ce.partner_id = p_partner_id
      AND (ce.aktif_mi OR EXISTS (
        SELECT 1 FROM public.agora_canli_siparisleri cs WHERE cs.partner_id = p_partner_id AND cs.canli_egitim_id = ce.canli_egitim_id
      ))
  )
  SELECT
    (SELECT count(*) FROM tum_egitimler),
    (SELECT coalesce(jsonb_agg(to_jsonb(k) ORDER BY k.partner_egitim_id COLLATE "C", k.egitim_id), '[]'::jsonb)
     FROM (
       SELECT *
       FROM tum_egitimler
       ORDER BY partner_egitim_id COLLATE "C", egitim_id
       LIMIT 20 OFFSET (p_sayfa - 1) * 20
     ) k)
  INTO toplam, kayitlar;

  RETURN jsonb_build_object(
    'partner_id', p_partner_id,
    'toplam', toplam,
    'sayfa', p_sayfa,
    'sayfa_boyutu', 20,
    'kayitlar', kayitlar
  );
END $f$;

NOTIFY pgrst, 'reload schema';
COMMIT;
