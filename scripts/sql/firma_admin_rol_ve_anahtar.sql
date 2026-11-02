-- Adım 2: Rol ataması ve yalnız Cogniti tarafından yönetilen firma anahtarı.
-- Bu SQL giriş/ekran erişimini veya Cogniti salt okunur kuralını henüz açmaz.
BEGIN;
ALTER TABLE public.firmalar ADD COLUMN IF NOT EXISTS firma_admin_aktif boolean NOT NULL DEFAULT false;
DO $kontrol$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.kullanicilar'::regclass AND conname='kullanicilar_firma_admin_firma_check') THEN
  ALTER TABLE public.kullanicilar ADD CONSTRAINT kullanicilar_firma_admin_firma_check CHECK (
   lower(rol) <> 'firma_admin' OR (firma_id IS NOT NULL AND firma_id <> '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid)
  );
 END IF;
END;
$kontrol$;
CREATE OR REPLACE FUNCTION public.cogniti_firma_admin_durum_degistir(
 p_admin_id uuid,p_firma_id uuid,p_aktif boolean,p_beklenen_aktif boolean
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
DECLARE v_mevcut boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin_id AND lower(rol)='admin' AND aktif_mi=true) THEN
  RAISE EXCEPTION 'Bu işlem yalnız Cogniti admin tarafından yapılabilir.' USING ERRCODE='42501';
 END IF;
 IF p_firma_id IS NULL OR p_firma_id='15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid OR p_aktif IS NULL OR p_beklenen_aktif IS NULL THEN
  RAISE EXCEPTION 'Geçersiz firma admini ayarı.' USING ERRCODE='22023';
 END IF;
 SELECT firma_admin_aktif INTO v_mevcut FROM public.firmalar WHERE firma_id=p_firma_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='P0002'; END IF;
 IF v_mevcut IS DISTINCT FROM p_beklenen_aktif THEN
  RAISE EXCEPTION 'Ayar değişmiş; güncel durumu yenileyin.' USING ERRCODE='40001';
 END IF;
 IF p_aktif AND NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE firma_id=p_firma_id AND lower(rol)='firma_admin' AND aktif_mi=true) THEN
  RAISE EXCEPTION 'Önce Kullanıcılar sayfasından aktif bir Firma Admini atayın.' USING ERRCODE='22023';
 END IF;
 UPDATE public.firmalar SET firma_admin_aktif=p_aktif WHERE firma_id=p_firma_id;
 RETURN p_aktif;
END;
$fn$;
REVOKE ALL ON FUNCTION public.cogniti_firma_admin_durum_degistir(uuid,uuid,boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_firma_admin_durum_degistir(uuid,uuid,boolean,boolean) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS firma_admin_rol_ve_anahtar_hazir;
