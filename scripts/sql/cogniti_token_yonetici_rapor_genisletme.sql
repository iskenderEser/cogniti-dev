-- Yönetici: firma ürünlerinin eğitim, BM öneri ve ekip tüketimleri.
-- Ortak raporlar kapsam yardımcısıyla PM'de ürün/sahiplik sınırını korur;
-- yedi yönetici rolünde firma genelini okur. Yetki istemciden türetilmez.
-- Dört araçta gerçek alıcı; Viva mevcut bağımsız Daily rapor kaynağıdır.
-- Yalnız raporlama; bakiye/tüketim yazmaz. Kullanıcı çalıştırır.
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
   AND (NOT coalesce((kapsam->>'pm')::boolean,false) OR v.uretici_id=p_kullanici)
   AND v.egitim_turu='urun_egitimi'
   AND v.arac_turu IN ('video','podcast','gorsel','flip_pdf')
  ORDER BY v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no LIMIT 1
 ) y ON true
 LEFT JOIN public.kullanicilar a ON a.kullanici_id::text=t.alici_kimligi AND a.firma_id=t.firma_id
 LEFT JOIN public.bolgeler b ON b.bolge_id=a.bolge_id
 WHERE t.firma_id=firma AND t.gonderen_turu='firma_kullanicisi' AND (NOT coalesce((kapsam->>'pm')::boolean,false) OR t.gonderen_id=p_kullanici)
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

CREATE OR REPLACE FUNCTION public.cogniti_token_pm_oneri_satirlari(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL
) RETURNS TABLE(
 created_at timestamptz,yayin_id uuid,firma_adi text,talep_no bigint,
 urun text,arac text,rol text,token bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; firma uuid; ids uuid[]; takim uuid; gonderenler uuid[];
BEGIN
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 firma:=(kapsam->>'firma_id')::uuid;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids
 FROM jsonb_array_elements_text(kapsam->'ids');
 IF p_tm IS NOT NULL THEN
  SELECT u.takim_id INTO takim FROM public.kullanicilar u WHERE u.kullanici_id=p_tm;
 END IF;
 SELECT coalesce(array_agg(u.kullanici_id),'{}'::uuid[]) INTO gonderenler
 FROM public.kullanicilar u
 WHERE u.firma_id=firma AND lower(u.rol)='bm' AND u.aktif_mi=true AND u.bolge_id IS NOT NULL
  AND (p_tm IS NULL OR u.takim_id=takim) AND (p_bm IS NULL OR u.kullanici_id=p_bm);
 RETURN QUERY
 SELECT t.created_at,t.kaynak_id,y.firma_adi::text,y.talep_no::bigint,
  y.urun_adi::text,y.arac_turu::text,'utt'::text,t.miktar::bigint
 FROM public.cogniti_token_tuketimleri t
 JOIN LATERAL (
  SELECT v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu
  FROM public.v_yayin_detay v
  WHERE v.yayin_id=t.kaynak_id AND v.firma_id=t.firma_id
   AND v.arac_turu IN ('video','podcast','gorsel','flip_pdf')
  ORDER BY v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no LIMIT 1
 ) y ON true
 WHERE t.firma_id=firma AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=ANY(gonderenler)
  AND t.islem_turu='tclub_oneri' AND t.alici_turu='firma_kullanicisi' AND t.miktar>0
  AND t.alici_kimligi IN (SELECT unnest(ids)::text)
  AND public.cogniti_token_urun_kapsaminda(kapsam,t.kaynak_id,false);
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_pm_oneri_detay_raporu(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,
 p_sayfa integer DEFAULT 0,p_arac text DEFAULT 'tumu'
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sonuc jsonb;
BEGIN
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 OR p_arac IS NULL
  OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf') THEN
  RAISE EXCEPTION 'Geçersiz öneri raporu isteği.' USING ERRCODE='22023';
 END IF;
 WITH ham AS (
  SELECT (s.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,s.*
  FROM public.cogniti_token_pm_oneri_satirlari(p_kullanici,p_tm,p_bm) s
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
  'id',md5(jsonb_build_array('pm_oneri',p_kullanici,tarih,yayin_id,firma_adi,talep_no,urun,arac,rol)::text),
  'tarih',tarih,'yayin_id',yayin_id,'firma_adi',firma_adi,'talep_no',talep_no,
  'urun',urun,'arac',arac,'rol',rol,'gonderilen',gonderilen,'token',token) ORDER BY sira)
  FROM sirali WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50),'[]'::jsonb),
  'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50)) INTO sonuc;
 RETURN sonuc;
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_pm_oneri_ozeti(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sinir timestamptz; toplam bigint; kapsam jsonb;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h
  WHERE h.firma_id=(kapsam->>'firma_id')::uuid AND h.created_at<sinir) THEN
  RETURN jsonb_build_object('token',NULL);
 END IF;
 SELECT coalesce(sum(s.token),0)::bigint INTO toplam
 FROM public.cogniti_token_pm_oneri_satirlari(p_kullanici,p_tm,p_bm) s WHERE s.created_at<sinir;
 RETURN jsonb_build_object('token',toplam);
