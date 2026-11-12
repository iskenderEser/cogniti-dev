-- Kullanıcı çalıştıracak. Esnek sipariş ve firma yönetimi altyapısı gerekir.
BEGIN;
CREATE TABLE IF NOT EXISTS public.cogniti_esnek_proforma_onaylari (
 siparis_id uuid PRIMARY KEY REFERENCES public.cogniti_esnek_paket_siparisleri(siparis_id),
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 onaylayan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 onaylayan_ad text NOT NULL,
 onay_turu text NOT NULL CHECK(onay_turu IN ('firma','admin')),
 aciklama text NOT NULL DEFAULT '',
 onay_tarihi timestamptz NOT NULL DEFAULT statement_timestamp(),
 belge jsonb NOT NULL,
 CHECK(length(aciklama)<=2000 AND (onay_turu<>'admin' OR length(btrim(aciklama))>0))
);
ALTER TABLE public.cogniti_esnek_proforma_onaylari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_esnek_proforma_onaylari FROM PUBLIC,anon,authenticated,service_role;

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

CREATE OR REPLACE FUNCTION public.cogniti_esnek_proformalari_oku(
 p_auth_id uuid,p_firma uuid,p_sayfa integer DEFAULT 0,p_arama text DEFAULT '',p_sadece_onayli boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE kisi record; toplam bigint; kayitlar jsonb;
 arama text:=lower(translate(btrim(coalesce(p_arama,'')),'Iİ','ıi'));
BEGIN
 IF p_firma IS NULL OR p_sayfa IS NULL OR p_sayfa NOT BETWEEN 0 AND 1000000 OR length(arama)>80 OR p_sadece_onayli IS NULL THEN
  RAISE EXCEPTION 'Geçersiz liste isteği.' USING ERRCODE='22023';
 END IF;
 SELECT lower(btrim(k.rol)) rol,k.firma_id INTO kisi FROM public.kullanicilar k
 WHERE k.kullanici_id=p_auth_id AND k.aktif_mi;
 IF NOT FOUND OR kisi.rol IS NULL OR kisi.rol NOT IN ('admin','firma_admin') THEN
  RAISE EXCEPTION 'Bu alana erişiminiz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 IF kisi.rol='firma_admin' AND (p_sadece_onayli OR kisi.firma_id IS DISTINCT FROM p_firma OR NOT EXISTS(
  SELECT 1 FROM public.firmalar WHERE firma_id=p_firma AND aktif AND firma_admin_aktif
 )) THEN RAISE EXCEPTION 'Firma kapsamına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=p_firma) THEN
  RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='22023';
 END IF;
 WITH eslesenler AS MATERIALIZED (
  SELECT s.siparis_id kayit_id,s.siparis_tarihi,s.satin_alan_ad_soyad,b.bakiye_turu,
    'esnek'::text paket_turu,s.token_adedi,s.birim_fiyat,s.toplam_tutar,round(s.toplam_tutar/5,2) kdv,
    o.siparis_id onay_id,o.onay_turu,o.onaylayan_ad,o.onay_tarihi,o.aciklama,o.belge
  FROM public.cogniti_esnek_paket_siparisleri s
  JOIN public.cogniti_satin_alma_bakiyeleri b ON b.bakiye_id=s.bakiye_id AND b.firma_id=s.firma_id
  LEFT JOIN public.cogniti_esnek_proforma_onaylari o ON o.siparis_id=s.siparis_id AND o.firma_id=s.firma_id
  WHERE s.firma_id=p_firma AND (NOT p_sadece_onayli OR o.siparis_id IS NOT NULL)
    AND (arama='' OR strpos(lower(translate(s.satin_alan_ad_soyad,'Iİ','ıi')),arama)>0
      OR strpos('esnek paket',arama)>0)
 ), sayfa AS (
  SELECT * FROM eslesenler ORDER BY siparis_tarihi DESC,kayit_id DESC LIMIT 20 OFFSET p_sayfa*20
 )
 SELECT (SELECT count(*) FROM eslesenler),
  coalesce(jsonb_agg(jsonb_build_object(
   'kayit_id',s.kayit_id,'siparis_tarihi',s.siparis_tarihi,'satin_alan_ad_soyad',s.satin_alan_ad_soyad,
   'bakiye_turu',s.bakiye_turu,'paket_turu',s.paket_turu,'token_adedi',s.token_adedi,'birim_fiyat',s.birim_fiyat,
   'toplam_tutar',s.toplam_tutar,'kdv',s.kdv,
   'proforma',coalesce(s.belge,public.cogniti_esnek_proforma_belgesi(s.kayit_id,p_firma)),
   'onay',CASE WHEN s.onay_id IS NOT NULL THEN jsonb_build_object(
     'tur',s.onay_turu,'onaylayan',s.onaylayan_ad,'tarih',s.onay_tarihi,'aciklama',s.aciklama) ELSE NULL END
  ) ORDER BY s.siparis_tarihi DESC,s.kayit_id DESC),'[]'::jsonb)
 INTO toplam,kayitlar FROM sayfa s;
 RETURN jsonb_build_object('firma_id',p_firma,'siparisler',kayitlar,'toplam',toplam,'sayfa',p_sayfa,'sayfa_boyutu',20,'admin_onayi',kisi.rol='admin');
