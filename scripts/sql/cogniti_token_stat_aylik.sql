-- Tüketim stat kartları: Türkiye saatine göre mevcut ayın başı dahil, bugünün başlangıcı hariç.
-- Yalnız raporlama fonksiyonları güncellenir. Geçmiş kayıtlar, bakiye, aylık limit ve detay tabloları korunur.
-- Kullanıcı Supabase SQL Editor’da çalıştırır.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_token_gun_sonu(
 p_kullanici uuid,p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; h record; v_sinir timestamptz; v_limit bigint;
 v_firma bigint; v_eclub bigint; v_eczanem bigint;
 v_ay_baslangici timestamptz;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 v_ay_baslangici:=date_trunc('month',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 SELECT u.kullanici_id,u.firma_id INTO k FROM public.kullanicilar u
 JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND u.aktif_mi=true AND lower(u.rol) IN ('utt','kd_utt');
 IF NOT FOUND THEN RAISE EXCEPTION 'Token özetine erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 v_sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id;
 IF NOT FOUND OR h.created_at>=v_sinir THEN
  RETURN jsonb_build_object('donem_baslangici',(v_ay_baslangici AT TIME ZONE 'Europe/Istanbul')::date,'veri_tarihi',(v_sinir AT TIME ZONE 'Europe/Istanbul')::date-1,'hazir',false);
 END IF;
 IF h.paket_turu='kullandigin_kadar_ode' THEN v_limit:=1500;
 ELSE
  SELECT y.miktar INTO v_limit FROM public.cogniti_token_yuklemeleri y
  WHERE y.firma_id=k.firma_id AND y.yukleme_turu='aylik_paket' AND y.created_at<v_sinir
  ORDER BY y.donem_yil DESC,y.donem_ay DESC,y.created_at DESC,y.yukleme_id DESC LIMIT 1;
 END IF;

 -- Mevcut ayın kayıtlı tüketim miktarı; bugünün işlemleri ertesi gün yansır.
 SELECT coalesce(sum(t.miktar),0)::bigint,
  coalesce(sum(t.miktar) FILTER(WHERE t.gonderen_turu='firma_kullanicisi'
   AND t.gonderen_id=k.kullanici_id AND t.islem_turu IN ('eclub_oneri','viva_sure','viva_davet')),0)::bigint
 INTO v_firma,v_eclub FROM public.cogniti_token_tuketimleri t
 WHERE t.firma_id=k.firma_id AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<v_sinir;

 -- Müşteriye gerçek gönderim ve tüketim eşleşir. UTT gönderim anındaki sabit
 -- yayın/eczane dağıtımından bulunur; güncel eczane bağı geçmişi değiştirmez.
 SELECT coalesce(sum(t.miktar),0)::bigint INTO v_eczanem
 FROM public.cogniti_token_tuketimleri t
 WHERE t.firma_id=k.firma_id AND t.islem_turu='eczanem_musteri'
  AND t.gonderen_turu='eclub_kisi' AND t.alici_turu='eczanem_musteri'
  AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<v_sinir
  AND EXISTS (
   SELECT 1 FROM public.eczanem_gonderimler eg
   JOIN public.eczanem_eczane_gonderimleri d ON d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
    AND d.gonderen_utt_id=k.kullanici_id AND d.created_at<=eg.created_at
   WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text
    AND t.kaynak_id=eg.yayin_id AND t.gonderen_id=eg.gonderen_kisi_id
    AND t.alici_kimligi=eg.musteri_id::text AND eg.created_at<v_sinir
  );
 RETURN jsonb_build_object('hazir',true,'donem_baslangici',(v_ay_baslangici AT TIME ZONE 'Europe/Istanbul')::date,'veri_tarihi',(v_sinir AT TIME ZONE 'Europe/Istanbul')::date-1,
  'plan_limiti',v_limit,'firma_toplam_token',v_firma,'eclub_token',v_eclub,'eczanem_token',v_eczanem);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_gun_sonu(uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_gun_sonu(uuid,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_bm_raporu(p_kullanici uuid,p_utt uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; v_firma uuid; ids uuid[]; h record; sinir timestamptz; gun_sonu jsonb;
 v_limit bigint; firma_toplam bigint; eclub_toplam bigint; eczanem_toplam bigint; oneri_toplam bigint;
 v_ay_baslangici timestamptz;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 v_ay_baslangici:=date_trunc('month',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 kapsam:=public.cogniti_token_bm_kapsami(p_kullanici,p_utt);v_firma:=(kapsam->>'firma_id')::uuid;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=v_firma;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false,'uttler',kapsam->'uttler','secili_utt_id',p_utt); END IF;
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 gun_sonu:=jsonb_build_object('hazir',false,'donem_baslangici',(v_ay_baslangici AT TIME ZONE 'Europe/Istanbul')::date,'veri_tarihi',(sinir AT TIME ZONE 'Europe/Istanbul')::date-1);
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
  WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<sinir;
  SELECT coalesce(sum(t.miktar),0)::bigint INTO eczanem_toplam FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<sinir AND t.islem_turu='eczanem_musteri'
   AND t.gonderen_turu='eclub_kisi' AND t.alici_turu='eczanem_musteri' AND EXISTS(
    SELECT 1 FROM public.eczanem_gonderimler eg
    JOIN public.eczanem_eczane_gonderimleri d ON d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
     AND d.gonderen_utt_id=ANY(ids) AND d.created_at<=eg.created_at
    WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND t.kaynak_id=eg.yayin_id
     AND t.gonderen_id=eg.gonderen_kisi_id AND t.alici_kimligi=eg.musteri_id::text AND eg.created_at<sinir
   );
  SELECT coalesce(sum(t.miktar),0)::bigint INTO oneri_toplam
  FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=p_kullanici
   AND t.islem_turu='tclub_oneri' AND t.alici_turu='firma_kullanicisi'
   AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<sinir;
  gun_sonu:=gun_sonu||jsonb_build_object('hazir',true,'plan_limiti',v_limit,'firma_toplam_token',firma_toplam,'eclub_token',eclub_toplam,'eczanem_token',eczanem_toplam,'oneri_token',oneri_toplam);
 END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam','bolge','yonetici',false,'paket_turu',h.paket_turu,
  'uttler',kapsam->'uttler','secili_utt_id',p_utt,'gun_sonu',gun_sonu);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_bm_raporu(uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_bm_raporu(uuid,uuid,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_tm_raporu(p_kullanici uuid,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; v_firma uuid; ids uuid[]; h record; sinir timestamptz; gun_sonu jsonb;
 v_limit bigint; firma_toplam bigint; eclub_toplam bigint; eczanem_toplam bigint; oneri_toplam bigint;
 v_ay_baslangici timestamptz;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 v_ay_baslangici:=date_trunc('month',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 kapsam:=public.cogniti_token_tm_kapsami(p_kullanici,p_bm,p_utt);v_firma:=(kapsam->>'firma_id')::uuid;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=v_firma;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false,'bmler',kapsam->'bmler','secili_bm_id',p_bm,'uttler',kapsam->'uttler','secili_utt_id',p_utt); END IF;
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 gun_sonu:=jsonb_build_object('hazir',false,'donem_baslangici',(v_ay_baslangici AT TIME ZONE 'Europe/Istanbul')::date,'veri_tarihi',(sinir AT TIME ZONE 'Europe/Istanbul')::date-1);
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
  WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<sinir;
  SELECT coalesce(sum(t.miktar),0)::bigint INTO eczanem_toplam FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<sinir AND t.islem_turu='eczanem_musteri'
   AND t.gonderen_turu='eclub_kisi' AND t.alici_turu='eczanem_musteri' AND EXISTS(
    SELECT 1 FROM public.eczanem_gonderimler eg
    JOIN public.eczanem_eczane_gonderimleri d ON d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
     AND d.gonderen_utt_id=ANY(ids) AND d.created_at<=eg.created_at
    WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND t.kaynak_id=eg.yayin_id
     AND t.gonderen_id=eg.gonderen_kisi_id AND t.alici_kimligi=eg.musteri_id::text AND eg.created_at<sinir
   );
  SELECT coalesce(sum(t.miktar),0)::bigint INTO oneri_toplam
  FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.gonderen_turu='firma_kullanicisi'
   AND t.islem_turu='tclub_oneri' AND t.alici_turu='firma_kullanicisi'
   AND t.alici_kimligi IN (SELECT unnest(ids)::text)
   AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<sinir
   AND EXISTS (
    SELECT 1 FROM public.kullanicilar g
    JOIN public.kullanicilar tm ON tm.kullanici_id=p_kullanici AND tm.takim_id=g.takim_id
    WHERE g.kullanici_id=t.gonderen_id AND g.firma_id=v_firma
     AND lower(g.rol)='bm' AND g.aktif_mi=true AND g.bolge_id IS NOT NULL
     AND (p_bm IS NULL OR g.kullanici_id=p_bm)
   );
  gun_sonu:=gun_sonu||jsonb_build_object('hazir',true,'plan_limiti',v_limit,'firma_toplam_token',firma_toplam,'eclub_token',eclub_toplam,'eczanem_token',eczanem_toplam,'oneri_token',oneri_toplam);
 END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam','takim','yonetici',false,'paket_turu',h.paket_turu,
  'bmler',kapsam->'bmler','secili_bm_id',p_bm,'uttler',kapsam->'uttler','secili_utt_id',p_utt,'gun_sonu',gun_sonu);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_tm_raporu(uuid,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_tm_raporu(uuid,uuid,uuid,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_yonetici_raporu(p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_utt uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; v_firma uuid; ids uuid[]; h record; sinir timestamptz; gun_sonu jsonb;
 v_limit bigint; firma_toplam bigint; eclub_toplam bigint; eczanem_toplam bigint;
 v_ay_baslangici timestamptz;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 v_ay_baslangici:=date_trunc('month',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,p_utt);v_firma:=(kapsam->>'firma_id')::uuid;
 SELECT coalesce(array_agg(value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(kapsam->'ids');
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=v_firma;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false,'tmler',kapsam->'tmler','secili_tm_id',p_tm,'bmler',kapsam->'bmler','secili_bm_id',p_bm,'uttler',kapsam->'uttler','secili_utt_id',p_utt); END IF;
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 gun_sonu:=jsonb_build_object('hazir',false,'donem_baslangici',(v_ay_baslangici AT TIME ZONE 'Europe/Istanbul')::date,'veri_tarihi',(sinir AT TIME ZONE 'Europe/Istanbul')::date-1);
 IF h.created_at<sinir THEN
  IF h.paket_turu='kullandigin_kadar_ode' THEN v_limit:=1500;
  ELSE SELECT y.miktar INTO v_limit FROM public.cogniti_token_yuklemeleri y
   WHERE y.firma_id=v_firma AND y.yukleme_turu='aylik_paket' AND y.created_at<sinir
   ORDER BY y.donem_yil DESC,y.donem_ay DESC,y.created_at DESC,y.yukleme_id DESC LIMIT 1;
  END IF;
  SELECT coalesce(sum(t.miktar),0)::bigint,
   coalesce(sum(t.miktar) FILTER(WHERE t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=ANY(ids)
    AND t.islem_turu IN ('eclub_oneri','viva_davet','viva_sure')
    AND public.cogniti_token_urun_kapsaminda(kapsam,t.kaynak_id,t.islem_turu IN ('viva_davet','viva_sure'))),0)::bigint
  INTO firma_toplam,eclub_toplam FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<sinir;
  SELECT coalesce(sum(t.miktar),0)::bigint INTO eczanem_toplam FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at>=v_ay_baslangici AND t.created_at<sinir AND t.islem_turu='eczanem_musteri'
   AND t.gonderen_turu='eclub_kisi' AND t.alici_turu='eczanem_musteri'
   AND public.cogniti_token_urun_kapsaminda(kapsam,t.kaynak_id,false) AND EXISTS(
    SELECT 1 FROM public.eczanem_gonderimler eg
    JOIN public.eczanem_eczane_gonderimleri d ON d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
     AND d.gonderen_utt_id=ANY(ids) AND d.created_at<=eg.created_at
    WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND t.kaynak_id=eg.yayin_id
     AND t.gonderen_id=eg.gonderen_kisi_id AND t.alici_kimligi=eg.musteri_id::text AND eg.created_at<sinir
   );
  gun_sonu:=gun_sonu||jsonb_build_object('hazir',true,'plan_limiti',v_limit,'firma_toplam_token',firma_toplam,'eclub_token',eclub_toplam,'eczanem_token',eczanem_toplam);
 END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam','firma','yonetici',false,'paket_turu',h.paket_turu,
  'tmler',kapsam->'tmler','secili_tm_id',p_tm,'bmler',kapsam->'bmler','secili_bm_id',p_bm,'uttler',kapsam->'uttler','secili_utt_id',p_utt,'gun_sonu',gun_sonu);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_yonetici_raporu(uuid,uuid,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_yonetici_raporu(uuid,uuid,uuid,uuid,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_pm_egitim_ozeti(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sinir timestamptz; toplam bigint; kapsam jsonb;
 v_ay_baslangici timestamptz;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 v_ay_baslangici:=date_trunc('month',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h
  WHERE h.firma_id=(kapsam->>'firma_id')::uuid AND h.created_at<sinir) THEN
  RETURN jsonb_build_object('token',NULL);
 END IF;
 SELECT coalesce(sum(s.token),0)::bigint INTO toplam
 FROM public.cogniti_token_pm_egitim_satirlari(p_kullanici,p_tm,p_bm) s WHERE s.created_at>=v_ay_baslangici AND s.created_at<sinir;
 RETURN jsonb_build_object('token',toplam);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_pm_egitim_ozeti(uuid,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_pm_egitim_ozeti(uuid,uuid,uuid,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_pm_oneri_ozeti(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sinir timestamptz; toplam bigint; kapsam jsonb;
 v_ay_baslangici timestamptz;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 v_ay_baslangici:=date_trunc('month',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h
  WHERE h.firma_id=(kapsam->>'firma_id')::uuid AND h.created_at<sinir) THEN
  RETURN jsonb_build_object('token',NULL);
 END IF;
 SELECT coalesce(sum(s.token),0)::bigint INTO toplam
 FROM public.cogniti_token_pm_oneri_satirlari(p_kullanici,p_tm,p_bm) s WHERE s.created_at>=v_ay_baslangici AND s.created_at<sinir;
 RETURN jsonb_build_object('token',toplam);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_pm_oneri_ozeti(uuid,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_pm_oneri_ozeti(uuid,uuid,uuid,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_uretici_icerik_ozeti(
 p_kullanici uuid,p_tm uuid DEFAULT NULL,p_bm uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp(),p_tur text DEFAULT 'urun_egitimi'
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sinir timestamptz; toplam bigint; kapsam jsonb;
 v_ay_baslangici timestamptz;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 v_ay_baslangici:=date_trunc('month',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 kapsam:=public.cogniti_token_yonetici_kapsami(p_kullanici,p_tm,p_bm,NULL);
 IF p_tur IS NULL OR p_tur NOT IN ('urun_egitimi','satis_teknikleri','yonetim_egitimi','medikal_egitim','urun_medikal_egitim','ik_egitimi')
  OR (nullif(kapsam->>'uretici_id','') IS NOT NULL AND NOT (kapsam->'uretici_turleri' ? p_tur)) THEN
  RAISE EXCEPTION 'Bu içerik türüne erişiminiz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h
  WHERE h.firma_id=(kapsam->>'firma_id')::uuid AND h.created_at<sinir) THEN
  RETURN jsonb_build_object('token',NULL);
 END IF;
 SELECT coalesce(sum(s.token),0)::bigint INTO toplam
 FROM public.cogniti_token_uretici_icerik_satirlari(p_kullanici,p_tm,p_bm,p_tur) s WHERE s.created_at>=v_ay_baslangici AND s.created_at<sinir;
 RETURN jsonb_build_object('token',toplam);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_uretici_icerik_ozeti(uuid,uuid,uuid,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_uretici_icerik_ozeti(uuid,uuid,uuid,timestamptz,text) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS token_stat_aylik_hazir;
