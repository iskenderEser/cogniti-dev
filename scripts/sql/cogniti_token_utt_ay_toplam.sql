-- Yalnız UTT/Kd.UTT: ay filtresi ve sayfalardan bağımsız iki toplam.
-- Mevcut raporlar, stat kartları, tüketimler ve bakiyeler değiştirilmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_utt_ay_detay_raporu(
 p_kullanici uuid,p_sayfa integer DEFAULT 0,p_gonderi text DEFAULT 'eclub',
 p_arac text DEFAULT 'tumu',p_alici text DEFAULT 'eclub',p_ay date DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; v_kapsam text:='benim'; v_sonuc jsonb;
BEGIN
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000
  OR p_gonderi IS NULL OR p_gonderi NOT IN ('eclub','eczanem')
  OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf','viva')
  OR p_alici IS NULL OR p_alici NOT IN ('eczaci','eczane_teknisyeni','eclub')
  OR (p_gonderi='eczanem' AND p_arac='viva')
  OR (p_ay IS NOT NULL AND (extract(day FROM p_ay)<>1 OR extract(year FROM p_ay) NOT BETWEEN 1 AND 9999)) THEN
  RAISE EXCEPTION 'Geçersiz ay veya detay filtresi.' USING ERRCODE='22023';
 END IF;
 SELECT u.kullanici_id,u.firma_id,u.rol,u.takim_id,u.bolge_id INTO k
 FROM public.kullanicilar u JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND u.aktif_mi=true AND lower(u.rol) IN ('utt','kd_utt');
 IF NOT FOUND THEN RAISE EXCEPTION 'Token detaylarına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id) THEN
 RETURN jsonb_build_object('satirlar','[]'::jsonb,'devami_var',false,'genel_toplam',0,
 'ay_toplami',CASE WHEN p_ay IS NOT NULL THEN 0 END,'ay',to_char(p_ay,'YYYY-MM'));
 END IF;
 IF p_gonderi='eczanem' THEN
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
 ), tum_satirlar AS (
 SELECT md5(jsonb_build_array('eczanem',g.tarih,g.yayin_id,g.arac)::text) AS id,
 g.tarih,g.yayin_id,g.firma_adi,g.talep_no,g.urun,g.arac,'musteri'::text AS rol,
 g.eczane_sayisi,g.gonderilen,g.token FROM gruplar g
 ), secilen AS MATERIALIZED (
 SELECT * FROM tum_satirlar WHERE p_ay IS NULL OR (tarih>=p_ay AND tarih<(p_ay+interval '1 month')::date)
 ), sirali AS (
 SELECT *,row_number() OVER(ORDER BY tarih DESC,urun NULLS LAST,arac NULLS LAST,id) AS sira FROM secilen
 )
 SELECT jsonb_build_object(
 'satirlar',coalesce((SELECT jsonb_agg(to_jsonb(s)-'sira' ORDER BY sira) FROM sirali s
 WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50),'[]'::jsonb),
 'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50),
 'genel_toplam',coalesce((SELECT sum(token) FROM tum_satirlar),0),
 'ay_toplami',CASE WHEN p_ay IS NOT NULL THEN coalesce((SELECT sum(token) FROM secilen),0) END,
 'ay',to_char(p_ay,'YYYY-MM')) INTO v_sonuc;
 ELSE
 WITH yetkili AS (
  SELECT t.* FROM public.cogniti_token_tuketimleri t
  LEFT JOIN public.kullanicilar g ON t.gonderen_turu='firma_kullanicisi' AND g.kullanici_id=t.gonderen_id AND g.firma_id=t.firma_id
  WHERE t.firma_id=k.firma_id AND t.miktar>0 AND (p_gonderi='tumu' OR t.islem_turu='eclub_oneri'
   OR (t.islem_turu IN ('viva_sure','viva_davet') AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=k.kullanici_id)) AND (
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
   ve.baslik AS yayin_adi,
   CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN
    (SELECT u.urun_adi FROM public.urunler u WHERE u.urun_id=ve.urun_id AND u.firma_id=t.firma_id)
    ELSE y.urun_adi END AS urun,
   CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN 'viva' ELSE y.arac_turu END AS arac,
   CASE WHEN t.islem_turu='viva_sure' THEN 'viva_katilim'
    WHEN t.alici_turu='firma_kullanicisi' THEN coalesce(lower(a.rol),'firma_kullanicisi')
    WHEN t.alici_turu='eclub_kisi' THEN coalesce(lower(e.rol),'eclub_uyesi')
    WHEN t.alici_turu='eczanem_musteri' THEN 'musteri'
    WHEN t.alici_turu='viva_ozel_davetli' THEN 'ozel_davetli' ELSE t.alici_turu END AS rol,
   CASE WHEN t.islem_turu='viva_sure' THEN NULL::bigint ELSE 1::bigint END AS gonderilen,
   t.miktar
  FROM yetkili t
  LEFT JOIN public.viva_etkinlikler ve ON t.islem_turu IN ('viva_sure','viva_davet') AND ve.etkinlik_id=t.kaynak_id AND ve.firma_id=t.firma_id
  -- Silinmiş yayın tüketim kaydını ortadan kaldırmaz. Görünümde mükerrer satır olsa da tüketim katlanmaz.
  LEFT JOIN LATERAL (SELECT v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no FROM public.v_yayin_detay v
   WHERE v.yayin_id=t.kaynak_id AND v.firma_id=t.firma_id AND t.islem_turu NOT IN ('viva_sure','viva_davet')
   ORDER BY v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no LIMIT 1) y ON true
  LEFT JOIN public.kullanicilar a ON t.alici_turu='firma_kullanicisi' AND a.kullanici_id::text=t.alici_kimligi AND a.firma_id=t.firma_id
  LEFT JOIN public.eclub_kisiler e ON t.alici_turu='eclub_kisi' AND e.kisi_id::text=t.alici_kimligi
 ), gruplar AS (
  SELECT tarih,yayin_id,firma_adi,talep_no,urun,arac,rol,max(yayin_adi) AS yayin_adi,bool_and(eclub_gonderisi) AS eclub_gonderisi,sum(gonderilen)::bigint AS gonderilen,sum(miktar)::bigint AS token
  FROM ham WHERE arac IS DISTINCT FROM 'viva' AND (p_arac='tumu' OR arac=p_arac)
 AND (
  -- UTT alıcı sekmeleri yayının hedef kitlesini değil, gerçek gönderimin alıcı rolünü süzer.
  (arac<>'viva' AND (
    (p_alici='eczaci' AND rol IN ('eczaci','ikinci_eczaci','yardimci_eczaci'))
    OR (p_alici='eczane_teknisyeni' AND rol='eczane_teknisyeni')
    OR (p_alici='eclub' AND rol IN ('eczaci','ikinci_eczaci','yardimci_eczaci','eczane_teknisyeni'))
  ))
  OR (arac='viva' AND (
    (p_alici IN ('eczaci','eclub') AND EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')))
    OR (p_alici='eczane_teknisyeni' AND NOT EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')))
  ) AND (
    (p_alici IN ('eczane_teknisyeni','eclub') AND EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol)='eczane_teknisyeni'))
    OR (p_alici='eczaci' AND NOT EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol)='eczane_teknisyeni'))
  ))
 ) GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac,rol
 ), tum_satirlar AS (
 SELECT md5(jsonb_build_array(g.tarih,g.yayin_id,g.firma_adi,g.talep_no,g.urun,g.arac,g.rol)::text) AS id,
 g.tarih,CASE WHEN g.eclub_gonderisi THEN g.yayin_id ELSE NULL END AS yayin_id,
 g.firma_adi,g.talep_no,g.urun,g.arac,g.rol,g.gonderilen,g.token,g.yayin_adi,
 NULL::text[] AS davetli_turleri,NULL::bigint AS davetli_sayisi,NULL::integer AS katilim_sayisi
 FROM gruplar g
 UNION ALL
 SELECT v.id,v.tarih,v.yayin_id,NULL::text,NULL::integer,v.urun,v.arac,v.rol,v.gonderilen,v.token,
 v.yayin_adi,v.davetli_turleri,v.davetli_sayisi,v.katilim_sayisi
 FROM public.cogniti_token_viva_rapor_satirlari(p_kullanici,p_alici,'benim',NULL,NULL,NULL) v
 WHERE p_arac IN ('tumu','viva')
 ), secilen AS MATERIALIZED (
 SELECT * FROM tum_satirlar WHERE p_ay IS NULL OR (tarih>=p_ay AND tarih<(p_ay+interval '1 month')::date)
 ), sirali AS (
 SELECT *,row_number() OVER(ORDER BY tarih DESC,urun NULLS LAST,arac NULLS LAST,id) AS sira FROM secilen
 )
 SELECT jsonb_build_object(
 'satirlar',coalesce((SELECT jsonb_agg(to_jsonb(s)-'sira' ORDER BY sira) FROM sirali s
 WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50),'[]'::jsonb),
 'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50),
 'genel_toplam',coalesce((SELECT sum(token) FROM tum_satirlar),0),
 'ay_toplami',CASE WHEN p_ay IS NOT NULL THEN coalesce((SELECT sum(token) FROM secilen),0) END,
 'ay',to_char(p_ay,'YYYY-MM')) INTO v_sonuc;
 END IF;
 RETURN v_sonuc;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_utt_ay_detay_raporu(uuid,integer,text,text,text,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_utt_ay_detay_raporu(uuid,integer,text,text,text,date) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS utt_token_ay_toplam_hazir;
