-- 11 Hepifarma yayınında önceki 24 sıfırlamanın dışında kalan 15 test izlemesi.
-- Kullanıcının kapsam genişletme onayıyla üçüncü eczanedeki 13 ve ilk iki
-- eczanedeki 2 kayıt dahil edilir. Eski öneri/izleme kimlikleri korunur;
-- tamamlanma, soru hakkı ve bu izlemeden doğan UTT/cevap/kayıp kayıtları
-- yedeklenip sıfırlanır. Üye puanı ortaya çıkmışsa işlem durur.
-- Bu işlem yayın tarihini değiştirmez. Canlı DB'de henüz çalıştırılmadı.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.eclub_oneri_kayitlari, public.eclub_izleme_kayitlari,
  public.eclub_kazanilan_puanlar, public.eclub_utt_puanlari,
  public.eclub_dogru_cevap_kayitlari, public.eclub_yanlis_cevap_kayitlari,
  public.eclub_ileri_sarma_kayitlari
  IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE hedef_izlemeler (
  izleme_id uuid PRIMARY KEY,
  yayin_id uuid NOT NULL,
  beklenen_urun_adi text NOT NULL,
  beklenen_durum text NOT NULL
) ON COMMIT DROP;

INSERT INTO hedef_izlemeler
  (izleme_id, yayin_id, beklenen_urun_adi, beklenen_durum) VALUES
  ('55a0f404-d90f-4409-8c6f-e56234aec052', '4602ddc1-f7f0-4526-9622-26e72593ff6b', 'Abilon', 'oneriden_once'),
  ('1a220a28-a9bf-4a90-9df8-3d9fe1365b73', '5eec3f78-5539-41b0-84a7-3221c86775a9', 'Forma XL', 'sure_gecmis'),
  ('2bb26f1e-1edc-49cd-93f6-2f1230c18494', '5eec3f78-5539-41b0-84a7-3221c86775a9', 'Forma XL', 'tamamlanmamis'),
  ('2fa0f371-fc10-4589-be33-f74c562c4edf', '5eec3f78-5539-41b0-84a7-3221c86775a9', 'Forma XL', 'oneriden_once'),
  ('977958e2-5d5c-4c03-8e5f-d93e0b7a5b8b', '5eec3f78-5539-41b0-84a7-3221c86775a9', 'Forma XL', 'oneriden_once'),
  ('f894e183-5d36-4df6-8c42-3e3017d0a13e', '8069cf60-3693-4a5e-9d35-832a10941fae', 'Forma XL', 'tamamlanmamis'),
  ('8a1df719-f8cb-476a-bcd8-ae92f59fca43', '797688dd-b65f-43fc-9a99-337e7f41c606', 'Normavas', 'oneriden_once'),
  ('ddf95db0-cc1d-429d-8510-605e7caa3c2a', '797688dd-b65f-43fc-9a99-337e7f41c606', 'Normavas', 'oneriden_once'),
  ('a3a552a1-2381-41e9-ab01-69e7b91e7466', '8d840599-fb1b-4474-8c48-f9014b0009cf', 'Normavas', 'oneriden_once'),
  ('b572b282-2122-4806-ac20-ffdd4595819b', 'c19cab66-5332-40f0-8406-58955b03d0ee', 'Normavas', 'oneriden_once'),
  ('ee324c95-1b17-4298-a262-9780854af708', 'c19cab66-5332-40f0-8406-58955b03d0ee', 'Normavas', 'oneriden_once'),
  ('8071ec84-32f2-4f27-93a5-99cc228812ea', 'd3693736-49ca-43d3-afc8-f61698db9d45', 'Normavas', 'tamamlanmamis'),
  ('6b7f6c72-ee20-4ee0-9ddb-e286dedb947d', '2135330d-30de-40b2-b4c2-f058e6b9d8c8', 'Semeril', 'oneriden_once'),
  ('a0446a12-e4aa-4002-87d7-dddc371c0083', '2135330d-30de-40b2-b4c2-f058e6b9d8c8', 'Semeril', 'oneriden_once'),
  ('3d829357-60b3-487e-8b1a-fc97973929f0', 'bcdae9cd-4fc7-47be-989e-3be917abbfcf', 'Semeril', 'oneriden_once');

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM hedef_izlemeler) <> 15
     OR (SELECT count(*)
         FROM hedef_izlemeler h
         JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
         JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
         JOIN public.v_yayin_kunye y ON y.yayin_id = i.yayin_id
         JOIN public.urunler u ON u.urun_id = y.urun_id
         WHERE i.yayin_id = h.yayin_id
           AND u.urun_adi = h.beklenen_urun_adi
           AND y.firma_id = '0c504d88-b9fb-40bb-beae-5bae33cb99ac'::uuid
           AND o.kisi_id = i.kisi_id AND o.yayin_id = i.yayin_id
           AND i.arac_turu = 'video'
           AND o.oneri_baslangic = TIMESTAMPTZ '2026-09-01 00:00:00+03'
           AND o.oneri_bitis = TIMESTAMPTZ '2026-09-16 00:00:00+03'
           AND EXISTS (
             SELECT 1 FROM public.eclub_kisi_eczane b
             WHERE b.kisi_id = i.kisi_id
               AND b.eczane_id IN (
                 '0d8385df-4eed-429e-b691-81acee1ad606'::uuid,
                 '92b97e43-a3fe-43f4-a586-6f8318eca7e1'::uuid
               )
           )
           AND (
             h.beklenen_durum = 'oneriden_once'
             AND i.tamamlandi_mi IS TRUE
             AND i.izleme_baslangic < o.oneri_baslangic
             AND i.izleme_bitis < o.oneri_baslangic
             AND i.izleme_bitis >= TIMESTAMPTZ '2026-08-01 00:00:00+03'
             AND i.izleme_bitis < TIMESTAMPTZ '2026-09-01 00:00:00+03'
             OR h.beklenen_durum = 'tamamlanmamis'
             AND i.tamamlandi_mi IS FALSE AND i.izleme_bitis IS NULL
             AND i.izleme_baslangic >= TIMESTAMPTZ '2026-08-01 00:00:00+03'
             AND i.izleme_baslangic < o.oneri_baslangic
             OR h.beklenen_durum = 'sure_gecmis'
             AND i.tamamlandi_mi IS TRUE
             AND i.izleme_baslangic > o.oneri_bitis
             AND i.izleme_bitis > o.oneri_bitis
             AND i.soru_hakki_nedeni = 'sure_gecmis'
             AND i.izleme_bitis >= TIMESTAMPTZ '2026-10-13 00:00:00+03'
             AND i.izleme_bitis < TIMESTAMPTZ '2026-10-14 00:00:00+03'
           )) <> 15
  THEN
    RAISE EXCEPTION '15 test izlemesinden biri değişmiş veya kapsam dışı; işlem başlamadı.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.eclub_kazanilan_puanlar p
    JOIN hedef_izlemeler h USING (izleme_id)
  ) THEN
    RAISE EXCEPTION 'Seçili izlemelerden birinde artık üye puanı var; işlem durduruldu.';
  END IF;
