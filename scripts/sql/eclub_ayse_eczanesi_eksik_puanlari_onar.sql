-- Ayşe Sağlık'ın eczanesindeki 9 tarihî tamamlamanın eksik puanlarını onarır.
-- Kapsam: Test Eczanesi 001, Hepifarma, Temmuz–Ağustos 2026.
-- İzleme puanı mühürlü yayından, cevap puanı kayıtlı doğru cevaplardan alınır.
-- İleri sarma kayıpları mevcut kayıtlarından düşülmeye devam eder.
-- Tarihler ve tamamlanma durumları değişmez. Mevcut puanlar değiştirilmez.
-- Aynı SQL tekrar çalıştırıldığında ikinci kez puan eklemez.
-- SQL Editor'da dosyanın tamamını çalıştırın.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.eclub_izleme_kayitlari, public.eclub_oneri_kayitlari,
  public.eclub_kisi_eczane, public.eclub_utt_puanlari,
  public.eclub_dogru_cevap_kayitlari, public.eclub_ileri_sarma_kayitlari,
  public.eclub_kazanilan_puanlar IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE _eclub_onarim_hedefi (
  izleme_id uuid PRIMARY KEY,
  izleme_puani integer NOT NULL,
  cevap_puani integer NOT NULL,
  kayip_puani integer NOT NULL
) ON COMMIT DROP;

INSERT INTO _eclub_onarim_hedefi VALUES
  ('08974a6f-2c78-40a0-a1f5-495853dd4a33', 70, 10, 0),
  ('5fa0c3de-c2e3-438b-9be2-eb576d370d5b', 50, 10, 0),
  ('2ee8d4e9-97f0-4472-b332-9bb6c5cbbdfe', 50, 10, 0),
  ('78399de7-1819-422c-8b99-b71e17444349', 50, 10, 0),
  ('2fc56652-b919-462e-866d-56d762074648', 50, 10, 0),
  ('1b0ea139-0d52-4dc3-b355-f7f7cc0fee04', 55, 10, 0),
  ('5b1b4044-7579-4ebd-b6ec-d25502850901', 70, 10, 0),
  ('e4debdd8-ef06-46f5-ae5b-11cbdcfb9f9c', 50, 10, 0),
  ('eea7617c-faf0-4add-ae66-010d84fee9b7', 50, 0, 44);

CREATE TEMP TABLE _eclub_onarim_kaynagi ON COMMIT DROP AS
SELECT h.izleme_id, i.kisi_id, i.yayin_id, k.urun_id, k.firma_id,
       i.izleme_baslangic, i.izleme_bitis, c.cevap_at,
       h.izleme_puani, h.cevap_puani, h.kayip_puani,
       '5387f7bc-732e-4674-8829-d34df741ee83'::uuid AS eczane_id,
       i.tamamlandi_mi, i.soru_hakki_nedeni, i.ilerleme_durumu,
       y.ogrenme_araci_puani, c.gercek_cevap_puani, f.gercek_kayip_puani,
       o.kisi_id = i.kisi_id AND o.yayin_id = i.yayin_id
         AND o.arac_id = y.arac_id AND o.arac_turu = i.arac_turu
         AND y.arac_turu = i.arac_turu AS arac_bagi_dogru,
       EXISTS (
         SELECT 1 FROM public.eclub_utt_puanlari u
         WHERE u.izleme_id = i.izleme_id AND u.oneri_id = i.oneri_id
           AND u.kisi_id = i.kisi_id AND u.yayin_id = i.yayin_id
           AND u.utt_id = o.oneren_id AND u.puan > 0
       ) AS puanli_tamamlama_kaniti,
       (SELECT count(*) FROM public.eclub_kisi_eczane b
        WHERE b.kisi_id = i.kisi_id
          AND i.izleme_bitis >= coalesce(b.baslangic_tarihi, b.created_at)
          AND CASE WHEN b.bitis_tarihi IS NOT NULL THEN i.izleme_bitis < b.bitis_tarihi ELSE b.aktif_mi END
       ) AS tarihsel_eczane_sayisi,
       EXISTS (
         SELECT 1 FROM public.eclub_kisi_eczane b
         WHERE b.kisi_id = i.kisi_id
           AND b.eczane_id = '5387f7bc-732e-4674-8829-d34df741ee83'::uuid
           AND i.izleme_bitis >= coalesce(b.baslangic_tarihi, b.created_at)
           AND CASE WHEN b.bitis_tarihi IS NOT NULL THEN i.izleme_bitis < b.bitis_tarihi ELSE b.aktif_mi END
       ) AS tarihsel_eczane_dogru,
       (SELECT count(*) FROM public.eclub_kisi_eczane b
        WHERE b.kisi_id = i.kisi_id AND b.aktif_mi) AS aktif_eczane_sayisi,
       EXISTS (
         SELECT 1 FROM public.eclub_kisi_eczane b
         WHERE b.kisi_id = i.kisi_id AND b.aktif_mi
           AND b.eczane_id = '5387f7bc-732e-4674-8829-d34df741ee83'::uuid
       ) AS aktif_eczane_dogru
