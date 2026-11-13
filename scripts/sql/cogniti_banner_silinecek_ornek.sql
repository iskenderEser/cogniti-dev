-- SİLİNECEK TEST KAYDI: Hepifarma, Ekim 2026, bir haftalık örnek banner alımı.
-- Test kaydı işlem anahtarında işaretlidir. Banner yayınlanmaz, token bakiyesi değiştirilmez.
BEGIN;

DO $test$
DECLARE
  firma constant uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
  kullanici constant uuid := 'b0838fab-302c-49b3-af44-9bad88945a0f';
  rezervasyon constant uuid := 'b0a12026-1012-4000-8000-000000000001';
  tuketim constant uuid := 'b0a12026-1012-4000-8000-000000000002';
  anahtar constant text := 'cogniti-test:banner:silinecek:hepifarma:2026-10';
  islem_tarihi constant timestamptz := '2026-10-12 09:00:00+03';
  fiyat jsonb;
  token_adedi bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.firmalar WHERE firma_id = firma AND firma_adi = 'Hepifarma')
     OR NOT EXISTS (
       SELECT 1 FROM public.kullanicilar
       WHERE kullanici_id = kullanici AND firma_id = firma AND ad = 'Merve' AND soyad = 'Duran'
     ) THEN
    RAISE EXCEPTION 'Hepifarma ve Merve Duran doğrulanamadı. Örnek kayıt eklenmedi.';
  END IF;

  fiyat := public.cogniti_hizmet_bedeli_hesapla('banner', 1);
  token_adedi := (fiyat->>'token')::bigint;

  INSERT INTO public.firma_banner_rezervasyonlari (
    rezervasyon_id, firma_id, alan, sira, baslangic, hafta_sayisi, durum,
    olusturan_id, ucret_islendi, created_at, haftalik_token, toplam_token, tarife_surumu
  ) VALUES (
    rezervasyon, firma, 'firma', 1, DATE '2026-10-12', 1, 'tamamlandi',
    kullanici, true, islem_tarihi, token_adedi, token_adedi, (fiyat->>'surum')::integer
  );

  INSERT INTO public.cogniti_token_tuketimleri (
    tuketim_id, firma_id, gonderen_turu, gonderen_id, alici_turu, alici_kimligi,
    islem_turu, kaynak_id, islem_anahtari, miktar, asim_miktari, created_at
  ) VALUES (
    tuketim, firma, 'firma_kullanicisi', kullanici, 'firma_kullanicisi', firma::text,
    'banner_yayin', rezervasyon, anahtar, token_adedi, 0, islem_tarihi
  );
END;
$test$;

COMMIT;
SELECT true AS cogniti_banner_silinecek_ornek_olusturuldu;
