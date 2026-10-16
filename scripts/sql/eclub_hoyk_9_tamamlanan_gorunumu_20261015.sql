-- 15 Ekim HOYK renk denemesindeki 45 kayıttan her grupta tam 3 tamamlanmış kayıt bırakır.
-- Mevcut tamamlanmalar 8/11/11'dir; 5/8/8 = 21 kaydın tamamlanma durumu geri alınır.
-- Bağlı puan, ileri sarma veya yanlış cevap kaydı bulunan izlemeler korunur.
-- İşlem tek parçadır; beklenmeyen veri durumunda tümü geri alınır.

BEGIN;
SET LOCAL timezone = 'Europe/Istanbul';
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.eclub_oneri_kayitlari, public.eclub_izleme_kayitlari
  IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE _hoyk_21_sifirlanacak ON COMMIT DROP AS
WITH mevcut AS (
  SELECT d.renk_grubu, o.oneri_id,
         (SELECT count(*) FROM public.eclub_izleme_kayitlari AS i
          WHERE i.oneri_id = o.oneri_id) AS izleme_adedi,
         (SELECT i.izleme_id FROM public.eclub_izleme_kayitlari AS i
          WHERE i.oneri_id = o.oneri_id
          ORDER BY i.created_at NULLS LAST, i.izleme_id LIMIT 1) AS izleme_id,
         EXISTS (
           SELECT 1 FROM public.eclub_izleme_kayitlari AS i
           JOIN public.eclub_kazanilan_puanlar AS p ON p.izleme_id = i.izleme_id
           WHERE i.oneri_id = o.oneri_id
         ) OR EXISTS (
           SELECT 1 FROM public.eclub_izleme_kayitlari AS i
           JOIN public.eclub_ileri_sarma_kayitlari AS f ON f.izleme_id = i.izleme_id
           WHERE i.oneri_id = o.oneri_id
         ) OR EXISTS (
           SELECT 1 FROM public.eclub_izleme_kayitlari AS i
           JOIN public.eclub_yanlis_cevap_kayitlari AS y ON y.izleme_id = i.izleme_id
           WHERE i.oneri_id = o.oneri_id
         ) AS bagli_kayit_var
  FROM public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
  JOIN public.eclub_oneri_kayitlari AS o ON o.oneri_id = d.oneri_id
  WHERE d.renk_grubu IN ('yesil', 'sari', 'kirmiziya_yaklasan')
    AND o.oneri_baslangic = d.yeni_baslangic
    AND o.oneri_bitis = d.yeni_bitis
    AND o.izlendi_mi = true
),
sirali AS (
  SELECT m.*, row_number() OVER (
    PARTITION BY m.renk_grubu
    ORDER BY m.bagli_kayit_var DESC, random(), m.oneri_id
  ) AS sira
  FROM mevcut AS m
)
SELECT renk_grubu, oneri_id, izleme_id, izleme_adedi, bagli_kayit_var
FROM sirali
WHERE sira > 3;

DO $kontrol$
BEGIN
  IF CURRENT_DATE <> DATE '2026-10-15' THEN
    RAISE EXCEPTION 'Bu SQL yalnız 15 Ekim 2026 Türkiye tarihinde çalıştırılabilir.';
  END IF;
  IF (SELECT count(*) FROM _hoyk_21_sifirlanacak) <> 21 OR EXISTS (
    SELECT 1 FROM _hoyk_21_sifirlanacak
    GROUP BY renk_grubu
    HAVING count(*) <> CASE renk_grubu
      WHEN 'yesil' THEN 8 WHEN 'sari' THEN 8
      WHEN 'kirmiziya_yaklasan' THEN 5 END
  ) THEN
    RAISE EXCEPTION '8/11/11 mevcut tamamlanma dağılımı değişmiş; işlem durduruldu.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM _hoyk_21_sifirlanacak AS s
    LEFT JOIN public.eclub_izleme_kayitlari AS i ON i.izleme_id = s.izleme_id
    WHERE s.izleme_adedi <> 1 OR s.bagli_kayit_var
       OR i.tamamlandi_mi IS DISTINCT FROM true
  ) THEN
    RAISE EXCEPTION 'Sıfırlanacak kayıtlardan birinde ek izleme veya bağlı veri var.';
  END IF;
END;
$kontrol$;

