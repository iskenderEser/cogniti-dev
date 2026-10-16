-- Salt okunur: önceki denetimdeki altı Forma XL video izlemesinin
-- bağlı olduğu yayınların üreticisi ve veritabanındaki yayın tarihi.
-- Canlı veritabanında henüz çalıştırılmadı; kayıt değiştirmez.

WITH secili_izlemeler(izleme_id) AS (
  VALUES
    ('42db8bfb-a1b9-42ce-8c2d-01009fcf88b1'::uuid),
    ('ffc66dc4-e764-4aae-881c-ff83e20511d4'::uuid),
    ('01a5e366-e432-472f-84fe-635b23e8d804'::uuid),
    ('5fa0c3de-c2e3-438b-9be2-eb576d370d5b'::uuid),
    ('2ee8d4e9-97f0-4472-b332-9bb6c5cbbdfe'::uuid),
    ('e4debdd8-ef06-46f5-ae5b-11cbdcfb9f9c'::uuid)
)
SELECT
  s.izleme_id,
  i.yayin_id,
  y.uretici_id,
  concat_ws(' ', k.ad, k.soyad) AS uretici_adi,
  k.rol AS uretici_rolu,
  f.firma_adi AS uretici_firmasi,
  y.durum AS yayin_durumu,
  y.created_at AT TIME ZONE 'Europe/Istanbul' AS yayin_kaydi_olusturma_tr,
  y.yayin_tarihi AT TIME ZONE 'Europe/Istanbul' AS kayitli_yayina_acilis_tr,
  i.izleme_baslangic AT TIME ZONE 'Europe/Istanbul' AS izleme_baslangic_tr,
  i.izleme_bitis AT TIME ZONE 'Europe/Istanbul' AS izleme_bitis_tr
FROM secili_izlemeler AS s
LEFT JOIN public.eclub_izleme_kayitlari AS i ON i.izleme_id = s.izleme_id
LEFT JOIN public.yayin_yonetimi AS y ON y.yayin_id = i.yayin_id
LEFT JOIN public.kullanicilar AS k ON k.kullanici_id = y.uretici_id
LEFT JOIN public.firmalar AS f ON f.firma_id = k.firma_id
ORDER BY s.izleme_id;
