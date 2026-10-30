-- BM'nin kendi öneri tüketimi: araç ve temsilci seçiminden bağımsız, diğer kartlarla aynı gün sonu sınırı.
-- Yalnız raporlamayı değiştirir; tüketim ve bakiyeyi değiştirmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_bm_raporu(p_kullanici uuid,p_utt uuid DEFAULT NULL,p_an timestamptz DEFAULT statement_timestamp())
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE kapsam jsonb; v_firma uuid; ids uuid[]; h record; sinir timestamptz; gun_sonu jsonb;
 v_limit bigint; firma_toplam bigint; eclub_toplam bigint; eczanem_toplam bigint; oneri_toplam bigint;
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
  SELECT coalesce(sum(t.miktar),0)::bigint INTO oneri_toplam
  FROM public.cogniti_token_tuketimleri t
  WHERE t.firma_id=v_firma AND t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=p_kullanici
   AND t.islem_turu='tclub_oneri' AND t.alici_turu='firma_kullanicisi'
   AND t.miktar>0 AND t.created_at<sinir;
  gun_sonu:=gun_sonu||jsonb_build_object('hazir',true,'plan_limiti',v_limit,'firma_toplam_token',firma_toplam,'eclub_token',eclub_toplam,'eczanem_token',eczanem_toplam,'oneri_token',oneri_toplam);
 END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam','bolge','yonetici',false,'paket_turu',h.paket_turu,
  'uttler',kapsam->'uttler','secili_utt_id',p_utt,'gun_sonu',gun_sonu);
END $$;

NOTIFY pgrst,'reload schema';
COMMIT;
