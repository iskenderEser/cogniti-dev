-- Kullanıcı çalıştıracak. Cüzdan satın alım geçmişini hesap kapsamına göre okur.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_cuzdan_satin_alimlari(
 p_auth_id uuid, p_hesap text, p_sayfa integer
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_firma uuid; v_toplam bigint; v_kayitlar jsonb;
BEGIN
 IF p_hesap IS NULL OR p_hesap NOT IN ('kisisel','firma_ortak')
    OR p_sayfa IS NULL OR p_sayfa NOT BETWEEN 0 AND 1000000 THEN
  RAISE EXCEPTION 'Geçersiz cüzdan liste isteği.' USING ERRCODE='22023';
 END IF;
 SELECT k.firma_id INTO v_firma FROM public.kullanicilar k JOIN public.firmalar f USING(firma_id)
 WHERE k.kullanici_id=p_auth_id AND k.aktif_mi=true AND f.aktif=true
 AND lower(btrim(k.rol)) IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per',
  'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin');
 IF v_firma IS NULL THEN RAISE EXCEPTION 'Token bakiyelerine erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 WITH kayitlar AS (
  SELECT o.siparis_id AS kayit_id,o.siparis_tarihi,o.satin_alan_ad_soyad,b.bakiye_turu,
   'esnek'::text AS paket_turu,o.token_adedi,o.birim_fiyat,o.toplam_tutar,
   round(o.toplam_tutar / 5,2) AS kdv
  FROM public.cogniti_esnek_paket_siparisleri o
  JOIN public.cogniti_satin_alma_bakiyeleri b ON b.bakiye_id=o.bakiye_id AND b.firma_id=o.firma_id
  WHERE o.firma_id=v_firma AND b.bakiye_turu=p_hesap
    AND (p_hesap='firma_ortak' OR (b.sahip_id=p_auth_id AND o.satin_alan_id=p_auth_id))
  UNION ALL
  SELECT s.siparis_id,s.created_at,concat_ws(' ',kisi.ad,kisi.soyad),s.hesap_turu,
   'abonelik_baslangic',coalesce(s.ilk_donem_token,s.aylik_token),s.birim_fiyat,
   coalesce(s.ilk_donem_kurus,s.aylik_kurus)::numeric / 100,
   coalesce(s.ilk_donem_kdv_kurus,s.kdv_kurus)::numeric / 100
  FROM public.cogniti_abonelik_siparisleri s
  LEFT JOIN public.kullanicilar kisi ON kisi.kullanici_id=s.siparis_veren_id AND kisi.firma_id=s.firma_id
  WHERE s.firma_id=v_firma AND s.hesap_turu=p_hesap
    AND (p_hesap='firma_ortak' OR s.siparis_veren_id=p_auth_id)
  UNION ALL
  SELECT y.yukleme_id,y.created_at,concat_ws(' ',kisi.ad,kisi.soyad),s.hesap_turu,
   'abonelik_devam',y.miktar,s.birim_fiyat,s.aylik_kurus::numeric / 100,s.kdv_kurus::numeric / 100
  FROM public.cogniti_abonelik_siparisleri s
  JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.abonelik_siparis_id=s.siparis_id AND y.firma_id=s.firma_id
  LEFT JOIN public.kullanicilar kisi ON kisi.kullanici_id=s.siparis_veren_id AND kisi.firma_id=s.firma_id
  WHERE s.firma_id=v_firma AND s.hesap_turu=p_hesap
    AND (p_hesap='firma_ortak' OR s.siparis_veren_id=p_auth_id)
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
  WHERE y.firma_id=v_firma AND b.bakiye_turu=p_hesap AND y.kko_donem IS NOT NULL AND t.token>0
    AND (p_hesap='firma_ortak' OR b.sahip_id=p_auth_id)

 )
 SELECT (SELECT count(*) FROM kayitlar),
  coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.siparis_tarihi DESC,s.kayit_id DESC,s.paket_turu),'[]'::jsonb)
 INTO v_toplam,v_kayitlar FROM (
  SELECT * FROM kayitlar ORDER BY siparis_tarihi DESC,kayit_id DESC,paket_turu LIMIT 20 OFFSET p_sayfa*20
 ) s;
 RETURN jsonb_build_object('firma_id',v_firma,'siparisler',v_kayitlar,'toplam',v_toplam,'sayfa',p_sayfa,'sayfa_boyutu',20);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_cuzdan_satin_alimlari(uuid,text,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_cuzdan_satin_alimlari(uuid,text,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_cuzdan_satin_alimlari_kuruldu;
