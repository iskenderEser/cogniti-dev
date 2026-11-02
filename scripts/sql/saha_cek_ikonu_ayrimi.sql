-- HOYK: UTT/BM'nin açık puan modeli seçimini E-Club varsayılanlarından ayırır.
-- Supabase SQL Editor'da tamamı çalıştırılır. Tekrar çalıştırılabilir.
-- Eski çekli/puan/TL değerleri, puan geçmişi ve FirmaStore bakiyesi değiştirilmez.
-- Kullanıcının 30.10.2026 tarihinde çekli açtığı TEK mevcut yayın doğrulanır.
BEGIN;
LOCK TABLE public.yayin_yonetimi IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE public.yayin_yonetimi ADD COLUMN IF NOT EXISTS saha_puan_modeli text;
ALTER TABLE public.yayin_yonetimi ALTER COLUMN saha_puan_modeli DROP DEFAULT;

DO $tek_yayin$
DECLARE
  v_adet integer;
  v_yayin_id uuid;
BEGIN
  -- Kurulum daha önce uygulandıysa mevcut açık seçimleri tekrar türetme.
  IF EXISTS (SELECT 1 FROM public.yayin_yonetimi WHERE saha_puan_modeli IS NOT NULL) THEN
    RETURN;
  END IF;
  SELECT count(*), (array_agg(y.yayin_id))[1] INTO v_adet, v_yayin_id
  FROM public.yayin_yonetimi y
  WHERE cardinality(y.hedef_roller) > 0 AND y.hedef_roller <@ ARRAY['utt','bm']::text[]
    AND y.cek_karsiligi_var_mi = true
    AND y.karsilik_puan > 0 AND y.karsilik_tl > 0
    AND y.karsilik_tl::text NOT IN ('NaN','Infinity','-Infinity')
    AND y.satis_sarti_tipi IS NULL AND y.gizli_sart_katlama_orani IS NULL AND y.barem_tablosu IS NULL
    AND y.created_at >= timestamptz '2026-10-30 00:00:00+03'
    AND y.created_at < timestamptz '2026-10-31 00:00:00+03';
  IF v_adet <> 1 THEN
    RAISE EXCEPTION 'Çekli açılan tek saha yayını doğrulanamadı (aday sayısı: %). Hiçbir değişiklik uygulanmadı.', v_adet;
  END IF;
  -- Yalnız yeni işaret alanı yazılır. Mevcut oran, hedef ve puanlar korunur.
  UPDATE public.yayin_yonetimi SET saha_puan_modeli = 'tl_karsilikli' WHERE yayin_id = v_yayin_id;
END;
$tek_yayin$;

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
  IF NEW.cek_karsiligi_var_mi THEN
    IF NEW.karsilik_puan IS NULL OR NEW.karsilik_puan <= 0
       OR NEW.karsilik_tl IS NULL OR NEW.karsilik_tl <= 0
       OR NEW.karsilik_tl::text IN ('NaN', 'Infinity', '-Infinity') THEN
      RAISE EXCEPTION 'TL karşılıklı yayında pozitif puan ve TL karşılığı zorunludur.';
    END IF;
  ELSIF NEW.karsilik_puan IS NOT NULL OR NEW.karsilik_tl IS NOT NULL THEN
    RAISE EXCEPTION 'TL’siz yayında puan–TL karşılığı bulunamaz.';
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

SELECT true AS saha_cek_ikonu_ayrimi_hazir;
-- 30005 ve 30029 eski kalmalı; açık seçim yalnız doğrulanan yayında görünmeli.
SELECT k.talep_no AS yayin_no, y.yayin_tarihi, y.saha_puan_modeli,
       y.karsilik_puan, y.karsilik_tl,
       COALESCE(y.saha_puan_modeli = 'tl_karsilikli', false) AS cek_ikonu
FROM public.yayin_yonetimi y
JOIN public.v_yayin_kunye k ON k.yayin_id = y.yayin_id
WHERE k.talep_no IN (30005,30029) OR y.saha_puan_modeli IS NOT NULL
ORDER BY k.talep_no;
