-- KULLANICI ÇALIŞTIRACAK. Ön koşul: merkezi fiyat tarifesi kurulmuş olmalı.
-- Mevcut fiyatları korur; 65 hücrenin KKÖ oranını ilk kurulumda kaydeder.
-- Tekrar çalıştırılması kayıtlı oranları değiştirmez.
BEGIN;
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
SELECT count(*)=65 AS cogniti_sm2_kko_oranlari_hazir FROM public.cogniti_sm2_fiyat_oranlari;
