SELECT
  o.oneri_id,
  o.yayin_id,
  y.urun_adi,
  o.izlendi_mi AS oneri_tamamlandi_mi,
  i.tamamlandi_mi AS izleme_tamamlandi_mi,
  o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS yayin_baslangic_tr,
  o.oneri_bitis AT TIME ZONE 'Europe/Istanbul' AS yayin_bitis_tr,
  i.ilk_izleme AT TIME ZONE 'Europe/Istanbul' AS ilk_izleme_tr,
  i.ilk_tamamlama AT TIME ZONE 'Europe/Istanbul' AS ilk_tamamlama_tr
FROM public.eclub_oneri_kayitlari AS o
LEFT JOIN public.v_yayin_detay AS y ON y.yayin_id = o.yayin_id
LEFT JOIN LATERAL (
  SELECT
    bool_or(ik.tamamlandi_mi) AS tamamlandi_mi,
    min(ik.izleme_baslangic) AS ilk_izleme,
    min(ik.izleme_bitis) FILTER (WHERE ik.tamamlandi_mi IS TRUE) AS ilk_tamamlama
  FROM public.eclub_izleme_kayitlari AS ik
  WHERE ik.oneri_id = o.oneri_id
    AND ik.kisi_id = o.kisi_id
) AS i ON true
WHERE o.kisi_id = 'fe0daec0-27b5-4a16-90ab-81627aa9fcfb'::uuid
ORDER BY o.oneri_baslangic DESC, o.oneri_id;
