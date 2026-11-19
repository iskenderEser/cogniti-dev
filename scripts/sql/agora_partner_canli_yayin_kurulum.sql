-- KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: agora_kurulum_tamamlama.sql ve cogniti_viva_banner_merkezi_fiyat.sql uygulanmış olmalıdır.
-- Partner canlı yayın tanımları, 30 dk tamponlu takvim oturumları ve tek-firma atomik satın alma RPC'si.
BEGIN;

DO $pre$ BEGIN
  IF to_regclass('public.agora_is_partnerleri') IS NULL
  OR to_regclass('public.agora_partner_profilleri') IS NULL
  OR to_regclass('public.cogniti_fiyat_tarifesi') IS NULL
  OR to_regprocedure('public.cogniti_hizmet_bedeli_hesapla(text,numeric)') IS NULL
  OR to_regprocedure('public.agora_satin_alma_yetki(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Agora partner, merkezi fiyat veya satın alma önkoşulları eksik.';
  END IF;
END $pre$;

-- 1. Partner Canlı Eğitim Tanımı (Konu, süre, kapasite, sabit maliyet & komisyon dökümü)
CREATE TABLE IF NOT EXISTS public.agora_partner_canli_egitimler (
  canli_egitim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
  egitim_adi text NOT NULL CHECK (char_length(egitim_adi) BETWEEN 3 AND 200),
  kategori_kodu text NOT NULL,
  kategori text NOT NULL,
  hedef_roller text[] NOT NULL CHECK (cardinality(hedef_roller) >= 1),
  aciklama text NOT NULL CHECK (char_length(aciklama) BETWEEN 1 AND 10000),
  sure_dakika integer NOT NULL CHECK (sure_dakika IN (45, 60, 120, 180)),
  kapasite integer NOT NULL CHECK (kapasite IN (15, 20, 25, 30, 40, 50)),
  fiyat_tl numeric(12,2) NOT NULL CHECK (fiyat_tl > 0),
  viva_maliyeti_tl numeric(12,2) NOT NULL CHECK (viva_maliyeti_tl >= 0),
  tarife_surumu integer NOT NULL,
  hizmet_orani numeric(4,2) NOT NULL DEFAULT 15 CHECK (hizmet_orani = 15),
  hizmet_bedeli_tl numeric(12,2) NOT NULL CHECK (hizmet_bedeli_tl >= 0),
  net_hakedis_tl numeric(12,2) NOT NULL CHECK (net_hakedis_tl > 0),
  aktif_mi boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (hizmet_bedeli_tl + viva_maliyeti_tl + net_hakedis_tl = fiyat_tl)
);

CREATE INDEX IF NOT EXISTS agora_canli_egitim_partner_idx
  ON public.agora_partner_canli_egitimler(partner_id, aktif_mi, created_at DESC);

ALTER TABLE public.agora_partner_canli_egitimler ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_canli_egitimler FROM PUBLIC, anon, authenticated, service_role;

-- 2. Takvim Oturumları (Her tarih/saat oturumu tek firmaya özel rezerve edilir)
CREATE TABLE IF NOT EXISTS public.agora_partner_canli_oturumlar (
  oturum_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canli_egitim_id uuid NOT NULL REFERENCES public.agora_partner_canli_egitimler(canli_egitim_id),
  partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
  baslangic_at timestamptz NOT NULL,
  bitis_at timestamptz NOT NULL,
  durum text NOT NULL DEFAULT 'musait' CHECK (durum IN ('musait', 'rezerve', 'tamamlandi', 'iptal')),
  satin_alan_firma_id uuid REFERENCES public.firmalar(firma_id),
  viva_oda_adi text,
  viva_domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (bitis_at > baslangic_at)
);

CREATE INDEX IF NOT EXISTS agora_canli_oturum_partner_zaman_idx
  ON public.agora_partner_canli_oturumlar(partner_id, baslangic_at)
  WHERE durum IN ('musait', 'rezerve');

CREATE INDEX IF NOT EXISTS agora_canli_oturum_vitrin_idx
  ON public.agora_partner_canli_oturumlar(durum, baslangic_at);

ALTER TABLE public.agora_partner_canli_oturumlar ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_canli_oturumlar FROM PUBLIC, anon, authenticated, service_role;

-- 3. Canlı Yayın Siparişleri (Tek oturum = tek firma; çift Viva token düşümü yapılmaz)
CREATE TABLE IF NOT EXISTS public.agora_canli_siparisleri (
  siparis_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oturum_id uuid NOT NULL UNIQUE REFERENCES public.agora_partner_canli_oturumlar(oturum_id),
  canli_egitim_id uuid NOT NULL REFERENCES public.agora_partner_canli_egitimler(canli_egitim_id),
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
  alici_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
  partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
  egitim_adi text NOT NULL,
  baslangic_at timestamptz NOT NULL,
  sure_dakika integer NOT NULL,
  kapasite integer NOT NULL,
  satin_alma_bedeli numeric(12,2) NOT NULL CHECK (satin_alma_bedeli > 0),
  kko_birim_fiyati numeric(12,2) NOT NULL CHECK (kko_birim_fiyati > 0),
  token_tutari bigint NOT NULL CHECK (token_tutari >= 0),
  borca_yazilan_token bigint NOT NULL CHECK (borca_yazilan_token BETWEEN 0 AND token_tutari),
  hizmet_orani numeric(4,2) NOT NULL DEFAULT 15 CHECK (hizmet_orani = 15),
  hizmet_bedeli numeric(12,2) NOT NULL CHECK (hizmet_bedeli >= 0),
  viva_maliyeti numeric(12,2) NOT NULL CHECK (viva_maliyeti >= 0),
  odenecek_tutar numeric(12,2) NOT NULL CHECK (odenecek_tutar > 0),
  tuketim_id uuid REFERENCES public.cogniti_token_tuketimleri(tuketim_id),
  siparis_tarihi timestamptz NOT NULL DEFAULT now(),
  CHECK (hizmet_bedeli + viva_maliyeti + odenecek_tutar = satin_alma_bedeli)
);

CREATE INDEX IF NOT EXISTS agora_canli_siparis_partner_idx
  ON public.agora_canli_siparisleri(partner_id, siparis_tarihi DESC);

CREATE INDEX IF NOT EXISTS agora_canli_siparis_firma_idx
  ON public.agora_canli_siparisleri(firma_id, siparis_tarihi DESC);

ALTER TABLE public.agora_canli_siparisleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_canli_siparisleri FROM PUBLIC, anon, authenticated, service_role;

-- 4. Partner Onay Kontrolü + Canlı Eğitim Oluşturma RPC'si (Admin onayı gerektirmez; profil onayı zorunlu)
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
  v_tarife jsonb;
  v_viva_tl numeric(12,2);
  v_surum integer;
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

  -- Merkezi tarifeden Viva altyapı maliyetini hesapla: sure * (kapasite + 1 sunucu) * 60 sn
  v_tarife := public.cogniti_hizmet_bedeli_hesapla('viva', (p_sure_dakika * (p_kapasite + 1) * 60)::numeric);
  v_viva_tl := round((v_tarife->>'hesap_bedeli_tl')::numeric, 2);
  v_surum := (v_tarife->>'surum')::integer;
  v_hizmet := round(p_fiyat_tl * 0.15, 2);
  v_net := round(p_fiyat_tl - v_hizmet - v_viva_tl, 2);

  IF v_net <= 0 THEN
    RAISE EXCEPTION 'Yayın fiyatı, Viva maliyeti ve yüzde 15 hizmet bedelini karşılamıyor.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.agora_partner_canli_egitimler (
    partner_id, egitim_adi, kategori_kodu, kategori, hedef_roller, aciklama,
    sure_dakika, kapasite, fiyat_tl, viva_maliyeti_tl, tarife_surumu, hizmet_bedeli_tl, net_hakedis_tl
  ) VALUES (
    p_partner_id, btrim(p_egitim_adi), p_kategori_kodu, p_kategori, p_hedef_roller, btrim(p_aciklama),
    p_sure_dakika, p_kapasite, round(p_fiyat_tl, 2), v_viva_tl, v_surum, v_hizmet, v_net
  ) RETURNING * INTO v_egitim;

  RETURN to_jsonb(v_egitim);
