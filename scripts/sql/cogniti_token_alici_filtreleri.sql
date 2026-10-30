-- Token detayları: Eczacı / Eczane Teknisyeni alıcı filtreleri.
-- Kullanıcı SQL Editor’da çalıştırır. Tüketim veya bakiye yazmaz.
BEGIN;


CREATE OR REPLACE FUNCTION public.cogniti_token_urun_kapsaminda(p_kapsam jsonb,p_kaynak uuid,p_viva boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT CASE WHEN coalesce((p_kapsam->>'pm')::boolean,false) THEN
  CASE WHEN p_viva THEN EXISTS(
   SELECT 1 FROM public.viva_etkinlikler e
   WHERE e.etkinlik_id=p_kaynak AND e.firma_id=(p_kapsam->>'firma_id')::uuid
    AND e.urun_id IN (SELECT value::uuid FROM jsonb_array_elements_text(p_kapsam->'pm_urun_ids'))
  ) ELSE EXISTS(
   SELECT 1 FROM public.v_yayin_detay y
   JOIN public.talepler t ON t.firma_id=y.firma_id AND t.talep_no=y.talep_no AND t.uretici_id=y.uretici_id
   WHERE y.yayin_id=p_kaynak AND y.firma_id=(p_kapsam->>'firma_id')::uuid
    AND t.urun_id IN (SELECT value::uuid FROM jsonb_array_elements_text(p_kapsam->'pm_urun_ids'))
  ) END ELSE true END;
$$;

REVOKE ALL ON FUNCTION public.cogniti_token_urun_kapsaminda(jsonb,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_urun_kapsaminda(jsonb,uuid,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_detay_raporu_filtreli_alici(p_kullanici uuid,p_sayfa integer DEFAULT 0,p_gonderi text DEFAULT 'tumu',p_arac text DEFAULT 'tumu',p_alici text DEFAULT 'eczaci')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; v_kapsam text; v_sonuc jsonb;
BEGIN
 IF p_alici IS NULL OR p_alici NOT IN ('eczaci','eczane_teknisyeni','eclub') THEN
  RAISE EXCEPTION 'Geçersiz alıcı filtresi.' USING ERRCODE='22023';
 END IF;
 IF p_kullanici IS NULL OR p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 THEN
  RAISE EXCEPTION 'Geçersiz detay isteği.' USING ERRCODE='22023';
 END IF;
 IF p_gonderi IS NULL OR p_gonderi NOT IN ('tumu','eclub') OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf','viva') THEN
  RAISE EXCEPTION 'Geçersiz filtre.' USING ERRCODE='22023';
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
  FROM ham WHERE (p_arac='tumu' OR arac=p_arac)
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

REVOKE ALL ON FUNCTION public.cogniti_token_detay_raporu_filtreli_alici(uuid,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_detay_raporu_filtreli_alici(uuid,integer,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_bm_detay_raporu_alici(p_kullanici uuid,p_utt uuid DEFAULT NULL,p_sayfa integer DEFAULT 0,p_gonderi text DEFAULT 'eclub',p_arac text DEFAULT 'tumu',p_alici text DEFAULT 'eczaci')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; k record; ids uuid[]; v_sonuc jsonb;
BEGIN
 IF p_alici IS NULL OR p_alici NOT IN ('eczaci','eczane_teknisyeni','eclub') THEN
  RAISE EXCEPTION 'Geçersiz alıcı filtresi.' USING ERRCODE='22023';
 END IF;
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 OR p_gonderi IS DISTINCT FROM 'eclub'
  OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf','viva') THEN
  RAISE EXCEPTION 'Geçersiz detay isteği.' USING ERRCODE='22023';
 END IF;
 kapsam:=public.cogniti_token_bm_kapsami(p_kullanici,p_utt);
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
  FROM ham WHERE (p_arac='tumu' OR arac=p_arac)
 AND (
  (arac<>'viva' AND EXISTS (
   SELECT 1 FROM public.v_yayin_detay v WHERE v.yayin_id=ham.yayin_id AND v.firma_id=k.firma_id
    AND ((p_alici='eczaci' AND v.hedef_roller @> ARRAY['eczaci']::text[] AND NOT v.hedef_roller @> ARRAY['eczane_teknisyeni']::text[])
      OR (p_alici='eczane_teknisyeni' AND v.hedef_roller @> ARRAY['eczane_teknisyeni']::text[] AND NOT v.hedef_roller @> ARRAY['eczaci']::text[])
      OR (p_alici='eclub' AND v.hedef_roller @> ARRAY['eczaci','eczane_teknisyeni']::text[]))
  ))
  OR (arac='viva' AND (
    (p_alici IN ('eczaci','eclub') AND EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')))
    OR (p_alici='eczane_teknisyeni' AND NOT EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')))
  ) AND (
    (p_alici IN ('eczane_teknisyeni','eclub') AND EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol)='eczane_teknisyeni'))
    OR (p_alici='eczaci' AND NOT EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol)='eczane_teknisyeni'))
  ))
 ) GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac,rol
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

REVOKE ALL ON FUNCTION public.cogniti_token_bm_detay_raporu_alici(uuid,uuid,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_bm_detay_raporu_alici(uuid,uuid,integer,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_tm_detay_raporu_alici(p_kullanici uuid,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL,p_sayfa integer DEFAULT 0,p_gonderi text DEFAULT 'eclub',p_arac text DEFAULT 'tumu',p_alici text DEFAULT 'eczaci')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; k record; ids uuid[]; v_sonuc jsonb;
BEGIN
 IF p_alici IS NULL OR p_alici NOT IN ('eczaci','eczane_teknisyeni','eclub') THEN
  RAISE EXCEPTION 'Geçersiz alıcı filtresi.' USING ERRCODE='22023';
 END IF;
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
  FROM ham WHERE (p_arac='tumu' OR arac=p_arac)
 AND (
  (arac<>'viva' AND EXISTS (
   SELECT 1 FROM public.v_yayin_detay v WHERE v.yayin_id=ham.yayin_id AND v.firma_id=k.firma_id
    AND ((p_alici='eczaci' AND v.hedef_roller @> ARRAY['eczaci']::text[] AND NOT v.hedef_roller @> ARRAY['eczane_teknisyeni']::text[])
      OR (p_alici='eczane_teknisyeni' AND v.hedef_roller @> ARRAY['eczane_teknisyeni']::text[] AND NOT v.hedef_roller @> ARRAY['eczaci']::text[])
      OR (p_alici='eclub' AND v.hedef_roller @> ARRAY['eczaci','eczane_teknisyeni']::text[]))
  ))
  OR (arac='viva' AND (
    (p_alici IN ('eczaci','eclub') AND EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')))
    OR (p_alici='eczane_teknisyeni' AND NOT EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')))
  ) AND (
    (p_alici IN ('eczane_teknisyeni','eclub') AND EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol)='eczane_teknisyeni'))
    OR (p_alici='eczaci' AND NOT EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol)='eczane_teknisyeni'))
  ))
 ) GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac,rol
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

REVOKE ALL ON FUNCTION public.cogniti_token_tm_detay_raporu_alici(uuid,uuid,uuid,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_tm_detay_raporu_alici(uuid,uuid,uuid,integer,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_yonetici_detay_raporu_alici(p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL,p_sayfa integer DEFAULT 0,p_gonderi text DEFAULT 'eclub',p_arac text DEFAULT 'tumu',p_alici text DEFAULT 'eczaci')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; k record; ids uuid[]; v_sonuc jsonb;
BEGIN
 IF p_alici IS NULL OR p_alici NOT IN ('eczaci','eczane_teknisyeni','eclub') THEN
  RAISE EXCEPTION 'Geçersiz alıcı filtresi.' USING ERRCODE='22023';
 END IF;
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 OR p_gonderi IS DISTINCT FROM 'eclub'
  OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf','viva') THEN
  RAISE EXCEPTION 'Geçersiz detay isteği.' USING ERRCODE='22023';
 END IF;
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,p_utt);
 SELECT (kapsam->>'firma_id')::uuid AS firma_id INTO k;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id) THEN
  RETURN jsonb_build_object('satirlar','[]'::jsonb,'devami_var',false);
 END IF;
 WITH yetkili AS (
  SELECT t.* FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=k.firma_id AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=ANY(ids)
   AND t.islem_turu IN ('eclub_oneri','viva_davet','viva_sure') AND t.miktar>0
   AND public.cogniti_token_urun_kapsaminda(kapsam,t.kaynak_id,t.islem_turu IN ('viva_davet','viva_sure'))
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
  FROM ham WHERE (p_arac='tumu' OR arac=p_arac)
 AND (
  (arac<>'viva' AND EXISTS (
   SELECT 1 FROM public.v_yayin_detay v WHERE v.yayin_id=ham.yayin_id AND v.firma_id=k.firma_id
    AND ((p_alici='eczaci' AND v.hedef_roller @> ARRAY['eczaci']::text[] AND NOT v.hedef_roller @> ARRAY['eczane_teknisyeni']::text[])
      OR (p_alici='eczane_teknisyeni' AND v.hedef_roller @> ARRAY['eczane_teknisyeni']::text[] AND NOT v.hedef_roller @> ARRAY['eczaci']::text[])
      OR (p_alici='eclub' AND v.hedef_roller @> ARRAY['eczaci','eczane_teknisyeni']::text[]))
  ))
  OR (arac='viva' AND (
    (p_alici IN ('eczaci','eclub') AND EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')))
    OR (p_alici='eczane_teknisyeni' AND NOT EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')))
  ) AND (
    (p_alici IN ('eczane_teknisyeni','eclub') AND EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol)='eczane_teknisyeni'))
    OR (p_alici='eczaci' AND NOT EXISTS (SELECT 1 FROM public.viva_katilimcilar vk JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id WHERE vk.etkinlik_id=ham.yayin_id AND vk.tur='eclub' AND lower(ek.rol)='eczane_teknisyeni'))
  ))
 ) GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac,rol
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

REVOKE ALL ON FUNCTION public.cogniti_token_yonetici_detay_raporu_alici(uuid,uuid,uuid,uuid,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_yonetici_detay_raporu_alici(uuid,uuid,uuid,uuid,integer,text,text,text) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_detay_raporu_filtreli_alici(uuid,integer,text,text,text)') IS NOT NULL AS token_alici_filtreleri_kuruldu;
