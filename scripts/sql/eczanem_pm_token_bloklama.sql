-- KULLANICI ÇALIŞTIRACAK. Ön koşul: Esnek Paket Adım 1/2 ve PM kaynaklı Eczanem 30 gün kurulumu.
-- Yalnız PM ailesinin Esnek Paket token hesapları. Satın alma/diğer gönderim yollarını açmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eczanem-pm-token-bloklama',0));
ALTER TABLE public.yayin_yonetimi ADD COLUMN IF NOT EXISTS eczanem_token_hesap_turu text
 CHECK(eczanem_token_hesap_turu IN ('kisisel','firma_ortak'));
-- İlk kurulumdaki yayınlar mevcut firma hesabıyla sürer. Tekrar kurulum yeni yayınları bu kapsama almaz.
CREATE TABLE IF NOT EXISTS public.eczanem_token_gecis_kaydi(tekil boolean PRIMARY KEY CHECK(tekil),kuruldu_at timestamptz NOT NULL DEFAULT statement_timestamp());
CREATE TABLE IF NOT EXISTS public.eczanem_token_eski_yayinlar(yayin_id uuid PRIMARY KEY REFERENCES public.yayin_yonetimi(yayin_id));
DO $gecis$
DECLARE n integer;
BEGIN
 INSERT INTO public.eczanem_token_gecis_kaydi(tekil) VALUES(true) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n=1 THEN
  INSERT INTO public.eczanem_token_eski_yayinlar(yayin_id)
   SELECT yayin_id FROM public.yayin_yonetimi WHERE coalesce(hedef_roller,ARRAY[]::text[]) @> ARRAY['eczanem']::text[];
 END IF;