END;
$kontrol$;

-- Değiştirilecek ana satırların ve silinecek türev kayıtların geri dönüş kopyası.
-- Tablo önceden varsa CREATE TABLE hata verir; ikinci koşum yapılmaz.
CREATE TABLE public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015 AS
  SELECT h.izleme_id, 'izleme'::text AS kaynak, to_jsonb(i) AS veri
  FROM hedef_izlemeler h JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
  UNION ALL
  SELECT h.izleme_id, 'oneri', to_jsonb(o)
  FROM hedef_izlemeler h
  JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
  JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
  UNION ALL
  SELECT h.izleme_id, 'utt_puani', to_jsonb(p)
  FROM hedef_izlemeler h JOIN public.eclub_utt_puanlari p USING (izleme_id)
  UNION ALL
  SELECT h.izleme_id, 'dogru_cevap', to_jsonb(c)
  FROM hedef_izlemeler h JOIN public.eclub_dogru_cevap_kayitlari c USING (izleme_id)
  UNION ALL
  SELECT h.izleme_id, 'yanlis_cevap', to_jsonb(c)
  FROM hedef_izlemeler h JOIN public.eclub_yanlis_cevap_kayitlari c USING (izleme_id)
  UNION ALL
  SELECT h.izleme_id, 'ileri_sarma', to_jsonb(s)
  FROM hedef_izlemeler h JOIN public.eclub_ileri_sarma_kayitlari s USING (izleme_id);

