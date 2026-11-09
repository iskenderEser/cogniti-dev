-- KULLANICI ÇALIŞTIRACAK. Yalnız yanlış UTT hesap seçimi bağlantısını geri alır.
-- Yayın açılışı, PM/Medikal Eczanem, sipariş/yükleme ve işlem geçmişi korunur.
-- Mevcut yeni API bu RPCyi çağırdığı için bu yol, doğru üretici hesabı bağlantısı kurulana kadar kapanır.
-- Başka hesaba otomatik geçiş veya geçmiş tüketimlerin silinmesi/iadesi yapılmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-eclub-utt-hesap-secimi-geri-al',0));
-- Devam eden öneri yazımları tamamlandıktan sonra tanımı atomik olarak değiştir.
LOCK TABLE public.eclub_oneri_kayitlari IN SHARE ROW EXCLUSIVE MODE;
DROP FUNCTION IF EXISTS public.cogniti_esnek_eclub_gonder(uuid,text,uuid[],uuid[],uuid);
-- Hesap bağlamından UTT seçimine göre Esnek tüketen yeni dal kaldırılır.
-- Önceden var olan eski öneri/plan tüketim tetikleyicisi kendi tanımıyla korunur.
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
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_esnek_eclub_gonder(uuid,text,uuid[],uuid[],uuid)') IS NULL
 AS eclub_utt_hesap_secimi_kaldirildi;
