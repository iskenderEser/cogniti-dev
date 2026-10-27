-- Eczane → müşteri gerçek gönderimi başına yayının sahibi firmadan 1 token.
-- Firma → UTT ve UTT → eczane kayıtlarına tetikleyici eklemez.
-- Çoklu yayın/müşteri seçimi tek transaction'da mevcut gönderim işlevinden geçer.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-eczanem-v1',0));
DO $$
BEGIN
 IF to_regprocedure('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)') IS NULL
 OR to_regprocedure('public.eczanem_musterilere_video_gonder(uuid,uuid,uuid,uuid[])') IS NULL
 OR to_regclass('public.eczanem_gonderimler') IS NULL THEN
  RAISE EXCEPTION 'Eczanem müşteri gönderimi ve token tüketim önkoşulları eksik.';
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.cogniti_token_eczanem_musteri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 -- Eczanenin veya personelin firması değil, gönderilen yayının sahibi firma.
 SELECT firma_id INTO v_firma FROM public.v_yayin_detay WHERE yayin_id=NEW.yayin_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:yayin_firma_yok' USING ERRCODE='P0001';
 END IF;
 BEGIN
  PERFORM public.cogniti_token_tuket(v_firma,'eclub_kisi',NEW.gonderen_kisi_id,
   'eczanem_musteri',NEW.musteri_id::text,'eczanem_musteri',NEW.yayin_id,'eczanem-gonderim:'||NEW.gonderim_id::text);
 EXCEPTION WHEN SQLSTATE '22023' THEN
  IF SQLERRM='Yetersiz token bakiyesi.' THEN
   RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
  ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
   RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001';
  ELSE RAISE;
  END IF;
 END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_eczanem_musteri_kaydet() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_token_eczanem_musteri ON public.eczanem_gonderimler;
CREATE TRIGGER trg_cogniti_token_eczanem_musteri AFTER INSERT ON public.eczanem_gonderimler
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_eczanem_musteri_kaydet();

CREATE OR REPLACE FUNCTION public.cogniti_token_eczanem_toplu_gonder(
 p_eczane_id uuid,p_gonderen_kisi_id uuid,p_yayin_idler uuid[],p_musteri_idler uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_yayin uuid; v_musteriler uuid[]; v_bas integer; v_sonuc record;
 v_hedefler uuid[]; v_gonderilen integer:=0; v_atlanan integer:=0; v_sonuclar jsonb:='[]'::jsonb;
BEGIN
 IF p_eczane_id IS NULL OR p_gonderen_kisi_id IS NULL OR coalesce(cardinality(p_yayin_idler),0)=0
 OR coalesce(cardinality(p_musteri_idler),0)=0 OR array_position(p_yayin_idler,NULL) IS NOT NULL
 OR array_position(p_musteri_idler,NULL) IS NOT NULL
 OR cardinality(p_yayin_idler)::bigint*cardinality(p_musteri_idler)>10000 THEN
  RAISE EXCEPTION 'Tek istekte 1–10.000 yayın-müşteri gönderimi seçilmelidir.' USING ERRCODE='22023';
 END IF;
 SELECT array_agg(DISTINCT id ORDER BY id) INTO v_musteriler FROM unnest(p_musteri_idler) AS x(id);
 FOR v_yayin IN SELECT DISTINCT id FROM unnest(p_yayin_idler) AS x(id) ORDER BY id LOOP
  v_hedefler:=ARRAY[]::uuid[];
  v_bas:=1;
  WHILE v_bas<=cardinality(v_musteriler) LOOP
   SELECT * INTO v_sonuc FROM public.eczanem_musterilere_video_gonder(
    p_eczane_id,p_gonderen_kisi_id,v_yayin,v_musteriler[v_bas:v_bas+99]);
   IF NOT FOUND THEN RAISE EXCEPTION 'Müşteri gönderim sonucu alınamadı.' USING ERRCODE='P0001'; END IF;
   IF v_sonuc.ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION '%',coalesce(v_sonuc.hata,'Müşteri gönderimi tamamlanamadı.') USING ERRCODE='P0001';
   END IF;
   v_gonderilen:=v_gonderilen+v_sonuc.gonderilen;
   v_atlanan:=v_atlanan+v_sonuc.atlanan;
   v_hedefler:=v_hedefler||coalesce(v_sonuc.gonderilen_musteri_idler,ARRAY[]::uuid[]);
   v_bas:=v_bas+100;
  END LOOP;
  v_sonuclar:=v_sonuclar||jsonb_build_array(jsonb_build_object('yayin_id',v_yayin,'musteri_idler',v_hedefler));
 END LOOP;
 RETURN jsonb_build_object('ok',true,'gonderilen',v_gonderilen,'atlanan',v_atlanan,'sonuclar',v_sonuclar);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_eczanem_toplu_gonder(uuid,uuid,uuid[],uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_eczanem_toplu_gonder(uuid,uuid,uuid[],uuid[]) TO service_role;
COMMIT;
SELECT
 EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.eczanem_gonderimler'::regclass
  AND tgname='trg_cogniti_token_eczanem_musteri' AND tgenabled='O' AND NOT tgisinternal) AS eczanem_token_baglantisi_kuruldu,
 to_regprocedure('public.cogniti_token_eczanem_toplu_gonder(uuid,uuid,uuid[],uuid[])') IS NOT NULL AS eczanem_toplu_gonderim_kuruldu;
