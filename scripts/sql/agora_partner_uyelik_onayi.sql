-- Agora: ikinci aşama admin üyelik onayı. Tamamını tek parça çalıştırın.
-- Önce üyelik kaydı, ilk giriş onayı ve profil tamamlama SQL'leri kurulmalıdır.
BEGIN;
ALTER TABLE public.agora_is_partnerleri
  ADD COLUMN IF NOT EXISTS uyelik_surum integer NOT NULL DEFAULT 1 CHECK (uyelik_surum > 0),
  ADD COLUMN IF NOT EXISTS uyelik_karar_at timestamptz,
  ADD COLUMN IF NOT EXISTS uyelik_karar_veren uuid;
CREATE TABLE IF NOT EXISTS public.agora_partner_uyelik_gecmisi (
  karar_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
  admin_id uuid NOT NULL,
  onceki_durum text NOT NULL,
  yeni_durum text NOT NULL CHECK (yeni_durum IN ('onaylandi','reddedildi')),
  uyelik_surum integer NOT NULL,
  profil_surum integer NOT NULL,
  karar_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id,uyelik_surum)
);
ALTER TABLE public.agora_partner_uyelik_gecmisi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_uyelik_gecmisi FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.agora_partner_uyelik_basvurulari(p_admin_id uuid,p_durum text DEFAULT 'onay_bekliyor',p_sayfa integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v_toplam integer; v_liste jsonb;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF p_durum IS NULL OR p_durum NOT IN ('onay_bekliyor','onaylandi','reddedildi','tumu') OR p_sayfa IS NULL OR p_sayfa<1 OR p_sayfa>100000 THEN RAISE EXCEPTION 'Geçersiz seçim'; END IF;
  SELECT count(*) INTO v_toplam FROM public.agora_is_partnerleri p JOIN public.agora_partner_profilleri f USING(partner_id)
    WHERE p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu IN ('onay_bekliyor','onaylandi','reddedildi') AND (p_durum='tumu' OR p.uyelik_durumu=p_durum);
  SELECT coalesce(jsonb_agg(to_jsonb(r)-'siralama' ORDER BY r.siralama DESC,r.partner_id),'[]'::jsonb) INTO v_liste FROM (
    SELECT p.partner_id,p.ad_soyad,p.eposta,p.cep_telefonu,p.uyelik_durumu,p.uyelik_surum,p.uyelik_karar_at,
      to_jsonb(f)-'partner_id' AS profil,f.guncellendi_at AS siralama
    FROM public.agora_is_partnerleri p JOIN public.agora_partner_profilleri f USING(partner_id)
    WHERE p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu IN ('onay_bekliyor','onaylandi','reddedildi') AND (p_durum='tumu' OR p.uyelik_durumu=p_durum)
    ORDER BY f.guncellendi_at DESC,p.partner_id LIMIT 20 OFFSET (p_sayfa-1)*20
  ) r;
  RETURN jsonb_build_object('kayitlar',v_liste,'toplam',v_toplam);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_uyelik_profili_oku(p_admin_id uuid,p_partner_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  RETURN (SELECT to_jsonb(f) FROM public.agora_partner_profilleri f JOIN public.agora_is_partnerleri p USING(partner_id)
    WHERE f.partner_id=p_partner_id AND p.ilk_giris_durumu='onaylandi');
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_uyelik_karar(p_admin_id uuid,p_partner_id uuid,p_karar text,p_uyelik_surum integer,p_profil_surum integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v public.agora_is_partnerleri%ROWTYPE; f public.agora_partner_profilleri%ROWTYPE;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF p_karar IS NULL OR p_karar NOT IN ('onaylandi','reddedildi') THEN RAISE EXCEPTION 'Geçersiz karar'; END IF;
  SELECT * INTO v FROM public.agora_is_partnerleri WHERE partner_id=p_partner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'cakisma'; END IF;
  SELECT * INTO f FROM public.agora_partner_profilleri WHERE partner_id=p_partner_id;
  IF NOT FOUND OR v.ilk_giris_durumu<>'onaylandi' OR v.uyelik_durumu NOT IN ('onay_bekliyor','onaylandi','reddedildi')
    OR v.uyelik_durumu=p_karar OR p_uyelik_surum IS NULL OR p_profil_surum IS NULL
    OR v.uyelik_surum<>p_uyelik_surum OR f.surum<>p_profil_surum THEN RETURN 'cakisma'; END IF;
  UPDATE public.agora_is_partnerleri SET uyelik_durumu=p_karar,uyelik_surum=uyelik_surum+1,uyelik_karar_at=now(),uyelik_karar_veren=p_admin_id WHERE partner_id=p_partner_id;
  INSERT INTO public.agora_partner_uyelik_gecmisi(partner_id,admin_id,onceki_durum,yeni_durum,uyelik_surum,profil_surum)
    VALUES(p_partner_id,p_admin_id,v.uyelik_durumu,p_karar,v.uyelik_surum+1,f.surum);
  RETURN 'tamam';
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_profil_kaydet(p_token_ozeti text,p_veri jsonb,p_logo_yolu text,p_surum integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v public.agora_is_partnerleri%ROWTYPE; f public.agora_partner_profilleri%ROWTYPE; v_logo text;
BEGIN
  SELECT p.* INTO v FROM public.agora_is_partnerleri p JOIN public.agora_partner_oturumlari s ON s.partner_id=p.partner_id
    WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi' FOR UPDATE OF p;
  IF NOT FOUND THEN RETURN 'yetkisiz'; END IF;
  IF v.uyelik_durumu='onaylandi' THEN RETURN 'kapali'; END IF;
  SELECT * INTO f FROM public.agora_partner_profilleri WHERE partner_id=v.partner_id;
  IF p_surum IS NULL OR p_surum <> coalesce(f.surum,0) THEN RETURN 'cakisma'; END IF;
  v_logo := coalesce(p_logo_yolu,f.logo_yolu);
  IF v_logo IS NULL OR left(v_logo,37) <> v.partner_id::text||'/' THEN RAISE EXCEPTION 'Logo zorunlu veya geçersiz'; END IF;
  IF jsonb_typeof(p_veri) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Profil bilgileri geçersiz'; END IF;
  INSERT INTO public.agora_partner_profilleri(partner_id,sirket_adi,il_id,ilce_id,adres,vergi_dairesi_kodu,vergi_dairesi,vergi_no,iban,logo_yolu)
  VALUES(v.partner_id,p_veri->>'sirket_adi',(p_veri->>'il_id')::integer,(p_veri->>'ilce_id')::integer,p_veri->>'adres',p_veri->>'vergi_dairesi_kodu',p_veri->>'vergi_dairesi',p_veri->>'vergi_no',p_veri->>'iban',v_logo)
  ON CONFLICT(partner_id) DO UPDATE SET sirket_adi=EXCLUDED.sirket_adi,il_id=EXCLUDED.il_id,ilce_id=EXCLUDED.ilce_id,
    adres=EXCLUDED.adres,vergi_dairesi_kodu=EXCLUDED.vergi_dairesi_kodu,vergi_dairesi=EXCLUDED.vergi_dairesi,
    vergi_no=EXCLUDED.vergi_no,iban=EXCLUDED.iban,logo_yolu=EXCLUDED.logo_yolu,surum=agora_partner_profilleri.surum+1,guncellendi_at=now();
  UPDATE public.agora_is_partnerleri SET uyelik_durumu='onay_bekliyor',uyelik_surum=uyelik_surum+1,uyelik_karar_at=NULL,uyelik_karar_veren=NULL WHERE partner_id=v.partner_id;
  RETURN 'tamam';
END;
$f$;


REVOKE ALL ON FUNCTION public.agora_partner_uyelik_basvurulari(uuid,text,integer),public.agora_partner_uyelik_profili_oku(uuid,uuid),public.agora_partner_uyelik_karar(uuid,uuid,text,integer,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_uyelik_basvurulari(uuid,text,integer),public.agora_partner_uyelik_profili_oku(uuid,uuid),public.agora_partner_uyelik_karar(uuid,uuid,text,integer,integer) TO service_role;
COMMIT;
SELECT (
  to_regclass('public.agora_partner_uyelik_gecmisi') IS NOT NULL
  AND to_regprocedure('public.agora_partner_uyelik_karar(uuid,uuid,text,integer,integer)') IS NOT NULL
  AND to_regprocedure('public.agora_partner_uyelik_basvurulari(uuid,text,integer)') IS NOT NULL
  AND to_regprocedure('public.agora_partner_uyelik_profili_oku(uuid,uuid)') IS NOT NULL
  AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agora_is_partnerleri' AND column_name='uyelik_surum')
  AND NOT has_table_privilege('anon','public.agora_partner_uyelik_gecmisi','SELECT')
  AND NOT has_table_privilege('authenticated','public.agora_partner_uyelik_gecmisi','SELECT')
  AND NOT has_function_privilege('authenticated','public.agora_partner_uyelik_karar(uuid,uuid,text,integer,integer)','EXECUTE')
  AND has_function_privilege('service_role','public.agora_partner_uyelik_karar(uuid,uuid,text,integer,integer)','EXECUTE')
) AS agora_partner_uyelik_onayi_hazir;
