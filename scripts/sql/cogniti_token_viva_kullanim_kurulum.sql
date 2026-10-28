-- Viva kullanım tüketimi. KULLANICI ÇALIŞTIRACAK; Daily'ye veya başka servise bağlanmaz.
-- Önkoşul: mevcut token, KKÖ aylık, Viva 2.4/2.5 ve gün sonu kurulumu.
-- Kurulumdan önce oluşturulan etkinliklerin davet ücretleri korunur; tekrar ücretlendirilmez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-viva-tuketim-v2',0));
DO $$ BEGIN
 IF to_regprocedure('public.cogniti_token_kko_aylik_yukle(uuid)') IS NULL
 OR to_regprocedure('public.cogniti_token_aylik_donemi_yukle(uuid)') IS NULL
 OR to_regprocedure('public.viva_daily_katilim_baglam(uuid,uuid,text,text)') IS NULL
 OR to_regclass('public.viva_daily_olaylar') IS NULL THEN RAISE EXCEPTION 'Viva/token önkoşulları eksik.'; END IF;
END $$;
ALTER TABLE public.cogniti_token_tuketimleri ADD COLUMN IF NOT EXISTS miktar bigint NOT NULL DEFAULT 1 CHECK(miktar>0);
ALTER TABLE public.cogniti_token_tuketimleri DROP CONSTRAINT IF EXISTS cogniti_token_tuketimleri_islem_turu_check;
ALTER TABLE public.cogniti_token_tuketimleri ADD CONSTRAINT cogniti_token_tuketimleri_islem_turu_check CHECK(islem_turu IN ('yayin','tclub_oneri','cclub_challenge','eclub_oneri','eczanem_musteri','viva_davet','viva_sure'));
ALTER TABLE public.cogniti_token_tuketimleri DROP CONSTRAINT IF EXISTS cogniti_token_tuketimleri_asim_miktari_check;
ALTER TABLE public.cogniti_token_tuketimleri ADD CONSTRAINT cogniti_token_tuketimleri_asim_miktari_check CHECK(asim_miktari BETWEEN 0 AND miktar);
ALTER TABLE public.cogniti_token_kko_devir_kayitlari ADD COLUMN IF NOT EXISTS sonradan_tuketilen bigint NOT NULL DEFAULT 0 CHECK(sonradan_tuketilen>=0 AND sonradan_tuketilen<=sifirlanan);

CREATE TABLE IF NOT EXISTS public.cogniti_viva_tuketim_isleri(
 etkinlik_id uuid PRIMARY KEY REFERENCES public.viva_etkinlikler(etkinlik_id),
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id), sahip_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), kapanis timestamptz,
 durum text NOT NULL DEFAULT 'bekliyor' CHECK(durum IN('bekliyor','hata','tamam')),
 tekrar timestamptz NOT NULL DEFAULT now(), kira uuid, kira_bitis timestamptz,
 kko_fiyat numeric CHECK(kko_fiyat>0), usd_dakika numeric CHECK(usd_dakika>0), kur numeric CHECK(kur>0), katsayi numeric CHECK(katsayi>0),
 ozet text, olcum_at timestamptz, toplam_saniye numeric CHECK(toplam_saniye>=0),
 oturum_sayisi integer, katilim_sayisi integer, token bigint CHECK(token>=0), kko_asim bigint NOT NULL DEFAULT 0 CHECK(kko_asim>=0),
 donem date, tuketim_id uuid REFERENCES public.cogniti_token_tuketimleri(tuketim_id), tamamlandi timestamptz
);
ALTER TABLE public.cogniti_viva_tuketim_isleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_viva_tuketim_isleri FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.cogniti_viva_tuketim_isleri TO service_role;
CREATE INDEX IF NOT EXISTS cogniti_viva_tuketim_bekleyen ON public.cogniti_viva_tuketim_isleri(tekrar) WHERE durum<>'tamam';

