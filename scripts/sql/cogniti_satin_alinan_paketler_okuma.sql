-- KULLANICI ÇALIŞTIRACAK. Ön koşul: Esnek Paket sipariş Adım 1 kurulumu.
-- Yalnız okuma; sipariş, yükleme, tüketim ve tablo izinleri değiştirilmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_firma_satin_alinan_paketler(p_auth_id uuid,p_firma uuid,p_sayfa integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record; v_toplam bigint; v_kayitlar jsonb;
BEGIN
 IF p_firma IS NULL OR p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>1000000 THEN
  RAISE EXCEPTION 'Geçersiz liste isteği.' USING ERRCODE='22023';
 END IF;
 SELECT lower(btrim(rol)) AS rol,firma_id INTO k FROM public.kullanicilar
 WHERE kullanici_id=p_auth_id AND aktif_mi=true;
 IF NOT FOUND OR k.rol IS NULL OR k.rol NOT IN ('admin','firma_admin') THEN
  RAISE EXCEPTION 'Satın alma listesine erişiminiz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 IF k.rol='firma_admin' AND (k.firma_id IS DISTINCT FROM p_firma OR NOT EXISTS(
  SELECT 1 FROM public.firmalar WHERE firma_id=p_firma AND aktif=true AND firma_admin_aktif=true
 )) THEN RAISE EXCEPTION 'Firma kapsamına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=p_firma) THEN
  RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='22023';
 END IF;
 SELECT count(*) INTO v_toplam FROM public.cogniti_esnek_paket_siparisleri WHERE firma_id=p_firma;
 SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.siparis_tarihi DESC,s.siparis_id DESC),'[]'::jsonb)
 INTO v_kayitlar FROM (
  SELECT o.siparis_id,o.siparis_tarihi,o.satin_alan_ad_soyad,o.satin_alan_rol,b.bakiye_turu,
   o.token_adedi,o.birim_fiyat,o.toplam_tutar,y.son_kullanim_at
  FROM public.cogniti_esnek_paket_siparisleri o
  JOIN public.cogniti_satin_alma_bakiyeleri b ON b.bakiye_id=o.bakiye_id AND b.firma_id=o.firma_id
  JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.siparis_id=o.siparis_id AND y.firma_id=o.firma_id
  WHERE o.firma_id=p_firma ORDER BY o.siparis_tarihi DESC,o.siparis_id DESC LIMIT 20 OFFSET p_sayfa*20
 ) s;
 RETURN jsonb_build_object('firma_id',p_firma,'siparisler',v_kayitlar,'toplam',v_toplam,'sayfa',p_sayfa,'sayfa_boyutu',20);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_satin_alinan_paketler_okuma_kuruldu;
