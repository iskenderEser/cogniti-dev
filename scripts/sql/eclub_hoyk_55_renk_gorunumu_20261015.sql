-- Yalnız 15 Ekim 2026 HOYK renk görünümü denemesi için.
-- 55 eski gönderimin 10'u değiştirilmez; diğer 45'i 15'erli renk gruplarına ayrılır.
-- Koruma tetikleri bu transaction içinde sadece bu tarih güncellemesi için geçici kapatılır.
-- Canlı gönderim geçmişi ve 15 günlük iş kuralı bu 45 test kaydında değişir.

BEGIN;
SET LOCAL timezone = 'Europe/Istanbul';
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.eclub_oneri_kayitlari IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE _hoyk_55_hedef ON COMMIT DROP AS
WITH imzalar(yayin_id, baslangic_tr, beklenen_adet) AS (
  VALUES
    ('8d840599-fb1b-4474-8c48-f9014b0009cf'::uuid, timestamp '2026-09-16 12:34:05.249', 1),
    ('339602bd-ec14-4527-b0f0-e43643796c75'::uuid, timestamp '2026-09-16 12:33:45.47', 4),
    ('797688dd-b65f-43fc-9a99-337e7f41c606'::uuid, timestamp '2026-08-19 12:05:01.727', 5),
    ('2135330d-30de-40b2-b4c2-f058e6b9d8c8'::uuid, timestamp '2026-08-19 12:04:54.587', 5),
    ('c19cab66-5332-40f0-8406-58955b03d0ee'::uuid, timestamp '2026-08-19 12:04:40.801', 5),
    ('339602bd-ec14-4527-b0f0-e43643796c75'::uuid, timestamp '2026-08-19 11:08:13.635', 4),
    ('8069cf60-3693-4a5e-9d35-832a10941fae'::uuid, timestamp '2026-08-18 14:33:41.496', 4),
    ('5eec3f78-5539-41b0-84a7-3221c86775a9'::uuid, timestamp '2026-08-18 14:09:25.603', 9),
    ('8d840599-fb1b-4474-8c48-f9014b0009cf'::uuid, timestamp '2026-08-17 21:04:36.146', 4),
    ('bcdae9cd-4fc7-47be-989e-3be917abbfcf'::uuid, timestamp '2026-08-17 20:12:53.245', 2),
    ('d3693736-49ca-43d3-afc8-f61698db9d45'::uuid, timestamp '2026-08-17 16:56:08.093', 4),
    ('4602ddc1-f7f0-4526-9622-26e72593ff6b'::uuid, timestamp '2026-08-17 15:07:10.879', 4),
    ('5fac1701-a348-4a03-852d-f41a6b4f8cb3'::uuid, timestamp '2026-08-17 09:37:14.122', 3),
    ('5fac1701-a348-4a03-852d-f41a6b4f8cb3'::uuid, timestamp '2026-08-16 20:28:27.454', 1)
)
SELECT o.oneri_id, o.yayin_id, o.oneri_baslangic, o.oneri_bitis, o.plan_id,
       i.baslangic_tr, i.beklenen_adet
FROM public.eclub_oneri_kayitlari AS o
JOIN imzalar AS i
  ON i.yayin_id = o.yayin_id
 AND i.baslangic_tr = (o.oneri_baslangic AT TIME ZONE 'Europe/Istanbul');

DO $kontrol$
DECLARE
  v_tetik_sayisi integer;
BEGIN
  IF CURRENT_DATE <> DATE '2026-10-15' THEN
    RAISE EXCEPTION 'Bu SQL yalnız 15 Ekim 2026 Türkiye tarihinde çalıştırılabilir.';
  END IF;
  IF (SELECT count(*) FROM _hoyk_55_hedef) <> 55 THEN
    RAISE EXCEPTION 'Beklenen 55 kayıt eşleşmedi; hiçbir veri değiştirilmeyecek.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM _hoyk_55_hedef
    GROUP BY yayin_id, baslangic_tr, beklenen_adet
    HAVING count(*) <> beklenen_adet
  ) THEN
    RAISE EXCEPTION 'Yayın/tarih grubunun kayıt sayısı paylaşılan sonuçtan farklı.';
  END IF;
  IF EXISTS (SELECT 1 FROM _hoyk_55_hedef WHERE plan_id IS NOT NULL OR oneri_bitis >= clock_timestamp()) THEN
    RAISE EXCEPTION 'Hedefler arasında planlı veya henüz süresi dolmamış gönderim var.';
  END IF;
  SELECT count(*) INTO v_tetik_sayisi FROM pg_trigger
  WHERE tgrelid = 'public.eclub_oneri_kayitlari'::regclass
    AND tgname IN ('trg_eclub_gonderim_oneri_kapisi', 'trg_eclub_gonderim_sure_kapisi')
    AND tgenabled = 'O';
  IF v_tetik_sayisi <> 2 THEN
    RAISE EXCEPTION 'Beklenen iki koruma tetiği etkin değil.';
  END IF;