FROM _eclub_onarim_hedefi h
LEFT JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = h.izleme_id
LEFT JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
LEFT JOIN public.v_yayin_detay y ON y.yayin_id = i.yayin_id
LEFT JOIN public.v_yayin_kunye k ON k.yayin_id = i.yayin_id
LEFT JOIN LATERAL (
  SELECT coalesce(sum(d.kazanilan_puan), 0)::integer AS gercek_cevap_puani,
         max(d.created_at) AS cevap_at
  FROM public.eclub_dogru_cevap_kayitlari d
  WHERE d.izleme_id = i.izleme_id AND d.kisi_id = i.kisi_id AND d.yayin_id = i.yayin_id
) c ON true
LEFT JOIN LATERAL (
  SELECT coalesce(sum(f.kaybedilen_puan), 0)::integer AS gercek_kayip_puani
  FROM public.eclub_ileri_sarma_kayitlari f
  WHERE f.izleme_id = i.izleme_id AND f.kisi_id = i.kisi_id AND f.yayin_id = i.yayin_id
) f ON true;

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM _eclub_onarim_kaynagi) <> 9 OR EXISTS (
    SELECT 1 FROM _eclub_onarim_kaynagi s
    WHERE s.kisi_id IS NULL OR s.yayin_id IS NULL OR s.urun_id IS NULL
      OR s.firma_id IS DISTINCT FROM '0c504d88-b9fb-40bb-beae-5bae33cb99ac'::uuid
      OR s.tamamlandi_mi IS DISTINCT FROM true
      OR s.arac_bagi_dogru IS DISTINCT FROM true
      OR s.puanli_tamamlama_kaniti IS DISTINCT FROM true
      OR coalesce(s.soru_hakki_nedeni, '') NOT IN ('hak_var', 'ileri_sarma', 'soru_yok')
      OR s.ilerleme_durumu ? 'gorunum_testi'
      OR s.izleme_bitis IS NULL
      OR s.izleme_bitis < TIMESTAMPTZ '2026-07-01 00:00:00+03'
      OR s.izleme_bitis >= TIMESTAMPTZ '2026-09-01 00:00:00+03'
      OR s.ogrenme_araci_puani IS DISTINCT FROM s.izleme_puani
      OR s.gercek_cevap_puani IS DISTINCT FROM s.cevap_puani
      OR s.gercek_kayip_puani IS DISTINCT FROM s.kayip_puani
      OR s.tarihsel_eczane_sayisi <> 1 OR NOT s.tarihsel_eczane_dogru
      OR s.aktif_eczane_sayisi <> 1 OR NOT s.aktif_eczane_dogru
      OR (s.cevap_puani > 0 AND (s.cevap_at IS NULL OR s.cevap_at < s.izleme_bitis
        OR s.cevap_at >= TIMESTAMPTZ '2026-09-01 00:00:00+03'))
  ) THEN
    RAISE EXCEPTION 'Dokuz tamamlamanın kaynak verisi değişmiş veya kazanım/eczane bağı doğrulanamadı; puan eklenmedi.';
  END IF;
