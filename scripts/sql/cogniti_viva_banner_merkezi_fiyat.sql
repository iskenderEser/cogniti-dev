-- KULLANICI ÇALIŞTIRACAK. Önce güncel cogniti_merkezi_fiyat_tarifesi.sql kurulmalıdır.
-- Viva/banner mevcut tüketim kurulumları üzerine uygulanır; cron veya içerik verisi oluşturmaz.
BEGIN;
DO $pre$ BEGIN
 IF to_regclass('public.cogniti_fiyat_tarifesi') IS NULL
 OR to_regprocedure('public.cogniti_token_viva_islem(text,jsonb)') IS NULL
 OR to_regclass('public.firma_banner_rezervasyonlari') IS NULL THEN
  RAISE EXCEPTION 'Merkezi fiyat, Viva veya banner önkoşulları eksik.';
 END IF;
END $pre$;
CREATE OR REPLACE FUNCTION public.cogniti_tarife_bedeli_hesapla(p_tur text,p_miktar numeric,p_degerler jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $f$
DECLARE tl numeric; token numeric; kko numeric; usd numeric; kur numeric; katsayi numeric; haftalik numeric;
BEGIN
 IF p_miktar IS NULL OR p_miktar::text IN ('NaN','Infinity','-Infinity') OR p_miktar<0 OR p_miktar>1000000000000 THEN
  RAISE EXCEPTION 'Geçersiz hizmet miktarı.' USING ERRCODE='22023';
 END IF;
 IF p_tur='viva' THEN
  kko:=(p_degerler->>'kko_token_tl')::numeric; usd:=(p_degerler->>'viva_kisi_dakika_usd')::numeric;
  kur:=(p_degerler->>'viva_usd_tl')::numeric; katsayi:=(p_degerler->>'viva_satis_katsayisi')::numeric;
  IF kko IS NULL OR usd IS NULL OR kur IS NULL OR katsayi IS NULL OR kko<=0 OR usd<=0 OR kur<=0 OR katsayi<=0
   OR kko::text IN('NaN','Infinity','-Infinity') OR usd::text IN('NaN','Infinity','-Infinity')
   OR kur::text IN('NaN','Infinity','-Infinity') OR katsayi::text IN('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION 'Viva fiyatları eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  tl:=p_miktar/60*usd*kur*katsayi; token:=round(tl/kko);
 ELSIF p_tur='banner' AND p_miktar IN(1,2) THEN
  haftalik:=(p_degerler->>'banner_haftalik_token')::numeric;
  IF haftalik IS NULL OR haftalik<=0 OR haftalik>1000000000 OR haftalik<>trunc(haftalik) THEN
   RAISE EXCEPTION 'Banner fiyatı eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  kko:=(p_degerler->>'kko_token_tl')::numeric;
  IF kko IS NULL OR kko<=0 OR kko::text IN ('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION 'KKÖ birim fiyatı eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  token:=p_miktar*haftalik;
  tl:=round(token*kko,2);
 ELSE RAISE EXCEPTION 'Geçersiz hizmet türü veya hafta.' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('token',token,'hesap_bedeli_tl',tl);
END;
$f$;
CREATE OR REPLACE FUNCTION public.cogniti_hizmet_bedeli_hesapla(p_tur text,p_miktar numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE t public.cogniti_fiyat_tarifesi%ROWTYPE;
BEGIN
 SELECT * INTO STRICT t FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 RETURN public.cogniti_tarife_bedeli_hesapla(p_tur,p_miktar,t.degerler)
  || jsonb_build_object('surum',t.surum,'tur',p_tur,'miktar',p_miktar,'degerler',t.degerler);
END;
$f$;
ALTER TABLE public.cogniti_viva_tuketim_isleri ADD COLUMN IF NOT EXISTS tarife_surumu integer;
ALTER TABLE public.firma_banner_rezervasyonlari
 ADD COLUMN IF NOT EXISTS haftalik_token bigint,
 ADD COLUMN IF NOT EXISTS toplam_token bigint,
 ADD COLUMN IF NOT EXISTS tarife_surumu integer;
-- Önceki kurulumdaki rezervasyonların onaylanmış bedeli; yeni fiyat olarak kullanılmaz.
UPDATE public.firma_banner_rezervasyonlari SET haftalik_token=200,toplam_token=hafta_sayisi*200
 WHERE haftalik_token IS NULL AND toplam_token IS NULL;
ALTER TABLE public.firma_banner_rezervasyonlari ALTER COLUMN haftalik_token SET NOT NULL, ALTER COLUMN toplam_token SET NOT NULL;
DO $constraint$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.firma_banner_rezervasyonlari'::regclass AND conname='firma_banner_kayitli_fiyat_check') THEN
  ALTER TABLE public.firma_banner_rezervasyonlari ADD CONSTRAINT firma_banner_kayitli_fiyat_check CHECK(haftalik_token>0 AND toplam_token=hafta_sayisi*haftalik_token);
 END IF;
END $constraint$;
CREATE OR REPLACE FUNCTION public.cogniti_token_viva_islem(p_islem text,p_veri jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE j public.cogniti_viva_tuketim_isleri%ROWTYPE; e public.viva_etkinlikler%ROWTYPE;
 h public.cogniti_token_hesaplari%ROWTYPE; o public.viva_daily_odalar%ROWTYPE; y record;
 fiyat public.cogniti_fiyat_tarifesi%ROWTYPE;
 k uuid; saniye numeric; adet bigint; v_kalan bigint; pay bigint; asim bigint; tid uuid; ay date; eski boolean;
 beklenen text[]; gelen text[]; webhook_saniye numeric; api_saniye numeric; v_session jsonb;
BEGIN
 IF p_islem='ayir' THEN
  SELECT i.* INTO j FROM public.cogniti_viva_tuketim_isleri i JOIN public.viva_etkinlikler v USING(etkinlik_id)
   WHERE i.durum<>'tamam' AND i.tekrar<=statement_timestamp() AND (i.kira_bitis IS NULL OR i.kira_bitis<=statement_timestamp())
    AND v.durum<>'taslak' AND (v.durum IN ('sona_erdi','iptal') OR v.bitis<=statement_timestamp())
    AND coalesce(i.kapanis,v.bitis)<=statement_timestamp()-interval '45 seconds'
    AND NOT EXISTS(SELECT 1 FROM public.viva_daily_yasam yasam_is JOIN public.viva_daily_odalar oda_is USING(etkinlik_id) WHERE yasam_is.etkinlik_id=i.etkinlik_id AND yasam_is.durum<>'tamam' AND oda_is.oda_adi IS NOT NULL)
   ORDER BY i.tekrar,i.etkinlik_id LIMIT 1 FOR UPDATE OF i SKIP LOCKED;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO e FROM public.viva_etkinlikler WHERE etkinlik_id=j.etkinlik_id;
  SELECT * INTO o FROM public.viva_daily_odalar WHERE etkinlik_id=j.etkinlik_id;
  IF o.oda_adi IS NULL THEN
   -- Hiç odası açılmayan, dolayısıyla medya tüketmeyen etkinlik.
   UPDATE public.cogniti_viva_tuketim_isleri SET durum='tamam',token=0,toplam_saniye=0,tamamlandi=now(),donem=date_trunc('month',coalesce(j.kapanis,e.bitis) AT TIME ZONE 'Europe/Istanbul')::date WHERE etkinlik_id=j.etkinlik_id;
   RETURN jsonb_build_object('tamam',true,'token',0);
  END IF;
  IF j.kko_fiyat IS NULL OR j.usd_dakika IS NULL OR j.kur IS NULL OR j.katsayi IS NULL THEN
   SELECT * INTO STRICT fiyat FROM public.cogniti_fiyat_tarifesi WHERE tekil;
  END IF;
  k:=gen_random_uuid();
  UPDATE public.cogniti_viva_tuketim_isleri SET kira=k,kira_bitis=statement_timestamp()+interval '90 seconds',
   kapanis=coalesce(kapanis,e.bitis),kko_fiyat=coalesce(kko_fiyat,(fiyat.degerler->>'kko_token_tl')::numeric),usd_dakika=coalesce(usd_dakika,(fiyat.degerler->>'viva_kisi_dakika_usd')::numeric),kur=coalesce(kur,(fiyat.degerler->>'viva_usd_tl')::numeric),katsayi=coalesce(katsayi,(fiyat.degerler->>'viva_satis_katsayisi')::numeric),
   tarife_surumu=coalesce(tarife_surumu,fiyat.surum)
   WHERE etkinlik_id=j.etkinlik_id;
  RETURN jsonb_build_object('etkinlik_id',j.etkinlik_id,'kira',k,'domain',o.domain,'oda_adi',o.oda_adi);
 END IF;
 SELECT * INTO j FROM public.cogniti_viva_tuketim_isleri WHERE etkinlik_id=(p_veri->>'etkinlik_id')::uuid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Viva tüketim işi bulunamadı.' USING ERRCODE='22023'; END IF;
 IF j.durum='tamam' THEN RETURN jsonb_build_object('tamam',true,'token',j.token); END IF;
 IF j.kira IS NULL OR j.kira IS DISTINCT FROM (p_veri->>'kira')::uuid OR j.kira_bitis<=statement_timestamp() THEN RAISE EXCEPTION 'Viva tüketim işi değişti.' USING ERRCODE='40001'; END IF;
 IF p_islem='hata' THEN
  UPDATE public.cogniti_viva_tuketim_isleri SET durum='hata',tekrar=now()+interval '1 minute',kira=NULL,kira_bitis=NULL WHERE etkinlik_id=j.etkinlik_id;
  RETURN jsonb_build_object('tamam',false);
 END IF;
 IF p_islem<>'kaydet' THEN RAISE EXCEPTION 'Viva tüketim işlemi geçersiz.' USING ERRCODE='22023'; END IF;
 saniye:=(p_veri->>'toplam_saniye')::numeric;
 IF saniye IS NULL OR saniye<0 OR saniye::text IN ('NaN','Infinity','-Infinity') OR coalesce(p_veri->>'ozet','')!~'^[a-f0-9]{64}$'
  OR jsonb_typeof(p_veri->'oturum_idleri') IS DISTINCT FROM 'array' OR jsonb_typeof(p_veri->'katilimlar') IS DISTINCT FROM 'array'
 THEN RAISE EXCEPTION 'Geçersiz Daily tüketim sonucu.' USING ERRCODE='22023'; END IF;
 SELECT * INTO e FROM public.viva_etkinlikler WHERE etkinlik_id=j.etkinlik_id;
 SELECT * INTO o FROM public.viva_daily_odalar WHERE etkinlik_id=j.etkinlik_id;
 -- İmzalı kalıcı olaylar, kayıt/presence iş kuyruğunun bitmesini beklemeden okunabilir.
 SELECT coalesce(array_agg(DISTINCT veri->>'meeting_id') FILTER(WHERE veri->>'meeting_id' IS NOT NULL),'{}') INTO beklenen
  FROM public.viva_daily_olaylar WHERE domain=o.domain AND coalesce(veri->>'room',veri->>'room_name')=o.oda_adi AND tur IN ('meeting.started','meeting.ended');
 SELECT coalesce(array_agg(value),'{}') INTO gelen FROM jsonb_array_elements_text(p_veri->'oturum_idleri');
 IF NOT beklenen<@gelen THEN RAISE EXCEPTION 'Daily oturum verileri henüz eksik.' USING ERRCODE='40001'; END IF;
 -- API'nin kısa katılımı henüz göstermemesi halinde imzalı Daily ayrılış süresi kullanılır.
 FOR v_session IN SELECT DISTINCT a.veri->'session_id' FROM public.viva_daily_olaylar a WHERE a.domain=o.domain AND coalesce(a.veri->>'room',a.veri->>'room_name')=o.oda_adi AND a.tur IN('participant.joined','participant.left') AND a.veri->>'session_id' IS NOT NULL LOOP
  SELECT sum((v->>'saniye')::numeric) INTO api_saniye FROM jsonb_array_elements(p_veri->'katilimlar') v WHERE v->>'id'=v_session#>>'{}';
  SELECT max((a.veri->>'duration')::numeric) INTO webhook_saniye FROM public.viva_daily_olaylar a WHERE a.domain=o.domain AND coalesce(a.veri->>'room',a.veri->>'room_name')=o.oda_adi AND a.tur='participant.left' AND a.veri->>'session_id'=v_session#>>'{}';
  IF webhook_saniye IS NULL THEN RAISE EXCEPTION 'Daily katılımcı ayrılış verisi bekleniyor.' USING ERRCODE='40001'; END IF;
  IF webhook_saniye<0 OR webhook_saniye::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Geçersiz Daily katılım süresi.' USING ERRCODE='22023'; END IF;
  saniye:=saniye+greatest(webhook_saniye-coalesce(api_saniye,0),0);
 END LOOP;
 -- Ayrı iki okumada aynı süre ve katılım kümesi görülmeden kesinleştirilmez.
 IF j.ozet IS DISTINCT FROM p_veri->>'ozet' OR j.toplam_saniye IS DISTINCT FROM saniye OR j.olcum_at IS NULL THEN
  UPDATE public.cogniti_viva_tuketim_isleri SET ozet=p_veri->>'ozet',toplam_saniye=saniye,olcum_at=now(),tekrar=now()+interval '30 seconds',kira=NULL,kira_bitis=NULL WHERE etkinlik_id=j.etkinlik_id;
  RETURN jsonb_build_object('tamam',false);
 END IF;
 IF j.olcum_at>statement_timestamp()-interval '30 seconds' THEN RAISE EXCEPTION 'Daily mutabakatı bekleniyor.' USING ERRCODE='40001'; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=j.firma_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Token hesabı bulunamadı.' USING ERRCODE='22023'; END IF;
 IF h.paket_turu='aylik' THEN PERFORM 1 FROM public.cogniti_token_aylik_donemi_yukle(j.firma_id);
 ELSE PERFORM public.cogniti_token_kko_aylik_yukle(j.firma_id); SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=j.firma_id; END IF;
 adet:=(public.cogniti_tarife_bedeli_hesapla('viva',saniye,jsonb_build_object('kko_token_tl',j.kko_fiyat,'viva_kisi_dakika_usd',j.usd_dakika,'viva_usd_tl',j.kur,'viva_satis_katsayisi',j.katsayi))->>'token')::bigint; v_kalan:=adet;
 ay:=date_trunc('month',j.kapanis AT TIME ZONE 'Europe/Istanbul')::date;
 eski:=h.paket_turu='kullandigin_kadar_ode' AND h.kko_donem>ay;
 IF adet>0 THEN
  INSERT INTO public.cogniti_token_tuketimleri(firma_id,gonderen_turu,gonderen_id,alici_turu,alici_kimligi,islem_turu,kaynak_id,islem_anahtari,miktar)
   VALUES(j.firma_id,'firma_kullanicisi',j.sahip_id,'firma_kullanicisi',j.sahip_id::text,'viva_sure',j.etkinlik_id,'viva-sure:'||j.etkinlik_id,adet) RETURNING tuketim_id INTO tid;
  IF eski THEN
   FOR y IN SELECT s.yukleme_id,s.sifirlanan-s.sonradan_tuketilen AS kullanilabilir FROM public.cogniti_token_kko_devir_kayitlari s WHERE s.firma_id=j.firma_id AND s.donem=ay AND s.sifirlanan>s.sonradan_tuketilen ORDER BY s.yukleme_id FOR UPDATE LOOP
    EXIT WHEN v_kalan=0; pay:=least(v_kalan,y.kullanilabilir);
    UPDATE public.cogniti_token_kko_devir_kayitlari SET sonradan_tuketilen=sonradan_tuketilen+pay WHERE firma_id=j.firma_id AND donem=ay AND yukleme_id=y.yukleme_id;
    INSERT INTO public.cogniti_token_tuketim_dagilimlari VALUES(j.firma_id,tid,y.yukleme_id,pay); v_kalan:=v_kalan-pay;
   END LOOP;
  ELSE
   FOR y IN SELECT yukleme_id,kalan AS kullanilabilir FROM public.cogniti_token_yuklemeleri WHERE firma_id=j.firma_id AND kalan>0 AND (son_kullanim_at IS NULL OR son_kullanim_at>statement_timestamp()) ORDER BY son_kullanim_at ASC NULLS LAST,created_at,yukleme_id FOR UPDATE LOOP
    EXIT WHEN v_kalan=0; pay:=least(v_kalan,y.kullanilabilir);
    UPDATE public.cogniti_token_yuklemeleri SET kalan=kalan-pay WHERE yukleme_id=y.yukleme_id;
    INSERT INTO public.cogniti_token_tuketim_dagilimlari VALUES(j.firma_id,tid,y.yukleme_id,pay); v_kalan:=v_kalan-pay;
   END LOOP;
  END IF;
  UPDATE public.cogniti_token_tuketimleri SET asim_miktari=v_kalan WHERE tuketim_id=tid;
  IF h.paket_turu='aylik' THEN UPDATE public.cogniti_token_hesaplari SET asim_borcu=asim_borcu+v_kalan,updated_at=now() WHERE firma_id=j.firma_id; END IF;
 END IF;
 UPDATE public.cogniti_viva_tuketim_isleri SET durum='tamam',token=adet,kko_asim=CASE WHEN h.paket_turu='kullandigin_kadar_ode' THEN v_kalan ELSE 0 END,donem=ay,
  tuketim_id=tid,oturum_sayisi=(p_veri->>'oturum_sayisi')::integer,katilim_sayisi=(p_veri->>'katilim_sayisi')::integer,tamamlandi=now(),kira=NULL,kira_bitis=NULL WHERE etkinlik_id=j.etkinlik_id;
 RETURN jsonb_build_object('tamam',true,'token',adet,'asim',v_kalan);
END $$;
CREATE OR REPLACE FUNCTION public.firma_banner_rezerve(p_aktor uuid,p_firma uuid,p_id uuid,p_alan text,p_sira integer,p_bas date,p_yollar text[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.firma_banner_rezervasyonlari%ROWTYPE; n integer:=cardinality(p_yollar); i integer; fiyat jsonb;
BEGIN
 IF NOT public.firma_yonetim_yazma_yetkili_mi(p_aktor,p_firma) THEN RAISE EXCEPTION 'Firma yönetimi işlem yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_alan IS NULL OR p_alan NOT IN('firma','uye-ana-sayfa','uyeler','uye-yayinlari','indirim-onayi') OR p_sira IS NULL OR p_sira NOT BETWEEN 1 AND 3
 OR n IS NULL OR n NOT IN(1,2) OR p_bas IS NULL OR extract(isodow FROM p_bas)<>1 OR public.firma_banner_an(p_bas)<=public.firma_banner_simdi()
 OR EXISTS(SELECT 1 FROM unnest(p_yollar) y WHERE y IS NULL OR y NOT LIKE 'firma-banner-rezervasyon/'||p_firma||'/%') THEN
  RAISE EXCEPTION 'Geçerli pazartesi, alan ve her hafta için görsel seçin.' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.cogniti_token_hesaplari WHERE firma_id=p_firma;
 IF NOT FOUND THEN RAISE EXCEPTION 'Önce firmanın token hesabı tanımlanmalıdır.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('firma-banner:'||p_firma||':'||p_alan||':'||p_sira,0));
 SELECT * INTO r FROM public.firma_banner_rezervasyonlari WHERE rezervasyon_id=p_id;
 IF FOUND THEN RAISE EXCEPTION 'Rezervasyon zaten kaydedilmiş; listeyi yenileyin.' USING ERRCODE='40001'; END IF;
 IF NOT public.firma_banner_uygun_mu(p_firma,p_alan,p_sira,p_bas,n) THEN RAISE EXCEPTION 'Alan dolu veya iki ardışık hafta sınırı aşılıyor. Takvimi yenileyin.' USING ERRCODE='40001'; END IF;
 fiyat:=public.cogniti_hizmet_bedeli_hesapla('banner',n);
 INSERT INTO public.firma_banner_rezervasyonlari(rezervasyon_id,firma_id,alan,sira,baslangic,hafta_sayisi,olusturan_id,haftalik_token,toplam_token,tarife_surumu) VALUES(p_id,p_firma,p_alan,p_sira,p_bas,n,p_aktor,(fiyat->'degerler'->>'banner_haftalik_token')::bigint,(fiyat->>'token')::bigint,(fiyat->>'surum')::integer);
 FOR i IN 1..n LOOP INSERT INTO public.firma_banner_haftalari VALUES(p_id,i-1,p_yollar[i]); END LOOP;
 RETURN p_id;
END $$;
CREATE OR REPLACE FUNCTION public.firma_banner_rezerve_fiyatli(p_aktor uuid,p_firma uuid,p_id uuid,p_alan text,p_sira integer,p_bas date,p_yollar text[],p_beklenen_tarife integer,p_beklenen_bedel bigint)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE fiyat jsonb;
BEGIN
 IF NOT public.firma_yonetim_yazma_yetkili_mi(p_aktor,p_firma) THEN RAISE EXCEPTION 'Firma yönetimi işlem yetkiniz yok.' USING ERRCODE='42501'; END IF;
 -- Admin fiyat değişikliği bu işlem bitene kadar bekler; gösterilen ve kaydedilen fiyat aynıdır.
 PERFORM 1 FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR SHARE;
 fiyat:=public.cogniti_hizmet_bedeli_hesapla('banner',cardinality(p_yollar));
 IF p_beklenen_tarife IS DISTINCT FROM (fiyat->>'surum')::integer OR p_beklenen_bedel IS DISTINCT FROM (fiyat->>'token')::bigint THEN
  RAISE EXCEPTION 'Banner fiyatı değişmiş. Takvimi yenileyip yeni bedeli onaylayın.' USING ERRCODE='40001';
 END IF;
 RETURN public.firma_banner_rezerve(p_aktor,p_firma,p_id,p_alan,p_sira,p_bas,p_yollar);
END;
$f$;
CREATE OR REPLACE FUNCTION public.firma_banner_ucret_isle(p_id uuid,p_iptal boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.firma_banner_rezervasyonlari%ROWTYPE; h public.cogniti_token_hesaplari%ROWTYPE;
 y record; tid uuid; v_kalan bigint; alinan bigint; borc bigint; bedel bigint; an timestamptz:=public.firma_banner_simdi();
BEGIN
 SELECT * INTO r FROM public.firma_banner_rezervasyonlari WHERE rezervasyon_id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Rezervasyon bulunamadı.'; END IF;
 IF r.ucret_islendi THEN RETURN; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=r.firma_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Firmanın token hesabı yok.'; END IF;
 IF h.paket_turu='kullandigin_kadar_ode' THEN PERFORM public.cogniti_token_kko_aylik_yukle(r.firma_id);
 ELSE PERFORM public.cogniti_token_aylik_donemi_yukle(r.firma_id); END IF;
 bedel:=r.toplam_token; v_kalan:=bedel;
 INSERT INTO public.cogniti_token_tuketimleri(firma_id,gonderen_turu,gonderen_id,alici_turu,alici_kimligi,islem_turu,kaynak_id,islem_anahtari,miktar,asim_miktari)
 VALUES(r.firma_id,'firma_kullanicisi',r.olusturan_id,'firma_kullanicisi',r.firma_id::text,CASE WHEN p_iptal THEN 'banner_iptal' ELSE 'banner_yayin' END,r.rezervasyon_id,'banner:'||r.rezervasyon_id,bedel,0)
 RETURNING tuketim_id INTO tid;
 FOR y IN SELECT * FROM public.cogniti_token_yuklemeleri WHERE firma_id=r.firma_id AND kalan>0 AND(son_kullanim_at IS NULL OR son_kullanim_at>an)
  ORDER BY son_kullanim_at ASC NULLS LAST,created_at,yukleme_id FOR UPDATE LOOP
  EXIT WHEN v_kalan<=0;
  alinan:=least(v_kalan,y.kalan); v_kalan:=v_kalan-alinan;
  UPDATE public.cogniti_token_yuklemeleri SET kalan=cogniti_token_yuklemeleri.kalan-alinan WHERE yukleme_id=y.yukleme_id;
  INSERT INTO public.cogniti_token_tuketim_dagilimlari(firma_id,tuketim_id,yukleme_id,miktar) VALUES(r.firma_id,tid,y.yukleme_id,alinan);
 END LOOP;
 borc:=v_kalan;
 UPDATE public.cogniti_token_tuketimleri SET asim_miktari=borc WHERE tuketim_id=tid;
 UPDATE public.cogniti_token_hesaplari SET asim_borcu=asim_borcu+borc,updated_at=an WHERE firma_id=r.firma_id;
 UPDATE public.firma_banner_rezervasyonlari SET ucret_islendi=true,son_hata=NULL WHERE rezervasyon_id=p_id;
END $$;
CREATE OR REPLACE FUNCTION public.firma_banner_iptal(p_aktor uuid,p_firma uuid,p_id uuid,p_beklenen_kesinti integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.firma_banner_rezervasyonlari%ROWTYPE; ceza boolean; an timestamptz:=public.firma_banner_simdi();
BEGIN
 IF NOT public.firma_yonetim_yazma_yetkili_mi(p_aktor,p_firma) THEN RAISE EXCEPTION 'Firma yönetimi işlem yetkiniz yok.' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.firma_banner_rezervasyonlari WHERE rezervasyon_id=p_id AND firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Rezervasyon bulunamadı.' USING ERRCODE='P0002'; END IF;
 IF r.durum IN('iptal','kaldirildi') THEN RETURN jsonb_build_object('ok',true,'kesinti',CASE WHEN r.ucret_islendi THEN r.toplam_token ELSE 0 END); END IF;
 IF r.durum NOT IN('rezerve','yayinda') OR public.firma_banner_an(r.baslangic+r.hafta_sayisi*7)<=an THEN RAISE EXCEPTION 'Bu rezervasyon sona ermiş.' USING ERRCODE='22023'; END IF;
 ceza:=an>public.firma_banner_an(r.baslangic)-interval '24 hours';
 IF p_beklenen_kesinti IS DISTINCT FROM (CASE WHEN ceza OR r.ucret_islendi THEN r.toplam_token ELSE 0 END) THEN
  RAISE EXCEPTION 'İptal bedeli değişti. Takvimi yenileyip güncel bedeli onaylayın.' USING ERRCODE='40001'; END IF;
 IF ceza THEN PERFORM public.firma_banner_ucret_isle(p_id,true); END IF;
 UPDATE public.firma_banner_rezervasyonlari SET durum=CASE WHEN an>=public.firma_banner_an(r.baslangic) THEN 'kaldirildi' ELSE 'iptal' END WHERE rezervasyon_id=p_id;
 RETURN jsonb_build_object('ok',true,'kesinti',CASE WHEN ceza OR r.ucret_islendi THEN r.toplam_token ELSE 0 END);
END $$;
CREATE OR REPLACE FUNCTION public.firma_banner_takvim(p_firma uuid,p_alan text,p_sira integer,p_bas date,p_hafta integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d date; onerilen date; kayitlar jsonb; eski jsonb; i integer; azami integer; engel boolean; fiyat jsonb; fiyat1 jsonb; fiyat2 jsonb;
BEGIN
 IF p_firma IS NULL OR p_alan IS NULL OR p_alan NOT IN('firma','uye-ana-sayfa','uyeler','uye-yayinlari','indirim-onayi') OR p_sira IS NULL OR p_sira NOT BETWEEN 1 AND 3 OR p_hafta IS NULL OR p_hafta NOT IN(1,2) OR p_bas IS NULL OR extract(isodow FROM p_bas)<>1 THEN RAISE EXCEPTION 'Geçersiz takvim isteği.' USING ERRCODE='22023'; END IF;
 IF p_alan='firma' THEN SELECT coalesce(jsonb_agg(to_jsonb(b)),'[]') INTO eski FROM public.eclub_firma_bannerlari b WHERE firma_id=p_firma;
 ELSE SELECT coalesce(jsonb_agg(to_jsonb(b)),'[]') INTO eski FROM public.eczanem_sayfa_bannerlari b WHERE firma_id=p_firma AND alan=p_alan; END IF;
 engel:=EXISTS(SELECT 1 FROM jsonb_array_elements(eski) b WHERE (b->>'sira')::integer=p_sira);
 d:=greatest(p_bas,(date_trunc('week',public.firma_banner_simdi() AT TIME ZONE 'Europe/Istanbul')::date+7));
 -- Her rezervasyon en fazla iki hafta kaplar; boş haftaya kadar sabit ufuk sınırı yoktur.
 SELECT count(*)::integer*3+4 INTO azami FROM public.firma_banner_rezervasyonlari WHERE firma_id=p_firma AND alan=p_alan AND sira=p_sira;
 IF NOT engel THEN
  FOR i IN 1..azami LOOP
   IF public.firma_banner_uygun_mu(p_firma,p_alan,p_sira,d,p_hafta) THEN onerilen:=d; EXIT; END IF;
   d:=d+7;
  END LOOP;
 END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.baslangic,x.sira),'[]') INTO kayitlar FROM (
  SELECT r.*,public.firma_banner_an(r.baslangic) baslangic_at,public.firma_banner_an(r.baslangic+r.hafta_sayisi*7) bitis_at,
   (SELECT jsonb_agg(jsonb_build_object('hafta_no',h.hafta_no,'dosya_yolu',h.dosya_yolu,'baslangic_at',public.firma_banner_an(r.baslangic+h.hafta_no*7)) ORDER BY h.hafta_no) FROM public.firma_banner_haftalari h WHERE h.rezervasyon_id=r.rezervasyon_id) gorseller
  FROM public.firma_banner_rezervasyonlari r WHERE r.firma_id=p_firma AND r.alan=p_alan
   AND (r.durum IN('rezerve','yayinda') OR r.baslangic>=p_bas AND r.baslangic<p_bas+56)
 )x;
 fiyat:=public.cogniti_hizmet_bedeli_hesapla('banner',p_hafta);
 fiyat1:=public.cogniti_hizmet_bedeli_hesapla('banner',1); fiyat2:=public.cogniti_hizmet_bedeli_hesapla('banner',2);
 RETURN jsonb_build_object('tarife_surumu',fiyat->'surum','haftalik_token',fiyat->'degerler'->'banner_haftalik_token','toplam_token',fiyat->'token','hafta_1_token',fiyat1->'token','hafta_2_token',fiyat2->'token','simdi',public.firma_banner_simdi(),'onerilen',onerilen,'manuel_engel',engel,'uygun',public.firma_banner_an(p_bas)>public.firma_banner_simdi() AND public.firma_banner_uygun_mu(p_firma,p_alan,p_sira,p_bas,p_hafta),'rezervasyonlar',kayitlar,'mevcut_bannerlar',eski);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_tarife_bedeli_hesapla(text,numeric,jsonb),
 public.cogniti_hizmet_bedeli_hesapla(text,numeric),public.cogniti_token_viva_islem(text,jsonb),
 public.firma_banner_rezerve(uuid,uuid,uuid,text,integer,date,text[]),
 public.firma_banner_rezerve_fiyatli(uuid,uuid,uuid,text,integer,date,text[],integer,bigint),
 public.firma_banner_ucret_isle(uuid,boolean),public.firma_banner_iptal(uuid,uuid,uuid,integer),
 public.firma_banner_takvim(uuid,text,integer,date,integer)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_hizmet_bedeli_hesapla(text,numeric),
 public.cogniti_token_viva_islem(text,jsonb),public.firma_banner_rezerve_fiyatli(uuid,uuid,uuid,text,integer,date,text[],integer,bigint),
 public.firma_banner_ucret_isle(uuid,boolean),public.firma_banner_iptal(uuid,uuid,uuid,integer),
 public.firma_banner_takvim(uuid,text,integer,date,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_viva_banner_merkezi_fiyat_baglandi;
