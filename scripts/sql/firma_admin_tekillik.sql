BEGIN;

DO $$
DECLARE
  v_cakisan text;
BEGIN
  SELECT string_agg(COALESCE(f.firma_adi, k.firma_id::text) || ' (' || k.adet || ' kişi)', ', ')
  INTO v_cakisan
  FROM (
    SELECT firma_id, count(*) AS adet
    FROM public.kullanicilar
    WHERE lower(rol) = 'firma_admin' AND aktif_mi = true
    GROUP BY firma_id
    HAVING count(*) > 1
  ) k
  LEFT JOIN public.firmalar f ON f.firma_id = k.firma_id;

  IF v_cakisan IS NOT NULL THEN
    RAISE EXCEPTION 'Birden fazla aktif Firma Admini bulunan firmalar var: %. Önce tek kişiye düşürün.', v_cakisan;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_kullanicilar_firma_tek_aktif_firma_admin
  ON public.kullanicilar (firma_id)
  WHERE lower(rol) = 'firma_admin' AND aktif_mi = true;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT true AS firma_admin_tekillik_hazir;
