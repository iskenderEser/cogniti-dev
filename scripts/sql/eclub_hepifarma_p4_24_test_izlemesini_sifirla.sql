-- Hepifarma / iki eczane / 2026 Temmuz-Ağustos dönemindeki 24 test izlemesini
-- yeni PM -> UTT -> E-Club testi için sıfırlar. Başka ürün/dönem/eczane seçmez.
-- Yalnız seçili izlemelerin tamamlanma durumunu ve bunlardan doğan cevap,
-- ileri sarma ve UTT puanı kayıtlarını temizler. Yayınlar, öneriler, kişiler,
-- eczaneler ve başka test verileri korunur.
--
-- Zorunlu izleme_baslangic ve değiştirilemeyen öneri tarihleri korunur.
-- PM yayını durdurup yeniden başlatınca yayin_tarihi bugün olur; UTT'nin
-- arayüzden yeni gönderimi yeni oneri_id, üyenin izlemesi yeni izleme_id üretir.
--
-- Canlı veritabanında henüz çalıştırılmadı. Kullanıcı SQL Editor'da çalıştırır.

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
  beklenen_urun_adi text NOT NULL
) ON COMMIT DROP;

INSERT INTO hedef_izlemeler (beklenen_urun_adi, izleme_id) VALUES
  ('Forma XL', '42db8bfb-a1b9-42ce-8c2d-01009fcf88b1'),
  ('Forma XL', 'ffc66dc4-e764-4aae-881c-ff83e20511d4'),
  ('Forma XL', '01a5e366-e432-472f-84fe-635b23e8d804'),
  ('Forma XL', '5fa0c3de-c2e3-438b-9be2-eb576d370d5b'),
  ('Forma XL', '2ee8d4e9-97f0-4472-b332-9bb6c5cbbdfe'),
  ('Forma XL', 'e4debdd8-ef06-46f5-ae5b-11cbdcfb9f9c'),
  ('Abilon', 'd2114a49-7e1e-4047-b66e-4dd67f277d92'),
  ('Laropen', 'f1a90f9a-ee4d-4541-9ae3-d033545f7a92'),
  ('Laropen', '889aecb1-ecfd-448a-81b1-dc03397eef5d'),
  ('Laropen', 'a6cf2316-2a32-46d1-8c07-e13a6f1e4fd7'),
  ('Laropen', 'eea7617c-faf0-4add-ae66-010d84fee9b7'),
  ('Normavas', '6722f7af-5de9-48e6-82cf-5fae53ebbe6b'),
  ('Normavas', 'ea78955b-684b-477f-86df-024e3b11dcf0'),
  ('Normavas', '08974a6f-2c78-40a0-a1f5-495853dd4a33'),
  ('Normavas', '2fc56652-b919-462e-866d-56d762074648'),
  ('Normavas', '5b1b4044-7579-4ebd-b6ec-d25502850901'),
  ('Normavas', 'eb2a8354-90c0-4f41-b5af-27c242337903'),
  ('Normavas', 'a50d38e6-3998-4e8d-86ff-1f3d20daaea3'),
  ('Normavas', '471407f6-ef99-48c0-9d11-c3778adc4425'),
  ('Normavas', '5bc16d92-99cb-492f-9fc2-20dff155d24d'),
  ('Semeril', '78399de7-1819-422c-8b99-b71e17444349'),
  ('Semeril', '1b0ea139-0d52-4dc3-b355-f7f7cc0fee04'),
  ('Semeril', '281b772f-6e99-4fdf-a067-2c57b797a304'),
  ('Semeril', '08c17478-aeab-43a1-bc02-9a8c15749836');

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM hedef_izlemeler) <> 24
     OR (SELECT count(*)
         FROM hedef_izlemeler h
         JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
         JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
         JOIN public.v_yayin_kunye y ON y.yayin_id = i.yayin_id
         JOIN public.urunler u ON u.urun_id = y.urun_id
         WHERE u.urun_adi = h.beklenen_urun_adi
           AND y.firma_id = '0c504d88-b9fb-40bb-beae-5bae33cb99ac'::uuid
           AND o.kisi_id = i.kisi_id AND o.yayin_id = i.yayin_id
           AND i.arac_turu = 'video'
           AND i.tamamlandi_mi IS TRUE
           AND i.izleme_bitis >= TIMESTAMPTZ '2026-07-01 00:00:00+03'
           AND i.izleme_bitis < TIMESTAMPTZ '2026-09-01 00:00:00+03'
           AND i.izleme_baslangic < o.oneri_baslangic
           AND i.izleme_bitis < o.oneri_baslangic
           AND EXISTS (
             SELECT 1 FROM public.eclub_kisi_eczane b
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
           )) <> 24
  THEN
    RAISE EXCEPTION '24 test izlemesinden biri değişmiş veya kapsam dışı; işlem başlamadı.';
  END IF;

  -- Ön kontrolde 24 izlemenin hiçbirinde üye puanı yoktu. Bu durum değiştiyse
  -- çek/bakiye etkisini incelemek üzere işlemi durdur.
  IF EXISTS (
    SELECT 1 FROM public.eclub_kazanilan_puanlar p
    JOIN hedef_izlemeler h USING (izleme_id)
  ) THEN
    RAISE EXCEPTION 'Seçili izlemelerden birinde artık üye puanı var; işlem durduruldu.';
  END IF;
END;
$kontrol$;

-- Değiştirilecek ana satırlar ve silinecek türev satırlar işlem içinde yedeklenir.
-- Aynı adla tablo varsa CREATE TABLE hata verir; tekrar çalıştırma önlenir.
CREATE TABLE public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 AS
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

REVOKE ALL ON public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015
  FROM PUBLIC, anon, authenticated;
ALTER TABLE public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 ENABLE ROW LEVEL SECURITY;

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

  IF v_izleme <> 24 OR v_oneri <> 24 THEN
    RAISE EXCEPTION 'Beklenen 24 izleme/24 öneri yerine % izleme/% öneri güncellendi; işlem geri alınacak.',
      v_izleme, v_oneri;
  END IF;
END;
$sifirla$;

DO $son_kontrol$
BEGIN
  IF (SELECT count(*)
      FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015
      WHERE kaynak IN ('izleme', 'oneri')) <> 48
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
    RAISE EXCEPTION 'Sıfırlama doğrulanamadı; işlem geri alınacak.';
  END IF;
END;
$son_kontrol$;

COMMIT;

-- Sonuç ekranında 24 izlemenin sıfırlanmış hali ve PM'nin yeniden açacağı
-- 11 yayının mevcut durumu/tarihi birlikte görülür.
SELECT i.izleme_id, i.yayin_id, i.tamamlandi_mi, i.izleme_bitis,
       o.oneri_id, o.izlendi_mi,
       y.durum AS yayin_durumu,
       y.yayin_tarihi AT TIME ZONE 'Europe/Istanbul' AS kayitli_yayin_tarihi_tr
FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 b
JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
JOIN public.yayin_yonetimi y ON y.yayin_id = i.yayin_id
WHERE b.kaynak = 'izleme'
ORDER BY i.yayin_id, i.izleme_id;
