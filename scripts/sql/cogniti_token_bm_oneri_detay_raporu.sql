-- BM'nin kendi UTT önerileri. Yalnız raporlama; tüketim veya bakiye değiştirmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_bm_oneri_detay_raporu(
 p_kullanici uuid,p_sayfa integer DEFAULT 0,p_arac text DEFAULT 'tumu'
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE firma uuid; sonuc jsonb;
BEGIN
 IF p_kullanici IS NULL OR p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000
  OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf') THEN
  RAISE EXCEPTION 'Geçersiz öneri raporu isteği.' USING ERRCODE='22023';
 END IF;
 SELECT u.firma_id INTO firma FROM public.kullanicilar u
 JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND lower(u.rol)='bm' AND u.aktif_mi=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Öneri raporuna erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 WITH ham AS (
  SELECT (t.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,t.kaynak_id AS yayin_id,
   y.firma_adi,y.talep_no,y.urun_adi AS urun,y.arac_turu AS arac,t.miktar
  FROM public.cogniti_token_tuketimleri t
  LEFT JOIN LATERAL (
   SELECT v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu FROM public.v_yayin_detay v
   WHERE v.yayin_id=t.kaynak_id AND v.firma_id=t.firma_id
   ORDER BY v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no LIMIT 1
  ) y ON true
  WHERE t.firma_id=firma AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=p_kullanici
   AND t.islem_turu='tclub_oneri' AND t.alici_turu='firma_kullanicisi' AND t.miktar>0
 ), gruplar AS (
  SELECT tarih,yayin_id,firma_adi,talep_no,urun,arac,count(*)::bigint AS gonderilen,sum(miktar)::bigint AS token
  FROM ham WHERE p_arac='tumu' OR arac=p_arac
  GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac
 ), sirali AS (
  SELECT g.*,row_number() OVER(ORDER BY tarih DESC,urun NULLS LAST,arac NULLS LAST,yayin_id) AS sira
  FROM gruplar g
 )
 SELECT jsonb_build_object('satirlar',coalesce((SELECT jsonb_agg(jsonb_build_object(
  'id',md5(jsonb_build_array('bm_oneri',p_kullanici,tarih,yayin_id,firma_adi,talep_no,urun,arac)::text),
  'tarih',tarih,'yayin_id',yayin_id,'firma_adi',firma_adi,'talep_no',talep_no,
  'urun',urun,'arac',arac,'rol','utt','gonderilen',gonderilen,'token',token) ORDER BY sira)
  FROM sirali WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50),'[]'::jsonb),
  'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50)) INTO sonuc;
 RETURN sonuc;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_bm_oneri_detay_raporu(uuid,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_bm_oneri_detay_raporu(uuid,integer,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_bm_oneri_detay_raporu(uuid,integer,text)') IS NOT NULL AS bm_oneri_raporu_hazir;
