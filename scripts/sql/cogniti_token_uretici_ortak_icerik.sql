-- Üretici token ekranının ortak içerik türü raporları.
-- Rol/tür eşlemesi lib/uretici/yetenekler.ts URETICI_YETENEKLERI kaynağından üretilmiştir.
-- Yalnız raporlama; tüketim/bakiye/yayın oluşturmaz. Kullanıcı çalıştırır.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_uretici_turleri(p_rol text)
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT coalesce((SELECT turler FROM (VALUES
  ('pm',ARRAY['urun_egitimi']::text[]),
  ('jr_pm',ARRAY['urun_egitimi']::text[]),
  ('kd_pm',ARRAY['urun_egitimi']::text[]),
  ('med_md',ARRAY['medikal_egitim','urun_medikal_egitim']::text[]),
  ('egt_md',ARRAY['satis_teknikleri','yonetim_egitimi']::text[]),
  ('egt_yrd_md',ARRAY['satis_teknikleri','yonetim_egitimi']::text[]),
  ('egt_yon',ARRAY['satis_teknikleri','yonetim_egitimi']::text[]),
  ('egt_uz',ARRAY['satis_teknikleri','yonetim_egitimi']::text[]),
  ('ik_drk',ARRAY['ik_egitimi','yonetim_egitimi']::text[]),
  ('ik_md',ARRAY['ik_egitimi','yonetim_egitimi']::text[]),
  ('ik_yrd_md',ARRAY['ik_egitimi','yonetim_egitimi']::text[]),
  ('ik_uz',ARRAY['ik_egitimi','yonetim_egitimi']::text[]),
  ('ik_per',ARRAY['ik_egitimi','yonetim_egitimi']::text[])
 ) v(rol,turler) WHERE rol=lower(p_rol)),'{}'::text[]);
$$;
REVOKE ALL ON FUNCTION public.cogniti_token_uretici_turleri(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_uretici_turleri(text) TO service_role;
CREATE OR REPLACE FUNCTION public.cogniti_token_yonetici_kapsami(p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; v_takim uuid; v_bolge uuid; v_tmler jsonb; v_bmler jsonb; v_uttler jsonb; v_ids jsonb; v_pm_urunler uuid[];
BEGIN
 SELECT u.firma_id,u.rol INTO k FROM public.kullanicilar u
 JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND (lower(u.rol) IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm') OR cardinality(public.cogniti_token_uretici_turleri(u.rol))>0) AND u.aktif_mi=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Yönetici token kapsamına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF lower(k.rol) IN ('pm','jr_pm','kd_pm') THEN
  SELECT coalesce(array_agg(DISTINCT t.urun_id),'{}'::uuid[]) INTO v_pm_urunler
  FROM public.talepler t JOIN public.urunler u ON u.urun_id=t.urun_id AND u.firma_id=k.firma_id
  WHERE t.uretici_id=p_kullanici AND t.firma_id=k.firma_id AND t.urun_id IS NOT NULL;
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('tm_id',u.kullanici_id,'tm_adi',btrim(u.ad||' '||u.soyad))
  ORDER BY u.ad,u.soyad,u.kullanici_id),'[]'::jsonb) INTO v_tmler
 FROM public.kullanicilar u WHERE u.firma_id=k.firma_id AND lower(u.rol)='tm' AND u.aktif_mi=true AND u.takim_id IS NOT NULL;
 IF p_tm IS NOT NULL THEN
  SELECT u.takim_id INTO v_takim FROM public.kullanicilar u
   WHERE u.kullanici_id=p_tm AND u.firma_id=k.firma_id AND lower(u.rol)='tm' AND u.aktif_mi=true AND u.takim_id IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Seçilen takım müdürü firma kapsamında değildir.' USING ERRCODE='42501'; END IF;
 END IF;
 IF p_bm IS NOT NULL AND p_tm IS NULL THEN
  RAISE EXCEPTION 'Önce takım müdürünü seçiniz.' USING ERRCODE='42501';
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('bm_id',u.kullanici_id,'bm_adi',btrim(u.ad||' '||u.soyad))
  ORDER BY u.ad,u.soyad,u.kullanici_id),'[]'::jsonb) INTO v_bmler
 FROM public.kullanicilar u WHERE p_tm IS NOT NULL AND u.firma_id=k.firma_id AND u.takim_id=v_takim
  AND lower(u.rol)='bm' AND u.aktif_mi=true AND u.bolge_id IS NOT NULL;
 IF p_bm IS NOT NULL THEN
  SELECT u.bolge_id INTO v_bolge FROM public.kullanicilar u
   WHERE u.kullanici_id=p_bm AND u.firma_id=k.firma_id AND u.takim_id=v_takim
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
 WHERE u.firma_id=k.firma_id AND u.takim_id IS NOT NULL AND lower(u.rol) IN ('utt','kd_utt') AND u.aktif_mi=true
  AND (p_tm IS NULL OR u.takim_id=v_takim) AND (p_bm IS NULL OR u.bolge_id=v_bolge);
 IF p_utt IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(v_ids) u WHERE u.value=p_utt::text) THEN
   RAISE EXCEPTION 'Seçilen temsilci bölge kapsamında değildir.' USING ERRCODE='42501';
  END IF;
  v_ids:=jsonb_build_array(p_utt);
 END IF;
 RETURN jsonb_build_object('firma_id',k.firma_id,'uretici_id',CASE WHEN cardinality(public.cogniti_token_uretici_turleri(k.rol))>0 THEN p_kullanici END,'uretici_turleri',to_jsonb(public.cogniti_token_uretici_turleri(k.rol)),'pm',lower(k.rol) IN ('pm','jr_pm','kd_pm'),'pm_urun_ids',coalesce(to_jsonb(v_pm_urunler),'[]'::jsonb),'tmler',v_tmler,'bmler',v_bmler,'uttler',v_uttler,'ids',v_ids,
  'secili_tm_id',p_tm,'secili_bm_id',p_bm,'secili_utt_id',p_utt);
