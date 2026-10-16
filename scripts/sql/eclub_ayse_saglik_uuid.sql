SELECT kisi_id, ad, soyad
FROM public.eclub_kisiler
WHERE btrim(ad) ILIKE 'Ayşe'
  AND btrim(soyad) ILIKE 'Sağlık';
