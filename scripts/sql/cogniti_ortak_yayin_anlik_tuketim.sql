-- KULLANICI ÇALIŞTIRACAK. Üreticinin UTT/BM ve E-Club yayın açılışında ortak anlık tüketim.
-- Eczanem bloklama/süre akışı değişmez. Geçmiş yayınlar geriye dönük ücretlendirilmez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-ortak-yayin-anlik-tuketim',0));
LOCK TABLE public.yayin_yonetimi IN SHARE ROW EXCLUSIVE MODE;
CREATE TABLE IF NOT EXISTS public.cogniti_yayin_anlik_gecis(tekil boolean PRIMARY KEY CHECK(tekil),kuruldu_at timestamptz NOT NULL DEFAULT statement_timestamp());
CREATE TABLE IF NOT EXISTS public.cogniti_yayin_anlik_eski_yayinlar(yayin_id uuid PRIMARY KEY REFERENCES public.yayin_yonetimi(yayin_id));
DO $f$ DECLARE n integer; BEGIN
 INSERT INTO public.cogniti_yayin_anlik_gecis(tekil) VALUES(true) ON CONFLICT DO NOTHING;GET DIAGNOSTICS n=ROW_COUNT;
 IF n=1 THEN INSERT INTO public.cogniti_yayin_anlik_eski_yayinlar SELECT yayin_id FROM public.yayin_yonetimi ON CONFLICT DO NOTHING; END IF;
END;$f$;
ALTER TABLE public.cogniti_esnek_gonderim_tuketimleri ADD COLUMN IF NOT EXISTS alici_turu text NOT NULL DEFAULT 'firma_kullanicisi' CHECK(alici_turu IN ('firma_kullanicisi','eclub_kisi'));
CREATE TABLE IF NOT EXISTS public.cogniti_yayin_acilis_token_kayitlari(
 yayin_id uuid PRIMARY KEY REFERENCES public.yayin_yonetimi(yayin_id),
 firma_id uuid NOT NULL,gonderen_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),bakiye_id uuid NOT NULL,
 hedef_roller text[] NOT NULL,alici_sayisi integer NOT NULL CHECK(alici_sayisi>=0),created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 FOREIGN KEY(firma_id,bakiye_id) REFERENCES public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_id)
);
ALTER TABLE public.cogniti_yayin_anlik_gecis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_yayin_anlik_eski_yayinlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_yayin_acilis_token_kayitlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_yayin_anlik_gecis,public.cogniti_yayin_anlik_eski_yayinlar,public.cogniti_yayin_acilis_token_kayitlari FROM PUBLIC,anon,authenticated,service_role;

