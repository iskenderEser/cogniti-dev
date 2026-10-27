-- Token hesabı oluşturma ve ilk yükleme: tek işlemde gerçekleşir.
BEGIN;
ALTER TABLE public.cogniti_token_hesaplari
 ADD COLUMN IF NOT EXISTS aylik_paket_miktari bigint,
 ADD COLUMN IF NOT EXISTS onay_yetkili_id uuid REFERENCES public.kullanicilar(kullanici_id);

CREATE OR REPLACE FUNCTION public.cogniti_token_hesap_olustur(
 p_firma uuid,p_paket text,p_aylik_miktar bigint,p_admin uuid,p_anahtar text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; v_yukleme uuid; v_gm uuid; v_sayi bigint;
 v_bu_ay date:=(now() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
 IF p_firma IS NULL OR p_admin IS NULL OR coalesce(btrim(p_anahtar),'')='' OR
   p_paket IS NULL OR p_paket NOT IN ('aylik','kullandigin_kadar_ode') THEN
  RAISE EXCEPTION 'Hesap bilgileri geçersiz.' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin AND rol='admin' AND aktif_mi=true) THEN
  RAISE EXCEPTION 'Yalnız aktif admin token hesabı açabilir.' USING ERRCODE='42501';
 END IF;
 IF p_paket='aylik' AND (p_aylik_miktar IS NULL OR p_aylik_miktar NOT IN (10000,30000,75000)) THEN
  RAISE EXCEPTION 'Geçerli aylık paket seçilmelidir.' USING ERRCODE='22023';
 END IF;
 IF p_paket='kullandigin_kadar_ode' AND p_aylik_miktar IS NOT NULL THEN
  RAISE EXCEPTION 'KKÖ için aylık miktar belirtilmez.' USING ERRCODE='22023';
 END IF;
 PERFORM 1 FROM public.firmalar WHERE firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='22023'; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=p_firma;
 IF FOUND THEN
  SELECT yukleme_id INTO v_yukleme FROM public.cogniti_token_yuklemeleri
   WHERE firma_id=p_firma AND islem_anahtari=p_anahtar;
  IF v_yukleme IS NOT NULL AND h.paket_turu=p_paket AND h.aylik_paket_miktari IS NOT DISTINCT FROM p_aylik_miktar THEN
   RETURN jsonb_build_object('firma_id',p_firma,'yukleme_id',v_yukleme,'yeniden_deneme',true);
  END IF;
  RAISE EXCEPTION 'Firmanın token hesabı zaten var.' USING ERRCODE='22023';
 END IF;
 SELECT count(*) INTO v_sayi FROM public.kullanicilar WHERE firma_id=p_firma AND rol='gm' AND aktif_mi=true;
 IF v_sayi=1 THEN SELECT kullanici_id INTO v_gm FROM public.kullanicilar WHERE firma_id=p_firma AND rol='gm' AND aktif_mi=true; END IF;
 INSERT INTO public.cogniti_token_hesaplari(firma_id,paket_turu,aylik_paket_miktari,onay_yetkili_id)
 VALUES(p_firma,p_paket,p_aylik_miktar,v_gm);
 IF p_paket='aylik' THEN
  v_yukleme:=public.cogniti_token_yukle(p_firma,'aylik_paket',p_aylik_miktar,p_anahtar,
    extract(year from v_bu_ay)::integer,extract(month from v_bu_ay)::integer,p_admin,'İlk aylık paket');
 ELSE
  v_yukleme:=public.cogniti_token_yukle(p_firma,'kko',1500,p_anahtar,NULL,NULL,p_admin,'KKÖ başlangıç yüklemesi');
 END IF;
 RETURN jsonb_build_object('firma_id',p_firma,'yukleme_id',v_yukleme,'onay_yetkili_id',v_gm,'yeniden_deneme',false);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_hesap_olustur(uuid,text,bigint,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_hesap_olustur(uuid,text,bigint,uuid,text) TO service_role;
COMMIT;
