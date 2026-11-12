-- KULLANICI ÇALIŞTIRACAK. Yayınlanmamış taslakları bekleyen kullanım sayısından çıkarır.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_viva_proforma_oku(p_auth_id uuid,p_firma uuid,p_ay date,p_sadece_onayli boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE kisi record; onay public.cogniti_viva_proforma_onaylari%ROWTYPE; belge jsonb; bekleyen integer; kapali boolean;
BEGIN
 IF p_firma IS NULL OR p_ay IS NULL OR p_ay<>date_trunc('month',p_ay)::date OR p_sadece_onayli IS NULL THEN
 RAISE EXCEPTION 'Geçersiz ay.' USING ERRCODE='22023';END IF;
 SELECT lower(btrim(rol)) rol,firma_id INTO kisi FROM public.kullanicilar WHERE kullanici_id=p_auth_id AND aktif_mi;
 IF NOT FOUND OR kisi.rol IS NULL OR kisi.rol NOT IN('admin','firma_admin') THEN RAISE EXCEPTION 'Yetkiniz yok.' USING ERRCODE='42501';END IF;
 IF kisi.rol='firma_admin' AND (p_sadece_onayli OR kisi.firma_id IS DISTINCT FROM p_firma OR NOT EXISTS(
 SELECT 1 FROM public.firmalar WHERE firma_id=p_firma AND aktif AND firma_admin_aktif)) THEN
 RAISE EXCEPTION 'Firma kapsamına erişiminiz yok.' USING ERRCODE='42501';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=p_firma) THEN RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='22023';END IF;
 kapali:=p_ay<date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date;
 SELECT * INTO onay FROM public.cogniti_viva_proforma_onaylari WHERE firma_id=p_firma AND donem=p_ay;
 SELECT count(*) INTO bekleyen FROM public.cogniti_viva_tuketim_isleri j JOIN public.viva_etkinlikler e ON e.etkinlik_id=j.etkinlik_id AND e.firma_id=j.firma_id
 WHERE j.firma_id=p_firma AND e.durum<>'iptal' AND (
 (e.durum<>'taslak' AND date_trunc('month',coalesce(j.kapanis,e.bitis) AT TIME ZONE 'Europe/Istanbul')::date=p_ay AND j.durum<>'tamam')
 OR (j.donem=p_ay AND j.durum='tamam' AND j.toplam_saniye>0 AND (j.usd_dakika IS NULL OR j.kur IS NULL OR j.katsayi IS NULL)));
 IF onay.firma_id IS NOT NULL THEN belge:=onay.belge;
 ELSIF kapali AND NOT p_sadece_onayli THEN belge:=public.cogniti_viva_proforma_belgesi(p_firma,p_ay);END IF;
 RETURN jsonb_build_object('firma_id',p_firma,'ay',to_char(p_ay,'YYYY-MM'),'admin_onayi',kisi.rol='admin','belge',belge,
 'bekleyen',bekleyen,'onaylanabilir',kapali AND bekleyen=0 AND jsonb_array_length(coalesce(belge->'satirlar','[]'::jsonb))>0,
 'onay',CASE WHEN onay.firma_id IS NOT NULL THEN jsonb_build_object('tur',onay.onay_turu,'onaylayan',onay.onaylayan_ad,'tarih',onay.onay_tarihi,'aciklama',onay.aciklama) ELSE NULL END);
END;
$f$;

NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_viva_proforma_taslak_duzeltildi;
