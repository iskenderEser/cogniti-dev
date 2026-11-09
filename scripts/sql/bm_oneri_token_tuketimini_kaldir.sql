-- KULLANICI ÇALIŞTIRACAK. BM önerisi token tüketmez.
-- Öneri kayıtları, yetki/tarih/kota kontrolleri ve geçmiş tüketimler korunur.
-- Yayın açılışı, E-Club dağıtımı ve Eczanem tetikleyicileri değiştirilmez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('bm-oneri-token-tuketimini-kaldir',0));
LOCK TABLE public.oneri_kayitlari IN SHARE ROW EXCLUSIVE MODE;
DROP TRIGGER IF EXISTS trg_cogniti_token_tclub_oneri ON public.oneri_kayitlari;
DROP FUNCTION IF EXISTS public.cogniti_token_tclub_oneri_kaydet();
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT NOT EXISTS(SELECT 1 FROM pg_trigger
 WHERE tgrelid='public.oneri_kayitlari'::regclass AND tgname='trg_cogniti_token_tclub_oneri' AND NOT tgisinternal)
 AND to_regprocedure('public.cogniti_token_tclub_oneri_kaydet()') IS NULL
 AS bm_oneri_token_tuketimi_kaldirildi;
