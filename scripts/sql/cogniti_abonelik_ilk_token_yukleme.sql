-- Ön koşul: abonelik siparişi ve rol bazlı KKÖ kurulumları.
BEGIN;

ALTER TABLE public.cogniti_esnek_paket_yuklemeleri
 ADD COLUMN IF NOT EXISTS abonelik_siparis_id uuid REFERENCES public.cogniti_abonelik_siparisleri(siparis_id);

CREATE UNIQUE INDEX IF NOT EXISTS cogniti_abonelik_ilk_yukleme_tek
 ON public.cogniti_esnek_paket_yuklemeleri(abonelik_siparis_id) WHERE abonelik_siparis_id IS NOT NULL;

ALTER TABLE public.cogniti_esnek_paket_yuklemeleri
 DROP CONSTRAINT cogniti_yukleme_kaynak_kontrol,
 ADD CONSTRAINT cogniti_yukleme_kaynak_kontrol CHECK (
  (siparis_id IS NOT NULL AND abonelik_siparis_id IS NULL AND kko_donem IS NULL AND kko_birim_fiyat IS NULL)
  OR (siparis_id IS NULL AND abonelik_siparis_id IS NULL AND kko_donem IS NOT NULL
      AND kko_donem=date_trunc('month',kko_donem)::date AND miktar=1500
      AND kko_birim_fiyat IS NOT NULL AND kko_birim_fiyat>0)
  OR (siparis_id IS NULL AND abonelik_siparis_id IS NOT NULL AND kko_donem IS NULL AND kko_birim_fiyat IS NULL)
 );

CREATE OR REPLACE FUNCTION public.cogniti_abonelik_ilk_token_yukle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE
 hesap_id uuid;
 ay_sonu timestamptz;
BEGIN
 INSERT INTO public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_turu,sahip_id)
 VALUES(NEW.firma_id,NEW.hesap_turu,NEW.sahip_id) ON CONFLICT DO NOTHING;
 SELECT b.bakiye_id INTO STRICT hesap_id FROM public.cogniti_satin_alma_bakiyeleri b
 WHERE b.firma_id=NEW.firma_id AND b.bakiye_turu=NEW.hesap_turu
   AND b.sahip_id IS NOT DISTINCT FROM NEW.sahip_id
 FOR UPDATE;

 UPDATE public.cogniti_kko_hesap_secimleri
 SET etkin=false,kapanma_at=statement_timestamp()
 WHERE bakiye_id=hesap_id AND etkin;

 ay_sonu := (date_trunc('month',NEW.created_at AT TIME ZONE 'Europe/Istanbul') + interval '1 month')
   AT TIME ZONE 'Europe/Istanbul';
 INSERT INTO public.cogniti_esnek_paket_yuklemeleri(
  abonelik_siparis_id,firma_id,bakiye_id,miktar,kalan,son_kullanim_at
 ) VALUES (NEW.siparis_id,NEW.firma_id,hesap_id,NEW.aylik_token,NEW.aylik_token,ay_sonu);
 RETURN NEW;
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_abonelik_ilk_token_yukle() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_abonelik_ilk_token_yukle ON public.cogniti_abonelik_siparisleri;
CREATE TRIGGER trg_cogniti_abonelik_ilk_token_yukle
 AFTER INSERT ON public.cogniti_abonelik_siparisleri
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_abonelik_ilk_token_yukle();

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
    'paket',CASE WHEN coalesce(h.etkin,false) THEN 'kko' WHEN bool_or(y.abonelik_siparis_id IS NOT NULL AND y.son_kullanim_at>statement_timestamp()) THEN 'abonelik' WHEN bool_or(y.siparis_id IS NOT NULL) THEN 'esnek' WHEN bool_or(y.abonelik_siparis_id IS NOT NULL) THEN 'abonelik' ELSE NULL END,
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
COMMIT;
SELECT true AS cogniti_abonelik_ilk_token_yukleme_kuruldu;
