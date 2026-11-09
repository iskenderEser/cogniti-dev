-- KULLANICI ÇALIŞTIRACAK. Kaynak: esnek_fiyat_listesi_son.xlsx / Esnek Fiyat!A10:B80.
-- 71 token kademesi, yalnız peşin fiyat. Önceki vade kayıtları kaldırılır. KKÖ ve taahhütlü/Süper Paket değerleri değişmez.
-- Ön koşul: merkezi tarife, SM2 oranları ve fiyat okuma RPC kurulu olmalıdır.
-- KKÖ bağlantısı korunur: Excel fiyatları 9,90 TL referans KKÖ'ye oranlanır.
BEGIN;
LOCK TABLE public.cogniti_fiyat_tarifesi IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.cogniti_sm2_fiyat_oranlari IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.cogniti_sm2_fiyat_oranlari DROP CONSTRAINT IF EXISTS cogniti_sm2_fiyat_oranlari_token_adedi_check;
ALTER TABLE public.cogniti_sm2_fiyat_oranlari DROP CONSTRAINT IF EXISTS cogniti_sm2_fiyat_oranlari_ay_check;
CREATE TEMP TABLE esnek_yeni_fiyatlar(token_adedi integer,ay integer,fiyat numeric,PRIMARY KEY(token_adedi,ay)) ON COMMIT DROP;
INSERT INTO esnek_yeni_fiyatlar VALUES
 (2500,0,8.50),
 (3000,0,8.20),
 (3500,0,7.94),
 (4000,0,7.72),
 (4500,0,7.52),
 (5000,0,7.34),
 (5500,0,7.18),
 (6000,0,7.04),
 (6500,0,6.91),
 (7000,0,6.78),
 (7500,0,6.67),
 (8000,0,6.56),
 (8500,0,6.46),
 (9000,0,6.36),
 (9500,0,6.27),
 (10000,0,6.19),
 (10500,0,6.10),
 (11000,0,6.03),
 (11500,0,5.95),
 (12000,0,5.88),
 (12500,0,5.81),
 (13000,0,5.75),
 (13500,0,5.69),
 (14000,0,5.62),
 (14500,0,5.57),
 (15000,0,5.51),
 (15500,0,5.45),
 (16000,0,5.40),
 (16500,0,5.35),
 (17000,0,5.30),
 (17500,0,5.25),
 (18000,0,5.21),
 (18500,0,5.16),
 (19000,0,5.11),
 (19500,0,5.07),
 (20000,0,5.03),
 (20500,0,4.99),
 (21000,0,4.95),
 (21500,0,4.91),
 (22000,0,4.87),
 (22500,0,4.83),
 (23000,0,4.80),
 (23500,0,4.76),
 (24000,0,4.73),
 (24500,0,4.69),
 (25000,0,4.66),
 (26000,0,4.59),
 (27000,0,4.53),
 (28000,0,4.47),
 (29000,0,4.41),
 (30000,0,4.35),
 (31000,0,4.30),
 (32000,0,4.24),
 (33000,0,4.19),
 (34000,0,4.14),
 (35000,0,4.10),
 (36000,0,4.05),
 (37000,0,4.00),
 (38000,0,3.96),
 (39000,0,3.91),
 (40000,0,3.87),
 (41000,0,3.83),
 (42000,0,3.79),
 (43000,0,3.75),
 (44000,0,3.71),
 (45000,0,3.68),
 (46000,0,3.64),
 (47000,0,3.60),
 (48000,0,3.57),
 (49000,0,3.53),
 (50000,0,3.50);
