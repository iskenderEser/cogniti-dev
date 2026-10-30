-- Eczanem Detayları: yalnız token tüketilmiş müşteri gönderimlerinin gün / yayın / araç özeti.
-- Kullanıcı Supabase SQL Editor'da çalıştırır. Kayıt veya tüketim oluşturmaz.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_eczanem_detay_raporu(
 p_kullanici uuid,p_sayfa integer DEFAULT 0,p_arac text DEFAULT 'tumu'
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; v_sonuc jsonb;
BEGIN
 IF p_kullanici IS NULL OR p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000
  OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf','viva') THEN
  RAISE EXCEPTION 'Geçersiz detay isteği.' USING ERRCODE='22023';
 END IF;
 SELECT u.kullanici_id,u.firma_id INTO k
 FROM public.kullanicilar u JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND u.aktif_mi=true AND lower(u.rol) IN ('utt','kd_utt');
 IF NOT FOUND THEN RAISE EXCEPTION 'Eczanem detaylarına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;

 WITH ham AS (
  SELECT (eg.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,eg.yayin_id,
   eg.eczane_id,eg.musteri_id,y.firma_adi,y.talep_no,y.urun_adi AS urun,
   coalesce(eg.arac_turu,y.arac_turu) AS arac,tok.token
  FROM public.eczanem_gonderimler eg
  JOIN public.eczanem_eczane_gonderimleri d ON d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
   AND d.gonderen_utt_id=k.kullanici_id AND d.created_at<=eg.created_at
  -- Gönderimi yapan UTT sabit kayıttan okunur; güncel eczane bağı sahipliği değiştirmez.
  LEFT JOIN LATERAL (
   SELECT v.yayin_id,v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu FROM public.v_yayin_detay v
   WHERE v.yayin_id=eg.yayin_id AND v.firma_id=k.firma_id
   ORDER BY v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu LIMIT 1
  ) y ON true
  LEFT JOIN LATERAL (
   SELECT sum(t.miktar)::bigint AS token
   FROM public.cogniti_token_tuketimleri t
   WHERE t.firma_id=k.firma_id AND t.islem_turu='eczanem_musteri'
    AND t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND t.kaynak_id=eg.yayin_id
    AND t.gonderen_turu='eclub_kisi' AND t.gonderen_id=eg.gonderen_kisi_id
    AND t.alici_turu='eczanem_musteri' AND t.alici_kimligi=eg.musteri_id::text
  ) tok ON true
  -- Aynı tüketimli gönderimler hem eczane/üye sayılarına hem token toplamına girer.
  -- Eksik veya sıfır tüketimli gönderimler gruplama ve sayfalama öncesinde elenir.
  WHERE tok.token>0
 ), gruplar AS (
  SELECT tarih,yayin_id,firma_adi,talep_no,urun,arac,
   count(DISTINCT eczane_id)::bigint AS eczane_sayisi,
   count(DISTINCT musteri_id)::bigint AS gonderilen,sum(token)::bigint AS token
  FROM ham WHERE p_arac='tumu' OR arac=p_arac
  GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac
 ), sirali AS (
  SELECT *,row_number() OVER(ORDER BY tarih DESC,urun NULLS LAST,arac NULLS LAST,yayin_id) AS sira FROM gruplar
 ), sayfa AS (
  SELECT * FROM sirali WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50
 )
 SELECT jsonb_build_object(
  'satirlar',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'id',md5(jsonb_build_array('eczanem',tarih,yayin_id,arac)::text),'tarih',tarih,'yayin_id',yayin_id,
   'firma_adi',firma_adi,'talep_no',talep_no,'urun',urun,'arac',arac,'rol','musteri',
   'eczane_sayisi',eczane_sayisi,'gonderilen',gonderilen,'token',token) ORDER BY sira) FROM sayfa),'[]'::jsonb),
  'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50)
 ) INTO v_sonuc;
 RETURN v_sonuc;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_eczanem_detay_raporu(uuid,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_eczanem_detay_raporu(uuid,integer,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_eczanem_detay_raporu(uuid,integer,text)') IS NOT NULL AS eczanem_token_detay_raporu_kuruldu;
