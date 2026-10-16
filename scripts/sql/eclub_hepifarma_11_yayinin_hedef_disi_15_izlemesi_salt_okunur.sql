-- Sıfırlanan 24 izlemenin bağlı olduğu 11 yayındaki diğer izlemeler.
-- Sadece bu 11 yayının tarihini bugün yapmanın etkisini anlamak içindir.
-- Salt okunur; kayıt değiştirmez.
WITH sifirlanan AS (
  SELECT b.izleme_id, (b.veri->>'yayin_id')::uuid AS yayin_id
  FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
), hedef_disi AS (
  SELECT i.*
  FROM public.eclub_izleme_kayitlari i
  WHERE i.yayin_id IN (SELECT DISTINCT yayin_id FROM sifirlanan)
    AND NOT EXISTS (
      SELECT 1 FROM sifirlanan s WHERE s.izleme_id = i.izleme_id
    )
)
SELECT i.izleme_id, i.yayin_id, u.urun_adi,
       concat_ws(' ', k.ad, k.soyad) AS uye,
       e.eczane_idleri,
       i.arac_turu, i.tamamlandi_mi,
       i.izleme_baslangic AT TIME ZONE 'Europe/Istanbul' AS izleme_baslangic_tr,
       i.izleme_bitis AT TIME ZONE 'Europe/Istanbul' AS izleme_bitis_tr,
       o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS oneri_baslangic_tr,
       o.oneri_bitis AT TIME ZONE 'Europe/Istanbul' AS oneri_bitis_tr,
       i.soru_hakki_nedeni,
       coalesce(p.izleme_puani, 0) AS uye_izleme_puani,
       coalesce(p.cevaplama_puani, 0) AS uye_cevaplama_puani,
       coalesce(p.diger_puan, 0) AS uye_diger_puani,
       coalesce(t.utt_puani, 0) AS utt_puani,
       coalesce(d.dogru_cevap_puani, 0) AS dogru_cevap_kaydi_puani,
       coalesce(s.ileri_sarma_kaybi, 0) AS ileri_sarma_kaybi
FROM hedef_disi i
LEFT JOIN public.eclub_kisiler k ON k.kisi_id = i.kisi_id
LEFT JOIN public.v_yayin_kunye y ON y.yayin_id = i.yayin_id
LEFT JOIN public.urunler u ON u.urun_id = y.urun_id
LEFT JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
LEFT JOIN LATERAL (
  SELECT array_agg(DISTINCT b.eczane_id) AS eczane_idleri
  FROM public.eclub_kisi_eczane b WHERE b.kisi_id = i.kisi_id
) e ON true
LEFT JOIN LATERAL (
  SELECT coalesce(sum(x.puan) FILTER (WHERE x.puan_turu = 'izleme'), 0)::integer AS izleme_puani,
         coalesce(sum(x.puan) FILTER (WHERE x.puan_turu = 'cevaplama'), 0)::integer AS cevaplama_puani,
         coalesce(sum(x.puan) FILTER (WHERE x.puan_turu NOT IN ('izleme', 'cevaplama')), 0)::integer AS diger_puan
  FROM public.eclub_kazanilan_puanlar x WHERE x.izleme_id = i.izleme_id
) p ON true
LEFT JOIN LATERAL (
  SELECT coalesce(sum(x.puan), 0)::integer AS utt_puani
  FROM public.eclub_utt_puanlari x WHERE x.izleme_id = i.izleme_id
) t ON true
LEFT JOIN LATERAL (
  SELECT coalesce(sum(x.kazanilan_puan), 0)::integer AS dogru_cevap_puani
  FROM public.eclub_dogru_cevap_kayitlari x WHERE x.izleme_id = i.izleme_id
) d ON true
LEFT JOIN LATERAL (
  SELECT coalesce(sum(x.kaybedilen_puan), 0)::integer AS ileri_sarma_kaybi
  FROM public.eclub_ileri_sarma_kayitlari x WHERE x.izleme_id = i.izleme_id
) s ON true
ORDER BY u.urun_adi, i.yayin_id, i.izleme_id;
