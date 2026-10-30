-- PM'nin kendi ürün eğitimi yayınlarının gerçek token tüketimi.
-- Tüketim/bakiye yazmaz. Kullanıcı Supabase SQL Editor'da çalıştırır.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_token_pm_egitim_satirlari(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL
) RETURNS TABLE(
 created_at timestamptz,yayin_id uuid,firma_adi text,talep_no bigint,
 urun text,arac text,rol text,token bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; firma uuid; ids uuid[]; takim uuid;
BEGIN
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 IF coalesce((kapsam->>'pm')::boolean,false) IS NOT TRUE THEN
  RAISE EXCEPTION 'Ürün eğitimi raporu yalnız PM içindir.' USING ERRCODE='42501';
 END IF;
 firma:=(kapsam->>'firma_id')::uuid;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids
 FROM jsonb_array_elements_text(kapsam->'ids');
 IF p_tm IS NOT NULL THEN
  SELECT u.takim_id INTO takim FROM public.kullanicilar u WHERE u.kullanici_id=p_tm;
 END IF;
 RETURN QUERY
 SELECT t.created_at,t.kaynak_id,y.firma_adi::text,y.talep_no::bigint,
  y.urun_adi::text,y.arac_turu::text,coalesce(lower(a.rol),'firma_kullanicisi')::text,t.miktar::bigint
 FROM public.cogniti_token_tuketimleri t
 -- Çoklanan görünüm satırları bir tüketimi çoğaltamaz.
 JOIN LATERAL (
  SELECT v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu
  FROM public.v_yayin_detay v
  WHERE v.yayin_id=t.kaynak_id AND v.firma_id=t.firma_id
   AND v.uretici_id=p_kullanici AND v.egitim_turu='urun_egitimi'
   AND v.arac_turu IN ('video','podcast','gorsel','flip_pdf')
  ORDER BY v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no LIMIT 1
 ) y ON true
 LEFT JOIN public.kullanicilar a ON a.kullanici_id::text=t.alici_kimligi AND a.firma_id=t.firma_id
 LEFT JOIN public.bolgeler b ON b.bolge_id=a.bolge_id
 WHERE t.firma_id=firma AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=p_kullanici
  AND t.islem_turu='yayin' AND t.alici_turu='firma_kullanicisi' AND t.miktar>0
  AND public.cogniti_token_urun_kapsaminda(kapsam,t.kaynak_id,false)
  AND (
   (p_tm IS NULL AND p_bm IS NULL)
   OR (lower(a.rol) IN ('utt','kd_utt') AND a.kullanici_id=ANY(ids))
   OR (lower(a.rol)='bm' AND (p_bm IS NULL OR a.kullanici_id=p_bm)
    AND (p_tm IS NULL OR coalesce(a.takim_id,b.takim_id)=takim))
  );
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_pm_egitim_detay_raporu(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,
 p_sayfa integer DEFAULT 0,p_arac text DEFAULT 'tumu'
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sonuc jsonb;
BEGIN
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 OR p_arac IS NULL
  OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf') THEN
  RAISE EXCEPTION 'Geçersiz ürün eğitimi raporu isteği.' USING ERRCODE='22023';
 END IF;
 WITH ham AS (
  SELECT (s.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,s.*
  FROM public.cogniti_token_pm_egitim_satirlari(p_kullanici,p_tm,p_bm) s
  WHERE p_arac='tumu' OR s.arac=p_arac
 ), gruplar AS (
  SELECT tarih,yayin_id,firma_adi,talep_no,urun,arac,rol,
   count(*)::bigint AS gonderilen,sum(token)::bigint AS token
  FROM ham GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac,rol
 ), sirali AS (
  SELECT g.*,row_number() OVER(ORDER BY tarih DESC,urun NULLS LAST,arac NULLS LAST,rol,yayin_id) AS sira
  FROM gruplar g
 )
 SELECT jsonb_build_object('satirlar',coalesce((SELECT jsonb_agg(jsonb_build_object(
  'id',md5(jsonb_build_array('pm_egitim',p_kullanici,tarih,yayin_id,firma_adi,talep_no,urun,arac,rol)::text),
  'tarih',tarih,'yayin_id',yayin_id,'firma_adi',firma_adi,'talep_no',talep_no,
  'urun',urun,'arac',arac,'rol',rol,'gonderilen',gonderilen,'token',token) ORDER BY sira)
  FROM sirali WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50),'[]'::jsonb),
  'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50)) INTO sonuc;
 RETURN sonuc;
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_pm_egitim_ozeti(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sinir timestamptz; toplam bigint; kapsam jsonb;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 IF coalesce((kapsam->>'pm')::boolean,false) IS NOT TRUE THEN
  RAISE EXCEPTION 'Ürün eğitimi raporu yalnız PM içindir.' USING ERRCODE='42501';
 END IF;
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h
  WHERE h.firma_id=(kapsam->>'firma_id')::uuid AND h.created_at<sinir) THEN
  RETURN jsonb_build_object('token',NULL);
 END IF;
 SELECT coalesce(sum(s.token),0)::bigint INTO toplam
 FROM public.cogniti_token_pm_egitim_satirlari(p_kullanici,p_tm,p_bm) s WHERE s.created_at<sinir;
 RETURN jsonb_build_object('token',toplam);
END $$;

REVOKE ALL ON FUNCTION public.cogniti_token_pm_egitim_satirlari(uuid,uuid,uuid),
 public.cogniti_token_pm_egitim_detay_raporu(uuid,uuid,uuid,integer,text),
 public.cogniti_token_pm_egitim_ozeti(uuid,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_pm_egitim_satirlari(uuid,uuid,uuid),
 public.cogniti_token_pm_egitim_detay_raporu(uuid,uuid,uuid,integer,text),
 public.cogniti_token_pm_egitim_ozeti(uuid,uuid,uuid,timestamptz) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_pm_egitim_detay_raporu(uuid,uuid,uuid,integer,text)') IS NOT NULL
 AND to_regprocedure('public.cogniti_token_pm_egitim_ozeti(uuid,uuid,uuid,timestamptz)') IS NOT NULL
 AS pm_urun_egitimi_token_hazir;
