-- Adım 3/hesaplama bağlantısı: E-Club dönüşümünün tek kaynağı admin firma tanımıdır.
-- Önkoşul: eclub_firma_cek_tanimlari.sql. Mevcut talepler yeniden hesaplanmaz.
BEGIN;
ALTER TABLE public.eclub_store_cek_talepleri
 ADD COLUMN IF NOT EXISTS donusum_puan integer,
 ADD COLUMN IF NOT EXISTS donusum_tl numeric(12,2),
 ADD COLUMN IF NOT EXISTS donusum_surum integer;

-- Yayınlarda oran yalnız eski okuyucular için firma tanımının kopyasıdır.
-- PM'den gelen oran hiçbir zaman karar kaynağı değildir.
CREATE OR REPLACE FUNCTION public.tg_eclub_merkezi_yayin_orani()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE v_firma uuid; v_oran public.eclub_firma_cek_tanimlari%ROWTYPE;
BEGIN
 IF cardinality(NEW.hedef_roller)>0 AND NEW.hedef_roller <@ ARRAY['eczaci','eczane_teknisyeni']::text[] THEN
  IF NEW.cek_karsiligi_var_mi IS NOT TRUE THEN
   NEW.karsilik_puan:=NULL; NEW.karsilik_tl:=NULL; RETURN NEW;
  END IF;
  SELECT t.firma_id INTO v_firma FROM public.soru_seti_durumu sd
   JOIN public.soru_setleri ss ON ss.soru_seti_id=sd.soru_seti_id
   JOIN public.talepler t ON t.talep_id=ss.talep_id
   WHERE sd.soru_seti_durum_id=NEW.soru_seti_durum_id;
  SELECT * INTO v_oran FROM public.eclub_firma_cek_tanimlari WHERE firma_id=v_firma FOR SHARE;
  IF TG_OP='INSERT' AND v_oran.firma_id IS NULL THEN
   RAISE EXCEPTION 'Bu firma için admin tarafından puan–TL karşılığı tanımlanmalıdır.' USING ERRCODE='22023';
  END IF;
  NEW.karsilik_puan:=v_oran.karsilik_puan; NEW.karsilik_tl:=v_oran.karsilik_tl;
 END IF;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.tg_eclub_merkezi_yayin_orani() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS aaa_eclub_merkezi_yayin_orani ON public.yayin_yonetimi;
CREATE TRIGGER aaa_eclub_merkezi_yayin_orani BEFORE INSERT OR UPDATE OF karsilik_puan,karsilik_tl,hedef_roller,cek_karsiligi_var_mi
 ON public.yayin_yonetimi FOR EACH ROW EXECUTE FUNCTION public.tg_eclub_merkezi_yayin_orani();

CREATE OR REPLACE FUNCTION public.tg_eclub_firma_oranini_yayinlara_yansit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
BEGIN
 UPDATE public.yayin_yonetimi y SET karsilik_puan=NEW.karsilik_puan,karsilik_tl=NEW.karsilik_tl
 WHERE cardinality(y.hedef_roller)>0 AND y.hedef_roller <@ ARRAY['eczaci','eczane_teknisyeni']::text[]
 AND y.cek_karsiligi_var_mi=true
 AND EXISTS(SELECT 1 FROM public.v_yayin_kunye k WHERE k.yayin_id=y.yayin_id AND k.firma_id=NEW.firma_id);
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.tg_eclub_firma_oranini_yayinlara_yansit() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS eclub_firma_oranini_yayinlara_yansit ON public.eclub_firma_cek_tanimlari;
CREATE TRIGGER eclub_firma_oranini_yayinlara_yansit AFTER INSERT OR UPDATE OF karsilik_puan,karsilik_tl
 ON public.eclub_firma_cek_tanimlari FOR EACH ROW EXECUTE FUNCTION public.tg_eclub_firma_oranini_yayinlara_yansit();

