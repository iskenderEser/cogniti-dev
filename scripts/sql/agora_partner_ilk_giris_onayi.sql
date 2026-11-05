-- Agora: admin ilk giriş onayı ve bağımsız partner test oturumu.
-- Önce agora_partner_uyelik_kaydi.sql kurulmuş olmalıdır.
-- Tam dosyayı tek parça çalıştırın. E-posta/test hesabı oluşturmaz.
BEGIN;
ALTER TABLE public.agora_is_partnerleri
  ADD COLUMN IF NOT EXISTS ilk_giris_durumu text NOT NULL DEFAULT 'bekliyor' CHECK (ilk_giris_durumu IN ('bekliyor','onaylandi','reddedildi')),
  ADD COLUMN IF NOT EXISTS uyelik_durumu text NOT NULL DEFAULT 'profil_bekliyor' CHECK (uyelik_durumu IN ('profil_bekliyor','onay_bekliyor','onaylandi','reddedildi')),
  ADD COLUMN IF NOT EXISTS sifre_ozeti text,
  ADD COLUMN IF NOT EXISTS giris_surum integer NOT NULL DEFAULT 1 CHECK (giris_surum > 0),
  ADD COLUMN IF NOT EXISTS karar_at timestamptz,
  ADD COLUMN IF NOT EXISTS karar_veren uuid,
  ADD COLUMN IF NOT EXISTS giris_pencere_at timestamptz,
  ADD COLUMN IF NOT EXISTS giris_deneme integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.agora_partner_onay_gecmisi (
  karar_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
  admin_id uuid NOT NULL,
  onceki_durum text NOT NULL,
  yeni_durum text NOT NULL,
  giris_surum integer NOT NULL,
  karar_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id,giris_surum)
);
CREATE TABLE IF NOT EXISTS public.agora_partner_oturumlari (
  token_ozeti text PRIMARY KEY CHECK (token_ozeti ~ '^[a-f0-9]{64}$'),
  partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
  giris_surum integer NOT NULL,
  bitis_at timestamptz NOT NULL DEFAULT now()+interval '8 hours'
);
CREATE INDEX IF NOT EXISTS agora_partner_oturum_partner ON public.agora_partner_oturumlari(partner_id);
CREATE INDEX IF NOT EXISTS agora_partner_basvuru_sirasi ON public.agora_is_partnerleri(ilk_giris_durumu,olusturuldu_at DESC,partner_id);
ALTER TABLE public.agora_partner_onay_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_partner_oturumlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.agora_is_partnerleri, public.agora_partner_onay_gecmisi, public.agora_partner_oturumlari FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.agora_partner_admin_dogrula(p_admin_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin_id AND rol='admin' AND aktif_mi=true) THEN
    RAISE EXCEPTION 'Yetkisiz işlem' USING ERRCODE='42501';
  END IF;
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_basvurulari(p_admin_id uuid,p_durum text DEFAULT 'bekliyor',p_sayfa integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v_liste jsonb; v_toplam integer;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF p_durum IS NULL OR p_durum NOT IN ('bekliyor','onaylandi','reddedildi','tumu') OR p_sayfa IS NULL OR p_sayfa<1 OR p_sayfa>100000 THEN RAISE EXCEPTION 'Geçersiz seçim'; END IF;
  SELECT count(*) INTO v_toplam FROM public.agora_is_partnerleri WHERE p_durum='tumu' OR ilk_giris_durumu=p_durum;
  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.olusturuldu_at DESC,r.partner_id),'[]'::jsonb) INTO v_liste FROM (
    SELECT partner_id,ad_soyad,eposta,cep_telefonu,olusturuldu_at,ilk_giris_durumu,karar_at,giris_surum
    FROM public.agora_is_partnerleri WHERE p_durum='tumu' OR ilk_giris_durumu=p_durum
    ORDER BY olusturuldu_at DESC,partner_id LIMIT 20 OFFSET (p_sayfa-1)*20
  ) r;
  RETURN jsonb_build_object('kayitlar',v_liste,'toplam',v_toplam);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_ilk_giris_karar(p_admin_id uuid,p_partner_id uuid,p_karar text,p_surum integer,p_sifre_ozeti text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v public.agora_is_partnerleri%ROWTYPE;
BEGIN
  PERFORM public.agora_partner_admin_dogrula(p_admin_id);
  IF p_karar IS NULL OR p_karar NOT IN ('onaylandi','reddedildi') THEN RAISE EXCEPTION 'Geçersiz karar'; END IF;
  IF p_karar='onaylandi' AND (p_sifre_ozeti IS NULL OR p_sifre_ozeti !~ '^scrypt\$32768\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$') THEN RAISE EXCEPTION 'Şifre özeti zorunlu'; END IF;
  SELECT * INTO v FROM public.agora_is_partnerleri WHERE partner_id=p_partner_id FOR UPDATE;
  IF NOT FOUND OR p_surum IS NULL OR v.giris_surum<>p_surum OR v.ilk_giris_durumu=p_karar THEN RETURN 'cakisma'; END IF;
  UPDATE public.agora_is_partnerleri SET ilk_giris_durumu=p_karar,
    sifre_ozeti=CASE WHEN p_karar='onaylandi' THEN p_sifre_ozeti ELSE NULL END,
    giris_surum=giris_surum+1,karar_at=now(),karar_veren=p_admin_id,giris_deneme=0,giris_pencere_at=NULL
    WHERE partner_id=p_partner_id;
  INSERT INTO public.agora_partner_onay_gecmisi(partner_id,admin_id,onceki_durum,yeni_durum,giris_surum)
    VALUES(p_partner_id,p_admin_id,v.ilk_giris_durumu,p_karar,v.giris_surum+1);
  DELETE FROM public.agora_partner_oturumlari WHERE partner_id=p_partner_id;
  RETURN 'tamam';
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_giris_hazirla(p_eposta text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v public.agora_is_partnerleri%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.agora_is_partnerleri WHERE eposta=p_eposta FOR UPDATE;
  IF NOT FOUND OR v.ilk_giris_durumu<>'onaylandi' OR v.sifre_ozeti IS NULL THEN RETURN NULL; END IF;
  IF v.giris_pencere_at IS NULL OR v.giris_pencere_at<=now()-interval '15 minutes' THEN
    UPDATE public.agora_is_partnerleri SET giris_pencere_at=now(),giris_deneme=1 WHERE partner_id=v.partner_id;
  ELSE
    IF v.giris_deneme>=5 THEN RETURN NULL; END IF;
    UPDATE public.agora_is_partnerleri SET giris_deneme=giris_deneme+1 WHERE partner_id=v.partner_id;
  END IF;
  RETURN jsonb_build_object('partner_id',v.partner_id,'sifre_ozeti',v.sifre_ozeti,'giris_surum',v.giris_surum);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_oturum_ac(p_partner_id uuid,p_surum integer,p_token_ozeti text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $f$
DECLARE v public.agora_is_partnerleri%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.agora_is_partnerleri WHERE partner_id=p_partner_id FOR UPDATE;
  IF NOT FOUND OR p_surum IS NULL OR v.ilk_giris_durumu<>'onaylandi' OR v.sifre_ozeti IS NULL OR v.giris_surum<>p_surum THEN RETURN false; END IF;
  DELETE FROM public.agora_partner_oturumlari WHERE partner_id=p_partner_id AND bitis_at<=now();
  INSERT INTO public.agora_partner_oturumlari(token_ozeti,partner_id,giris_surum) VALUES(p_token_ozeti,p_partner_id,p_surum);
  UPDATE public.agora_is_partnerleri SET giris_deneme=0,giris_pencere_at=NULL WHERE partner_id=p_partner_id;
  RETURN true;
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_oturum_oku(p_token_ozeti text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $f$
  SELECT jsonb_build_object('partner_id',p.partner_id,'ad_soyad',p.ad_soyad,'eposta',p.eposta,'cep_telefonu',p.cep_telefonu)
  FROM public.agora_partner_oturumlari s JOIN public.agora_is_partnerleri p ON p.partner_id=s.partner_id
  WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi';
$f$;

CREATE OR REPLACE FUNCTION public.agora_partner_oturum_kapat(p_token_ozeti text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $f$ DELETE FROM public.agora_partner_oturumlari WHERE token_ozeti=p_token_ozeti; $f$;

-- Özel admin doğrulayıcısı dışarıdan çağrılamaz; tüm diğer işlevler yalnız sunucuya açıktır.
REVOKE ALL ON FUNCTION public.agora_partner_admin_dogrula(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.agora_partner_basvurulari(uuid,text,integer),public.agora_partner_ilk_giris_karar(uuid,uuid,text,integer,text),public.agora_partner_giris_hazirla(text),public.agora_partner_oturum_ac(uuid,integer,text),public.agora_partner_oturum_oku(text),public.agora_partner_oturum_kapat(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_basvurulari(uuid,text,integer),public.agora_partner_ilk_giris_karar(uuid,uuid,text,integer,text),public.agora_partner_giris_hazirla(text),public.agora_partner_oturum_ac(uuid,integer,text),public.agora_partner_oturum_oku(text),public.agora_partner_oturum_kapat(text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT (
  to_regprocedure('public.agora_partner_ilk_giris_karar(uuid,uuid,text,integer,text)') IS NOT NULL
  AND to_regclass('public.agora_partner_oturumlari') IS NOT NULL
  AND NOT has_table_privilege('anon','public.agora_is_partnerleri','SELECT')
  AND NOT has_function_privilege('authenticated','public.agora_partner_oturum_ac(uuid,integer,text)','EXECUTE')
  AND has_function_privilege('service_role','public.agora_partner_basvurulari(uuid,text,integer)','EXECUTE')
) AS agora_partner_ilk_giris_onayi_hazir;
