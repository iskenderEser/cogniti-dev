-- Kullanıcı çalıştıracak. İçerik bedeli, rol bazlı KKÖ ve yayın rezervasyonu kurulu olmalıdır.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.cogniti_yukleme_ayrilan(uuid)') IS NULL
    OR to_regprocedure('public.cogniti_kko_hesap_yenile(uuid)') IS NULL
    OR to_regprocedure('public.cogniti_kko_yukleme_kullanilabilir(date,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Önce rol bazlı KKÖ ve yayın rezervasyonu kurulmalıdır.';
  END IF;
END;
$$;

ALTER TABLE public.talepler ADD COLUMN IF NOT EXISTS uretim_bedeli_odendi_at timestamptz;

CREATE TABLE IF NOT EXISTS public.cogniti_icerik_uretim_alimlari (
  talep_id uuid PRIMARY KEY REFERENCES public.talepler(talep_id),
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
  uretici_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
  bakiye_id uuid NOT NULL,
  bakiye_turu text NOT NULL CHECK (bakiye_turu IN ('kisisel', 'firma_ortak')),
  token_adedi integer NOT NULL CHECK (token_adedi > 0),
  tahsilat_at timestamptz NOT NULL,
  FOREIGN KEY (firma_id, bakiye_id) REFERENCES public.cogniti_satin_alma_bakiyeleri(firma_id, bakiye_id)
);
ALTER TABLE public.cogniti_icerik_uretim_alimlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_icerik_uretim_alimlari FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cogniti_icerik_uretim_tahsil_et(
  p_auth uuid, p_talep uuid, p_hesap text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  firma uuid;
  talep public.talepler%ROWTYPE;
  alim public.cogniti_icerik_uretim_alimlari%ROWTYPE;
  bakiye uuid;
  yukleme record;
  eksik integer;
  pay integer;
  tahsilat_zamani timestamptz;
BEGIN
  IF p_auth IS NULL OR p_talep IS NULL OR p_hesap IS NULL OR p_hesap NOT IN ('kisisel', 'firma_ortak') THEN
    RAISE EXCEPTION 'Geçersiz içerik üretimi ödeme isteği.' USING ERRCODE = '22023';
  END IF;

  SELECT u.firma_id INTO firma
  FROM public.kullanicilar u JOIN public.firmalar f USING (firma_id)
  WHERE u.kullanici_id = p_auth AND u.aktif_mi AND f.aktif
    AND lower(btrim(u.rol)) IN ('pm', 'jr_pm', 'kd_pm', 'med_md', 'egt_md', 'egt_yrd_md',
      'egt_yon', 'egt_uz', 'ik_drk', 'ik_md', 'ik_yrd_md', 'ik_uz', 'ik_per')
  FOR SHARE OF u, f;

  SELECT t.* INTO talep FROM public.talepler t
  WHERE t.talep_id = p_talep AND t.uretici_id = p_auth AND t.firma_id = firma
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bu içeriği ödeme yetkiniz bulunmuyor.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO alim FROM public.cogniti_icerik_uretim_alimlari WHERE talep_id = p_talep;
  IF FOUND THEN
    RETURN jsonb_build_object('talep_id', p_talep, 'token', alim.token_adedi,
      'hesap', alim.bakiye_turu, 'tekrar', true);
  END IF;

  IF talep.taslak_mi IS TRUE OR talep.yayin_oncesi_silme_durumu IS NOT NULL
    OR talep.uretim_bedeli_turu IS DISTINCT FROM 'sabit'
    OR coalesce(talep.uretim_bedeli_token, 0) <= 0
    OR NOT EXISTS (
      SELECT 1 FROM public.soru_setleri s
      JOIN public.soru_seti_durumu d USING (soru_seti_id)
      WHERE s.talep_id = p_talep AND d.durum = 'onaylandi'
    ) THEN
    RAISE EXCEPTION 'İçerik ödeme için hazır değil.' USING ERRCODE = '22023';
  END IF;

  SELECT b.bakiye_id INTO bakiye FROM public.cogniti_satin_alma_bakiyeleri b
  WHERE b.firma_id = firma AND b.bakiye_turu = p_hesap
    AND (p_hesap = 'firma_ortak' OR b.sahip_id = p_auth)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ICERIK_URETIMI:bakiye_yetersiz' USING ERRCODE = 'P0001';
  END IF;

  PERFORM public.cogniti_kko_hesap_yenile(bakiye);
  tahsilat_zamani := clock_timestamp();
  eksik := talep.uretim_bedeli_token;
  FOR yukleme IN
    SELECT y.yukleme_id, y.kalan - public.cogniti_yukleme_ayrilan(y.yukleme_id) AS uygun
    FROM public.cogniti_esnek_paket_yuklemeleri y
    WHERE y.bakiye_id = bakiye AND y.firma_id = firma AND y.kalan > 0
      AND y.son_kullanim_at > tahsilat_zamani
      AND public.cogniti_kko_yukleme_kullanilabilir(y.kko_donem, y.bakiye_id)
    ORDER BY y.son_kullanim_at, y.created_at, y.yukleme_id
    FOR UPDATE OF y
  LOOP
    pay := least(eksik, greatest(yukleme.uygun, 0));
    IF pay > 0 THEN
      UPDATE public.cogniti_esnek_paket_yuklemeleri SET kalan = kalan - pay
      WHERE yukleme_id = yukleme.yukleme_id;
      eksik := eksik - pay;
      EXIT WHEN eksik = 0;
    END IF;
  END LOOP;

  IF eksik > 0 THEN
    RAISE EXCEPTION 'ICERIK_URETIMI:bakiye_yetersiz' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.cogniti_icerik_uretim_alimlari
    (talep_id, firma_id, uretici_id, bakiye_id, bakiye_turu, token_adedi, tahsilat_at)
  VALUES (p_talep, firma, p_auth, bakiye, p_hesap, talep.uretim_bedeli_token, tahsilat_zamani);

  UPDATE public.talepler SET uretim_bedeli_odendi_at = tahsilat_zamani WHERE talep_id = p_talep;
  RETURN jsonb_build_object('talep_id', p_talep, 'token', talep.uretim_bedeli_token,
    'hesap', p_hesap, 'tekrar', false);
END;
$$;

REVOKE ALL ON FUNCTION public.cogniti_icerik_uretim_tahsil_et(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_icerik_uretim_tahsil_et(uuid, uuid, text) TO service_role;

COMMIT;

SELECT
  to_regprocedure('public.cogniti_icerik_uretim_tahsil_et(uuid,uuid,text)') IS NOT NULL
  AND to_regclass('public.cogniti_icerik_uretim_alimlari') IS NOT NULL
  AND to_regprocedure('public.cogniti_yukleme_ayrilan(uuid)') IS NOT NULL
  AND to_regprocedure('public.cogniti_kko_hesap_yenile(uuid)') IS NOT NULL
  AND to_regprocedure('public.cogniti_kko_yukleme_kullanilabilir(date,uuid)') IS NOT NULL
  AS icerik_uretim_tahsilati_kuruldu;
