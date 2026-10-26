-- KULLANICI ÇALIŞTIRACAK. Ajan canlı DB'ye bağlanmaz.
-- Yalnız kaldırılan Viva hatırlatma özelliğinin tablo, fonksiyon ve ayarları.
-- İki hatırlatma tablosundaki tercih/olay verilerini de siler.
-- Güncel uygulama kodu deploy edildikten sonra çalıştırılır.
-- Ortak Viva cron'u, etkinlikler, Daily ve diğer push ayarları korunur.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-hatirlatmalar'));
DROP FUNCTION IF EXISTS public.viva_hatirlatma_islem(uuid,uuid,text,jsonb);
DROP FUNCTION IF EXISTS public.viva_hatirlatma_isi_al();
DROP FUNCTION IF EXISTS public.viva_hatirlatma_push_ayir(uuid,uuid);
DROP FUNCTION IF EXISTS public.viva_hatirlatma_gecerli(uuid,uuid,timestamptz,timestamptz,timestamptz);
DROP TABLE IF EXISTS public.viva_hatirlatma_olaylari;
DROP TABLE IF EXISTS public.viva_hatirlatmalar;
UPDATE public.sistem_ayarlari
SET deger=deger-'viva_hatirlatma_15'-'viva_hatirlatma_baslangic'
WHERE anahtar='push_olay_aktif' AND jsonb_typeof(deger)='object';
COMMIT;
SELECT to_regclass('public.viva_hatirlatmalar') IS NULL
 AND to_regclass('public.viva_hatirlatma_olaylari') IS NULL
 AND to_regprocedure('public.viva_hatirlatma_islem(uuid,uuid,text,jsonb)') IS NULL
 AND to_regprocedure('public.viva_hatirlatma_isi_al()') IS NULL
 AND to_regprocedure('public.viva_hatirlatma_push_ayir(uuid,uuid)') IS NULL
 AND to_regprocedure('public.viva_hatirlatma_gecerli(uuid,uuid,timestamptz,timestamptz,timestamptz)') IS NULL
 AS hatirlatma_kaldirildi;
