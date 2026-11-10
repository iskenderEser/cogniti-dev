-- Kullanıcı çalıştıracak. Ön koşul: Paket 2 logaritmik tarife ve abonelik ilk dönem oranı.
BEGIN;
ALTER TABLE public.cogniti_fiyat_tarifesi ADD COLUMN IF NOT EXISTS abonelik_paketleri jsonb;
ALTER TABLE public.cogniti_fiyat_tarifesi_gecmisi ADD COLUMN IF NOT EXISTS abonelik_paketleri jsonb;
CREATE SEQUENCE IF NOT EXISTS public.cogniti_abonelik_paket_no START WITH 5 AS integer;
REVOKE ALL ON SEQUENCE public.cogniti_abonelik_paket_no FROM PUBLIC,anon,authenticated,service_role;

WITH baslangic AS (
 UPDATE public.cogniti_fiyat_tarifesi t SET abonelik_paketleri=(
  SELECT jsonb_agg(jsonb_build_object('id',p.id,'ad','Paket '||p.id,
   'token',(t.degerler->>(p.oneki||'_token_miktari'))::integer,
   'birim',(t.degerler->>(p.oneki||'_token_tl'))::numeric) ORDER BY p.id)
  FROM (VALUES (1,'paket_10k'),(2,'paket_30k'),(3,'paket_75k'),(4,'paket_25k')) AS p(id,oneki)
 ),surum=t.surum+1,guncellendi_at=now()
 WHERE t.tekil AND t.abonelik_paketleri IS NULL
 RETURNING *
)
INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden,abonelik_paketleri)
 SELECT surum,degerler,guncellendi_at,guncelleyen,abonelik_paketleri FROM baslangic;
ALTER TABLE public.cogniti_fiyat_tarifesi ALTER COLUMN abonelik_paketleri SET NOT NULL;

ALTER TABLE public.cogniti_abonelik_siparisleri
 DROP CONSTRAINT IF EXISTS cogniti_abonelik_siparisleri_paket_no_check,
 ADD CONSTRAINT cogniti_abonelik_siparisleri_paket_no_check CHECK(paket_no>0),
 ADD COLUMN IF NOT EXISTS paket_adi text;

CREATE OR REPLACE FUNCTION public.cogniti_abonelik_paket_taslagi_kaydet(p_taslak jsonb,p_mevcut jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $f$
DECLARE
 satir jsonb;
 sonuc jsonb := '[]'::jsonb;
 kimlik integer;
 ad text;
 token numeric;
 birim numeric;
BEGIN
 IF jsonb_typeof(p_taslak) IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Abonelik paketleri geçersiz.' USING ERRCODE='22023';
 END IF;
 FOR satir IN SELECT value FROM jsonb_array_elements(p_taslak) LOOP
  IF jsonb_typeof(satir) IS DISTINCT FROM 'object'
   OR jsonb_typeof(satir->'ad') IS DISTINCT FROM 'string'
   OR jsonb_typeof(satir->'token') IS DISTINCT FROM 'number'
   OR jsonb_typeof(satir->'birim') IS DISTINCT FROM 'number'
   OR coalesce(jsonb_typeof(satir->'id'),'eksik') NOT IN ('null','number') THEN
   RAISE EXCEPTION 'Abonelik paket bilgileri geçersiz.' USING ERRCODE='22023';
  END IF;
  ad:=btrim(satir->>'ad'); token:=(satir->>'token')::numeric; birim:=(satir->>'birim')::numeric;
  IF char_length(ad) NOT BETWEEN 1 AND 80 OR token NOT BETWEEN 15 AND 1000000000 OR trunc(token)<>token
   OR birim NOT BETWEEN 0.01 AND 1000000000 OR round(birim,6)<>birim
   OR round(token*birim*100)>7500000000000000
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(sonuc) p WHERE lower(p->>'ad')=lower(ad)) THEN
   RAISE EXCEPTION 'Abonelik paket bilgileri geçersiz veya paket adı tekrarlı.' USING ERRCODE='22023';
  END IF;
  IF satir->'id'='null'::jsonb THEN
   kimlik:=nextval('public.cogniti_abonelik_paket_no');
  ELSE
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_mevcut) p WHERE p->'id'=satir->'id')
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(sonuc) p WHERE p->'id'=satir->'id') THEN
    RAISE EXCEPTION 'Abonelik paket kimliği geçersiz.' USING ERRCODE='22023';
   END IF;
   kimlik:=(satir->>'id')::integer;
  END IF;
  sonuc:=sonuc||jsonb_build_array(jsonb_build_object('id',kimlik,'ad',ad,'token',token,'birim',birim));
 END LOOP;
 RETURN sonuc;
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_abonelik_paketlerini_sun(p_liste jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $f$
 SELECT coalesce(jsonb_agg(p || jsonb_build_object('aylik',(p->>'token')::numeric*(p->>'birim')::numeric)
  ORDER BY sira),'[]'::jsonb)
 FROM jsonb_array_elements(p_liste) WITH ORDINALITY AS a(p,sira);
$f$;
REVOKE ALL ON FUNCTION public.cogniti_abonelik_paket_taslagi_kaydet(jsonb,jsonb),
 public.cogniti_abonelik_paketlerini_sun(jsonb) FROM PUBLIC,anon,authenticated,service_role;


DROP FUNCTION IF EXISTS public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer);

