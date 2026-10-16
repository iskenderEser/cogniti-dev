-- Admin: Eczanem'in üç sayfasına ait bağımsız banner alanları.
-- Tamamını tek parça çalıştırın. Mevcut E-Club bannerları değiştirilmez.
BEGIN;
CREATE TABLE IF NOT EXISTS public.eczanem_sayfa_bannerlari (
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id) ON DELETE CASCADE,
  alan text NOT NULL CHECK (alan IN ('uyeler', 'uye-yayinlari', 'indirim-onayi')),
  sira smallint NOT NULL CHECK (sira BETWEEN 1 AND 3),
  dosya_yolu text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firma_id, alan, sira),
  CHECK (dosya_yolu LIKE 'eclub-bannerlar/' || firma_id::text || '/' || alan || '/%')
);
ALTER TABLE public.eczanem_sayfa_bannerlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.eczanem_sayfa_bannerlari FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.eczanem_sayfa_bannerlari TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'TAMAMLANDI' AS sql_sonucu, to_regclass('public.eczanem_sayfa_bannerlari') AS tablo;