END;
$gecis$;
ALTER TABLE public.eczanem_token_gecis_kaydi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eczanem_token_eski_yayinlar ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eczanem_token_gecis_kaydi,public.eczanem_token_eski_yayinlar FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE IF NOT EXISTS public.eczanem_yayin_token_hesaplari (
 yayin_id uuid PRIMARY KEY REFERENCES public.yayin_yonetimi(yayin_id),
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 pm_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 bakiye_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 FOREIGN KEY(firma_id,bakiye_id) REFERENCES public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_id),
 UNIQUE(yayin_id,firma_id,bakiye_id)
);
CREATE TABLE IF NOT EXISTS public.eczanem_token_bloklari (
 blok_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 yayin_id uuid NOT NULL,eczane_id uuid NOT NULL,musteri_id uuid NOT NULL,
 firma_id uuid NOT NULL,bakiye_id uuid NOT NULL,
 yukleme_id uuid NOT NULL REFERENCES public.cogniti_esnek_paket_yuklemeleri(yukleme_id),
 durum text NOT NULL DEFAULT 'blokeli' CHECK(durum IN ('blokeli','tuketildi')),
 bitis_at timestamptz NOT NULL,
 gonderim_id uuid UNIQUE,
 tuketildi_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 CHECK((durum='blokeli' AND gonderim_id IS NULL AND tuketildi_at IS NULL) OR (durum='tuketildi' AND gonderim_id IS NOT NULL AND tuketildi_at IS NOT NULL)),
 FOREIGN KEY(yayin_id,firma_id,bakiye_id) REFERENCES public.eczanem_yayin_token_hesaplari(yayin_id,firma_id,bakiye_id),
 UNIQUE(yayin_id,eczane_id,musteri_id)
);
CREATE INDEX IF NOT EXISTS eczanem_token_blok_hesap ON public.eczanem_token_bloklari(bakiye_id,yukleme_id,bitis_at) WHERE durum='blokeli';
-- Süre sonu blok, bitis_at <= işlem anı olduğunda kendiliğinden kullanılabilir hesaba döner.
-- Kalan yükleme miktarı blokta azaltılmaz; yalnız başarılı teslimde azalır. İade yeni token yaratmaz.
ALTER TABLE public.eczanem_yayin_token_hesaplari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eczanem_token_bloklari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eczanem_yayin_token_hesaplari,public.eczanem_token_bloklari FROM PUBLIC,anon,authenticated,service_role;

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
 IF s.uretici_rol IS NULL OR s.uretici_id IS DISTINCT FROM h.pm_id OR s.uretici_rol NOT IN ('pm','jr_pm','kd_pm') THEN
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
 LEFT JOIN LATERAL(SELECT count(*) AS adet FROM public.eczanem_token_bloklari b WHERE b.yukleme_id=z.yukleme_id AND b.durum='blokeli' AND b.bitis_at>clock_timestamp()) b ON true
 WHERE z.bakiye_id=h.bakiye_id AND z.firma_id=h.firma_id AND z.son_kullanim_at>clock_timestamp();
 IF mevcut<gerekli THEN RAISE EXCEPTION 'ECZANEM_TOKEN:yetersiz' USING ERRCODE='P0001'; END IF;
 FOR u IN SELECT DISTINCT uy.musteri_id FROM public.eczanem_uyelikler uy JOIN public.eczanem_musteriler m USING(musteri_id)
 WHERE uy.eczane_id=p_eczane AND uy.aktif_mi=true AND m.aktif_mi=true
  AND NOT EXISTS(SELECT 1 FROM public.eczanem_eclub_gecis_talepleri g WHERE g.musteri_id=uy.musteri_id)
  AND NOT EXISTS(SELECT 1 FROM public.eczanem_gonderimler g WHERE g.yayin_id=p_yayin AND g.eczane_id=p_eczane AND g.musteri_id=uy.musteri_id)
 ORDER BY uy.musteri_id LOOP
  SELECT z.* INTO y FROM public.cogniti_esnek_paket_yuklemeleri z
  WHERE z.bakiye_id=h.bakiye_id AND z.firma_id=h.firma_id AND z.son_kullanim_at>clock_timestamp()
   AND z.kalan>(SELECT count(*) FROM public.eczanem_token_bloklari b WHERE b.yukleme_id=z.yukleme_id AND b.durum='blokeli' AND b.bitis_at>clock_timestamp())
  ORDER BY z.son_kullanim_at,z.created_at,z.yukleme_id LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ECZANEM_TOKEN:yetersiz' USING ERRCODE='P0001'; END IF;
  INSERT INTO public.eczanem_token_bloklari(yayin_id,eczane_id,musteri_id,firma_id,bakiye_id,yukleme_id,bitis_at)
  VALUES(p_yayin,p_eczane,u.musteri_id,h.firma_id,h.bakiye_id,y.yukleme_id,least(son,y.son_kullanim_at));
  n:=n+1;
 END LOOP;
 RETURN n;
END;
$f$;

