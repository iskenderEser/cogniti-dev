-- KULLANICI ÇALIŞTIRACAK. KKÖ Adım 5: rol/hesap bazında seçim ve mevcut token hattına bağlantı.
-- Ön koşul: Esnek sipariş, ortak üretici tüketimi, Eczanem ve plan rezervasyonu kurulumları.
-- Proforma/fatura üretmez. Eski firma KKÖ tablolarını ve eski yayınları değiştirmez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-kko-adim5',0));
CREATE TABLE IF NOT EXISTS public.cogniti_kko_hesap_secimleri (
 bakiye_id uuid PRIMARY KEY REFERENCES public.cogniti_satin_alma_bakiyeleri(bakiye_id),
 etkin boolean NOT NULL DEFAULT true,
 secen_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 birim_fiyat numeric(14,2) NOT NULL CHECK(birim_fiyat>0),
 etkinlesme_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 kapanma_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.cogniti_kko_secim_istekleri (
 secen_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),anahtar uuid NOT NULL,
 bakiye_id uuid NOT NULL REFERENCES public.cogniti_satin_alma_bakiyeleri(bakiye_id),
 hesap_turu text NOT NULL CHECK(hesap_turu IN('kisisel','firma_ortak')),
 birim_fiyat numeric(14,2) NOT NULL,created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 PRIMARY KEY(secen_id,anahtar)
);
ALTER TABLE public.cogniti_kko_hesap_secimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_kko_secim_istekleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_kko_hesap_secimleri,public.cogniti_kko_secim_istekleri FROM PUBLIC,anon,authenticated,service_role;
-- KKÖ hakkı satın alınmış bir Esnek Paket siparişi değildir. Mevcut dağıtım/rezervasyon
-- motorunun yükleme kaynağına bağlanır; sipariş listesine sahte sipariş yazılmaz.
ALTER TABLE public.cogniti_esnek_paket_yuklemeleri ALTER COLUMN siparis_id DROP NOT NULL;
ALTER TABLE public.cogniti_esnek_paket_yuklemeleri ADD COLUMN IF NOT EXISTS kko_donem date;
ALTER TABLE public.cogniti_esnek_paket_yuklemeleri ADD COLUMN IF NOT EXISTS kko_birim_fiyat numeric(14,2);
DO $f$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.cogniti_esnek_paket_yuklemeleri'::regclass AND conname='cogniti_yukleme_kaynak_kontrol') THEN
  ALTER TABLE public.cogniti_esnek_paket_yuklemeleri ADD CONSTRAINT cogniti_yukleme_kaynak_kontrol CHECK(
   (siparis_id IS NOT NULL AND kko_donem IS NULL AND kko_birim_fiyat IS NULL) OR
   (siparis_id IS NULL AND kko_donem IS NOT NULL AND kko_donem=date_trunc('month',kko_donem)::date AND miktar=1500 AND kko_birim_fiyat IS NOT NULL AND kko_birim_fiyat>0));
 END IF;
END;$f$;
CREATE UNIQUE INDEX IF NOT EXISTS cogniti_kko_aylik_tek ON public.cogniti_esnek_paket_yuklemeleri(bakiye_id,kko_donem) WHERE kko_donem IS NOT NULL;

