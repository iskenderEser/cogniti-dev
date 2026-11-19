-- KULLANICI ÇALIŞTIRACAK.
-- Canlı yayın oluşturma RPC'sinde partner hak edişini yalnızca yüzde 15 hizmet komisyonu üzerinden hesaplar.
BEGIN;

CREATE OR REPLACE FUNCTION public.agora_partner_canli_egitim_olustur(
  p_partner_id uuid,
  p_egitim_adi text,
  p_kategori_kodu text,
  p_kategori text,
  p_hedef_roller text[],
  p_aciklama text,
  p_sure_dakika integer,
  p_kapasite integer,
  p_fiyat_tl numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_hizmet numeric(12,2);
  v_net numeric(12,2);
  v_egitim public.agora_partner_canli_egitimler%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.agora_is_partnerleri p
    JOIN public.agora_partner_profilleri f USING (partner_id)
    WHERE p.partner_id = p_partner_id
      AND p.ilk_giris_durumu = 'onaylandi'
      AND p.uyelik_durumu = 'onaylandi'
  ) THEN
    RAISE EXCEPTION 'Canlı yayın açmak için partner profil ve üyelik onayınız tamamlanmış olmalıdır.' USING ERRCODE = '42501';
  END IF;

  IF p_sure_dakika NOT IN (45, 60, 120, 180) THEN
    RAISE EXCEPTION 'Geçersiz yayın süresi.' USING ERRCODE = '22023';
  END IF;
  IF p_kapasite NOT IN (15, 20, 25, 30, 40, 50) THEN
    RAISE EXCEPTION 'Geçersiz katılımcı kapasitesi.' USING ERRCODE = '22023';
  END IF;

  v_hizmet := round(p_fiyat_tl * 0.15, 2);
  v_net := round(p_fiyat_tl - v_hizmet, 2);

  IF v_net <= 0 THEN
    RAISE EXCEPTION 'Yayın satış fiyatı sıfırdan büyük olmalıdır.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.agora_partner_canli_egitimler (
    partner_id, egitim_adi, kategori_kodu, kategori, hedef_roller, aciklama,
    sure_dakika, kapasite, fiyat_tl, viva_maliyeti_tl, tarife_surumu, hizmet_bedeli_tl, net_hakedis_tl
  ) VALUES (
    p_partner_id, btrim(p_egitim_adi), p_kategori_kodu, p_kategori, p_hedef_roller, btrim(p_aciklama),
    p_sure_dakika, p_kapasite, round(p_fiyat_tl, 2), 0, 0, v_hizmet, v_net
  ) RETURNING * INTO v_egitim;

  RETURN to_jsonb(v_egitim);
END $f$;

COMMIT;