END;
$f$;

CREATE OR REPLACE FUNCTION public.cogniti_esnek_proforma_onayla(
 p_auth_id uuid,p_firma uuid,p_siparis uuid,p_aciklama text DEFAULT ''
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE kisi record; siparis uuid; onay public.cogniti_esnek_proforma_onaylari%ROWTYPE;
 aciklama text:=btrim(coalesce(p_aciklama,'')); belge jsonb;
BEGIN
 SELECT lower(btrim(k.rol)) rol,k.firma_id,concat_ws(' ',k.ad,k.soyad) ad INTO kisi
 FROM public.kullanicilar k WHERE k.kullanici_id=p_auth_id AND k.aktif_mi;
 IF NOT FOUND OR kisi.rol IS NULL OR kisi.rol NOT IN ('admin','firma_admin') THEN
  RAISE EXCEPTION 'Onay yetkiniz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 IF kisi.rol='firma_admin' AND (kisi.firma_id IS DISTINCT FROM p_firma OR NOT EXISTS(
  SELECT 1 FROM public.firmalar WHERE firma_id=p_firma AND aktif AND firma_admin_aktif
 )) THEN RAISE EXCEPTION 'Firma kapsamına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF length(aciklama)>2000 OR (kisi.rol='admin' AND length(aciklama)=0) THEN
  RAISE EXCEPTION 'Admin onayı için açıklama zorunludur (en fazla 2000 karakter).' USING ERRCODE='22023';
 END IF;
 -- Aynı alım için firma/admin yarışında ilk onay korunur. Tekrarlanan istek yeni kayıt oluşturmaz.
 SELECT siparis_id INTO siparis FROM public.cogniti_esnek_paket_siparisleri
 WHERE siparis_id=p_siparis AND firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Satın alma kaydı bulunamadı.' USING ERRCODE='22023'; END IF;
 SELECT * INTO onay FROM public.cogniti_esnek_proforma_onaylari WHERE siparis_id=siparis;
 IF NOT FOUND THEN
  belge:=public.cogniti_esnek_proforma_belgesi(siparis,p_firma);
  INSERT INTO public.cogniti_esnek_proforma_onaylari(siparis_id,firma_id,onaylayan_id,onaylayan_ad,onay_turu,aciklama,belge)
  VALUES(siparis,p_firma,p_auth_id,kisi.ad,CASE WHEN kisi.rol='admin' THEN 'admin' ELSE 'firma' END,aciklama,belge)
  RETURNING * INTO onay;
 END IF;
 RETURN jsonb_build_object('tur',onay.onay_turu,'onaylayan',onay.onaylayan_ad,'tarih',onay.onay_tarihi,'aciklama',onay.aciklama);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_proforma_belgesi(uuid,uuid),
 public.cogniti_esnek_proformalari_oku(uuid,uuid,integer,text,boolean),
 public.cogniti_esnek_proforma_onayla(uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_esnek_proformalari_oku(uuid,uuid,integer,text,boolean),
 public.cogniti_esnek_proforma_onayla(uuid,uuid,uuid,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_esnek_proforma_onayi_kuruldu;
