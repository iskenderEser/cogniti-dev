-- Adım 3: Cogniti merkezî hediye çeki kataloğuna minimum TL tutarı eklenir.
-- Mevcut ürün, sipariş ve puan kayıtları değiştirilmez; geçmişe TL atanmaz.
-- Firma bazlı baz puan ve sipariş hesabı sonraki adımlarda bağlanacaktır.
BEGIN;
ALTER TABLE public.store_urunler
  ADD COLUMN IF NOT EXISTS minimum_siparis_tl numeric(12,2);
DO $kurulum$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.store_urunler'::regclass
      AND conname = 'store_urunler_minimum_siparis_tl_check'
  ) THEN
    ALTER TABLE public.store_urunler
      ADD CONSTRAINT store_urunler_minimum_siparis_tl_check
      CHECK (minimum_siparis_tl IS NULL OR
        (minimum_siparis_tl > 0 AND minimum_siparis_tl <= 9999999999.99));
  END IF;
END $kurulum$;
COMMENT ON COLUMN public.store_urunler.minimum_siparis_tl IS
  'Cogniti anlaşmalı hediye çekinin minimum TL tutarı; firmaya özel baz puan değildir.';
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'store_urunler'
    AND column_name = 'minimum_siparis_tl' AND data_type = 'numeric'
) AS firmastore_cek_katalogu_hazir;
