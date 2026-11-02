-- Adım 7: Firma baz puanıyla atomik çek siparişi ve sipariş anı TL kaydı.
-- Önkoşul: firmastore_cek_katalogu.sql ve firmastore_firma_cek_tanimlari.sql.
-- Mevcut siparişler doldurulmaz/değiştirilmez. Bakiye ve iptal hesabı korunur.
BEGIN;

ALTER TABLE public.store_siparisler
  ADD COLUMN IF NOT EXISTS firma_id uuid REFERENCES public.firmalar(firma_id),
  ADD COLUMN IF NOT EXISTS cek_birim_tl numeric(12,2),
  ADD COLUMN IF NOT EXISTS toplam_tl numeric(22,2);
DO $kurulum$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.store_siparisler'::regclass AND conname = 'store_siparis_cek_tl_check') THEN
    ALTER TABLE public.store_siparisler ADD CONSTRAINT store_siparis_cek_tl_check CHECK (
      (cek_birim_tl IS NULL AND toplam_tl IS NULL)
      OR (cek_birim_tl IS NOT NULL AND toplam_tl IS NOT NULL
        AND cek_birim_tl > 0 AND cek_birim_tl <= 9999999999.99
        AND toplam_tl = cek_birim_tl * adet));
  END IF;
END $kurulum$;

COMMENT ON COLUMN public.store_siparisler.firma_id IS 'Sipariş anındaki firma; eski siparişlere tahminî değer atanmaz.';
COMMENT ON COLUMN public.store_siparisler.cek_birim_tl IS 'Sipariş anında seçilen çekin birim TL tutarı.';
COMMENT ON COLUMN public.store_siparisler.toplam_tl IS 'Sipariş anındaki çek birim TL tutarı çarpı adet.';

-- Kullanıcının doğruladığı kurulu çekirdeğin takvim/dönem/bakiye davranışı
-- aynen alınır. Yalnız global puan okuması, firmanın seçili çek puanına çevrilir.
DO $cekirdek$
DECLARE
  kaynak text;
  yeni text;
  desen constant text := $re$SELECT[[:space:]]+aktif_mi,[[:space:]]*stok,[[:space:]]*puan_fiyati[[:space:]]+INTO[[:space:]]+v_urun_aktif,[[:space:]]*v_urun_stok,[[:space:]]*v_urun_fiyat[[:space:]]+FROM[[:space:]]+(public\.)?store_urunler[[:space:]]+WHERE[[:space:]]+urun_id[[:space:]]*=[[:space:]]*p_urun_id[[:space:]]+FOR[[:space:]]+UPDATE;$re$;
BEGIN
  kaynak := pg_get_functiondef('public.store_siparis_olustur_adressiz_cekirdek(uuid,uuid,integer)'::regprocedure);
  IF strpos(kaynak, 'public.store_siparis_olustur_adressiz_cekirdek(') = 0
     OR strpos(kaynak, 'kaynak_ceyrek_baslangici') = 0
     OR strpos(kaynak, 'get_harcama_bakiyesi') = 0
     OR strpos(kaynak, 'store_puan_harcamalari') = 0
     OR strpos(kaynak, 'hbstore_siparis_donemi_acik_mi') = 0 THEN
    RAISE EXCEPTION 'Kurulu sipariş çekirdeği doğrulanmış yapıda değil; kurulum geri alındı.';
  END IF;
  yeni := regexp_replace(kaynak, desen, $yeni$
  SELECT u.aktif_mi, u.stok, a.baz_puan
    INTO v_urun_aktif, v_urun_stok, v_urun_fiyat
  FROM public.store_urunler u
  JOIN public.kullanicilar k ON k.kullanici_id = p_kullanici_id
  JOIN public.store_urun_firma_ayarlari a
    ON a.urun_id = u.urun_id AND a.firma_id = k.firma_id
       AND a.aktif_mi IS TRUE AND a.baz_puan > 0
  WHERE u.urun_id = p_urun_id
  FOR UPDATE OF u;
$yeni$);
  IF yeni = kaynak OR strpos(yeni, 'puan_fiyati') > 0 THEN
    RAISE EXCEPTION 'Sipariş puanı okuma bölümü beklenen yapıda değil; kurulum geri alındı.';
  END IF;
  yeni := replace(yeni, 'public.store_siparis_olustur_adressiz_cekirdek(', 'public.store_cek_siparis_cekirdek(');
  EXECUTE yeni;
END $cekirdek$;
ALTER FUNCTION public.store_cek_siparis_cekirdek(uuid,uuid,integer)
  SET search_path = pg_catalog, public, pg_temp;
