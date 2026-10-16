-- Salt okunur inceleme: ekranda gösterilen iki eczane / Hepifarma / Forma XL / 2026-P4.
-- Tamamlanma, puan yazımı, doğru cevap, ileri sarma ve çek uygunluğunu aynı izleme bazında gösterir.
-- Kayıt eklemez, değiştirmez veya silmez. Canlı veritabanında henüz çalıştırılmadı.

WITH kapsam AS (
  SELECT DISTINCT
    b.eczane_id, i.izleme_id, i.kisi_id, i.yayin_id, i.arac_turu,
    i.izleme_bitis, i.soru_hakki_nedeni, o.oneri_baslangic, o.oneri_bitis,
    d.ogrenme_araci_puani
  FROM public.eclub_izleme_kayitlari i
  JOIN public.eclub_kisi_eczane b ON b.kisi_id = i.kisi_id
    AND b.eczane_id IN (
      '5387f7bc-732e-4674-8829-d34df741ee83'::uuid, -- Ayşe Sağlık / Test Eczanesi 001
      '0d8385df-4eed-429e-b691-81acee1ad606'::uuid  -- Adil Güçlü / Test Eczanesi 003
    )
    AND i.izleme_bitis >= coalesce(b.baslangic_tarihi, b.created_at)
    AND (b.bitis_tarihi IS NOT NULL AND i.izleme_bitis < b.bitis_tarihi
      OR b.bitis_tarihi IS NULL AND b.aktif_mi)
  JOIN public.v_yayin_kunye y ON y.yayin_id = i.yayin_id
  JOIN public.urunler u ON u.urun_id = y.urun_id
  LEFT JOIN public.v_yayin_detay d ON d.yayin_id = i.yayin_id
  LEFT JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
  WHERE i.tamamlandi_mi IS TRUE
    AND NOT coalesce(i.ilerleme_durumu ? 'gorunum_testi', false)
    AND i.izleme_bitis >= TIMESTAMPTZ '2026-07-01 00:00:00+03'
    AND i.izleme_bitis < TIMESTAMPTZ '2026-09-01 00:00:00+03'
    AND y.firma_id = '0c504d88-b9fb-40bb-beae-5bae33cb99ac'::uuid
    AND u.urun_adi = 'Forma XL'
), ayrinti AS (
  SELECT k.*,
    p.ad, p.soyad,
    coalesce(izleme_puani.puan, 0) AS tamamlama_puani,
    coalesce(cevap_puani.puan, 0) AS cevaplama_puani,
    coalesce(cevap_kaniti.puan, 0) AS kayitli_dogru_cevap_puani,
    coalesce(kayip.puan, 0) AS kayip_puani,
    coalesce(utt.adet, 0) AS utt_puan_kaydi,
    coalesce(diger_eczane.adet, 0) AS baska_eczanedeki_puan_kaydi,
    coalesce(cekli.puan, 0) AS cek_karsiligi_olan_puan
  FROM kapsam k
  LEFT JOIN public.eclub_kisiler p ON p.kisi_id = k.kisi_id
  LEFT JOIN LATERAL (
    SELECT sum(x.puan)::integer AS puan
    FROM public.eclub_kazanilan_puanlar x
    WHERE x.izleme_id = k.izleme_id AND x.eczane_id = k.eczane_id
      AND x.kisi_id = k.kisi_id AND x.yayin_id = k.yayin_id AND x.puan_turu = 'izleme'
  ) izleme_puani ON true
  LEFT JOIN LATERAL (
    SELECT sum(x.puan)::integer AS puan
    FROM public.eclub_kazanilan_puanlar x
    WHERE x.izleme_id = k.izleme_id AND x.eczane_id = k.eczane_id
      AND x.kisi_id = k.kisi_id AND x.yayin_id = k.yayin_id AND x.puan_turu = 'cevaplama'
  ) cevap_puani ON true
  LEFT JOIN LATERAL (
    SELECT sum(x.kazanilan_puan)::integer AS puan
    FROM public.eclub_dogru_cevap_kayitlari x
    WHERE x.izleme_id = k.izleme_id AND x.kisi_id = k.kisi_id AND x.yayin_id = k.yayin_id
  ) cevap_kaniti ON true
  LEFT JOIN LATERAL (
    SELECT sum(x.kaybedilen_puan)::integer AS puan
    FROM public.eclub_ileri_sarma_kayitlari x
    WHERE x.izleme_id = k.izleme_id AND x.kisi_id = k.kisi_id AND x.yayin_id = k.yayin_id
  ) kayip ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS adet
    FROM public.eclub_utt_puanlari x
    WHERE x.izleme_id = k.izleme_id AND x.kisi_id = k.kisi_id AND x.yayin_id = k.yayin_id
      AND x.puan > 0
  ) utt ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS adet
    FROM public.eclub_kazanilan_puanlar x
    WHERE x.izleme_id = k.izleme_id AND x.eczane_id <> k.eczane_id
  ) diger_eczane ON true
  LEFT JOIN LATERAL (
    SELECT sum(x.puan)::integer AS puan
    FROM public.eclub_kazanilan_puanlar x
    WHERE x.izleme_id = k.izleme_id AND x.eczane_id = k.eczane_id
      AND x.cek_karsiligi_var_mi IS TRUE
  ) cekli ON true
)
SELECT eczane_id, kisi_id, concat_ws(' ', ad, soyad) AS uye, yayin_id, izleme_id,
  arac_turu,
  least(8, floor(extract(epoch FROM (
    izleme_bitis - TIMESTAMPTZ '2026-07-01 00:00:00+03'
  )) / 604800)::integer + 1) AS hafta,
  izleme_bitis AT TIME ZONE 'Europe/Istanbul' AS tamamlanma_tr,
  soru_hakki_nedeni,
  izleme_bitis BETWEEN oneri_baslangic AND oneri_bitis AS oneri_penceresinde,
  ogrenme_araci_puani, utt_puan_kaydi,
  tamamlama_puani, kayitli_dogru_cevap_puani, cevaplama_puani,
  kayip_puani,
  greatest(0, tamamlama_puani + cevaplama_puani - kayip_puani) AS cetvel_net_puani,
  cek_karsiligi_olan_puan, baska_eczanedeki_puan_kaydi,
  CASE
    WHEN oneri_baslangic IS NULL THEN 'oneri_kaydi_yok_incele'
    WHEN soru_hakki_nedeni = 'sure_gecmis' THEN 'suresi_gecmis_puansiz'
    WHEN baska_eczanedeki_puan_kaydi > 0 THEN 'puan_baska_eczanede_incele'
    WHEN utt_puan_kaydi > 0 AND ogrenme_araci_puani > 0
      AND tamamlama_puani = 0 THEN 'tamamlama_puani_eksik_incele'
    WHEN kayitli_dogru_cevap_puani > 0
      AND cevaplama_puani = 0 THEN 'cevap_puani_eksik_incele'
    ELSE 'kayitlari_karsilastir'
  END AS inceleme_durumu
FROM ayrinti
ORDER BY eczane_id, hafta, arac_turu, izleme_bitis, izleme_id;