END $f$;

-- 5. Takvim Oturumu Ekleme RPC'si (30 dk tampon kuralını sunucuda zorunlu kılar)
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

  -- Aynı partnerin eşzamanlı takvim eklemelerini kilitle
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
      AND o.durum IN ('musait', 'rezerve')
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

-- 6. Firma Atomik Satın Alma / Rezervasyon RPC'si (Tek oturum = tek firma)
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
    oturum_id, canli_egitim_id, firma_id, alici_id, partner_id, egitim_adi,
    baslangic_at, sure_dakika, kapasite, satin_alma_bedeli, kko_birim_fiyati,
    token_tutari, borca_yazilan_token, hizmet_bedeli, viva_maliyeti, odenecek_tutar, tuketim_id
  ) VALUES (
    v_oturum.oturum_id, v_egitim.canli_egitim_id, v_firma, p_auth_id, v_egitim.partner_id, v_egitim.egitim_adi,
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

REVOKE ALL ON FUNCTION
  public.agora_partner_canli_egitim_olustur(uuid, text, text, text, text[], text, integer, integer, numeric),
  public.agora_partner_canli_oturum_ekle(uuid, uuid, timestamptz),
  public.agora_canli_oturum_satin_al(uuid, uuid, numeric, numeric)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.agora_partner_canli_egitim_olustur(uuid, text, text, text, text[], text, integer, integer, numeric),
  public.agora_partner_canli_oturum_ekle(uuid, uuid, timestamptz),
  public.agora_canli_oturum_satin_al(uuid, uuid, numeric, numeric)
TO service_role;

COMMIT;
