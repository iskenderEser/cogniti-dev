-- Viva: Daily sonucu ve etkinlik başına tek satır. Yalnız raporlama.
-- Kullanıcı SQL Editor'da çalıştırır; tüketim, davet, fiyat ve cron değiştirilmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_viva_rapor_satirlari(
 p_kullanici uuid,p_alici text DEFAULT NULL,p_gorunum text DEFAULT 'benim',
 p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL
) RETURNS TABLE(id text,tarih date,yayin_id uuid,yayin_adi text,urun text,arac text,
 rol text,gonderilen bigint,token bigint,davetli_turleri text[],davetli_sayisi bigint,katilim_sayisi integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; kapsam jsonb; ids uuid[];
BEGIN
 IF p_kullanici IS NULL OR (p_alici IS NOT NULL AND p_alici NOT IN ('eczaci','eczane_teknisyeni','eclub'))
  OR p_gorunum IS NULL OR p_gorunum NOT IN ('benim','bm','tm','yonetici')
  OR (p_gorunum='benim' AND (p_tm IS NOT NULL OR p_bm IS NOT NULL OR p_utt IS NOT NULL))
  OR (p_gorunum='bm' AND (p_tm IS NOT NULL OR p_bm IS NOT NULL))
  OR (p_gorunum='tm' AND p_tm IS NOT NULL) THEN
  RAISE EXCEPTION 'Geçersiz Viva rapor isteği.' USING ERRCODE='22023';
 END IF;
 SELECT u.firma_id,u.rol INTO k FROM public.kullanicilar u
 JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND u.aktif_mi=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Viva raporuna erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF p_gorunum='yonetici' THEN kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,p_utt);
 ELSIF p_gorunum='tm' THEN kapsam:=public.cogniti_token_tm_kapsami(p_kullanici,p_bm,p_utt);
 ELSIF p_gorunum='bm' THEN kapsam:=public.cogniti_token_bm_kapsami(p_kullanici,p_utt);
 ELSE
  ids:=ARRAY[p_kullanici];
 END IF;
 IF kapsam IS NOT NULL THEN
  SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id=k.firma_id) THEN RETURN; END IF;
 RETURN QUERY
 WITH etkinlikler AS (
  SELECT e.*,j.token AS daily_token,j.katilim_sayisi AS daily_katilim,j.kapanis,j.durum AS is_durumu,
   eski.token AS eski_token,eski.tarih AS eski_tarih,d.eczaci,d.teknisyen,d.eclub_adet,
   (SELECT count(*) FROM public.viva_katilimcilar vk WHERE vk.etkinlik_id=e.etkinlik_id AND vk.tur='ic') AS ic_adet,
   (SELECT count(*) FROM public.viva_davetler vd WHERE vd.etkinlik_id=e.etkinlik_id AND vd.iptal=false) AS ozel_adet
  FROM public.viva_etkinlikler e
  LEFT JOIN public.cogniti_viva_tuketim_isleri j ON j.etkinlik_id=e.etkinlik_id AND j.firma_id=e.firma_id
  LEFT JOIN LATERAL (
   -- Eski davet modeliyle oluşmuş gerçek tutarlar tek etkinlikte toplanır.
   SELECT sum(t.miktar)::bigint AS token,min(t.created_at) AS tarih
   FROM public.cogniti_token_tuketimleri t
   WHERE t.firma_id=e.firma_id AND t.kaynak_id=e.etkinlik_id
    AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=e.sahip_id
    AND t.islem_turu IN ('viva_davet','viva_sure') AND t.miktar>0
  ) eski ON true
  CROSS JOIN LATERAL (
   SELECT coalesce(bool_or(lower(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')),false) AS eczaci,
    coalesce(bool_or(lower(ek.rol)='eczane_teknisyeni'),false) AS teknisyen,count(*) AS eclub_adet
   FROM public.viva_katilimcilar vk
   LEFT JOIN public.eclub_kisiler ek ON ek.kisi_id=vk.kisi_id
   WHERE vk.etkinlik_id=e.etkinlik_id AND vk.tur='eclub'
  ) d
  WHERE e.firma_id=k.firma_id AND e.sahip_id=ANY(ids)
   AND (kapsam IS NULL OR public.cogniti_token_urun_kapsaminda(kapsam,e.etkinlik_id,true))
   AND ((j.durum='tamam' AND j.token IS NOT NULL) OR (j.etkinlik_id IS NULL AND eski.token>0))
 )
 SELECT md5('viva:'||e.etkinlik_id::text),
  (CASE WHEN e.is_durumu='tamam' THEN coalesce(e.kapanis,e.bitis) ELSE e.eski_tarih END AT TIME ZONE 'Europe/Istanbul')::date,
  e.etkinlik_id,e.baslik,u.urun_adi,'viva'::text,
  CASE WHEN e.eczaci AND e.teknisyen THEN 'eclub' WHEN e.eczaci THEN 'eczaci'
       WHEN e.teknisyen THEN 'eczane_teknisyeni' ELSE 'viva_katilim' END,
  e.daily_katilim::bigint,CASE WHEN e.is_durumu='tamam' THEN e.daily_token ELSE e.eski_token END,
  array_remove(ARRAY[CASE WHEN e.ic_adet>0 THEN 'ic' END,CASE WHEN e.eclub_adet>0 THEN 'eclub' END,
    CASE WHEN e.ozel_adet>0 THEN 'ozel' END],NULL)::text[],
  e.ic_adet+e.eclub_adet+e.ozel_adet,e.daily_katilim
 FROM etkinlikler e LEFT JOIN public.urunler u ON u.urun_id=e.urun_id AND u.firma_id=e.firma_id
 WHERE p_alici IS NULL
  OR (p_alici='eczaci' AND e.eczaci AND NOT e.teknisyen)
  OR (p_alici='eczane_teknisyeni' AND e.teknisyen AND NOT e.eczaci)
  OR (p_alici='eclub' AND e.eczaci AND e.teknisyen);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_viva_rapor_satirlari(uuid,text,text,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_viva_rapor_satirlari(uuid,text,text,uuid,uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_viva_detay_raporu(
 p_kullanici uuid,p_sayfa integer DEFAULT 0,p_alici text DEFAULT NULL,p_gorunum text DEFAULT 'benim',
 p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sonuc jsonb;
BEGIN
 IF p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>10000 THEN
  RAISE EXCEPTION 'Geçersiz sayfa.' USING ERRCODE='22023';
 END IF;
 WITH satirlar AS MATERIALIZED (
  SELECT v.*,row_number() OVER(ORDER BY v.tarih DESC,v.urun NULLS LAST,v.yayin_id) AS sira
  FROM public.cogniti_token_viva_rapor_satirlari(p_kullanici,p_alici,p_gorunum,p_tm,p_bm,p_utt) v
 )
 SELECT jsonb_build_object('satirlar',coalesce((SELECT jsonb_agg(to_jsonb(s)-'sira' ORDER BY sira)
  FROM satirlar s WHERE sira>p_sayfa::bigint*50 AND sira<=(p_sayfa::bigint+1)*50),'[]'::jsonb),
  'devami_var',EXISTS(SELECT 1 FROM satirlar WHERE sira>(p_sayfa::bigint+1)*50)) INTO sonuc;
 RETURN sonuc;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_viva_detay_raporu(uuid,integer,text,text,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_viva_detay_raporu(uuid,integer,text,text,uuid,uuid,uuid) TO service_role;

-- Mevcut alıcı raporlarında yalnız Viva kaynağı değiştirilir.
-- Diğer araçların gruplama ve rol koşulları olduğu gibi korunur.
DO $patch$
DECLARE imza text; kaynak text; eski text; yeni text; args text;
BEGIN
 FOR imza,args IN SELECT * FROM (VALUES
  ('public.cogniti_token_detay_raporu_filtreli_alici(uuid,integer,text,text,text)', $$p_kullanici,p_alici,'benim',NULL,NULL,NULL$$),
  ('public.cogniti_token_bm_detay_raporu_alici(uuid,uuid,integer,text,text,text)', $$p_kullanici,p_alici,'bm',NULL,NULL,p_utt$$),
  ('public.cogniti_token_tm_detay_raporu_alici(uuid,uuid,uuid,integer,text,text,text)', $$p_kullanici,p_alici,'tm',NULL,p_bm,p_utt$$),
  ('public.cogniti_token_yonetici_detay_raporu_alici(uuid,uuid,uuid,uuid,integer,text,text,text)', $$p_kullanici,p_alici,'yonetici',p_tm,p_bm,p_utt$$)
 ) v(imza,args) LOOP
  kaynak:=pg_get_functiondef(imza::regprocedure);
  IF strpos(kaynak,'-- viva-ayri-rapor-v1')>0 THEN CONTINUE; END IF;
  eski:=substring(kaynak FROM 'viva_bilgileri AS \([\s\S]*?\), sirali AS');
  IF eski IS NULL OR strpos(kaynak,'FROM ham WHERE (p_arac=')=0 THEN
   RAISE EXCEPTION 'Viva rapor bağlantısı değişmiş: %',imza;
  END IF;
  yeni:='viva_bilgileri AS ('||E'\n -- viva-ayri-rapor-v1\n'||
   ' SELECT g.*,NULL::text[] AS davetli_turleri,NULL::bigint AS davetli_sayisi,NULL::integer AS katilim_sayisi FROM gruplar g'||
   ' UNION ALL SELECT v.tarih,v.yayin_id,NULL::text,NULL::integer,v.urun,v.arac,v.rol,v.yayin_adi,false,v.gonderilen,v.token,'||
   'v.davetli_turleri,v.davetli_sayisi,v.katilim_sayisi FROM public.cogniti_token_viva_rapor_satirlari('||args||') v'||
   $$ WHERE p_arac IN ('tumu','viva') AND p_gonderi='eclub' ), sirali AS$$;
  kaynak:=replace(kaynak,eski,yeni);
  kaynak:=replace(kaynak,'FROM ham WHERE (p_arac=', $$FROM ham WHERE arac IS DISTINCT FROM 'viva' AND (p_arac=$$);
  EXECUTE kaynak;
 END LOOP;
END $patch$;
COMMIT;
SELECT to_regprocedure('public.cogniti_token_viva_detay_raporu(uuid,integer,text,text,uuid,uuid,uuid)') IS NOT NULL AS viva_detay_raporu_hazir;
