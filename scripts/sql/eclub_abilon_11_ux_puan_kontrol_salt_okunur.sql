-- Hediye Çeki Talebi sayfasındaki 11 Abilon UX örneğinin mevcut DB durumunu okur.
-- Yalnız Adil Güçlü / Test Eczanesi 003 / Abilon; hiçbir kayıt değiştirmez.
WITH beklenen(sira, model, puan) AS (
  VALUES
    (1, 'siparissiz_cek', 400),
    (2, 'siparissiz_cek', 625),
    (3, 'siparissiz_cek', 925),
    (4, 'serbest_siparis', 400),
    (5, 'serbest_siparis', 625),
    (6, 'serbest_siparis', 925),
    (7, 'satis_sartli', 400),
    (8, 'satis_sartli', 625),
    (9, 'satis_sartli', 925),
    (10, 'siparissiz_cek', 299),
    (11, 'serbest_siparis', 1200)
), mevcut AS (
  SELECT t.senaryo_id, t.sira, t.etiket, t.veri
  FROM public.eclub_cek_karti_ux_testleri t
  WHERE t.kisi_id = '3b0b6c01-428e-4797-a8ad-67d5d2400b5f'::uuid
    AND t.eczane_id = '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
    AND t.urun_id = '90c0ca99-8d17-40d9-97d7-5b209bd730b0'::uuid
), sayim AS (
  SELECT count(*) AS mevcut_kart_sayisi FROM mevcut
)
SELECT b.sira, m.senaryo_id, m.etiket, b.model AS beklenen_model,
       m.veri->>'satis_sarti_tipi' AS kayitli_model,
       b.puan AS beklenen_puan,
       m.veri->>'toplanan_puan' AS kayitli_puan,
       s.mevcut_kart_sayisi,
       CASE
         WHEN m.senaryo_id IS NULL THEN 'EKSIK'
         WHEN m.senaryo_id IS DISTINCT FROM
              ('e1400000-0000-4000-8000-' || lpad(b.sira::text, 12, '0'))::uuid
           OR m.veri->>'satis_sarti_tipi' IS DISTINCT FROM b.model
           OR m.veri->>'toplanan_puan' IS DISTINCT FROM b.puan::text
           OR m.veri->>'urun_adi' IS DISTINCT FROM 'Abilon'
         THEN 'UYUSMUYOR'
         WHEN s.mevcut_kart_sayisi <> 11 THEN 'FAZLA_KAYIT_VAR'
         ELSE 'DOGRU'
       END AS durum
FROM beklenen b
LEFT JOIN mevcut m ON m.sira = b.sira
CROSS JOIN sayim s
ORDER BY b.sira;
