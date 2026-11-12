-- KULLANICI ÇALIŞTIRACAK. Banner alımlarının aylık proforma ve onay kaydı.
BEGIN;
CREATE TABLE IF NOT EXISTS public.cogniti_banner_proforma_onaylari (
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 donem date NOT NULL CHECK(donem=date_trunc('month',donem)::date),
 onaylayan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),onaylayan_ad text NOT NULL,
 onay_turu text NOT NULL CHECK(onay_turu IN('firma','admin')),aciklama text NOT NULL DEFAULT '',
 onay_tarihi timestamptz NOT NULL DEFAULT statement_timestamp(),belge jsonb NOT NULL,
 PRIMARY KEY(firma_id,donem),CHECK(length(aciklama)<=2000 AND (onay_turu<>'admin' OR length(btrim(aciklama))>0))
);
ALTER TABLE public.cogniti_banner_proforma_onaylari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_banner_proforma_onaylari FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_banner_proforma_kalemleri(p_firma uuid,p_ay date)
RETURNS TABLE(tuketim_id uuid, tarih timestamptz, alan text, sira smallint, hafta_sayisi smallint,
 token_adedi bigint, birim_fiyat numeric, tutar numeric, test_kaydi boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT t.tuketim_id,t.created_at,
 CASE WHEN t.islem_turu='banner_iptal' THEN 'İptal Bedeli' ELSE r.alan END,
 r.sira,r.hafta_sayisi,t.miktar,f.birim_fiyat,round(t.miktar*f.birim_fiyat,2),
 t.islem_anahtari LIKE 'cogniti-test:banner:%'
 FROM public.cogniti_token_tuketimleri t
 JOIN public.firma_banner_rezervasyonlari r ON r.rezervasyon_id=t.kaynak_id AND r.firma_id=t.firma_id
 LEFT JOIN public.cogniti_fiyat_tarifesi_gecmisi g ON g.surum=r.tarife_surumu
 LEFT JOIN public.cogniti_fiyat_tarifesi a ON a.tekil AND (r.tarife_surumu IS NULL OR a.surum=r.tarife_surumu)
 CROSS JOIN LATERAL (
  SELECT (coalesce(g.degerler,a.degerler)->>'kko_token_tl')::numeric birim_fiyat
 ) f
 WHERE t.firma_id=p_firma AND t.islem_turu IN('banner_yayin','banner_iptal')
 AND t.created_at>=p_ay::timestamp AT TIME ZONE 'Europe/Istanbul'
 AND t.created_at<(p_ay+interval '1 month') AT TIME ZONE 'Europe/Istanbul';
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_banner_proforma_belgesi(p_firma uuid,p_ay date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 WITH satirlar AS (
 SELECT * FROM public.cogniti_banner_proforma_kalemleri(p_firma,p_ay)
 WHERE birim_fiyat>0 AND birim_fiyat::text NOT IN('NaN','Infinity','-Infinity')
 ), ozet AS (
 SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.tarih,s.tuketim_id),'[]'::jsonb) kalemler,
 coalesce(sum(tutar),0) toplam FROM satirlar s
 )
 SELECT jsonb_build_object('firma_id',p_firma,'donem',to_char(p_ay,'YYYY-MM'),
 'belge_no','PF-B-'||to_char(p_ay,'YYYYMM')||'-'||p_firma::text,'tarih',(p_ay+interval '1 month')::date,
 'duzenleyen',jsonb_build_object('unvan','Mill Danışmanlık Org. ve Eğt. Hiz. Ltd. Şti',
 'adres','Göktürk Merkez M. İstanbul C. Üstüküme S. No: D51 Göktürk-Eyüp-İstanbul',
 'vergi_dairesi','Gaziosmanpaşa','vergi_numarasi','6210464784'),
 'alici',jsonb_build_object('unvan',a.firma_adi,'adres',coalesce(a.adres,''),
 'vergi_dairesi',coalesce(a.vergi_dairesi,''),'vergi_numarasi',coalesce(a.vergi_numarasi,'')),
 'satirlar',o.kalemler,'toplam_tutar',o.toplam,'kdv',round(o.toplam/5,2),'genel_tutar',o.toplam+round(o.toplam/5,2))
 FROM public.firmalar a CROSS JOIN ozet o WHERE a.firma_id=p_firma;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_banner_proforma_oku(p_auth_id uuid,p_firma uuid,p_ay date,p_sadece_onayli boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE kisi record; onay public.cogniti_banner_proforma_onaylari%ROWTYPE; belge jsonb; bekleyen integer; kapali boolean;
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
 SELECT * INTO onay FROM public.cogniti_banner_proforma_onaylari WHERE firma_id=p_firma AND donem=p_ay;
 SELECT count(*) INTO bekleyen FROM public.cogniti_banner_proforma_kalemleri(p_firma,p_ay)
 WHERE birim_fiyat IS NULL OR birim_fiyat<=0 OR birim_fiyat::text IN('NaN','Infinity','-Infinity');
 IF onay.firma_id IS NOT NULL THEN belge:=onay.belge;
 ELSIF kapali AND NOT p_sadece_onayli AND bekleyen=0 THEN belge:=public.cogniti_banner_proforma_belgesi(p_firma,p_ay);END IF;
 RETURN jsonb_build_object('firma_id',p_firma,'ay',to_char(p_ay,'YYYY-MM'),'admin_onayi',kisi.rol='admin','belge',belge,
 'bekleyen',bekleyen,'onaylanabilir',kapali AND bekleyen=0 AND jsonb_array_length(coalesce(belge->'satirlar','[]'::jsonb))>0,
 'onay',CASE WHEN onay.firma_id IS NOT NULL THEN jsonb_build_object('tur',onay.onay_turu,'onaylayan',onay.onaylayan_ad,'tarih',onay.onay_tarihi,'aciklama',onay.aciklama) ELSE NULL END);
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_banner_proforma_onayla(p_auth_id uuid,p_firma uuid,p_ay date,p_aciklama text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE veri jsonb; ad text; onay public.cogniti_banner_proforma_onaylari%ROWTYPE; notu text:=btrim(coalesce(p_aciklama,''));
BEGIN
 veri:=public.cogniti_banner_proforma_oku(p_auth_id,p_firma,p_ay,false);
 IF length(notu)>2000 OR ((veri->>'admin_onayi')::boolean AND length(notu)=0) THEN RAISE EXCEPTION 'Admin açıklaması zorunludur.' USING ERRCODE='22023';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('banner-proforma:'||p_firma::text||':'||p_ay::text,0));
 SELECT * INTO onay FROM public.cogniti_banner_proforma_onaylari WHERE firma_id=p_firma AND donem=p_ay;
 IF NOT FOUND THEN

 veri:=public.cogniti_banner_proforma_oku(p_auth_id,p_firma,p_ay,false);
 IF NOT (veri->>'onaylanabilir')::boolean THEN RAISE EXCEPTION 'Ay kapanmalı ve banner tutarları hesaplanmış olmalıdır.' USING ERRCODE='22023';END IF;
 SELECT concat_ws(' ',k.ad,k.soyad) INTO ad FROM public.kullanicilar k WHERE kullanici_id=p_auth_id;
 INSERT INTO public.cogniti_banner_proforma_onaylari(firma_id,donem,onaylayan_id,onaylayan_ad,onay_turu,aciklama,belge)
 VALUES(p_firma,p_ay,p_auth_id,ad,CASE WHEN (veri->>'admin_onayi')::boolean THEN 'admin' ELSE 'firma' END,notu,veri->'belge') RETURNING * INTO onay;
 END IF;
 RETURN jsonb_build_object('tur',onay.onay_turu,'onaylayan',onay.onaylayan_ad,'tarih',onay.onay_tarihi,'aciklama',onay.aciklama);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_banner_proforma_kalemleri(uuid,date),public.cogniti_banner_proforma_belgesi(uuid,date),public.cogniti_banner_proforma_oku(uuid,uuid,date,boolean),public.cogniti_banner_proforma_onayla(uuid,uuid,date,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_banner_proforma_oku(uuid,uuid,date,boolean),public.cogniti_banner_proforma_onayla(uuid,uuid,date,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_banner_proforma_onayi_kuruldu;
