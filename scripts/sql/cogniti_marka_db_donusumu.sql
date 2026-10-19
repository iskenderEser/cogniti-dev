-- 18.10.2026 kullanıcı ön kontrol sonucundaki platform firması içindir.
-- Supabase SQL Editor'da tamamını tek parça çalıştırın.
-- Firma kimliği, logo alanı, modül durumları ve banner kayıtları korunur.
-- Teknik fonksiyon adları, kimlik ayrımı ve yetkiler değiştirilmez.
BEGIN;

DO $kontrol$
DECLARE
  v_firma_adi text;
BEGIN
  SELECT firma_adi INTO v_firma_adi
  FROM public.firmalar
  WHERE firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid
  FOR UPDATE;
  IF NOT FOUND OR lower(btrim(v_firma_adi)) NOT IN ('hapbilgi', 'cogniti') THEN
    RAISE EXCEPTION 'Ön kontrolde doğrulanan platform firması bulunamadı veya adı değişmiş. İşlem durduruldu.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.firmalar
    WHERE lower(btrim(firma_adi)) = 'cogniti'
      AND firma_id <> '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid
  ) THEN
    RAISE EXCEPTION 'Başka bir Cogniti firma kaydı var. İşlem durduruldu.';
  END IF;
END;
$kontrol$;

CREATE OR REPLACE FUNCTION public.eclub_banner_sira_kontrolu()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fonksiyon$
BEGIN
  IF NEW.sira > 3 AND NEW.firma_id <> '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid THEN
    RAISE EXCEPTION 'Yalnız Cogniti firması beş banner kullanabilir.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fonksiyon$;

-- Mevcut kimlik fonksiyonunun yalnız marka metnini değiştirir.
DO $mesajlar$
DECLARE
  v_tanim text;
BEGIN
  v_tanim := pg_get_functiondef(to_regprocedure('public.hapbilgi_kimlik_telefon_ayir_trg()'));
  IF v_tanim IS NULL OR (
    position($eski$HapBilgi''de$eski$ IN v_tanim) = 0
    AND position($yeni$Cogniti''de$yeni$ IN v_tanim) = 0
  ) THEN
    RAISE EXCEPTION 'Ön kontrolde doğrulanan kimlik mesajları bulunamadı. İşlem durduruldu.';
  END IF;
  EXECUTE replace(v_tanim, $eski$HapBilgi''de$eski$, $yeni$Cogniti''de$yeni$);
END;
$mesajlar$;

UPDATE public.firmalar
SET firma_adi = 'Cogniti'
WHERE firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid;

COMMIT;

SELECT f.firma_id, f.firma_adi, f.logo_url, f.aktif, f.eclub_aktif, f.eczanem_aktif,
       (SELECT count(*) FROM public.eclub_firma_bannerlari b WHERE b.firma_id = f.firma_id) AS eclub_banner_adedi,
       (SELECT count(*) FROM public.eczanem_sayfa_bannerlari b WHERE b.firma_id = f.firma_id) AS eczanem_banner_adedi,
       position('15853eba-a94c-4528-9a07-0ee0b8677a02' IN pg_get_functiondef('public.eclub_banner_sira_kontrolu()'::regprocedure)) > 0 AS banner_kimlige_bagli,
       position($marka$HapBilgi''de$marka$ IN pg_get_functiondef('public.hapbilgi_kimlik_telefon_ayir_trg()'::regprocedure)) = 0 AS eski_marka_mesajlari_kaldirildi
FROM public.firmalar f
WHERE f.firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid;