CREATE OR REPLACE FUNCTION public.eczanem_pm_token_hesap_bagla()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record; b uuid; eski public.eczanem_yayin_token_hesaplari%ROWTYPE; e record;
BEGIN
 IF EXISTS(SELECT 1 FROM public.eczanem_token_eski_yayinlar WHERE yayin_id=NEW.yayin_id) THEN
  IF NEW.eczanem_token_hesap_turu IS NOT NULL THEN RAISE EXCEPTION 'ECZANEM_TOKEN:eski_yayin' USING ERRCODE='42501'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.eczanem_token_hesap_turu IS NULL THEN
  IF EXISTS(SELECT 1 FROM public.eczanem_yayin_token_hesaplari WHERE yayin_id=NEW.yayin_id) THEN RAISE EXCEPTION 'ECZANEM_TOKEN:hesap_degistirilemez' USING ERRCODE='42501'; END IF;
  IF coalesce(NEW.hedef_roller,ARRAY[]::text[]) @> ARRAY['eczanem']::text[] THEN RAISE EXCEPTION 'ECZANEM_TOKEN:hesap_secilmedi' USING ERRCODE='P0001'; END IF;
  RETURN NEW;
 END IF;
 IF NOT(coalesce(NEW.hedef_roller,ARRAY[]::text[]) @> ARRAY['eczanem']::text[]) THEN
  RAISE EXCEPTION 'ECZANEM_TOKEN:yalniz_eczanem' USING ERRCODE='42501'; END IF;
 SELECT u.kullanici_id,u.firma_id,lower(btrim(u.rol)) rol INTO k FROM public.kullanicilar u JOIN public.firmalar f USING(firma_id)
 WHERE u.kullanici_id=NEW.uretici_id AND u.aktif_mi=true AND f.aktif=true;
 IF k.rol IS NULL OR k.rol NOT IN ('pm','jr_pm','kd_pm')
  OR NOT EXISTS(SELECT 1 FROM public.v_yayin_detay WHERE yayin_id=NEW.yayin_id AND firma_id=k.firma_id) THEN RAISE EXCEPTION 'ECZANEM_TOKEN:pm_kaynagi_gecersiz' USING ERRCODE='42501'; END IF;
 SELECT * INTO eski FROM public.eczanem_yayin_token_hesaplari WHERE yayin_id=NEW.yayin_id;
 IF FOUND THEN
  IF eski.pm_id IS DISTINCT FROM NEW.uretici_id OR NOT EXISTS(SELECT 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=eski.bakiye_id AND bakiye_turu=NEW.eczanem_token_hesap_turu) THEN
   RAISE EXCEPTION 'ECZANEM_TOKEN:hesap_degistirilemez' USING ERRCODE='42501'; END IF;
  RETURN NEW;
 END IF;
 INSERT INTO public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_turu,sahip_id)
 VALUES(k.firma_id,NEW.eczanem_token_hesap_turu,CASE WHEN NEW.eczanem_token_hesap_turu='kisisel' THEN k.kullanici_id ELSE NULL END) ON CONFLICT DO NOTHING;
 SELECT bakiye_id INTO STRICT b FROM public.cogniti_satin_alma_bakiyeleri
 WHERE firma_id=k.firma_id AND bakiye_turu=NEW.eczanem_token_hesap_turu AND sahip_id IS NOT DISTINCT FROM CASE WHEN NEW.eczanem_token_hesap_turu='kisisel' THEN k.kullanici_id ELSE NULL END;
 INSERT INTO public.eczanem_yayin_token_hesaplari(yayin_id,firma_id,pm_id,bakiye_id) VALUES(NEW.yayin_id,k.firma_id,k.kullanici_id,b);
 -- Eski teslimler için PM hesabı ilk defa seçtiğinde henüz gönderilmemiş aktif üyeler bloklanır.
 FOR e IN SELECT eczane_id FROM public.eczanem_eczane_gonderimleri WHERE yayin_id=NEW.yayin_id ORDER BY eczane_id LOOP
  PERFORM public.eczanem_pm_token_eczane_blokla(NEW.yayin_id,e.eczane_id);
 END LOOP;
 RETURN NEW;
END;
$f$;
DROP TRIGGER IF EXISTS trg_zz_eczanem_pm_token_hesap ON public.yayin_yonetimi;
CREATE TRIGGER trg_zz_eczanem_pm_token_hesap AFTER INSERT OR UPDATE OF eczanem_token_hesap_turu,uretici_id ON public.yayin_yonetimi
 FOR EACH ROW EXECUTE FUNCTION public.eczanem_pm_token_hesap_bagla();

CREATE OR REPLACE FUNCTION public.eczanem_pm_token_utt_blokla()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM public.eczanem_pm_token_eczane_blokla(NEW.yayin_id,NEW.eczane_id);
 RETURN NEW;
END;
$f$;
DROP TRIGGER IF EXISTS trg_eczanem_pm_token_utt_blok ON public.eczanem_eczane_gonderimleri;
CREATE TRIGGER trg_eczanem_pm_token_utt_blok AFTER INSERT ON public.eczanem_eczane_gonderimleri
 FOR EACH ROW EXECUTE FUNCTION public.eczanem_pm_token_utt_blokla();

