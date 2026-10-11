-- 11 Ekim 2026: Kullanıcının temizlik talimatıyla hazırlanmıştır.
-- Supabase SQL Editor'da TAMAMINI tek parça çalıştırın.
-- Yalnız e130...001-007 talepleri ve e120... üç kart örneğini temizler.
-- Ürün/yayın, kullanıcı ve e110... Hediye Takibi seti korunur.
-- Herhangi bir kontrolde hata olursa iki setin temizliği birlikte geri alınır.
BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-cek-talepleri-gorunum-v1', 0));
SELECT pg_advisory_xact_lock(hashtextextended('eclub-cek-karti-gorunum-v1', 0));
LOCK TABLE public.eclub_store_cek_talepleri, public.eclub_store_puan_devirleri,
  public.eclub_kazanilan_puanlar, public.eclub_izleme_kayitlari,
  public.eclub_cek_teslimat_outbox, public.eclub_bildirimler,
  public.eclub_siparis_utt_onaylari IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE temizlik_sayilari(tur text PRIMARY KEY, adet bigint) ON COMMIT DROP;

-- Önce bağlı görünüm talepleri.
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-cek-talepleri-gorunum-v1', 0));
LOCK TABLE public.eclub_store_cek_talepleri IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE cek_talebi_test_idleri(talep_id uuid PRIMARY KEY) ON COMMIT DROP;
INSERT INTO cek_talebi_test_idleri
SELECT ('e1300000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid FROM generate_series(1,7) n;
DO $kontrol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.eclub_store_cek_talepleri t JOIN cek_talebi_test_idleri x USING(talep_id)
    WHERE t.eczane_id IS DISTINCT FROM '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
      OR t.talep_eden_kisi_id IS DISTINCT FROM '3b0b6c01-428e-4797-a8ad-67d5d2400b5f'::uuid
      OR t.utt_id IS DISTINCT FROM '765b6890-183f-4518-b887-07003ff5cdc7'::uuid
      OR t.donem_kodu NOT IN ('2098-P1','2098-P2','2098-P3','2098-P4','2098-P5','2098-P6','2099-P1')
  ) THEN RAISE EXCEPTION 'Kayıt test kapsamı dışında; temizlik durduruldu.'; END IF;
  IF EXISTS (SELECT 1 FROM public.eclub_cek_teslimat_outbox o JOIN cek_talebi_test_idleri x USING(talep_id))
    OR EXISTS (SELECT 1 FROM public.eclub_bildirimler b JOIN cek_talebi_test_idleri x ON x.talep_id=b.kayit_id WHERE b.kayit_turu='cek')
    OR EXISTS (SELECT 1 FROM public.eclub_siparis_utt_onaylari s JOIN cek_talebi_test_idleri x USING(talep_id))
    OR EXISTS (SELECT 1 FROM public.eclub_store_puan_devirleri d JOIN cek_talebi_test_idleri x
      ON x.talep_id=d.kaynak_talep_id OR x.talep_id=d.kullanilan_talep_id)
  THEN RAISE EXCEPTION 'Test kayıtlarında operasyon bağı var; temizlik durduruldu.'; END IF;
END;
$kontrol$;
DO $ek_kontrol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.eclub_store_cek_talepleri t
    JOIN cek_talebi_test_idleri x USING (talep_id)
    WHERE t.siparis_verildi_mi IS DISTINCT FROM false
       OR t.yayin_id IS DISTINCT FROM CASE right(t.talep_id::text, 1)
         WHEN '1' THEN 'bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50'::uuid
         WHEN '2' THEN '3a6e0db1-bc42-44cf-ab16-b99630681ae9'::uuid
         WHEN '3' THEN 'f364c684-eadc-4ccc-8671-f333da7b555f'::uuid
         WHEN '4' THEN 'bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50'::uuid
         WHEN '5' THEN '3a6e0db1-bc42-44cf-ab16-b99630681ae9'::uuid
         WHEN '6' THEN 'bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50'::uuid
         WHEN '7' THEN 'f364c684-eadc-4ccc-8671-f333da7b555f'::uuid
       END
  ) THEN RAISE EXCEPTION 'Test talebi yayın/sipariş kapsamı değişmiş; işlem geri alındı.'; END IF;
END;
$ek_kontrol$;
WITH silinen AS (
  DELETE FROM public.eclub_store_cek_talepleri t USING cek_talebi_test_idleri x
  WHERE t.talep_id=x.talep_id RETURNING t.talep_id
)
INSERT INTO temizlik_sayilari SELECT 'talep', count(*) FROM silinen;

-- Sonra kart puanları/izlemeleri.
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-cek-karti-gorunum-v1', 0));
LOCK TABLE public.eclub_kazanilan_puanlar, public.eclub_izleme_kayitlari,
  public.eclub_store_puan_devirleri, public.eclub_store_cek_talepleri
  IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE cek_karti_temizlik (
  yayin_id uuid, izleme_id uuid, puan_id uuid, puan integer
) ON COMMIT DROP;
INSERT INTO cek_karti_temizlik VALUES
  ('f364c684-eadc-4ccc-8671-f333da7b555f', 'e1200000-0000-4000-8000-000000000001', 'e1200000-0000-4000-8000-000000000101', 100),
  ('bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50', 'e1200000-0000-4000-8000-000000000002', 'e1200000-0000-4000-8000-000000000102', 300),
  ('3a6e0db1-bc42-44cf-ab16-b99630681ae9', 'e1200000-0000-4000-8000-000000000003', 'e1200000-0000-4000-8000-000000000103', 650);
