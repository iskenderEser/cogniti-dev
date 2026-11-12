-- KULLANICI ÇALIŞTIRACAK. Bu adım yalnız fiyat yönetimi ve merkezi hesabı kurar.
-- Viva/banner tüketim bağlantıları henüz değiştirilmez. Tekrar kurulum fiyatları sıfırlamaz.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_fiyat_degerleri_gecerli(p_degerler jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $f$
DECLARE anahtar text; deger jsonb; sayi numeric; anahtarlar text[] := ARRAY['kko_token_miktari','kko_asim_tl','kko_token_tl','paket_10k_token_miktari','paket_10k_token_tl','paket_10k_asim_tl','paket_30k_token_miktari','paket_30k_token_tl','paket_30k_asim_tl','paket_75k_token_miktari','paket_75k_token_tl','paket_75k_asim_tl','uretim_video_tl','uretim_podcast_tl','uretim_brosur_tl','uretim_literatur_tl','banner_haftalik_token','viva_kisi_dakika_usd','viva_usd_tl','viva_satis_katsayisi']::text[];
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
    OR (anahtar IN ('kko_token_miktari','banner_haftalik_token','paket_10k_token_miktari','paket_30k_token_miktari','paket_75k_token_miktari') AND sayi <> trunc(sayi)) THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END;
$f$;
CREATE TABLE IF NOT EXISTS public.cogniti_fiyat_tarifesi (
 tekil boolean PRIMARY KEY DEFAULT true CHECK(tekil),
 degerler jsonb NOT NULL CHECK(public.cogniti_fiyat_degerleri_gecerli(degerler)),
 surum integer NOT NULL DEFAULT 1 CHECK(surum>0),
 guncellendi_at timestamptz NOT NULL DEFAULT now(),
 guncelleyen uuid REFERENCES public.kullanicilar(kullanici_id)
);
CREATE TABLE IF NOT EXISTS public.cogniti_fiyat_tarifesi_gecmisi (
 surum integer PRIMARY KEY, degerler jsonb NOT NULL,
 kaydedildi_at timestamptz NOT NULL DEFAULT now(),
 kaydeden uuid REFERENCES public.kullanicilar(kullanici_id)
);
ALTER TABLE public.cogniti_fiyat_tarifesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_fiyat_tarifesi_gecmisi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_fiyat_tarifesi,public.cogniti_fiyat_tarifesi_gecmisi FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO public.cogniti_fiyat_tarifesi(tekil,degerler) VALUES(true,
 '{"kko_token_miktari":1500,"kko_asim_tl":0,"kko_token_tl": 9.9, "paket_10k_token_miktari": 10000, "paket_10k_token_tl": 5.9, "paket_10k_asim_tl": 6.9, "paket_30k_token_miktari": 30000, "paket_30k_token_tl": 4.9, "paket_30k_asim_tl": 5.9, "paket_75k_token_miktari": 75000, "paket_75k_token_tl": 3.9, "paket_75k_asim_tl": 4.9, "uretim_video_tl": 25000, "uretim_podcast_tl": 15000, "uretim_brosur_tl": 10000, "uretim_literatur_tl": null, "banner_haftalik_token": 200, "viva_kisi_dakika_usd": 0.004, "viva_usd_tl": 55, "viva_satis_katsayisi": 1.5}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden)
 SELECT surum,degerler,guncellendi_at,guncelleyen FROM public.cogniti_fiyat_tarifesi ON CONFLICT DO NOTHING;

-- Önceki kurulum varsa fiyatları koru; yalnız eksik paket miktarlarını varsayılanlarla ekle.
WITH eklenen AS (
 UPDATE public.cogniti_fiyat_tarifesi
 SET degerler='{"kko_token_miktari":1500,"kko_asim_tl":0,"paket_10k_token_miktari":10000,"paket_30k_token_miktari":30000,"paket_75k_token_miktari":75000}'::jsonb || degerler,
     surum=surum+1,guncellendi_at=now()
 WHERE NOT (degerler ?& ARRAY['kko_token_miktari','kko_asim_tl','paket_10k_token_miktari','paket_30k_token_miktari','paket_75k_token_miktari'])
 RETURNING *
)
INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden)
 SELECT surum,degerler,guncellendi_at,guncelleyen FROM eklenen;

-- Sonraki entegrasyon adımının kullanacağı merkezi fiyat hesabı; tüketim yapmaz.
-- Viva miktarı kişi-saniye, banner miktarı hafta sayısıdır.
CREATE OR REPLACE FUNCTION public.cogniti_tarife_bedeli_hesapla(p_tur text,p_miktar numeric,p_degerler jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $f$
DECLARE tl numeric; token numeric; kko numeric; usd numeric; kur numeric; katsayi numeric; haftalik numeric;
BEGIN
 IF p_miktar IS NULL OR p_miktar::text IN ('NaN','Infinity','-Infinity') OR p_miktar<0 OR p_miktar>1000000000000 THEN
  RAISE EXCEPTION 'Geçersiz hizmet miktarı.' USING ERRCODE='22023';
 END IF;
 IF p_tur='viva' THEN
  kko:=(p_degerler->>'kko_token_tl')::numeric; usd:=(p_degerler->>'viva_kisi_dakika_usd')::numeric;
  kur:=(p_degerler->>'viva_usd_tl')::numeric; katsayi:=(p_degerler->>'viva_satis_katsayisi')::numeric;
  IF kko IS NULL OR usd IS NULL OR kur IS NULL OR katsayi IS NULL OR kko<=0 OR usd<=0 OR kur<=0 OR katsayi<=0
   OR kko::text IN('NaN','Infinity','-Infinity') OR usd::text IN('NaN','Infinity','-Infinity')
   OR kur::text IN('NaN','Infinity','-Infinity') OR katsayi::text IN('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION 'Viva fiyatları eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  tl:=p_miktar/60*usd*kur*katsayi; token:=round(tl/kko);
 ELSIF p_tur='banner' AND p_miktar IN(1,2) THEN
  haftalik:=(p_degerler->>'banner_haftalik_token')::numeric;
  IF haftalik IS NULL OR haftalik<=0 OR haftalik>1000000000 OR haftalik<>trunc(haftalik) THEN
   RAISE EXCEPTION 'Banner fiyatı eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  kko:=(p_degerler->>'kko_token_tl')::numeric;
  IF kko IS NULL OR kko<=0 OR kko::text IN ('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION 'KKÖ birim fiyatı eksik veya geçersiz.' USING ERRCODE='22023';
  END IF;
  token:=p_miktar*haftalik;
  tl:=round(token*kko,2);
 ELSE RAISE EXCEPTION 'Geçersiz hizmet türü veya hafta.' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('token',token,'hesap_bedeli_tl',tl);
END;
$f$;
CREATE OR REPLACE FUNCTION public.cogniti_hizmet_bedeli_hesapla(p_tur text,p_miktar numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE t public.cogniti_fiyat_tarifesi%ROWTYPE;
BEGIN
 SELECT * INTO STRICT t FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 RETURN public.cogniti_tarife_bedeli_hesapla(p_tur,p_miktar,t.degerler)
  || jsonb_build_object('surum',t.surum,'tur',p_tur,'miktar',p_miktar,'degerler',t.degerler);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_tarife_bedeli_hesapla(text,numeric,jsonb), public.cogniti_fiyat_degerleri_gecerli(jsonb),
 public.cogniti_hizmet_bedeli_hesapla(text,numeric)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_hizmet_bedeli_hesapla(text,numeric) TO service_role;
-- Mevcut yuvarlanmış fiyat / mevcut KKÖ oranı yalnız ilk kurulumda sabitlenir.
CREATE TABLE IF NOT EXISTS public.cogniti_sm2_fiyat_oranlari (
 token_adedi integer NOT NULL CHECK(token_adedi BETWEEN 2500 AND 8500 AND token_adedi % 500=0),
 ay integer NOT NULL CHECK(ay BETWEEN 1 AND 5),
 referans_kko numeric NOT NULL CHECK(referans_kko>0),
 referans_birim_fiyat numeric NOT NULL CHECK(referans_birim_fiyat>0),
 katsayi numeric NOT NULL CHECK(katsayi>0),
 kaydedildi_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(token_adedi,ay)
);
ALTER TABLE public.cogniti_sm2_fiyat_oranlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_sm2_fiyat_oranlari FROM PUBLIC,anon,authenticated,service_role;
LOCK TABLE public.cogniti_fiyat_tarifesi IN SHARE MODE;
INSERT INTO public.cogniti_sm2_fiyat_oranlari(token_adedi,ay,referans_kko,referans_birim_fiyat,katsayi)
 SELECT adet,ay,kko,fiyat,fiyat/kko
 FROM public.cogniti_fiyat_tarifesi t
 CROSS JOIN generate_series(2500,8500,500) AS adet
 CROSS JOIN generate_series(1,5) AS ay
 CROSS JOIN LATERAL (SELECT (t.degerler->>'kko_token_tl')::numeric AS kko,
  (t.degerler->>'paket_10k_token_tl')::numeric AS sabit) d
 CROSS JOIN LATERAL (SELECT round(kko-(kko-sabit)*(0.4*(adet-1500)/8500+0.6*(ay-1)/5),2) AS fiyat) f
 WHERE t.tekil
 ON CONFLICT(token_adedi,ay) DO NOTHING;

CREATE OR REPLACE FUNCTION public.cogniti_sm2_fiyat_matrisi(p_kko numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path='' AS $f$
DECLARE sonuc jsonb;
BEGIN
 IF p_kko IS NULL OR p_kko<=0 OR p_kko::text IN ('NaN','Infinity','-Infinity') THEN
  RAISE EXCEPTION 'Geçersiz KKÖ fiyatı.' USING ERRCODE='22023';
 END IF;
 IF (SELECT count(*) FROM public.cogniti_sm2_fiyat_oranlari)<>65 THEN
  RAISE EXCEPTION 'SM2 oranları eksik.' USING ERRCODE='22023';
 END IF;
 SELECT jsonb_agg(jsonb_build_object('token_adedi',token_adedi,'ay',ay,'katsayi',katsayi,
  'birim_fiyat',round(p_kko*katsayi,2)) ORDER BY token_adedi,ay)
 INTO sonuc FROM public.cogniti_sm2_fiyat_oranlari;
 RETURN sonuc;
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_sm2_fiyat_matrisi(numeric) FROM PUBLIC,anon,authenticated,service_role;

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
 RETURN jsonb_build_object('surum',t.surum,'degerler',d,'sm2',public.cogniti_sm2_fiyat_matrisi((d->>'kko_token_tl')::numeric),'hesaplar',jsonb_build_object(
  'viva_kisi_dakika_tl',viva_tl,'viva_kisi_dakika_token',viva_tl/(d->>'kko_token_tl')::numeric,
  'paket_10k_aylik_tl',(d->>'paket_10k_token_miktari')::numeric*(d->>'paket_10k_token_tl')::numeric,
  'paket_30k_aylik_tl',(d->>'paket_30k_token_miktari')::numeric*(d->>'paket_30k_token_tl')::numeric,
  'paket_75k_aylik_tl',(d->>'paket_75k_token_miktari')::numeric*(d->>'paket_75k_token_tl')::numeric));
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_merkezi_fiyat_tarifesi_hazir;
