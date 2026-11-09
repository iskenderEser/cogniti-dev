-- KULLANICI ÇALIŞTIRACAK. Ön koşul: merkezi tarife ve son Esnek Paket listesi kurulu.
-- Paket 3: Paket 1–4, aylık token yüklemesi ve aylık fatura fiyat tanımları.
-- Eski Süper/6 aylık paket fiyat görünümü bu dört aylık paketle değiştirilir.
-- Mevcut ilk üç teknik anahtar korunur; dördüncü için iki yeni fiyat alanı eklenir.
-- KKÖ, Esnek Paket, Viva, banner ve eski aşım değerleri değiştirilmez.
-- Bu SQL aylık yükleme cron'u, sipariş, ödeme veya fatura oluşturmaz; fiyat tanımlarını yükler.
BEGIN;
LOCK TABLE public.cogniti_fiyat_tarifesi IN SHARE ROW EXCLUSIVE MODE;
CREATE OR REPLACE FUNCTION public.cogniti_fiyat_degerleri_gecerli(p_degerler jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $f$
DECLARE anahtar text; deger jsonb; sayi numeric; anahtarlar text[] := ARRAY['kko_token_miktari','kko_asim_tl','kko_token_tl','paket_10k_token_miktari','paket_10k_token_tl','paket_10k_asim_tl','paket_30k_token_miktari','paket_30k_token_tl','paket_30k_asim_tl','paket_75k_token_miktari','paket_75k_token_tl','paket_75k_asim_tl','uretim_video_tl','uretim_podcast_tl','uretim_brosur_tl','uretim_literatur_tl','banner_haftalik_token','viva_kisi_dakika_usd','viva_usd_tl','viva_satis_katsayisi','paket_25k_token_miktari','paket_25k_token_tl']::text[];
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
    OR (anahtar IN ('kko_token_miktari','banner_haftalik_token','paket_10k_token_miktari','paket_30k_token_miktari','paket_75k_token_miktari','paket_25k_token_miktari') AND sayi <> trunc(sayi)) THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END;
$f$;
DO $f$
DECLARE yeni jsonb; mevcut public.cogniti_fiyat_tarifesi%ROWTYPE;
BEGIN
 SELECT * INTO STRICT mevcut FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR UPDATE;
 yeni:=mevcut.degerler || '{"paket_10k_token_miktari": 5000, "paket_10k_token_tl": 5.9, "paket_30k_token_miktari": 10000, "paket_30k_token_tl": 4.85, "paket_75k_token_miktari": 15000, "paket_75k_token_tl": 3.9, "paket_25k_token_miktari": 25000, "paket_25k_token_tl": 2.9}'::jsonb;
 IF mevcut.degerler IS DISTINCT FROM yeni THEN
  UPDATE public.cogniti_fiyat_tarifesi SET degerler=yeni,surum=surum+1,guncellendi_at=now() WHERE tekil RETURNING * INTO mevcut;
  INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden)
   VALUES(mevcut.surum,mevcut.degerler,mevcut.guncellendi_at,mevcut.guncelleyen);
 END IF;
END;
$f$;
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
  'paket_75k_aylik_tl',(d->>'paket_75k_token_miktari')::numeric*(d->>'paket_75k_token_tl')::numeric,
  'paket_25k_aylik_tl',(d->>'paket_25k_token_miktari')::numeric*(d->>'paket_25k_token_tl')::numeric));
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_fiyat_tarifesi_yonet(uuid,jsonb,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.cogniti_sm2_fiyatlari_oku()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE d jsonb; v integer;
BEGIN
 SELECT degerler,surum INTO STRICT d,v FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 RETURN jsonb_build_object('surum',v,'kko',jsonb_build_object('limit',(d->>'kko_token_miktari')::integer,'birim',(d->>'kko_token_tl')::numeric),'sm2',public.cogniti_sm2_fiyat_matrisi((d->>'kko_token_tl')::numeric),
 'paketler',jsonb_build_array(
 jsonb_build_object('ad','Paket 1','token',(d->>'paket_10k_token_miktari')::numeric,'birim',(d->>'paket_10k_token_tl')::numeric,'aylik',(d->>'paket_10k_token_miktari')::numeric*(d->>'paket_10k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 2','token',(d->>'paket_30k_token_miktari')::numeric,'birim',(d->>'paket_30k_token_tl')::numeric,'aylik',(d->>'paket_30k_token_miktari')::numeric*(d->>'paket_30k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 3','token',(d->>'paket_75k_token_miktari')::numeric,'birim',(d->>'paket_75k_token_tl')::numeric,'aylik',(d->>'paket_75k_token_miktari')::numeric*(d->>'paket_75k_token_tl')::numeric),
 jsonb_build_object('ad','Paket 4','token',(d->>'paket_25k_token_miktari')::numeric,'birim',(d->>'paket_25k_token_tl')::numeric,'aylik',(d->>'paket_25k_token_miktari')::numeric*(d->>'paket_25k_token_tl')::numeric)));
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_sm2_fiyatlari_oku() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_sm2_fiyatlari_oku() TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_aylik_abonelik_fiyatlari_yuklendi;
