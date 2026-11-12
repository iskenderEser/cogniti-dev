-- Kullanıcı çalıştıracak. UTT, BM ve TM için salt okunur aylık kart raporu.
-- Önceki kurulumun üzerine tekrar çalıştırılabilir.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_token_saha_aylik_kartlari(
  p_kullanici uuid, p_gorunum text, p_bm uuid DEFAULT NULL,
  p_utt uuid DEFAULT NULL, p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE
  v_firma uuid;
  v_rol text;
  v_kapsam jsonb := '{}'::jsonb;
  v_temsilciler uuid[];
  v_ay timestamptz := date_trunc('month',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
  v_sinir timestamptz := date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
  v_firma_toplam bigint;
  v_firma_yayin_token bigint;
  v_eclub bigint;
  v_eczanem bigint;
  v_eclub_gonderi bigint;
  v_eczanem_gonderi bigint;
  v_oneri bigint;
  v_hesap_var boolean;
BEGIN
  IF p_an IS NULL OR p_gorunum IS NULL OR p_gorunum NOT IN ('utt','bm','tm')
    OR (p_bm IS NOT NULL AND p_gorunum <> 'tm')
    OR (p_utt IS NOT NULL AND p_gorunum = 'utt') THEN
    RAISE EXCEPTION 'Geçersiz saha raporu isteği.' USING ERRCODE='22023';
  END IF;

  SELECT u.firma_id, lower(u.rol) INTO v_firma,v_rol
  FROM public.kullanicilar u JOIN public.firmalar f USING(firma_id)
  WHERE u.kullanici_id=p_kullanici AND u.aktif_mi AND f.aktif;
  IF NOT FOUND OR v_rol IS NULL OR (v_rol <> p_gorunum AND NOT (v_rol='kd_utt' AND p_gorunum='utt')) THEN
    RAISE EXCEPTION 'Saha raporuna erişiminiz bulunmuyor.' USING ERRCODE='42501';
  END IF;

  IF p_gorunum='bm' THEN
    v_kapsam := public.cogniti_token_bm_kapsami(p_kullanici,p_utt);
  ELSIF p_gorunum='tm' THEN
    v_kapsam := public.cogniti_token_tm_kapsami(p_kullanici,p_bm,p_utt);
  END IF;
  v_temsilciler := CASE WHEN p_gorunum='utt' THEN ARRAY[p_kullanici]
    ELSE ARRAY(SELECT value::uuid FROM jsonb_array_elements_text(v_kapsam->'ids')) END;

  WITH hareketler AS (
    SELECT t.miktar, t.gonderen_id, t.kaynak_id,
      CASE WHEN t.islem_turu='eczanem_musteri' AND t.gonderen_turu='eclub_kisi' AND t.alici_turu='eczanem_musteri'
        THEN 'eczanem' WHEN t.gonderen_turu='firma_kullanicisi'
        AND t.islem_turu IN ('eclub_oneri','viva_davet','viva_sure') THEN 'eclub' END AS kanal,
      eg.eczane_id, eg.created_at AS iletildi_at,
      t.islem_turu IN ('yayin','tclub_oneri','cclub_challenge','eclub_oneri','eczanem_musteri','viva_davet','viva_sure') AS yayin_tuketimi
    FROM public.cogniti_token_tuketimleri t
    LEFT JOIN public.eczanem_gonderimler eg ON t.islem_turu='eczanem_musteri'
      AND t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND t.kaynak_id=eg.yayin_id
      AND t.gonderen_id=eg.gonderen_kisi_id AND t.alici_kimligi=eg.musteri_id::text
    WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at>=v_ay AND t.created_at<v_sinir
    UNION ALL
    SELECT t.miktar,t.gonderen_id,t.kaynak_id,
      CASE WHEN t.alici_turu='eclub_kisi' THEN 'eclub' END,NULL,NULL,true
    FROM public.cogniti_esnek_gonderim_tuketimleri t
    WHERE t.firma_id=v_firma AND t.miktar>0 AND t.created_at>=v_ay AND t.created_at<v_sinir
    UNION ALL
    SELECT 1,NULL,z.yayin_id,'eczanem',eg.eczane_id,eg.created_at,true
    FROM public.eczanem_token_bloklari z
    LEFT JOIN public.eczanem_gonderimler eg ON eg.gonderim_id=z.gonderim_id
      AND eg.yayin_id=z.yayin_id AND eg.eczane_id=z.eczane_id AND eg.musteri_id=z.musteri_id
    WHERE z.firma_id=v_firma AND z.durum='tuketildi' AND z.tuketildi_at>=v_ay AND z.tuketildi_at<v_sinir
  )
  SELECT coalesce(sum(m.miktar),0),
    coalesce(sum(m.miktar) FILTER (WHERE m.yayin_tuketimi),0),
    coalesce(sum(m.miktar) FILTER (WHERE m.kanal='eclub' AND m.gonderen_id=ANY(v_temsilciler)),0),
    coalesce(sum(m.miktar) FILTER (WHERE m.kanal='eczanem' AND EXISTS (
      SELECT 1 FROM public.eczanem_eczane_gonderimleri d
      WHERE d.yayin_id=m.kaynak_id AND d.eczane_id=m.eczane_id
        AND d.gonderen_utt_id=ANY(v_temsilciler) AND d.created_at<=m.iletildi_at
    )),0)
  INTO v_firma_toplam,v_firma_yayin_token,v_eclub,v_eczanem FROM hareketler m;

  SELECT count(*) INTO v_eclub_gonderi
  FROM public.eclub_oneri_kayitlari o
  WHERE o.oneren_id=ANY(v_temsilciler) AND o.oneri_baslangic>=v_ay AND o.oneri_baslangic<v_sinir
    AND EXISTS(SELECT 1 FROM public.v_yayin_detay y WHERE y.yayin_id=o.yayin_id AND y.firma_id=v_firma);

  SELECT count(*) INTO v_eczanem_gonderi
  FROM public.eczanem_gonderimler eg
  WHERE eg.created_at>=v_ay AND eg.created_at<v_sinir
    AND EXISTS(SELECT 1 FROM public.v_yayin_detay y WHERE y.yayin_id=eg.yayin_id AND y.firma_id=v_firma)
    AND EXISTS(
      SELECT 1 FROM public.eczanem_eczane_gonderimleri d
      WHERE d.yayin_id=eg.yayin_id AND d.eczane_id=eg.eczane_id
        AND d.gonderen_utt_id=ANY(v_temsilciler) AND d.created_at<=eg.created_at
    );

  IF p_gorunum IN ('bm','tm') THEN
    SELECT coalesce(sum(t.miktar),0) INTO v_oneri
    FROM public.cogniti_token_tuketimleri t
    WHERE t.firma_id=v_firma AND t.gonderen_turu='firma_kullanicisi'
      AND t.islem_turu='tclub_oneri' AND t.alici_turu='firma_kullanicisi'
      AND t.miktar>0 AND t.created_at>=v_ay AND t.created_at<v_sinir
      AND ((p_gorunum='bm' AND t.gonderen_id=p_kullanici)
        OR (p_gorunum='tm' AND t.alici_kimligi IN (SELECT unnest(v_temsilciler)::text) AND EXISTS (
          SELECT 1 FROM public.kullanicilar g
          JOIN public.kullanicilar tm ON tm.kullanici_id=p_kullanici AND tm.takim_id=g.takim_id
          WHERE g.kullanici_id=t.gonderen_id AND g.firma_id=v_firma
            AND lower(g.rol)='bm' AND g.aktif_mi AND g.bolge_id IS NOT NULL
            AND (p_bm IS NULL OR g.kullanici_id=p_bm)
        )));
  END IF;

  v_hesap_var := v_firma_toplam>0 OR v_eclub_gonderi>0 OR v_eczanem_gonderi>0
    OR EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari WHERE firma_id=v_firma)
    OR EXISTS(SELECT 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE firma_id=v_firma);
  RETURN (v_kapsam-'ids'-'firma_id') || jsonb_build_object(
    'hesap_var',v_hesap_var,'gun_sonu',jsonb_build_object(
      'hazir',true,'donem_baslangici',(v_ay AT TIME ZONE 'Europe/Istanbul')::date,
      'veri_tarihi',(v_sinir AT TIME ZONE 'Europe/Istanbul')::date-1,
      'firma_toplam_token',v_firma_toplam,'eclub_token',v_eclub,'eczanem_token',v_eczanem,'oneri_token',v_oneri,
      'firma_yayin_token',v_firma_yayin_token,'eclub_gonderi',v_eclub_gonderi,'eczanem_gonderi',v_eczanem_gonderi
    ));
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_token_saha_aylik_kartlari(uuid,text,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_token_saha_aylik_kartlari(uuid,text,uuid,uuid,timestamptz) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_token_saha_aylik_kartlari_kuruldu;