-- Tekrar çalıştırma güvenlidir; mevcut fonksiyonların diğer kuralları korunur.
DO $bagla$
DECLARE s text; eski text; yeni text;
BEGIN
 SELECT pg_get_functiondef('public.get_eclub_eczane_store_ozet(uuid)'::regprocedure) INTO s;
 IF strpos(s,'merkezi_oran.karsilik_puan')=0 THEN
  IF strpos(s,'LEFT JOIN public.firmalar f ON f.firma_id = k.firma_id')=0 OR strpos(s,'y.karsilik_tl')=0 THEN
   RAISE EXCEPTION 'Eczane özet fonksiyonunun beklenen sürümü bulunamadı; hiçbir değişiklik uygulanmadı.';
  END IF;
  s:=replace(s,'y.karsilik_puan','merkezi_oran.karsilik_puan');
  s:=replace(s,'y.karsilik_tl','merkezi_oran.karsilik_tl');
  s:=replace(s,'LEFT JOIN public.firmalar f ON f.firma_id = k.firma_id',
    'LEFT JOIN public.firmalar f ON f.firma_id = k.firma_id LEFT JOIN public.eclub_firma_cek_tanimlari merkezi_oran ON merkezi_oran.firma_id=k.firma_id');
  EXECUTE s;
 END IF;
 SELECT pg_get_functiondef('public.eclub_store_cek_talebi_olustur(uuid,uuid,boolean)'::regprocedure) INTO s;
 IF strpos(s,'v_merkezi_oran')=0 THEN
  eski:='  v_y public.yayin_yonetimi%ROWTYPE;';
  IF strpos(s,eski)=0 THEN RAISE EXCEPTION 'Talep fonksiyonunun beklenen değişkeni bulunamadı.'; END IF;
  s:=replace(s,eski,eski||E'\n  v_merkezi_oran public.eclub_firma_cek_tanimlari%ROWTYPE;');

  -- Admin tanım güncellemesi de aynı kilidi alır: oran -> yayın sırası korunur.
  eski:=E'  SELECT *\n  INTO v_y';
  IF strpos(s,eski)=0 THEN RAISE EXCEPTION 'Talep yayın kilidi beklenen sürümde değil.'; END IF;
  yeni:=$kilit$
  SELECT k.firma_id INTO v_firma FROM public.v_yayin_kunye k WHERE k.yayin_id=p_yayin_id;
  PERFORM pg_advisory_xact_lock_shared(hashtextextended('eclub-firma-cek-tanimi/'||v_firma::text,0));
  SELECT *
  INTO v_y$kilit$;
  s:=replace(s,eski,yeni);

  eski:='  SELECT ue.utt_id';
  yeni:=$parca$
  SELECT * INTO v_merkezi_oran FROM public.eclub_firma_cek_tanimlari WHERE firma_id=v_firma FOR SHARE;
  IF v_merkezi_oran.firma_id IS NULL THEN
    RETURN QUERY SELECT false,NULL::uuid,'Bu firma için admin tarafından puan–TL karşılığı tanımlanmalıdır.',0::numeric,0;
    RETURN;
  END IF;
  SELECT ue.utt_id$parca$;
  IF strpos(s,eski)=0 OR strpos(s,'    donem_kodu'||E'\n  )')=0 OR strpos(s,'    v_devir,'||E'\n    v_d.donem_kodu'||E'\n  )')=0 THEN
   RAISE EXCEPTION 'Talep fonksiyonunun beklenen kayıt yapısı bulunamadı.';
  END IF;
  s:=replace(s,eski,yeni);
  s:=replace(s,'v_y.karsilik_puan','v_merkezi_oran.karsilik_puan');
  s:=replace(s,'v_y.karsilik_tl','v_merkezi_oran.karsilik_tl');
  s:=replace(s,'    donem_kodu'||E'\n  )','    donem_kodu, donusum_puan, donusum_tl, donusum_surum'||E'\n  )');
  s:=replace(s,'    v_devir,'||E'\n    v_d.donem_kodu'||E'\n  )','    v_devir,'||E'\n    v_d.donem_kodu, v_merkezi_oran.karsilik_puan, v_merkezi_oran.karsilik_tl, v_merkezi_oran.surum'||E'\n  )');
  EXECUTE s;
 END IF;
END;
$bagla$;
-- Eski test yayınlarının görüntü/Excel oranı da merkezi tanıma döner.
-- Tanımı olmayan firmanın kopyası NULL olur; sessiz 1:1 varsayımı yoktur.
UPDATE public.yayin_yonetimi SET karsilik_puan=NULL,karsilik_tl=NULL
 WHERE cardinality(hedef_roller)>0 AND hedef_roller <@ ARRAY['eczaci','eczane_teknisyeni']::text[];
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eclub_merkezi_donusum_baglantisi_hazir;
