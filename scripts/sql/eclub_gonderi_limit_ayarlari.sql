-- E-Club yeni kurgusu: gerçek gönderimden başlayan 15 günlük geçerlilik.
-- Kota ve tekrar kuralları eclub_gonderim_kota_ve_tarih_kontrolu.sql kaynağındadır.

BEGIN;

INSERT INTO public.sistem_ayarlari (anahtar, deger, aciklama) VALUES
  (
    'eclub_oneri_gecerlilik_gun',
    '15'::jsonb,
    'Gerçek gönderimden başlayan 15 günlük puanlı ve sorulu geçerlilik süresi.'
  )
ON CONFLICT (anahtar) DO UPDATE
SET deger = EXCLUDED.deger,
    aciklama = EXCLUDED.aciklama,
    updated_at = now();

DELETE FROM public.sistem_ayarlari
WHERE anahtar IN (
  'eclub_ayni_video_tekrar_bekleme_gun',
  'eclub_aylik_gonderim_limiti',
  'eclub_gonderim_araligi_gun',
  'eclub_alici_pencere_gun',
  'eclub_alici_haftalik_limit'
);

COMMIT;

SELECT anahtar, deger, aciklama
FROM public.sistem_ayarlari
WHERE anahtar = 'eclub_oneri_gecerlilik_gun'
ORDER BY anahtar;
