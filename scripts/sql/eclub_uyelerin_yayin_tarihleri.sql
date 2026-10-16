SELECT
  o.kisi_id,
  concat_ws(' ', k.ad, k.soyad) AS uye,
  o.oneri_id,
  o.yayin_id,
  o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul' AS baslangic_tr,
  o.oneri_bitis AT TIME ZONE 'Europe/Istanbul' AS bitis_tr
FROM public.eclub_oneri_kayitlari AS o
JOIN public.eclub_kisiler AS k ON k.kisi_id = o.kisi_id
ORDER BY uye, o.oneri_baslangic DESC, o.yayin_id;
