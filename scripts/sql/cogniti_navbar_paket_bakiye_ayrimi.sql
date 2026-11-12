-- Kullanıcı çalıştıracak. Ön koşul: abonelik ilk token yükleme ve KKÖ kurulumu.
-- Hesap toplamlarını korur, navbar için paket bazında özet ekler.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_satin_alma_bakiye_ozeti(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_firma uuid; v_kisisel jsonb; v_ortak jsonb;
BEGIN
 SELECT k.firma_id INTO v_firma FROM public.kullanicilar k JOIN public.firmalar f USING(firma_id)
 WHERE k.kullanici_id=p_auth_id AND k.aktif_mi=true AND f.aktif=true
 AND lower(btrim(k.rol)) IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per',
  'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin','tm','bm','utt','kd_utt','iu');
 IF v_firma IS NULL THEN RAISE EXCEPTION 'Token bakiyelerine erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 PERFORM public.cogniti_kko_hesap_yenile(bakiye_id) FROM public.cogniti_satin_alma_bakiyeleri
 WHERE firma_id=v_firma AND (bakiye_turu='firma_ortak' OR sahip_id=p_auth_id) ORDER BY bakiye_id;
 WITH paket_ozetleri AS (
  SELECT b.bakiye_turu,
   jsonb_build_object(
    'paket',CASE WHEN coalesce(h.etkin,false) THEN 'kko' WHEN (y.abonelik_siparis_id IS NOT NULL) THEN 'abonelik' WHEN (y.siparis_id IS NOT NULL) THEN 'esnek' ELSE NULL END,
    'toplam',coalesce(sum(y.miktar),0),
    -- Süre dolması tüketim değildir; tüketim miktarı kalan farkından ayrı hesaplanır.
    -- Kalan henüz tüketilmemiş tokenı temsil eder. Rezervasyon adımında kalan azaltılmadan ayrı tutulmalıdır.
    'kullanilan',coalesce(sum(y.miktar-y.kalan),0),
    'kalan',coalesce(sum(y.kalan-coalesce(bl.adet,0)) FILTER(WHERE y.son_kullanim_at>statement_timestamp()),0),
    'suresi_dolan',coalesce(sum(y.kalan) FILTER(WHERE y.son_kullanim_at<=statement_timestamp()),0),
    'ayrilan',coalesce(sum(bl.adet),0)
   ) AS deger
  FROM public.cogniti_satin_alma_bakiyeleri b
  LEFT JOIN public.cogniti_kko_hesap_secimleri h ON h.bakiye_id=b.bakiye_id
 LEFT JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.bakiye_id=b.bakiye_id AND y.firma_id=b.firma_id
  AND ((coalesce(h.etkin,false) AND y.kko_donem=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date)
    OR (NOT coalesce(h.etkin,false) AND y.kko_donem IS NULL))
  LEFT JOIN LATERAL(SELECT public.cogniti_yukleme_ayrilan(y.yukleme_id) AS adet) bl ON true
  WHERE b.firma_id=v_firma AND (b.bakiye_turu='firma_ortak' OR (b.bakiye_turu='kisisel' AND b.sahip_id=p_auth_id))
  GROUP BY b.bakiye_id,b.bakiye_turu,h.etkin,
   CASE WHEN coalesce(h.etkin,false) THEN 'kko' WHEN (y.abonelik_siparis_id IS NOT NULL) THEN 'abonelik' WHEN (y.siparis_id IS NOT NULL) THEN 'esnek' ELSE NULL END
 ), ozet AS (
  SELECT bakiye_turu,jsonb_build_object(
   'paket',CASE WHEN bool_or(deger->>'paket'='kko') THEN 'kko'
     WHEN bool_or(deger->>'paket'='abonelik') THEN 'abonelik'
     WHEN bool_or(deger->>'paket'='esnek') THEN 'esnek' ELSE NULL END,
   'toplam',sum((deger->>'toplam')::bigint),
   'kullanilan',sum((deger->>'kullanilan')::bigint),
   'kalan',sum((deger->>'kalan')::bigint),
   'suresi_dolan',sum((deger->>'suresi_dolan')::bigint),
   'ayrilan',sum((deger->>'ayrilan')::bigint),
   'paketler',coalesce(jsonb_agg(deger ORDER BY deger->>'paket') FILTER(WHERE deger->>'paket' IS NOT NULL),'[]'::jsonb)
  ) deger FROM paket_ozetleri GROUP BY bakiye_turu
 ) SELECT (SELECT deger FROM ozet WHERE bakiye_turu='kisisel'),(SELECT deger FROM ozet WHERE bakiye_turu='firma_ortak')
 INTO v_kisisel,v_ortak;
 RETURN jsonb_build_object('kisisel',v_kisisel,'firma_ortak',coalesce(v_ortak,jsonb_build_object('paket',NULL,'toplam',0,'kullanilan',0,'kalan',0,'suresi_dolan',0,'ayrilan',0)));
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_navbar_paket_bakiye_ayrimi_kuruldu;