CREATE OR REPLACE FUNCTION public.cogniti_kko_hesap_yenile(p_bakiye uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE h record;b record;ay date:=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
 SELECT * INTO b FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=p_bakiye FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT * INTO h FROM public.cogniti_kko_hesap_secimleri WHERE bakiye_id=p_bakiye AND etkin;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=b.firma_id AND aktif=true) THEN RETURN; END IF;
 INSERT INTO public.cogniti_esnek_paket_yuklemeleri(siparis_id,firma_id,bakiye_id,miktar,kalan,son_kullanim_at,kko_donem,kko_birim_fiyat)
 VALUES(NULL,b.firma_id,p_bakiye,1500,1500,(ay+interval '1 month') AT TIME ZONE 'Europe/Istanbul',ay,h.birim_fiyat)
 ON CONFLICT(bakiye_id,kko_donem) WHERE kko_donem IS NOT NULL DO NOTHING;
 -- Geçmiş ayın kalanını silmek tüketim gibi gösterirdi. Geçerlilik tarihi hakkı kapatır;
 -- geçmiş ayın miktar/kalan/tüketim kayıtları denetim için aynen korunur.
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_kko_hesap_yenile(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_kko_secimini_kaydet(p_auth_id uuid,p_hesap text,p_birim_fiyat numeric,p_anahtar uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record;b uuid;tur text;sahip uuid;onceki record;birim numeric;
BEGIN
 IF p_anahtar IS NULL OR p_hesap IS NULL OR p_hesap NOT IN('kisisel','firma_ortak') OR p_birim_fiyat IS NULL
 OR p_birim_fiyat::text IN('NaN','Infinity','-Infinity') OR p_birim_fiyat<=0 THEN
  RAISE EXCEPTION 'KKO_SECIM:gecersiz' USING ERRCODE='22023'; END IF;
 SELECT u.kullanici_id,u.firma_id,lower(btrim(u.rol)) rol INTO k FROM public.kullanicilar u
 JOIN public.firmalar f USING(firma_id) WHERE u.kullanici_id=p_auth_id AND u.aktif_mi=true AND f.aktif=true FOR SHARE OF u,f;
 IF NOT FOUND THEN RAISE EXCEPTION 'KKO_SECIM:yetkisiz' USING ERRCODE='42501'; END IF;
 IF k.rol IN('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per') THEN tur:='kisisel';sahip:=k.kullanici_id;
 ELSIF k.rol IN('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin') THEN tur:='firma_ortak';sahip:=NULL;
 ELSE RAISE EXCEPTION 'KKO_SECIM:yetkisiz' USING ERRCODE='42501'; END IF;
 IF tur<>p_hesap THEN RAISE EXCEPTION 'KKO_SECIM:yetkisiz' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('cogniti-kko-secim:'||p_auth_id::text||':'||p_anahtar::text,0));
 INSERT INTO public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_turu,sahip_id) VALUES(k.firma_id,tur,sahip) ON CONFLICT DO NOTHING;
 SELECT bakiye_id INTO STRICT b FROM public.cogniti_satin_alma_bakiyeleri WHERE firma_id=k.firma_id AND bakiye_turu=tur AND sahip_id IS NOT DISTINCT FROM sahip FOR UPDATE;
 SELECT * INTO onceki FROM public.cogniti_kko_secim_istekleri WHERE secen_id=p_auth_id AND anahtar=p_anahtar;
 IF FOUND THEN
  IF onceki.bakiye_id<>b OR onceki.hesap_turu<>p_hesap OR onceki.birim_fiyat<>p_birim_fiyat THEN RAISE EXCEPTION 'KKO_SECIM:anahtar_uyusmaz' USING ERRCODE='22023';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.cogniti_kko_hesap_secimleri WHERE bakiye_id=b AND etkin) THEN RAISE EXCEPTION 'KKO_SECIM:tercih_degisti' USING ERRCODE='P0003';END IF;
  RETURN jsonb_build_object('bakiye_id',b,'yeniden_deneme',true);
 END IF;
 IF EXISTS(SELECT 1 FROM public.cogniti_kko_hesap_secimleri WHERE bakiye_id=b AND etkin) THEN RAISE EXCEPTION 'KKO_SECIM:zaten_etkin' USING ERRCODE='P0003';END IF;
 IF EXISTS(SELECT 1 FROM public.cogniti_esnek_paket_yuklemeleri y WHERE y.bakiye_id=b AND
   ((y.kko_donem IS NULL AND y.kalan>0 AND y.son_kullanim_at>statement_timestamp()) OR public.cogniti_yukleme_ayrilan(y.yukleme_id)>0))
 OR EXISTS(SELECT 1 FROM public.cogniti_esnek_paket_siparisleri s WHERE s.bakiye_id=b AND NOT EXISTS(
  SELECT 1 FROM public.cogniti_esnek_paket_yuklemeleri y WHERE y.siparis_id=s.siparis_id)) THEN
  RAISE EXCEPTION 'KKO_SECIM:paket_veya_bloke_var' USING ERRCODE='P0003'; END IF;
 SELECT (degerler->>'kko_token_tl')::numeric INTO birim FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR SHARE;
 IF birim IS NULL OR birim<=0 OR birim::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'KKO_SECIM:fiyat_yok' USING ERRCODE='22023';END IF;
 IF birim<>p_birim_fiyat THEN RAISE EXCEPTION 'KKO_SECIM:fiyat_degisti' USING ERRCODE='P0003';END IF;
 INSERT INTO public.cogniti_kko_hesap_secimleri(bakiye_id,secen_id,birim_fiyat) VALUES(b,p_auth_id,birim)
 ON CONFLICT(bakiye_id) DO UPDATE SET etkin=true,secen_id=excluded.secen_id,birim_fiyat=excluded.birim_fiyat,etkinlesme_at=statement_timestamp(),kapanma_at=NULL;
 PERFORM public.cogniti_kko_hesap_yenile(b);
 INSERT INTO public.cogniti_kko_secim_istekleri(secen_id,anahtar,bakiye_id,hesap_turu,birim_fiyat) VALUES(p_auth_id,p_anahtar,b,tur,birim);
 RETURN jsonb_build_object('bakiye_id',b,'yeniden_deneme',false);
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_kko_secimini_kaydet(uuid,text,numeric,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_kko_secimini_kaydet(uuid,text,numeric,uuid) TO service_role;

-- Esnek sipariş ve KKÖ kapanışı tek transaction: yükleme başarısızsa kapanış da geri alınır.
CREATE OR REPLACE FUNCTION public.cogniti_kko_paket_gecisi()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=NEW.bakiye_id FOR UPDATE;
 UPDATE public.cogniti_kko_hesap_secimleri SET etkin=false,kapanma_at=statement_timestamp() WHERE bakiye_id=NEW.bakiye_id AND etkin;
 RETURN NEW;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_kko_paket_gecisi() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_kko_paket_gecisi ON public.cogniti_esnek_paket_siparisleri;
CREATE TRIGGER trg_cogniti_kko_paket_gecisi BEFORE INSERT ON public.cogniti_esnek_paket_siparisleri FOR EACH ROW EXECUTE FUNCTION public.cogniti_kko_paket_gecisi();

CREATE OR REPLACE FUNCTION public.cogniti_kko_yukleme_kullanilabilir(p_donem date,p_bakiye uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT p_donem IS NULL OR EXISTS(SELECT 1 FROM public.cogniti_kko_hesap_secimleri WHERE bakiye_id=p_bakiye AND etkin);
$f$;
REVOKE ALL ON FUNCTION public.cogniti_kko_yukleme_kullanilabilir(date,uuid) FROM PUBLIC,anon,authenticated,service_role;


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
 PERFORM public.cogniti_kko_hesap_yenile(b);
 SELECT * INTO onceki FROM public.cogniti_esnek_gonderim_tuketimleri WHERE islem_kimligi=p_kimlik;
 IF FOUND THEN
  IF onceki.bakiye_id<>b OR onceki.gonderen_id<>p_auth OR onceki.akis<>p_akis OR onceki.kaynak_id<>p_kaynak OR onceki.alici_id<>p_alici THEN
   RAISE EXCEPTION 'ESNEK_GONDERIM:tekrar_uyusmazligi' USING ERRCODE='22023'; END IF;
  RETURN;
 END IF;
 SELECT l.yukleme_id INTO y FROM public.cogniti_esnek_paket_yuklemeleri l
 WHERE l.bakiye_id=b AND l.firma_id=k.firma_id AND l.son_kullanim_at>clock_timestamp() AND public.cogniti_kko_yukleme_kullanilabilir(l.kko_donem,l.bakiye_id)
 AND l.kalan>public.cogniti_yukleme_ayrilan(l.yukleme_id)
 ORDER BY l.son_kullanim_at,l.created_at,l.yukleme_id LIMIT 1 FOR UPDATE OF l;
 IF y IS NULL THEN RAISE EXCEPTION 'ESNEK_GONDERIM:yetersiz' USING ERRCODE='P0001'; END IF;
 UPDATE public.cogniti_esnek_paket_yuklemeleri SET kalan=kalan-1 WHERE yukleme_id=y;
 INSERT INTO public.cogniti_esnek_gonderim_tuketimleri(firma_id,bakiye_id,yukleme_id,gonderen_id,akis,kaynak_id,alici_id,islem_kimligi,alici_turu)
 VALUES(k.firma_id,b,y,p_auth,p_akis,p_kaynak,p_alici,p_kimlik,tur);
END;$f$;

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
 PERFORM public.cogniti_kko_hesap_yenile(b);
 IF yy.yayin_tarihi<=clock_timestamp() THEN RAISE EXCEPTION 'ESNEK_PLAN:tarih_gecersiz' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO n FROM public.cogniti_yayin_token_alicilari(yy.uretici_id,yy.soru_seti_durum_id);
 UPDATE public.cogniti_yayin_plan_tokenlari SET durum='serbest',updated_at=statement_timestamp() WHERE yayin_id=p_yayin;
 DELETE FROM public.cogniti_yayin_plan_token_dagilimi WHERE yayin_id=p_yayin;
 INSERT INTO public.cogniti_yayin_plan_tokenlari(yayin_id,firma_id,gonderen_id,bakiye_id,hedef_at,durum,miktar)
 VALUES(p_yayin,f,yy.uretici_id,b,yy.yayin_tarihi,'ayrildi',n)
 ON CONFLICT(yayin_id) DO UPDATE SET hedef_at=excluded.hedef_at,durum='ayrildi',miktar=excluded.miktar,son_hata=NULL,updated_at=statement_timestamp();
 kalan:=n;
 FOR y IN SELECT l.yukleme_id,l.kalan-public.cogniti_yukleme_ayrilan(l.yukleme_id) AS uygun
 FROM public.cogniti_esnek_paket_yuklemeleri l WHERE l.bakiye_id=b AND l.firma_id=f AND l.son_kullanim_at>yy.yayin_tarihi AND public.cogniti_kko_yukleme_kullanilabilir(l.kko_donem,l.bakiye_id)
 ORDER BY l.son_kullanim_at,l.created_at,l.yukleme_id FOR UPDATE OF l LOOP
  EXIT WHEN kalan=0;
  pay:=least(kalan,greatest(0,y.uygun));IF pay=0 THEN CONTINUE;END IF;
  INSERT INTO public.cogniti_yayin_plan_token_dagilimi VALUES(p_yayin,y.yukleme_id,pay);kalan:=kalan-pay;
 END LOOP;
 IF kalan>0 THEN RAISE EXCEPTION 'ESNEK_PLAN:yetersiz' USING ERRCODE='P0001'; END IF;
 RETURN n;
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
 PERFORM public.cogniti_kko_hesap_yenile(h.bakiye_id);
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
 WHERE z.bakiye_id=h.bakiye_id AND z.firma_id=h.firma_id AND z.son_kullanim_at>clock_timestamp() AND public.cogniti_kko_yukleme_kullanilabilir(z.kko_donem,z.bakiye_id);
 IF mevcut<gerekli THEN RAISE EXCEPTION 'ECZANEM_TOKEN:yetersiz' USING ERRCODE='P0001'; END IF;
 FOR u IN SELECT DISTINCT uy.musteri_id FROM public.eczanem_uyelikler uy JOIN public.eczanem_musteriler m USING(musteri_id)
 WHERE uy.eczane_id=p_eczane AND uy.aktif_mi=true AND m.aktif_mi=true
  AND NOT EXISTS(SELECT 1 FROM public.eczanem_eclub_gecis_talepleri g WHERE g.musteri_id=uy.musteri_id)
  AND NOT EXISTS(SELECT 1 FROM public.eczanem_gonderimler g WHERE g.yayin_id=p_yayin AND g.eczane_id=p_eczane AND g.musteri_id=uy.musteri_id)
 ORDER BY uy.musteri_id LOOP
  SELECT z.* INTO y FROM public.cogniti_esnek_paket_yuklemeleri z
  WHERE z.bakiye_id=h.bakiye_id AND z.firma_id=h.firma_id AND z.son_kullanim_at>clock_timestamp() AND public.cogniti_kko_yukleme_kullanilabilir(z.kko_donem,z.bakiye_id)
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
  AND (b.bakiye_turu='firma_ortak' OR b.sahip_id=p_auth_id) AND y.son_kullanim_at>v_hedef AND public.cogniti_kko_yukleme_kullanilabilir(y.kko_donem,y.bakiye_id);
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

CREATE OR REPLACE FUNCTION public.cogniti_satin_alma_bakiye_ozeti(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_firma uuid; v_kisisel jsonb; v_ortak jsonb;
BEGIN
 SELECT k.firma_id INTO v_firma FROM public.kullanicilar k JOIN public.firmalar f USING(firma_id)
 WHERE k.kullanici_id=p_auth_id AND k.aktif_mi=true AND f.aktif=true
 AND lower(btrim(k.rol)) IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per',
  'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin','tm','bm','utt','kd_utt','iu');
 IF v_firma IS NULL THEN RAISE EXCEPTION 'Token bakiyelerine erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 PERFORM public.cogniti_kko_hesap_yenile(bakiye_id) FROM public.cogniti_satin_alma_bakiyeleri
 WHERE firma_id=v_firma AND (bakiye_turu='firma_ortak' OR sahip_id=p_auth_id) ORDER BY bakiye_id;
 WITH ozet AS (
  SELECT b.bakiye_turu,
   jsonb_build_object(
    'paket',CASE WHEN coalesce(h.etkin,false) THEN 'kko' WHEN coalesce(sum(y.miktar),0)>0 THEN 'esnek' ELSE NULL END,
    'toplam',coalesce(sum(y.miktar),0),
    -- Süre dolması tüketim değildir; tüketim miktarı kalan farkından ayrı hesaplanır.
    -- Kalan henüz tüketilmemiş tokenı temsil eder. Rezervasyon adımında kalan azaltılmadan ayrı tutulmalıdır.
    'kullanilan',coalesce(sum(y.miktar-y.kalan),0),
    'kalan',coalesce(sum(y.kalan-coalesce(bl.adet,0)) FILTER(WHERE y.son_kullanim_at>statement_timestamp()),0),
    'suresi_dolan',coalesce(sum(y.kalan) FILTER(WHERE y.son_kullanim_at<=statement_timestamp()),0),
    'ayrilan',coalesce(sum(bl.adet),0)
   ) AS deger
  FROM public.cogniti_satin_alma_bakiyeleri b
  LEFT JOIN public.cogniti_kko_hesap_secimleri h ON h.bakiye_id=b.bakiye_id
 LEFT JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.bakiye_id=b.bakiye_id AND y.firma_id=b.firma_id
  AND ((coalesce(h.etkin,false) AND y.kko_donem=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date)
    OR (NOT coalesce(h.etkin,false) AND y.kko_donem IS NULL))
  LEFT JOIN LATERAL(SELECT public.cogniti_yukleme_ayrilan(y.yukleme_id) AS adet) bl ON true
  WHERE b.firma_id=v_firma AND (b.bakiye_turu='firma_ortak' OR (b.bakiye_turu='kisisel' AND b.sahip_id=p_auth_id))
  GROUP BY b.bakiye_id,b.bakiye_turu,h.etkin
 ) SELECT (SELECT deger FROM ozet WHERE bakiye_turu='kisisel'),(SELECT deger FROM ozet WHERE bakiye_turu='firma_ortak')
 INTO v_kisisel,v_ortak;
 RETURN jsonb_build_object('kisisel',v_kisisel,'firma_ortak',coalesce(v_ortak,jsonb_build_object('paket',NULL,'toplam',0,'kullanilan',0,'kalan',0,'suresi_dolan',0,'ayrilan',0)));
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_firma_esnek_token_kullanimi(
 p_auth_id uuid,p_firma uuid,p_hesap uuid DEFAULT NULL,p_sayfa integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record;v_hesaplar jsonb;v_sonuc jsonb;
BEGIN
 IF p_firma IS NULL OR p_sayfa IS NULL OR p_sayfa NOT BETWEEN 0 AND 1000000 THEN
  RAISE EXCEPTION 'Geçersiz rapor isteği.' USING ERRCODE='22023'; END IF;
 SELECT lower(btrim(rol)) rol,firma_id INTO k FROM public.kullanicilar WHERE kullanici_id=p_auth_id AND aktif_mi=true;
 IF NOT FOUND OR k.rol IS NULL OR k.rol NOT IN ('admin','firma_admin') THEN
  RAISE EXCEPTION 'Token raporuna erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF k.rol='firma_admin' AND (k.firma_id IS DISTINCT FROM p_firma OR NOT EXISTS(
  SELECT 1 FROM public.firmalar WHERE firma_id=p_firma AND aktif=true AND firma_admin_aktif=true
 )) THEN RAISE EXCEPTION 'Firma kapsamına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=p_firma) THEN
  RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='22023'; END IF;
 IF p_hesap IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=p_hesap AND firma_id=p_firma) THEN
  RAISE EXCEPTION 'Token hesabına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY h.bakiye_turu,h.sahip_adi,h.bakiye_id),'[]'::jsonb) INTO v_hesaplar FROM (
  SELECT b.bakiye_id,b.bakiye_turu,b.sahip_id,
   CASE WHEN b.bakiye_turu='firma_ortak' THEN 'Firma Token Hesabı' ELSE coalesce(nullif(btrim(concat_ws(' ',u.ad,u.soyad)),''),b.sahip_id::text) END sahip_adi,
   CASE WHEN EXISTS(SELECT 1 FROM public.cogniti_kko_hesap_secimleri h WHERE h.bakiye_id=b.bakiye_id AND h.etkin) THEN 'kko' ELSE 'esnek' END paket_turu,
   coalesce(sum(y.miktar),0) toplam,coalesce(sum(y.miktar-y.kalan),0) kullanilan,
   coalesce(sum(y.kalan-a.adet) FILTER(WHERE y.son_kullanim_at>statement_timestamp()),0) kalan,
   coalesce(sum(a.adet) FILTER(WHERE y.son_kullanim_at>statement_timestamp()),0) ayrilan,
   coalesce(sum(y.kalan) FILTER(WHERE y.son_kullanim_at<=statement_timestamp()),0) suresi_dolan
  FROM public.cogniti_satin_alma_bakiyeleri b
  LEFT JOIN public.kullanicilar u ON u.kullanici_id=b.sahip_id
  LEFT JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.bakiye_id=b.bakiye_id AND y.firma_id=b.firma_id
  LEFT JOIN LATERAL(SELECT public.cogniti_yukleme_ayrilan(y.yukleme_id) adet) a ON true
  WHERE b.firma_id=p_firma GROUP BY b.bakiye_id,b.bakiye_turu,b.sahip_id,u.ad,u.soyad
 ) h;
 WITH ham AS MATERIALIZED (
  SELECT t.tuketim_id id,t.bakiye_id,t.gonderen_id,t.kaynak_id yayin_id,
   CASE WHEN t.akis='eclub_oneri' THEN 'onceki_eclub' WHEN t.alici_turu='eclub_kisi' THEN 'eclub' ELSE 'saha' END akis,
   t.miktar::bigint miktar,t.created_at tarih
  FROM public.cogniti_esnek_gonderim_tuketimleri t WHERE t.firma_id=p_firma
  UNION ALL
  SELECT z.blok_id,z.bakiye_id,h.pm_id,z.yayin_id,'eczanem',1::bigint,z.tuketildi_at
  FROM public.eczanem_token_bloklari z
  JOIN public.eczanem_yayin_token_hesaplari h ON h.yayin_id=z.yayin_id AND h.firma_id=z.firma_id AND h.bakiye_id=z.bakiye_id
  WHERE z.firma_id=p_firma AND z.durum='tuketildi'
 ), gruplar AS MATERIALIZED (
  SELECT min(id::text)::uuid id,bakiye_id,gonderen_id,yayin_id,akis,sum(miktar) token,min(tarih) ilk_tarih,max(tarih) son_tarih
  FROM ham WHERE p_hesap IS NULL OR bakiye_id=p_hesap GROUP BY bakiye_id,gonderen_id,yayin_id,akis
 ), sayfa AS (
  SELECT g.*,coalesce(nullif(btrim(concat_ws(' ',u.ad,u.soyad)),''),g.gonderen_id::text) gonderen,
   coalesce(u.rol,'bilinmiyor') gonderen_rol,v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu
  FROM (SELECT * FROM gruplar ORDER BY son_tarih DESC,id LIMIT 50 OFFSET p_sayfa*50) g
  LEFT JOIN public.kullanicilar u ON u.kullanici_id=g.gonderen_id
  LEFT JOIN LATERAL(SELECT d.firma_adi,d.talep_no,d.urun_adi,d.arac_turu::text FROM public.v_yayin_detay d
   WHERE d.yayin_id=g.yayin_id AND d.firma_id=p_firma ORDER BY d.firma_adi,d.talep_no,d.urun_adi,d.arac_turu LIMIT 1) v ON true
 )
 SELECT jsonb_build_object('firma_id',p_firma,'hesap_id',p_hesap,'sayfa',p_sayfa,'hesaplar',v_hesaplar,
  'satirlar',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY son_tarih DESC,id) FROM sayfa s),'[]'::jsonb),
  'kayit_sayisi',(SELECT count(*) FROM gruplar),'tuketim_toplami',coalesce((SELECT sum(token) FROM gruplar),0)
 ) INTO v_sonuc;
 RETURN v_sonuc;
