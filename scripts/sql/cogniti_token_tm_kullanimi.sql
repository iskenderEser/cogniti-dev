-- TM Token Kullanımı: takım toplamı, seçilen BM bölgesi veya bölgenin seçilen UTT'si.
-- Kullanıcı Supabase SQL Editor'da çalıştırır. Tüketim, davet veya bakiye yazmaz.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_tm_kapsami(p_kullanici uuid,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; v_bolge uuid; v_bmler jsonb; v_uttler jsonb; v_ids jsonb;
BEGIN
 SELECT u.firma_id,u.takim_id INTO k FROM public.kullanicilar u
 JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND lower(u.rol)='tm' AND u.aktif_mi=true AND u.takim_id IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'TM token kapsamına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('bm_id',u.kullanici_id,'bm_adi',btrim(u.ad||' '||u.soyad))
  ORDER BY u.ad,u.soyad,u.kullanici_id),'[]'::jsonb) INTO v_bmler
 FROM public.kullanicilar u WHERE u.firma_id=k.firma_id AND u.takim_id=k.takim_id
  AND lower(u.rol)='bm' AND u.aktif_mi=true AND u.bolge_id IS NOT NULL;
 IF p_bm IS NOT NULL THEN
  SELECT u.bolge_id INTO v_bolge FROM public.kullanicilar u
   WHERE u.kullanici_id=p_bm AND u.firma_id=k.firma_id AND u.takim_id=k.takim_id
    AND lower(u.rol)='bm' AND u.aktif_mi=true AND u.bolge_id IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Seçilen bölge müdürü takım kapsamında değildir.' USING ERRCODE='42501'; END IF;
 END IF;
 IF p_utt IS NOT NULL AND p_bm IS NULL THEN
  RAISE EXCEPTION 'Önce bölge müdürünü seçiniz.' USING ERRCODE='42501';
 END IF;
 SELECT coalesce(jsonb_agg(u.kullanici_id),'[]'::jsonb),
  coalesce(jsonb_agg(jsonb_build_object('utt_id',u.kullanici_id,'utt_adi',btrim(u.ad||' '||u.soyad))
   ORDER BY u.ad,u.soyad,u.kullanici_id) FILTER(WHERE p_bm IS NOT NULL),'[]'::jsonb)
 INTO v_ids,v_uttler FROM public.kullanicilar u
 WHERE u.firma_id=k.firma_id AND u.takim_id=k.takim_id AND lower(u.rol) IN ('utt','kd_utt') AND u.aktif_mi=true
  AND (p_bm IS NULL OR u.bolge_id=v_bolge);
 IF p_utt IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(v_ids) u WHERE u.value=p_utt::text) THEN
   RAISE EXCEPTION 'Seçilen temsilci bölge kapsamında değildir.' USING ERRCODE='42501';
  END IF;
  v_ids:=jsonb_build_array(p_utt);
 END IF;
 RETURN jsonb_build_object('firma_id',k.firma_id,'bmler',v_bmler,'uttler',v_uttler,'ids',v_ids,'secili_bm_id',p_bm,'secili_utt_id',p_utt);
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_tm_raporu(p_kullanici uuid,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; v_firma uuid; ids uuid[]; h record; sinir timestamptz; gun_sonu jsonb;
 v_limit bigint; firma_toplam bigint; eclub_toplam bigint; eczanem_toplam bigint;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 kapsam:=public.cogniti_token_tm_kapsami(p_kullanici,p_bm,p_utt);v_firma:=(kapsam->>'firma_id')::uuid;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=v_firma;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false,'bmler',kapsam->'bmler','secili_bm_id',p_bm,'uttler',kapsam->'uttler','secili_utt_id',p_utt); END IF;
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 gun_sonu:=jsonb_build_object('hazir',false,'veri_tarihi',(sinir AT TIME ZONE 'Europe/Istanbul')::date-1);
 IF h.created_at<sinir THEN
  IF h.paket_turu='kullandigin_kadar_ode' THEN v_limit:=1500;
  ELSE SELECT y.miktar INTO v_limit FROM public.cogniti_token_yuklemeleri y
   WHERE y.firma_id=v_firma AND y.yukleme_turu='aylik_paket' AND y.created_at<sinir
   ORDER BY y.donem_yil DESC,y.donem_ay DESC,y.created_at DESC,y.yukleme_id DESC LIMIT 1;
  END IF;
  SELECT coalesce(sum(t.miktar),0)::bigint,
   coalesce(sum(t.miktar) FILTER(WHERE t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=ANY(ids)
    AND t.islem_turu IN ('eclub_oneri','viva_davet','viva_sure')),0)::bigint
  INTO firma_toplam,eclub_toplam FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at<sinir;
  SELECT coalesce(sum(t.miktar),0)::bigint INTO eczanem_toplam FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at<sinir AND t.islem_turu='eczanem_musteri'
   AND t.gonderen_turu='eclub_kisi' AND t.alici_turu='eczanem_musteri' AND EXISTS(
    SELECT 1 FROM public.eczanem_gonderimler eg
    JOIN public.eczanem_eczane_gonderimleri d ON d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
     AND d.gonderen_utt_id=ANY(ids) AND d.created_at<=eg.created_at
    WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND t.kaynak_id=eg.yayin_id
     AND t.gonderen_id=eg.gonderen_kisi_id AND t.alici_kimligi=eg.musteri_id::text AND eg.created_at<sinir
   );
  gun_sonu:=gun_sonu||jsonb_build_object('hazir',true,'plan_limiti',v_limit,'firma_toplam_token',firma_toplam,'eclub_token',eclub_toplam,'eczanem_token',eczanem_toplam);
 END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam','takim','yonetici',false,'paket_turu',h.paket_turu,
  'bmler',kapsam->'bmler','secili_bm_id',p_bm,'uttler',kapsam->'uttler','secili_utt_id',p_utt,'gun_sonu',gun_sonu);