CREATE OR REPLACE FUNCTION public.cogniti_fiyat_tarifesi_yonet(
 p_admin_id uuid, p_degerler jsonb, p_beklenen_surum integer, p_abonelik_paketleri jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE t public.cogniti_fiyat_tarifesi%ROWTYPE; d jsonb; viva_tl numeric; yeni_paketler jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin_id AND rol='admin' AND aktif_mi=true) THEN
  RAISE EXCEPTION 'Fiyat yönetimi yetkiniz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 IF p_degerler IS NULL THEN
  IF p_beklenen_surum IS NOT NULL OR p_abonelik_paketleri IS NOT NULL THEN RAISE EXCEPTION 'Fiyat bilgileri eksik.' USING ERRCODE='22023'; END IF;
  SELECT * INTO STRICT t FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 ELSE
  IF NOT public.cogniti_fiyat_degerleri_gecerli(p_degerler) THEN RAISE EXCEPTION 'Geçersiz fiyat değerleri.' USING ERRCODE='22023'; END IF;
  SELECT * INTO STRICT t FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR UPDATE;
  IF p_beklenen_surum IS DISTINCT FROM t.surum THEN
   RAISE EXCEPTION 'Fiyatlar değişmiş. Yenileyip tekrar deneyin.' USING ERRCODE='40001';
  END IF;
  yeni_paketler:=public.cogniti_abonelik_paket_taslagi_kaydet(p_abonelik_paketleri,t.abonelik_paketleri);
  IF t.degerler IS DISTINCT FROM p_degerler OR t.abonelik_paketleri IS DISTINCT FROM yeni_paketler THEN
   UPDATE public.cogniti_fiyat_tarifesi SET degerler=p_degerler,abonelik_paketleri=yeni_paketler,surum=surum+1,guncellendi_at=now(),guncelleyen=p_admin_id WHERE tekil RETURNING * INTO t;
   INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden,abonelik_paketleri)
    VALUES(t.surum,t.degerler,t.guncellendi_at,p_admin_id,t.abonelik_paketleri);
  END IF;
 END IF;
 d:=t.degerler;
 viva_tl:=(d->>'viva_kisi_dakika_usd')::numeric*(d->>'viva_usd_tl')::numeric*(d->>'viva_satis_katsayisi')::numeric;
 RETURN jsonb_build_object('surum',t.surum,'degerler',d,'sm2',public.cogniti_esnek_fiyat_matrisi(d),'abonelik_paketleri',public.cogniti_abonelik_paketlerini_sun(t.abonelik_paketleri),'hesaplar',jsonb_build_object(
  'viva_kisi_dakika_tl',viva_tl,'viva_kisi_dakika_token',viva_tl/(d->>'kko_token_tl')::numeric,
  'paket_10k_aylik_tl',(d->>'paket_10k_token_miktari')::numeric*(d->>'paket_10k_token_tl')::numeric,
  'paket_30k_aylik_tl',(d->>'paket_30k_token_miktari')::numeric*(d->>'paket_30k_token_tl')::numeric,
  'paket_75k_aylik_tl',(d->>'paket_75k_token_miktari')::numeric*(d->>'paket_75k_token_tl')::numeric,
  'paket_25k_aylik_tl',(d->>'paket_25k_token_miktari')::numeric*(d->>'paket_25k_token_tl')::numeric));
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_sm2_fiyatlari_oku()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE d jsonb; v integer; paketler jsonb;
BEGIN
 SELECT degerler,surum,abonelik_paketleri INTO STRICT d,v,paketler FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 RETURN jsonb_build_object('surum',v,'kko',jsonb_build_object('limit',(d->>'kko_token_miktari')::integer,'birim',(d->>'kko_token_tl')::numeric),'sm2',public.cogniti_esnek_fiyat_matrisi(d),
 'paketler',public.cogniti_abonelik_paketlerini_sun(paketler));
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_abonelik_siparisi_kaydet(
 p_auth_id uuid, p_hesap_turu text, p_paket_no integer, p_aylik_token integer, p_aylik_kurus bigint, p_anahtar uuid, p_baslangic date
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE
 kisi record;
 hesap text;
 onceki public.cogniti_abonelik_siparisleri%ROWTYPE;
 paketler jsonb;
 paket jsonb;
 surum integer;
 token integer;
 birim numeric;
 aylik numeric;
 siparis uuid;
 bugun date := (statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date;
 kalan_gun integer;
 ilk_token integer;
 ilk_kurus bigint;
BEGIN
 IF p_baslangic IS NULL OR p_anahtar IS NULL OR p_paket_no IS NULL OR p_paket_no <= 0
 OR p_aylik_token IS NULL OR p_aylik_token <= 0 OR p_aylik_kurus IS NULL OR p_aylik_kurus <= 0 THEN
  RAISE EXCEPTION 'Geçersiz abonelik siparişi.' USING ERRCODE='22023';
 END IF;
 SELECT u.firma_id, lower(btrim(u.rol)) AS rol, f.firma_admin_aktif INTO kisi
 FROM public.kullanicilar u JOIN public.firmalar f USING (firma_id)
 WHERE u.kullanici_id=p_auth_id AND u.aktif_mi AND f.aktif
 FOR SHARE OF u,f;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sipariş yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF kisi.rol IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per') THEN
  hesap := 'kisisel';
 ELSIF kisi.rol IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm')
    OR (kisi.rol='firma_admin' AND kisi.firma_admin_aktif IS TRUE) THEN
  hesap := 'firma_ortak';
 END IF;
 IF hesap IS NULL OR hesap IS DISTINCT FROM p_hesap_turu THEN
  RAISE EXCEPTION 'Bu hesap için sipariş yetkiniz yok.' USING ERRCODE='42501';
 END IF;

 PERFORM pg_advisory_xact_lock(hashtextextended('cogniti-abonelik:' || p_auth_id::text || ':' || p_anahtar::text,0));
 SELECT * INTO onceki FROM public.cogniti_abonelik_siparisleri
 WHERE siparis_veren_id=p_auth_id AND islem_anahtari=p_anahtar;
 IF FOUND THEN
  IF onceki.firma_id IS DISTINCT FROM kisi.firma_id OR onceki.hesap_turu IS DISTINCT FROM hesap
     OR (onceki.created_at AT TIME ZONE 'Europe/Istanbul')::date IS DISTINCT FROM p_baslangic
     OR onceki.paket_no <> p_paket_no OR onceki.aylik_token <> p_aylik_token OR onceki.aylik_kurus <> p_aylik_kurus THEN
   RAISE EXCEPTION 'İşlem anahtarı başka bir siparişe ait.' USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('siparis_id',onceki.siparis_id);
 END IF;

 IF p_baslangic <> bugun THEN
  RAISE EXCEPTION 'İlk dönem tarihi değişti.' USING ERRCODE='P0001';
 END IF;

 SELECT t.abonelik_paketleri,t.surum INTO STRICT paketler,surum
 FROM public.cogniti_fiyat_tarifesi t WHERE t.tekil FOR SHARE;
 SELECT p INTO paket FROM jsonb_array_elements(paketler) p WHERE (p->>'id')::integer=p_paket_no;
 IF NOT FOUND THEN
  RAISE EXCEPTION 'Abonelik paketi artık satışta değil.' USING ERRCODE='P0001';
 END IF;
 token := (paket->>'token')::integer;
 birim := (paket->>'birim')::numeric;
 aylik := round(token * birim * 100);
 IF token IS DISTINCT FROM p_aylik_token OR aylik IS DISTINCT FROM p_aylik_kurus THEN
  RAISE EXCEPTION 'Abonelik paketi güncellendi.' USING ERRCODE='P0001';
 END IF;

 kalan_gun := least(30,(date_trunc('month',bugun::timestamp)+interval '1 month')::date-bugun);
 ilk_token := round(token::numeric*kalan_gun/30)::integer;
 ilk_kurus := round(aylik*kalan_gun/30)::bigint;
 IF ilk_token <= 0 THEN
  RAISE EXCEPTION 'İlk dönem token adedi geçersiz.' USING ERRCODE='22023';
 END IF;

 INSERT INTO public.cogniti_abonelik_siparisleri (
  firma_id,siparis_veren_id,hesap_turu,sahip_id,paket_no,aylik_token,birim_fiyat,aylik_kurus,kdv_kurus,tarife_surumu,islem_anahtari,
  ilk_donem_gun,ilk_donem_token,ilk_donem_kurus,ilk_donem_kdv_kurus,paket_adi
 ) VALUES (
  kisi.firma_id,p_auth_id,hesap,CASE WHEN hesap='kisisel' THEN p_auth_id END,
  p_paket_no,token,birim,aylik,round(aylik::numeric / 5)::bigint,surum,p_anahtar,
  kalan_gun,ilk_token,ilk_kurus,round(ilk_kurus::numeric/5)::bigint,paket->>'ad'
 ) RETURNING siparis_id INTO siparis;
 RETURN jsonb_build_object('siparis_id',siparis);
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer,jsonb),
 public.cogniti_sm2_fiyatlari_oku(),
 public.cogniti_abonelik_siparisi_kaydet(uuid,text,integer,integer,bigint,uuid,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer,jsonb),
 public.cogniti_sm2_fiyatlari_oku(),
 public.cogniti_abonelik_siparisi_kaydet(uuid,text,integer,integer,bigint,uuid,date) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_abonelik_paket_yonetimi_kuruldu;