CREATE TABLE public.eclub_hoyk_tamamlanan_9_yedek_20261015 AS
SELECT s.renk_grubu, s.oneri_id, s.izleme_id,
       o.izlendi_mi AS eski_izlendi_mi,
       i.tamamlandi_mi AS eski_tamamlandi_mi,
       i.izleme_bitis AS eski_izleme_bitis,
       i.ilerleme_durumu AS eski_ilerleme_durumu,
       i.tamamlama_kaniti AS eski_tamamlama_kaniti,
       i.soru_hakki_var_mi AS eski_soru_hakki_var_mi,
       i.soru_erisimi_acik_mi AS eski_soru_erisimi_acik_mi,
       i.soru_hakki_nedeni AS eski_soru_hakki_nedeni,
       i.soru_indeksleri AS eski_soru_indeksleri
FROM _hoyk_21_sifirlanacak AS s
JOIN public.eclub_oneri_kayitlari AS o ON o.oneri_id = s.oneri_id
JOIN public.eclub_izleme_kayitlari AS i ON i.izleme_id = s.izleme_id;
ALTER TABLE public.eclub_hoyk_tamamlanan_9_yedek_20261015 ADD PRIMARY KEY (oneri_id);
ALTER TABLE public.eclub_hoyk_tamamlanan_9_yedek_20261015 ADD UNIQUE (izleme_id);
REVOKE ALL ON TABLE public.eclub_hoyk_tamamlanan_9_yedek_20261015
  FROM PUBLIC, anon, authenticated;
ALTER TABLE public.eclub_hoyk_tamamlanan_9_yedek_20261015 ENABLE ROW LEVEL SECURITY;

DO $guncelle$
DECLARE v_izleme integer; v_oneri integer;
BEGIN
  UPDATE public.eclub_izleme_kayitlari AS i
  SET tamamlandi_mi = false,
      izleme_bitis = NULL,
      ilerleme_durumu = '{}'::jsonb,
      tamamlama_kaniti = NULL,
      soru_hakki_var_mi = false,
      soru_erisimi_acik_mi = false,
      soru_hakki_nedeni = NULL,
      soru_indeksleri = NULL
  FROM public.eclub_hoyk_tamamlanan_9_yedek_20261015 AS b
  WHERE i.izleme_id = b.izleme_id
    AND i.tamamlandi_mi = true;
  GET DIAGNOSTICS v_izleme = ROW_COUNT;

  UPDATE public.eclub_oneri_kayitlari AS o
  SET izlendi_mi = false
  FROM public.eclub_hoyk_tamamlanan_9_yedek_20261015 AS b
  WHERE o.oneri_id = b.oneri_id
    AND o.izlendi_mi = true;
  GET DIAGNOSTICS v_oneri = ROW_COUNT;

  IF v_izleme <> 21 OR v_oneri <> 21 THEN
    RAISE EXCEPTION '21 yerine izleme % ve öneri % güncellendi; işlem geri alınacak.', v_izleme, v_oneri;
  END IF;
END;
$guncelle$;

DO $son_kontrol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.eclub_hoyk_tamamlanan_9_yedek_20261015 AS b
    JOIN public.eclub_oneri_kayitlari AS o USING (oneri_id)
    JOIN public.eclub_izleme_kayitlari AS i USING (izleme_id)
    WHERE o.izlendi_mi IS DISTINCT FROM false
       OR i.tamamlandi_mi IS DISTINCT FROM false
  ) OR EXISTS (
    SELECT 1 FROM public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
    JOIN public.eclub_oneri_kayitlari AS o ON o.oneri_id = d.oneri_id
    WHERE d.renk_grubu IN ('yesil', 'sari', 'kirmiziya_yaklasan')
    GROUP BY d.renk_grubu
    HAVING count(*) FILTER (WHERE o.izlendi_mi = true) <> 3
  ) THEN
    RAISE EXCEPTION 'Son durumda her renk grubunda tam üç tamamlanmış yayın yok.';
  END IF;
END;
$son_kontrol$;

COMMIT;

SELECT d.renk_grubu,
       count(*) FILTER (WHERE o.izlendi_mi = true) AS tamamlanan,
       count(*) FILTER (WHERE o.izlendi_mi IS NOT TRUE) AS tamamlanmayan
FROM public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
JOIN public.eclub_oneri_kayitlari AS o ON o.oneri_id = d.oneri_id
WHERE d.renk_grubu IN ('yesil', 'sari', 'kirmiziya_yaklasan')
GROUP BY d.renk_grubu
ORDER BY d.renk_grubu;
