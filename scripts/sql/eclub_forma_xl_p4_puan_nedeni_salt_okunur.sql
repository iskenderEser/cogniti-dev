-- Yalnız önceki denetimde görülen altı Forma XL / 2026-P4 izlemeyi inceler.
-- Salt okunur: kayıt oluşturmaz, değiştirmez veya silmez.
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
  i.izleme_id,
  concat_ws(' ', k.ad, k.soyad) AS uye,
  i.yayin_id,
  i.oneri_id,
  i.izleme_baslangic AT TIME ZONE 'Europe/Istanbul' AS izleme_baslangic_tr,
  i.izleme_bitis AT TIME ZONE 'Europe/Istanbul' AS tamamlama_tr,
  o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS oneri_baslangic_tr,
  o.oneri_bitis AT TIME ZONE 'Europe/Istanbul' AS oneri_bitis_tr,
  i.izleme_bitis BETWEEN o.oneri_baslangic AND o.oneri_bitis AS tamamlama_oneri_penceresinde,
  i.soru_hakki_nedeni,
  (
    SELECT count(*)::integer
    FROM public.eclub_kazanilan_puanlar p
    WHERE p.kisi_id = i.kisi_id
      AND p.yayin_id = i.yayin_id
      AND p.puan_turu = 'izleme'
      AND p.created_at >= TIMESTAMPTZ '2026-07-01 00:00:00+03'
      AND p.created_at < i.izleme_bitis
  ) AS ayni_donemde_onceki_izleme_puani_adedi,
  (
    SELECT count(*)::integer
    FROM public.eclub_kazanilan_puanlar p
    WHERE p.izleme_id = i.izleme_id
  ) AS bu_izlemedeki_puan_kaydi_adedi
FROM secili_izlemeler s
JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = s.izleme_id
JOIN public.eclub_kisiler k ON k.kisi_id = i.kisi_id
LEFT JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
WHERE i.izleme_bitis >= TIMESTAMPTZ '2026-07-01 00:00:00+03'
  AND i.izleme_bitis < TIMESTAMPTZ '2026-09-01 00:00:00+03'
ORDER BY i.izleme_bitis, i.izleme_id;
