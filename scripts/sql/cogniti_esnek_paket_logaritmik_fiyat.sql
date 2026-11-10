-- Kullanıcı çalıştıracak. Ön koşul: güncel merkezi tarife, Planlama Aracı ve Esnek Paket sipariş kurulumu.
BEGIN;
LOCK TABLE public.cogniti_fiyat_tarifesi IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION public.cogniti_fiyat_degerleri_gecerli(p_degerler jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $f$
DECLARE anahtar text; deger jsonb; sayi numeric; anahtarlar text[] := ARRAY['kko_token_miktari','kko_asim_tl','kko_token_tl','paket_10k_token_miktari','paket_10k_token_tl','paket_10k_asim_tl','paket_30k_token_miktari','paket_30k_token_tl','paket_30k_asim_tl','paket_75k_token_miktari','paket_75k_token_tl','paket_75k_asim_tl','uretim_video_tl','uretim_podcast_tl','uretim_brosur_tl','uretim_literatur_tl','banner_haftalik_token','viva_kisi_dakika_usd','viva_usd_tl','viva_satis_katsayisi','paket_25k_token_miktari','paket_25k_token_tl','esnek_2500_token_tl','esnek_50000_token_tl']::text[];
BEGIN
 IF p_degerler IS NULL OR jsonb_typeof(p_degerler) <> 'object' THEN RETURN false; END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(p_degerler)) <> cardinality(anahtarlar) THEN RETURN false; END IF;
 FOREACH anahtar IN ARRAY anahtarlar LOOP
  IF NOT p_degerler ? anahtar THEN RETURN false; END IF;
  deger := p_degerler->anahtar;
  IF anahtar='uretim_literatur_tl' AND deger='null'::jsonb THEN CONTINUE; END IF;
  IF jsonb_typeof(deger) <> 'number' THEN RETURN false; END IF;
  sayi := deger::text::numeric;
  IF (CASE WHEN anahtar='kko_asim_tl' THEN sayi < 0 ELSE sayi <= 0 END) OR sayi > 1000000000 OR sayi <> round(sayi,6)
    OR (anahtar IN ('esnek_2500_token_tl','esnek_50000_token_tl') AND sayi <> round(sayi,2))
    OR (anahtar IN ('kko_token_miktari','banner_haftalik_token','paket_10k_token_miktari','paket_30k_token_miktari','paket_75k_token_miktari','paket_25k_token_miktari') AND sayi <> trunc(sayi)) THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END;
$f$;

