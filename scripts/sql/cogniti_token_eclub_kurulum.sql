-- E-Club: gerçek öneri kaydı başına gönderenin firmasından 1 token.
-- Plan veya önizleme kaydı tüketim oluşturmaz. Eski gönderilerden geriye dönük düşülmez.
-- Token hesabı bulunmayan firma veya yetersiz KKÖ bakiyesi gönderimi durdurur.
-- İşleyici bu hataları mevcut ECLUB_GONDERIM sözleşmesiyle kaydeder.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-eclub-v1',0));
DO $$
BEGIN
 IF to_regprocedure('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)') IS NULL
 OR to_regclass('public.eclub_oneri_kayitlari') IS NULL THEN
  RAISE EXCEPTION 'Token tüketim işlevi ve E-Club öneri tablosu kurulmalıdır.';
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_eclub_oneri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id=NEW.oneren_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'ECLUB_GONDERIM:token_gonderici_firma_yok' USING ERRCODE='P0001';
 END IF;
 -- Hesap bulunmaması muafiyet değildir. Tüketim başarısızsa öneri INSERT'i de geri alınır.
 BEGIN
  PERFORM public.cogniti_token_tuket(v_firma,'firma_kullanicisi',NEW.oneren_id,
   'eclub_kisi',NEW.kisi_id::text,'eclub_oneri',NEW.yayin_id,'eclub-oneri:'||NEW.oneri_id::text);
 EXCEPTION WHEN SQLSTATE '22023' THEN
  IF SQLERRM='Yetersiz token bakiyesi.' THEN
   RAISE EXCEPTION 'ECLUB_GONDERIM:token_bakiyesi_yetersiz' USING ERRCODE='P0001';
  ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
   RAISE EXCEPTION 'ECLUB_GONDERIM:token_hesabi_yok' USING ERRCODE='P0001';
  ELSE RAISE;
  END IF;
 END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_eclub_oneri_kaydet() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_token_eclub_oneri ON public.eclub_oneri_kayitlari;
CREATE TRIGGER trg_cogniti_token_eclub_oneri AFTER INSERT ON public.eclub_oneri_kayitlari
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_eclub_oneri_kaydet();
COMMIT;
SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.eclub_oneri_kayitlari'::regclass
 AND tgname='trg_cogniti_token_eclub_oneri' AND tgenabled='O' AND NOT tgisinternal) AS eclub_token_baglantisi_kuruldu;
