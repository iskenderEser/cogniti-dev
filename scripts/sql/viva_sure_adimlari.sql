-- KULLANICI ÇALIŞTIRACAK. Canlı veritabanına ajan bağlanmaz.
-- Yeni/değişen Viva süreleri: yalnızca 30, 60 veya 90 dakika.
-- Eski etkinlikler değiştirilmez; yalnız durum/davet güncellemesi eski süreye takılmaz.
BEGIN;
CREATE OR REPLACE FUNCTION public.viva_sure_adimi_dogrula() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE saniye numeric;
BEGIN
 IF TG_OP='UPDATE' AND NEW.baslangic IS NOT DISTINCT FROM OLD.baslangic
  AND NEW.bitis IS NOT DISTINCT FROM OLD.bitis THEN RETURN NEW; END IF;
 saniye:=extract(epoch FROM (NEW.bitis-NEW.baslangic));
 IF saniye IS NULL OR saniye NOT BETWEEN 1800 AND 5400 OR mod(saniye,1800)<>0 THEN
  RAISE EXCEPTION 'Yayın süresi yalnızca 30, 60 veya 90 dakika olabilir.' USING ERRCODE='22023';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.viva_sure_adimi_dogrula() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_viva_sure_adimi ON public.viva_etkinlikler;
CREATE TRIGGER trg_viva_sure_adimi BEFORE INSERT OR UPDATE OF baslangic,bitis ON public.viva_etkinlikler
 FOR EACH ROW EXECUTE FUNCTION public.viva_sure_adimi_dogrula();
COMMIT;
SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_viva_sure_adimi'
 AND tgrelid='public.viva_etkinlikler'::regclass AND tgenabled='O') AS viva_sure_adimlari_kuruldu;
