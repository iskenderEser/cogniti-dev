-- Yalnız mevcut Agora Test Partneri hesabı için kullanıcı talebi.
-- E-posta: ali@testpartner.com / Test şifresi: 123456 (salt+scrypt özeti).
-- Tamamını tek parça çalıştırın. Yeni hesap veya onay oluşturmaz; e-posta göndermez.
BEGIN;
DO $test$
DECLARE
  v public.agora_is_partnerleri%ROWTYPE;
  v_ozet constant text := 'scrypt$32768$8$1$7f879ab7eed831ffc5473659c957a836$0eb3a354a2a254524ab1c881ea538c740a4d891360d3e73241a4a0f820a370fa5b60af517131b54643bbe30705e10a5d1a1ec48f95492eea5179521eb133e591';
BEGIN
  SELECT * INTO STRICT v FROM public.agora_is_partnerleri
    WHERE eposta IN ('agora-test-20261104@example.invalid','ali@testpartner.com')
    FOR UPDATE;
  IF v.ad_soyad <> 'Agora Test Partneri' OR v.cep_telefonu <> '5000000042'
     OR v.ilk_giris_durumu <> 'onaylandi' THEN
    RAISE EXCEPTION 'Beklenen onaylı test partneri bulunamadı; işlem iptal edildi';
  END IF;
  -- Tekrar çalıştırıldığında aynı hesap yeniden değiştirilmez.
  IF v.eposta='ali@testpartner.com' AND v.sifre_ozeti=v_ozet THEN RETURN; END IF;
  UPDATE public.agora_is_partnerleri
    SET eposta='ali@testpartner.com', sifre_ozeti=v_ozet,
        giris_surum=giris_surum+1, giris_deneme=0, giris_pencere_at=NULL
    WHERE partner_id=v.partner_id;
  -- Eski bilgilerle açılmış oturumlar yeni girişte kullanılamaz.
  DELETE FROM public.agora_partner_oturumlari WHERE partner_id=v.partner_id;
END;
$test$;
SELECT EXISTS (
  SELECT 1 FROM public.agora_is_partnerleri
  WHERE eposta='ali@testpartner.com' AND ad_soyad='Agora Test Partneri'
    AND cep_telefonu='5000000042' AND ilk_giris_durumu='onaylandi'
    AND sifre_ozeti='scrypt$32768$8$1$7f879ab7eed831ffc5473659c957a836$0eb3a354a2a254524ab1c881ea538c740a4d891360d3e73241a4a0f820a370fa5b60af517131b54643bbe30705e10a5d1a1ec48f95492eea5179521eb133e591'
) AS agora_partner_test_hesabi_guncellendi;
COMMIT;