DO $f$
DECLARE silinen integer; yazilan integer;
BEGIN
 IF (SELECT count(*) FROM esnek_yeni_fiyatlar)<>71 THEN RAISE EXCEPTION 'Esnek fiyat listesi eksik.'; END IF;
 DELETE FROM public.cogniti_sm2_fiyat_oranlari o WHERE NOT EXISTS(
  SELECT 1 FROM esnek_yeni_fiyatlar y WHERE y.token_adedi=o.token_adedi AND y.ay=o.ay);
 GET DIAGNOSTICS silinen=ROW_COUNT;
 INSERT INTO public.cogniti_sm2_fiyat_oranlari AS mevcut
 (token_adedi,ay,referans_kko,referans_birim_fiyat,katsayi)
 SELECT token_adedi,ay,9.90,fiyat,fiyat/9.90 FROM esnek_yeni_fiyatlar
 ON CONFLICT(token_adedi,ay) DO UPDATE SET referans_kko=EXCLUDED.referans_kko,
 referans_birim_fiyat=EXCLUDED.referans_birim_fiyat,katsayi=EXCLUDED.katsayi,kaydedildi_at=now()
 WHERE (mevcut.referans_kko,mevcut.referans_birim_fiyat,mevcut.katsayi)
 IS DISTINCT FROM (EXCLUDED.referans_kko,EXCLUDED.referans_birim_fiyat,EXCLUDED.katsayi);
 GET DIAGNOSTICS yazilan=ROW_COUNT;
 IF silinen+yazilan>0 THEN
  UPDATE public.cogniti_fiyat_tarifesi SET surum=surum+1,guncellendi_at=now() WHERE tekil;
  INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden)
   SELECT surum,degerler,guncellendi_at,guncelleyen FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 END IF;
 IF EXISTS(SELECT 1 FROM esnek_yeni_fiyatlar y LEFT JOIN public.cogniti_sm2_fiyat_oranlari o USING(token_adedi,ay)
  WHERE o.katsayi IS NULL OR round(9.90*o.katsayi,2)<>y.fiyat) THEN RAISE EXCEPTION 'Esnek fiyat doğrulaması başarısız.'; END IF;
END;
$f$;
ALTER TABLE public.cogniti_sm2_fiyat_oranlari ADD CONSTRAINT cogniti_sm2_fiyat_oranlari_token_adedi_check CHECK(token_adedi IN (2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,7500,8000,8500,9000,9500,10000,10500,11000,11500,12000,12500,13000,13500,14000,14500,15000,15500,16000,16500,17000,17500,18000,18500,19000,19500,20000,20500,21000,21500,22000,22500,23000,23500,24000,24500,25000,26000,27000,28000,29000,30000,31000,32000,33000,34000,35000,36000,37000,38000,39000,40000,41000,42000,43000,44000,45000,46000,47000,48000,49000,50000));
ALTER TABLE public.cogniti_sm2_fiyat_oranlari ADD CONSTRAINT cogniti_sm2_fiyat_oranlari_ay_check CHECK(ay = 0);
CREATE OR REPLACE FUNCTION public.cogniti_sm2_fiyat_matrisi(p_kko numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path='' AS $f$
DECLARE sonuc jsonb;
BEGIN
 IF p_kko IS NULL OR p_kko<=0 OR p_kko::text IN ('NaN','Infinity','-Infinity') THEN
  RAISE EXCEPTION 'Geçersiz KKÖ fiyatı.' USING ERRCODE='22023';
 END IF;
 IF (SELECT count(*) FROM public.cogniti_sm2_fiyat_oranlari)<>71 THEN
  RAISE EXCEPTION 'Yeni Esnek Paket listesi eksik.' USING ERRCODE='22023';
 END IF;
 SELECT jsonb_agg(jsonb_build_object('token_adedi',token_adedi,'ay',ay,'katsayi',katsayi,
 'birim_fiyat',round(p_kko*katsayi,2)) ORDER BY token_adedi,ay) INTO sonuc
 FROM public.cogniti_sm2_fiyat_oranlari;
 RETURN sonuc;
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_sm2_fiyat_matrisi(numeric) FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT count(*)=71 AS cogniti_esnek_paket_son_liste_yuklendi FROM public.cogniti_sm2_fiyat_oranlari;
