-- Yeni firma tanımındaki zorunlu sorumlu kişi adı soyadı.
-- Mevcut firmalara değer atanmaz; yeni kayıt zorunluluğunu API uygular.
BEGIN;

ALTER TABLE public.firmalar
  ADD COLUMN IF NOT EXISTS sorumlu_ad_soyad text;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'firmalar'
    AND column_name = 'sorumlu_ad_soyad'
) AS firma_sorumlu_kisi_hazir;
