-- KULLANICI ÇALIŞTIRACAK. Adım 1 satın alma tabloları kurulu olmalıdır.
-- Salt okuma: eski KKÖ ve tüketim kayıtlarını değiştirmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_satin_alma_bakiye_ozeti(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_firma uuid; v_kisisel jsonb; v_ortak jsonb;
BEGIN
 SELECT k.firma_id INTO v_firma FROM public.kullanicilar k JOIN public.firmalar f USING(firma_id)
 WHERE k.kullanici_id=p_auth_id AND k.aktif_mi=true AND f.aktif=true
 AND lower(btrim(k.rol)) IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per',
  'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin','tm','bm','utt','kd_utt','iu');
 IF v_firma IS NULL THEN RAISE EXCEPTION 'Token bakiyelerine erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 WITH ozet AS (
  SELECT b.bakiye_turu,
   jsonb_build_object(
    'paket',CASE WHEN coalesce(sum(y.miktar),0)>0 THEN 'esnek' ELSE NULL END,
    'toplam',coalesce(sum(y.miktar),0),
    -- Süre dolması tüketim değildir; tüketim miktarı kalan farkından ayrı hesaplanır.
    -- Kalan henüz tüketilmemiş tokenı temsil eder. Rezervasyon adımında kalan azaltılmadan ayrı tutulmalıdır.
    'kullanilan',coalesce(sum(y.miktar-y.kalan),0),
    'kalan',coalesce(sum(y.kalan) FILTER(WHERE y.son_kullanim_at>statement_timestamp()),0),
    'suresi_dolan',coalesce(sum(y.kalan) FILTER(WHERE y.son_kullanim_at<=statement_timestamp()),0),
    'ayrilan',0
   ) AS deger
  FROM public.cogniti_satin_alma_bakiyeleri b
  LEFT JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.bakiye_id=b.bakiye_id AND y.firma_id=b.firma_id
  WHERE b.firma_id=v_firma AND (b.bakiye_turu='firma_ortak' OR (b.bakiye_turu='kisisel' AND b.sahip_id=p_auth_id))
  GROUP BY b.bakiye_id,b.bakiye_turu
 ) SELECT (SELECT deger FROM ozet WHERE bakiye_turu='kisisel'),(SELECT deger FROM ozet WHERE bakiye_turu='firma_ortak')
 INTO v_kisisel,v_ortak;
 RETURN jsonb_build_object('kisisel',v_kisisel,'firma_ortak',coalesce(v_ortak,jsonb_build_object('paket',NULL,'toplam',0,'kullanilan',0,'kalan',0,'suresi_dolan',0,'ayrilan',0)));
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_token_bakiye_ozeti_adim2_kuruldu;