-- Tek alıcı kaynağı: hem önizleme hem gerçek açılış aynı hedef/firma/takım bağlarını kullanır.
CREATE OR REPLACE FUNCTION public.cogniti_yayin_token_alicilari(p_auth uuid,p_aday uuid)
RETURNS TABLE(alici_id uuid,alici_turu text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record;t record;hedef text[];
BEGIN
 SELECT u.firma_id,lower(btrim(u.rol)) rol,f.eclub_aktif INTO k FROM public.kullanicilar u JOIN public.firmalar f USING(firma_id)
 WHERE u.kullanici_id=p_auth AND u.aktif_mi AND f.aktif;
 IF NOT FOUND OR k.rol NOT IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per') THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
 SELECT tt.* INTO t FROM public.soru_seti_durumu sd JOIN public.soru_setleri ss USING(soru_seti_id)
 JOIN public.talepler tt ON tt.talep_id=ss.talep_id WHERE sd.soru_seti_durum_id=p_aday;
 IF NOT FOUND OR t.uretici_id IS DISTINCT FROM p_auth OR t.firma_id IS DISTINCT FROM k.firma_id THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
 hedef:=t.hedef_roller;
 IF hedef IS NULL OR NOT (hedef=ARRAY['utt'] OR hedef=ARRAY['bm'] OR hedef=ARRAY['eczaci'] OR hedef=ARRAY['eczane_teknisyeni'] OR (cardinality(hedef)=2 AND hedef @> ARRAY['eczaci','eczane_teknisyeni'])) THEN
 RAISE EXCEPTION 'ESNEK_GONDERIM:hedef_gecersiz' USING ERRCODE='22023'; END IF;
 IF hedef && ARRAY['eczaci','eczane_teknisyeni'] THEN
  IF k.rol LIKE 'ik_%' OR k.eclub_aktif IS DISTINCT FROM true THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT DISTINCT kisi.kisi_id,'eclub_kisi'::text
  FROM public.eclub_kisiler kisi JOIN public.eclub_kisi_eczane ke USING(kisi_id)
  JOIN public.eclub_eczane_firma ef ON ef.eczane_id=ke.eczane_id
  JOIN public.eclub_utt_eczane ue ON ue.eczane_firma_id=ef.id
  JOIN public.kullanicilar u ON u.kullanici_id=ue.utt_id
  WHERE ke.aktif_mi AND ef.aktif_mi AND ue.aktif_mi AND u.aktif_mi
   AND ef.firma_id=k.firma_id AND u.firma_id=k.firma_id AND lower(u.rol) IN ('utt','kd_utt')
   AND (t.takim_id IS NULL OR u.takim_id=t.takim_id)
   AND kisi.auth_user_id IS NOT NULL
   AND (CASE WHEN lower(kisi.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci') THEN 'eczaci'
     WHEN lower(kisi.rol)='eczane_teknisyeni' THEN 'eczane_teknisyeni' ELSE NULL END)=ANY(hedef)
  ORDER BY 1;
 ELSE
  RETURN QUERY SELECT DISTINCT u.kullanici_id,'firma_kullanicisi'::text FROM public.kullanicilar u LEFT JOIN public.bolgeler b USING(bolge_id)
  WHERE u.firma_id=k.firma_id AND u.aktif_mi AND (
   (hedef=ARRAY['bm'] AND u.rol='bm') OR (hedef=ARRAY['utt'] AND u.rol IN ('utt','kd_utt') AND (t.takim_id IS NULL OR coalesce(u.takim_id,b.takim_id)=t.takim_id))) ORDER BY 1;
 END IF;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_yayin_token_alicilari(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
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
 AND l.kalan>(SELECT count(*) FROM public.eczanem_token_bloklari z WHERE z.yukleme_id=l.yukleme_id AND z.durum='blokeli' AND z.bitis_at>clock_timestamp())
 ORDER BY l.son_kullanim_at,l.created_at,l.yukleme_id LIMIT 1 FOR UPDATE OF l;
 IF y IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetersiz' USING ERRCODE='P0001'; END IF;
 UPDATE public.cogniti_esnek_paket_yuklemeleri SET kalan=kalan-1 WHERE yukleme_id=y;
 INSERT INTO public.cogniti_esnek_gonderim_tuketimleri(firma_id,bakiye_id,yukleme_id,gonderen_id,akis,kaynak_id,alici_id,islem_kimligi,alici_turu)
 VALUES(k.firma_id,b,y,p_auth,p_akis,p_kaynak,p_alici,p_kimlik,tur);
END;$f$;

REVOKE ALL ON FUNCTION public.cogniti_esnek_gonderim_tuket(uuid,text,text,uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.cogniti_esnek_yayin_hesap_kontrol()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE t record;rol text;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.token_hesap_turu IS DISTINCT FROM OLD.token_hesap_turu THEN RAISE EXCEPTION 'Yayının token hesabı değiştirilemez.' USING ERRCODE='22023'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.hedef_roller=ARRAY['eczanem'] THEN
  IF NEW.token_hesap_turu IS NOT NULL THEN RAISE EXCEPTION 'Eczanem ayrı hesap akışını kullanır.' USING ERRCODE='22023'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.token_hesap_turu IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:hesap_secin' USING ERRCODE='P0001'; END IF;
 IF NEW.durum NOT IN ('yayinda','planlandi') THEN RAISE EXCEPTION 'Yayın durumu geçersiz.' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.soru_seti_durumu WHERE soru_seti_durum_id=NEW.soru_seti_durum_id AND durum='onaylandi' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Onaylı yayın adayı bulunamadı.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.yayin_yonetimi WHERE soru_seti_durum_id=NEW.soru_seti_durum_id) THEN RAISE EXCEPTION 'Bu içerik zaten yayımlandı.' USING ERRCODE='22023'; END IF;
 SELECT tt.* INTO t FROM public.soru_seti_durumu sd JOIN public.soru_setleri ss USING(soru_seti_id) JOIN public.talepler tt ON tt.talep_id=ss.talep_id WHERE sd.soru_seti_durum_id=NEW.soru_seti_durum_id;
 IF t.uretici_id IS DISTINCT FROM NEW.uretici_id OR t.hedef_roller IS DISTINCT FROM NEW.hedef_roller OR t.taslak_mi OR t.yayin_oncesi_silme_durumu IS NOT NULL THEN RAISE EXCEPTION 'Yayın adayı veya hedefi uygun değil.' USING ERRCODE='42501'; END IF;
 -- Sıfır alıcıda bile rol/hedef/yetki doğrulanır.
 PERFORM * FROM public.cogniti_yayin_token_alicilari(NEW.uretici_id,NEW.soru_seti_durum_id);
 RETURN NEW;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_yayin_hesap_kontrol() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.cogniti_token_yayin_acilis_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $f$
DECLARE v_firma uuid;v_takim uuid;v_gonderen_firma uuid;v_alici uuid;alici record;ids uuid[];b uuid;t record;
BEGIN
 IF NEW.durum IS DISTINCT FROM 'yayinda' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN IF OLD.durum IS DISTINCT FROM 'planlandi' THEN RETURN NEW; END IF; END IF;
 IF NEW.hedef_roller=ARRAY['eczanem'] THEN RETURN NEW; END IF;
 SELECT firma_id,takim_id INTO v_firma,v_takim FROM public.v_yayin_detay WHERE yayin_id=NEW.yayin_id;
 SELECT firma_id INTO v_gonderen_firma FROM public.kullanicilar WHERE kullanici_id=NEW.uretici_id;
 IF v_firma IS NULL OR v_gonderen_firma IS DISTINCT FROM v_firma THEN RAISE EXCEPTION 'COGNITI_TOKEN:yayin_firma_yok' USING ERRCODE='P0001'; END IF;
 IF NEW.token_hesap_turu IS NOT NULL THEN
  IF EXISTS(SELECT 1 FROM public.cogniti_yayin_acilis_token_kayitlari WHERE yayin_id=NEW.yayin_id) THEN RETURN NEW; END IF;
  SELECT tt.* INTO t FROM public.soru_seti_durumu sd JOIN public.soru_setleri ss USING(soru_seti_id) JOIN public.talepler tt ON tt.talep_id=ss.talep_id WHERE sd.soru_seti_durum_id=NEW.soru_seti_durum_id;
  IF t.uretici_id IS DISTINCT FROM NEW.uretici_id OR t.firma_id IS DISTINCT FROM v_firma OR t.hedef_roller IS DISTINCT FROM NEW.hedef_roller THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetkisiz' USING ERRCODE='42501'; END IF;
  SELECT coalesce(array_agg(x.alici_id ORDER BY x.alici_id),'{}'::uuid[]) INTO ids FROM public.cogniti_yayin_token_alicilari(NEW.uretici_id,NEW.soru_seti_durum_id) x;
  SELECT bakiye_id INTO b FROM public.cogniti_satin_alma_bakiyeleri WHERE firma_id=v_firma AND bakiye_turu=NEW.token_hesap_turu AND (bakiye_turu='firma_ortak' OR sahip_id=NEW.uretici_id) FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:hesap_yok' USING ERRCODE='P0001'; END IF;
  FOREACH v_alici IN ARRAY ids LOOP
   PERFORM public.cogniti_esnek_gonderim_tuket(NEW.uretici_id,NEW.token_hesap_turu,'yayin_acilis',NEW.yayin_id,v_alici,'yayin-acilis:'||NEW.yayin_id::text||':'||v_alici::text);
  END LOOP;
  INSERT INTO public.cogniti_yayin_acilis_token_kayitlari(yayin_id,firma_id,gonderen_id,bakiye_id,hedef_roller,alici_sayisi)
  VALUES(NEW.yayin_id,v_firma,NEW.uretici_id,b,NEW.hedef_roller,cardinality(ids));
  RETURN NEW;
 END IF;
 -- Hesapsız eski planlar yalnız geçiş listesinde ise eski davranışla sürer.
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_yayin_anlik_eski_yayinlar WHERE yayin_id=NEW.yayin_id) THEN RAISE EXCEPTION 'ESNEK_GONDERIM:hesap_secin' USING ERRCODE='P0001'; END IF;
 IF NOT (coalesce(NEW.hedef_roller,ARRAY['utt']) && ARRAY['utt','bm']) THEN RETURN NEW; END IF;
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
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_token_yayin_acilis_kaydet() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.cogniti_token_eclub_oneri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid;
BEGIN
 IF EXISTS(SELECT 1 FROM public.cogniti_yayin_acilis_token_kayitlari c WHERE c.yayin_id=NEW.yayin_id AND c.hedef_roller && ARRAY['eczaci','eczane_teknisyeni']) THEN RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.cogniti_yayin_anlik_eski_yayinlar WHERE yayin_id=NEW.yayin_id) THEN
  RAISE EXCEPTION 'ECLUB_GONDERIM:yayin_token_kaydi_yok' USING ERRCODE='P0001'; END IF;
 SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id=NEW.oneren_id;
 IF v_firma IS NULL THEN
  RAISE EXCEPTION 'ECLUB_GONDERIM:token_gonderici_firma_yok' USING ERRCODE='P0001';
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
DROP FUNCTION IF EXISTS public.cogniti_esnek_eclub_gonder(uuid,text,uuid[],uuid[],uuid);
CREATE OR REPLACE FUNCTION public.cogniti_token_yayin_gonderim_alicilari(p_yayin_id uuid)
RETURNS TABLE(kullanici_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 -- Buradaki kimlikler yalnız firma içi bildirim alıcılarıdır. E-Club kişi UUIDsi navbar bildirimine verilmez.
 SELECT t.alici_kimligi::uuid FROM public.cogniti_token_tuketimleri t WHERE t.islem_turu='yayin' AND t.kaynak_id=p_yayin_id AND t.alici_turu='firma_kullanicisi'
 UNION SELECT t.alici_id FROM public.cogniti_esnek_gonderim_tuketimleri t WHERE t.akis='yayin_acilis' AND t.kaynak_id=p_yayin_id AND t.alici_turu='firma_kullanicisi'
 UNION SELECT u.kullanici_id FROM public.cogniti_yayin_acilis_token_kayitlari c
 JOIN public.v_yayin_detay y USING(yayin_id) JOIN public.kullanicilar u ON u.firma_id=c.firma_id
 WHERE c.yayin_id=p_yayin_id AND c.hedef_roller && ARRAY['eczaci','eczane_teknisyeni']
 AND u.aktif_mi AND u.rol IN ('utt','kd_utt') AND (y.takim_id IS NULL OR u.takim_id=y.takim_id);
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
 v_not:='Tokenlar gerçek yayın açılışında seçilen hesaptan tüketilir. UTT’nin E-Club dağıtımı ikinci tüketim oluşturmaz.';
 RETURN jsonb_build_object('akis',p_akis,'bakiye_turu',p_bakiye_turu,'planli',p_plan_tarihi IS NOT NULL,
  'uygun_kayit',v_uygun,'atlanan_kayit',v_atlanan,'gereken_token',v_gereken,'kullanilabilir_token',v_mevcut,
  'islem_sonrasi',greatest(0,v_mevcut-v_gereken),'eksik_token',greatest(0,v_gereken-v_mevcut),
  'yeterli',v_mevcut>=v_gereken,'gercek_gonderim_acik',p_plan_tarihi IS NULL,'aciklama',v_not);
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date) TO service_role;
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
   aktive_sayisi:=aktive_sayisi+1;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
   IF p_yayin_id IS NULL AND SQLERRM IN ('COGNITI_TOKEN:bakiye_yetersiz','COGNITI_TOKEN:hesap_yok','COGNITI_TOKEN:yayin_firma_yok','ESNEK_GONDERIM:yetersiz','ESNEK_GONDERIM:hesap_yok') THEN
    RAISE WARNING 'Yayın % planlandı bırakıldı: %',y.yayin_id,SQLERRM;
   ELSE RAISE;
   END IF;
  END;
 END LOOP;
 RETURN aktive_sayisi;
END $$;
REVOKE ALL ON FUNCTION public.yayin_planlananlari_aktive(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.yayin_planlananlari_aktive(uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_ortak_yayin_anlik_tuketim_kuruldu;
