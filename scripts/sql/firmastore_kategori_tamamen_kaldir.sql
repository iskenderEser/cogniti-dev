-- FirmaStore kategorisini tamamen kaldırır. Supabase SQL Editor'da çalıştırın.
-- Ürün, firma çek seçimi/Baz Puan, sipariş ve puan hareketleri korunur.
-- E-Club'ın ayrı tablolarına dokunmaz. CASCADE kullanılmaz.
-- Dosya yeniden çalıştırılabilir. Beklenmeyen bağımlılıkta tüm işlem geri alınır.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.store_urunler, public.store_siparisler,
  public.store_puan_harcamalari, public.store_urun_firma_ayarlari
  IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE firmastore_kategori_oncesi ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public.store_urunler) AS urun,
       (SELECT count(*) FROM public.store_siparisler) AS siparis,
       (SELECT count(*) FROM public.store_puan_harcamalari) AS puan_hareketi,
       (SELECT count(*) FROM public.store_urun_firma_ayarlari) AS firma_cek_tanimi;

-- Canlıda doğrulanan iki fonksiyonun yalnız kategoriyle ilgili metinlerini
-- güncelle. CREATE OR REPLACE mevcut yetki ve fonksiyon özelliklerini korur.
DO $fonksiyonlar$
DECLARE v_oid oid; v_eski text; v_yeni text;
BEGIN
  v_oid := to_regprocedure('public.admin_firma_export_snapshot(uuid)');
  IF v_oid IS NOT NULL THEN
    v_eski := pg_get_functiondef(v_oid);
    v_yeni := replace(v_eski,
      $once$'urun_id','kategori_id','ad'$once$,
      $sonra$'urun_id','ad'$sonra$);
    IF v_yeni <> v_eski THEN EXECUTE v_yeni; END IF;
    IF strpos(v_yeni, $alan$'kategori_id'$alan$) > 0 THEN
      RAISE EXCEPTION 'Export kategori tanımı beklenenden farklı; yeni önkontrol gerekli.';
    END IF;
  END IF;

  v_oid := to_regprocedure('public.admin_firma_kalici_sil(uuid,text)');
  IF v_oid IS NOT NULL THEN
    v_eski := pg_get_functiondef(v_oid);
    v_yeni := replace(v_eski, $once$,'store_kategoriler'$once$, '');
    IF v_yeni <> v_eski THEN EXECUTE v_yeni; END IF;
    IF strpos(v_yeni, $tablo$'store_kategoriler'$tablo$) > 0 THEN
      RAISE EXCEPTION 'Firma silme kategori tanımı beklenenden farklı; yeni önkontrol gerekli.';
    END IF;
  END IF;
END;
$fonksiyonlar$;

-- Kolonla birlikte kendi FK'sı kaldırılır; başka bağımlılık varsa RESTRICT
-- işlemi durdurur. Sipariş veya ürün tablosu silinmez.
ALTER TABLE public.store_urunler DROP COLUMN IF EXISTS kategori_id RESTRICT;
DROP TABLE IF EXISTS public.store_kategoriler RESTRICT;

DO $dogrulama$
BEGIN
  IF EXISTS (
    SELECT 1 FROM firmastore_kategori_oncesi o
    WHERE o.urun <> (SELECT count(*) FROM public.store_urunler)
       OR o.siparis <> (SELECT count(*) FROM public.store_siparisler)
       OR o.puan_hareketi <> (SELECT count(*) FROM public.store_puan_harcamalari)
       OR o.firma_cek_tanimi <> (SELECT count(*) FROM public.store_urun_firma_ayarlari)
  ) THEN
    RAISE EXCEPTION 'Ürün/sipariş/puan/firma çek kaydı sayısı değişti; işlem geri alınır.';
  END IF;
END;
$dogrulama$;

SELECT 'TAMAMLANDI' AS durum,
       to_regclass('public.store_kategoriler') IS NULL AS kategori_tablosu_kaldirildi,
       NOT EXISTS (SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='store_urunler'
           AND column_name='kategori_id') AS kategori_kolonu_kaldirildi,
       urun AS korunan_urun, siparis AS korunan_siparis,
       puan_hareketi AS korunan_puan_hareketi, firma_cek_tanimi AS korunan_firma_cek_tanimi
FROM firmastore_kategori_oncesi;
COMMIT;
