-- Kullanıcı çalıştıracak. Mevcut Esnek proforma onayı altyapısı gerekir.
-- Onaylanmış belgelerin kayıtlı bilgileri korunur.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_esnek_proforma_belgesi(p_siparis uuid,p_firma uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT jsonb_build_object(
  'belge_no','PF-E-'||s.siparis_id::text,'tarih',s.siparis_tarihi,
  'duzenleyen',jsonb_build_object('unvan','Mill Danışmanlık Org. ve Eğt. Hiz. Ltd. Şti',
    'adres','Göktürk Merkez M. İstanbul C. Üstüküme S. No: D51 Göktürk-Eyüp-İstanbul',
    'vergi_dairesi','Gaziosmanpaşa','vergi_numarasi','6210464784'),
  'alici',jsonb_build_object('unvan',a.firma_adi,'adres',coalesce(a.adres,''),
    'vergi_dairesi',coalesce(a.vergi_dairesi,''),'vergi_numarasi',coalesce(a.vergi_numarasi,'')),
  'token_adedi',s.token_adedi,'birim_fiyat',s.birim_fiyat,'toplam_tutar',s.toplam_tutar,
  'kdv',round(s.toplam_tutar/5,2),'son_kullanim_yili',extract(year FROM s.siparis_tarihi AT TIME ZONE 'Europe/Istanbul')::integer
 )
 FROM public.cogniti_esnek_paket_siparisleri s
 JOIN public.firmalar a ON a.firma_id=s.firma_id
 WHERE s.siparis_id=p_siparis AND s.firma_id=p_firma;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_esnek_proforma_belgesi(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_esnek_proforma_duzenleyen_bilgileri_guncellendi;
