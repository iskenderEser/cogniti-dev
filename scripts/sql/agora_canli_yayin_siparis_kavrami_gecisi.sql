-- KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: agora_partner_canli_yayin_kurulum.sql, agora_partner_canli_yayin_okuma_ve_oda.sql,
-- agora_partner_canli_hakedis_ve_rapor_entegrasyonu.sql, agora_partner_canli_egitim_yonetimi.sql
-- ve agora_vitrin_canli_sayim_guncellemesi.sql uygulanmış olmalıdır.
-- Agora canlı yayın oturumlarındaki 'rezerve' durumunu ve firma bazlı sahipliği kaldırır;
-- durumu 'siparis_verildi' ve sahipliği siparişi veren üretici rol (alici_id) olarak düzeltir.
BEGIN;

-- 1. Oturumlar tablosunda alici_id kolonu ve durum ('musait', 'siparis_verildi', 'tamamlandi', 'iptal') geçişi
ALTER TABLE public.agora_partner_canli_oturumlar
  ADD COLUMN IF NOT EXISTS alici_id uuid REFERENCES public.kullanicilar(kullanici_id);

UPDATE public.agora_partner_canli_oturumlar o
SET alici_id = s.alici_id
FROM public.agora_canli_siparisleri s
WHERE s.oturum_id = o.oturum_id
  AND o.alici_id IS NULL;

ALTER TABLE public.agora_partner_canli_oturumlar
  DROP CONSTRAINT IF EXISTS agora_partner_canli_oturumlar_durum_check;

UPDATE public.agora_partner_canli_oturumlar
SET durum = 'siparis_verildi'
WHERE durum = 'rezerve';

ALTER TABLE public.agora_partner_canli_oturumlar
  ADD CONSTRAINT agora_partner_canli_oturumlar_durum_check
  CHECK (durum IN ('musait', 'siparis_verildi', 'tamamlandi', 'iptal'));

DROP INDEX IF EXISTS public.agora_canli_oturum_partner_zaman_idx;
CREATE INDEX agora_canli_oturum_partner_zaman_idx
  ON public.agora_partner_canli_oturumlar(partner_id, baslangic_at)
  WHERE durum IN ('musait', 'siparis_verildi');

-- 2. Takvim Oturumu Ekleme RPC'si (30 dk tampon kontrolü 'musait' ve 'siparis_verildi' üzerinden)
CREATE OR REPLACE FUNCTION public.agora_partner_canli_oturum_ekle(
  p_partner_id uuid,
  p_canli_egitim_id uuid,
  p_baslangic_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_egitim public.agora_partner_canli_egitimler%ROWTYPE;
  v_bitis timestamptz;
  v_oturum public.agora_partner_canli_oturumlar%ROWTYPE;
BEGIN
  IF p_baslangic_at IS NULL OR p_baslangic_at <= now() THEN
    RAISE EXCEPTION 'Canlı yayın başlangıcı gelecekte bir tarih ve saat olmalıdır.' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id FOR UPDATE;

  SELECT * INTO v_egitim
  FROM public.agora_partner_canli_egitimler
  WHERE canli_egitim_id = p_canli_egitim_id AND partner_id = p_partner_id AND aktif_mi;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canlı eğitim bulunamadı veya aktif değil.' USING ERRCODE = '22023';
  END IF;

  v_bitis := p_baslangic_at + make_interval(mins => v_egitim.sure_dakika);

  IF EXISTS (
    SELECT 1
    FROM public.agora_partner_canli_oturumlar o
    WHERE o.partner_id = p_partner_id
      AND o.durum IN ('musait', 'siparis_verildi')
      AND p_baslangic_at < (o.bitis_at + interval '30 minutes')
      AND o.baslangic_at < (v_bitis + interval '30 minutes')
  ) THEN
    RAISE EXCEPTION 'Bu saat aralığı başka bir canlı yayınınızla veya 30 dakikalık ara tamponuyla çakışıyor.' USING ERRCODE = '40001';
  END IF;

  INSERT INTO public.agora_partner_canli_oturumlar (
    canli_egitim_id, partner_id, baslangic_at, bitis_at
  ) VALUES (
    v_egitim.canli_egitim_id, p_partner_id, p_baslangic_at, v_bitis
  ) RETURNING * INTO v_oturum;

  RETURN to_jsonb(v_oturum);
END $f$;

-- 3. Üretici Atomik Sipariş Verme RPC'si (durum = 'siparis_verildi', alici_id = p_auth_id)
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
    RAISE EXCEPTION 'Bu canlı yayın oturumu artık siparişe açık değil.' USING ERRCODE = '40001';
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
  SET durum = 'siparis_verildi',
      satin_alan_firma_id = v_firma,
      alici_id = p_auth_id,
      updated_at = now()
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

-- 4. Agora vitrini canlı yayın okuma RPC'si (siparis_verildi_mi yalnız siparişi veren üretici için true döner)
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
           e.partner_egitim_id,
           e.egitim_adi, e.kategori, e.hedef_roller, e.aciklama,
           e.sure_dakika, e.kapasite, e.fiyat_tl,
           o.baslangic_at, o.bitis_at, o.durum,
           (o.alici_id = p_auth_id) AS siparis_verildi_mi
    FROM public.agora_partner_canli_oturumlar o
    JOIN public.agora_partner_canli_egitimler e ON e.canli_egitim_id = o.canli_egitim_id
    JOIN public.agora_partner_profilleri p ON p.partner_id = o.partner_id
    WHERE e.aktif_mi
      AND o.bitis_at > now()
      AND (o.durum = 'musait' OR (o.durum = 'siparis_verildi' AND o.alici_id = p_auth_id))
  ) r;

  RETURN jsonb_build_object('firma_id', v_firma, 'oturumlar', v_oturumlar);
