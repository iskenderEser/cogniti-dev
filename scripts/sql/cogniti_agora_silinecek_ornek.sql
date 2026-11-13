-- SİLİNECEK TEST KAYDI. Hepifarma / Merve Duran ve mevcut Agora test partneri.
-- Örnek yayın taslak kalır. Token tüketimi, ödeme veya yayın oluşturulmaz.
BEGIN;

DO $test$
DECLARE
  firma constant uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
  alici constant uuid := 'b0838fab-302c-49b3-af44-9bad88945a0f';
  siparis constant uuid := 'a60a2026-1110-4000-8000-000000000001';
  egitim constant uuid := 'a60a2026-1110-4000-8000-000000000002';
  baslik constant text := 'SİLİNECEK TEST KAYDI · Agora Örnek Yayını';
  bedel constant numeric := 1000.00;
  partner uuid;
  egitim_kodu text;
  kko_fiyati numeric;
  mevcut public.agora_siparisleri%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(siparis::text, 0));
  IF NOT EXISTS (SELECT 1 FROM public.firmalar WHERE firma_id=firma AND firma_adi='Hepifarma')
     OR NOT EXISTS (SELECT 1 FROM public.kullanicilar
                    WHERE kullanici_id=alici AND firma_id=firma AND ad='Merve' AND soyad='Duran') THEN
    RAISE EXCEPTION 'Hepifarma ve Merve Duran doğrulanamadı. Örnek alım oluşturulmadı.';
  END IF;

  SELECT p.partner_id INTO partner
  FROM public.agora_is_partnerleri p
  JOIN public.agora_partner_profilleri f USING (partner_id)
  WHERE p.eposta IN ('agora-test-20261104@example.invalid','ali@testpartner.com')
  ORDER BY (p.eposta='agora-test-20261104@example.invalid') DESC
  LIMIT 1;
  IF partner IS NULL THEN
    RAISE EXCEPTION 'Agora test partneri bulunamadı. Örnek alım oluşturulmadı.';
  END IF;

  SELECT * INTO mevcut FROM public.agora_siparisleri WHERE siparis_id=siparis;
  IF FOUND THEN
    IF mevcut.firma_id IS DISTINCT FROM firma OR mevcut.alici_id IS DISTINCT FROM alici
       OR mevcut.egitim_id IS DISTINCT FROM egitim OR mevcut.egitim_adi IS DISTINCT FROM baslik
       OR mevcut.tuketim_id IS NOT NULL OR mevcut.paket->>'test_kaydi' IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Örnek sipariş kimliği başka bir kayda ait.';
    END IF;
    RETURN;
  END IF;

  SELECT round((degerler->>'kko_token_tl')::numeric,2) INTO kko_fiyati
  FROM public.cogniti_fiyat_tarifesi WHERE tekil;
  IF kko_fiyati IS NULL OR kko_fiyati<=0 OR kko_fiyati::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'KKÖ birim fiyatı doğrulanamadı. Örnek alım oluşturulmadı.';
  END IF;

  INSERT INTO public.agora_partner_egitimleri (
    egitim_id,partner_id,egitim_adi,fiyat_tl,durum,olusturma_istegi
  ) VALUES (egitim,partner,baslik,bedel,'taslak',egitim)
  RETURNING partner_egitim_id INTO egitim_kodu;

  INSERT INTO public.agora_siparisleri (
    siparis_id,firma_id,alici_id,egitim_id,partner_id,partner_egitim_id,egitim_adi,egitim_surumu,
    satin_alma_bedeli,kko_birim_fiyati,token_tutari,borca_yazilan_token,hizmet_bedeli,odenecek_tutar,
    tuketim_id,paket,siparis_tarihi
  ) VALUES (
    siparis,firma,alici,egitim,partner,egitim_kodu,baslik,1,
    bedel,kko_fiyati,0,0,round(bedel*0.15,2),bedel-round(bedel*0.15,2),
    NULL,'{"test_kaydi":true}'::jsonb,statement_timestamp()
  );
END;
$test$;

COMMIT;
SELECT true AS cogniti_agora_silinecek_ornek_olusturuldu;
