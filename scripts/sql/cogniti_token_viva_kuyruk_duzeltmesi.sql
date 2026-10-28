-- KULLANICI ÇALIŞTIRACAK. Yalnız tüketim kuyruğu seçimini düzeltir; bakiye/kayıt silmez.
-- Uygulamadaki lib/viva/tuketimSunucu.ts düzeltmesiyle birlikte kullanılır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-viva-tuketim-v2',0));
DO $patch$
DECLARE kaynak text; eski_filtre text:=$old$    AND coalesce(i.kapanis,v.bitis)<=statement_timestamp()-interval '45 seconds'$old$;
 yeni_filtre text:=$new$    AND coalesce(i.kapanis,v.bitis)<=statement_timestamp()-interval '45 seconds'
    AND NOT EXISTS(SELECT 1 FROM public.viva_daily_yasam yasam_is JOIN public.viva_daily_odalar oda_is USING(etkinlik_id) WHERE yasam_is.etkinlik_id=i.etkinlik_id AND yasam_is.durum<>'tamam' AND oda_is.oda_adi IS NOT NULL)$new$;
 eski_kapi text:=$gate$  IF EXISTS(SELECT 1 FROM public.viva_daily_yasam WHERE etkinlik_id=j.etkinlik_id AND durum<>'tamam') THEN RETURN NULL; END IF;
$gate$;
 sifir_eski text:=$zero$   RETURN NULL;
  END IF;
$zero$;
 sifir_yeni text:=$zero$   RETURN jsonb_build_object('tamam',true,'token',0);
  END IF;
$zero$;
BEGIN
 kaynak:=pg_get_functiondef('public.cogniti_token_viva_islem(text,jsonb)'::regprocedure);
 IF strpos(kaynak,yeni_filtre)=0 THEN
  IF (length(kaynak)-length(replace(kaynak,eski_filtre,'')))/length(eski_filtre)<>1
   OR (length(kaynak)-length(replace(kaynak,eski_kapi,'')))/length(eski_kapi)<>1
  THEN RAISE EXCEPTION 'Viva tüketim fonksiyonu beklenen sürümde değil.'; END IF;
  kaynak:=replace(replace(kaynak,eski_filtre,yeni_filtre),eski_kapi,'');
 END IF;
 IF strpos(kaynak,sifir_yeni)=0 THEN
  IF (length(kaynak)-length(replace(kaynak,sifir_eski,'')))/length(sifir_eski)<>1
  THEN RAISE EXCEPTION 'Viva sıfır tüketim dönüşü beklenen sürümde değil.'; END IF;
  kaynak:=replace(kaynak,sifir_eski,sifir_yeni);
 END IF;
 EXECUTE kaynak;
END $patch$;
COMMIT;
SELECT true AS viva_kuyruk_duzeltildi;
