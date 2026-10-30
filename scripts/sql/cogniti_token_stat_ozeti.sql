-- /token UTT stat kartları: firma toplamı, kendi E-Club/Viva ve Eczanem tüketimi.
-- Kullanıcı Supabase SQL Editor'da çalıştırır. Tüketim veya bakiye kaydı yazmaz.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_gun_sonu(
 p_kullanici uuid,p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; h record; v_sinir timestamptz; v_limit bigint;
 v_firma bigint; v_eclub bigint; v_eczanem bigint;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 SELECT u.kullanici_id,u.firma_id INTO k FROM public.kullanicilar u
 JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND u.aktif_mi=true AND lower(u.rol) IN ('utt','kd_utt');
 IF NOT FOUND THEN RAISE EXCEPTION 'Token özetine erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 v_sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id;
 IF NOT FOUND OR h.created_at>=v_sinir THEN
  RETURN jsonb_build_object('veri_tarihi',(v_sinir AT TIME ZONE 'Europe/Istanbul')::date-1,'hazir',false);
 END IF;
 IF h.paket_turu='kullandigin_kadar_ode' THEN v_limit:=1500;
 ELSE
  SELECT y.miktar INTO v_limit FROM public.cogniti_token_yuklemeleri y
  WHERE y.firma_id=k.firma_id AND y.yukleme_turu='aylik_paket' AND y.created_at<v_sinir
  ORDER BY y.donem_yil DESC,y.donem_ay DESC,y.created_at DESC,y.yukleme_id DESC LIMIT 1;
 END IF;

 -- Tüm tarihlerdeki kayıtlı tüketim miktarı; bugünün işlemleri ertesi gün yansır.
 SELECT coalesce(sum(t.miktar),0)::bigint,
  coalesce(sum(t.miktar) FILTER(WHERE t.gonderen_turu='firma_kullanicisi'
   AND t.gonderen_id=k.kullanici_id AND t.islem_turu IN ('eclub_oneri','viva_sure','viva_davet')),0)::bigint
 INTO v_firma,v_eclub FROM public.cogniti_token_tuketimleri t
 WHERE t.firma_id=k.firma_id AND t.miktar>0 AND t.created_at<v_sinir;

 -- Müşteriye gerçek gönderim ve tüketim eşleşir. UTT gönderim anındaki sabit
 -- yayın/eczane dağıtımından bulunur; güncel eczane bağı geçmişi değiştirmez.
 SELECT coalesce(sum(t.miktar),0)::bigint INTO v_eczanem
 FROM public.cogniti_token_tuketimleri t
 WHERE t.firma_id=k.firma_id AND t.islem_turu='eczanem_musteri'
  AND t.gonderen_turu='eclub_kisi' AND t.alici_turu='eczanem_musteri'
  AND t.miktar>0 AND t.created_at<v_sinir
  AND EXISTS (
   SELECT 1 FROM public.eczanem_gonderimler eg
   JOIN public.eczanem_eczane_gonderimleri d ON d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
    AND d.gonderen_utt_id=k.kullanici_id AND d.created_at<=eg.created_at
   WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text
    AND t.kaynak_id=eg.yayin_id AND t.gonderen_id=eg.gonderen_kisi_id
    AND t.alici_kimligi=eg.musteri_id::text AND eg.created_at<v_sinir
  );
 RETURN jsonb_build_object('hazir',true,'veri_tarihi',(v_sinir AT TIME ZONE 'Europe/Istanbul')::date-1,
  'plan_limiti',v_limit,'firma_toplam_token',v_firma,'eclub_token',v_eclub,'eczanem_token',v_eczanem);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_gun_sonu(uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_gun_sonu(uuid,timestamptz) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.cogniti_token_gun_sonu(uuid,timestamptz)') IS NOT NULL AS token_stat_ozeti_kuruldu;
