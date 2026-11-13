-- Cogniti Rol Donusum Tablaosu.xlsx / Sayfa1
-- D sütunundan sonraki piyasa unvanları ve kısaltmaları ayrı satırlardır.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_rol_donusum_anahtari(p_unvan text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT
SET search_path = pg_catalog
AS $$
  SELECT regexp_replace(
    lower(translate(p_unvan, 'İIıŞşÇçÖöÜüĞğÂâÎîÛû', 'IiiSsCcOoUuGgAaIiUu') COLLATE "C"),
    '[^a-z0-9]', '', 'g'
  );
$$;

CREATE TABLE IF NOT EXISTS public.cogniti_rol_donusumleri (
  firma_unvani text NOT NULL,
  rol_kodu text NOT NULL,
  unvan_anahtari text GENERATED ALWAYS AS (public.cogniti_rol_donusum_anahtari(firma_unvani)) STORED PRIMARY KEY,
  CONSTRAINT cogniti_rol_donusumleri_unvan_dolu CHECK (unvan_anahtari <> ''),
  CONSTRAINT cogniti_rol_donusumleri_rol_gecerli CHECK (
    rol_kodu IN ('gm', 'gm_yrd', 'drk', 'blm_md', 'paz_md', 'sm', 'tm', 'bm', 'utt', 'kd_utt', 'grp_pm', 'kd_pm', 'pm', 'jr_pm', 'med_md', 'egt_md', 'egt_yrd_md', 'egt_yon', 'egt_uz', 'ik_drk', 'ik_md', 'ik_yrd_md', 'ik_uz', 'ik_per')
  )
);

ALTER TABLE public.cogniti_rol_donusumleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cogniti_rol_donusumleri FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.cogniti_rol_donusumleri TO service_role;

CREATE TEMP TABLE cogniti_rol_donusumleri_excel (
  rol_kodu text NOT NULL,
  firma_unvani text NOT NULL
) ON COMMIT DROP;

INSERT INTO cogniti_rol_donusumleri_excel (rol_kodu, firma_unvani)
VALUES
  ('gm', 'Managing Director'),
  ('gm', 'MD'),
  ('gm_yrd', 'Deputy Manager'),
  ('gm_yrd', 'DM'),
  ('drk', 'Pazarlama Direktörü'),
  ('drk', 'Satış Direktörü'),
  ('drk', 'Satış Gücü Etkinliği Direktörü'),
  ('drk', 'Marketing Director'),
  ('drk', 'Sales Director'),
  ('drk', 'SFE Director'),
  ('blm_md', 'Bussines Unit Manager'),
  ('blm_md', 'BUM'),
  ('paz_md', 'Marketing Manager'),
  ('tm', 'Tanıtım Müdürü'),
  ('tm', 'TM'),
  ('tm', 'Ulusal Satış Müdürü'),
  ('tm', 'USM'),
  ('tm', 'Ulusal Tanıtım Müdürü'),
  ('tm', 'UTM'),
  ('utt', 'Ürün Tanıtım Uzmanı'),
  ('utt', 'ÜTU'),
  ('utt', 'Tıbbi Tanıtım Temsilcisi'),
  ('utt', 'TTT'),
  ('utt', 'Tıbb Satış Mümessili'),
  ('utt', 'TSM'),
  ('utt', 'Tıbbi Satış Temsilcisi'),
  ('utt', 'TST'),
  ('utt', 'Satış Temsilcisi'),
  ('utt', 'ST'),
  ('utt', 'Tıbbi Temsilci'),
  ('utt', 'TT'),
  ('utt', 'Kilit Müşteri Yöneticisi'),
  ('utt', 'KMY'),
  ('utt', 'Key Account Manager'),
  ('utt', 'KAM'),
  ('grp_pm', 'Grup Product Manager'),
  ('grp_pm', 'Group Product Manager'),
  ('kd_pm', 'Senior Product Manager'),
  ('pm', 'Product Manager'),
  ('jr_pm', 'Junior Product Manager'),
  ('egt_md', 'Satış Eğitim Müdürü'),
  ('egt_yrd_md', 'Satış Eğitim Müdürü Yardımcısı'),
  ('egt_yon', 'Satış Eğitim Yöneticisi'),
  ('egt_uz', 'Satış Eğitim Uzmanı'),
  ('ik_drk', 'İnsan Kaynakları Direktörü'),
  ('ik_md', 'İnsan Kaynakları Müdürü'),
  ('ik_yrd_md', 'İnsan Kaynakları Müdür Yardımcısı'),
  ('ik_uz', 'İnsan Kaynakları Uzmanı'),
  ('ik_per', 'İnsan Kaynakları Personeli');

INSERT INTO public.cogniti_rol_donusumleri (rol_kodu, firma_unvani)
SELECT rol_kodu, firma_unvani
FROM cogniti_rol_donusumleri_excel
ON CONFLICT (unvan_anahtari) DO NOTHING;

DO $$
DECLARE
  v_cakisma text;
BEGIN
  SELECT kaynak.firma_unvani INTO v_cakisma
  FROM cogniti_rol_donusumleri_excel AS kaynak
  JOIN public.cogniti_rol_donusumleri AS mevcut
    ON mevcut.unvan_anahtari = public.cogniti_rol_donusum_anahtari(kaynak.firma_unvani)
  WHERE mevcut.rol_kodu <> kaynak.rol_kodu
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Unvan farklı bir role bağlı: %', v_cakisma;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT true AS cogniti_rol_donusumleri_hazir,
       count(*) AS toplam_eslesme
FROM public.cogniti_rol_donusumleri;
