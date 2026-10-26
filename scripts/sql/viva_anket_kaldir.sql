-- Viva'nın eski özel soru/anket kayıtlarını ve işlevlerini kaldırır.
-- Bu işlem mevcut Viva anket sorularını ve cevaplarını kalıcı olarak siler.
BEGIN;
DROP TRIGGER IF EXISTS viva_anket_yayin_kapanis ON public.viva_etkinlikler;
DROP FUNCTION IF EXISTS public.viva_anket_yayin_kapandi();
DROP FUNCTION IF EXISTS public.viva_anket_islem(uuid, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.viva_anket_ozet(uuid, uuid, boolean);
DROP TABLE IF EXISTS public.viva_anket_cevaplari;
DROP TABLE IF EXISTS public.viva_anket_oturumlari;
DROP TABLE IF EXISTS public.viva_anket_sorulari;
COMMIT;
