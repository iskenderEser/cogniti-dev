-- KULLANICI ÇALIŞTIRACAK. Medikal Müdürün mevcut Eczanem yayın/gönderim hakkını geri açar.
-- PM'nin 30 gün ve token bloklama kuralları değişmez. Yeni token yüklemesi oluşturmaz.
BEGIN;
CREATE OR REPLACE FUNCTION public.eczanem_medikal_kaynak_mi(p_yayin uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT EXISTS(SELECT 1 FROM public.eczanem_yayin_gonderim_sureleri s JOIN public.yayin_yonetimi y USING(yayin_id)
 WHERE s.yayin_id=p_yayin AND s.uretici_rol='med_md' AND s.uretici_id=y.uretici_id
 AND coalesce(y.hedef_roller,ARRAY[]::text[]) @> ARRAY['eczanem']::text[]);
$f$;
REVOKE ALL ON FUNCTION public.eczanem_medikal_kaynak_mi(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.eczanem_yayin_gonderim_suresini_koru()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE baslangic timestamptz; yayin_durum text; kaynak_rol text; kaynak_id uuid; yayin_uretici uuid; hedefler text[];
BEGIN
 SELECT s.baslangic_at,y.durum,s.uretici_rol,s.uretici_id,y.uretici_id,y.hedef_roller INTO baslangic,yayin_durum,kaynak_rol,kaynak_id,yayin_uretici,hedefler
 FROM public.eczanem_yayin_gonderim_sureleri s JOIN public.yayin_yonetimi y USING(yayin_id)
 WHERE s.yayin_id=NEW.yayin_id FOR SHARE OF s,y;
 IF kaynak_rol IS NULL OR kaynak_rol NOT IN ('pm','jr_pm','kd_pm','med_md') OR kaynak_id IS NULL
  OR kaynak_id IS DISTINCT FROM yayin_uretici OR NOT (coalesce(hedefler,ARRAY[]::text[]) @> ARRAY['eczanem']::text[]) THEN
  RAISE EXCEPTION 'ECZANEM_GONDERIM:pm_kaynagi_dogrulanamadi' USING ERRCODE='P0001';
 END IF;
 IF baslangic IS NULL THEN
  RAISE EXCEPTION 'ECZANEM_GONDERIM:sure_dogrulanamadi' USING ERRCODE='P0001';
 END IF;
 IF yayin_durum IS DISTINCT FROM 'yayinda' THEN
  RAISE EXCEPTION 'ECZANEM_GONDERIM:yayin_kapali' USING ERRCODE='P0001';
 END IF;
 -- Medikal kaynak yetkisi korunur; PM'ye özel 30 gün limiti uygulanmaz.
 IF kaynak_rol='med_md' THEN RETURN NEW; END IF;
 -- Kilit beklenmiş olsa bile gerçek işlem anında süre kontrol edilir. Tam sınırda gönderim kapalıdır.
 IF clock_timestamp()<baslangic OR clock_timestamp()>=baslangic+interval '720 hours' THEN
  RAISE EXCEPTION 'ECZANEM_GONDERIM:sure_doldu' USING ERRCODE='P0001';
 END IF;
 RETURN NEW;
END;
$f$;

CREATE OR REPLACE FUNCTION public.eczanem_pm_token_hesap_bagla()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record; b uuid; eski public.eczanem_yayin_token_hesaplari%ROWTYPE; e record;
BEGIN
 -- PM hesabı olmayan Medikal kaynağı mevcut firma tüketim yolunda kalır.
 IF coalesce(NEW.hedef_roller,ARRAY[]::text[]) @> ARRAY['eczanem']::text[]
 AND NOT EXISTS(SELECT 1 FROM public.eczanem_yayin_token_hesaplari WHERE yayin_id=NEW.yayin_id)
 AND (public.eczanem_medikal_kaynak_mi(NEW.yayin_id) OR (
  NOT EXISTS(SELECT 1 FROM public.eczanem_yayin_gonderim_sureleri WHERE yayin_id=NEW.yayin_id)
  AND EXISTS(SELECT 1 FROM public.kullanicilar med JOIN public.firmalar f USING(firma_id)
    JOIN public.v_yayin_detay y ON y.firma_id=med.firma_id AND y.yayin_id=NEW.yayin_id
    WHERE med.kullanici_id=NEW.uretici_id AND lower(btrim(med.rol))='med_md' AND med.aktif_mi AND f.aktif))) THEN
  IF NEW.eczanem_token_hesap_turu IS NOT NULL THEN RAISE EXCEPTION 'PM token hesabı seçimi Medikal yayında kullanılamaz.' USING ERRCODE='42501'; END IF;
  RETURN NEW;
 END IF;
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

CREATE OR REPLACE FUNCTION public.eczanem_pm_token_eczane_blokla(p_yayin uuid,p_eczane uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE h public.eczanem_yayin_token_hesaplari%ROWTYPE; s record; u record; y record; gerekli integer; mevcut bigint; son timestamptz; n integer:=0;
BEGIN
 SELECT * INTO h FROM public.eczanem_yayin_token_hesaplari WHERE yayin_id=p_yayin;
 IF NOT FOUND THEN
  IF public.eczanem_medikal_kaynak_mi(p_yayin) THEN RETURN 0; END IF;
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

CREATE OR REPLACE FUNCTION public.cogniti_token_eczanem_musteri_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE h public.eczanem_yayin_token_hesaplari%ROWTYPE; b public.eczanem_token_bloklari%ROWTYPE; v_firma uuid;
BEGIN
 SELECT * INTO h FROM public.eczanem_yayin_token_hesaplari WHERE yayin_id=NEW.yayin_id;
 IF NOT FOUND THEN
  IF NOT public.eczanem_medikal_kaynak_mi(NEW.yayin_id) AND NOT EXISTS(SELECT 1 FROM public.eczanem_token_eski_yayinlar WHERE yayin_id=NEW.yayin_id) THEN RAISE EXCEPTION 'ECZANEM_TOKEN:hesap_secilmedi' USING ERRCODE='P0001'; END IF;
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

REVOKE ALL ON FUNCTION public.eczanem_yayin_gonderim_suresini_koru(),public.eczanem_pm_token_hesap_bagla(),public.eczanem_pm_token_eczane_blokla(uuid,uuid),public.cogniti_token_eczanem_musteri_kaydet() FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eczanem_medikal_yayin_yetkisi_duzeltildi;
