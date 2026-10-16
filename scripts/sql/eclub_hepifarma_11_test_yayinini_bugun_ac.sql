-- Hepifarma'nın sıfırlanmış 24+15 test izlemesine bağlı 11 yayının PM arayüzündeki
-- durdur/yeniden başlat işlemi SONRASINDAKİ yayın durumunu tek işlemde kurar.
-- PM API'si bu durumda durum='yayinda', durdurma_tarihi=NULL ve
-- yayin_tarihi=şimdiki zaman yazar; tekrar turu veya bildirim üretmez.
-- Bu SQL de yalnız bu üç sütunu değiştirir. Öneri/gönderim tarihlerini değiştirmez.
--
-- 24 ve 15 kayıtlık sıfırlama yedekleri ve sonuçları doğrulanmadan çalışmaz.
-- Bunlar dışında izleme veya üye puanı varsa işlem durur.
-- ÖNCE eclub_hepifarma_15_ek_test_izlemesini_sifirla.sql çalıştırılmalıdır.
-- Kullanıcı Supabase SQL Editor'da çalıştırır; burada çalıştırılmadı.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.yayin_yonetimi, public.eclub_izleme_kayitlari,
  public.eclub_kazanilan_puanlar IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE hedef_yayinlar (
  yayin_id uuid PRIMARY KEY,
  beklenen_yayin_tarihi_tr timestamp NOT NULL
) ON COMMIT DROP;

-- Önceki 24 kayıtlık sıfırlama SQL'inin sonuç tablosundaki 11 yayın ve tarih.
INSERT INTO hedef_yayinlar (yayin_id, beklenen_yayin_tarihi_tr) VALUES
  ('2135330d-30de-40b2-b4c2-f058e6b9d8c8', '2026-08-16 13:40:49.428'),
  ('339602bd-ec14-4527-b0f0-e43643796c75', '2026-08-19 10:50:39.457'),
  ('4602ddc1-f7f0-4526-9622-26e72593ff6b', '2026-08-15 17:30:43.271'),
  ('5eec3f78-5539-41b0-84a7-3221c86775a9', '2026-08-16 13:44:29.591'),
  ('5fac1701-a348-4a03-852d-f41a6b4f8cb3', '2026-08-15 17:37:32.625'),
  ('797688dd-b65f-43fc-9a99-337e7f41c606', '2026-08-16 12:32:00.016'),
  ('8069cf60-3693-4a5e-9d35-832a10941fae', '2026-08-18 14:32:51.433'),
  ('8d840599-fb1b-4474-8c48-f9014b0009cf', '2026-08-17 21:03:51.334'),
  ('bcdae9cd-4fc7-47be-989e-3be917abbfcf', '2026-08-17 18:43:19.858'),
  ('c19cab66-5332-40f0-8406-58955b03d0ee', '2026-08-16 15:50:57.662'),
  ('d3693736-49ca-43d3-afc8-f61698db9d45', '2026-08-17 15:09:16.25');

DO $kontrol$
BEGIN
  IF (SELECT count(*) FROM hedef_yayinlar) <> 11
     OR to_regclass('public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015') IS NULL
     OR to_regclass('public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015') IS NULL
  THEN
    RAISE EXCEPTION '11 yayınlık hedef veya 24+15 izleme yedeği eksik; işlem başlamadı.';
  END IF;
END;
$kontrol$;

CREATE TEMP TABLE sifirlanan_izlemeler ON COMMIT DROP AS
  SELECT b.izleme_id, (b.veri->>'yayin_id')::uuid AS yayin_id
  FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme'
  UNION ALL
  SELECT b.izleme_id, (b.veri->>'yayin_id')::uuid AS yayin_id
  FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015 b
  WHERE b.kaynak = 'izleme';

ALTER TABLE sifirlanan_izlemeler ADD PRIMARY KEY (izleme_id);

