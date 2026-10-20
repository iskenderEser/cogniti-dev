-- Admin > Eczanem: bağımsız üye bannerları. Mevcut sayfa bannerları korunur.
-- Cogniti platform firması en fazla beş; diğer firmalar en fazla üç üye bannerı kullanır.
-- Tamamını tek parça çalıştırın. Mevcut E-Club bannerları değiştirilmez.
BEGIN;
CREATE TABLE IF NOT EXISTS public.eczanem_sayfa_bannerlari (
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id) ON DELETE CASCADE,
  alan text NOT NULL CHECK (alan IN ('uyeler', 'uye-yayinlari', 'indirim-onayi', 'uye-ana-sayfa')),
  sira smallint NOT NULL CHECK (sira BETWEEN 1 AND 3),
  dosya_yolu text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firma_id, alan, sira),
  CHECK (dosya_yolu LIKE 'eclub-bannerlar/' || firma_id::text || '/' || alan || '/%')
);
-- CREATE IF NOT EXISTS mevcut tabloyu değiştirmez; eski kurulum da burada genişletilir.
ALTER TABLE public.eczanem_sayfa_bannerlari
  DROP CONSTRAINT IF EXISTS eczanem_sayfa_bannerlari_alan_check;
ALTER TABLE public.eczanem_sayfa_bannerlari
  ADD CONSTRAINT eczanem_sayfa_bannerlari_alan_check
  CHECK (alan IN ('uyeler', 'uye-yayinlari', 'indirim-onayi', 'uye-ana-sayfa'));
ALTER TABLE public.eczanem_sayfa_bannerlari
  DROP CONSTRAINT IF EXISTS eczanem_sayfa_bannerlari_sira_check;
ALTER TABLE public.eczanem_sayfa_bannerlari
  ADD CONSTRAINT eczanem_sayfa_bannerlari_sira_check CHECK (
    sira >= 1 AND sira <= CASE
      WHEN alan = 'uye-ana-sayfa'
        AND firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid THEN 5
      ELSE 3
    END
  );
ALTER TABLE public.eczanem_sayfa_bannerlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.eczanem_sayfa_bannerlari FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.eczanem_sayfa_bannerlari TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'TAMAMLANDI' AS sql_sonucu, to_regclass('public.eczanem_sayfa_bannerlari') AS tablo;
