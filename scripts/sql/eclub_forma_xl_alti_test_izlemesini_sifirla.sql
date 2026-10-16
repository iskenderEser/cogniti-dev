-- KAPSAM GENİŞLEDİ: Diğer dört üründe 18 aday daha bulundu. Toplu karar
-- verilene kadar bu altı kayıtlık SQL'i ÇALIŞTIRMAYIN.
-- Kullanıcının incelettiği altı Forma XL test izlemesini yeniden test için sıfırlar.
-- Yalnız aşağıdaki altı izleme ve onlara bağlı cevap/UTT puanı kayıtlarını etkiler.
-- Yayınları, UTT gönderimlerini (önerileri), üyeleri ve diğer testleri silmez.
-- Üretici rolü daha sonra yayını durdurup yeniden başlatır; UTT yeni gönderimi
-- ve üyeler yeni izlemeyi normal arayüzden yapar.
--
-- eclub_izleme_kayitlari.izleme_baslangic ve öneri tarihleri NOT NULL'dur;
-- gerçekleşmiş önerinin zamanı ayrıca tetikleyiciyle korunur. Bu tarihleri
-- boşaltmak yerine eski izlemelerin bitişini ve tamamlama durumunu sıfırlarız.
-- Yeni gönderim yeni oneri_id ve dolayısıyla yeni izleme_id üretir.
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
  kisi_id uuid NOT NULL,
  yayin_id uuid NOT NULL
) ON COMMIT DROP;

INSERT INTO hedef_izlemeler (izleme_id, kisi_id, yayin_id) VALUES
  ('42db8bfb-a1b9-42ce-8c2d-01009fcf88b1', 'c82773f7-fbe6-4157-9c12-5621f91024e5', '5eec3f78-5539-41b0-84a7-3221c86775a9'),
  ('ffc66dc4-e764-4aae-881c-ff83e20511d4', '9ffa352b-8806-42a4-ac42-cf43f8daf039', '5eec3f78-5539-41b0-84a7-3221c86775a9'),
  ('01a5e366-e432-472f-84fe-635b23e8d804', '222285b3-9108-45ba-b194-16155fc0650b', '5eec3f78-5539-41b0-84a7-3221c86775a9'),
  ('5fa0c3de-c2e3-438b-9be2-eb576d370d5b', 'fe0daec0-27b5-4a16-90ab-81627aa9fcfb', '8069cf60-3693-4a5e-9d35-832a10941fae'),
  ('2ee8d4e9-97f0-4472-b332-9bb6c5cbbdfe', 'fe0daec0-27b5-4a16-90ab-81627aa9fcfb', '5eec3f78-5539-41b0-84a7-3221c86775a9'),
  ('e4debdd8-ef06-46f5-ae5b-11cbdcfb9f9c', '4e7c677d-272c-41e9-831f-1cd6105258b6', '5eec3f78-5539-41b0-84a7-3221c86775a9');

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM hedef_izlemeler) <> 6
     OR (SELECT count(*)
         FROM hedef_izlemeler h
         JOIN public.eclub_izleme_kayitlari i USING (izleme_id)
         JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
         WHERE i.kisi_id = h.kisi_id
           AND i.yayin_id = h.yayin_id
           AND o.kisi_id = h.kisi_id
           AND o.yayin_id = h.yayin_id
           AND i.arac_turu = 'video'
           AND i.tamamlandi_mi IS TRUE
           AND i.izleme_bitis >= TIMESTAMPTZ '2026-07-01 00:00:00+03'
           AND i.izleme_bitis < TIMESTAMPTZ '2026-09-01 00:00:00+03') <> 6
  THEN
    RAISE EXCEPTION 'Altı test izlemesinden biri değişmiş veya eksik; hiçbir kayıt sıfırlanmadı.';
  END IF;

  -- Önceki denetimde bu altı izlemeye üye puanı yazılmamıştı. Sonradan puan
  -- oluştuysa bakiyeyi sessizce değiştirmemek için işlemi durdur.
  IF EXISTS (
    SELECT 1 FROM public.eclub_kazanilan_puanlar p
    JOIN hedef_izlemeler h USING (izleme_id)
  ) THEN
    RAISE EXCEPTION 'Bu izlemelerden birinde artık üye puanı var; sıfırlama durduruldu.';
  END IF;
END;
$kontrol$;

-- Silinecek türev kayıtlar ve değiştirilecek iki ana kayıt için geri dönüş kopyası.
-- Tablo zaten varsa işlem durur; aynı sıfırlama yanlışlıkla tekrar çalışmaz.
CREATE TABLE public.eclub_forma_xl_alti_test_izleme_yedegi_20261015 AS
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

REVOKE ALL ON public.eclub_forma_xl_alti_test_izleme_yedegi_20261015
  FROM PUBLIC, anon, authenticated;
ALTER TABLE public.eclub_forma_xl_alti_test_izleme_yedegi_20261015 ENABLE ROW LEVEL SECURITY;

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

  IF v_izleme <> 6 OR v_oneri <> 6 THEN
    RAISE EXCEPTION 'Beklenen 6 izleme/6 öneri yerine % izleme/% öneri güncellendi; işlem geri alınacak.',
      v_izleme, v_oneri;
  END IF;
END;
$sifirla$;

DO $son_kontrol$
BEGIN
  IF (SELECT count(*)
      FROM public.eclub_forma_xl_alti_test_izleme_yedegi_20261015
      WHERE kaynak IN ('izleme', 'oneri')) <> 12
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

SELECT i.izleme_id, i.yayin_id, i.tamamlandi_mi, i.izleme_bitis,
       o.oneri_id, o.izlendi_mi
FROM public.eclub_izleme_kayitlari i
JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
WHERE i.izleme_id IN (
  '42db8bfb-a1b9-42ce-8c2d-01009fcf88b1'::uuid,
  'ffc66dc4-e764-4aae-881c-ff83e20511d4'::uuid,
  '01a5e366-e432-472f-84fe-635b23e8d804'::uuid,
  '5fa0c3de-c2e3-438b-9be2-eb576d370d5b'::uuid,
  '2ee8d4e9-97f0-4472-b332-9bb6c5cbbdfe'::uuid,
  'e4debdd8-ef06-46f5-ae5b-11cbdcfb9f9c'::uuid
)
ORDER BY i.izleme_id;

-- PM'nin arayüzde yeniden başlatacağı iki yayının mevcut durumu.
SELECT y.yayin_id, y.durum,
       y.yayin_tarihi AT TIME ZONE 'Europe/Istanbul' AS kayitli_yayin_tarihi_tr
FROM public.yayin_yonetimi y
WHERE y.yayin_id IN (
  '5eec3f78-5539-41b0-84a7-3221c86775a9'::uuid,
  '8069cf60-3693-4a5e-9d35-832a10941fae'::uuid
)
ORDER BY y.yayin_id;