-- Eski Eczanem tüketim tetikleyicisinin fonksiyonunu değiştirir; çift düşüm oluşmaz.
CREATE OR REPLACE FUNCTION public.cogniti_token_eczanem_musteri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE h public.eczanem_yayin_token_hesaplari%ROWTYPE; b public.eczanem_token_bloklari%ROWTYPE; v_firma uuid;
BEGIN
 SELECT * INTO h FROM public.eczanem_yayin_token_hesaplari WHERE yayin_id=NEW.yayin_id;
 IF NOT FOUND THEN
  IF NOT EXISTS(SELECT 1 FROM public.eczanem_token_eski_yayinlar WHERE yayin_id=NEW.yayin_id) THEN RAISE EXCEPTION 'ECZANEM_TOKEN:hesap_secilmedi' USING ERRCODE='P0001'; END IF;
  SELECT firma_id INTO v_firma FROM public.v_yayin_detay WHERE yayin_id=NEW.yayin_id;
  IF v_firma IS NULL THEN RAISE EXCEPTION 'COGNITI_TOKEN:yayin_firma_yok' USING ERRCODE='P0001'; END IF;
  BEGIN
   PERFORM public.cogniti_token_tuket(v_firma,'eclub_kisi',NEW.gonderen_kisi_id,'eczanem_musteri',NEW.musteri_id::text,'eczanem_musteri',NEW.yayin_id,'eczanem-gonderim:'||NEW.gonderim_id::text);
  EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM='Yetersiz token bakiyesi.' THEN RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
   ELSIF SQLERRM='Token hesabı bulunamadı.' THEN RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001'; ELSE RAISE; END IF;
  END;
  RETURN NEW;
 END IF;
 PERFORM 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=h.bakiye_id FOR UPDATE;
 SELECT * INTO b FROM public.eczanem_token_bloklari WHERE yayin_id=NEW.yayin_id AND eczane_id=NEW.eczane_id AND musteri_id=NEW.musteri_id FOR UPDATE;
 IF NOT FOUND OR b.durum<>'blokeli' OR b.bitis_at<=clock_timestamp() THEN
  RAISE EXCEPTION 'ECZANEM_TOKEN:blok_yok' USING ERRCODE='P0001'; END IF;
 UPDATE public.cogniti_esnek_paket_yuklemeleri SET kalan=kalan-1
 WHERE yukleme_id=b.yukleme_id AND firma_id=h.firma_id AND bakiye_id=h.bakiye_id AND kalan>0 AND son_kullanim_at>clock_timestamp();
 IF NOT FOUND THEN RAISE EXCEPTION 'ECZANEM_TOKEN:yetersiz' USING ERRCODE='P0001'; END IF;
 UPDATE public.eczanem_token_bloklari SET durum='tuketildi',gonderim_id=NEW.gonderim_id,tuketildi_at=clock_timestamp() WHERE blok_id=b.blok_id;
 RETURN NEW;
END;
$f$;
REVOKE ALL ON FUNCTION public.eczanem_pm_token_eczane_blokla(uuid,uuid),public.eczanem_pm_token_hesap_bagla(),public.eczanem_pm_token_utt_blokla(),public.cogniti_token_eczanem_musteri_kaydet() FROM PUBLIC,anon,authenticated,service_role;
-- Tetikleyici yoksa da kur; varsa aynı isimli mevcut tek tetikleyici korunur.
DROP TRIGGER IF EXISTS trg_cogniti_token_eczanem_musteri ON public.eczanem_gonderimler;
CREATE TRIGGER trg_cogniti_token_eczanem_musteri AFTER INSERT ON public.eczanem_gonderimler
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_eczanem_musteri_kaydet();

