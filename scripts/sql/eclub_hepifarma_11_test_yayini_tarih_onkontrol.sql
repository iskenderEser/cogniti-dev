-- 24 sıfırlanmış izlemenin bağlı olduğu 11 yayının tarihini bugüne almadan
-- önce aynı yayınlarda hedef dışı izleme veya üye puanı var mı? Salt okunur.
WITH hedef_izlemeler AS (
  SELECT b.izleme_id, (b.veri->>'yayin_id')::uuid AS yayin_id
  FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
), hedef_yayinlar AS (
  SELECT DISTINCT yayin_id FROM hedef_izlemeler
)
SELECT h.yayin_id, y.durum,
       y.yayin_tarihi AT TIME ZONE 'Europe/Istanbul' AS yayin_tarihi_tr,
       count(i.izleme_id) AS tum_izlemeler,
       count(i.izleme_id) FILTER (WHERE hi.izleme_id IS NOT NULL) AS sifirlanan_24_icindeki,
       count(i.izleme_id) FILTER (WHERE hi.izleme_id IS NULL) AS hedef_disi_izleme,
       count(i.izleme_id) FILTER (WHERE hi.izleme_id IS NULL AND i.tamamlandi_mi IS TRUE)
         AS hedef_disi_tamamlanan,
       coalesce(p.puan_kaydi, 0) AS uye_puan_kaydi,
       coalesce(p.toplam_puan, 0) AS uye_toplam_puan,
       array_remove(array_agg(DISTINCT i.izleme_id) FILTER (WHERE hi.izleme_id IS NULL), NULL)
         AS hedef_disi_izleme_idleri
FROM hedef_yayinlar h
JOIN public.yayin_yonetimi y USING (yayin_id)
LEFT JOIN public.eclub_izleme_kayitlari i USING (yayin_id)
LEFT JOIN hedef_izlemeler hi ON hi.izleme_id = i.izleme_id
LEFT JOIN LATERAL (
  SELECT count(*) AS puan_kaydi, coalesce(sum(k.puan), 0) AS toplam_puan
  FROM public.eclub_kazanilan_puanlar k
  WHERE k.yayin_id = h.yayin_id
) p ON true
GROUP BY h.yayin_id, y.durum, y.yayin_tarihi, p.puan_kaydi, p.toplam_puan
ORDER BY h.yayin_id;
