-- Salt okunur kontrol: DB'de kurulu yayın aktivasyon fonksiyonunun tanımı.
-- Fonksiyonu ÇALIŞTIRMAZ; yayın veya bildirim kaydı oluşturmaz/değiştirmez.
-- Sonuçtaki bildirim alıcısı rol koşulu incelenerek utt/kd_utt ayrımı doğrulanır.

SELECT
  CASE
    WHEN fonksiyon_oid IS NULL THEN 'FONKSIYON_BULUNAMADI'
    ELSE 'FONKSIYON_BULUNDU'
  END AS durum,
  pg_get_functiondef(fonksiyon_oid) AS fonksiyon_tanimi
FROM (
  SELECT to_regprocedure('public.yayin_planlananlari_aktive(uuid)') AS fonksiyon_oid
) AS kontrol;
