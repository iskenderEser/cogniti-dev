-- E-Club mevcut RPC imzasını yeni kanonik gönderim yazıcısına bağlar.
-- Ön koşul: eclub_gonderim_rpc_yeni_kurgu.sql (Adım 5) kurulmuş olmalıdır.
-- Araç ve istemci tarihleri kontrol girdisi değildir; yayından ve sunucu saatinden çözülür.

CREATE OR REPLACE FUNCTION public.eclub_oneri_atomik_kaydet(
  p_yayin_id uuid,
  p_oneren_id uuid,
  p_kisi_id uuid,
  p_arac_id uuid,
  p_oneri_baslangic timestamptz,
  p_oneri_bitis timestamptz
)
RETURNS TABLE (
  oneri_id uuid,
  kaydedildi boolean,
  sebep text,
  yeniden_gonderilebilir_at timestamptz
)
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $fonksiyon$
  SELECT * FROM public.eclub_yayin_gonder(p_oneren_id, p_kisi_id, p_yayin_id, NULL);
$fonksiyon$;

REVOKE ALL ON FUNCTION public.eclub_oneri_atomik_kaydet(
  uuid, uuid, uuid, uuid, timestamptz, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_oneri_atomik_kaydet(
  uuid, uuid, uuid, uuid, timestamptz, timestamptz
) TO service_role;

SELECT
  to_regprocedure(
    'public.eclub_oneri_atomik_kaydet(uuid,uuid,uuid,uuid,timestamp with time zone,timestamp with time zone)'
  ) IS NOT NULL AS fonksiyon_var,
  has_function_privilege(
    'service_role',
    'public.eclub_oneri_atomik_kaydet(uuid,uuid,uuid,uuid,timestamp with time zone,timestamp with time zone)',
    'EXECUTE'
  ) AS service_role_calistirabilir,
  NOT has_function_privilege(
    'authenticated',
    'public.eclub_oneri_atomik_kaydet(uuid,uuid,uuid,uuid,timestamp with time zone,timestamp with time zone)',
    'EXECUTE'
  ) AS authenticated_calistiramaz;
