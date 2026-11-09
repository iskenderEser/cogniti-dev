-- Kullanıcı çalıştıracak. Ön koşul: merkezi tarife ve aylık abonelik fiyatları.
BEGIN;
CREATE TABLE IF NOT EXISTS public.cogniti_abonelik_siparisleri (
 siparis_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 siparis_veren_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 hesap_turu text NOT NULL CHECK (hesap_turu IN ('kisisel','firma_ortak')),
 sahip_id uuid REFERENCES public.kullanicilar(kullanici_id),
 paket_no integer NOT NULL CHECK (paket_no BETWEEN 1 AND 4),
 aylik_token integer NOT NULL CHECK (aylik_token > 0),
 birim_fiyat numeric NOT NULL CHECK (birim_fiyat > 0),
 aylik_kurus bigint NOT NULL CHECK (aylik_kurus > 0),
 kdv_kurus bigint NOT NULL CHECK (kdv_kurus >= 0),
 tarife_surumu integer NOT NULL,
 islem_anahtari uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 CHECK ((hesap_turu = 'kisisel' AND sahip_id IS NOT DISTINCT FROM siparis_veren_id)
     OR (hesap_turu = 'firma_ortak' AND sahip_id IS NULL)),
 UNIQUE (siparis_veren_id,islem_anahtari)
);
ALTER TABLE public.cogniti_abonelik_siparisleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_abonelik_siparisleri FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_abonelik_siparisi_kaydet(
 p_auth_id uuid, p_hesap_turu text, p_paket_no integer, p_aylik_token integer, p_aylik_kurus bigint, p_anahtar uuid
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
BEGIN
 IF p_anahtar IS NULL OR p_paket_no IS NULL OR p_paket_no NOT BETWEEN 1 AND 4
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
     OR onceki.paket_no <> p_paket_no OR onceki.aylik_token <> p_aylik_token OR onceki.aylik_kurus <> p_aylik_kurus THEN
   RAISE EXCEPTION 'İşlem anahtarı başka bir siparişe ait.' USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('siparis_id',onceki.siparis_id);
 END IF;

 SELECT t.degerler,t.surum INTO STRICT tarife,surum FROM public.cogniti_fiyat_tarifesi t WHERE t.tekil FOR SHARE;
 onek := (ARRAY['paket_10k','paket_30k','paket_75k','paket_25k'])[p_paket_no];
 token := (tarife->>(onek || '_token_miktari'))::integer;
 birim := (tarife->>(onek || '_token_tl'))::numeric;
 aylik := round(token * birim * 100);
 IF token IS DISTINCT FROM p_aylik_token OR aylik IS DISTINCT FROM p_aylik_kurus THEN
  RAISE EXCEPTION 'Abonelik paketi güncellendi.' USING ERRCODE='P0001';
 END IF;

 INSERT INTO public.cogniti_abonelik_siparisleri (
  firma_id,siparis_veren_id,hesap_turu,sahip_id,paket_no,aylik_token,birim_fiyat,aylik_kurus,kdv_kurus,tarife_surumu,islem_anahtari
 ) VALUES (
  kisi.firma_id,p_auth_id,hesap,CASE WHEN hesap='kisisel' THEN p_auth_id END,
  p_paket_no,token,birim,aylik,round(aylik::numeric / 5)::bigint,surum,p_anahtar
 ) RETURNING siparis_id INTO siparis;
 RETURN jsonb_build_object('siparis_id',siparis);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_abonelik_siparisi_kaydet(uuid,text,integer,integer,bigint,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_abonelik_siparisi_kaydet(uuid,text,integer,integer,bigint,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_abonelik_siparisi_kuruldu;
