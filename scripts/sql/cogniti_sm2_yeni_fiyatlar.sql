-- KULLANICI ÇALIŞTIRACAK. Kullanıcının ilettiği 65 fiyat aynen yüklenir.
-- KKÖ fiyatı değiştirilmez. Oranlar kurulum anındaki kayıtlı KKÖ'ye bağlanır.
-- Tek işlemde uygulanır; aynı değerlerle tekrar çalıştırma sürüm artırmaz.
BEGIN;
CREATE TEMP TABLE sm2_yeni_degerler(token_adedi integer,ay integer,fiyat numeric,PRIMARY KEY(token_adedi,ay)) ON COMMIT DROP;
INSERT INTO sm2_yeni_degerler VALUES
 (2500,1,8.64),
 (2500,2,8.85),
 (2500,3,9.07),
 (2500,4,9.28),
 (2500,5,9.50),
 (3000,1,8.48),
 (3000,2,8.69),
 (3000,3,8.90),
 (3000,4,9.12),
 (3000,5,9.33),
 (3500,1,8.35),
 (3500,2,8.56),
 (3500,3,8.76),
 (3500,4,8.97),
 (3500,5,9.18),
 (4000,1,8.23),
 (4000,2,8.44),
 (4000,3,8.64),
 (4000,4,8.85),
 (4000,5,9.05),
 (4500,1,8.13),
 (4500,2,8.33),
 (4500,3,8.54),
 (4500,4,8.74),
 (4500,5,8.94),
 (5000,1,8.04),
 (5000,2,8.24),
 (5000,3,8.44),
 (5000,4,8.64),
 (5000,5,8.84),
 (5500,1,7.96),
 (5500,2,8.16),
 (5500,3,8.36),
 (5500,4,8.55),
 (5500,5,8.75),
 (6000,1,7.88),
 (6000,2,8.08),
 (6000,3,8.28),
 (6000,4,8.47),
 (6000,5,8.67),
 (6500,1,7.81),
 (6500,2,8.01),
 (6500,3,8.20),
 (6500,4,8.40),
 (6500,5,8.60),
 (7000,1,7.75),
 (7000,2,7.94),
 (7000,3,8.14),
 (7000,4,8.33),
 (7000,5,8.52),
 (7500,1,7.69),
 (7500,2,7.88),
 (7500,3,8.07),
 (7500,4,8.27),
 (7500,5,8.46),
 (8000,1,7.63),
 (8000,2,7.83),
 (8000,3,8.02),
 (8000,4,8.21),
 (8000,5,8.40),
 (8500,1,7.58),
 (8500,2,7.77),
 (8500,3,7.96),
 (8500,4,8.15),
 (8500,5,8.34);
DO $f$
DECLARE kko numeric; degisen integer;
BEGIN
 SELECT (degerler->>'kko_token_tl')::numeric INTO STRICT kko
 FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR UPDATE;
 IF kko IS NULL OR kko<=0 THEN RAISE EXCEPTION 'Kayıtlı KKÖ fiyatı geçersiz.'; END IF;
 INSERT INTO public.cogniti_sm2_fiyat_oranlari AS mevcut
 (token_adedi,ay,referans_kko,referans_birim_fiyat,katsayi)
 SELECT token_adedi,ay,kko,fiyat,fiyat/kko FROM sm2_yeni_degerler
 ON CONFLICT(token_adedi,ay) DO UPDATE SET
 referans_kko=EXCLUDED.referans_kko,referans_birim_fiyat=EXCLUDED.referans_birim_fiyat,
 katsayi=EXCLUDED.katsayi,kaydedildi_at=now()
 WHERE (mevcut.referans_kko,mevcut.referans_birim_fiyat,mevcut.katsayi)
 IS DISTINCT FROM (EXCLUDED.referans_kko,EXCLUDED.referans_birim_fiyat,EXCLUDED.katsayi);
 GET DIAGNOSTICS degisen=ROW_COUNT;
 IF degisen>0 THEN
  UPDATE public.cogniti_fiyat_tarifesi SET surum=surum+1,guncellendi_at=now() WHERE tekil;
  INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi(surum,degerler,kaydedildi_at,kaydeden)
   SELECT surum,degerler,guncellendi_at,guncelleyen FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 END IF;
 IF EXISTS(SELECT 1 FROM sm2_yeni_degerler y LEFT JOIN public.cogniti_sm2_fiyat_oranlari o USING(token_adedi,ay)
  WHERE o.katsayi IS NULL OR round(kko*o.katsayi,2)<>y.fiyat) THEN
  RAISE EXCEPTION 'SM2 fiyat doğrulaması başarısız.';
 END IF;
END;
$f$;
COMMIT;
SELECT true AS cogniti_sm2_yeni_fiyatlar_yuklendi;
