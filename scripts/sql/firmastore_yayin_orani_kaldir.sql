-- FirmaStore: yeni UTT/BM yayınlarında yayın bazlı puan–TL oranını kaldırır.
-- Çekli/çeksiz seçimi ve yayımlanmış kayıtların kilidi korunur.
-- Geçmiş yayınlar, bakiye, E-Club ve Eczanem kayıtları değiştirilmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.tg_saha_yayin_puan_modeli()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.saha_puan_modeli IS DISTINCT FROM OLD.saha_puan_modeli
       OR (((COALESCE(OLD.hedef_roller, ARRAY[]::text[]) && ARRAY['utt','bm'])
         OR (COALESCE(NEW.hedef_roller, ARRAY[]::text[]) && ARRAY['utt','bm']))
       AND (NEW.cek_karsiligi_var_mi IS DISTINCT FROM OLD.cek_karsiligi_var_mi
         OR NEW.karsilik_puan IS DISTINCT FROM OLD.karsilik_puan
         OR NEW.karsilik_tl IS DISTINCT FROM OLD.karsilik_tl
         OR NEW.hedef_roller IS DISTINCT FROM OLD.hedef_roller)) THEN
      RAISE EXCEPTION 'Yayımlanmış UTT/BM içeriğinin puan modeli ve dönüşüm oranı değiştirilemez.';
    END IF;
    RETURN NEW;
  END IF;

  IF COALESCE(cardinality(NEW.hedef_roller), 0) = 0
     OR NOT (NEW.hedef_roller <@ ARRAY['utt','bm']::text[]) THEN
    IF NEW.saha_puan_modeli IS NOT NULL THEN
      RAISE EXCEPTION 'Saha puan modeli yalnız UTT/BM hedefli yayınlarda kullanılabilir.';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.saha_puan_modeli IS NULL OR NEW.saha_puan_modeli NOT IN ('tl_karsilikli','tlsiz') THEN
    RAISE EXCEPTION 'UTT/BM yayını için açık saha puan modeli seçimi zorunludur.';
  END IF;
  IF NEW.cek_karsiligi_var_mi IS DISTINCT FROM (NEW.saha_puan_modeli = 'tl_karsilikli') THEN
    RAISE EXCEPTION 'Saha puan modeli ile çek karşılığı bilgisi uyuşmuyor.';
  END IF;
  IF NEW.cek_karsiligi_var_mi IS NULL THEN
    RAISE EXCEPTION 'UTT/BM yayını için puan modeli zorunludur.';
  END IF;
  IF NEW.satis_sarti_tipi IS NOT NULL OR NEW.gizli_sart_katlama_orani IS NOT NULL
     OR NEW.barem_tablosu IS NOT NULL THEN
    RAISE EXCEPTION 'UTT/BM yayınında E-Club sipariş veya barem koşulları bulunamaz.';
  END IF;
  -- FirmaStore karşılığı firma/çek bazındadır. Yeni saha yayınına oran yazılmaz.
  IF NEW.karsilik_puan IS NOT NULL OR NEW.karsilik_tl IS NOT NULL THEN
    RAISE EXCEPTION 'UTT/BM yayınında puan–TL oranı girilmez; FirmaStore firma çek tanımı kullanılır.';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.tg_saha_yayin_puan_modeli() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_saha_yayin_puan_modeli ON public.yayin_yonetimi;
CREATE TRIGGER trg_saha_yayin_puan_modeli
BEFORE INSERT OR UPDATE ON public.yayin_yonetimi
FOR EACH ROW EXECUTE FUNCTION public.tg_saha_yayin_puan_modeli();

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT strpos(pg_get_functiondef('public.tg_saha_yayin_puan_modeli()'::regprocedure),
  'FirmaStore firma çek tanımı kullanılır') > 0 AS firmastore_yayin_orani_kaldirildi;
