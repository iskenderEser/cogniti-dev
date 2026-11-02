-- Adım 5: mevcut firma işlem RPC'lerinin aktör yetkisi.
-- Mevcut iş kuralları, tablo kayıtları ve onay zincirleri korunur.
BEGIN;
CREATE OR REPLACE FUNCTION public.firma_yonetim_yazma_yetkili_mi(p_kullanici_id uuid,p_firma_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $fn$
 SELECT EXISTS(
  SELECT 1 FROM public.kullanicilar k JOIN public.firmalar f ON f.firma_id=p_firma_id
  WHERE k.kullanici_id=p_kullanici_id AND k.aktif_mi=true AND (
   (lower(k.rol)='admin' AND NOT f.firma_admin_aktif)
   OR (lower(k.rol)='firma_admin' AND k.firma_id=f.firma_id AND f.firma_admin_aktif AND f.aktif=true)
  )
 );
$fn$;
REVOKE ALL ON FUNCTION public.firma_yonetim_yazma_yetkili_mi(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.firma_yonetim_yazma_yetkili_mi(uuid,uuid) TO service_role;
DO $patch$
DECLARE s text; eski text; imza text;
BEGIN
 FOREACH imza IN ARRAY ARRAY['public.admin_eclub_firma_cek_tanimi_kaydet(uuid,uuid,integer,numeric,integer)','public.admin_eczanem_firma_cek_tanimi_kaydet(uuid,uuid,integer,numeric,integer)'] LOOP
  SELECT pg_get_functiondef(imza::regprocedure) INTO s;
  IF strpos(s,'firma_yonetim_yazma_yetkili_mi')=0 THEN
   eski:='IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin_id AND lower(rol)=''admin''';
   IF strpos(s,eski)=0 THEN RAISE EXCEPTION 'Beklenmeyen çek tanımı işlevi: %',imza; END IF;
   s:=regexp_replace(s,'IF NOT EXISTS\(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin_id AND lower\(rol\)=''admin''( AND aktif_mi=true)?\) THEN','IF NOT public.firma_yonetim_yazma_yetkili_mi(p_admin_id,p_firma_id) THEN');
   IF strpos(s,'firma_yonetim_yazma_yetkili_mi')=0 THEN RAISE EXCEPTION 'Yetki geçişi uygulanamadı: %',imza; END IF;
   EXECUTE s;
  END IF;
 END LOOP;
 imza:='public.admin_eczanem_uyelik_durum_degistir(uuid,uuid,uuid,uuid,boolean,boolean)';
 SELECT pg_get_functiondef(imza::regprocedure) INTO s;
 IF strpos(s,'firma_yonetim_yazma_yetkili_mi')=0 THEN
  eski:=E'PERFORM 1 FROM public.kullanicilar WHERE kullanici_id = p_admin_id\n    AND lower(rol) = ''admin'' AND aktif_mi IS NOT FALSE FOR SHARE;\n  IF NOT FOUND THEN';
  IF strpos(s,eski)=0 THEN RAISE EXCEPTION 'Beklenmeyen Eczanem üyelik işlevi.'; END IF;
  s:=replace(s,eski,'IF NOT public.firma_yonetim_yazma_yetkili_mi(p_admin_id,p_firma_id) THEN');
  EXECUTE s;
 END IF;
END;
$patch$;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS firma_admin_islem_yetkileri_hazir;