END $f$;

-- 5. Viva canlı oda girişi için yetki + oturum bilgisi okuma (Yalnız partner veya siparişi veren üretici)
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

-- 6. Partner canlı eğitim yönetimi fonksiyonlarında 'siparis_verildi' kontrolü
CREATE OR REPLACE FUNCTION public.agora_partner_canli_egitim_guncelle(
  p_partner_id uuid,
  p_canli_egitim_id uuid,
  p_egitim_adi text,
  p_kategori_kodu text,
  p_kategori text,
  p_hedef_roller text[],
  p_aciklama text,
  p_sure_dakika integer,
  p_kapasite integer,
  p_fiyat_tl numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_mevcut public.agora_partner_canli_egitimler%ROWTYPE;
  v_hizmet numeric(12,2);
  v_net numeric(12,2);
  v_o record;
  v_yeni_bitis timestamptz;
BEGIN
  PERFORM 1 FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id FOR UPDATE;

  SELECT * INTO v_mevcut
  FROM public.agora_partner_canli_egitimler
  WHERE canli_egitim_id = p_canli_egitim_id AND partner_id = p_partner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canlı eğitim bulunamadı.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.agora_partner_canli_oturumlar
    WHERE canli_egitim_id = p_canli_egitim_id
      AND durum IN ('siparis_verildi', 'tamamlandi')
  ) OR EXISTS (
    SELECT 1
    FROM public.agora_canli_siparisleri
    WHERE canli_egitim_id = p_canli_egitim_id
  ) THEN
    RAISE EXCEPTION 'Sipariş verilmiş oturumu bulunan canlı eğitim düzenlenemez.' USING ERRCODE = '40001';
  END IF;

  IF p_sure_dakika NOT IN (45, 60, 120, 180) THEN
    RAISE EXCEPTION 'Geçersiz yayın süresi.' USING ERRCODE = '22023';
  END IF;
  IF p_kapasite NOT IN (15, 20, 25, 30, 40, 50) THEN
    RAISE EXCEPTION 'Geçersiz katılımcı kapasitesi.' USING ERRCODE = '22023';
  END IF;

  v_hizmet := round(p_fiyat_tl * 0.15, 2);
  v_net := round(p_fiyat_tl - v_hizmet, 2);

  IF v_net <= 0 THEN
    RAISE EXCEPTION 'Yayın satış fiyatı sıfırdan büyük olmalıdır.' USING ERRCODE = '22023';
  END IF;

  IF p_sure_dakika <> v_mevcut.sure_dakika THEN
    FOR v_o IN
      SELECT oturum_id, baslangic_at
      FROM public.agora_partner_canli_oturumlar
      WHERE canli_egitim_id = p_canli_egitim_id
        AND partner_id = p_partner_id
        AND durum = 'musait'
    LOOP
      v_yeni_bitis := v_o.baslangic_at + make_interval(mins => p_sure_dakika);
      IF EXISTS (
        SELECT 1
        FROM public.agora_partner_canli_oturumlar d
        WHERE d.partner_id = p_partner_id
          AND d.oturum_id <> v_o.oturum_id
          AND d.durum IN ('musait', 'siparis_verildi')
          AND v_o.baslangic_at < (d.bitis_at + interval '30 minutes')
          AND d.baslangic_at < (v_yeni_bitis + interval '30 minutes')
      ) THEN
        RAISE EXCEPTION 'Yeni yayın süresi mevcut oturum saatlerinizde 30 dakikalık ara tampon çakışması oluşturuyor.' USING ERRCODE = '40001';
      END IF;

      UPDATE public.agora_partner_canli_oturumlar
      SET bitis_at = v_yeni_bitis, updated_at = now()
      WHERE oturum_id = v_o.oturum_id;
    END LOOP;
  END IF;

  UPDATE public.agora_partner_canli_egitimler
  SET egitim_adi = btrim(p_egitim_adi),
      kategori_kodu = p_kategori_kodu,
      kategori = p_kategori,
      hedef_roller = p_hedef_roller,
      aciklama = btrim(p_aciklama),
      sure_dakika = p_sure_dakika,
      kapasite = p_kapasite,
      fiyat_tl = round(p_fiyat_tl, 2),
      viva_maliyeti_tl = 0,
      tarife_surumu = 0,
      hizmet_bedeli_tl = v_hizmet,
      net_hakedis_tl = v_net,
      updated_at = now()
  WHERE canli_egitim_id = p_canli_egitim_id
  RETURNING * INTO v_mevcut;

  RETURN to_jsonb(v_mevcut);