END $$;

REVOKE ALL ON FUNCTION public.cogniti_token_pm_oneri_satirlari(uuid,uuid,uuid),
 public.cogniti_token_pm_oneri_detay_raporu(uuid,uuid,uuid,integer,text),
 public.cogniti_token_pm_oneri_ozeti(uuid,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_pm_oneri_satirlari(uuid,uuid,uuid),
 public.cogniti_token_pm_oneri_detay_raporu(uuid,uuid,uuid,integer,text),
 public.cogniti_token_pm_oneri_ozeti(uuid,uuid,uuid,timestamptz) TO service_role;

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
   AND t.islem_turu='eclub_oneri' AND t.miktar>0
   AND public.cogniti_token_urun_kapsaminda(kapsam,t.kaynak_id,false)
 ), ham AS (
  SELECT (t.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,t.kaynak_id AS yayin_id,
   y.firma_adi,y.talep_no,t.islem_turu='eclub_oneri' AS eclub_gonderisi,
   NULL::text AS yayin_adi,y.urun_adi AS urun,y.arac_turu AS arac,
   CASE WHEN t.alici_turu='firma_kullanicisi' THEN coalesce(lower(a.rol),'firma_kullanicisi')
    WHEN t.alici_turu='eclub_kisi' THEN coalesce(lower(e.rol),'eclub_uyesi')
    ELSE t.alici_turu END AS rol,
   1::bigint AS gonderilen,t.miktar
  FROM yetkili t
  LEFT JOIN LATERAL (SELECT v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no
   FROM public.v_yayin_detay v WHERE v.yayin_id=t.kaynak_id AND v.firma_id=t.firma_id
   ORDER BY v.urun_adi,v.arac_turu,v.firma_adi,v.talep_no LIMIT 1) y ON true
  LEFT JOIN public.kullanicilar a ON t.alici_turu='firma_kullanicisi' AND a.kullanici_id::text=t.alici_kimligi AND a.firma_id=t.firma_id
  LEFT JOIN public.eclub_kisiler e ON t.alici_turu='eclub_kisi' AND e.kisi_id::text=t.alici_kimligi
 ), gruplar AS (
  SELECT tarih,yayin_id,firma_adi,talep_no,urun,arac,rol,max(yayin_adi) AS yayin_adi,bool_and(eclub_gonderisi) AS eclub_gonderisi,sum(gonderilen)::bigint AS gonderilen,sum(miktar)::bigint AS token
  FROM ham WHERE (p_arac='tumu' OR arac=p_arac)
 AND arac IS DISTINCT FROM 'viva'
 AND (
  (p_alici='eczaci' AND rol IN ('eczaci','ikinci_eczaci','yardimci_eczaci'))
  OR (p_alici='eczane_teknisyeni' AND rol='eczane_teknisyeni')
  OR (p_alici='eclub' AND rol IN ('eczaci','ikinci_eczaci','yardimci_eczaci','eczane_teknisyeni'))
 ) GROUP BY tarih,yayin_id,firma_adi,talep_no,urun,arac,rol
 ), viva_bilgileri AS (
  SELECT g.*,NULL::text[] AS davetli_turleri,NULL::bigint AS davetli_sayisi,
   NULL::integer AS katilim_sayisi FROM gruplar g
  UNION ALL
  SELECT v.tarih,v.yayin_id,NULL::text,NULL::integer,v.urun,v.arac,v.rol,v.yayin_adi,
   false,v.gonderilen,v.token,v.davetli_turleri,v.davetli_sayisi,v.katilim_sayisi
  FROM public.cogniti_token_viva_rapor_satirlari(p_kullanici,p_alici,'yonetici',p_tm,p_bm,p_utt) v
  WHERE p_arac IN ('tumu','viva')
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
SELECT true AS yonetici_token_raporlari_hazir;
