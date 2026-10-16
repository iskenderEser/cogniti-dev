-- Önceki işlemlerin hedefi olan 39 izlemeye ait üye puanlarını bağımsız okur.
-- Üye bazında ve toplamda puan kayıt sayısını, net puanı ve eksikleri gösterir.
-- Salt okunur; Supabase SQL Editor'da çalıştırılır.

WITH hedef AS (
  SELECT b.izleme_id
  FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
  UNION ALL
  SELECT b.izleme_id
  FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
), satir AS (
  SELECT i.izleme_id, i.kisi_id, i.yayin_id,
         concat_ws(' ', k.ad, k.soyad) AS uye,
         i.tamamlandi_mi,
         p.izleme_kaydi_sayisi,
         p.uyumlu_izleme_kaydi_sayisi,
         p.izleme_puani,
         p.cevap_puani,
         coalesce(kayip.kayip_puani, 0) AS kayip_puani,
         coalesce(yanlis.yanlis_cevap_sayisi, 0) AS yanlis_cevap_sayisi
  FROM hedef h
  JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
  LEFT JOIN public.eclub_kisiler k ON k.kisi_id = i.kisi_id
  LEFT JOIN LATERAL (
    SELECT count(*) FILTER (WHERE p.puan_turu = 'izleme')::integer AS izleme_kaydi_sayisi,
           count(*) FILTER (WHERE p.puan_turu = 'izleme'
                             AND p.kisi_id = i.kisi_id
                             AND p.yayin_id = i.yayin_id)::integer AS uyumlu_izleme_kaydi_sayisi,
           coalesce(sum(p.puan) FILTER (WHERE p.puan_turu = 'izleme'
                                          AND p.kisi_id = i.kisi_id
                                          AND p.yayin_id = i.yayin_id), 0)::integer AS izleme_puani,
           coalesce(sum(p.puan) FILTER (WHERE p.puan_turu = 'cevaplama'), 0)::integer AS cevap_puani
    FROM public.eclub_kazanilan_puanlar p
    WHERE p.izleme_id = i.izleme_id
  ) p ON true
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(f.kaybedilen_puan), 0)::integer AS kayip_puani
    FROM public.eclub_ileri_sarma_kayitlari f
    WHERE f.izleme_id = i.izleme_id
  ) kayip ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS yanlis_cevap_sayisi
    FROM public.eclub_yanlis_cevap_kayitlari c
    WHERE c.izleme_id = i.izleme_id
  ) yanlis ON true
), uye_ozet AS (
  SELECT s.kisi_id, max(s.uye) AS uye,
         count(*)::integer AS izleme_sayisi,
         count(*) FILTER (WHERE s.tamamlandi_mi IS TRUE)::integer AS tamamlanan,
         sum(s.uyumlu_izleme_kaydi_sayisi)::integer AS puanli_izleme,
         sum(s.izleme_puani)::integer AS izleme_puani,
         sum(s.cevap_puani)::integer AS cevap_puani,
         sum(s.kayip_puani)::integer AS kayip_puani,
         sum(greatest(0, s.izleme_puani + s.cevap_puani - s.kayip_puani))::integer AS net_puan,
         sum(s.yanlis_cevap_sayisi)::integer AS yanlis_cevap,
         count(*) FILTER (WHERE s.tamamlandi_mi IS DISTINCT FROM true
                            OR s.izleme_kaydi_sayisi <> 1
                            OR s.uyumlu_izleme_kaydi_sayisi <> 1
                            OR s.izleme_puani <= 0
                            OR s.cevap_puani <> 0
                            OR s.kayip_puani <> 0
                            OR s.yanlis_cevap_sayisi <> 2)::integer AS sorunlu_izleme
  FROM satir s
  GROUP BY s.kisi_id
)
SELECT sonuc.kapsam, sonuc.kisi_id, sonuc.uye, sonuc.izleme_sayisi,
       sonuc.tamamlanan, sonuc.puanli_izleme, sonuc.izleme_puani,
       sonuc.cevap_puani, sonuc.kayip_puani, sonuc.net_puan,
       sonuc.yanlis_cevap, sonuc.sorunlu_izleme
FROM (
  SELECT 0 AS sira, 'ÜYE'::text AS kapsam, u.kisi_id, u.uye,
         u.izleme_sayisi, u.tamamlanan, u.puanli_izleme,
         u.izleme_puani, u.cevap_puani, u.kayip_puani, u.net_puan,
         u.yanlis_cevap, u.sorunlu_izleme
  FROM uye_ozet u
  UNION ALL
  SELECT 1 AS sira, 'TOPLAM'::text AS kapsam, NULL::uuid AS kisi_id,
         NULL::text AS uye,
         sum(u.izleme_sayisi)::integer,
         sum(u.tamamlanan)::integer,
         sum(u.puanli_izleme)::integer,
         sum(u.izleme_puani)::integer,
         sum(u.cevap_puani)::integer,
         sum(u.kayip_puani)::integer,
         sum(u.net_puan)::integer,
         sum(u.yanlis_cevap)::integer,
         sum(u.sorunlu_izleme)::integer
  FROM uye_ozet u
) sonuc
ORDER BY sonuc.sira, sonuc.uye;
