-- Kullanıcı çalıştıracak. Ön koşul: abonelik ilk dönem oranı, aylık token yükleme ve rol bazlı KKÖ.
-- Yalnız okuma; sipariş, yükleme, tüketim ve tablo izinleri değiştirilmez.
BEGIN;
DROP FUNCTION IF EXISTS public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer);
CREATE OR REPLACE FUNCTION public.cogniti_firma_satin_alinan_paketler(
 p_auth_id uuid,p_firma uuid,p_sayfa integer,p_arama text,p_paket text
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record; v_toplam bigint; v_kayitlar jsonb;
 v_arama text := lower(translate(btrim(coalesce(p_arama,'')),'Iİ','ıi'));
BEGIN
 IF p_firma IS NULL OR p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>1000000
    OR p_paket IS NULL OR p_paket NOT IN ('tum','esnek','abonelik','kko') THEN
  RAISE EXCEPTION 'Geçersiz liste isteği.' USING ERRCODE='22023';
 END IF;
 IF length(v_arama)>80 THEN
  RAISE EXCEPTION 'Geçersiz arama.' USING ERRCODE='22023';
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
 WITH kayitlar AS (
  SELECT o.siparis_id AS kayit_id,o.siparis_tarihi,o.satin_alan_ad_soyad,b.bakiye_turu,
   'esnek'::text AS paket_turu,o.token_adedi,o.birim_fiyat,o.toplam_tutar,
   round(o.toplam_tutar / 5,2) AS kdv
  FROM public.cogniti_esnek_paket_siparisleri o
  JOIN public.cogniti_satin_alma_bakiyeleri b ON b.bakiye_id=o.bakiye_id AND b.firma_id=o.firma_id
  WHERE p_paket IN ('tum','esnek') AND o.firma_id=p_firma
  UNION ALL
  SELECT s.siparis_id,s.created_at,concat_ws(' ',kisi.ad,kisi.soyad),s.hesap_turu,
   'abonelik_baslangic',coalesce(s.ilk_donem_token,s.aylik_token),s.birim_fiyat,
   coalesce(s.ilk_donem_kurus,s.aylik_kurus)::numeric / 100,
   coalesce(s.ilk_donem_kdv_kurus,s.kdv_kurus)::numeric / 100
  FROM public.cogniti_abonelik_siparisleri s
  LEFT JOIN public.kullanicilar kisi ON kisi.kullanici_id=s.siparis_veren_id AND kisi.firma_id=s.firma_id
  WHERE p_paket IN ('tum','abonelik') AND s.firma_id=p_firma
  UNION ALL
  SELECT y.yukleme_id,y.created_at,concat_ws(' ',kisi.ad,kisi.soyad),s.hesap_turu,
   'abonelik_devam',y.miktar,s.birim_fiyat,s.aylik_kurus::numeric / 100,s.kdv_kurus::numeric / 100
  FROM public.cogniti_abonelik_siparisleri s
  JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.abonelik_siparis_id=s.siparis_id AND y.firma_id=s.firma_id
  LEFT JOIN public.kullanicilar kisi ON kisi.kullanici_id=s.siparis_veren_id AND kisi.firma_id=s.firma_id
  WHERE p_paket IN ('tum','abonelik') AND s.firma_id=p_firma
    AND date_trunc('month',y.created_at AT TIME ZONE 'Europe/Istanbul')
      > date_trunc('month',s.created_at AT TIME ZONE 'Europe/Istanbul')
  UNION ALL
  SELECT y.yukleme_id,y.kko_donem::timestamp AT TIME ZONE 'Europe/Istanbul',
   CASE WHEN b.bakiye_turu='firma_ortak' THEN 'Firma Token Hesabı' ELSE concat_ws(' ',kisi.ad,kisi.soyad) END,
   b.bakiye_turu,'kko',t.token,y.kko_birim_fiyat,t.token*y.kko_birim_fiyat,
   round(t.token*y.kko_birim_fiyat / 5,2)
  FROM public.cogniti_esnek_paket_yuklemeleri y
  JOIN public.cogniti_satin_alma_bakiyeleri b ON b.bakiye_id=y.bakiye_id AND b.firma_id=y.firma_id
  LEFT JOIN public.kullanicilar kisi ON kisi.kullanici_id=b.sahip_id AND kisi.firma_id=b.firma_id
  CROSS JOIN LATERAL (
   SELECT coalesce(sum(g.miktar),0) + (
    SELECT count(*) FROM public.eczanem_token_bloklari z
    WHERE z.yukleme_id=y.yukleme_id AND z.firma_id=y.firma_id AND z.bakiye_id=y.bakiye_id AND z.durum='tuketildi'
   ) AS token
   FROM public.cogniti_esnek_gonderim_tuketimleri g
   WHERE g.yukleme_id=y.yukleme_id AND g.firma_id=y.firma_id AND g.bakiye_id=y.bakiye_id
  ) t
  WHERE p_paket='kko' AND y.firma_id=p_firma AND y.kko_donem IS NOT NULL AND t.token>0
 ), eslesenler AS (
  SELECT * FROM kayitlar
  WHERE v_arama=''
    OR strpos(lower(translate(satin_alan_ad_soyad,'Iİ','ıi')),v_arama)>0
    OR strpos(lower(translate(CASE paket_turu
      WHEN 'esnek' THEN 'Esnek Paket'
      WHEN 'abonelik_baslangic' THEN 'Abonelik Başlangıç'
      WHEN 'abonelik_devam' THEN 'Abonelik Devam'
    END,'Iİ','ıi')),v_arama)>0
 )
 SELECT (SELECT count(*) FROM eslesenler),
  coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.siparis_tarihi DESC,s.kayit_id DESC,s.paket_turu),'[]'::jsonb)
 INTO v_toplam,v_kayitlar FROM (
  SELECT * FROM eslesenler ORDER BY siparis_tarihi DESC,kayit_id DESC,paket_turu LIMIT 20 OFFSET p_sayfa*20
 ) s;
 RETURN jsonb_build_object('firma_id',p_firma,'siparisler',v_kayitlar,'toplam',v_toplam,'sayfa',p_sayfa,'sayfa_boyutu',20);
END;
$f$;
CREATE OR REPLACE FUNCTION public.cogniti_firma_satin_alinan_paketler(
 p_auth_id uuid,p_firma uuid,p_sayfa integer,p_arama text,p_yalniz_esnek boolean
)
RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $f$
 SELECT public.cogniti_firma_satin_alinan_paketler(p_auth_id,p_firma,p_sayfa,p_arama,
  (CASE WHEN p_yalniz_esnek THEN 'esnek' ELSE 'tum' END)::text);
$f$;
CREATE OR REPLACE FUNCTION public.cogniti_firma_satin_alinan_paketler(
 p_auth_id uuid,p_firma uuid,p_sayfa integer DEFAULT 0,p_arama text DEFAULT ''
)
RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $f$
 SELECT public.cogniti_firma_satin_alinan_paketler(p_auth_id,p_firma,p_sayfa,p_arama,'tum'::text);
$f$;
REVOKE ALL ON FUNCTION public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer,text,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer,text,boolean) TO service_role;
REVOKE ALL ON FUNCTION public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_firma_satin_alinan_paketler(uuid,uuid,integer,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_satin_alinan_paketler_tablosu_guncellendi;