END $f$;

CREATE OR REPLACE FUNCTION public.agora_partner_canli_egitim_durum_degistir(
  p_partner_id uuid,
  p_canli_egitim_id uuid,
  p_aktif_mi boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_egitim public.agora_partner_canli_egitimler%ROWTYPE;
BEGIN
  PERFORM 1 FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id FOR UPDATE;

  SELECT * INTO v_egitim
  FROM public.agora_partner_canli_egitimler
  WHERE canli_egitim_id = p_canli_egitim_id AND partner_id = p_partner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canlı eğitim bulunamadı.' USING ERRCODE = '22023';
  END IF;

  IF NOT p_aktif_mi AND (
    EXISTS (
      SELECT 1
      FROM public.agora_partner_canli_oturumlar
      WHERE canli_egitim_id = p_canli_egitim_id
        AND durum IN ('siparis_verildi', 'tamamlandi')
    ) OR EXISTS (
      SELECT 1
      FROM public.agora_canli_siparisleri
      WHERE canli_egitim_id = p_canli_egitim_id
    )
  ) THEN
    RAISE EXCEPTION 'Sipariş verilmiş oturumu bulunan canlı eğitim pasife alınamaz.' USING ERRCODE = '40001';
  END IF;

  UPDATE public.agora_partner_canli_egitimler
  SET aktif_mi = p_aktif_mi, updated_at = now()
  WHERE canli_egitim_id = p_canli_egitim_id
  RETURNING * INTO v_egitim;

  RETURN to_jsonb(v_egitim);
END $f$;

CREATE OR REPLACE FUNCTION public.agora_partner_canli_egitim_sil(
  p_partner_id uuid,
  p_canli_egitim_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_id uuid;
BEGIN
  PERFORM 1 FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id FOR UPDATE;

  SELECT canli_egitim_id INTO v_id
  FROM public.agora_partner_canli_egitimler
  WHERE canli_egitim_id = p_canli_egitim_id AND partner_id = p_partner_id
  FOR UPDATE;

  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.agora_partner_canli_oturumlar
    WHERE canli_egitim_id = p_canli_egitim_id
      AND durum IN ('siparis_verildi', 'tamamlandi')
  ) OR EXISTS (
    SELECT 1
    FROM public.agora_canli_siparisleri
    WHERE canli_egitim_id = p_canli_egitim_id
  ) THEN
    RAISE EXCEPTION 'Sipariş verilmiş oturumu bulunan canlı eğitim silinemez.' USING ERRCODE = '40001';
  END IF;

  DELETE FROM public.agora_partner_canli_oturumlar
  WHERE canli_egitim_id = p_canli_egitim_id AND partner_id = p_partner_id;

  DELETE FROM public.agora_partner_canli_egitimler
  WHERE canli_egitim_id = p_canli_egitim_id AND partner_id = p_partner_id;

  RETURN true;
END $f$;

-- 7. Agora vitrini sayım fonksiyonunda 'siparis_verildi' ve üretici (alici_id) kontrolü
CREATE OR REPLACE FUNCTION public.agora_vitrin_oku(p_auth_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_hafta date := (date_trunc('week', now() AT TIME ZONE 'Europe/Istanbul'))::date;
  v_partner_sayisi bigint;
  v_yayin_sayisi bigint;
  v_canli_yayin_sayisi bigint;
  v_siparis_sayisi bigint;
  ozet jsonb;
  partnerler jsonb;
  yayinlar jsonb;
BEGIN
  PERFORM public.agora_vitrin_yetki(p_auth_id);

  SELECT count(*) INTO v_partner_sayisi
  FROM public.agora_is_partnerleri p
  JOIN public.agora_partner_profilleri f USING (partner_id)
  WHERE p.ilk_giris_durumu = 'onaylandi'
    AND p.uyelik_durumu = 'onaylandi';

  SELECT count(*) INTO v_yayin_sayisi
  FROM public.agora_yayindaki_egitimler;

  SELECT count(DISTINCT e.canli_egitim_id) INTO v_canli_yayin_sayisi
  FROM public.agora_partner_canli_oturumlar o
  JOIN public.agora_partner_canli_egitimler e USING (canli_egitim_id)
  WHERE e.aktif_mi
    AND o.bitis_at > now()
    AND (o.durum = 'musait' OR (o.durum = 'siparis_verildi' AND o.alici_id = p_auth_id));

  SELECT
    (SELECT count(*) FROM public.agora_siparisleri) +
    (SELECT count(*) FROM public.agora_canli_siparisleri)
  INTO v_siparis_sayisi;

  INSERT INTO public.agora_vitrin_haftalik_ozet(hafta, partner_sayisi, yayin_sayisi, canli_yayin_sayisi, siparis_sayisi)
  VALUES (v_hafta, v_partner_sayisi, v_yayin_sayisi, v_canli_yayin_sayisi, v_siparis_sayisi)
  ON CONFLICT (hafta) DO UPDATE SET
    partner_sayisi = EXCLUDED.partner_sayisi,
    yayin_sayisi = EXCLUDED.yayin_sayisi,
    canli_yayin_sayisi = EXCLUDED.canli_yayin_sayisi,
    siparis_sayisi = EXCLUDED.siparis_sayisi;

  ozet := jsonb_build_object(
    'partner_sayisi', v_partner_sayisi,
    'yayin_sayisi', v_yayin_sayisi,
    'canli_yayin_sayisi', v_canli_yayin_sayisi,
    'siparis_sayisi', v_siparis_sayisi,
    'hafta', v_hafta
  );

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.yayin_sayisi DESC, r.sirket_adi COLLATE "C", r.partner_id), '[]')
  INTO partnerler
  FROM (
    SELECT
      p.partner_id,
      f.sirket_adi,
      (
        (SELECT count(*) FROM public.agora_yayindaki_egitimler y WHERE y.partner_id = p.partner_id) +
        (SELECT count(DISTINCT e.canli_egitim_id)
         FROM public.agora_partner_canli_oturumlar o
         JOIN public.agora_partner_canli_egitimler e USING (canli_egitim_id)
         WHERE e.partner_id = p.partner_id
           AND e.aktif_mi
           AND o.bitis_at > now()
           AND (o.durum = 'musait' OR (o.durum = 'siparis_verildi' AND o.alici_id = p_auth_id)))
      ) AS yayin_sayisi
    FROM public.agora_is_partnerleri p
    JOIN public.agora_partner_profilleri f USING (partner_id)
    WHERE p.ilk_giris_durumu = 'onaylandi'
      AND p.uyelik_durumu = 'onaylandi'
  ) r;

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.yayinlandi_at DESC, r.egitim_id), '[]')
  INTO yayinlar
  FROM (
    SELECT y.*, e.partner_egitim_id, public.agora_partner_kart_video_guid(y.egitim_id) AS kapak_video_guid,
      (SELECT count(*) FROM public.agora_vitrin_etkilesimleri i JOIN public.kullanicilar k ON k.kullanici_id = i.auth_id JOIN public.firmalar f USING (firma_id) WHERE i.egitim_id = y.egitim_id AND i.begeni AND k.aktif_mi AND f.aktif) AS begeni_sayisi,
      (SELECT count(*) FROM public.agora_vitrin_etkilesimleri i JOIN public.kullanicilar k ON k.kullanici_id = i.auth_id JOIN public.firmalar f USING (firma_id) WHERE i.egitim_id = y.egitim_id AND i.favori AND k.aktif_mi AND f.aktif) AS favori_sayisi,
      coalesce(i.begeni, false) AS begeni_mi,
      coalesce(i.favori, false) AS favori_mi,
      (SELECT count(*) FROM public.agora_siparisleri s WHERE s.egitim_id = y.egitim_id) AS siparis_sayisi,
      e.surum,
      EXISTS(SELECT 1 FROM public.agora_siparisleri s WHERE s.alici_id = p_auth_id AND s.egitim_id = y.egitim_id) AS satin_alindi
    FROM public.agora_yayindaki_egitimler y
    JOIN public.agora_partner_egitimleri e USING (egitim_id)
    LEFT JOIN public.agora_vitrin_etkilesimleri i ON i.egitim_id = y.egitim_id AND i.auth_id = p_auth_id
  ) r;

  RETURN jsonb_build_object('stat', ozet, 'partnerler', partnerler, 'yayinlar', yayinlar);
END;
$f$;

COMMIT;
