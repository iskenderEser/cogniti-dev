-- Salt okunur ön kontrol: Forma XL 6 + diğer ürünlerde saptanan 18 izleme.
-- Üye puanı veya başka bağlı işlem varsa toplu sıfırlamadan önce görünür kılar.
-- Veritabanında henüz çalıştırılmadı; kayıt değiştirmez.

WITH hedef(beklenen_urun_adi, izleme_id) AS (
  VALUES
    -- Forma XL (6)
    ('Forma XL', '42db8bfb-a1b9-42ce-8c2d-01009fcf88b1'::uuid),
    ('Forma XL', 'ffc66dc4-e764-4aae-881c-ff83e20511d4'),
    ('Forma XL', '01a5e366-e432-472f-84fe-635b23e8d804'),
    ('Forma XL', '5fa0c3de-c2e3-438b-9be2-eb576d370d5b'),
    ('Forma XL', '2ee8d4e9-97f0-4472-b332-9bb6c5cbbdfe'),
    ('Forma XL', 'e4debdd8-ef06-46f5-ae5b-11cbdcfb9f9c'),
    -- Abilon (1)
    ('Abilon', 'd2114a49-7e1e-4047-b66e-4dd67f277d92'),
    -- Laropen (4)
    ('Laropen', 'f1a90f9a-ee4d-4541-9ae3-d033545f7a92'),
    ('Laropen', '889aecb1-ecfd-448a-81b1-dc03397eef5d'),
    ('Laropen', 'a6cf2316-2a32-46d1-8c07-e13a6f1e4fd7'),
    ('Laropen', 'eea7617c-faf0-4add-ae66-010d84fee9b7'),
    -- Normavas (9)
    ('Normavas', '6722f7af-5de9-48e6-82cf-5fae53ebbe6b'),
    ('Normavas', 'ea78955b-684b-477f-86df-024e3b11dcf0'),
    ('Normavas', '08974a6f-2c78-40a0-a1f5-495853dd4a33'),
    ('Normavas', '2fc56652-b919-462e-866d-56d762074648'),
    ('Normavas', '5b1b4044-7579-4ebd-b6ec-d25502850901'),
    ('Normavas', 'eb2a8354-90c0-4f41-b5af-27c242337903'),
    ('Normavas', 'a50d38e6-3998-4e8d-86ff-1f3d20daaea3'),
    ('Normavas', '471407f6-ef99-48c0-9d11-c3778adc4425'),
    ('Normavas', '5bc16d92-99cb-492f-9fc2-20dff155d24d'),
    -- Semeril (4)
    ('Semeril', '78399de7-1819-422c-8b99-b71e17444349'),
    ('Semeril', '1b0ea139-0d52-4dc3-b355-f7f7cc0fee04'),
    ('Semeril', '281b772f-6e99-4fdf-a067-2c57b797a304'),
    ('Semeril', '08c17478-aeab-43a1-bc02-9a8c15749836')
)
SELECT
  h.izleme_id,
  u.urun_adi,
  i.yayin_id,
  concat_ws(' ', k.ad, k.soyad) AS uye,
  i.tamamlandi_mi,
  i.izleme_baslangic AT TIME ZONE 'Europe/Istanbul' AS izleme_baslangic_tr,
  i.izleme_bitis AT TIME ZONE 'Europe/Istanbul' AS izleme_bitis_tr,
  o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS oneri_baslangic_tr,
  o.oneri_bitis AT TIME ZONE 'Europe/Istanbul' AS oneri_bitis_tr,
  i.soru_hakki_nedeni,
  u.urun_adi = h.beklenen_urun_adi AS beklenen_urun_eslesiyor,
  y.firma_id = '0c504d88-b9fb-40bb-beae-5bae33cb99ac'::uuid AS hepifarma_yayini,
  coalesce(p.izleme_puani, 0) AS uye_izleme_puani,
  coalesce(p.cevaplama_puani, 0) AS uye_cevaplama_puani,
  coalesce(p.diger_puan, 0) AS uye_diger_puani,
  coalesce(p.cekli_puan, 0) AS cek_karsiligi_olan_puan,
  coalesce(utt.utt_puani, 0) AS utt_puani,
  coalesce(dc.dogru_cevap_puani, 0) AS dogru_cevap_kaydi_puani,
  coalesce(ys.ileri_sarma_kaybi, 0) AS ileri_sarma_kaybi
FROM hedef h
LEFT JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
LEFT JOIN public.eclub_kisiler k ON k.kisi_id = i.kisi_id
LEFT JOIN public.v_yayin_kunye y ON y.yayin_id = i.yayin_id
LEFT JOIN public.urunler u ON u.urun_id = y.urun_id
LEFT JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
LEFT JOIN LATERAL (
  SELECT
    coalesce(sum(x.puan) FILTER (WHERE x.puan_turu = 'izleme'), 0)::integer AS izleme_puani,
    coalesce(sum(x.puan) FILTER (WHERE x.puan_turu = 'cevaplama'), 0)::integer AS cevaplama_puani,
    coalesce(sum(x.puan) FILTER (WHERE x.puan_turu NOT IN ('izleme', 'cevaplama')), 0)::integer AS diger_puan,
    coalesce(sum(x.puan) FILTER (WHERE x.cek_karsiligi_var_mi IS TRUE), 0)::integer AS cekli_puan
  FROM public.eclub_kazanilan_puanlar x
  WHERE x.izleme_id = h.izleme_id
) p ON true
LEFT JOIN LATERAL (
  SELECT coalesce(sum(x.puan), 0)::integer AS utt_puani
  FROM public.eclub_utt_puanlari x WHERE x.izleme_id = h.izleme_id
) utt ON true
LEFT JOIN LATERAL (
  SELECT coalesce(sum(x.kazanilan_puan), 0)::integer AS dogru_cevap_puani
  FROM public.eclub_dogru_cevap_kayitlari x WHERE x.izleme_id = h.izleme_id
) dc ON true
LEFT JOIN LATERAL (
  SELECT coalesce(sum(x.kaybedilen_puan), 0)::integer AS ileri_sarma_kaybi
  FROM public.eclub_ileri_sarma_kayitlari x WHERE x.izleme_id = h.izleme_id
) ys ON true
ORDER BY u.urun_adi, h.izleme_id;