DO $kapsam_kontrol$
BEGIN
  IF (SELECT count(*) FROM sifirlanan_izlemeler) <> 39
     OR (SELECT count(DISTINCT yayin_id) FROM sifirlanan_izlemeler) <> 11
     OR EXISTS (
       SELECT 1 FROM sifirlanan_izlemeler s
       WHERE NOT EXISTS (SELECT 1 FROM hedef_yayinlar h WHERE h.yayin_id = s.yayin_id)
     )
  THEN
    RAISE EXCEPTION '24+15 izleme ve 11 yayın kapsamı uyuşmuyor; işlem başlamadı.';
  END IF;

  IF (SELECT count(*)
      FROM hedef_yayinlar h
      JOIN public.yayin_yonetimi y USING (yayin_id)
      JOIN public.v_yayin_kunye k USING (yayin_id)
      WHERE y.durum = 'yayinda'
        AND y.yayin_tarihi AT TIME ZONE 'Europe/Istanbul' = h.beklenen_yayin_tarihi_tr
        AND k.firma_id = '0c504d88-b9fb-40bb-beae-5bae33cb99ac'::uuid) <> 11
  THEN
    RAISE EXCEPTION 'Yayın durumu, eski tarih veya Hepifarma bağı değişmiş; işlem başlamadı.';
  END IF;

  IF (SELECT count(*)
      FROM sifirlanan_izlemeler s
      JOIN hedef_yayinlar h ON h.yayin_id = s.yayin_id
      JOIN public.eclub_izleme_kayitlari i ON i.izleme_id = s.izleme_id
      JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = i.oneri_id
      WHERE i.yayin_id = h.yayin_id
        AND i.tamamlandi_mi IS FALSE AND i.izleme_bitis IS NULL
        AND o.izlendi_mi IS FALSE) <> 39
     OR (SELECT count(*) FROM public.eclub_hepifarma_p4_24_test_izleme_yedegi_20261015
         WHERE kaynak = 'izleme') <> 24
     OR (SELECT count(*) FROM public.eclub_hepifarma_15_ek_test_izleme_yedegi_20261015
         WHERE kaynak = 'izleme') <> 15
  THEN
    RAISE EXCEPTION '39 test izlemesinin sıfırlama sonucu değişmiş; işlem başlamadı.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.eclub_izleme_kayitlari i
    JOIN hedef_yayinlar h USING (yayin_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM sifirlanan_izlemeler s WHERE s.izleme_id = i.izleme_id
    )
  ) OR EXISTS (
    SELECT 1 FROM public.eclub_kazanilan_puanlar p
    JOIN hedef_yayinlar h USING (yayin_id)
  ) THEN
    RAISE EXCEPTION '11 yayında hedef dışı izleme veya üye puanı var; yayın tarihleri değiştirilmedi.';
  END IF;
END;
$kapsam_kontrol$;

-- Tekrar çalıştırma ve geri dönüş için eski 11 yayın satırını sakla.
CREATE TABLE public.eclub_hepifarma_11_test_yayini_yedegi_20261015 AS
SELECT h.yayin_id, to_jsonb(y) AS veri, transaction_timestamp() AS yedek_at
FROM hedef_yayinlar h
JOIN public.yayin_yonetimi y USING (yayin_id);

REVOKE ALL ON public.eclub_hepifarma_11_test_yayini_yedegi_20261015
  FROM PUBLIC, anon, authenticated;
ALTER TABLE public.eclub_hepifarma_11_test_yayini_yedegi_20261015 ENABLE ROW LEVEL SECURITY;

DO $guncelle$
DECLARE v_sayi integer;
BEGIN
  UPDATE public.yayin_yonetimi y
  SET durum = 'yayinda',
      durdurma_tarihi = NULL,
      yayin_tarihi = transaction_timestamp()
  FROM hedef_yayinlar h
  WHERE y.yayin_id = h.yayin_id;
  GET DIAGNOSTICS v_sayi = ROW_COUNT;

  IF v_sayi <> 11 OR EXISTS (
    SELECT 1 FROM hedef_yayinlar h
    JOIN public.yayin_yonetimi y USING (yayin_id)
    WHERE y.durum IS DISTINCT FROM 'yayinda'
       OR y.durdurma_tarihi IS NOT NULL
       OR y.yayin_tarihi IS DISTINCT FROM transaction_timestamp()
  ) THEN
    RAISE EXCEPTION '11 yayının yeni durumu/tarihi doğrulanamadı; işlem geri alınacak.';
  END IF;
END;
$guncelle$;

COMMIT;

SELECT y.yayin_id, y.durum, y.durdurma_tarihi,
       (b.veri->>'yayin_tarihi')::timestamptz AT TIME ZONE 'Europe/Istanbul' AS eski_yayin_tarihi_tr,
       y.yayin_tarihi AT TIME ZONE 'Europe/Istanbul' AS yeni_yayin_tarihi_tr
FROM public.eclub_hepifarma_11_test_yayini_yedegi_20261015 b
JOIN public.yayin_yonetimi y USING (yayin_id)
ORDER BY y.yayin_id;
