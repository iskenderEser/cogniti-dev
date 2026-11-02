-- UTT/KD_UTT: Sipariş puanını açıkça çekli seçilen saha yayınlarıyla sınırlar.
-- Supabase SQL Editor'da tamamı çalıştırılır. Canlı kayıt silmez/değiştirmez.
-- Mevcut çeyrek seçimi, E-Club UTT kazanımı, harcama/iade ve BM hesabı korunur.
BEGIN;
DO $bakiye$
DECLARE
  v_kaynak text;
  v_eski constant text := 'WHERE y.cek_karsiligi_var_mi = false';
  v_yeni constant text := $kosul$WHERE (y.cek_karsiligi_var_mi = false
      OR (v_rol IN ('utt','kd_utt') AND y.saha_puan_modeli IS DISTINCT FROM 'tl_karsilikli'))$kosul$;
BEGIN
  v_kaynak := pg_get_functiondef('public.get_harcama_bakiyesi_tarihli(uuid,timestamp with time zone)'::regprocedure);
  IF strpos(v_kaynak, '-- utt-acik-secim-siparis-puani') > 0 THEN RETURN; END IF;
  IF strpos(v_kaynak, '-- saha-tlsiz-net-puan-ayrimi') = 0
     OR strpos(v_kaynak, v_eski) = 0
     OR strpos(v_kaynak, 'v_rol') = 0 THEN
    RAISE EXCEPTION 'Kurulu sipariş bakiyesi beklenen saha puan yapısında değil; hiçbir değişiklik uygulanmadı.';
  END IF;
  v_kaynak := replace(v_kaynak, v_eski, v_yeni);
  v_kaynak := replace(v_kaynak, '-- saha-tlsiz-net-puan-ayrimi', '-- utt-acik-secim-siparis-puani');
  EXECUTE v_kaynak;
END;
$bakiye$;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT strpos(pg_get_functiondef('public.get_harcama_bakiyesi_tarihli(uuid,timestamp with time zone)'::regprocedure),
              '-- utt-acik-secim-siparis-puani') > 0 AS utt_navbar_siparis_puani_hazir;
