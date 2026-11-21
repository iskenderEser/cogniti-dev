-- KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: agora_canli_yayin_siparis_kavrami_gecisi.sql uygulanmış olmalıdır.
-- Üretici rolün sipariş verdiği canlı yayınları (Canlı Agora Yayınları sayfası için) okur.
BEGIN;

ALTER TABLE public.agora_canli_siparisleri
  ADD COLUMN IF NOT EXISTS viva_etkinlik_id uuid;

CREATE OR REPLACE FUNCTION public.agora_canli_yayinlarim_oku(p_auth_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_firma uuid;
BEGIN
  v_firma := public.agora_satin_alma_yetki(p_auth_id);

  RETURN (
    SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.baslangic_at ASC, r.siparis_tarihi DESC), '[]'::jsonb)
    FROM (
      SELECT
        s.siparis_id,
        s.oturum_id,
        s.canli_egitim_id,
        s.partner_id,
        coalesce(p.sirket_adi, 'İş Partneri') AS sirket_adi,
        s.partner_egitim_id,
        s.egitim_adi,
        e.kategori_kodu,
        e.kategori,
        e.hedef_roller,
        e.aciklama,
        s.baslangic_at,
        o.bitis_at,
        s.sure_dakika,
        s.kapasite,
        s.satin_alma_bedeli,
        s.token_tutari,
        s.siparis_tarihi,
        o.durum,
        s.viva_etkinlik_id
      FROM public.agora_canli_siparisleri s
      JOIN public.agora_partner_canli_oturumlar o ON o.oturum_id = s.oturum_id
      JOIN public.agora_partner_canli_egitimler e ON e.canli_egitim_id = s.canli_egitim_id
      LEFT JOIN public.agora_partner_profilleri p ON p.partner_id = s.partner_id
      WHERE s.alici_id = p_auth_id
        AND s.firma_id = v_firma
    ) r
  );
END $f$;

REVOKE ALL ON FUNCTION public.agora_canli_yayinlarim_oku(uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.agora_canli_yayinlarim_oku(uuid)
  TO service_role;

COMMIT;
