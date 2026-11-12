-- KULLANICI ÇALIŞTIRACAK. Yalnız Viva aylık proforma okuma/onayı; tüketim ve fatura üretimi değişmez.
BEGIN;
CREATE TABLE IF NOT EXISTS public.cogniti_viva_proforma_onaylari (
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 donem date NOT NULL CHECK(donem=date_trunc('month',donem)::date),
 onaylayan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),onaylayan_ad text NOT NULL,
 onay_turu text NOT NULL CHECK(onay_turu IN('firma','admin')),aciklama text NOT NULL DEFAULT '',
 onay_tarihi timestamptz NOT NULL DEFAULT statement_timestamp(),belge jsonb NOT NULL,
 PRIMARY KEY(firma_id,donem),CHECK(length(aciklama)<=2000 AND (onay_turu<>'admin' OR length(btrim(aciklama))>0))
);
ALTER TABLE public.cogniti_viva_proforma_onaylari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_viva_proforma_onaylari FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_viva_proforma_belgesi(p_firma uuid,p_ay date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 WITH satirlar AS (
 SELECT j.etkinlik_id,e.baslangic yayin_tarihi,e.baslik yayin_adi,concat_ws(' ',k.ad,k.soyad) duzenleyen,
 coalesce(j.katilim_sayisi,0) katilimci_sayisi,j.toplam_saniye/60 kisi_dakika,
 round(j.usd_dakika*j.kur*j.katsayi,2) birim_fiyat,
 round(j.toplam_saniye/60*round(j.usd_dakika*j.kur*j.katsayi,2),2) tutar
 FROM public.cogniti_viva_tuketim_isleri j
 JOIN public.viva_etkinlikler e ON e.etkinlik_id=j.etkinlik_id AND e.firma_id=j.firma_id
 LEFT JOIN public.kullanicilar k ON k.kullanici_id=j.sahip_id AND k.firma_id=j.firma_id
 WHERE j.firma_id=p_firma AND j.donem=p_ay AND j.durum='tamam' AND j.toplam_saniye>0
 ), ozet AS (
 SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.yayin_tarihi,s.etkinlik_id),'[]'::jsonb) kalemler,
 coalesce(sum(tutar),0) toplam FROM satirlar s
 )
 SELECT jsonb_build_object('firma_id',p_firma,'donem',to_char(p_ay,'YYYY-MM'),
 'belge_no','PF-V-'||to_char(p_ay,'YYYYMM')||'-'||p_firma::text,'tarih',(p_ay+interval '1 month')::date,
 'duzenleyen',jsonb_build_object('unvan','Mill Danışmanlık Org. ve Eğt. Hiz. Ltd. Şti',
 'adres','Göktürk Merkez M. İstanbul C. Üstüküme S. No: D51 Göktürk-Eyüp-İstanbul',
 'vergi_dairesi','Gaziosmanpaşa','vergi_numarasi','6210464784'),
 'alici',jsonb_build_object('unvan',a.firma_adi,'adres',coalesce(a.adres,''),
 'vergi_dairesi',coalesce(a.vergi_dairesi,''),'vergi_numarasi',coalesce(a.vergi_numarasi,'')),
 'satirlar',o.kalemler,'toplam_tutar',o.toplam,'kdv',round(o.toplam/5,2),'genel_tutar',o.toplam+round(o.toplam/5,2))
 FROM public.firmalar a CROSS JOIN ozet o WHERE a.firma_id=p_firma;
$f$;

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

CREATE OR REPLACE FUNCTION public.cogniti_viva_proforma_onayla(p_auth_id uuid,p_firma uuid,p_ay date,p_aciklama text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE veri jsonb; ad text; onay public.cogniti_viva_proforma_onaylari%ROWTYPE; notu text:=btrim(coalesce(p_aciklama,''));
BEGIN
 veri:=public.cogniti_viva_proforma_oku(p_auth_id,p_firma,p_ay,false);
 IF length(notu)>2000 OR ((veri->>'admin_onayi')::boolean AND length(notu)=0) THEN RAISE EXCEPTION 'Admin açıklaması zorunludur.' USING ERRCODE='22023';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('viva-proforma:'||p_firma::text||':'||p_ay::text,0));
 SELECT * INTO onay FROM public.cogniti_viva_proforma_onaylari WHERE firma_id=p_firma AND donem=p_ay;
 IF NOT FOUND THEN
 PERFORM 1 FROM public.cogniti_viva_tuketim_isleri j JOIN public.viva_etkinlikler e USING(etkinlik_id)
 WHERE j.firma_id=p_firma AND coalesce(j.donem,date_trunc('month',coalesce(j.kapanis,e.bitis) AT TIME ZONE 'Europe/Istanbul')::date)=p_ay FOR UPDATE OF j;
 veri:=public.cogniti_viva_proforma_oku(p_auth_id,p_firma,p_ay,false);
 IF NOT (veri->>'onaylanabilir')::boolean THEN RAISE EXCEPTION 'Ay kapanmalı ve kullanımlar kesinleşmelidir.' USING ERRCODE='22023';END IF;
 SELECT concat_ws(' ',k.ad,k.soyad) INTO ad FROM public.kullanicilar k WHERE kullanici_id=p_auth_id;
 INSERT INTO public.cogniti_viva_proforma_onaylari(firma_id,donem,onaylayan_id,onaylayan_ad,onay_turu,aciklama,belge)
 VALUES(p_firma,p_ay,p_auth_id,ad,CASE WHEN (veri->>'admin_onayi')::boolean THEN 'admin' ELSE 'firma' END,notu,veri->'belge') RETURNING * INTO onay;
 END IF;
 RETURN jsonb_build_object('tur',onay.onay_turu,'onaylayan',onay.onaylayan_ad,'tarih',onay.onay_tarihi,'aciklama',onay.aciklama);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_viva_proforma_belgesi(uuid,date),public.cogniti_viva_proforma_oku(uuid,uuid,date,boolean),public.cogniti_viva_proforma_onayla(uuid,uuid,date,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_viva_proforma_oku(uuid,uuid,date,boolean),public.cogniti_viva_proforma_onayla(uuid,uuid,date,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_viva_proforma_onayi_kuruldu;
