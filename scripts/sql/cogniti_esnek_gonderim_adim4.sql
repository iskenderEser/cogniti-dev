-- KULLANICI ÇALIŞTIRACAK. Adım 4: anlık yayın açılışı ve E-Club gönderimi.
-- Ön koşul: Esnek Adım 1–3, Eczanem PM bloklama ve mevcut yayın/E-Club tüketim SQLleri.
-- Eski yayınlar/planlar ve seçim taşımayan eski görevler mevcut tüketim yolunu korur.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-esnek-gonderim-adim4',0));
DO $f$ BEGIN
 IF to_regclass('public.eczanem_token_bloklari') IS NULL
 OR to_regprocedure('public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamptz,uuid,boolean)') IS NULL
 OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.yayin_yonetimi'::regclass AND tgname='trg_cogniti_token_yayin_acilis' AND tgenabled='O' AND NOT tgisinternal)
 OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.eclub_oneri_kayitlari'::regclass AND tgname='trg_cogniti_token_eclub_oneri' AND tgenabled='O' AND NOT tgisinternal) THEN
 RAISE EXCEPTION 'Önce mevcut yayın, E-Club ve PM Eczanem token kurulumları tamamlanmalıdır.'; END IF;
END;$f$;
ALTER TABLE public.yayin_yonetimi ADD COLUMN IF NOT EXISTS token_hesap_turu text CHECK(token_hesap_turu IN ('kisisel','firma_ortak'));
CREATE TABLE IF NOT EXISTS public.cogniti_esnek_gonderim_tuketimleri (
 tuketim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 firma_id uuid NOT NULL,bakiye_id uuid NOT NULL,yukleme_id uuid NOT NULL REFERENCES public.cogniti_esnek_paket_yuklemeleri(yukleme_id),
 gonderen_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 akis text NOT NULL CHECK(akis IN ('yayin_acilis','eclub_oneri')),
 kaynak_id uuid NOT NULL,alici_id uuid NOT NULL,islem_kimligi text NOT NULL UNIQUE,
 miktar integer NOT NULL DEFAULT 1 CHECK(miktar=1),created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 FOREIGN KEY(firma_id,bakiye_id) REFERENCES public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_id)
);
CREATE TABLE IF NOT EXISTS public.cogniti_esnek_gonderim_istekleri (
 gonderen_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),anahtar uuid NOT NULL,
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 hesap_turu text NOT NULL CHECK(hesap_turu IN ('kisisel','firma_ortak')),
 yayin_idler uuid[] NOT NULL,kisi_idler uuid[] NOT NULL,sonuc jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),PRIMARY KEY(gonderen_id,anahtar)
);
ALTER TABLE public.cogniti_esnek_gonderim_tuketimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_esnek_gonderim_istekleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_esnek_gonderim_tuketimleri,public.cogniti_esnek_gonderim_istekleri FROM PUBLIC,anon,authenticated,service_role;

