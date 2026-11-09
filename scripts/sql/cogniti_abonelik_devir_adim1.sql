-- Kullanıcı çalıştıracak. Ön koşul: abonelik ilk ve aylık token yükleme kurulumları.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_abonelik_yukleme_suresini_ayarla()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $f$
BEGIN
 NEW.son_kullanim_at := (
  date_trunc('month', NEW.created_at AT TIME ZONE 'Europe/Istanbul') + interval '2 months'
 ) AT TIME ZONE 'Europe/Istanbul';
 RETURN NEW;
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_abonelik_yukleme_suresini_ayarla() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_abonelik_yukleme_suresi ON public.cogniti_esnek_paket_yuklemeleri;
CREATE TRIGGER trg_cogniti_abonelik_yukleme_suresi
 BEFORE INSERT ON public.cogniti_esnek_paket_yuklemeleri
 FOR EACH ROW WHEN (NEW.abonelik_siparis_id IS NOT NULL)
 EXECUTE FUNCTION public.cogniti_abonelik_yukleme_suresini_ayarla();

COMMIT;
SELECT true AS cogniti_abonelik_devir_adim1_kuruldu;
