-- Yeni Firma Oluştur formundaki kurum ve sorumlu iletişim bilgileri.
-- Mevcut firma kayıtları korunur; yeni alanlar boş olabilir.
BEGIN;

ALTER TABLE public.firmalar
  ADD COLUMN IF NOT EXISTS adres text,
  ADD COLUMN IF NOT EXISTS vergi_dairesi text,
  ADD COLUMN IF NOT EXISTS vergi_numarasi text,
  ADD COLUMN IF NOT EXISTS sorumlu_telefon text,
  ADD COLUMN IF NOT EXISTS sorumlu_eposta text;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT true AS firma_kurum_bilgileri_hazir;