-- Yalnız doğrulanmış gerçek gönderim tetikleyicileri çağırır. Dışarıya açık değildir.
CREATE OR REPLACE FUNCTION public.cogniti_esnek_gonderim_tuket(
 p_auth uuid,p_tur text,p_akis text,p_kaynak uuid,p_alici uuid,p_kimlik text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record;b uuid;y uuid;onceki record;
BEGIN
 IF p_tur IS NULL OR p_tur NOT IN ('kisisel','firma_ortak') OR p_kaynak IS NULL OR p_alici IS NULL OR nullif(p_kimlik,'') IS NULL THEN
  RAISE EXCEPTION 'ESNEK_GONDERIM:secim_gecersiz' USING ERRCODE='22023'; END IF;
 SELECT u.firma_id,lower(btrim(u.rol)) rol INTO k FROM public.kullanicilar u JOIN public.firmalar f USING(firma_id)
 WHERE u.kullanici_id=p_auth AND u.aktif_mi AND f.aktif FOR SHARE OF u,f;
 IF NOT FOUND OR (p_akis='yayin_acilis' AND k.rol NOT IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'))
  OR (p_akis='eclub_oneri' AND k.rol NOT IN ('utt','kd_utt')) OR p_akis IS NULL OR p_akis NOT IN ('yayin_acilis','eclub_oneri') THEN
  RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
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
 AND l.kalan>(SELECT count(*) FROM public.eczanem_token_bloklari z WHERE z.yukleme_id=l.yukleme_id AND z.durum='blokeli' AND z.bitis_at>clock_timestamp())
 ORDER BY l.son_kullanim_at,l.created_at,l.yukleme_id LIMIT 1 FOR UPDATE OF l;
 IF y IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetersiz' USING ERRCODE='P0001'; END IF;
 UPDATE public.cogniti_esnek_paket_yuklemeleri SET kalan=kalan-1 WHERE yukleme_id=y;
 INSERT INTO public.cogniti_esnek_gonderim_tuketimleri(firma_id,bakiye_id,yukleme_id,gonderen_id,akis,kaynak_id,alici_id,islem_kimligi)
 VALUES(k.firma_id,b,y,p_auth,p_akis,p_kaynak,p_alici,p_kimlik);
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_gonderim_tuket(uuid,text,text,uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_esnek_yayin_hesap_kontrol()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.token_hesap_turu IS DISTINCT FROM OLD.token_hesap_turu THEN RAISE EXCEPTION 'Yayının token hesabı değiştirilemez.' USING ERRCODE='22023'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.token_hesap_turu IS NOT NULL AND (NEW.durum<>'yayinda' OR NOT (coalesce(NEW.hedef_roller,ARRAY['utt']) && ARRAY['utt','bm']) OR 'eczanem'=ANY(NEW.hedef_roller)) THEN
  RAISE EXCEPTION 'Bu aşamada yalnız anlık saha yayını hesap seçebilir.' USING ERRCODE='22023'; END IF;
 IF NEW.durum='yayinda' AND coalesce(NEW.hedef_roller,ARRAY['utt']) && ARRAY['utt','bm'] AND NOT ('eczanem'=ANY(coalesce(NEW.hedef_roller,'{}'))) AND NEW.token_hesap_turu IS NULL THEN
  RAISE EXCEPTION 'ESNEK_GONDERIM:hesap_secin' USING ERRCODE='P0001'; END IF;
 -- Aynı aday eş zamanlı yayımlanırsa ikinci yayın/token kaydı oluşmaz.
 IF NEW.token_hesap_turu IS NOT NULL THEN
  PERFORM 1 FROM public.soru_seti_durumu WHERE soru_seti_durum_id=NEW.soru_seti_durum_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.yayin_yonetimi WHERE soru_seti_durum_id=NEW.soru_seti_durum_id) THEN
   RAISE EXCEPTION 'Bu içerik zaten yayımlandı.' USING ERRCODE='22023'; END IF;
 END IF;
 RETURN NEW;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_yayin_hesap_kontrol() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_esnek_yayin_hesap_kontrol ON public.yayin_yonetimi;
CREATE TRIGGER trg_esnek_yayin_hesap_kontrol BEFORE INSERT OR UPDATE OF token_hesap_turu ON public.yayin_yonetimi FOR EACH ROW EXECUTE FUNCTION public.cogniti_esnek_yayin_hesap_kontrol();
CREATE OR REPLACE FUNCTION public.cogniti_token_yayin_acilis_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid; v_takim uuid; v_gonderen_firma uuid; v_alici uuid;
BEGIN
 IF NEW.durum IS DISTINCT FROM 'yayinda' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  -- Devam etme, puan/tarih düzenleme ve teknik tekrar yeni bir gönderim değildir.
  IF OLD.durum IS DISTINCT FROM 'planlandi' THEN RETURN NEW; END IF;
 END IF;
 IF NOT (coalesce(NEW.hedef_roller,ARRAY['utt']) && ARRAY['utt','bm']) THEN RETURN NEW; END IF;
 SELECT firma_id,takim_id INTO v_firma,v_takim FROM public.v_yayin_detay WHERE yayin_id=NEW.yayin_id;
 SELECT firma_id INTO v_gonderen_firma FROM public.kullanicilar WHERE kullanici_id=NEW.uretici_id;
 IF v_firma IS NULL OR v_gonderen_firma IS DISTINCT FROM v_firma THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:yayin_firma_yok' USING ERRCODE='P0001';
 END IF;
 IF NEW.token_hesap_turu IS NOT NULL THEN
  PERFORM 1 FROM public.kullanicilar WHERE kullanici_id=NEW.uretici_id AND aktif_mi=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
  FOR v_alici IN
   SELECT k.kullanici_id FROM public.kullanicilar k LEFT JOIN public.bolgeler b ON b.bolge_id=k.bolge_id
   WHERE k.firma_id=v_gonderen_firma AND k.aktif_mi=true AND (
    ('bm'=ANY(coalesce(NEW.hedef_roller,ARRAY['utt'])) AND k.rol='bm') OR
    ('utt'=ANY(coalesce(NEW.hedef_roller,ARRAY['utt'])) AND k.rol IN ('utt','kd_utt') AND (v_takim IS NULL OR coalesce(k.takim_id,b.takim_id)=v_takim)))
   ORDER BY k.kullanici_id
  LOOP
   PERFORM public.cogniti_esnek_gonderim_tuket(NEW.uretici_id,NEW.token_hesap_turu,'yayin_acilis',NEW.yayin_id,v_alici,'yayin-acilis:'||NEW.yayin_id::text||':'||v_alici::text);
  END LOOP;
  RETURN NEW;
 END IF;
 -- Hesabı kilitle: toplu tüketimde hesap değişimi veya eş zamanlı yükleme araya giremez.
 PERFORM 1 FROM public.cogniti_token_hesaplari WHERE firma_id=v_gonderen_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001'; END IF;
 FOR v_alici IN
  SELECT k.kullanici_id FROM public.kullanicilar k
  LEFT JOIN public.bolgeler b ON b.bolge_id=k.bolge_id
  WHERE k.firma_id=v_gonderen_firma AND k.aktif_mi=true AND (
   ('bm'=ANY(coalesce(NEW.hedef_roller,ARRAY['utt'])) AND k.rol='bm') OR
   ('utt'=ANY(coalesce(NEW.hedef_roller,ARRAY['utt'])) AND k.rol IN ('utt','kd_utt')
    AND (v_takim IS NULL OR coalesce(k.takim_id,b.takim_id)=v_takim)))
  ORDER BY k.kullanici_id
 LOOP
  BEGIN
   PERFORM public.cogniti_token_tuket(v_gonderen_firma,'firma_kullanicisi',NEW.uretici_id,
    'firma_kullanicisi',v_alici::text,'yayin',NEW.yayin_id,
    'yayin-acilis:'||NEW.yayin_id::text||':'||v_alici::text);
  EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM='Yetersiz token bakiyesi.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
   ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001';
   ELSE RAISE;
   END IF;
  END;
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_yayin_acilis_kaydet() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.cogniti_token_eclub_oneri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id=NEW.oneren_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'ECLUB_GONDERIM:token_gonderici_firma_yok' USING ERRCODE='P0001';
 END IF;
 IF nullif(current_setting('cogniti.esnek_gonderen',true),'') IS NOT NULL THEN
  IF current_setting('cogniti.esnek_gonderen',true)<>NEW.oneren_id::text THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
  PERFORM public.cogniti_esnek_gonderim_tuket(NEW.oneren_id,current_setting('cogniti.esnek_hesap',true),'eclub_oneri',NEW.yayin_id,NEW.kisi_id,'eclub-oneri:'||NEW.oneri_id::text);
  RETURN NEW;
 END IF;
 -- Hesap bulunmaması muafiyet değildir. Tüketim başarısızsa öneri INSERT'i de geri alınır.
 BEGIN
  PERFORM public.cogniti_token_tuket(v_firma,'firma_kullanicisi',NEW.oneren_id,
   'eclub_kisi',NEW.kisi_id::text,'eclub_oneri',NEW.yayin_id,'eclub-oneri:'||NEW.oneri_id::text);
 EXCEPTION WHEN SQLSTATE '22023' THEN
  IF SQLERRM='Yetersiz token bakiyesi.' THEN
   RAISE EXCEPTION 'ECLUB_GONDERIM:token_bakiyesi_yetersiz' USING ERRCODE='P0001';
  ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
   RAISE EXCEPTION 'ECLUB_GONDERIM:token_hesabi_yok' USING ERRCODE='P0001';
  ELSE RAISE;
  END IF;
 END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_eclub_oneri_kaydet() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.cogniti_esnek_eclub_gonder(p_auth uuid,p_hesap text,p_kisiler uuid[],p_yayinlar uuid[],p_anahtar uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE sonuc jsonb;onceki record;k uuid;firma uuid;eski_auth text;eski_hesap text;
BEGIN
 IF p_anahtar IS NULL OR p_hesap IS NULL OR p_hesap NOT IN ('kisisel','firma_ortak')
 OR coalesce(cardinality(p_kisiler),0) NOT BETWEEN 1 AND 100 OR coalesce(cardinality(p_yayinlar),0) NOT BETWEEN 1 AND 20
 OR cardinality(p_kisiler)*cardinality(p_yayinlar)>300 OR array_position(p_kisiler,NULL) IS NOT NULL OR array_position(p_yayinlar,NULL) IS NOT NULL THEN RAISE EXCEPTION 'Hesap/işlem seçimi zorunludur.' USING ERRCODE='22023'; END IF;
 -- Okuma RPC'si aktif firma/rol erişimini tekrar doğrular. Kişisel hesap yalnız sahibinindir.
 PERFORM public.cogniti_satin_alma_bakiye_ozeti(p_auth);
 SELECT firma_id INTO firma FROM public.kullanicilar WHERE kullanici_id=p_auth AND lower(btrim(rol)) IN ('utt','kd_utt');
 IF firma IS NULL THEN RAISE EXCEPTION 'Yetkisiz gönderim.' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('esnek-eclub:'||p_auth::text||':'||p_anahtar::text,0));
 SELECT * INTO onceki FROM public.cogniti_esnek_gonderim_istekleri WHERE gonderen_id=p_auth AND anahtar=p_anahtar;
 IF FOUND THEN
  IF onceki.firma_id<>firma THEN RAISE EXCEPTION 'Firma kapsamı değişmiş.' USING ERRCODE='42501'; END IF;
  IF onceki.hesap_turu<>p_hesap OR onceki.yayin_idler IS DISTINCT FROM p_yayinlar OR onceki.kisi_idler IS DISTINCT FROM p_kisiler THEN
   RAISE EXCEPTION 'İşlem anahtarı farklı seçimde kullanılmış.' USING ERRCODE='22023'; END IF;
  RETURN onceki.sonuc || jsonb_build_object('yeniden_deneme',true);
 END IF;
 -- Kanonik kota kilitleri önce alınır; farklı hesaplar aynı üyeye gönderirken ters kilit sırası oluşmaz.
 FOR k IN SELECT DISTINCT unnest(p_kisiler) ORDER BY 1 LOOP PERFORM public.eclub_gonderim_kapsamini_kilitle(p_auth,k); END LOOP;
 eski_auth:=current_setting('cogniti.esnek_gonderen',true);eski_hesap:=current_setting('cogniti.esnek_hesap',true);
 PERFORM set_config('cogniti.esnek_gonderen',p_auth::text,true);PERFORM set_config('cogniti.esnek_hesap',p_hesap,true);
 sonuc:=public.eclub_yayin_toplu_islem(p_auth,p_kisiler,p_yayinlar,NULL,NULL,false);
 PERFORM set_config('cogniti.esnek_gonderen',coalesce(eski_auth,''),true);PERFORM set_config('cogniti.esnek_hesap',coalesce(eski_hesap,''),true);
 INSERT INTO public.cogniti_esnek_gonderim_istekleri(gonderen_id,anahtar,firma_id,hesap_turu,yayin_idler,kisi_idler,sonuc)
 VALUES(p_auth,p_anahtar,firma,p_hesap,p_yayinlar,p_kisiler,sonuc);
 RETURN sonuc;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_eclub_gonder(uuid,text,uuid[],uuid[],uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_esnek_eclub_gonder(uuid,text,uuid[],uuid[],uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.cogniti_token_yayin_gonderim_alicilari(p_yayin_id uuid)
RETURNS TABLE(kullanici_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT t.alici_kimligi::uuid FROM public.cogniti_token_tuketimleri t
 WHERE t.islem_turu='yayin' AND t.kaynak_id=p_yayin_id AND t.alici_turu='firma_kullanicisi'
 UNION
 SELECT t.alici_id FROM public.cogniti_esnek_gonderim_tuketimleri t WHERE t.akis='yayin_acilis' AND t.kaynak_id=p_yayin_id;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_token_yayin_gonderim_alicilari(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_token_yayin_gonderim_alicilari(uuid) TO service_role;
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
  'yeterli',v_mevcut>=v_gereken,'gercek_gonderim_acik',p_plan_tarihi IS NULL,'aciklama',v_not);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_esnek_gonderim_adim4_kuruldu;
