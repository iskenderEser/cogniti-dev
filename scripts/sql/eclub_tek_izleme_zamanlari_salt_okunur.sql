-- Salt okunur: Önceki incelemedeki Jale Gel / Forma XL video izlemesinin zamanları.
-- Veritabanında henüz çalıştırılmadı. Kayıt eklemez, değiştirmez veya silmez.

SELECT
  i.izleme_id,
  i.yayin_id,
  i.kisi_id,
  i.arac_turu,
  i.tamamlandi_mi,
  i.created_at AT TIME ZONE 'Europe/Istanbul' AS kayit_olusturma_tr,
  i.izleme_baslangic AT TIME ZONE 'Europe/Istanbul' AS izleme_baslangic_tr,
  i.izleme_bitis AT TIME ZONE 'Europe/Istanbul' AS izleme_bitis_tr,
  round(extract(epoch FROM (i.izleme_baslangic - i.created_at))::numeric, 2)
    AS kayit_ile_baslangic_farki_saniye,
  round(extract(epoch FROM (i.izleme_bitis - i.izleme_baslangic))::numeric, 2)
    AS izleme_suresi_saniye,
  i.video_suresi_saniye,
  o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS oneri_baslangic_tr,
  o.oneri_bitis AT TIME ZONE 'Europe/Istanbul' AS oneri_bitis_tr,
  i.soru_hakki_nedeni
FROM public.eclub_izleme_kayitlari AS i
LEFT JOIN public.eclub_oneri_kayitlari AS o ON o.oneri_id = i.oneri_id
WHERE i.izleme_id = '42db8bfb-a1b9-42ce-8c2d-01009fcf88b1'::uuid;
