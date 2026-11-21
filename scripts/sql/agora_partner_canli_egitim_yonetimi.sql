-- KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: agora_partner_canli_yayin_kurulum.sql ve agora_partner_canli_yayin_okuma_ve_oda.sql uygulanmış olmalıdır.
-- Partnerin sipariş verilmemiş canlı eğitimini düzenleme, pasife/aktife alma ve silme RPC'leri.
BEGIN;

-- 1. Canlı Eğitim Güncelleme RPC'si (Yalnız sipariş verilmemiş eğitimler düzenlenebilir)
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
      AND durum IN ('rezerve', 'tamamlandi')
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

  -- Süre değiştiyse bu eğitimin müsait oturumlarının bitiş saatlerini güncelle ve 30 dk tampon çakışmasını kontrol et
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
          AND d.durum IN ('musait', 'rezerve')
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

-- 2. Canlı Eğitimi Pasife / Aktife Alma RPC'si (Yalnız sipariş verilmemiş eğitimler pasife alınabilir)
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
        AND durum IN ('rezerve', 'tamamlandi')
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

-- 3. Canlı Eğitimi Silme RPC'si (Yalnız sipariş verilmemiş eğitimler ve bağlı oturumları silinebilir)
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
      AND durum IN ('rezerve', 'tamamlandi')
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

REVOKE ALL ON FUNCTION
  public.agora_partner_canli_egitim_guncelle(uuid, uuid, text, text, text, text[], text, integer, integer, numeric),
  public.agora_partner_canli_egitim_durum_degistir(uuid, uuid, boolean),
  public.agora_partner_canli_egitim_sil(uuid, uuid)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.agora_partner_canli_egitim_guncelle(uuid, uuid, text, text, text, text[], text, integer, integer, numeric),
  public.agora_partner_canli_egitim_durum_degistir(uuid, uuid, boolean),
  public.agora_partner_canli_egitim_sil(uuid, uuid)
TO service_role;

COMMIT;
