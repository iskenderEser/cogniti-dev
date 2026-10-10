-- Yalnız e130...001–007 Çek Talepleri görünüm kayıtları.
-- Kullanıcı temizlik talimatı vermeden çalıştırılmaz.
BEGIN;
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
WITH silinen AS (
  DELETE FROM public.eclub_store_cek_talepleri t USING cek_talebi_test_idleri x
  WHERE t.talep_id=x.talep_id RETURNING t.talep_id
)
SELECT 'TAMAMLANDI' AS sql_sonucu,count(*) AS silinen_test_talebi FROM silinen;
COMMIT;
