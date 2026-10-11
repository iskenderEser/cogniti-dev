-- Yalnız e140...001-011 Abilon UX görünüm kartlarını temizler.
-- Gerçek yayın/puan/talep ve diğer test setleri korunur. Tablo kaldırılmaz.
BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-tek-urun-11-ux-v1',0));
LOCK TABLE public.eclub_cek_karti_ux_testleri IN SHARE ROW EXCLUSIVE MODE;
DO $kontrol$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.eclub_cek_karti_ux_testleri t
    WHERE t.senaryo_id IN (
      SELECT ('e1400000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid
      FROM generate_series(1,11) n
    ) AND (t.kisi_id IS DISTINCT FROM '3b0b6c01-428e-4797-a8ad-67d5d2400b5f'::uuid
      OR t.eczane_id IS DISTINCT FROM '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
      OR t.urun_id IS DISTINCT FROM '90c0ca99-8d17-40d9-97d7-5b209bd730b0'::uuid
      OR t.kaynak_yayin_id IS DISTINCT FROM 'f364c684-eadc-4ccc-8671-f333da7b555f'::uuid)
  ) THEN RAISE EXCEPTION 'UX test kapsamı değişmiş; temizlik durduruldu.'; END IF;
END;
$kontrol$;
WITH silinen AS (
  DELETE FROM public.eclub_cek_karti_ux_testleri t WHERE t.senaryo_id IN (
    SELECT ('e1400000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid
    FROM generate_series(1,11) n
  ) RETURNING senaryo_id
) SELECT 'TAMAMLANDI' AS sql_sonucu,count(*) AS silinen_ux_karti FROM silinen;
COMMIT;