END $$;

-- E-Club/Viva gruplama ve sunum alanları UTT raporuyla aynıdır.
CREATE OR REPLACE FUNCTION public.cogniti_token_tm_detay_raporu(p_kullanici uuid,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL,p_sayfa integer DEFAULT 0,p_gonderi text DEFAULT 'eclub',p_arac text DEFAULT 'tumu')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; k record; ids uuid[]; v_sonuc jsonb;
BEGIN
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 OR p_gonderi IS DISTINCT FROM 'eclub'
  OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf','viva') THEN
  RAISE EXCEPTION 'Geçersiz detay isteği.' USING ERRCODE='22023';
 END IF;
 kapsam:=public.cogniti_token_tm_kapsami(p_kullanici,p_bm,p_utt);
 SELECT (kapsam->>'firma_id')::uuid AS firma_id INTO k;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id) THEN
  RETURN jsonb_build_object('satirlar','[]'::jsonb,'devami_var',false);
 END IF;
 WITH yetkili AS (
  SELECT t.* FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=k.firma_id AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=ANY(ids)
   AND t.islem_turu IN ('eclub_oneri','viva_davet','viva_sure') AND t.miktar>0
 ), ham AS (
  SELECT (t.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,t.kaynak_id AS yayin_id,
   y.firma_adi,y.talep_no,t.islem_turu='eclub_oneri' AS eclub_gonderisi,
   ve.baslik AS yayin_adi,
   CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN
    (SELECT u.urun_adi FROM public.urunler u WHERE u.urun_id=ve.urun_id AND u.firma_id=t.firma_id)
    ELSE y.urun_adi END AS urun,
   CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN 'viva' ELSE y.arac_turu END AS arac,
   CASE WHEN t.islem_turu='viva_sure' OR (p_gonderi='eclub' AND p_arac='viva' AND t.islem_turu='viva_davet') THEN 'viva_katilim'
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
  FROM ham WHERE p_arac='tumu' OR arac=p_arac GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac,rol
 ), viva_bilgileri AS (
  -- Davetli listesi ve kesinleşmiş Daily sayımı tüketimler toplandıktan sonra
  -- eklenir; çoklu davetliler token miktarını çoğaltmaz.
  SELECT g.*,CASE WHEN ve.etkinlik_id IS NOT NULL THEN d.turler END AS davetli_turleri,
   CASE WHEN ve.etkinlik_id IS NOT NULL THEN d.adet END AS davetli_sayisi,
   j.katilim_sayisi
  FROM gruplar g
  LEFT JOIN public.viva_etkinlikler ve ON g.arac='viva' AND ve.etkinlik_id=g.yayin_id AND ve.firma_id=k.firma_id
  LEFT JOIN public.cogniti_viva_tuketim_isleri j ON j.etkinlik_id=ve.etkinlik_id AND j.firma_id=k.firma_id AND j.durum='tamam'
  LEFT JOIN LATERAL (
   SELECT coalesce(array_agg(tur ORDER BY sira),'{}'::text[]) AS turler,coalesce(sum(adet),0)::bigint AS adet
   FROM (
    SELECT 'ic'::text AS tur,1 AS sira,count(*) AS adet FROM public.viva_katilimcilar WHERE etkinlik_id=ve.etkinlik_id AND tur='ic'
    UNION ALL SELECT 'eclub',2,count(*) FROM public.viva_katilimcilar WHERE etkinlik_id=ve.etkinlik_id AND tur='eclub'
    UNION ALL SELECT 'ozel',3,count(*) FROM public.viva_davetler WHERE etkinlik_id=ve.etkinlik_id AND iptal=false
   ) sayilar WHERE adet>0
  ) d ON ve.etkinlik_id IS NOT NULL
 ), sirali AS (
  SELECT *,row_number() OVER(ORDER BY tarih DESC,urun NULLS LAST,arac NULLS LAST,rol,yayin_id) AS sira
  FROM viva_bilgileri
 ), sayfa AS (
  SELECT * FROM sirali WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50
 )
 SELECT jsonb_build_object(
  'satirlar',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'id',md5(jsonb_build_array(tarih,yayin_id,firma_adi,talep_no,urun,arac,rol)::text),'tarih',tarih,
   'yayin_id',CASE WHEN eclub_gonderisi THEN yayin_id ELSE NULL END,
   'yayin_adi',yayin_adi,
   'davetli_turleri',davetli_turleri,'davetli_sayisi',davetli_sayisi,'katilim_sayisi',katilim_sayisi,
   'firma_adi',firma_adi,'talep_no',talep_no,'urun',urun,'arac',arac,'rol',rol,
   'gonderilen',gonderilen,'token',token) ORDER BY sira) FROM sayfa),'[]'::jsonb),
  'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50)
 ) INTO v_sonuc;
 RETURN v_sonuc;
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_tm_eczanem_detay_raporu(p_kullanici uuid,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL,p_sayfa integer DEFAULT 0,p_arac text DEFAULT 'tumu')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; k record; ids uuid[]; v_sonuc jsonb;
BEGIN
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000
  OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf','viva') THEN
  RAISE EXCEPTION 'Geçersiz detay isteği.' USING ERRCODE='22023';
 END IF;
 kapsam:=public.cogniti_token_tm_kapsami(p_kullanici,p_bm,p_utt);
 SELECT (kapsam->>'firma_id')::uuid AS firma_id INTO k;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 WITH ham AS (
  SELECT (eg.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,eg.yayin_id,
   eg.eczane_id,eg.musteri_id,y.firma_adi,y.talep_no,y.urun_adi AS urun,
   coalesce(eg.arac_turu,y.arac_turu) AS arac,tok.token
  FROM public.eczanem_gonderimler eg
  JOIN public.eczanem_eczane_gonderimleri d ON d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
   AND d.gonderen_utt_id=ANY(ids) AND d.created_at<=eg.created_at
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

REVOKE ALL ON FUNCTION public.cogniti_token_tm_kapsami(uuid,uuid,uuid),public.cogniti_token_tm_raporu(uuid,uuid,uuid,timestamptz),public.cogniti_token_tm_detay_raporu(uuid,uuid,uuid,integer,text,text),public.cogniti_token_tm_eczanem_detay_raporu(uuid,uuid,uuid,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_tm_kapsami(uuid,uuid,uuid),public.cogniti_token_tm_raporu(uuid,uuid,uuid,timestamptz),public.cogniti_token_tm_detay_raporu(uuid,uuid,uuid,integer,text,text),public.cogniti_token_tm_eczanem_detay_raporu(uuid,uuid,uuid,integer,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_tm_raporu(uuid,uuid,uuid,timestamptz)') IS NOT NULL AS tm_token_kullanimi_kuruldu;
