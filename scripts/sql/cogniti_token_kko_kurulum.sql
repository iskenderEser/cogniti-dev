-- KKÖ devam onayı: mevcut bakiyeyi değiştirmez; hesap pasife alma ayrı adımdır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-token-kko-onay'));
ALTER TABLE public.cogniti_token_hesaplari ADD COLUMN IF NOT EXISTS kko_onay_surumu uuid NOT NULL DEFAULT gen_random_uuid();
CREATE OR REPLACE FUNCTION public.cogniti_token_kko_yetkili(p_firma uuid,p_kullanici uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.cogniti_token_hesaplari h
 JOIN public.firmalar f ON f.firma_id=h.firma_id AND f.aktif=true
 JOIN public.kullanicilar k ON k.kullanici_id=p_kullanici AND k.firma_id=h.firma_id AND k.aktif_mi=true
 WHERE h.firma_id=p_firma AND h.paket_turu='kullandigin_kadar_ode'
 AND k.kullanici_id=coalesce(h.onay_yetkili_id,(
 SELECT g.kullanici_id FROM public.kullanicilar g WHERE g.firma_id=h.firma_id AND g.rol='gm' AND g.aktif_mi=true
 AND (SELECT count(*) FROM public.kullanicilar x WHERE x.firma_id=h.firma_id AND x.rol='gm' AND x.aktif_mi=true)=1)));
$$;
CREATE OR REPLACE FUNCTION public.cogniti_token_kko_durum(p_kullanici uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; v_bakiye bigint;
BEGIN
 SELECT h1.* INTO h FROM public.cogniti_token_hesaplari h1 JOIN public.kullanicilar k
 ON k.firma_id=h1.firma_id AND k.kullanici_id=p_kullanici AND k.aktif_mi=true;
 IF NOT FOUND OR NOT public.cogniti_token_kko_yetkili(h.firma_id,p_kullanici) THEN RETURN jsonb_build_object('onay_gerekli',false); END IF;
 SELECT net_bakiye INTO v_bakiye FROM public.cogniti_token_bakiye(h.firma_id);
 IF v_bakiye>100 THEN RETURN jsonb_build_object('onay_gerekli',false); END IF;
 RETURN jsonb_build_object('onay_gerekli',true,'bakiye',v_bakiye,'onay_surumu',h.kko_onay_surumu);
END $$;
CREATE OR REPLACE FUNCTION public.cogniti_token_kko_onayla(p_kullanici uuid,p_surum uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; v_firma uuid; v_bakiye bigint; v_yukleme uuid; y public.cogniti_token_yuklemeleri%ROWTYPE;
BEGIN
 IF p_kullanici IS NULL OR p_surum IS NULL THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_gecersiz_onay' USING ERRCODE='22023'; END IF;
 SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id=p_kullanici AND aktif_mi=true;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=v_firma FOR UPDATE;
 IF NOT FOUND OR NOT public.cogniti_token_kko_yetkili(v_firma,p_kullanici) THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_yetkisiz' USING ERRCODE='42501'; END IF;
 SELECT * INTO y FROM public.cogniti_token_yuklemeleri WHERE firma_id=v_firma AND islem_anahtari='kko-devam:'||p_surum::text;
 IF FOUND THEN
  IF y.yukleme_turu<>'kko' OR y.miktar<>1500 THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_gecersiz_onay' USING ERRCODE='22023'; END IF;
  SELECT net_bakiye INTO v_bakiye FROM public.cogniti_token_bakiye(v_firma);
  RETURN jsonb_build_object('yukleme_id',y.yukleme_id,'bakiye',v_bakiye,'yeniden_deneme',true);
 END IF;
 IF h.kko_onay_surumu<>p_surum THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_guncel_degil' USING ERRCODE='40001'; END IF;
 SELECT net_bakiye INTO v_bakiye FROM public.cogniti_token_bakiye(v_firma);
 IF v_bakiye>100 THEN RAISE EXCEPTION 'COGNITI_TOKEN:kko_esik_asilmadi' USING ERRCODE='22023'; END IF;
 v_yukleme:=public.cogniti_token_yukle(v_firma,'kko',1500,'kko-devam:'||p_surum::text,NULL,NULL,p_kullanici,'KKÖ yetkili devam onayı');
 UPDATE public.cogniti_token_hesaplari SET kko_onay_surumu=gen_random_uuid(),updated_at=now() WHERE firma_id=v_firma;
 SELECT coalesce(sum(y1.kalan) FILTER (WHERE y1.son_kullanim_at IS NULL OR y1.son_kullanim_at>statement_timestamp()),0)-h1.asim_borcu INTO v_bakiye FROM public.cogniti_token_hesaplari h1 LEFT JOIN public.cogniti_token_yuklemeleri y1 ON y1.firma_id=h1.firma_id WHERE h1.firma_id=v_firma GROUP BY h1.asim_borcu;
 RETURN jsonb_build_object('yukleme_id',v_yukleme,'bakiye',v_bakiye,'yeniden_deneme',false);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_kko_yetkili(uuid,uuid),public.cogniti_token_kko_durum(uuid),public.cogniti_token_kko_onayla(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_kko_yetkili(uuid,uuid),public.cogniti_token_kko_durum(uuid),public.cogniti_token_kko_onayla(uuid,uuid) TO service_role;
COMMIT;
SELECT to_regprocedure('public.cogniti_token_kko_durum(uuid)') IS NOT NULL AS kko_esik_kontrolu_kuruldu,
 to_regprocedure('public.cogniti_token_kko_onayla(uuid,uuid)') IS NOT NULL AS kko_devam_onayi_kuruldu;