END $$;

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
  ) END WHEN nullif(p_kapsam->>'uretici_id','') IS NOT NULL THEN
  CASE WHEN p_viva THEN EXISTS(
   SELECT 1 FROM public.viva_etkinlikler e
   WHERE e.etkinlik_id=p_kaynak AND e.firma_id=(p_kapsam->>'firma_id')::uuid
    AND e.egitim_turu IN (SELECT jsonb_array_elements_text(p_kapsam->'uretici_turleri'))
  ) ELSE EXISTS(
   SELECT 1 FROM public.v_yayin_detay y
   WHERE y.yayin_id=p_kaynak AND y.firma_id=(p_kapsam->>'firma_id')::uuid
    AND y.uretici_id=(p_kapsam->>'uretici_id')::uuid
  ) END ELSE true END;
$$;
REVOKE ALL ON FUNCTION public.cogniti_token_urun_kapsaminda(jsonb,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_urun_kapsaminda(jsonb,uuid,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_uretici_icerik_satirlari(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_tur text DEFAULT 'urun_egitimi'
) RETURNS TABLE(
 created_at timestamptz,yayin_id uuid,firma_adi text,talep_no bigint,
 urun text,arac text,rol text,token bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; firma uuid; ids uuid[]; takim uuid;
BEGIN
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 IF nullif(kapsam->>'uretici_id','') IS NULL OR p_tur IS NULL
  OR NOT (kapsam->'uretici_turleri' ? p_tur) THEN
  RAISE EXCEPTION 'Bu içerik türüne erişiminiz bulunmuyor.' USING ERRCODE='42501';
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
   AND v.uretici_id=p_kullanici
   AND v.egitim_turu=p_tur
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

CREATE OR REPLACE FUNCTION public.cogniti_token_uretici_icerik_detay_raporu(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,
 p_sayfa integer DEFAULT 0,p_arac text DEFAULT 'tumu',p_tur text DEFAULT 'urun_egitimi'
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sonuc jsonb;
BEGIN
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 OR p_arac IS NULL
  OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf') THEN
  RAISE EXCEPTION 'Geçersiz ürün eğitimi raporu isteği.' USING ERRCODE='22023';
 END IF;
 WITH ham AS (
  SELECT (s.created_at AT TIME ZONE 'Europe/Istanbul')::date AS tarih,s.*
  FROM public.cogniti_token_uretici_icerik_satirlari(p_kullanici,p_tm,p_bm,p_tur) s
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
  'id',md5(jsonb_build_array('uretici_icerik',p_kullanici,tarih,yayin_id,firma_adi,talep_no,urun,arac,rol)::text),
  'tarih',tarih,'yayin_id',yayin_id,'firma_adi',firma_adi,'talep_no',talep_no,
  'urun',urun,'arac',arac,'rol',rol,'gonderilen',gonderilen,'token',token) ORDER BY sira)
  FROM sirali WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50),'[]'::jsonb),
  'devami_var',EXISTS(SELECT 1 FROM sirali WHERE sira>(p_sayfa::bigint+1)*50)) INTO sonuc;
 RETURN sonuc;
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_uretici_icerik_ozeti(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp(),p_tur text DEFAULT 'urun_egitimi'
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sinir timestamptz; toplam bigint; kapsam jsonb;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 IF nullif(kapsam->>'uretici_id','') IS NULL OR p_tur IS NULL
  OR NOT (kapsam->'uretici_turleri' ? p_tur) THEN
  RAISE EXCEPTION 'Bu içerik türüne erişiminiz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h
  WHERE h.firma_id=(kapsam->>'firma_id')::uuid AND h.created_at<sinir) THEN
  RETURN jsonb_build_object('token',NULL);
 END IF;
 SELECT coalesce(sum(s.token),0)::bigint INTO toplam
 FROM public.cogniti_token_uretici_icerik_satirlari(p_kullanici,p_tm,p_bm,p_tur) s WHERE s.created_at<sinir;
 RETURN jsonb_build_object('token',toplam);
END $$;

REVOKE ALL ON FUNCTION public.cogniti_token_uretici_icerik_satirlari(uuid,uuid,uuid,text),
 public.cogniti_token_uretici_icerik_detay_raporu(uuid,uuid,uuid,integer,text,text),
 public.cogniti_token_uretici_icerik_ozeti(uuid,uuid,uuid,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_uretici_icerik_satirlari(uuid,uuid,uuid,text),
 public.cogniti_token_uretici_icerik_detay_raporu(uuid,uuid,uuid,integer,text,text),
 public.cogniti_token_uretici_icerik_ozeti(uuid,uuid,uuid,timestamptz,text) TO service_role;

REVOKE ALL ON FUNCTION public.cogniti_token_yonetici_kapsami(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_yonetici_kapsami(uuid,uuid,uuid,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_uretici_icerik_detay_raporu(uuid,uuid,uuid,integer,text,text)') IS NOT NULL
 AND to_regprocedure('public.cogniti_token_uretici_icerik_ozeti(uuid,uuid,uuid,timestamptz,text)') IS NOT NULL
 AS uretici_ortak_token_hazir;