CREATE OR REPLACE FUNCTION public.cogniti_token_viva_is_olustur() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  INSERT INTO public.cogniti_viva_tuketim_isleri(etkinlik_id,firma_id,sahip_id)
  VALUES(NEW.etkinlik_id,NEW.firma_id,NEW.sahip_id) ON CONFLICT DO NOTHING;
 ELSIF NEW.durum IN ('sona_erdi','iptal') AND OLD.durum NOT IN ('sona_erdi','iptal') THEN
  UPDATE public.cogniti_viva_tuketim_isleri SET kapanis=least(NEW.bitis,statement_timestamp()), tekrar=statement_timestamp()+interval '45 seconds'
   WHERE etkinlik_id=NEW.etkinlik_id AND durum<>'tamam' AND kapanis IS NULL;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_viva_token_kullanim ON public.viva_etkinlikler;
CREATE TRIGGER trg_viva_token_kullanim AFTER INSERT OR UPDATE OF durum ON public.viva_etkinlikler FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_viva_is_olustur();
REVOKE ALL ON FUNCTION public.cogniti_token_viva_is_olustur() FROM PUBLIC,anon,authenticated,service_role;
-- Davet başına ücretlendirme tamamen durdurulur; geçmiş tüketim kayıtları silinmez.
DROP TRIGGER IF EXISTS trg_cogniti_token_viva_katilimci ON public.viva_katilimcilar;
DROP TRIGGER IF EXISTS trg_cogniti_token_viva_ozel ON public.viva_davetler;
DROP TRIGGER IF EXISTS trg_cogniti_token_viva_durum ON public.viva_etkinlikler;
CREATE OR REPLACE FUNCTION public.cogniti_token_viva_davet_kaydet(p_etkinlik uuid,p_tur text,p_kisi uuid,p_eposta text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT NULL::uuid $$;
REVOKE ALL ON FUNCTION public.cogniti_token_viva_davet_kaydet(uuid,text,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
-- Henüz başlamamış ve önceden davet ücreti ödenmemiş plan/taslaklar yeni modele alınır.
-- Daha önce ücret alınmış etkinliklere ikinci ücret yazılmaz.
INSERT INTO public.cogniti_viva_tuketim_isleri(etkinlik_id,firma_id,sahip_id)
 SELECT e.etkinlik_id,e.firma_id,e.sahip_id FROM public.viva_etkinlikler e
 WHERE (e.durum='taslak' OR (e.durum='planlandi' AND e.baslangic>statement_timestamp()))
  AND NOT EXISTS(SELECT 1 FROM public.cogniti_token_tuketimleri t WHERE t.kaynak_id=e.etkinlik_id AND t.islem_turu='viva_davet')
 ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.cogniti_token_viva_baslangic(p_etkinlik uuid,p_auth uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE j public.cogniti_viva_tuketim_isleri%ROWTYPE; h public.cogniti_token_hesaplari%ROWTYPE; b bigint;
BEGIN
 SELECT * INTO j FROM public.cogniti_viva_tuketim_isleri WHERE etkinlik_id=p_etkinlik;
 IF NOT FOUND OR p_auth IS DISTINCT FROM j.sahip_id OR EXISTS(SELECT 1 FROM public.viva_daily_yasam WHERE etkinlik_id=p_etkinlik AND oturum_id IS NOT NULL) THEN RETURN; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=j.firma_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001'; END IF;
 IF h.paket_turu='kullandigin_kadar_ode' THEN
  PERFORM public.cogniti_token_kko_aylik_yukle(j.firma_id);
  SELECT coalesce(sum(kalan),0) INTO b FROM public.cogniti_token_yuklemeleri WHERE firma_id=j.firma_id AND (son_kullanim_at IS NULL OR son_kullanim_at>statement_timestamp());
  IF b<=0 THEN RAISE EXCEPTION 'COGNITI_TOKEN:viva_baslangic_bakiye' USING ERRCODE='P0001'; END IF;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_viva_baslangic(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
DO $patch$
DECLARE kaynak text; nokta text:=' IF p_auth IS NOT NULL THEN';
BEGIN
 kaynak:=pg_get_functiondef('public.viva_daily_katilim_baglam(uuid,uuid,text,text)'::regprocedure);
 IF strpos(kaynak,'-- viva-baslangic-token-v2')=0 THEN
  IF (length(kaynak)-length(replace(kaynak,nokta,'')))/length(nokta)<>1 THEN RAISE EXCEPTION 'Viva katılım bağlantısı değişmiş.'; END IF;
  EXECUTE replace(kaynak,nokta,E' -- viva-baslangic-token-v2\n PERFORM public.cogniti_token_viva_baslangic(id,p_auth);\n'||nokta);
 END IF;
END $patch$;

CREATE OR REPLACE FUNCTION public.cogniti_token_viva_islem(p_islem text,p_veri jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE j public.cogniti_viva_tuketim_isleri%ROWTYPE; e public.viva_etkinlikler%ROWTYPE;
 h public.cogniti_token_hesaplari%ROWTYPE; o public.viva_daily_odalar%ROWTYPE; y record;
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
  IF (p_veri->>'kko_fiyat')::numeric<=0 OR (p_veri->>'usd_dakika')::numeric<>0.004 OR (p_veri->>'kur')::numeric<>55 OR (p_veri->>'katsayi')::numeric<>1.5
   OR p_veri->>'kko_fiyat' IS NULL OR p_veri->>'usd_dakika' IS NULL OR p_veri->>'kur' IS NULL OR p_veri->>'katsayi' IS NULL THEN RAISE EXCEPTION 'Viva fiyatları eksik.' USING ERRCODE='22023'; END IF;
  k:=gen_random_uuid();
  UPDATE public.cogniti_viva_tuketim_isleri SET kira=k,kira_bitis=statement_timestamp()+interval '90 seconds',
   kapanis=coalesce(kapanis,e.bitis),kko_fiyat=coalesce(kko_fiyat,(p_veri->>'kko_fiyat')::numeric),usd_dakika=coalesce(usd_dakika,0.004),kur=coalesce(kur,55),katsayi=coalesce(katsayi,1.5)
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
 adet:=round(saniye/60*j.usd_dakika*j.kur*j.katsayi/j.kko_fiyat); v_kalan:=adet;
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
REVOKE ALL ON FUNCTION public.cogniti_token_viva_islem(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_viva_islem(text,jsonb) TO service_role;
-- Süre ve yayın bitişi artık ücretlendirme için de saklanır.
DO $patch$
DECLARE kaynak text; nokta text:='''start_ts'',''joined_at''';
BEGIN
 kaynak:=pg_get_functiondef('public.viva_daily_kayit_islem(uuid,uuid,text,jsonb)'::regprocedure);
 IF strpos(kaynak,'''duration''')=0 THEN
  IF strpos(kaynak,nokta)=0 THEN RAISE EXCEPTION 'Daily olay saklama bağlantısı değişmiş.'; END IF;
  EXECUTE replace(kaynak,nokta,'''start_ts'',''end_ts'',''duration'',''joined_at''');
 END IF;
END $patch$;

-- Firma token bakiyesini hesaplar; veri değiştirmez.

CREATE OR REPLACE FUNCTION public.cogniti_token_bakiye(p_firma uuid)
RETURNS TABLE(paket_turu text, kullanilabilir_token bigint, paket_asimi bigint, net_bakiye bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT h.paket_turu,
   COALESCE(sum(y.kalan) FILTER (WHERE y.son_kullanim_at IS NULL OR y.son_kullanim_at>statement_timestamp()),0)::bigint,
   h.asim_borcu+CASE WHEN h.paket_turu='kullandigin_kadar_ode' THEN coalesce((SELECT sum(v.kko_asim) FROM public.cogniti_viva_tuketim_isleri v WHERE v.firma_id=h.firma_id AND v.durum='tamam' AND v.donem=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date),0)::bigint ELSE 0 END,
   (COALESCE(sum(y.kalan) FILTER (WHERE y.son_kullanim_at IS NULL OR y.son_kullanim_at>statement_timestamp()),0)-h.asim_borcu)::bigint
 FROM public.cogniti_token_hesaplari h
 LEFT JOIN public.cogniti_token_yuklemeleri y ON y.firma_id=h.firma_id
 WHERE h.firma_id=p_firma
 GROUP BY h.firma_id,h.paket_turu,h.asim_borcu;
$$;
REVOKE ALL ON FUNCTION public.cogniti_token_bakiye(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_bakiye(uuid) TO service_role;



-- UTT stat kartları: Türkiye saatine göre dünün sonundaki değerler.
-- Salt okunur hesaplama; gönderim/tüketim/cron işlevleri değişmez.

CREATE OR REPLACE FUNCTION public.cogniti_token_gun_sonu(
 p_kullanici uuid, p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; h record; v_sinir timestamptz; v_limit bigint; v_kalan bigint; v_kendi bigint;
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
 -- Kalan kolonları bugün de değişir. Bugünkü dağılım ve KKÖ sıfırlamalarını
 -- geri ekleyerek her yüklemenin dün sonundaki kalanını buluruz.
 -- Yüklemede mahsup edilen borç = miktar - kalan - dağılımlar - sıfırlamalar.
 WITH dagilim AS (
  SELECT d.yukleme_id,sum(d.miktar)::bigint AS tum,
   coalesce(sum(d.miktar) FILTER(WHERE t.created_at>=v_sinir),0)::bigint AS sonra
  FROM public.cogniti_token_tuketim_dagilimlari d
  JOIN public.cogniti_token_tuketimleri t ON t.tuketim_id=d.tuketim_id AND t.firma_id=d.firma_id
  WHERE d.firma_id=k.firma_id GROUP BY d.yukleme_id
 ), sifirlama AS (
  SELECT s.yukleme_id,sum(s.sifirlanan-s.sonradan_tuketilen)::bigint AS tum,
   coalesce(sum(s.sifirlanan-s.sonradan_tuketilen) FILTER(WHERE s.created_at>=v_sinir),0)::bigint AS sonra
  FROM public.cogniti_token_kko_devir_kayitlari s WHERE s.firma_id=k.firma_id GROUP BY s.yukleme_id
 ), yukleme AS (
  SELECT y.*,coalesce(d.tum,0) AS dagitilan,coalesce(s.tum,0) AS sifirlanan,
   y.kalan+coalesce(d.sonra,0)+coalesce(s.sonra,0) AS dun_kalan
  FROM public.cogniti_token_yuklemeleri y
  LEFT JOIN dagilim d ON d.yukleme_id=y.yukleme_id
  LEFT JOIN sifirlama s ON s.yukleme_id=y.yukleme_id WHERE y.firma_id=k.firma_id
 )
 SELECT coalesce(sum(y.dun_kalan) FILTER(WHERE y.created_at<v_sinir
    AND (y.son_kullanim_at IS NULL OR y.son_kullanim_at>=v_sinir)),0)
  - h.asim_borcu
  + (SELECT coalesce(sum(t.asim_miktari),0) FROM public.cogniti_token_tuketimleri t WHERE t.firma_id=k.firma_id AND t.created_at>=v_sinir AND (h.paket_turu='aylik' OR t.islem_turu<>'viva_sure'))
  - coalesce(sum(y.miktar-y.kalan-y.dagitilan-y.sifirlanan) FILTER(WHERE y.created_at>=v_sinir),0)
 INTO v_kalan FROM yukleme y;
 SELECT coalesce(sum(t.miktar),0) INTO v_kendi FROM public.cogniti_token_tuketimleri t
 WHERE t.firma_id=k.firma_id AND t.gonderen_turu='firma_kullanicisi'
  AND t.gonderen_id=k.kullanici_id AND t.created_at<v_sinir;
 RETURN jsonb_build_object('hazir',true,'veri_tarihi',(v_sinir AT TIME ZONE 'Europe/Istanbul')::date-1,
  'plan_limiti',v_limit,'kalan_token',v_kalan,'kullandigim_token',v_kendi);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_gun_sonu(uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_gun_sonu(uuid,timestamptz) TO service_role;

-- Kaldırılan hareket listesine ait filtreli RPC imzasını temizler; tüketim verileri korunur.
DROP FUNCTION IF EXISTS public.cogniti_token_raporu(uuid,text,integer,text,text);
CREATE OR REPLACE FUNCTION public.cogniti_token_raporu(p_kullanici uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; h record; b record; yuklemeler jsonb; v_yonetici boolean; v_kapsam text; v_toplam bigint;
BEGIN
 IF p_kullanici IS NULL THEN RAISE EXCEPTION 'Geçersiz rapor isteği.' USING ERRCODE='22023'; END IF;
 SELECT k1.kullanici_id,k1.firma_id,k1.rol,k1.takim_id,k1.bolge_id INTO k
 FROM public.kullanicilar k1 JOIN public.firmalar f ON f.firma_id=k1.firma_id AND f.aktif=true
 WHERE k1.kullanici_id=p_kullanici AND k1.aktif_mi=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Kullanıcı veya firma bulunamadı.' USING ERRCODE='42501'; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false); END IF;
 SELECT * INTO b FROM public.cogniti_token_bakiye(k.firma_id);
 v_yonetici:=lower(k.rol) IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm');
 v_kapsam:=CASE WHEN v_yonetici THEN 'firma' WHEN lower(k.rol)='tm' AND k.takim_id IS NOT NULL THEN 'takim' WHEN lower(k.rol)='bm' AND k.bolge_id IS NOT NULL AND k.takim_id IS NOT NULL THEN 'bolge' ELSE 'benim' END;
 SELECT coalesce(sum(t.miktar),0)::bigint INTO v_toplam
  FROM public.cogniti_token_tuketimleri t
  LEFT JOIN public.kullanicilar g ON t.gonderen_turu='firma_kullanicisi' AND g.kullanici_id=t.gonderen_id AND g.firma_id=t.firma_id
  WHERE t.firma_id=k.firma_id AND (
   (t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=k.kullanici_id) OR v_kapsam='firma'
   OR (t.gonderen_turu='firma_kullanicisi' AND g.firma_id=k.firma_id AND
     ((v_kapsam='takim' AND g.takim_id=k.takim_id) OR (v_kapsam='bolge' AND g.bolge_id=k.bolge_id AND g.takim_id=k.takim_id)))
   OR (t.gonderen_turu='eclub_kisi' AND v_kapsam IN ('takim','bolge') AND EXISTS (
     SELECT 1 FROM public.eczanem_gonderimler eg
     JOIN public.eclub_eczane_firma ef ON ef.eczane_id=eg.eczane_id AND ef.firma_id=t.firma_id AND ef.aktif_mi=true
     JOIN public.kullanicilar u ON u.kullanici_id=ef.baglayan_utt_id AND u.firma_id=t.firma_id
     WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND
      ((v_kapsam='takim' AND u.takim_id=k.takim_id) OR (v_kapsam='bolge' AND u.takim_id=k.takim_id AND u.bolge_id=k.bolge_id)))));
 IF v_yonetici THEN
  SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.created_at DESC),'[]'::jsonb) INTO yuklemeler FROM (
   SELECT y.miktar,y.kalan,y.yukleme_turu,y.donem_yil,y.donem_ay,y.son_kullanim_at,y.created_at,
    (y.son_kullanim_at IS NOT NULL AND y.son_kullanim_at<=statement_timestamp()) AS suresi_doldu
   FROM public.cogniti_token_yuklemeleri y WHERE y.firma_id=k.firma_id ORDER BY y.created_at DESC,y.yukleme_id DESC LIMIT 50) q;
 ELSE yuklemeler:='[]'::jsonb; END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam',v_kapsam,'yonetici',v_yonetici,'paket_turu',h.paket_turu,
  'bakiye',b.net_bakiye,'paket_asimi',b.paket_asimi,'toplam',v_toplam,'yuklemeler',yuklemeler,
  'gun_sonu',CASE WHEN lower(k.rol) IN ('utt','kd_utt') THEN public.cogniti_token_gun_sonu(p_kullanici) ELSE NULL END);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_raporu(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_raporu(uuid) TO service_role;

COMMIT;
SELECT to_regprocedure('public.cogniti_token_viva_islem(text,jsonb)') IS NOT NULL AS viva_kullanim_tuketimi_kuruldu,
 EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.viva_etkinlikler'::regclass AND tgname='trg_viva_token_kullanim' AND tgenabled='O') AS yeni_yayin_kurali_aktif;