END;
$kontrol$;

CREATE TEMP TABLE _eclub_onarim_puanlari ON COMMIT DROP AS
SELECT s.izleme_id, s.kisi_id, s.eczane_id, s.yayin_id, s.urun_id,
       'izleme'::text AS puan_turu, s.izleme_puani AS puan, s.izleme_bitis AS created_at
FROM _eclub_onarim_kaynagi s
UNION ALL
SELECT s.izleme_id, s.kisi_id, s.eczane_id, s.yayin_id, s.urun_id,
       'cevaplama', s.cevap_puani, s.cevap_at
FROM _eclub_onarim_kaynagi s WHERE s.cevap_puani > 0;

DO $mevcut_kontrol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM _eclub_onarim_puanlari s
    JOIN public.eclub_kazanilan_puanlar p USING (izleme_id, puan_turu)
    WHERE p.kisi_id IS DISTINCT FROM s.kisi_id OR p.eczane_id IS DISTINCT FROM s.eczane_id
      OR p.yayin_id IS DISTINCT FROM s.yayin_id OR p.urun_id IS DISTINCT FROM s.urun_id
      OR p.puan IS DISTINCT FROM s.puan
      OR p.created_at IS NULL
      OR p.created_at < TIMESTAMPTZ '2026-07-01 00:00:00+03'
      OR p.created_at >= TIMESTAMPTZ '2026-09-01 00:00:00+03'
  ) THEN
    RAISE EXCEPTION 'Hedefte farklı bir puan kaydı var; mevcut puan değiştirilmeden işlem durduruldu.';
  END IF;
END;
$mevcut_kontrol$;

CREATE TEMP TABLE _eclub_onarim_eklenen ON COMMIT DROP AS
WITH eklenen AS (
  INSERT INTO public.eclub_kazanilan_puanlar
    (kisi_id, eczane_id, yayin_id, izleme_id, puan_turu, puan, urun_id, created_at)
  SELECT kisi_id, eczane_id, yayin_id, izleme_id, puan_turu, puan, urun_id, created_at
  FROM _eclub_onarim_puanlari
  ON CONFLICT (izleme_id, puan_turu) DO NOTHING
  RETURNING puan_turu
)
SELECT puan_turu FROM eklenen;

DO $son_kontrol$
BEGIN
  IF (SELECT count(*) FROM _eclub_onarim_puanlari s
      JOIN public.eclub_kazanilan_puanlar p USING (izleme_id, puan_turu)
      WHERE p.kisi_id = s.kisi_id AND p.eczane_id = s.eczane_id AND p.yayin_id = s.yayin_id
        AND p.urun_id = s.urun_id AND p.puan = s.puan) <> 17 THEN
    RAISE EXCEPTION '17 puan kaydı doğrulanamadı; işlem geri alındı.';
  END IF;
END;
$son_kontrol$;

SELECT 'TAMAMLANDI' AS sonuc,
       count(*) FILTER (WHERE puan_turu = 'izleme') AS eklenen_tamamlama_puani_kaydi,
       count(*) FILTER (WHERE puan_turu = 'cevaplama') AS eklenen_cevap_puani_kaydi
FROM _eclub_onarim_eklenen;

SELECT y.urun_adi, count(*) AS tamamlanan_yayin,
       sum(s.izleme_puani + s.cevap_puani - s.kayip_puani) AS net_puan
FROM _eclub_onarim_kaynagi s
JOIN public.v_yayin_detay y ON y.yayin_id = s.yayin_id
GROUP BY y.urun_adi ORDER BY y.urun_adi;

COMMIT;
