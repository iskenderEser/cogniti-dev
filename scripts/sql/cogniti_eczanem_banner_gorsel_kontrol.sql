-- E-Club üyesinin Eczanem menüsündeki üç sayfanın kayıtlı bannerları.
-- Yalnız bu üç alanı, firmaları ve herkese açık görsel bağlantılarını listeler.
-- Salt okunur: Supabase SQL Editor'da tamamını çalıştırıp sonucu paylaşın.
SELECT f.firma_adi,
       b.firma_id,
       CASE b.alan
         WHEN 'uyeler' THEN 'Üyeler'
         WHEN 'uye-yayinlari' THEN 'Üye Yayınları'
         WHEN 'indirim-onayi' THEN 'İndirim Onayı'
       END AS sayfa,
       b.sira,
       'https://ssdbgvxergowbzgjtbjp.supabase.co/storage/v1/object/public/store-urun-gorselleri/'
         || b.dosya_yolu AS gorsel_url
FROM public.eczanem_sayfa_bannerlari b
JOIN public.firmalar f ON f.firma_id = b.firma_id
WHERE b.alan IN ('uyeler', 'uye-yayinlari', 'indirim-onayi')
ORDER BY f.firma_adi, b.firma_id, b.alan, b.sira;