DO $f$
DECLARE t public.cogniti_fiyat_tarifesi%ROWTYPE;
BEGIN
 UPDATE public.cogniti_fiyat_tarifesi
 SET degerler='{"esnek_2500_token_tl":5.50,"esnek_50000_token_tl":2.75}'::jsonb || degerler,
     surum=surum+1,guncellendi_at=now()
 WHERE tekil AND NOT (degerler ?& ARRAY['esnek_2500_token_tl','esnek_50000_token_tl'])
 RETURNING * INTO t;
 IF FOUND THEN
  INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden)
  VALUES(t.surum,t.degerler,t.guncellendi_at,t.guncelleyen);
 END IF;
 SELECT * INTO STRICT t FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 IF NOT public.cogniti_fiyat_degerleri_gecerli(t.degerler) THEN
  RAISE EXCEPTION 'Paket 2 tarifesi geçersiz.';
 END IF;
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_esnek_birim_fiyati(p_adet integer,p_tarife jsonb)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path='' AS $f$
 SELECT CASE WHEN p_adet BETWEEN 2500 AND 50000 AND (
    (p_adet <= 10000 AND p_adet % 500 = 0) OR (p_adet > 10000 AND p_adet % 1000 = 0)
  ) THEN round(
    (p_tarife->>'esnek_2500_token_tl')::numeric -
    ((p_tarife->>'esnek_2500_token_tl')::numeric - (p_tarife->>'esnek_50000_token_tl')::numeric)
      / ln(50000::numeric / 2500) * ln(p_adet::numeric / 2500),2)
  END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_esnek_fiyat_matrisi(p_tarife jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $f$
 SELECT jsonb_agg(jsonb_build_object(
  'token_adedi',adet,'ay',0,'birim_fiyat',fiyat,
  'katsayi',fiyat / (p_tarife->>'kko_token_tl')::numeric
 ) ORDER BY adet)
 FROM (
  SELECT adet, public.cogniti_esnek_birim_fiyati(adet,p_tarife) AS fiyat
  FROM (SELECT generate_series(2500,10000,500) AS adet UNION ALL SELECT generate_series(11000,50000,1000)) a
 ) fiyatlar;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_birim_fiyati(integer,jsonb),
 public.cogniti_esnek_fiyat_matrisi(jsonb) FROM PUBLIC,anon,authenticated,service_role;


CREATE OR REPLACE FUNCTION public.cogniti_fiyat_tarifesi_yonet(
 p_admin_id uuid, p_degerler jsonb DEFAULT NULL, p_beklenen_surum integer DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE t public.cogniti_fiyat_tarifesi%ROWTYPE; d jsonb; viva_tl numeric;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin_id AND rol='admin' AND aktif_mi=true) THEN
  RAISE EXCEPTION 'Fiyat yönetimi yetkiniz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 IF p_degerler IS NULL THEN
  IF p_beklenen_surum IS NOT NULL THEN RAISE EXCEPTION 'Fiyat bilgileri eksik.' USING ERRCODE='22023'; END IF;
  SELECT * INTO STRICT t FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 ELSE
  IF NOT public.cogniti_fiyat_degerleri_gecerli(p_degerler) THEN RAISE EXCEPTION 'Geçersiz fiyat değerleri.' USING ERRCODE='22023'; END IF;
  SELECT * INTO STRICT t FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR UPDATE;
  IF p_beklenen_surum IS DISTINCT FROM t.surum THEN
   RAISE EXCEPTION 'Fiyatlar değişmiş. Yenileyip tekrar deneyin.' USING ERRCODE='40001';
  END IF;
  IF t.degerler IS DISTINCT FROM p_degerler THEN
   UPDATE public.cogniti_fiyat_tarifesi SET degerler=p_degerler,surum=surum+1,guncellendi_at=now(),guncelleyen=p_admin_id WHERE tekil RETURNING * INTO t;
   INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden)
    VALUES(t.surum,t.degerler,t.guncellendi_at,p_admin_id);
  END IF;
 END IF;
 d:=t.degerler;
 viva_tl:=(d->>'viva_kisi_dakika_usd')::numeric*(d->>'viva_usd_tl')::numeric*(d->>'viva_satis_katsayisi')::numeric;
 RETURN jsonb_build_object('surum',t.surum,'degerler',d,'sm2',public.cogniti_esnek_fiyat_matrisi(d),'hesaplar',jsonb_build_object(
  'viva_kisi_dakika_tl',viva_tl,'viva_kisi_dakika_token',viva_tl/(d->>'kko_token_tl')::numeric,
  'paket_10k_aylik_tl',(d->>'paket_10k_token_miktari')::numeric*(d->>'paket_10k_token_tl')::numeric,
  'paket_30k_aylik_tl',(d->>'paket_30k_token_miktari')::numeric*(d->>'paket_30k_token_tl')::numeric,
  'paket_75k_aylik_tl',(d->>'paket_75k_token_miktari')::numeric*(d->>'paket_75k_token_tl')::numeric,
  'paket_25k_aylik_tl',(d->>'paket_25k_token_miktari')::numeric*(d->>'paket_25k_token_tl')::numeric));
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_sm2_fiyatlari_oku()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE d jsonb; v integer;
BEGIN
 SELECT degerler,surum INTO STRICT d,v FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 RETURN jsonb_build_object('surum',v,'kko',jsonb_build_object('limit',(d->>'kko_token_miktari')::integer,'birim',(d->>'kko_token_tl')::numeric),'sm2',public.cogniti_esnek_fiyat_matrisi(d),
 'paketler',jsonb_build_array(
 jsonb_build_object('ad','Paket 1','token',(d->>'paket_10k_token_miktari')::numeric,'birim',(d->>'paket_10k_token_tl')::numeric,'aylik',(d->>'paket_10k_token_miktari')::numeric*(d->>'paket_10k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 2','token',(d->>'paket_30k_token_miktari')::numeric,'birim',(d->>'paket_30k_token_tl')::numeric,'aylik',(d->>'paket_30k_token_miktari')::numeric*(d->>'paket_30k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 3','token',(d->>'paket_75k_token_miktari')::numeric,'birim',(d->>'paket_75k_token_tl')::numeric,'aylik',(d->>'paket_75k_token_miktari')::numeric*(d->>'paket_75k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 4','token',(d->>'paket_25k_token_miktari')::numeric,'birim',(d->>'paket_25k_token_tl')::numeric,'aylik',(d->>'paket_25k_token_miktari')::numeric*(d->>'paket_25k_token_tl')::numeric)));
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_esnek_paket_siparis_olustur(
 p_auth_id uuid,p_token_adedi integer,p_tarife_surumu integer,p_birim_fiyat numeric,p_anahtar uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record; s public.cogniti_esnek_paket_siparisleri%ROWTYPE; v_tur text; v_sahip uuid;
 v_bakiye uuid; v_surum integer; v_degerler jsonb; v_birim numeric; v_son timestamptz;
BEGIN
 IF p_auth_id IS NULL OR p_anahtar IS NULL OR p_token_adedi IS NULL OR p_token_adedi<=0
  OR p_tarife_surumu IS NULL OR p_tarife_surumu<=0 OR p_birim_fiyat IS NULL
  OR p_birim_fiyat::text IN ('NaN','Infinity','-Infinity') OR p_birim_fiyat<=0 OR p_birim_fiyat>1000000000
  OR p_birim_fiyat<>round(p_birim_fiyat,2) THEN
  RAISE EXCEPTION 'Sipariş bilgileri geçersiz.' USING ERRCODE='22023';
 END IF;
 -- Kimlik oturumdan gelir; rol, firma ve sahiplik istemciden alınmaz.
 SELECT u.kullanici_id,u.firma_id,lower(btrim(u.rol)) AS rol,u.ad,u.soyad INTO k
 FROM public.kullanicilar u JOIN public.firmalar f ON f.firma_id=u.firma_id
 WHERE u.kullanici_id=p_auth_id AND u.aktif_mi=true AND f.aktif=true FOR SHARE OF u,f;
 IF NOT FOUND THEN RAISE EXCEPTION 'Satın alma yetkiniz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF k.rol IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per') THEN
  v_tur:='kisisel'; v_sahip:=k.kullanici_id;
 ELSIF k.rol IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin') THEN
  v_tur:='firma_ortak'; v_sahip:=NULL;
 ELSE
  RAISE EXCEPTION 'Satın alma yetkiniz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 -- Aynı kişinin aynı onayı eş zamanlı gelse de tek sipariş ve tek yükleme.
 PERFORM pg_advisory_xact_lock(hashtextextended('cogniti-esnek-siparis:'||p_auth_id::text||':'||p_anahtar::text,0));
 SELECT * INTO s FROM public.cogniti_esnek_paket_siparisleri
 WHERE satin_alan_id=p_auth_id AND islem_anahtari=p_anahtar;
 IF FOUND THEN
  IF s.firma_id<>k.firma_id OR s.token_adedi<>p_token_adedi OR s.tarife_surumu<>p_tarife_surumu OR s.birim_fiyat<>p_birim_fiyat THEN
   RAISE EXCEPTION 'İşlem anahtarı farklı siparişte kullanılmış.' USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('siparis_id',s.siparis_id,'yeniden_deneme',true);
 END IF;
 -- Fiyat ve sürüm satın alma anında sunucuda doğrulanır. Değişmiş fiyat için tekrar onay gerekir.
 SELECT surum,degerler INTO v_surum,v_degerler FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR SHARE;
 v_birim:=public.cogniti_esnek_birim_fiyati(p_token_adedi,v_degerler);
 IF v_birim IS NULL OR v_birim<=0 OR v_birim::text IN ('NaN','Infinity','-Infinity') OR v_surum IS NULL THEN
  RAISE EXCEPTION 'Esnek Paket fiyatı bulunamadı.' USING ERRCODE='22023';
 END IF;
 IF v_surum<>p_tarife_surumu OR v_birim<>p_birim_fiyat THEN
  RAISE EXCEPTION 'Fiyat güncellendi. Güncel tutarı yeniden onaylayın.' USING ERRCODE='P0001';
 END IF;
 INSERT INTO public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_turu,sahip_id)
 VALUES(k.firma_id,v_tur,v_sahip) ON CONFLICT DO NOTHING;
 SELECT bakiye_id INTO STRICT v_bakiye FROM public.cogniti_satin_alma_bakiyeleri
 WHERE firma_id=k.firma_id AND bakiye_turu=v_tur AND sahip_id IS NOT DISTINCT FROM v_sahip FOR UPDATE;
 INSERT INTO public.cogniti_esnek_paket_siparisleri(firma_id,bakiye_id,satin_alan_id,satin_alan_rol,satin_alan_ad_soyad,token_adedi,birim_fiyat,tarife_surumu,islem_anahtari)
 VALUES(k.firma_id,v_bakiye,k.kullanici_id,k.rol,concat_ws(' ',k.ad,k.soyad),p_token_adedi,v_birim,v_surum,p_anahtar)
 RETURNING * INTO s;
 -- 31 Aralık sonuna kadar: takip eden yılın 1 Ocak Türkiye gece yarısı hariç.
 v_son:=make_date(extract(year FROM statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::integer+1,1,1)::timestamp AT TIME ZONE 'Europe/Istanbul';
 INSERT INTO public.cogniti_esnek_paket_yuklemeleri(siparis_id,firma_id,bakiye_id,miktar,kalan,son_kullanim_at)
 VALUES(s.siparis_id,k.firma_id,v_bakiye,p_token_adedi,p_token_adedi,v_son);
 RETURN jsonb_build_object('siparis_id',s.siparis_id,'yeniden_deneme',false);
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer),
 public.cogniti_sm2_fiyatlari_oku(),
 public.cogniti_esnek_paket_siparis_olustur(uuid,integer,integer,numeric,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer),
 public.cogniti_sm2_fiyatlari_oku(),
 public.cogniti_esnek_paket_siparis_olustur(uuid,integer,integer,numeric,uuid) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_esnek_paket_logaritmik_fiyat_kuruldu;
