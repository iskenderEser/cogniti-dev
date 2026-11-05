-- Agora / Adım 2: yalnız iş partnerinin ilk üyelik kaydı.
-- Tamamını tek parça çalıştırın. Gerçek üyelik veya e-posta üretmez.
-- Mevcut firma, E-Club, Eczanem ve Auth kayıtlarını değiştirmez.
BEGIN;

CREATE TABLE IF NOT EXISTS public.agora_is_partnerleri (
  partner_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_soyad text NOT NULL CHECK (
    char_length(ad_soyad) BETWEEN 3 AND 150
    AND ad_soyad = btrim(ad_soyad)
    AND ad_soyad !~ '[[:cntrl:]]'
    AND ad_soyad ~ '^[[:alpha:]][[:alpha:].’'' -]* [[:alpha:]][[:alpha:].’'' -]*$'
  ),
  eposta text NOT NULL UNIQUE CHECK (
    char_length(eposta) <= 254 AND eposta = lower(btrim(eposta))
    AND eposta !~ '[[:cntrl:]]'
    AND eposta ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  cep_telefonu text NOT NULL UNIQUE CHECK (cep_telefonu ~ '^5[0-9]{9}$'),
  olusturuldu_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agora_is_partnerleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.agora_is_partnerleri FROM PUBLIC, anon, authenticated;
-- Üyelik tablosuna dışarıdan doğrudan okuma/yazma kapalıdır; kayıt korumalı RPC'dedir.
REVOKE ALL ON TABLE public.agora_is_partnerleri FROM service_role;

CREATE OR REPLACE FUNCTION public.agora_partner_kayit_olustur(
  p_ad_soyad text, p_eposta text, p_cep_telefonu text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fonksiyon$
BEGIN
  -- Tekillik iki eşzamanlı istekte de DB tarafından korunur.
  -- Var olan kaydın adı/iletişim bilgileri anonim yeniden kayıtla değiştirilemez.
  INSERT INTO public.agora_is_partnerleri(ad_soyad, eposta, cep_telefonu)
  VALUES (p_ad_soyad, p_eposta, p_cep_telefonu)
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$fonksiyon$;

REVOKE ALL ON FUNCTION public.agora_partner_kayit_olustur(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agora_partner_kayit_olustur(text,text,text) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT (
  to_regclass('public.agora_is_partnerleri') IS NOT NULL
  AND to_regprocedure('public.agora_partner_kayit_olustur(text,text,text)') IS NOT NULL
  AND (SELECT relrowsecurity FROM pg_class WHERE oid='public.agora_is_partnerleri'::regclass)
  AND NOT has_table_privilege('anon','public.agora_is_partnerleri','SELECT')
  AND NOT has_table_privilege('authenticated','public.agora_is_partnerleri','INSERT')
  AND NOT has_function_privilege('anon','public.agora_partner_kayit_olustur(text,text,text)','EXECUTE')
  AND NOT has_function_privilege('authenticated','public.agora_partner_kayit_olustur(text,text,text)','EXECUTE')
  AND has_function_privilege('service_role','public.agora_partner_kayit_olustur(text,text,text)','EXECUTE')
) AS agora_partner_uyelik_kaydi_hazir;
