-- Ön koşul: abonelik siparişi ve ilk token yükleme kurulumu.
BEGIN;
ALTER TABLE public.cogniti_abonelik_siparisleri
 ADD COLUMN IF NOT EXISTS ilk_donem_gun integer CHECK (ilk_donem_gun BETWEEN 1 AND 30),
 ADD COLUMN IF NOT EXISTS ilk_donem_token integer CHECK (ilk_donem_token > 0),
 ADD COLUMN IF NOT EXISTS ilk_donem_kurus bigint CHECK (ilk_donem_kurus >= 0),
 ADD COLUMN IF NOT EXISTS ilk_donem_kdv_kurus bigint CHECK (ilk_donem_kdv_kurus >= 0);

DROP FUNCTION IF EXISTS public.cogniti_abonelik_siparisi_kaydet(uuid,text,integer,integer,bigint,uuid);

CREATE OR REPLACE FUNCTION public.cogniti_abonelik_siparisi_kaydet(
 p_auth_id uuid, p_hesap_turu text, p_paket_no integer, p_aylik_token integer, p_aylik_kurus bigint, p_anahtar uuid, p_baslangic date
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE
 kisi record;
 hesap text;
 onceki public.cogniti_abonelik_siparisleri%ROWTYPE;
 tarife jsonb;
 surum integer;
 onek text;
 token integer;
 birim numeric;
 aylik numeric;
 siparis uuid;
 bugun date := (statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date;
 kalan_gun integer;
 ilk_token integer;
 ilk_kurus bigint;
BEGIN
 IF p_baslangic IS NULL OR p_anahtar IS NULL OR p_paket_no IS NULL OR p_paket_no NOT BETWEEN 1 AND 4
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

 SELECT t.degerler,t.surum INTO STRICT tarife,surum FROM public.cogniti_fiyat_tarifesi t WHERE t.tekil FOR SHARE;
 onek := (ARRAY['paket_10k','paket_30k','paket_75k','paket_25k'])[p_paket_no];
 token := (tarife->>(onek || '_token_miktari'))::integer;
 birim := (tarife->>(onek || '_token_tl'))::numeric;
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
  ilk_donem_gun,ilk_donem_token,ilk_donem_kurus,ilk_donem_kdv_kurus
 ) VALUES (
  kisi.firma_id,p_auth_id,hesap,CASE WHEN hesap='kisisel' THEN p_auth_id END,
  p_paket_no,token,birim,aylik,round(aylik::numeric / 5)::bigint,surum,p_anahtar,
  kalan_gun,ilk_token,ilk_kurus,round(ilk_kurus::numeric/5)::bigint
 ) RETURNING siparis_id INTO siparis;
 RETURN jsonb_build_object('siparis_id',siparis);
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_abonelik_siparisi_kaydet(uuid,text,integer,integer,bigint,uuid,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_abonelik_siparisi_kaydet(uuid,text,integer,integer,bigint,uuid,date) TO service_role;

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
 ) VALUES (NEW.siparis_id,NEW.firma_id,hesap_id,NEW.ilk_donem_token,NEW.ilk_donem_token,ay_sonu);
 RETURN NEW;
END;
$f$;


NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_abonelik_ilk_donem_orani_kuruldu;