CREATE OR REPLACE FUNCTION public.eczanem_pm_token_hesabi(p_auth uuid,p_yayin uuid,p_tur text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE y record; k record; h record; sonuc jsonb;
BEGIN
 SELECT u.kullanici_id,u.firma_id,lower(btrim(u.rol)) rol INTO k FROM public.kullanicilar u JOIN public.firmalar f USING(firma_id)
 WHERE u.kullanici_id=p_auth AND u.aktif_mi=true AND f.aktif=true;
 IF k.rol IS NULL OR k.rol NOT IN ('pm','jr_pm','kd_pm') THEN RAISE EXCEPTION 'Erişim yetkiniz yok.' USING ERRCODE='42501'; END IF;
 SELECT * INTO y FROM public.yayin_yonetimi WHERE yayin_id=p_yayin FOR UPDATE;
 IF y.uretici_id IS DISTINCT FROM p_auth OR NOT(coalesce(y.hedef_roller,ARRAY[]::text[]) @> ARRAY['eczanem']::text[])
  OR NOT EXISTS(SELECT 1 FROM public.v_yayin_detay WHERE yayin_id=p_yayin AND firma_id=k.firma_id) THEN
  RAISE EXCEPTION 'Erişim yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.eczanem_token_eski_yayinlar WHERE yayin_id=p_yayin) THEN
  IF p_tur IS NOT NULL THEN RAISE EXCEPTION 'ECZANEM_TOKEN:eski_yayin' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object('eski_yayin',true,'hesap_turu',NULL,'blokeli',0,'tuketilen',0,'serbest',0);
 END IF;
 IF p_tur IS NOT NULL THEN
  IF p_tur NOT IN ('kisisel','firma_ortak') THEN RAISE EXCEPTION 'Geçersiz hesap.' USING ERRCODE='22023'; END IF;
  UPDATE public.yayin_yonetimi SET eczanem_token_hesap_turu=p_tur WHERE yayin_id=p_yayin;
 END IF;
 SELECT b.bakiye_turu INTO h FROM public.eczanem_yayin_token_hesaplari yh JOIN public.cogniti_satin_alma_bakiyeleri b USING(firma_id,bakiye_id)
 WHERE yh.yayin_id=p_yayin AND yh.pm_id=p_auth AND yh.firma_id=k.firma_id;
 SELECT jsonb_build_object('eski_yayin',false,'hesap_turu',h.bakiye_turu,
  'blokeli',count(*) FILTER(WHERE durum='blokeli' AND bitis_at>statement_timestamp()),
  'tuketilen',count(*) FILTER(WHERE durum='tuketildi'),
  'serbest',count(*) FILTER(WHERE durum='blokeli' AND bitis_at<=statement_timestamp())) INTO sonuc
 FROM public.eczanem_token_bloklari WHERE yayin_id=p_yayin;
 RETURN sonuc;
END;
$f$;
REVOKE ALL ON FUNCTION public.eczanem_pm_token_hesabi(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.eczanem_pm_token_hesabi(uuid,uuid,text) TO service_role;

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
  LEFT JOIN LATERAL(SELECT count(*) AS adet FROM public.eczanem_token_bloklari bl WHERE bl.yukleme_id=y.yukleme_id AND bl.durum='blokeli' AND bl.bitis_at>statement_timestamp()) bl ON true
  WHERE b.firma_id=v_firma AND (b.bakiye_turu='firma_ortak' OR (b.bakiye_turu='kisisel' AND b.sahip_id=p_auth_id))
  GROUP BY b.bakiye_id,b.bakiye_turu
 ) SELECT (SELECT deger FROM ozet WHERE bakiye_turu='kisisel'),(SELECT deger FROM ozet WHERE bakiye_turu='firma_ortak')
 INTO v_kisisel,v_ortak;
 RETURN jsonb_build_object('kisisel',v_kisisel,'firma_ortak',coalesce(v_ortak,jsonb_build_object('paket',NULL,'toplam',0,'kullanilan',0,'kalan',0,'suresi_dolan',0,'ayrilan',0)));
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid) TO service_role;

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
  OR (p_plan_tarihi IS NOT NULL AND (NOT isfinite(p_plan_tarihi) OR p_plan_tarihi<=v_tarih)) THEN
  RAISE EXCEPTION 'Önizleme seçimi geçersiz.' USING ERRCODE='22023';
 END IF;
 v_ozet:=public.cogniti_satin_alma_bakiye_ozeti(p_auth_id);
 SELECT firma_id,lower(btrim(rol)) INTO v_firma,v_rol FROM public.kullanicilar WHERE kullanici_id=p_auth_id;
 v_tur:=CASE WHEN p_bakiye_turu='kisisel' THEN v_ozet->'kisisel' ELSE v_ozet->'firma_ortak' END;
 IF v_tur IS NULL OR v_tur='null'::jsonb THEN
  RAISE EXCEPTION 'Bu bakiye size ait değil veya tanımlı değil.' USING ERRCODE='42501';
 END IF;
 v_hedef:=CASE WHEN p_plan_tarihi IS NULL THEN statement_timestamp() ELSE p_plan_tarihi::timestamp AT TIME ZONE 'Europe/Istanbul' END;
 -- Yalnız kullanıcıya ait kişisel hesap veya kendi firmasının ortak hesabı.
 SELECT coalesce(sum(y.kalan-coalesce(hold.adet,0)),0) INTO v_mevcut
 FROM public.cogniti_satin_alma_bakiyeleri b JOIN public.cogniti_esnek_paket_yuklemeleri y USING(firma_id,bakiye_id)
 LEFT JOIN LATERAL(SELECT count(*) AS adet FROM public.eczanem_token_bloklari hold WHERE hold.yukleme_id=y.yukleme_id AND hold.durum='blokeli' AND hold.bitis_at>clock_timestamp()) hold ON true
 WHERE b.firma_id=v_firma AND b.bakiye_turu=p_bakiye_turu
  AND (b.bakiye_turu='firma_ortak' OR b.sahip_id=p_auth_id) AND y.son_kullanim_at>v_hedef;
 IF p_akis='eclub_oneri' THEN
  IF v_rol NOT IN ('utt','kd_utt') OR coalesce(cardinality(p_alici_idler),0)=0
   OR cardinality(p_kaynak_idler)*cardinality(p_alici_idler)>300 THEN
   RAISE EXCEPTION 'E-Club gönderim seçimine erişiminiz bulunmuyor.' USING ERRCODE='42501';
  END IF;
  -- Mevcut gerçek toplu kota/tekrar/inceleme/tarih kontrolü. Önizleme bayrağı sabit true.
  v_kontrol:=public.eclub_yayin_toplu_islem(p_auth_id,p_alici_idler,p_kaynak_idler,CASE WHEN p_plan_tarihi IS NULL THEN NULL ELSE v_hedef END,NULL,true);
  SELECT count(*) FILTER(WHERE x->>'uygun'='true'),count(*) FILTER(WHERE x->>'uygun' IS DISTINCT FROM 'true')
   INTO v_uygun,v_atlanan FROM jsonb_array_elements(v_kontrol->'sonuclar') x;
  IF v_uygun+v_atlanan <> (SELECT count(DISTINCT x) FROM unnest(p_kaynak_idler) x)*(SELECT count(DISTINCT x) FROM unnest(p_alici_idler) x) THEN
   RAISE EXCEPTION 'Gönderim uygunluk sonucu eksik.' USING ERRCODE='22023';
  END IF;
  v_gereken:=v_uygun;
  v_not:='Yalnız mevcut gönderim kurallarına uygun yayın–alıcı eşleşmeleri hesaplandı.';
 ELSE
  IF v_rol NOT IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per')
   OR coalesce(cardinality(p_alici_idler),0)<>0 THEN
   RAISE EXCEPTION 'Yayın açılış seçimine erişiminiz bulunmuyor.' USING ERRCODE='42501';
  END IF;
  FOR v_aday IN
   SELECT DISTINCT s.soru_seti_durum_id,t.talep_id,t.firma_id,t.uretici_id,t.takim_id,t.hedef_roller,t.taslak_mi,t.yayin_oncesi_silme_durumu,s.durum
   FROM public.soru_seti_durumu s JOIN public.soru_setleri ss ON ss.soru_seti_id=s.soru_seti_id
   JOIN public.talepler t ON t.talep_id=ss.talep_id WHERE s.soru_seti_durum_id=ANY(p_kaynak_idler)
  LOOP
   IF v_aday.uretici_id<>p_auth_id OR v_aday.firma_id<>v_firma THEN RAISE EXCEPTION 'Başka üreticinin veya firmanın içeriği kullanılamaz.' USING ERRCODE='42501'; END IF;
   IF v_aday.durum<>'onaylandi' OR v_aday.taslak_mi OR v_aday.yayin_oncesi_silme_durumu IS NOT NULL
    OR EXISTS(SELECT 1 FROM public.yayin_yonetimi y WHERE y.soru_seti_durum_id=v_aday.soru_seti_durum_id) THEN
    v_atlanan:=v_atlanan+1; CONTINUE;
   END IF;
   v_uygun:=v_uygun+1; v_hedefler:=coalesce(v_aday.hedef_roller,ARRAY['utt']);
   -- İlk yayın açılışındaki mevcut token tetikleyicisiyle aynı alıcı kapsamı.
   SELECT v_gereken+count(DISTINCT u.kullanici_id) INTO v_gereken FROM public.kullanicilar u LEFT JOIN public.bolgeler b ON b.bolge_id=u.bolge_id
   WHERE u.firma_id=v_firma AND u.aktif_mi=true AND (
    ('bm'=ANY(v_hedefler) AND u.rol='bm') OR ('utt'=ANY(v_hedefler) AND u.rol IN ('utt','kd_utt')
     AND (v_aday.takim_id IS NULL OR coalesce(u.takim_id,b.takim_id)=v_aday.takim_id)));
  END LOOP;
  IF v_uygun+v_atlanan<>(SELECT count(DISTINCT x) FROM unnest(p_kaynak_idler) x) THEN
   RAISE EXCEPTION 'Yayın adayı bulunamadı.' USING ERRCODE='22023';
  END IF;
  v_not:='Bu hesap ilk yayın açılışına aittir. E-Club/Eczanem sonraki dağıtımları burada ücretlendirilmez. Yayın koşulları gönderim sırasında tekrar doğrulanır.';
 END IF;
 RETURN jsonb_build_object('akis',p_akis,'bakiye_turu',p_bakiye_turu,'planli',p_plan_tarihi IS NOT NULL,
  'uygun_kayit',v_uygun,'atlanan_kayit',v_atlanan,'gereken_token',v_gereken,'kullanilabilir_token',v_mevcut,
  'islem_sonrasi',greatest(0,v_mevcut-v_gereken),'eksik_token',greatest(0,v_gereken-v_mevcut),
  'yeterli',v_mevcut>=v_gereken,'gercek_gonderim_acik',false,'aciklama',v_not);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date) TO service_role;

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
 -- Bütün yayınları, ardından eski firma hesabı ve yeni token hesaplarını sabit sırada kilitle.
 -- Karma eski/yeni veya kişisel/firma hesabı içeren toplu gönderimler ters sırada kilitlenmez.
 PERFORM 1 FROM public.yayin_yonetimi yy WHERE yy.yayin_id=ANY(p_yayin_idler) ORDER BY yy.yayin_id FOR UPDATE;
 PERFORM 1 FROM public.cogniti_token_hesaplari h WHERE h.firma_id IN (
  SELECT v.firma_id FROM public.v_yayin_detay v JOIN public.eczanem_token_eski_yayinlar e USING(yayin_id) WHERE v.yayin_id=ANY(p_yayin_idler)
 ) ORDER BY h.firma_id FOR UPDATE;
 PERFORM 1 FROM public.cogniti_satin_alma_bakiyeleri b WHERE b.bakiye_id IN (
  SELECT bakiye_id FROM public.eczanem_yayin_token_hesaplari WHERE yayin_id=ANY(p_yayin_idler)
 ) ORDER BY b.bakiye_id FOR UPDATE;
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

NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eczanem_pm_token_bloklama_kuruldu;
