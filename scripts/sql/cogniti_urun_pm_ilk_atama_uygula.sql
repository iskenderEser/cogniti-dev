-- Önce cogniti_urun_pm_atamasi.sql kurulmalıdır.
-- Yalnız paylaşılan önizlemedeki altı ürün–PM eşleşmesini uygular.
BEGIN;

WITH hedef(ad) AS (
  VALUES ('Hepifarma'), ('Mill')
), firma_eslesmeleri AS (
  SELECT h.ad, f.firma_id, f.firma_adi,
         count(f.firma_id) OVER (PARTITION BY h.ad) AS firma_sayisi
  FROM hedef h
  LEFT JOIN public.firmalar f ON lower(btrim(f.firma_adi)) = lower(h.ad)
), pm_adaylari AS (
  SELECT k.kullanici_id, k.firma_id, k.takim_id
  FROM public.kullanicilar k
  JOIN firma_eslesmeleri f ON f.firma_id = k.firma_id AND f.firma_sayisi = 1
  WHERE k.aktif_mi IS TRUE AND lower(k.rol) IN ('pm', 'jr_pm', 'kd_pm')
), firma_pm AS (
  SELECT firma_id, count(*) AS pm_sayisi, (array_agg(kullanici_id))[1] AS tek_pm_id
  FROM pm_adaylari
  GROUP BY firma_id
), urunler AS (
  SELECT f.ad, u.urun_id, u.urun_adi, u.firma_id, u.takim_id,
         -- Kolon henüz eklenmemişse mevcut atama NULL olarak okunur.
         (to_jsonb(u)->>'sorumlu_pm_id')::uuid AS sorumlu_pm_id
  FROM firma_eslesmeleri f
  JOIN public.urunler u ON u.firma_id = f.firma_id
  WHERE f.firma_sayisi = 1
), gecmis AS (
  SELECT u.urun_id,
         array_agg(DISTINCT t.uretici_id ORDER BY t.uretici_id) AS talep_sahipleri
  FROM urunler u
  JOIN public.talepler t ON t.urun_id = u.urun_id AND t.firma_id = u.firma_id
  WHERE u.ad = 'Mill'
    AND t.egitim_turu = 'urun_egitimi'
    AND t.uretici_id IS NOT NULL
    AND t.taslak_mi IS NOT TRUE
    AND t.yayin_oncesi_silme_durumu IS DISTINCT FROM 'tamamlandi'
  GROUP BY u.urun_id
), karar AS (
  SELECT f.ad, f.firma_id, u.urun_id, u.urun_adi, tk.takim_adi,
         u.sorumlu_pm_id, g.talep_sahipleri, aday.kullanici_id AS aday_id,
         CASE
           WHEN f.firma_sayisi = 0 THEN 'Firma bulunamadı'
           WHEN f.firma_sayisi > 1 THEN 'Firma adı birden fazla kayıtla eşleşti'
           WHEN u.urun_id IS NULL THEN 'Firma kataloğunda ürün yok'
           WHEN u.sorumlu_pm_id IS NOT NULL THEN 'Mevcut atama korunur'
           WHEN tk.takim_id IS NULL THEN 'Ürünün firmaya bağlı takımı doğrulanamadı'
           WHEN f.ad = 'Hepifarma' AND coalesce(fp.pm_sayisi, 0) <> 1
             THEN 'Firmada tam bir aktif PM bulunmalı'
           WHEN f.ad = 'Mill' AND g.talep_sahipleri IS NULL THEN 'Geçmiş ürün eğitimi talebi yok'
           WHEN f.ad = 'Mill' AND cardinality(g.talep_sahipleri) > 1 THEN 'Birden fazla geçmiş talep sahibi var'
           WHEN aday.kullanici_id IS NULL THEN 'Aday aktif PM değil veya ürünle aynı takımda değil'
           WHEN f.ad = 'Hepifarma' THEN 'Öneri: firmanın tek aktif PM’si ürünle aynı takımda'
           ELSE 'Öneri: geçmişte tek talep sahibi var ve atamaya uygun'
         END AS gerekce
  FROM firma_eslesmeleri f
  LEFT JOIN urunler u ON u.firma_id = f.firma_id
  LEFT JOIN public.takimlar tk ON tk.takim_id = u.takim_id AND tk.firma_id = u.firma_id
  LEFT JOIN firma_pm fp ON fp.firma_id = f.firma_id
  LEFT JOIN gecmis g ON g.urun_id = u.urun_id
  LEFT JOIN pm_adaylari aday
    ON aday.firma_id = u.firma_id AND aday.takim_id = tk.takim_id
   AND aday.kullanici_id = CASE
     WHEN f.ad = 'Hepifarma' AND fp.pm_sayisi = 1 THEN fp.tek_pm_id
     WHEN f.ad = 'Mill' AND cardinality(g.talep_sahipleri) = 1 THEN g.talep_sahipleri[1]
   END
), hedef_atamalar(urun_id, pm_id) AS (
  VALUES
    ('90c0ca99-8d17-40d9-97d7-5b209bd730b0'::uuid, 'b0838fab-302c-49b3-af44-9bad88945a0f'::uuid),
    ('cb6b9390-b321-440f-9c2f-be9064b4b79c'::uuid, 'b0838fab-302c-49b3-af44-9bad88945a0f'::uuid),
    ('748aa439-159d-4701-ba0d-554082ce0738'::uuid, 'b0838fab-302c-49b3-af44-9bad88945a0f'::uuid),
    ('99c4f678-421c-4fa1-9c09-5f587b89d9fe'::uuid, 'b0838fab-302c-49b3-af44-9bad88945a0f'::uuid),
    ('51d37c2e-2e94-42d0-a29c-5d40e9d545d4'::uuid, 'b0838fab-302c-49b3-af44-9bad88945a0f'::uuid),
    ('7e7202c9-c337-4b33-bf17-73a6b1ce6419'::uuid, 'e39a3a1f-ec80-4c05-b649-158243edbf1b'::uuid)
), guncellenen AS (
  UPDATE public.urunler u
  SET sorumlu_pm_id = h.pm_id
  FROM hedef_atamalar h
  JOIN karar k ON k.urun_id = h.urun_id AND k.aday_id = h.pm_id
  WHERE u.urun_id = h.urun_id AND u.firma_id = k.firma_id
    AND u.sorumlu_pm_id IS NULL
  RETURNING u.urun_id, u.sorumlu_pm_id
)
SELECT k.ad AS firma, k.urun_adi, h.urun_id, h.pm_id,
       CASE WHEN g.urun_id IS NOT NULL THEN 'Atandı'
            WHEN k.sorumlu_pm_id = h.pm_id THEN 'Zaten atanmış'
            WHEN k.sorumlu_pm_id IS NOT NULL THEN 'Mevcut atama korundu'
            ELSE 'Atlanmış: önizleme koşulları yeniden doğrulanmalı'
       END AS sonuc
FROM hedef_atamalar h
LEFT JOIN karar k ON k.urun_id = h.urun_id
LEFT JOIN guncellenen g ON g.urun_id = h.urun_id
ORDER BY k.ad, k.urun_adi;

COMMIT;
