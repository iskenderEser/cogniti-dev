-- Salt okunur tarama: önceki altı kayıtla aynı iki eczane, Hepifarma,
-- 2026 Temmuz-Ağustos dönemi ve tamamlanmış videolar. Forma XL hariçtir.
-- Ürün bazında tarih/puan tutarsızlığı adaylarını sayar; kayıt değiştirmez.
-- Canlı veritabanında henüz çalıştırılmadı.

WITH kapsam AS (
  SELECT
    i.izleme_id, i.kisi_id, i.yayin_id, i.izleme_baslangic, i.izleme_bitis,
    i.oneri_id, i.soru_hakki_nedeni,
    y.urun_id, u.urun_adi,
    o.oneri_baslangic, o.oneri_bitis,
    ym.yayin_tarihi
  FROM public.eclub_izleme_kayitlari AS i
  JOIN public.v_yayin_kunye AS y ON y.yayin_id = i.yayin_id
  JOIN public.urunler AS u ON u.urun_id = y.urun_id
  JOIN public.yayin_yonetimi AS ym ON ym.yayin_id = i.yayin_id
  LEFT JOIN public.eclub_oneri_kayitlari AS o ON o.oneri_id = i.oneri_id
  WHERE i.tamamlandi_mi IS TRUE
    AND i.arac_turu = 'video'
    AND NOT coalesce(i.ilerleme_durumu ? 'gorunum_testi', false)
    AND i.izleme_bitis >= TIMESTAMPTZ '2026-07-01 00:00:00+03'
    AND i.izleme_bitis < TIMESTAMPTZ '2026-09-01 00:00:00+03'
    AND y.firma_id = '0c504d88-b9fb-40bb-beae-5bae33cb99ac'::uuid
    AND u.urun_adi <> 'Forma XL'
    AND EXISTS (
      SELECT 1 FROM public.eclub_kisi_eczane AS b
      WHERE b.kisi_id = i.kisi_id
        AND b.eczane_id IN (
          '5387f7bc-732e-4674-8829-d34df741ee83'::uuid,
          '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
        )
        AND i.izleme_bitis >= coalesce(b.baslangic_tarihi, b.created_at)
        AND (
          b.bitis_tarihi IS NOT NULL AND i.izleme_bitis < b.bitis_tarihi
          OR b.bitis_tarihi IS NULL AND b.aktif_mi
        )
    )
), puanlar AS (
  SELECT
    k.*,
    coalesce(p.izleme_puani, 0) AS izleme_puani,
    coalesce(p.cevaplama_puani, 0) AS cevaplama_puani,
    coalesce(utt.utt_kaydi, 0) AS utt_kaydi,
    coalesce(dc.dogru_cevap_puani, 0) AS dogru_cevap_puani
  FROM kapsam AS k
  LEFT JOIN LATERAL (
    SELECT
      coalesce(sum(x.puan) FILTER (WHERE x.puan_turu = 'izleme'), 0)::integer AS izleme_puani,
      coalesce(sum(x.puan) FILTER (WHERE x.puan_turu = 'cevaplama'), 0)::integer AS cevaplama_puani
    FROM public.eclub_kazanilan_puanlar AS x
    WHERE x.izleme_id = k.izleme_id
      AND x.kisi_id = k.kisi_id
      AND x.yayin_id = k.yayin_id
  ) AS p ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS utt_kaydi
    FROM public.eclub_utt_puanlari AS x
    WHERE x.izleme_id = k.izleme_id
      AND x.kisi_id = k.kisi_id
      AND x.yayin_id = k.yayin_id
      AND x.puan > 0
  ) AS utt ON true
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(x.kazanilan_puan), 0)::integer AS dogru_cevap_puani
    FROM public.eclub_dogru_cevap_kayitlari AS x
    WHERE x.izleme_id = k.izleme_id
      AND x.kisi_id = k.kisi_id
      AND x.yayin_id = k.yayin_id
  ) AS dc ON true
)
SELECT
  urun_id,
  urun_adi,
  count(*)::integer AS tamamlanan_video_izlemesi,
  count(DISTINCT yayin_id)::integer AS yayin_sayisi,
  count(*) FILTER (WHERE oneri_id IS NULL OR oneri_baslangic IS NULL)::integer
    AS oneri_kaydi_olmayan,
  count(*) FILTER (WHERE izleme_baslangic < oneri_baslangic)::integer
    AS oneriden_once_baslayan,
  count(*) FILTER (WHERE izleme_bitis < oneri_baslangic)::integer
    AS oneriden_once_tamamlanan,
  count(*) FILTER (
    WHERE soru_hakki_nedeni = 'hak_var'
      AND (izleme_bitis < oneri_baslangic OR izleme_bitis > oneri_bitis)
  )::integer AS pencere_disinda_hak_var,
  count(*) FILTER (WHERE yayin_tarihi > izleme_baslangic)::integer
    AS kayitli_yayin_tarihi_izlemeden_sonra,
  count(*) FILTER (WHERE utt_kaydi > 0 AND izleme_puani = 0)::integer
    AS utt_puani_var_uye_izleme_puani_yok,
  count(*) FILTER (WHERE dogru_cevap_puani > 0 AND cevaplama_puani = 0)::integer
    AS dogru_cevap_var_uye_cevap_puani_yok,
  array_agg(izleme_id ORDER BY izleme_bitis) FILTER (
    WHERE izleme_baslangic < oneri_baslangic
       OR izleme_bitis < oneri_baslangic
       OR (soru_hakki_nedeni = 'hak_var'
           AND (izleme_bitis < oneri_baslangic OR izleme_bitis > oneri_bitis))
       OR (utt_kaydi > 0 AND izleme_puani = 0)
       OR (dogru_cevap_puani > 0 AND cevaplama_puani = 0)
  ) AS incelenecek_izleme_idleri
FROM puanlar
GROUP BY urun_id, urun_adi
ORDER BY urun_adi;
