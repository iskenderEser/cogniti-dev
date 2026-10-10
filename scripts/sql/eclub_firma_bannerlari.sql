-- Hapbilgi için beş, diğer firmalar için üç banner. Tamamını tek parça çalıştırın.
-- İlk kurulum ve mevcut tablonun güncellenmesi için aynı SQL kullanılır.
-- Mevcut banner, firma, puan ve çek kayıtları korunur.
BEGIN;
CREATE TABLE IF NOT EXISTS public.eclub_firma_bannerlari (
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id) ON DELETE CASCADE,
  sira smallint NOT NULL CHECK (sira BETWEEN 1 AND 5),
  dosya_yolu text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firma_id, sira),
  CHECK (dosya_yolu LIKE 'eclub-bannerlar/' || firma_id::text || '/%')
);
ALTER TABLE public.eclub_firma_bannerlari DROP CONSTRAINT IF EXISTS eclub_firma_bannerlari_sira_check;
ALTER TABLE public.eclub_firma_bannerlari ADD CONSTRAINT eclub_firma_bannerlari_sira_check CHECK (sira BETWEEN 1 AND 5);

CREATE OR REPLACE FUNCTION public.eclub_banner_sira_kontrolu()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fonksiyon$
DECLARE v_firma_adi text;
BEGIN
  SELECT firma_adi INTO v_firma_adi FROM public.firmalar WHERE firma_id = NEW.firma_id;
  IF NEW.sira > 3 AND lower(btrim(coalesce(v_firma_adi, ''))) <> 'hapbilgi' THEN
    RAISE EXCEPTION 'Yalnız Hapbilgi firması beş banner kullanabilir.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fonksiyon$;
DROP TRIGGER IF EXISTS eclub_banner_sira_kontrolu ON public.eclub_firma_bannerlari;
CREATE TRIGGER eclub_banner_sira_kontrolu BEFORE INSERT OR UPDATE ON public.eclub_firma_bannerlari
FOR EACH ROW EXECUTE FUNCTION public.eclub_banner_sira_kontrolu();
ALTER TABLE public.eclub_firma_bannerlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.eclub_firma_bannerlari FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.eclub_firma_bannerlari TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'TAMAMLANDI' AS sql_sonucu, to_regclass('public.eclub_firma_bannerlari') AS tablo;
