-- KULLANICI ÇALIŞTIRACAK. Yayın Yönetimi ileri tarihli açılışı için token rezervasyonu.
-- Yeni saha/E-Club planları; Eczanem dağıtım bloklaması ayrı kalır. Eski planlar geriye dönük ayrılmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-planli-yayin-token',0));
LOCK TABLE public.yayin_yonetimi IN SHARE ROW EXCLUSIVE MODE;
-- Geçiş listesi eski planın silinmesini engellemez; yalnız silinen yayının geçiş işareti kalkar.
DO $f$ DECLARE c record;BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.cogniti_yayin_anlik_eski_yayinlar'::regclass AND confrelid='public.yayin_yonetimi'::regclass AND contype='f' LOOP
  EXECUTE format('ALTER TABLE public.cogniti_yayin_anlik_eski_yayinlar DROP CONSTRAINT %I',c.conname);
 END LOOP;
 ALTER TABLE public.cogniti_yayin_anlik_eski_yayinlar ADD CONSTRAINT cogniti_eski_yayin_plan_silme_fk FOREIGN KEY(yayin_id) REFERENCES public.yayin_yonetimi(yayin_id) ON DELETE CASCADE;
END;$f$;
CREATE TABLE IF NOT EXISTS public.cogniti_yayin_plan_tokenlari(
 yayin_id uuid PRIMARY KEY, -- Plan iptalinde yayın silinir; rezervasyon geçmişi burada korunur.
 firma_id uuid NOT NULL,gonderen_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),bakiye_id uuid NOT NULL,
 hedef_at timestamptz NOT NULL,durum text NOT NULL CHECK(durum IN ('ayrildi','tuketildi','serbest')),
 miktar integer NOT NULL CHECK(miktar>=0),son_hata text,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 FOREIGN KEY(firma_id,bakiye_id) REFERENCES public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_id)
);
CREATE TABLE IF NOT EXISTS public.cogniti_yayin_plan_token_dagilimi(
 yayin_id uuid NOT NULL REFERENCES public.cogniti_yayin_plan_tokenlari(yayin_id),
 yukleme_id uuid NOT NULL REFERENCES public.cogniti_esnek_paket_yuklemeleri(yukleme_id),
 miktar integer NOT NULL CHECK(miktar>0),PRIMARY KEY(yayin_id,yukleme_id)
);
CREATE INDEX IF NOT EXISTS cogniti_plan_token_yukleme ON public.cogniti_yayin_plan_token_dagilimi(yukleme_id);
ALTER TABLE public.cogniti_yayin_plan_tokenlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_yayin_plan_token_dagilimi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_yayin_plan_tokenlari,public.cogniti_yayin_plan_token_dagilimi FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_yukleme_ayrilan(p_yukleme uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT (SELECT count(*) FROM public.eczanem_token_bloklari b WHERE b.yukleme_id=p_yukleme AND b.durum='blokeli' AND b.bitis_at>statement_timestamp())
 +coalesce((SELECT sum(d.miktar) FROM public.cogniti_yayin_plan_token_dagilimi d
 JOIN public.cogniti_yayin_plan_tokenlari h USING(yayin_id) JOIN public.cogniti_esnek_paket_yuklemeleri l USING(yukleme_id)
 WHERE d.yukleme_id=p_yukleme AND h.durum='ayrildi' AND l.son_kullanim_at>statement_timestamp()),0);
$f$;
REVOKE ALL ON FUNCTION public.cogniti_yukleme_ayrilan(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_yayin_plan_token_ayir(p_yayin uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE yy record;f uuid;b uuid;n integer;kalan integer;y record;pay integer;
BEGIN
 SELECT * INTO yy FROM public.yayin_yonetimi WHERE yayin_id=p_yayin FOR UPDATE;
 IF NOT FOUND OR yy.durum<>'planlandi' OR yy.token_hesap_turu IS NULL OR yy.hedef_roller=ARRAY['eczanem'] THEN RETURN 0;END IF;
 IF EXISTS(SELECT 1 FROM public.cogniti_yayin_acilis_token_kayitlari WHERE yayin_id=p_yayin) THEN RAISE EXCEPTION 'Açılmış yayın tekrar planlanamaz.' USING ERRCODE='22023'; END IF;
 SELECT firma_id INTO f FROM public.kullanicilar WHERE kullanici_id=yy.uretici_id;
 SELECT bakiye_id INTO b FROM public.cogniti_satin_alma_bakiyeleri WHERE firma_id=f AND bakiye_turu=yy.token_hesap_turu AND (bakiye_turu='firma_ortak' OR sahip_id=yy.uretici_id) FOR UPDATE;
 IF b IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:hesap_yok' USING ERRCODE='P0001';END IF;
 IF yy.yayin_tarihi<=clock_timestamp() THEN RAISE EXCEPTION 'ESNEK_PLAN:tarih_gecersiz' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO n FROM public.cogniti_yayin_token_alicilari(yy.uretici_id,yy.soru_seti_durum_id);
 UPDATE public.cogniti_yayin_plan_tokenlari SET durum='serbest',updated_at=statement_timestamp() WHERE yayin_id=p_yayin;
 DELETE FROM public.cogniti_yayin_plan_token_dagilimi WHERE yayin_id=p_yayin;
 INSERT INTO public.cogniti_yayin_plan_tokenlari(yayin_id,firma_id,gonderen_id,bakiye_id,hedef_at,durum,miktar)
 VALUES(p_yayin,f,yy.uretici_id,b,yy.yayin_tarihi,'ayrildi',n)
 ON CONFLICT(yayin_id) DO UPDATE SET hedef_at=excluded.hedef_at,durum='ayrildi',miktar=excluded.miktar,son_hata=NULL,updated_at=statement_timestamp();
 kalan:=n;
 FOR y IN SELECT l.yukleme_id,l.kalan-public.cogniti_yukleme_ayrilan(l.yukleme_id) AS uygun
 FROM public.cogniti_esnek_paket_yuklemeleri l WHERE l.bakiye_id=b AND l.firma_id=f AND l.son_kullanim_at>yy.yayin_tarihi
 ORDER BY l.son_kullanim_at,l.created_at,l.yukleme_id FOR UPDATE OF l LOOP
  EXIT WHEN kalan=0;
  pay:=least(kalan,greatest(0,y.uygun));IF pay=0 THEN CONTINUE;END IF;
  INSERT INTO public.cogniti_yayin_plan_token_dagilimi VALUES(p_yayin,y.yukleme_id,pay);kalan:=kalan-pay;
 END LOOP;
 IF kalan>0 THEN RAISE EXCEPTION 'ESNEK_PLAN:yetersiz' USING ERRCODE='P0001'; END IF;
 RETURN n;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_yayin_plan_token_ayir(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_yayin_plan_token_birak()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE b uuid;
BEGIN
 SELECT bakiye_id INTO b FROM public.cogniti_yayin_plan_tokenlari WHERE yayin_id=OLD.yayin_id;
 IF b IS NULL THEN IF TG_OP='DELETE' THEN RETURN OLD;ELSE RETURN NEW;END IF;END IF;
 PERFORM 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=b FOR UPDATE;
 IF TG_OP='DELETE' THEN
  IF OLD.durum<>'planlandi' AND EXISTS(SELECT 1 FROM public.cogniti_yayin_acilis_token_kayitlari WHERE yayin_id=OLD.yayin_id) THEN RAISE EXCEPTION 'Açılmış yayın plan iptaliyle silinemez.' USING ERRCODE='22023';END IF;
  UPDATE public.cogniti_yayin_plan_tokenlari SET durum='serbest',updated_at=statement_timestamp() WHERE yayin_id=OLD.yayin_id AND durum='ayrildi';
  RETURN OLD;
 END IF;
 IF OLD.uretici_id IS DISTINCT FROM NEW.uretici_id OR OLD.soru_seti_durum_id IS DISTINCT FROM NEW.soru_seti_durum_id OR OLD.hedef_roller IS DISTINCT FROM NEW.hedef_roller THEN RAISE EXCEPTION 'Plan kaynağı değiştirilemez.' USING ERRCODE='42501'; END IF;
 IF OLD.durum='planlandi' AND (NEW.durum IS DISTINCT FROM OLD.durum OR NEW.yayin_tarihi IS DISTINCT FROM OLD.yayin_tarihi) THEN
  UPDATE public.cogniti_yayin_plan_tokenlari SET durum='serbest',updated_at=statement_timestamp() WHERE yayin_id=OLD.yayin_id AND durum='ayrildi';
 END IF;
 RETURN NEW;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_yayin_plan_token_birak() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_00_plan_token_birak ON public.yayin_yonetimi;
CREATE TRIGGER trg_00_plan_token_birak BEFORE UPDATE OR DELETE ON public.yayin_yonetimi FOR EACH ROW EXECUTE FUNCTION public.cogniti_yayin_plan_token_birak();
CREATE OR REPLACE FUNCTION public.cogniti_yayin_plan_token_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF NEW.hedef_roller=ARRAY['eczanem'] OR NEW.token_hesap_turu IS NULL THEN RETURN NEW;END IF;
 IF NEW.durum='planlandi' THEN
  IF TG_OP='INSERT' THEN PERFORM public.cogniti_yayin_plan_token_ayir(NEW.yayin_id);
  ELSIF NEW.yayin_tarihi IS DISTINCT FROM OLD.yayin_tarihi OR NEW.durum IS DISTINCT FROM OLD.durum THEN PERFORM public.cogniti_yayin_plan_token_ayir(NEW.yayin_id);END IF;
 ELSIF NEW.durum='yayinda' AND EXISTS(SELECT 1 FROM public.cogniti_yayin_acilis_token_kayitlari WHERE yayin_id=NEW.yayin_id) THEN
  UPDATE public.cogniti_yayin_plan_tokenlari SET durum='tuketildi',updated_at=statement_timestamp(),son_hata=NULL WHERE yayin_id=NEW.yayin_id;
 END IF;
 RETURN NEW;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_yayin_plan_token_kaydet() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_zzz_plan_token_kaydet ON public.yayin_yonetimi;
CREATE TRIGGER trg_zzz_plan_token_kaydet AFTER INSERT OR UPDATE OF durum,yayin_tarihi ON public.yayin_yonetimi FOR EACH ROW EXECUTE FUNCTION public.cogniti_yayin_plan_token_kaydet();
CREATE OR REPLACE FUNCTION public.cogniti_esnek_gonderim_tuket(
 p_auth uuid,p_tur text,p_akis text,p_kaynak uuid,p_alici uuid,p_kimlik text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record;b uuid;y uuid;onceki record;tur text;
BEGIN
 IF p_tur IS NULL OR p_tur NOT IN ('kisisel','firma_ortak') OR p_kaynak IS NULL OR p_alici IS NULL OR nullif(p_kimlik,'') IS NULL THEN
  RAISE EXCEPTION 'ESNEK_GONDERIM:secim_gecersiz' USING ERRCODE='22023'; END IF;
 SELECT u.firma_id,lower(btrim(u.rol)) rol INTO k FROM public.kullanicilar u JOIN public.firmalar f USING(firma_id)
 WHERE u.kullanici_id=p_auth AND u.aktif_mi AND f.aktif FOR SHARE OF u,f;
 IF NOT FOUND OR (p_akis='yayin_acilis' AND k.rol NOT IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'))
  OR p_akis IS DISTINCT FROM 'yayin_acilis' THEN
  RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
 SELECT CASE WHEN yy.hedef_roller && ARRAY['eczaci','eczane_teknisyeni'] THEN 'eclub_kisi' ELSE 'firma_kullanicisi' END INTO tur
 FROM public.yayin_yonetimi yy WHERE yy.yayin_id=p_kaynak AND yy.uretici_id=p_auth AND yy.token_hesap_turu=p_tur;
 IF tur IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
 SELECT bakiye_id INTO b FROM public.cogniti_satin_alma_bakiyeleri
 WHERE firma_id=k.firma_id AND bakiye_turu=p_tur AND (p_tur='firma_ortak' OR sahip_id=p_auth) FOR UPDATE;
 IF b IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:hesap_yok' USING ERRCODE='P0001'; END IF;
 SELECT * INTO onceki FROM public.cogniti_esnek_gonderim_tuketimleri WHERE islem_kimligi=p_kimlik;
 IF FOUND THEN
  IF onceki.bakiye_id<>b OR onceki.gonderen_id<>p_auth OR onceki.akis<>p_akis OR onceki.kaynak_id<>p_kaynak OR onceki.alici_id<>p_alici THEN
   RAISE EXCEPTION 'ESNEK_GONDERIM:tekrar_uyusmazligi' USING ERRCODE='22023'; END IF;
  RETURN;
 END IF;
 SELECT l.yukleme_id INTO y FROM public.cogniti_esnek_paket_yuklemeleri l
 WHERE l.bakiye_id=b AND l.firma_id=k.firma_id AND l.son_kullanim_at>clock_timestamp()
 AND l.kalan>public.cogniti_yukleme_ayrilan(l.yukleme_id)
 ORDER BY l.son_kullanim_at,l.created_at,l.yukleme_id LIMIT 1 FOR UPDATE OF l;
 IF y IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetersiz' USING ERRCODE='P0001'; END IF;
 UPDATE public.cogniti_esnek_paket_yuklemeleri SET kalan=kalan-1 WHERE yukleme_id=y;
 INSERT INTO public.cogniti_esnek_gonderim_tuketimleri(firma_id,bakiye_id,yukleme_id,gonderen_id,akis,kaynak_id,alici_id,islem_kimligi,alici_turu)
 VALUES(k.firma_id,b,y,p_auth,p_akis,p_kaynak,p_alici,p_kimlik,tur);
END;$f$;

CREATE OR REPLACE FUNCTION public.eczanem_pm_token_eczane_blokla(p_yayin uuid,p_eczane uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE h public.eczanem_yayin_token_hesaplari%ROWTYPE; s record; u record; y record; gerekli integer; mevcut bigint; son timestamptz; n integer:=0;
BEGIN
 SELECT * INTO h FROM public.eczanem_yayin_token_hesaplari WHERE yayin_id=p_yayin;
 IF NOT FOUND THEN
  IF EXISTS(SELECT 1 FROM public.eczanem_token_eski_yayinlar WHERE yayin_id=p_yayin) THEN RETURN 0; END IF;
  RAISE EXCEPTION 'ECZANEM_TOKEN:hesap_secilmedi' USING ERRCODE='P0001';
 END IF;
 -- Ortak hesap üzerindeki diğer eczane/yayın işlemleri aynı sırada hesap kilidini kullanır.
 PERFORM 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=h.bakiye_id FOR UPDATE;
 SELECT * INTO s FROM public.eczanem_yayin_gonderim_sureleri WHERE yayin_id=p_yayin;
 IF s.uretici_rol IS NULL OR s.uretici_id IS DISTINCT FROM h.pm_id OR s.uretici_rol NOT IN ('pm','jr_pm','kd_pm','med_md') THEN
  RAISE EXCEPTION 'ECZANEM_TOKEN:pm_kaynagi_gecersiz' USING ERRCODE='42501'; END IF;
 son:=s.baslangic_at+interval '720 hours';
 IF clock_timestamp()>=son THEN RAISE EXCEPTION 'ECZANEM_GONDERIM:sure_doldu' USING ERRCODE='P0001'; END IF;
 -- UTT ilk teslimde o andaki aktif/uygun ve henüz gönderilmemiş danışanların kimliklerini sabitler.
 -- Tekrar çağrı snapshotı büyütmez. Eczaneye yeni üye eklenmesi eski bloku aşamaz.
 IF EXISTS(SELECT 1 FROM public.eczanem_token_bloklari WHERE yayin_id=p_yayin AND eczane_id=p_eczane) THEN RETURN 0; END IF;
 -- Sıfır uygun üyeli snapshot için de tekrar kayıt oluşmaması yayın-eczane kaydının transaction'ıyla korunur.
 SELECT count(*) INTO gerekli FROM public.eczanem_uyelikler uy JOIN public.eczanem_musteriler m USING(musteri_id)
 WHERE uy.eczane_id=p_eczane AND uy.aktif_mi=true AND m.aktif_mi=true
  AND NOT EXISTS(SELECT 1 FROM public.eczanem_eclub_gecis_talepleri g WHERE g.musteri_id=uy.musteri_id)
  AND NOT EXISTS(SELECT 1 FROM public.eczanem_gonderimler g WHERE g.yayin_id=p_yayin AND g.eczane_id=p_eczane AND g.musteri_id=uy.musteri_id);
 SELECT coalesce(sum(z.kalan-coalesce(b.adet,0)),0) INTO mevcut FROM public.cogniti_esnek_paket_yuklemeleri z
 LEFT JOIN LATERAL(SELECT public.cogniti_yukleme_ayrilan(z.yukleme_id) AS adet) b ON true
 WHERE z.bakiye_id=h.bakiye_id AND z.firma_id=h.firma_id AND z.son_kullanim_at>clock_timestamp();
 IF mevcut<gerekli THEN RAISE EXCEPTION 'ECZANEM_TOKEN:yetersiz' USING ERRCODE='P0001'; END IF;
 FOR u IN SELECT DISTINCT uy.musteri_id FROM public.eczanem_uyelikler uy JOIN public.eczanem_musteriler m USING(musteri_id)
 WHERE uy.eczane_id=p_eczane AND uy.aktif_mi=true AND m.aktif_mi=true
  AND NOT EXISTS(SELECT 1 FROM public.eczanem_eclub_gecis_talepleri g WHERE g.musteri_id=uy.musteri_id)
  AND NOT EXISTS(SELECT 1 FROM public.eczanem_gonderimler g WHERE g.yayin_id=p_yayin AND g.eczane_id=p_eczane AND g.musteri_id=uy.musteri_id)
 ORDER BY uy.musteri_id LOOP
  SELECT z.* INTO y FROM public.cogniti_esnek_paket_yuklemeleri z
  WHERE z.bakiye_id=h.bakiye_id AND z.firma_id=h.firma_id AND z.son_kullanim_at>clock_timestamp()
   AND z.kalan>public.cogniti_yukleme_ayrilan(z.yukleme_id)
  ORDER BY z.son_kullanim_at,z.created_at,z.yukleme_id LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ECZANEM_TOKEN:yetersiz' USING ERRCODE='P0001'; END IF;
  INSERT INTO public.eczanem_token_bloklari(yayin_id,eczane_id,musteri_id,firma_id,bakiye_id,yukleme_id,bitis_at)
  VALUES(p_yayin,p_eczane,u.musteri_id,h.firma_id,h.bakiye_id,y.yukleme_id,least(son,y.son_kullanim_at));
  n:=n+1;
 END LOOP;
 RETURN n;
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_satin_alma_bakiye_ozeti(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_firma uuid; v_kisisel jsonb; v_ortak jsonb;
BEGIN
 SELECT k.firma_id INTO v_firma FROM public.kullanicilar k JOIN public.firmalar f USING(firma_id)
 WHERE k.kullanici_id=p_auth_id AND k.aktif_mi=true AND f.aktif=true
 AND lower(btrim(k.rol)) IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per',
  'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin','tm','bm','utt','kd_utt','iu');
 IF v_firma IS NULL THEN RAISE EXCEPTION 'Token bakiyelerine erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 WITH ozet AS (
  SELECT b.bakiye_turu,
   jsonb_build_object(
    'paket',CASE WHEN coalesce(sum(y.miktar),0)>0 THEN 'esnek' ELSE NULL END,
    'toplam',coalesce(sum(y.miktar),0),
    -- Süre dolması tüketim değildir; tüketim miktarı kalan farkından ayrı hesaplanır.
    -- Kalan henüz tüketilmemiş tokenı temsil eder. Rezervasyon adımında kalan azaltılmadan ayrı tutulmalıdır.
    'kullanilan',coalesce(sum(y.miktar-y.kalan),0),
    'kalan',coalesce(sum(y.kalan-coalesce(bl.adet,0)) FILTER(WHERE y.son_kullanim_at>statement_timestamp()),0),
    'suresi_dolan',coalesce(sum(y.kalan) FILTER(WHERE y.son_kullanim_at<=statement_timestamp()),0),
    'ayrilan',coalesce(sum(bl.adet),0)
   ) AS deger
  FROM public.cogniti_satin_alma_bakiyeleri b
  LEFT JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.bakiye_id=b.bakiye_id AND y.firma_id=b.firma_id
  LEFT JOIN LATERAL(SELECT public.cogniti_yukleme_ayrilan(y.yukleme_id) AS adet) bl ON true
  WHERE b.firma_id=v_firma AND (b.bakiye_turu='firma_ortak' OR (b.bakiye_turu='kisisel' AND b.sahip_id=p_auth_id))
  GROUP BY b.bakiye_id,b.bakiye_turu
 ) SELECT (SELECT deger FROM ozet WHERE bakiye_turu='kisisel'),(SELECT deger FROM ozet WHERE bakiye_turu='firma_ortak')
 INTO v_kisisel,v_ortak;
 RETURN jsonb_build_object('kisisel',v_kisisel,'firma_ortak',coalesce(v_ortak,jsonb_build_object('paket',NULL,'toplam',0,'kullanilan',0,'kalan',0,'suresi_dolan',0,'ayrilan',0)));
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_gonderim_token_onizle(
 p_auth_id uuid,p_akis text,p_bakiye_turu text,p_kaynak_idler uuid[],p_alici_idler uuid[],p_plan_tarihi date DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_firma uuid; v_rol text; v_tur jsonb; v_ozet jsonb; v_uygun integer:=0; v_atlanan integer:=0;
 v_gereken bigint:=0; v_mevcut bigint:=0; v_hedef timestamptz; v_kontrol jsonb; v_aday record; v_hedefler text[];
 v_not text; v_tarih date:=(statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
 IF p_akis IS NULL OR p_akis NOT IN ('yayin_acilis','eclub_oneri') OR p_bakiye_turu IS NULL OR p_bakiye_turu NOT IN ('kisisel','firma_ortak')
  OR coalesce(cardinality(p_kaynak_idler),0) NOT BETWEEN 1 AND 20 OR array_position(p_kaynak_idler,NULL) IS NOT NULL
  OR coalesce(cardinality(p_alici_idler),0)>100 OR array_position(p_alici_idler,NULL) IS NOT NULL
  OR (p_plan_tarihi IS NOT NULL AND (NOT isfinite(p_plan_tarihi) OR p_plan_tarihi<v_tarih)) THEN
  RAISE EXCEPTION 'Önizleme seçimi geçersiz.' USING ERRCODE='22023';
 END IF;
 v_ozet:=public.cogniti_satin_alma_bakiye_ozeti(p_auth_id);
 SELECT firma_id,lower(btrim(rol)) INTO v_firma,v_rol FROM public.kullanicilar WHERE kullanici_id=p_auth_id;
 v_tur:=CASE WHEN p_bakiye_turu='kisisel' THEN v_ozet->'kisisel' ELSE v_ozet->'firma_ortak' END;
 IF v_tur IS NULL OR v_tur='null'::jsonb THEN
  RAISE EXCEPTION 'Bu bakiye size ait değil veya tanımlı değil.' USING ERRCODE='42501';
 END IF;
 v_hedef:=CASE WHEN p_plan_tarihi IS NULL THEN statement_timestamp() ELSE (p_plan_tarihi::timestamp+interval '7 hours') AT TIME ZONE 'Europe/Istanbul' END;
 IF p_plan_tarihi IS NOT NULL AND v_hedef<=clock_timestamp() THEN RAISE EXCEPTION 'Plan tarihi geçmiş.' USING ERRCODE='22023';END IF;
 -- Yalnız kullanıcıya ait kişisel hesap veya kendi firmasının ortak hesabı.
 SELECT coalesce(sum(y.kalan-coalesce(hold.adet,0)),0) INTO v_mevcut
 FROM public.cogniti_satin_alma_bakiyeleri b JOIN public.cogniti_esnek_paket_yuklemeleri y USING(firma_id,bakiye_id)
 LEFT JOIN LATERAL(SELECT public.cogniti_yukleme_ayrilan(y.yukleme_id) AS adet) hold ON true
 WHERE b.firma_id=v_firma AND b.bakiye_turu=p_bakiye_turu
  AND (b.bakiye_turu='firma_ortak' OR b.sahip_id=p_auth_id) AND y.son_kullanim_at>v_hedef;
 IF p_akis<>'yayin_acilis' OR coalesce(cardinality(p_alici_idler),0)<>0 THEN RAISE EXCEPTION 'Hesap seçimi yalnız üreticinin yayın açılışında yapılır.' USING ERRCODE='42501'; END IF;
 FOR v_aday IN
 SELECT DISTINCT s.soru_seti_durum_id,t.talep_id,t.firma_id,t.uretici_id,t.takim_id,t.hedef_roller,t.taslak_mi,t.yayin_oncesi_silme_durumu,s.durum
 FROM public.soru_seti_durumu s JOIN public.soru_setleri ss ON ss.soru_seti_id=s.soru_seti_id JOIN public.talepler t ON t.talep_id=ss.talep_id WHERE s.soru_seti_durum_id=ANY(p_kaynak_idler)
 LOOP
 IF v_aday.uretici_id IS DISTINCT FROM p_auth_id OR v_aday.firma_id IS DISTINCT FROM v_firma THEN RAISE EXCEPTION 'Başka üreticinin yayını kullanılamaz.' USING ERRCODE='42501'; END IF;
 IF v_aday.durum<>'onaylandi' OR v_aday.taslak_mi OR v_aday.yayin_oncesi_silme_durumu IS NOT NULL OR EXISTS(SELECT 1 FROM public.yayin_yonetimi y WHERE y.soru_seti_durum_id=v_aday.soru_seti_durum_id) THEN v_atlanan:=v_atlanan+1;CONTINUE;END IF;
 SELECT v_gereken+count(*) INTO v_gereken FROM public.cogniti_yayin_token_alicilari(p_auth_id,v_aday.soru_seti_durum_id);
 v_uygun:=v_uygun+1;
 END LOOP;
  IF v_uygun+v_atlanan<>(SELECT count(DISTINCT x) FROM unnest(p_kaynak_idler) x) THEN
   RAISE EXCEPTION 'Yayın adayı bulunamadı.' USING ERRCODE='22023';
  END IF;
 v_not:=CASE WHEN p_plan_tarihi IS NULL THEN 'Tokenlar gerçek yayın açılışında tüketilir.' ELSE 'Plan kaydında tokenlar ayrılır; gerçek açılışta tüketilir. İptal veya gerçekleşmeme durumunda ayrılan tokenlar serbest bırakılır.' END;
 RETURN jsonb_build_object('akis',p_akis,'bakiye_turu',p_bakiye_turu,'planli',p_plan_tarihi IS NOT NULL,
  'uygun_kayit',v_uygun,'atlanan_kayit',v_atlanan,'gereken_token',v_gereken,'kullanilabilir_token',v_mevcut,
  'islem_sonrasi',greatest(0,v_mevcut-v_gereken),'eksik_token',greatest(0,v_gereken-v_mevcut),
  'yeterli',v_mevcut>=v_gereken,'gercek_gonderim_acik',p_plan_tarihi IS NULL,'plan_rezervasyonu_acik',true,'aciklama',v_not);
END;
$f$;

CREATE OR REPLACE FUNCTION public.yayin_planlananlari_aktive(p_yayin_id uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE aktive_sayisi integer:=0; y record; v_tarih timestamptz; v_urun_adi text;
BEGIN
 FOR y IN
  SELECT yayin_id,uretici_id,hedef_roller,yayin_tarihi FROM public.yayin_yonetimi
  WHERE durum='planlandi' AND ((p_yayin_id IS NULL AND yayin_tarihi<=now()) OR yayin_id=p_yayin_id)
  ORDER BY yayin_id FOR UPDATE SKIP LOCKED
 LOOP
  BEGIN
   v_tarih:=least(y.yayin_tarihi,now());
   UPDATE public.yayin_yonetimi SET durum='yayinda',yayin_tarihi=v_tarih WHERE yayin_id=y.yayin_id;
   INSERT INTO public.yayin_tekrar_kayitlari(yayin_id,tur_no,acilis_turu,baslangic_tarihi)
    VALUES(y.yayin_id,1,'ilk_yayin',v_tarih) ON CONFLICT(yayin_id,tur_no) DO NOTHING;
   SELECT coalesce(urun_adi,'-') INTO v_urun_adi FROM public.v_yayin_detay WHERE yayin_id=y.yayin_id;
   INSERT INTO public.bildirimler(alici_id,gonderen_id,kayit_turu,kayit_id,mesaj,goruldu_mu)
    SELECT k.kullanici_id,y.uretici_id,'yayin',y.yayin_id,'Yeni öğrenme içeriği yayında: '||coalesce(v_urun_adi,'-'),false
    FROM public.cogniti_token_yayin_gonderim_alicilari(y.yayin_id) k
    ON CONFLICT(alici_id,kayit_turu,kayit_id) DO NOTHING;
   IF y.hedef_roller && ARRAY['utt','kd_utt'] THEN
    INSERT INTO public.bildirimler(alici_id,gonderen_id,kayit_turu,kayit_id,mesaj,goruldu_mu)
     SELECT k.kullanici_id,y.uretici_id,'yayin',y.yayin_id,'Ekibinize önerebileceğiniz yeni öğrenme içeriği yayında: '||coalesce(v_urun_adi,'-'),false
     FROM public.v_yayin_detay v
     JOIN public.kullanicilar k ON k.firma_id=v.firma_id AND (v.takim_id IS NULL OR k.takim_id=v.takim_id)
     WHERE v.yayin_id=y.yayin_id AND k.rol='bm' AND k.aktif_mi=true
     ON CONFLICT(alici_id,kayit_turu,kayit_id) DO NOTHING;
   END IF;
   IF p_yayin_id IS NULL AND y.uretici_id IS NOT NULL THEN
    INSERT INTO public.bildirimler(alici_id,gonderen_id,kayit_turu,kayit_id,mesaj,goruldu_mu)
     VALUES(y.uretici_id,y.uretici_id,'yayin',y.yayin_id,coalesce(nullif(v_urun_adi,'-'),'Yayın')||' adlı '||y.yayin_id||' nolu planlı yayınız, başarıyla yayınlanmıştır.',false)
     ON CONFLICT(alici_id,kayit_turu,kayit_id) DO UPDATE SET mesaj=EXCLUDED.mesaj,goruldu_mu=false,created_at=now();
   END IF;
   aktive_sayisi:=aktive_sayisi+1;
  EXCEPTION WHEN SQLSTATE 'P0001' OR SQLSTATE '42501' OR SQLSTATE '22023' OR SQLSTATE '23514' THEN
   -- Yayın/açılış/tüketim bu alt işlemle geri alındı. Kullanılmayan rezervasyon bırakılır.
   UPDATE public.cogniti_yayin_plan_tokenlari SET durum='serbest',son_hata=SQLSTATE,updated_at=statement_timestamp() WHERE yayin_id=y.yayin_id AND durum='ayrildi';
   RAISE WARNING 'Yayın % açılamadı; plan tokenları serbest bırakıldı: %',y.yayin_id,SQLERRM;
  END;
 END LOOP;
 RETURN aktive_sayisi;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_gonderim_tuket(uuid,text,text,uuid,uuid,text),public.eczanem_pm_token_eczane_blokla(uuid,uuid),public.cogniti_satin_alma_bakiye_ozeti(uuid),public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date),public.yayin_planlananlari_aktive(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid),public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date),public.yayin_planlananlari_aktive(uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_planli_yayin_token_rezervasyonu_kuruldu;
