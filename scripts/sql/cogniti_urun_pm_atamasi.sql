BEGIN;

ALTER TABLE public.urunler ADD COLUMN IF NOT EXISTS sorumlu_pm_id uuid
  REFERENCES public.kullanicilar(kullanici_id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.cogniti_urun_pm_atamasini_dogrula()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF NEW.sorumlu_pm_id IS NULL THEN RETURN NEW; END IF;

  PERFORM 1 FROM public.kullanicilar k
    WHERE k.kullanici_id = NEW.sorumlu_pm_id
      AND k.firma_id = NEW.firma_id AND k.takim_id = NEW.takim_id
      AND k.aktif_mi IS TRUE AND lower(k.rol) IN ('pm','jr_pm','kd_pm')
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sorumlu PM aktif olmalı ve ürünle aynı firma ve takımda bulunmalıdır.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cogniti_urun_pm_atama_kontrolu ON public.urunler;
CREATE TRIGGER cogniti_urun_pm_atama_kontrolu
BEFORE INSERT OR UPDATE OF sorumlu_pm_id, firma_id, takim_id ON public.urunler
FOR EACH ROW EXECUTE FUNCTION public.cogniti_urun_pm_atamasini_dogrula();

CREATE OR REPLACE FUNCTION public.cogniti_gecersiz_pm_atamasini_kaldir()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  UPDATE public.urunler
     SET sorumlu_pm_id = NULL
   WHERE sorumlu_pm_id = NEW.kullanici_id
     AND (NEW.aktif_mi IS DISTINCT FROM TRUE
       OR lower(coalesce(NEW.rol, '')) NOT IN ('pm','jr_pm','kd_pm')
       OR firma_id IS DISTINCT FROM NEW.firma_id
       OR takim_id IS DISTINCT FROM NEW.takim_id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.cogniti_gecersiz_pm_atamasini_kaldir() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS cogniti_pm_profil_degisikligi ON public.kullanicilar;
CREATE TRIGGER cogniti_pm_profil_degisikligi
AFTER UPDATE OF rol, aktif_mi, firma_id, takim_id ON public.kullanicilar
FOR EACH ROW
WHEN (OLD.rol IS DISTINCT FROM NEW.rol OR OLD.aktif_mi IS DISTINCT FROM NEW.aktif_mi
  OR OLD.firma_id IS DISTINCT FROM NEW.firma_id OR OLD.takim_id IS DISTINCT FROM NEW.takim_id)
EXECUTE FUNCTION public.cogniti_gecersiz_pm_atamasini_kaldir();

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT true AS cogniti_urun_pm_atamasi_hazir;
