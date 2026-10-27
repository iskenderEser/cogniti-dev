-- C-Club gerçek challenge başına gönderenin firmasından 1 token.
-- Eski challenge ve puan kayıtlarına dokunmaz; mevcut cc_challenge_gonder değiştirilmez.
-- Toplu çağrı tek transaction'dır: token hatası tüm challenge/puan/tüketimleri geri alır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-cclub-v1',0));
DO $$
BEGIN
 IF to_regprocedure('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)') IS NULL
 OR to_regprocedure('public.cc_challenge_gonder(uuid,uuid,uuid,timestamp with time zone)') IS NULL
 OR to_regclass('public.challenge_kayitlari') IS NULL THEN
  RAISE EXCEPTION 'C-Club gönderim ve token tüketim önkoşulları eksik.';
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.cogniti_token_cclub_challenge_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id=NEW.gonderen_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:gonderici_firma_yok' USING ERRCODE='P0001';
 END IF;
 BEGIN
  PERFORM public.cogniti_token_tuket(v_firma,'firma_kullanicisi',NEW.gonderen_id,
   'firma_kullanicisi',NEW.alan_id::text,'cclub_challenge',NEW.yayin_id,'cclub-challenge:'||NEW.challenge_id::text);
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
REVOKE ALL ON FUNCTION public.cogniti_token_cclub_challenge_kaydet() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_token_cclub_challenge ON public.challenge_kayitlari;
CREATE TRIGGER trg_cogniti_token_cclub_challenge AFTER INSERT ON public.challenge_kayitlari
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_cclub_challenge_kaydet();

CREATE OR REPLACE FUNCTION public.cogniti_token_cclub_toplu_gonder(
 p_gonderen_id uuid,p_yayin_id uuid,p_alan_idler uuid[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_alan uuid; v_challenge record;
 v_gonderilen jsonb:='[]'::jsonb; v_atlanan jsonb:='[]'::jsonb;
BEGIN
 IF p_gonderen_id IS NULL OR p_yayin_id IS NULL OR coalesce(cardinality(p_alan_idler),0) NOT BETWEEN 1 AND 100
 OR array_position(p_alan_idler,NULL) IS NOT NULL THEN
  RAISE EXCEPTION 'Geçersiz toplu challenge bilgileri.' USING ERRCODE='22023';
 END IF;
 -- Her alıcının yetki, firma, tur ve kota kontrolü mevcut kanonik işlevde yapılır.
 FOR v_alan IN SELECT a.id FROM unnest(p_alan_idler) WITH ORDINALITY AS a(id,sira)
   GROUP BY a.id ORDER BY min(a.sira)
 LOOP
  BEGIN
   SELECT * INTO v_challenge FROM public.cc_challenge_gonder(p_gonderen_id,v_alan,p_yayin_id);
   IF NOT FOUND OR v_challenge.challenge_id IS NULL THEN
    RAISE EXCEPTION 'Challenge oluşturulamadı.' USING ERRCODE='P0001';
   END IF;
   v_gonderilen:=v_gonderilen||jsonb_build_array(jsonb_build_object(
     'alan_id',v_alan,'challenge_id',v_challenge.challenge_id));
  EXCEPTION WHEN SQLSTATE 'P0001' OR SQLSTATE '22023' OR SQLSTATE '23505' THEN
   -- Token sorunu sıradan alıcı reddi değildir: öncekiler dahil tüm istek geri alınır.
   IF SQLSTATE='P0001' AND SQLERRM LIKE 'COGNITI_TOKEN:%' THEN RAISE; END IF;
   v_atlanan:=v_atlanan||jsonb_build_array(jsonb_build_object('alan_id',v_alan,'sebep',SQLERRM));
  END;
 END LOOP;
 RETURN jsonb_build_object('gonderilen',v_gonderilen,'atlanan',v_atlanan);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_cclub_toplu_gonder(uuid,uuid,uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_cclub_toplu_gonder(uuid,uuid,uuid[]) TO service_role;
COMMIT;
SELECT
 EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.challenge_kayitlari'::regclass
  AND tgname='trg_cogniti_token_cclub_challenge' AND tgenabled='O' AND NOT tgisinternal) AS cclub_token_baglantisi_kuruldu,
 to_regprocedure('public.cogniti_token_cclub_toplu_gonder(uuid,uuid,uuid[])') IS NOT NULL AS cclub_toplu_gonderim_kuruldu;
