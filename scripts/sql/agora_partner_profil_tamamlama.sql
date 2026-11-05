-- Agora / Adım 4. Tamamını tek parça çalıştırın.
-- Şirket profili ve yalnız partner oturumuyla erişilen özel logo deposu.
BEGIN;
CREATE TABLE IF NOT EXISTS public.agora_partner_profilleri (
  partner_id uuid PRIMARY KEY REFERENCES public.agora_is_partnerleri(partner_id),
  sirket_adi text NOT NULL CHECK (char_length(btrim(sirket_adi)) BETWEEN 2 AND 200),
  il_id integer NOT NULL CHECK (il_id BETWEEN 1 AND 81),
  ilce_id integer NOT NULL CHECK (ilce_id > 0),
  adres text NOT NULL CHECK (char_length(btrim(adres)) BETWEEN 10 AND 1000),
  vergi_dairesi_kodu text NOT NULL CHECK (vergi_dairesi_kodu ~ '^[0-9]{5,6}$'),
  vergi_dairesi text NOT NULL CHECK (char_length(vergi_dairesi) BETWEEN 2 AND 200),
  vergi_no text NOT NULL CHECK (vergi_no ~ '^[0-9]{10}$'),
  -- TEST: MOD 97 askıda; canlı geçişinde geri açılacak (AGENTS.md).
  iban text NOT NULL CHECK (iban ~ '^TR[0-9]{24}$'),
  logo_yolu text NOT NULL CHECK (logo_yolu ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(png|jpg|webp)$'),
  surum integer NOT NULL DEFAULT 1 CHECK (surum > 0),
  guncellendi_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_partner_profilleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_profilleri FROM PUBLIC,anon,authenticated,service_role;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('agora-partner-logolari','agora-partner-logolari',false,5242880,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT(id) DO NOTHING;
DO $b$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='agora-partner-logolari' AND public=false AND file_size_limit=5242880 AND allowed_mime_types @> ARRAY['image/png','image/jpeg','image/webp'] AND allowed_mime_types <@ ARRAY['image/png','image/jpeg','image/webp']) THEN
    RAISE EXCEPTION 'Partner logo deposu ayarları beklenenden farklı';
  END IF;
END;
$b$;
-- Başka bucket'lar için var olan geniş izinler bu özel depoya uygulanamaz.
DROP POLICY IF EXISTS agora_partner_logo_istemci_kapali ON storage.objects;
CREATE POLICY agora_partner_logo_istemci_kapali ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon,authenticated
  USING(bucket_id <> 'agora-partner-logolari') WITH CHECK(bucket_id <> 'agora-partner-logolari');

CREATE OR REPLACE FUNCTION public.agora_partner_profil_oku(p_token_ozeti text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $f$
  SELECT jsonb_build_object('partner_id',p.partner_id,'uyelik_durumu',p.uyelik_durumu,
    'profil', CASE WHEN f.partner_id IS NULL THEN NULL ELSE to_jsonb(f)-'partner_id'-'guncellendi_at' END)
  FROM public.agora_partner_oturumlari s
  JOIN public.agora_is_partnerleri p ON p.partner_id=s.partner_id
  LEFT JOIN public.agora_partner_profilleri f ON f.partner_id=p.partner_id
  WHERE s.token_ozeti=p_token_ozeti AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.ilk_giris_durumu='onaylandi';
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
  UPDATE public.agora_is_partnerleri SET uyelik_durumu='onay_bekliyor' WHERE partner_id=v.partner_id;
  RETURN 'tamam';
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_partner_profil_oku(text),public.agora_partner_profil_kaydet(text,jsonb,text,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_partner_profil_oku(text),public.agora_partner_profil_kaydet(text,jsonb,text,integer) TO service_role;
COMMIT;
SELECT (
  to_regclass('public.agora_partner_profilleri') IS NOT NULL
  AND to_regprocedure('public.agora_partner_profil_oku(text)') IS NOT NULL
  AND to_regprocedure('public.agora_partner_profil_kaydet(text,jsonb,text,integer)') IS NOT NULL
  AND EXISTS(SELECT 1 FROM storage.buckets WHERE id='agora-partner-logolari' AND public=false)
  AND EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='agora_partner_logo_istemci_kapali' AND permissive='RESTRICTIVE')
  AND NOT has_table_privilege('anon','public.agora_partner_profilleri','SELECT')
  AND NOT has_table_privilege('authenticated','public.agora_partner_profilleri','SELECT')
  AND has_function_privilege('service_role','public.agora_partner_profil_kaydet(text,jsonb,text,integer)','EXECUTE')
) AS agora_partner_profil_tamamlama_hazir;
