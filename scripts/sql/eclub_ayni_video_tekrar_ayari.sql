-- Tarihsel dosya adı korunur. Eski video/araç tekrar ayarını yeniden oluşturmaz.
-- Yeni kontrol: eclub_gonderim_kota_ve_tarih_kontrolu.sql ve
-- eclub_gonderim_rpc_yeni_kurgu.sql. Bu dosya artık yalnız durum okur.
SELECT NOT EXISTS (
  SELECT 1 FROM public.sistem_ayarlari
  WHERE anahtar = 'eclub_ayni_video_tekrar_bekleme_gun'
) AS eski_video_tekrar_ayari_yok;
