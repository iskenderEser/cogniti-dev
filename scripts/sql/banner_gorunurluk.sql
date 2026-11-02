-- Bannerları silmeden kullanıcı ekranından gizleme/gösterme.
-- Tamamını tek parça çalıştırın. Mevcut görseller görünür kalır.
BEGIN;

ALTER TABLE public.eclub_firma_bannerlari
  ADD COLUMN IF NOT EXISTS gorunur boolean NOT NULL DEFAULT true;

ALTER TABLE public.eczanem_sayfa_bannerlari
  ADD COLUMN IF NOT EXISTS gorunur boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.eclub_firma_bannerlari.gorunur
  IS 'false: görsel adminde tutulur, kullanıcı ekranında gösterilmez.';
COMMENT ON COLUMN public.eczanem_sayfa_bannerlari.gorunur
  IS 'false: görsel adminde tutulur, kullanıcı ekranında gösterilmez.';

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT true AS banner_gorunurluk_hazir;
