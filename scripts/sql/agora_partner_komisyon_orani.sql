-- KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: agora_satin_alma.sql, agora_partner_canli_yayin_kurulum.sql,
--          agora_canli_yayin_siparis_kavrami_gecisi.sql ve
--          agora_partner_canli_hakedis_ve_rapor_entegrasyonu.sql kurulmuş olmalıdır.
--
-- Amaç:
--   1. public.sistem_ayarlari tablosuna agora_partner_komisyon_orani (varsayılan 15) ekler.
--   2. agora_siparisleri, agora_partner_canli_egitimler ve agora_canli_siparisleri
--      tablolarındaki sabit CHECK (hizmet_orani = 15) kısıtını (0, 100) aralığına açar.
--   3. Video/Podcast ve Canlı Yayın eğitim oluşturma/güncelleme/okuma/sipariş RPC'lerini
--      sabit 0.15 yerine public.agora_partner_komisyon_orani_oku() tek kaynağına bağlar.
--   4. Daha önce oluşmuş geçmiş siparişlerin hizmet_orani ve tutarları korunur.

BEGIN;

-- 1. Tek kaynak ayarı (mevcut değer varsa korunur; admin panelinden yönetilir)
INSERT INTO public.sistem_ayarlari (anahtar, deger, aciklama)
VALUES (
  'agora_partner_komisyon_orani',
  '15'::jsonb,
  'Agora partner yayınlarında uygulanan Cogniti komisyon oranı (%).'
)
ON CONFLICT (anahtar) DO NOTHING;

-- 2. Tablo CHECK kısıtlarını sabit 15 yerine (0, 100) aralığına aç
DO $mig$
DECLARE
  v_tablo regclass;
  v_con record;
BEGIN
  FOREACH v_tablo IN ARRAY ARRAY[
    'public.agora_siparisleri'::regclass,
    'public.agora_partner_canli_egitimler'::regclass,
    'public.agora_canli_siparisleri'::regclass
  ] LOOP
    FOR v_con IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = v_tablo
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%hizmet_orani%'
    LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', v_tablo, v_con.conname);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I CHECK (hizmet_orani > 0 AND hizmet_orani < 100)',
      v_tablo,
      replace(v_tablo::text, 'public.', '') || '_hizmet_orani_aralik_check'
    );
  END LOOP;
END $mig$;

