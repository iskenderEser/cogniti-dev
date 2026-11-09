-- KULLANICI ÇALIŞTIRACAK. Kaynak: cogniti_fiyat_tablosu.xlsx / DB Aktarim, yalnız esnek satırları.
-- 37 adet × peşin/1/2/3 ay = 148 fiyat. KKÖ ve taahhütlü/Süper Paket değerleri değişmez.
-- Ön koşul: merkezi tarife, SM2 oranları ve fiyat okuma RPC kurulu olmalıdır.
-- KKÖ bağlantısı korunur: Excel fiyatları 9,90 TL referans KKÖ'ye oranlanır.
BEGIN;
LOCK TABLE public.cogniti_fiyat_tarifesi IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.cogniti_sm2_fiyat_oranlari IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.cogniti_sm2_fiyat_oranlari DROP CONSTRAINT IF EXISTS cogniti_sm2_fiyat_oranlari_token_adedi_check;
ALTER TABLE public.cogniti_sm2_fiyat_oranlari DROP CONSTRAINT IF EXISTS cogniti_sm2_fiyat_oranlari_ay_check;
CREATE TEMP TABLE esnek_yeni_fiyatlar(token_adedi integer,ay integer,fiyat numeric,PRIMARY KEY(token_adedi,ay)) ON COMMIT DROP;
INSERT INTO esnek_yeni_fiyatlar VALUES
 (2500,0,9.00),
 (2500,1,9.27),
 (2500,2,9.41),
 (2500,3,9.54),
 (3000,0,8.82),
 (3000,1,9.09),
 (3000,2,9.22),
 (3000,3,9.35),
 (3500,0,8.67),
 (3500,1,8.93),
 (3500,2,9.06),
 (3500,3,9.19),
 (4000,0,8.54),
 (4000,1,8.80),
 (4000,2,8.93),
 (4000,3,9.05),
 (4500,0,8.43),
 (4500,1,8.68),
 (4500,2,8.81),
 (4500,3,8.93),
 (5000,0,8.32),
 (5000,1,8.57),
 (5000,2,8.70),
 (5000,3,8.82),
 (5500,0,8.23),
 (5500,1,8.48),
 (5500,2,8.60),
 (5500,3,8.72),
 (6000,0,8.15),
 (6000,1,8.39),
 (6000,2,8.51),
 (6000,3,8.63),
 (6500,0,8.07),
 (6500,1,8.31),
 (6500,2,8.43),
 (6500,3,8.55),
 (7000,0,8.00),
 (7000,1,8.24),
 (7000,2,8.36),
 (7000,3,8.48),
 (7500,0,7.93),
 (7500,1,8.17),
 (7500,2,8.29),
 (7500,3,8.40),
 (8000,0,7.87),
 (8000,1,8.10),
 (8000,2,8.22),
 (8000,3,8.34),
 (8500,0,7.81),
 (8500,1,8.04),
 (8500,2,8.16),
 (8500,3,8.27),
 (9000,0,7.75),
 (9000,1,7.98),
 (9000,2,8.10),
 (9000,3,8.22),
 (9500,0,7.70),
 (9500,1,7.93),
 (9500,2,8.04),
 (9500,3,8.16),
 (10000,0,7.65),
 (10000,1,7.88),
 (10000,2,7.99),
 (10000,3,8.11),
 (12500,0,7.43),
 (12500,1,7.65),
 (12500,2,7.76),
 (12500,3,7.88),
 (15000,0,7.25),
 (15000,1,7.47),
 (15000,2,7.58),
 (15000,3,7.69),
 (17500,0,7.10),
 (17500,1,7.31),
 (17500,2,7.42),
 (17500,3,7.53),
 (20000,0,6.97),
 (20000,1,7.18),
 (20000,2,7.29),
 (20000,3,7.39),
 (22500,0,6.86),
 (22500,1,7.06),
 (22500,2,7.17),
 (22500,3,7.27),
 (25000,0,6.75),
 (25000,1,6.96),
 (25000,2,7.06),
 (25000,3,7.16),
 (27500,0,6.66),
 (27500,1,6.86),
 (27500,2,6.96),
 (27500,3,7.06),
 (30000,0,6.58),
 (30000,1,6.77),
 (30000,2,6.87),
 (30000,3,6.97),
 (35000,0,6.43),
 (35000,1,6.62),
 (35000,2,6.71),
 (35000,3,6.81),
 (40000,0,6.30),
 (40000,1,6.48),
 (40000,2,6.58),
 (40000,3,6.67),
 (45000,0,6.18),
 (45000,1,6.37),
 (45000,2,6.46),
 (45000,3,6.55),
 (50000,0,6.08),
 (50000,1,6.26),
 (50000,2,6.35),
 (50000,3,6.44),
 (55000,0,5.98),
 (55000,1,6.16),
 (55000,2,6.25),
 (55000,3,6.34),
 (60000,0,5.90),
 (60000,1,6.08),
 (60000,2,6.17),
 (60000,3,6.25),
 (75000,0,5.68),
 (75000,1,5.85),
 (75000,2,5.94),
 (75000,3,6.02),
 (87500,0,5.53),
 (87500,1,5.70),
 (87500,2,5.78),
 (87500,3,5.86),
 (100000,0,5.40),
 (100000,1,5.56),
 (100000,2,5.64),
 (100000,3,5.73),
 (112500,0,5.29),
 (112500,1,5.45),
 (112500,2,5.52),
 (112500,3,5.60),
 (125000,0,5.18),
 (125000,1,5.34),
 (125000,2,5.42),
 (125000,3,5.50),
 (137500,0,5.09),
 (137500,1,5.24),
 (137500,2,5.32),
 (137500,3,5.40),
 (150000,0,5.01),
 (150000,1,5.16),
 (150000,2,5.23),
 (150000,3,5.31);
DO $f$
DECLARE silinen integer; yazilan integer;
BEGIN
 IF (SELECT count(*) FROM esnek_yeni_fiyatlar)<>148 THEN RAISE EXCEPTION 'Esnek fiyat listesi eksik.'; END IF;
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
ALTER TABLE public.cogniti_sm2_fiyat_oranlari ADD CONSTRAINT cogniti_sm2_fiyat_oranlari_token_adedi_check CHECK(token_adedi IN (2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,7500,8000,8500,9000,9500,10000,12500,15000,17500,20000,22500,25000,27500,30000,35000,40000,45000,50000,55000,60000,75000,87500,100000,112500,125000,137500,150000));
ALTER TABLE public.cogniti_sm2_fiyat_oranlari ADD CONSTRAINT cogniti_sm2_fiyat_oranlari_ay_check CHECK(ay BETWEEN 0 AND 3);
CREATE OR REPLACE FUNCTION public.cogniti_sm2_fiyat_matrisi(p_kko numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path='' AS $f$
DECLARE sonuc jsonb;
BEGIN
 IF p_kko IS NULL OR p_kko<=0 OR p_kko::text IN ('NaN','Infinity','-Infinity') THEN
  RAISE EXCEPTION 'Geçersiz KKÖ fiyatı.' USING ERRCODE='22023';
 END IF;
 IF (SELECT count(*) FROM public.cogniti_sm2_fiyat_oranlari)<>148 THEN
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
SELECT count(*)=148 AS cogniti_esnek_paket_yeni_liste_yuklendi FROM public.cogniti_sm2_fiyat_oranlari;