END;
$f$;


-- Okuma/yazma girişlerinin izinleri korunur; yardımcılar yalnız SECURITY DEFINER içinden çağrılır.
REVOKE ALL ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_satin_alma_bakiye_ozeti(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.cogniti_rol_kko_aylik_yenile()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE b uuid;
BEGIN
 FOR b IN SELECT bakiye_id FROM public.cogniti_kko_hesap_secimleri WHERE etkin ORDER BY bakiye_id LOOP
  PERFORM public.cogniti_kko_hesap_yenile(b);
 END LOOP;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_rol_kko_aylik_yenile() FROM PUBLIC,anon,authenticated,service_role;
DO $f$ BEGIN
 IF to_regprocedure('cron.schedule(text,text,text)') IS NOT NULL THEN
  PERFORM cron.schedule('cogniti_rol_kko_aylik','0 * * * *','SELECT public.cogniti_rol_kko_aylik_yenile();');
 END IF;
END;$f$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_gonderim_tuket(uuid,text,text,uuid,uuid,text),
 public.cogniti_yayin_plan_token_ayir(uuid),public.eczanem_pm_token_eczane_blokla(uuid,uuid),
 public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date),
 public.cogniti_firma_esnek_token_kullanimi(uuid,uuid,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date),
 public.cogniti_firma_esnek_token_kullanimi(uuid,uuid,uuid,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_rol_kko_adim5_kuruldu;
