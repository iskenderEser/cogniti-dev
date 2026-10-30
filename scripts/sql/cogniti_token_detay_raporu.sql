-- Token Kullanım Detayları: Türkiye günü / yayın / ürün / araç / alıcı rolü özeti.
-- Supabase SQL Editor'da kullanıcı çalıştırır. Mevcut tüketimleri değiştirmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_detay_raporu(p_kullanici uuid,p_sayfa integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; v_kapsam text; v_sonuc jsonb;
BEGIN
 IF p_kullanici IS NULL OR p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 THEN
  RAISE EXCEPTION 'Geçersiz detay isteği.' USING ERRCODE='22023';
 END IF;
 SELECT u.kullanici_id,u.firma_id,u.rol,u.takim_id,u.bolge_id INTO k
 FROM public.kullanicilar u JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND u.aktif_mi=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Token detaylarına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id) THEN
  RETURN jsonb_build_object('satirlar','[]'::jsonb,'devami_var',false);
 END IF;
 v_kapsam:=CASE WHEN lower(k.rol) IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm') THEN 'firma'
  WHEN lower(k.rol)='tm' AND k.takim_id IS NOT NULL THEN 'takim'
  WHEN lower(k.rol)='bm' AND k.bolge_id IS NOT NULL AND k.takim_id IS NOT NULL THEN 'bolge' ELSE 'benim' END;

 WITH yetkili AS (
  SELECT t.* FROM public.cogniti_token_tuketimleri t
  LEFT JOIN public.kullanicilar g ON t.gonderen_turu='firma_kullanicisi' AND g.kullanici_id=t.gonderen_id AND g.firma_id=t.firma_id
  WHERE t.firma_id=k.firma_id AND (
   (t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=k.kullanici_id) OR v_kapsam='firma'
   OR (t.gonderen_turu='firma_kullanicisi' AND g.firma_id=k.firma_id AND
    ((v_kapsam='takim' AND g.takim_id=k.takim_id) OR (v_kapsam='bolge' AND g.bolge_id=k.bolge_id AND g.takim_id=k.takim_id)))
   OR (t.gonderen_turu='eclub_kisi' AND v_kapsam IN ('takim','bolge') AND EXISTS (
    SELECT 1 FROM public.eczanem_gonderimler eg
    JOIN public.eclub_eczane_firma ef ON ef.eczane_id=eg.eczane_id AND ef.firma_id=t.firma_id AND ef.aktif_mi=true
    JOIN public.kullanicilar u ON u.kullanici_id=ef.baglayan_utt_id AND u.firma_id=t.firma_id
    WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND
     ((v_kapsam='takim' AND u.takim_id=k.takim_id) OR (v_kapsam='bolge' AND u.takim_id=k.takim_id AND u.bolge_id=k.bolge_id)))))
 ), ham AS (
  SELECT (t.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,t.kaynak_id AS yayin_id,
   y.firma_adi,y.talep_no,t.islem_turu='eclub_oneri' AS eclub_gonderisi,
   CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN NULL ELSE y.urun_adi END AS urun,
   CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN 'viva' ELSE y.arac_turu END AS arac,
   CASE WHEN t.islem_turu='viva_sure' THEN 'viva_katilim'
    WHEN t.alici_turu='firma_kullanicisi' THEN coalesce(lower(a.rol),'firma_kullanicisi')
    WHEN t.alici_turu='eclub_kisi' THEN coalesce(lower(e.rol),'eclub_uyesi')
    WHEN t.alici_turu='eczanem_musteri' THEN 'musteri'
    WHEN t.alici_turu='viva_ozel_davetli' THEN 'ozel_davetli' ELSE t.alici_turu END AS rol,
   CASE WHEN t.islem_turu='viva_sure' THEN NULL::bigint ELSE 1::bigint END AS gonderilen,
   t.miktar
  FROM yetkili t
  -- Silinmiş yayın tüketim kaydını ortadan kaldırmaz. Görünümde mükerrer satır olsa da tüketim katlanmaz.
  LEFT JOIN LATERAL (SELECT v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no FROM public.v_yayin_detay v
   WHERE v.yayin_id=t.kaynak_id AND v.firma_id=t.firma_id AND t.islem_turu NOT IN ('viva_sure','viva_davet')
   ORDER BY v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no LIMIT 1) y ON true
  LEFT JOIN public.kullanicilar a ON t.alici_turu='firma_kullanicisi' AND a.kullanici_id::text=t.alici_kimligi AND a.firma_id=t.firma_id
  LEFT JOIN public.eclub_kisiler e ON t.alici_turu='eclub_kisi' AND e.kisi_id::text=t.alici_kimligi
 ), gruplar AS (
  SELECT tarih,yayin_id,firma_adi,talep_no,urun,arac,rol,bool_and(eclub_gonderisi) AS eclub_gonderisi,sum(gonderilen)::bigint AS gonderilen,sum(miktar)::bigint AS token
  FROM ham GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac,rol
 ), sirali AS (
  SELECT *,row_number() OVER(ORDER BY tarih DESC,urun NULLS LAST,arac NULLS LAST,rol,yayin_id) AS sira
  FROM gruplar
 ), sayfa AS (
  SELECT * FROM sirali WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50
 )
 SELECT jsonb_build_object(
  'satirlar',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'id',md5(jsonb_build_array(tarih,yayin_id,firma_adi,talep_no,urun,arac,rol)::text),'tarih',tarih,
   'yayin_id',CASE WHEN eclub_gonderisi THEN yayin_id ELSE NULL END,
   'firma_adi',firma_adi,'talep_no',talep_no,'urun',urun,'arac',arac,'rol',rol,
   'gonderilen',gonderilen,'token',token) ORDER BY sira) FROM sayfa),'[]'::jsonb),
  'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50)
 ) INTO v_sonuc;
 RETURN v_sonuc;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_detay_raporu(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_detay_raporu(uuid,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_detay_raporu(uuid,integer)') IS NOT NULL AS token_detay_raporu_kuruldu;
