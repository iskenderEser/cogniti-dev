-- Eczanem yalnız aynı firmanın E-Club modülü açıkken açık olabilir.
-- Mevcut tutarsız bayrakları kapatır; puan, üyelik ve işlem kayıtlarını silmez.
-- E-Club kapanınca Eczanem de kapanır; E-Club açılınca otomatik açılmaz.
-- Tamamı tek parça çalıştırılır. Tekrar çalıştırılabilir.
BEGIN;

-- Kurulum ile eş zamanlı firma güncellemesi arasında boşluk bırakma.
LOCK TABLE public.firmalar IN SHARE ROW EXCLUSIVE MODE;

UPDATE public.firmalar
SET eczanem_aktif = false
WHERE eczanem_aktif IS TRUE AND eclub_aktif IS DISTINCT FROM true;

CREATE OR REPLACE FUNCTION public.eczanem_eclub_modul_bagimliligini_koru()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fonksiyon$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.eclub_aktif IS TRUE AND NEW.eclub_aktif IS DISTINCT FROM true THEN
      NEW.eczanem_aktif := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$fonksiyon$;

DROP TRIGGER IF EXISTS trg_eczanem_eclub_modul_bagimliligi ON public.firmalar;
CREATE TRIGGER trg_eczanem_eclub_modul_bagimliligi
BEFORE INSERT OR UPDATE OF eclub_aktif, eczanem_aktif ON public.firmalar
FOR EACH ROW EXECUTE FUNCTION public.eczanem_eclub_modul_bagimliligini_koru();

DO $kurulum$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.firmalar'::regclass
      AND conname = 'firmalar_eczanem_eclub_bagimliligi'
  ) THEN
    ALTER TABLE public.firmalar
      ADD CONSTRAINT firmalar_eczanem_eclub_bagimliligi
      CHECK (eczanem_aktif IS NOT TRUE OR eclub_aktif IS TRUE);
  END IF;
END;
$kurulum$;

ALTER TABLE public.firmalar VALIDATE CONSTRAINT firmalar_eczanem_eclub_bagimliligi;

COMMIT;

WITH kontrol AS (SELECT
  (SELECT count(*) FROM public.firmalar
   WHERE eczanem_aktif IS TRUE AND eclub_aktif IS DISTINCT FROM true) AS tutarsiz_firma_sayisi,
  EXISTS (SELECT 1 FROM pg_constraint
          WHERE conrelid = 'public.firmalar'::regclass
            AND conname = 'firmalar_eczanem_eclub_bagimliligi'
            AND convalidated) AS kisit_mevcut,
  EXISTS (SELECT 1 FROM pg_trigger
          WHERE tgrelid = 'public.firmalar'::regclass
            AND tgname = 'trg_eczanem_eclub_modul_bagimliligi'
            AND tgenabled <> 'D') AS tetikleyici_mevcut
)
SELECT CASE WHEN tutarsiz_firma_sayisi = 0 AND kisit_mevcut AND tetikleyici_mevcut
            THEN 'TAMAMLANDI' ELSE 'EKSIK' END AS sql_sonucu,
       kontrol.*
FROM kontrol;