END;
$kontrol$;

CREATE TEMP TABLE _hoyk_55_dagilim ON COMMIT DROP AS
WITH sirali AS (
  SELECT h.*, row_number() OVER (ORDER BY random(), h.oneri_id) AS sira
  FROM _hoyk_55_hedef AS h
)
SELECT s.oneri_id, s.yayin_id, s.oneri_baslangic AS eski_baslangic,
       s.oneri_bitis AS eski_bitis,
       CASE
         WHEN s.sira <= 10 THEN 'degismeyen_kirmizi'
         WHEN s.sira <= 25 THEN 'yesil'
         WHEN s.sira <= 40 THEN 'sari'
         ELSE 'kirmiziya_yaklasan'
       END AS renk_grubu,
       CASE
         WHEN s.sira <= 10 THEN s.oneri_baslangic
         WHEN s.sira <= 25 THEN (timestamp '2026-10-11 00:00:00' + random() * interval '4 days') AT TIME ZONE 'Europe/Istanbul'
         WHEN s.sira <= 40 THEN (timestamp '2026-10-06 00:00:00' + random() * interval '3 days') AT TIME ZONE 'Europe/Istanbul'
         ELSE (timestamp '2026-10-01 00:00:00' + random() * interval '3 days') AT TIME ZONE 'Europe/Istanbul'
       END AS yeni_baslangic,
       CASE WHEN s.sira <= 10 THEN s.oneri_bitis
            ELSE timestamptz '2026-10-19 23:59:59+03' END AS yeni_bitis
FROM sirali AS s;

-- Aynı adla tablo varsa tekrar çalıştırma durur; önceki yedek ezilmez.
CREATE TABLE public.eclub_hoyk_renk_deneme_yedek_20261015 AS
SELECT * FROM _hoyk_55_dagilim;
ALTER TABLE public.eclub_hoyk_renk_deneme_yedek_20261015 ADD PRIMARY KEY (oneri_id);
REVOKE ALL ON TABLE public.eclub_hoyk_renk_deneme_yedek_20261015 FROM PUBLIC, anon, authenticated;
ALTER TABLE public.eclub_hoyk_renk_deneme_yedek_20261015 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.eclub_oneri_kayitlari DISABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;
ALTER TABLE public.eclub_oneri_kayitlari DISABLE TRIGGER trg_eclub_gonderim_sure_kapisi;

DO $guncelle$
DECLARE v_degisen integer;
BEGIN
  UPDATE public.eclub_oneri_kayitlari AS o
     SET oneri_baslangic = d.yeni_baslangic,
         oneri_bitis = d.yeni_bitis
    FROM _hoyk_55_dagilim AS d
   WHERE o.oneri_id = d.oneri_id
     AND d.renk_grubu <> 'degismeyen_kirmizi'
     AND o.oneri_baslangic = d.eski_baslangic
     AND o.oneri_bitis = d.eski_bitis;
  GET DIAGNOSTICS v_degisen = ROW_COUNT;
  IF v_degisen <> 45 THEN
    RAISE EXCEPTION '45 yerine % kayıt değişti; tüm işlem geri alınacak.', v_degisen;
  END IF;
END;
$guncelle$;

-- Ertelenmiş plan/öneri doğrulaması tamamlanmadan ALTER TABLE yapılamaz.
SET CONSTRAINTS ALL IMMEDIATE;

ALTER TABLE public.eclub_oneri_kayitlari ENABLE TRIGGER trg_eclub_gonderim_sure_kapisi;
ALTER TABLE public.eclub_oneri_kayitlari ENABLE TRIGGER trg_eclub_gonderim_oneri_kapisi;

DO $son_kontrol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.eclub_hoyk_renk_deneme_yedek_20261015 AS d
    JOIN public.eclub_oneri_kayitlari AS o USING (oneri_id)
    WHERE o.oneri_baslangic IS DISTINCT FROM d.yeni_baslangic
       OR o.oneri_bitis IS DISTINCT FROM d.yeni_bitis
  ) THEN
    RAISE EXCEPTION 'Güncellenen kayıtlar beklenen tarihlerle uyuşmuyor.';
  END IF;
END;
$son_kontrol$;

COMMIT;

SELECT renk_grubu, count(*) AS kayit_sayisi,
       min(yeni_baslangic AT TIME ZONE 'Europe/Istanbul') AS ilk_baslangic_tr,
       max(yeni_baslangic AT TIME ZONE 'Europe/Istanbul') AS son_baslangic_tr
FROM public.eclub_hoyk_renk_deneme_yedek_20261015
GROUP BY renk_grubu
ORDER BY renk_grubu;