DO $kontrol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.eclub_store_puan_devirleri d
    JOIN cek_karti_temizlik x ON x.yayin_id = d.yayin_id
    WHERE d.eczane_id = '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
      AND NOT EXISTS (
        SELECT 1 FROM public.eclub_izleme_kayitlari i
        WHERE i.izleme_id = x.izleme_id
          AND i.ilerleme_durumu->>'gorunum_testi' = 'eclub-cek-karti-v1'
      )
  ) THEN RAISE EXCEPTION 'Devrin test kaynağı bulunamadı; temizlik durduruldu.'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.eclub_izleme_kayitlari i
    JOIN cek_karti_temizlik x ON x.izleme_id = i.izleme_id
    WHERE i.kisi_id <> '3b0b6c01-428e-4797-a8ad-67d5d2400b5f'::uuid
      OR i.yayin_id <> x.yayin_id
      OR i.ilerleme_durumu->>'gorunum_testi' IS DISTINCT FROM 'eclub-cek-karti-v1'
  ) OR EXISTS (
    SELECT 1 FROM public.eclub_kazanilan_puanlar p
    JOIN cek_karti_temizlik x ON x.puan_id = p.kazanilan_puan_id
    WHERE p.kisi_id <> '3b0b6c01-428e-4797-a8ad-67d5d2400b5f'::uuid
      OR p.eczane_id <> '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
      OR p.yayin_id <> x.yayin_id OR p.izleme_id <> x.izleme_id OR p.puan <> x.puan
  ) THEN RAISE EXCEPTION 'Test kimlikleri beklenen kapsamda değil; temizlik durduruldu.'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.eclub_store_cek_talepleri t
    JOIN cek_karti_temizlik x ON x.yayin_id = t.yayin_id
    WHERE t.eczane_id = '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
  ) OR EXISTS (
    SELECT 1 FROM public.eclub_kazanilan_puanlar p
    JOIN cek_karti_temizlik x ON x.yayin_id = p.yayin_id
    WHERE p.eczane_id = '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
      AND p.kazanilan_puan_id <> x.puan_id
  ) THEN RAISE EXCEPTION 'Test yayınlarında başka puan/talep oluşmuş; karışık bakiye için temizlik durduruldu.'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.eclub_store_puan_devirleri d
    JOIN cek_karti_temizlik x ON x.yayin_id = d.yayin_id
    WHERE d.eczane_id = '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
      AND (d.puan <> x.puan OR d.kaynak_talep_id IS NOT NULL OR d.kullanilan_talep_id IS NOT NULL)
  ) THEN RAISE EXCEPTION 'Devir kayıtları yalnız test puanından oluşmuyor; temizlik durduruldu.'; END IF;
END;
$kontrol$;
-- Eklerken bu eczane/yayın çiftlerinde devir bulunmadığı doğrulanmıştı.
WITH silinen AS (
DELETE FROM public.eclub_store_puan_devirleri d USING cek_karti_temizlik x
WHERE d.eczane_id = '0d8385df-4eed-429e-b691-81acee1ad606'::uuid AND d.yayin_id = x.yayin_id RETURNING d.*
)
INSERT INTO temizlik_sayilari SELECT 'devir', count(*) FROM silinen;
WITH silinen AS (
DELETE FROM public.eclub_kazanilan_puanlar p USING cek_karti_temizlik x
WHERE p.kazanilan_puan_id = x.puan_id RETURNING p.*
)
INSERT INTO temizlik_sayilari SELECT 'puan', count(*) FROM silinen;
WITH silinen AS (
DELETE FROM public.eclub_izleme_kayitlari i USING cek_karti_temizlik x
WHERE i.izleme_id = x.izleme_id RETURNING i.*
)
INSERT INTO temizlik_sayilari SELECT 'izleme', count(*) FROM silinen;

SELECT 'TAMAMLANDI' AS sql_sonucu,
  (SELECT adet FROM temizlik_sayilari WHERE tur='talep') AS silinen_test_talebi,
  (SELECT adet FROM temizlik_sayilari WHERE tur='puan') AS silinen_test_puani,
  (SELECT adet FROM temizlik_sayilari WHERE tur='izleme') AS silinen_test_izlemesi,
  (SELECT adet FROM temizlik_sayilari WHERE tur='devir') AS silinen_test_devri,
  (SELECT count(*) FROM public.eclub_store_cek_talepleri t
    JOIN cek_talebi_test_idleri x USING(talep_id)) AS kalan_test_talebi,
  (SELECT count(*) FROM public.eclub_kazanilan_puanlar p
    JOIN cek_karti_temizlik x ON x.puan_id=p.kazanilan_puan_id) AS kalan_test_puani;
COMMIT;