-- 3. Güncel komisyon oranını sistem_ayarlari tablosundan okuyan yardımcı fonksiyon
CREATE OR REPLACE FUNCTION public.agora_partner_komisyon_orani_oku()
RETURNS numeric(4,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_ham jsonb;
  v_oran numeric;
BEGIN
  SELECT deger INTO v_ham
  FROM public.sistem_ayarlari
  WHERE anahtar = 'agora_partner_komisyon_orani';

  IF v_ham IS NULL OR jsonb_typeof(v_ham) <> 'number' THEN
    RAISE EXCEPTION 'agora_partner_komisyon_orani ayarı tanımlı ve sayısal olmalıdır.' USING ERRCODE = '22023';
  END IF;

  v_oran := round((v_ham #>> '{}')::numeric, 2);
  IF v_oran IS NULL OR v_oran <= 0 OR v_oran >= 100 THEN
    RAISE EXCEPTION 'Partner komisyon oranı 0 ile 100 arasında olmalıdır.' USING ERRCODE = '22023';
  END IF;

  RETURN v_oran::numeric(4,2);
END $f$;

REVOKE ALL ON FUNCTION public.agora_partner_komisyon_orani_oku() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_komisyon_orani_oku() TO service_role;

-- 4. Video / Podcast sipariş RPC'si (agora_satin_al)
CREATE OR REPLACE FUNCTION public.agora_satin_al(
  p_auth_id uuid,
  p_egitim_id uuid,
  p_surum integer,
  p_fiyat numeric,
  p_kko_birim numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  firma uuid;
  e public.agora_partner_egitimleri%ROWTYPE;
  s public.agora_siparisleri%ROWTYPE;
  h public.cogniti_token_hesaplari%ROWTYPE;
  medya jsonb;
  y record;
  toplam bigint;
  v_kalan bigint;
  pay bigint;
  tid uuid;
  v_oran numeric(4,2);
  v_fiyat numeric(12,2);
  v_hizmet numeric(12,2);
  v_odenecek numeric(12,2);
BEGIN
  firma := public.agora_satin_alma_yetki(p_auth_id);
  -- Tüm firma alımları token hesabı kilidini paylaşır; farklı üreticiler de aynı kilitten geçer.
  SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id = firma FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Firmanın token hesabı bulunamadı.' USING ERRCODE = '22023'; END IF;

  SELECT * INTO s FROM public.agora_siparisleri WHERE alici_id = p_auth_id AND egitim_id = p_egitim_id;
  IF FOUND THEN
    RETURN jsonb_build_object('mevcut', true, 'siparis_id', s.siparis_id, 'token_tutari', s.token_tutari, 'borca_yazilan_token', s.borca_yazilan_token);
  END IF;

  SELECT * INTO e FROM public.agora_partner_egitimleri WHERE egitim_id = p_egitim_id FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.agora_yayindaki_egitimler WHERE egitim_id = p_egitim_id) THEN
    RAISE EXCEPTION 'Yayın artık Agora’da satışta değil.' USING ERRCODE = '40001';
  END IF;
  IF p_surum IS DISTINCT FROM e.surum OR p_fiyat IS DISTINCT FROM e.fiyat_tl THEN
    RAISE EXCEPTION 'Yayın veya fiyat değişti. Agora’yı yenileyip tekrar onaylayın.' USING ERRCODE = '40001';
  END IF;
  -- Birim fiyat yalnız sunucudaki ortak fiyat kaynağından gelir; istemciden alınmaz.
  IF p_kko_birim IS NULL OR p_kko_birim <= 0 OR p_kko_birim::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'Token birim fiyatı geçersiz.' USING ERRCODE = '22023';
  END IF;

  IF e.yayin_araci = 'video' THEN
    SELECT jsonb_build_object('dosya_yolu', v.video_guid, 'dosya_boyutu', v.dosya_boyutu, 'sure_saniye', v.sure_saniye, 'mime_type', 'video/mp4')
    INTO medya
    FROM public.agora_partner_videolari v
    WHERE v.yukleme_id = e.yayin_egitim_video_id AND v.egitim_id = e.egitim_id AND v.durum = 'hazir';
  ELSE
    SELECT jsonb_build_object('dosya_yolu', a.dosya_yolu, 'dosya_boyutu', a.dosya_boyutu, 'sure_saniye', a.sure_saniye, 'mime_type', a.mime_type, 'checksum_sha256', a.checksum_sha256) || public.agora_partner_podcast_ek_paket(a.yukleme_id)
    INTO medya
    FROM public.agora_partner_podcastleri a
    WHERE a.yukleme_id = e.yayin_podcast_id AND a.egitim_id = e.egitim_id AND a.durum = 'hazir';
  END IF;
  IF medya IS NULL THEN RAISE EXCEPTION 'Yayının kaynak dosyası hazır değil.' USING ERRCODE = '40001'; END IF;

  v_oran := public.agora_partner_komisyon_orani_oku();
  v_fiyat := round(e.fiyat_tl, 2);
  v_hizmet := round(v_fiyat * v_oran / 100.0, 2);
  v_odenecek := v_fiyat - v_hizmet;

  IF h.paket_turu = 'aylik' THEN PERFORM public.cogniti_token_aylik_donemi_yukle(firma);
  ELSE PERFORM public.cogniti_token_kko_aylik_yukle(firma); END IF;

  toplam := round(e.fiyat_tl / p_kko_birim);
  v_kalan := toplam;
  IF toplam > 0 THEN
    INSERT INTO public.cogniti_token_tuketimleri (
      firma_id, gonderen_turu, gonderen_id, alici_turu, alici_kimligi, islem_turu, kaynak_id, islem_anahtari, miktar
    ) VALUES (
      firma, 'firma_kullanicisi', p_auth_id, 'firma_kullanicisi', p_auth_id::text, 'agora_satin_alma', e.egitim_id, 'agora:' || p_auth_id || ':' || e.egitim_id, toplam
    ) RETURNING tuketim_id INTO tid;

    FOR y IN
      SELECT * FROM public.cogniti_token_yuklemeleri
      WHERE firma_id = firma AND kalan > 0
        AND (son_kullanim_at IS NULL OR son_kullanim_at > statement_timestamp())
      ORDER BY son_kullanim_at ASC NULLS LAST, created_at, yukleme_id FOR UPDATE
    LOOP
      EXIT WHEN v_kalan = 0;
      pay := least(v_kalan, y.kalan);
      UPDATE public.cogniti_token_yuklemeleri SET kalan = cogniti_token_yuklemeleri.kalan - pay WHERE yukleme_id = y.yukleme_id;
      INSERT INTO public.cogniti_token_tuketim_dagilimlari (firma_id, tuketim_id, yukleme_id, miktar) VALUES (firma, tid, y.yukleme_id, pay);
      v_kalan := v_kalan - pay;
    END LOOP;

    UPDATE public.cogniti_token_tuketimleri SET asim_miktari = v_kalan WHERE tuketim_id = tid;
    -- Hem aylık hem KKÖ hesabında eksik tutar borçtur; firmalar.aktif değiştirilmez.
    UPDATE public.cogniti_token_hesaplari SET asim_borcu = asim_borcu + v_kalan, updated_at = now() WHERE firma_id = firma;
  END IF;

  INSERT INTO public.agora_siparisleri (
    firma_id, alici_id, egitim_id, partner_id, partner_egitim_id, egitim_adi, egitim_surumu,
    satin_alma_bedeli, kko_birim_fiyati, token_tutari, borca_yazilan_token,
    hizmet_orani, hizmet_bedeli, odenecek_tutar, tuketim_id, paket
  ) VALUES (
    firma, p_auth_id, e.egitim_id, e.partner_id, e.partner_egitim_id, e.egitim_adi, e.surum,
    v_fiyat, p_kko_birim, toplam, v_kalan,
    v_oran, v_hizmet, v_odenecek, tid,
    jsonb_build_object('bilgiler', e.bilgiler, 'kategori', e.kategori, 'yayin_araci', e.yayin_araci, 'medya', medya)
  ) RETURNING * INTO s;

  RETURN jsonb_build_object('mevcut', false, 'siparis_id', s.siparis_id, 'token_tutari', toplam, 'borca_yazilan_token', v_kalan);
END $f$;

-- 5. Canlı yayın eğitimi oluşturma RPC'si
CREATE OR REPLACE FUNCTION public.agora_partner_canli_egitim_olustur(
  p_partner_id uuid,
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
  v_oran numeric(4,2);
  v_fiyat numeric(12,2);
  v_hizmet numeric(12,2);
  v_net numeric(12,2);
  v_egitim public.agora_partner_canli_egitimler%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.agora_is_partnerleri p
    JOIN public.agora_partner_profilleri f USING (partner_id)
    WHERE p.partner_id = p_partner_id
      AND p.ilk_giris_durumu = 'onaylandi'
      AND p.uyelik_durumu = 'onaylandi'
  ) THEN
    RAISE EXCEPTION 'Canlı yayın açmak için partner profil ve üyelik onayınız tamamlanmış olmalıdır.' USING ERRCODE = '42501';
  END IF;

  IF p_sure_dakika NOT IN (45, 60, 120, 180) THEN
    RAISE EXCEPTION 'Geçersiz yayın süresi.' USING ERRCODE = '22023';
  END IF;
  IF p_kapasite NOT IN (15, 20, 25, 30, 40, 50) THEN
    RAISE EXCEPTION 'Geçersiz katılımcı kapasitesi.' USING ERRCODE = '22023';
  END IF;

  v_oran := public.agora_partner_komisyon_orani_oku();
  v_fiyat := round(p_fiyat_tl, 2);
  v_hizmet := round(v_fiyat * v_oran / 100.0, 2);
  v_net := v_fiyat - v_hizmet;

  IF v_fiyat <= 0 OR v_net <= 0 THEN
    RAISE EXCEPTION 'Yayın satış fiyatı komisyon sonrası sıfırdan büyük olmalıdır.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.agora_partner_canli_egitimler (
    partner_id, egitim_adi, kategori_kodu, kategori, hedef_roller, aciklama,
    sure_dakika, kapasite, fiyat_tl, viva_maliyeti_tl, tarife_surumu,
    hizmet_orani, hizmet_bedeli_tl, net_hakedis_tl
  ) VALUES (
    p_partner_id, btrim(p_egitim_adi), p_kategori_kodu, p_kategori, p_hedef_roller, btrim(p_aciklama),
    p_sure_dakika, p_kapasite, v_fiyat, 0, 0,
    v_oran, v_hizmet, v_net
  ) RETURNING * INTO v_egitim;

  RETURN to_jsonb(v_egitim);
END $f$;

-- 6. Canlı yayın eğitimi güncelleme RPC'si
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
  v_oran numeric(4,2);
  v_fiyat numeric(12,2);
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

  v_oran := public.agora_partner_komisyon_orani_oku();
  v_fiyat := round(p_fiyat_tl, 2);
  v_hizmet := round(v_fiyat * v_oran / 100.0, 2);
  v_net := v_fiyat - v_hizmet;

  IF v_fiyat <= 0 OR v_net <= 0 THEN
    RAISE EXCEPTION 'Yayın satış fiyatı komisyon sonrası sıfırdan büyük olmalıdır.' USING ERRCODE = '22023';
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
      fiyat_tl = v_fiyat,
      viva_maliyeti_tl = 0,
      tarife_surumu = 0,
      hizmet_orani = v_oran,
      hizmet_bedeli_tl = v_hizmet,
      net_hakedis_tl = v_net,
      updated_at = now()
  WHERE canli_egitim_id = p_canli_egitim_id
  RETURNING * INTO v_mevcut;

  RETURN to_jsonb(v_mevcut);
END $f$;

-- 7. Canlı yayın oturumu satın alma RPC'si (satış anındaki güncel komisyon oranını uygular)
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
  v_oran numeric(4,2);
  v_fiyat numeric(12,2);
  v_hizmet numeric(12,2);
  v_odenecek numeric(12,2);
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

  v_oran := public.agora_partner_komisyon_orani_oku();
  v_fiyat := round(v_egitim.fiyat_tl, 2);
  v_hizmet := round(v_fiyat * v_oran / 100.0, 2);
  v_odenecek := v_fiyat - v_hizmet;

  IF v_odenecek <= 0 THEN
    RAISE EXCEPTION 'Yayın satış fiyatı komisyon sonrası sıfırdan büyük olmalıdır.' USING ERRCODE = '22023';
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
    token_tutari, borca_yazilan_token, hizmet_orani, hizmet_bedeli, viva_maliyeti, odenecek_tutar, tuketim_id
  ) VALUES (
    v_oturum.oturum_id, v_egitim.canli_egitim_id, v_egitim.partner_egitim_id, v_firma, p_auth_id, v_egitim.partner_id, v_egitim.egitim_adi,
    v_oturum.baslangic_at, v_egitim.sure_dakika, v_egitim.kapasite, v_fiyat, p_kko_birim,
    v_toplam, v_kalan, v_oran, v_hizmet, 0, v_odenecek, v_tid
  ) RETURNING * INTO v_siparis;

  RETURN jsonb_build_object(
    'siparis_id', v_siparis.siparis_id,
    'oturum_id', v_oturum.oturum_id,
    'token_tutari', v_toplam,
    'borca_yazilan_token', v_kalan
  );
END $f$;

-- 8. Partner canlı yayın verileri okuma RPC'si (güncel komisyon_orani ve canlı hak ediş tutarlarını döner)
CREATE OR REPLACE FUNCTION public.agora_partner_canli_verileri_oku(p_partner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_oran numeric(4,2);
  v_egitimler jsonb;
  v_oturumlar jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.agora_is_partnerleri WHERE partner_id = p_partner_id
  ) THEN
    RAISE EXCEPTION 'Partner bulunamadı.' USING ERRCODE = '42501';
  END IF;

  v_oran := public.agora_partner_komisyon_orani_oku();

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_egitimler
  FROM (
    SELECT canli_egitim_id, partner_egitim_id, egitim_adi, kategori_kodu, kategori, hedef_roller, aciklama,
           sure_dakika, kapasite, round(fiyat_tl, 2) AS fiyat_tl, 0::numeric(12,2) AS viva_maliyeti_tl,
           v_oran AS hizmet_orani,
           round(round(fiyat_tl, 2) * v_oran / 100.0, 2) AS hizmet_bedeli_tl,
           round(fiyat_tl, 2) - round(round(fiyat_tl, 2) * v_oran / 100.0, 2) AS net_hakedis_tl,
           aktif_mi, created_at
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

  RETURN jsonb_build_object(
    'komisyon_orani', v_oran,
    'egitimler', v_egitimler,
    'oturumlar', v_oturumlar
  );
END $f$;

-- 9. Partner & Admin Hak Ediş okuma RPC'si (satır bazında hizmet_orani ve güncel komisyon_orani döner)
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

  WITH tum_siparisler AS (
    SELECT siparis_id, partner_id, partner_egitim_id, egitim_adi, siparis_tarihi,
           satin_alma_bedeli, hizmet_orani, hizmet_bedeli, odenecek_tutar,
           kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu, odenen_gun
    FROM public.agora_siparisleri
    WHERE partner_id = p_partner_id
    UNION ALL
    SELECT siparis_id, partner_id, partner_egitim_id, egitim_adi, siparis_tarihi,
           satin_alma_bedeli, hizmet_orani, hizmet_bedeli, odenecek_tutar,
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
              satin_alma_bedeli, hizmet_orani, hizmet_bedeli, odenecek_tutar AS hak_edis,
              kdv_tutari, kdvli_odenecek_tutar, planlanan_odeme_gunu, odenen_gun
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

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT
  (SELECT deger FROM public.sistem_ayarlari WHERE anahtar = 'agora_partner_komisyon_orani') AS ayarlanan_oran,
  public.agora_partner_komisyon_orani_oku() AS okunan_oran,
  to_regprocedure('public.agora_satin_al(uuid,uuid,integer,numeric,numeric)') IS NOT NULL AS video_podcast_satin_al_hazir,
  to_regprocedure('public.agora_canli_oturum_satin_al(uuid,uuid,numeric,numeric)') IS NOT NULL AS canli_satin_al_hazir,
  true AS agora_partner_komisyon_orani_hazir;