REVOKE ALL ON FUNCTION public.store_cek_siparis_cekirdek(uuid,uuid,integer)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.store_cek_siparis_olustur(
  p_kullanici_id uuid,
  p_urun_id uuid,
  p_adet integer,
  p_beklenen_baz_puan integer,
  p_beklenen_birim_tl numeric
)
RETURNS TABLE(ok boolean, siparis_id uuid, hata text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $fn$
DECLARE
  v_firma uuid;
  v_baz_puan integer;
  v_birim_tl numeric;
  v_urun_aktif boolean;
  v_secili boolean;
  v_sonuc record;
BEGIN
  IF p_kullanici_id IS NULL OR p_urun_id IS NULL OR p_adet IS NULL OR p_adet < 1
    OR p_beklenen_baz_puan IS NULL OR p_beklenen_baz_puan < 1
    OR p_beklenen_birim_tl IS NULL OR NOT (p_beklenen_birim_tl > 0 AND p_beklenen_birim_tl <= 9999999999.99) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Geçerli çek, adet ve onaylanan tutar zorunludur.'::text; RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('hbstore:siparis:' || p_kullanici_id::text, 0));
  -- Firma ayarı kaydıyla aynı kilit sırası: firma -> ürün -> çek seçimi.
  SELECT k.firma_id INTO v_firma
    FROM public.kullanicilar k JOIN public.firmalar f ON f.firma_id = k.firma_id
    WHERE k.kullanici_id = p_kullanici_id AND k.aktif_mi IS TRUE
      AND k.rol IN ('utt','kd_utt','bm') AND f.aktif IS TRUE AND f.hbstore_aktif IS TRUE
    FOR SHARE OF k, f;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'FirmaStore sipariş yetkiniz bulunmuyor.'::text; RETURN;
  END IF;
  SELECT u.minimum_siparis_tl, u.aktif_mi INTO v_birim_tl, v_urun_aktif
    FROM public.store_urunler u WHERE u.urun_id = p_urun_id FOR UPDATE;
  IF NOT FOUND OR v_urun_aktif IS DISTINCT FROM true OR v_birim_tl IS NULL
    OR NOT (v_birim_tl > 0 AND v_birim_tl <= 9999999999.99) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Bu hediye çeki siparişe açık değil.'::text; RETURN;
  END IF;
  SELECT a.baz_puan, a.aktif_mi INTO v_baz_puan, v_secili
    FROM public.store_urun_firma_ayarlari a
    WHERE a.firma_id = v_firma AND a.urun_id = p_urun_id FOR SHARE;
  IF NOT FOUND OR v_secili IS DISTINCT FROM true OR v_baz_puan IS NULL OR v_baz_puan < 1 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Bu hediye çeki firmanız için siparişe açık değil.'::text; RETURN;
  END IF;
  IF v_baz_puan <> p_beklenen_baz_puan OR v_birim_tl <> p_beklenen_birim_tl THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Çekin puan veya TL karşılığı değişti. Mağazayı yenileyip tekrar onaylayın.'::text; RETURN;
  END IF;
  IF v_baz_puan::bigint * p_adet > 2147483647 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Sipariş toplam puanı izin verilen sınırı aşıyor.'::text; RETURN;
  END IF;

  -- Çekirdeğin olumsuz dönüşünde bile olası ara yazımlar geri alınır.
  BEGIN
    SELECT * INTO v_sonuc FROM public.store_cek_siparis_cekirdek(p_kullanici_id, p_urun_id, p_adet);
    IF v_sonuc.ok IS DISTINCT FROM true OR v_sonuc.siparis_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = COALESCE(v_sonuc.hata, 'Sipariş oluşturulamadı.');
    END IF;
    UPDATE public.store_siparisler SET firma_id = v_firma, cek_birim_tl = v_birim_tl,
      toplam_tl = v_birim_tl * p_adet
      WHERE store_siparisler.siparis_id = v_sonuc.siparis_id
        AND kullanici_id = p_kullanici_id AND urun_id = p_urun_id
        AND puan_birim_fiyat = v_baz_puan AND toplam_puan = v_baz_puan * p_adet;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Sipariş tutarı doğrulanamadı.';
    END IF;
    RETURN QUERY SELECT true, v_sonuc.siparis_id::uuid, NULL::text;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    RETURN QUERY SELECT false, NULL::uuid, SQLERRM::text;
  END;
END;
$fn$;
REVOKE ALL ON FUNCTION public.store_cek_siparis_olustur(uuid,uuid,integer,integer,numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_cek_siparis_olustur(uuid,uuid,integer,integer,numeric) TO service_role;

-- Eski global puanlı sipariş yoluyla yeni fiyat kontrolü atlanamaz.
REVOKE ALL ON FUNCTION public.store_siparis_olustur_adressiz(uuid,uuid,integer)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.store_siparis_olustur_adressiz_cekirdek(uuid,uuid,integer)
  FROM PUBLIC, anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT to_regprocedure('public.store_cek_siparis_olustur(uuid,uuid,integer,integer,numeric)') IS NOT NULL
  AS firmastore_firma_baz_puan_siparis_hazir;
