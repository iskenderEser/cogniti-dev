-- BM → UTT önerisi: yeni gerçek gönderim başına 1 token.
-- Eski önerileri taramaz. Önerinin başlangıç tarihi gönderim zamanı değildir;
-- kullanıcıya gönderim kaydı oluşturulduğunda tüketilir.
-- Toplu istekte API'nin bütün önerileri tek INSERT ile kaydetmesi gerekir.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-tclub-v1',0));
DO $$
BEGIN
 IF to_regprocedure('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)') IS NULL
 OR to_regclass('public.oneri_kayitlari') IS NULL THEN
  RAISE EXCEPTION 'Token tüketim işlevi ve öneri tablosu kurulmalıdır.';
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.cogniti_token_tclub_oneri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id=NEW.oneren_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:gonderici_firma_yok' USING ERRCODE='P0001';
 END IF;
 BEGIN
  PERFORM public.cogniti_token_tuket(v_firma,'firma_kullanicisi',NEW.oneren_id,
   'firma_kullanicisi',NEW.kullanici_id::text,'tclub_oneri',NEW.yayin_id,'tclub-oneri:'||NEW.oneri_id::text);
 EXCEPTION WHEN SQLSTATE '22023' THEN
  IF SQLERRM='Yetersiz token bakiyesi.' THEN
   RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
  ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
   RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001';
  ELSE RAISE;
  END IF;
 END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_tclub_oneri_kaydet() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_token_tclub_oneri ON public.oneri_kayitlari;
CREATE TRIGGER trg_cogniti_token_tclub_oneri AFTER INSERT ON public.oneri_kayitlari
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_tclub_oneri_kaydet();
COMMIT;
SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.oneri_kayitlari'::regclass
 AND tgname='trg_cogniti_token_tclub_oneri' AND tgenabled='O' AND NOT tgisinternal) AS tclub_token_baglantisi_kuruldu;
