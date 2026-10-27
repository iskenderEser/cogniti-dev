-- Adım 6: her aylık hesaba Türkiye takvimindeki cari ayın paketi bir kez.
-- İlk paket veya başka bir anahtarla yüklenmiş aynı dönem ikinci kez yüklenmez.
-- Süresi dolan yüklemeler tarihçede kalır; bakiye ve tüketim süreyi süzer.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-aylik-v1',0));
DO $$ BEGIN
 IF to_regprocedure('public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text)') IS NULL
 OR to_regprocedure('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)') IS NULL THEN
  RAISE EXCEPTION 'Token yükleme/tüketim önkoşulları eksik.'; END IF;
 IF EXISTS(SELECT 1 FROM public.cogniti_token_yuklemeleri WHERE yukleme_turu='aylik_paket'
  GROUP BY firma_id,donem_yil,donem_ay HAVING count(*)>1) THEN
  RAISE EXCEPTION 'Aynı firmada aynı ay için birden fazla aylık paket var; kayıtlar incelenmeden kurulum yapılmaz.'; END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS cogniti_token_aylik_donem_tek
 ON public.cogniti_token_yuklemeleri(firma_id,donem_yil,donem_ay) WHERE yukleme_turu='aylik_paket';

CREATE OR REPLACE FUNCTION public.cogniti_token_aylik_donemi_yukle(p_firma uuid)
RETURNS TABLE(yukleme_id uuid,yuklendi boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; v_id uuid;
 v_ay date:=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date;
 v_yil integer; v_ay_no integer;
BEGIN
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Token hesabı bulunamadı.' USING ERRCODE='22023'; END IF;
 IF h.paket_turu<>'aylik' OR NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=p_firma AND aktif=true) THEN
  RETURN QUERY SELECT NULL::uuid,false;RETURN; END IF;
 v_yil:=extract(year from v_ay)::integer;v_ay_no:=extract(month from v_ay)::integer;
 SELECT y.yukleme_id INTO v_id FROM public.cogniti_token_yuklemeleri y
 WHERE y.firma_id=p_firma AND y.yukleme_turu='aylik_paket' AND y.donem_yil=v_yil AND y.donem_ay=v_ay_no;
 IF FOUND THEN RETURN QUERY SELECT v_id,false;RETURN; END IF;
 IF h.aylik_paket_miktari IS NULL OR h.aylik_paket_miktari NOT IN(10000,30000,75000) THEN
  RAISE EXCEPTION 'Aylık paket miktarı tanımlı değil veya geçersiz.' USING ERRCODE='22023'; END IF;
 v_id:=public.cogniti_token_yukle(p_firma,'aylik_paket',h.aylik_paket_miktari,
  'aylik-paket:'||to_char(v_ay,'YYYY-MM'),v_yil,v_ay_no,NULL,'Otomatik aylık paket');
 RETURN QUERY SELECT v_id,true;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_aylik_donemi_yukle(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_aylik_donemi_yukle(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_aylik_yuklemeleri_isle()
RETURNS TABLE(firma_id uuid,yukleme_id uuid,sonuc text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid; r record;
BEGIN
 FOR v_firma IN SELECT h.firma_id FROM public.cogniti_token_hesaplari h
  JOIN public.firmalar f ON f.firma_id=h.firma_id AND f.aktif=true
  WHERE h.paket_turu='aylik' ORDER BY h.firma_id
 LOOP
  BEGIN
   SELECT * INTO r FROM public.cogniti_token_aylik_donemi_yukle(v_firma);
   RETURN QUERY SELECT v_firma,r.yukleme_id,CASE WHEN r.yukleme_id IS NULL THEN 'atlandi' WHEN r.yuklendi THEN 'yuklendi' ELSE 'zaten_yuklu' END;
  EXCEPTION WHEN SQLSTATE '22023' THEN
   RAISE WARNING 'Aylık token yüklenemedi; firma %, neden %',v_firma,SQLERRM;
   RETURN QUERY SELECT v_firma,NULL::uuid,'paket_bilgisi_hatasi'::text;
  END;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_aylik_yuklemeleri_isle() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_aylik_yuklemeleri_isle() TO service_role;

-- Kurulu tüketim işlevini korur; yalnız yeni ay yüklemesi ve saat kontrolü eklenir.
-- İşlem tekrarı kontrollerinden sonra, harcanacak yükleme seçilmeden önce çalışır.
DO $bagla$
DECLARE kaynak text; nokta text:=' SELECT * INTO y FROM public.cogniti_token_yuklemeleri';
 ek text:=E' -- cogniti-token-aylik-yenile-v1\n IF h.paket_turu=''aylik'' THEN\n  PERFORM 1 FROM public.cogniti_token_aylik_donemi_yukle(p_firma);\n END IF;\n';
BEGIN
 kaynak:=pg_get_functiondef('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)'::regprocedure);
 IF strpos(kaynak,'-- cogniti-token-aylik-yenile-v1')=0 THEN
  IF (length(kaynak)-length(replace(kaynak,nokta,'')))/length(nokta)<>1 THEN
   RAISE EXCEPTION 'Kurulu tüketim işlevinde beklenen bağlantı noktası bulunamadı; değişiklik uygulanmadı.'; END IF;
  kaynak:=replace(kaynak,nokta,ek||nokta);
  kaynak:=replace(kaynak,'son_kullanim_at>now()','son_kullanim_at>statement_timestamp()');
  EXECUTE kaynak;
 END IF;
END $bagla$;
COMMIT;
SELECT to_regprocedure('public.cogniti_token_aylik_yuklemeleri_isle()') IS NOT NULL AS aylik_isleyici_kuruldu,
 strpos(pg_get_functiondef('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)'::regprocedure),
 '-- cogniti-token-aylik-yenile-v1')>0 AS gonderim_oncesi_aylik_yukleme_kuruldu;
