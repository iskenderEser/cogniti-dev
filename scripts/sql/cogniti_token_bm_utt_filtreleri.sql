-- BM: UTT ekranıyla aynı dört araç filtresi ve ayrı Viva etkinlik hattı.
-- Tüm Temsilciler: bölgedeki UTT/Kd.UTT toplamı; seçili UTT: yalnız o temsilci.
-- Eczanem raporu ve firma kapsamı mevcut haliyle korunur. BM'nin kendi önerileri bu adımda yoktur.
-- Kullanıcı çalıştırır. Tüketim, bakiye, Daily ve UTT rapor fonksiyonlarını değiştirmez.
BEGIN;
DO $$ BEGIN
 IF to_regprocedure('public.cogniti_token_viva_rapor_satirlari(uuid,text,text,uuid,uuid,uuid)') IS NULL THEN
  RAISE EXCEPTION 'Önce Viva ayrı rapor kurulumu uygulanmalıdır.';
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.cogniti_token_bm_raporu(p_kullanici uuid,p_utt uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; v_firma uuid; ids uuid[]; h record; sinir timestamptz; gun_sonu jsonb;
 v_limit bigint; firma_toplam bigint; eclub_toplam bigint; eczanem_toplam bigint;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 kapsam:=public.cogniti_token_bm_kapsami(p_kullanici,p_utt);v_firma:=(kapsam->>'firma_id')::uuid;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=v_firma;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false,'uttler',kapsam->'uttler','secili_utt_id',p_utt); END IF;
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
 RETURN jsonb_build_object('hesap_var',true,'kapsam','bolge','yonetici',false,'paket_turu',h.paket_turu,
  'uttler',kapsam->'uttler','secili_utt_id',p_utt,'gun_sonu',gun_sonu);
END $$;

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
   AND t.islem_turu='eclub_oneri' AND t.miktar>0
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
  FROM public.cogniti_token_viva_rapor_satirlari(p_kullanici,p_alici,'bm',NULL,NULL,p_utt) v
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

REVOKE ALL ON FUNCTION public.cogniti_token_bm_detay_raporu_alici(uuid,uuid,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_bm_detay_raporu_alici(uuid,uuid,integer,text,text,text) TO service_role;


REVOKE ALL ON FUNCTION public.cogniti_token_bm_raporu(uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_bm_raporu(uuid,uuid,timestamptz) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_bm_detay_raporu_alici(uuid,uuid,integer,text,text,text)') IS NOT NULL AS bm_utt_filtreleri_hazir;