REVOKE ALL ON public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015
  FROM PUBLIC, anon, authenticated;
ALTER TABLE public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015 ENABLE ROW LEVEL SECURITY;

DELETE FROM public.eclub_utt_puanlari p USING hedef_izlemeler h
WHERE p.izleme_id = h.izleme_id;
DELETE FROM public.eclub_dogru_cevap_kayitlari c USING hedef_izlemeler h
WHERE c.izleme_id = h.izleme_id;
DELETE FROM public.eclub_yanlis_cevap_kayitlari c USING hedef_izlemeler h
WHERE c.izleme_id = h.izleme_id;
DELETE FROM public.eclub_ileri_sarma_kayitlari s USING hedef_izlemeler h
WHERE s.izleme_id = h.izleme_id;

DO $sifirla$
DECLARE v_izleme integer; v_oneri integer;
BEGIN
  UPDATE public.eclub_izleme_kayitlari i
  SET tamamlandi_mi = false,
      izleme_bitis = NULL,
      ilerleme_durumu = '{}'::jsonb,
      tamamlama_kaniti = NULL,
      soru_hakki_var_mi = false,
      soru_erisimi_acik_mi = false,
      soru_hakki_nedeni = NULL,
      soru_indeksleri = NULL
  FROM hedef_izlemeler h
  WHERE i.izleme_id = h.izleme_id;
  GET DIAGNOSTICS v_izleme = ROW_COUNT;

  UPDATE public.eclub_oneri_kayitlari o
  SET izlendi_mi = false
  FROM public.eclub_izleme_kayitlari i
  JOIN hedef_izlemeler h ON h.izleme_id = i.izleme_id
  WHERE o.oneri_id = i.oneri_id;
  GET DIAGNOSTICS v_oneri = ROW_COUNT;

  IF v_izleme <> 15 OR v_oneri <> 15 THEN
    RAISE EXCEPTION 'Beklenen 15 izleme/15 öneri yerine % izleme/% öneri güncellendi; işlem geri alınacak.',
      v_izleme, v_oneri;
  END IF;
END;
$sifirla$;

DO $son_kontrol$
BEGIN
  IF (SELECT count(*)
      FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015
      WHERE kaynak IN ('izleme', 'oneri')) <> 30
     OR EXISTS (
       SELECT 1 FROM hedef_izlemeler h
       JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
       JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
       WHERE i.tamamlandi_mi IS DISTINCT FROM false
          OR i.izleme_bitis IS NOT NULL
          OR o.izlendi_mi IS DISTINCT FROM false
     )
     OR EXISTS (SELECT 1 FROM public.eclub_utt_puanlari p JOIN hedef_izlemeler h USING (izleme_id))
     OR EXISTS (SELECT 1 FROM public.eclub_dogru_cevap_kayitlari c JOIN hedef_izlemeler h USING (izleme_id))
     OR EXISTS (SELECT 1 FROM public.eclub_yanlis_cevap_kayitlari c JOIN hedef_izlemeler h USING (izleme_id))
     OR EXISTS (SELECT 1 FROM public.eclub_ileri_sarma_kayitlari s JOIN hedef_izlemeler h USING (izleme_id))
  THEN
    RAISE EXCEPTION '15 izleme sıfırlanamadı; işlem geri alınacak.';
  END IF;
END;
$son_kontrol$;

COMMIT;

SELECT i.izleme_id, i.yayin_id, i.tamamlandi_mi, i.izleme_bitis,
       o.oneri_id, o.izlendi_mi
FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015 b
JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
WHERE b.kaynak = 'izleme'
ORDER BY i.yayin_id, i.izleme_id;
