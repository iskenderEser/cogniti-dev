-- KULLANICI ÇALIŞTIRACAK. Salt okuma: yeni Esnek hesapları ve gerçek tüketimler.
-- Ön koşul: sipariş, anlık tüketim, Eczanem ortak üretici ve plan rezervasyonu SQLleri.
-- Mevcut KKÖ raporu, tüketim, bloklama ve token bakiyeleri değiştirilmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_firma_esnek_token_kullanimi(
 p_auth_id uuid,p_firma uuid,p_hesap uuid DEFAULT NULL,p_sayfa integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record;v_hesaplar jsonb;v_sonuc jsonb;
BEGIN
 IF p_firma IS NULL OR p_sayfa IS NULL OR p_sayfa NOT BETWEEN 0 AND 1000000 THEN
  RAISE EXCEPTION 'Geçersiz rapor isteği.' USING ERRCODE='22023'; END IF;
 SELECT lower(btrim(rol)) rol,firma_id INTO k FROM public.kullanicilar WHERE kullanici_id=p_auth_id AND aktif_mi=true;
 IF NOT FOUND OR k.rol IS NULL OR k.rol NOT IN ('admin','firma_admin') THEN
  RAISE EXCEPTION 'Token raporuna erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF k.rol='firma_admin' AND (k.firma_id IS DISTINCT FROM p_firma OR NOT EXISTS(
  SELECT 1 FROM public.firmalar WHERE firma_id=p_firma AND aktif=true AND firma_admin_aktif=true
 )) THEN RAISE EXCEPTION 'Firma kapsamına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=p_firma) THEN
  RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='22023'; END IF;
 IF p_hesap IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=p_hesap AND firma_id=p_firma) THEN
  RAISE EXCEPTION 'Token hesabına erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY h.bakiye_turu,h.sahip_adi,h.bakiye_id),'[]'::jsonb) INTO v_hesaplar FROM (
  SELECT b.bakiye_id,b.bakiye_turu,b.sahip_id,
   CASE WHEN b.bakiye_turu='firma_ortak' THEN 'Firma Token Hesabı' ELSE coalesce(nullif(btrim(concat_ws(' ',u.ad,u.soyad)),''),b.sahip_id::text) END sahip_adi,
   coalesce(sum(y.miktar),0) toplam,coalesce(sum(y.miktar-y.kalan),0) kullanilan,
   coalesce(sum(y.kalan-a.adet) FILTER(WHERE y.son_kullanim_at>statement_timestamp()),0) kalan,
   coalesce(sum(a.adet) FILTER(WHERE y.son_kullanim_at>statement_timestamp()),0) ayrilan,
   coalesce(sum(y.kalan) FILTER(WHERE y.son_kullanim_at<=statement_timestamp()),0) suresi_dolan
  FROM public.cogniti_satin_alma_bakiyeleri b
  LEFT JOIN public.kullanicilar u ON u.kullanici_id=b.sahip_id
  LEFT JOIN public.cogniti_esnek_paket_yuklemeleri y ON y.bakiye_id=b.bakiye_id AND y.firma_id=b.firma_id
  LEFT JOIN LATERAL(SELECT public.cogniti_yukleme_ayrilan(y.yukleme_id) adet) a ON true
  WHERE b.firma_id=p_firma GROUP BY b.bakiye_id,b.bakiye_turu,b.sahip_id,u.ad,u.soyad
 ) h;
 WITH ham AS MATERIALIZED (
  SELECT t.tuketim_id id,t.bakiye_id,t.gonderen_id,t.kaynak_id yayin_id,
   CASE WHEN t.akis='eclub_oneri' THEN 'onceki_eclub' WHEN t.alici_turu='eclub_kisi' THEN 'eclub' ELSE 'saha' END akis,
   t.miktar::bigint miktar,t.created_at tarih
  FROM public.cogniti_esnek_gonderim_tuketimleri t WHERE t.firma_id=p_firma
  UNION ALL
  SELECT z.blok_id,z.bakiye_id,h.pm_id,z.yayin_id,'eczanem',1::bigint,z.tuketildi_at
  FROM public.eczanem_token_bloklari z
  JOIN public.eczanem_yayin_token_hesaplari h ON h.yayin_id=z.yayin_id AND h.firma_id=z.firma_id AND h.bakiye_id=z.bakiye_id
  WHERE z.firma_id=p_firma AND z.durum='tuketildi'
 ), gruplar AS MATERIALIZED (
  SELECT min(id::text)::uuid id,bakiye_id,gonderen_id,yayin_id,akis,sum(miktar) token,min(tarih) ilk_tarih,max(tarih) son_tarih
  FROM ham WHERE p_hesap IS NULL OR bakiye_id=p_hesap GROUP BY bakiye_id,gonderen_id,yayin_id,akis
 ), sayfa AS (
  SELECT g.*,coalesce(nullif(btrim(concat_ws(' ',u.ad,u.soyad)),''),g.gonderen_id::text) gonderen,
   coalesce(u.rol,'bilinmiyor') gonderen_rol,v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu
  FROM (SELECT * FROM gruplar ORDER BY son_tarih DESC,id LIMIT 50 OFFSET p_sayfa*50) g
  LEFT JOIN public.kullanicilar u ON u.kullanici_id=g.gonderen_id
  LEFT JOIN LATERAL(SELECT d.firma_adi,d.talep_no,d.urun_adi,d.arac_turu::text FROM public.v_yayin_detay d
   WHERE d.yayin_id=g.yayin_id AND d.firma_id=p_firma ORDER BY d.firma_adi,d.talep_no,d.urun_adi,d.arac_turu LIMIT 1) v ON true
 )
 SELECT jsonb_build_object('firma_id',p_firma,'hesap_id',p_hesap,'sayfa',p_sayfa,'hesaplar',v_hesaplar,
  'satirlar',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY son_tarih DESC,id) FROM sayfa s),'[]'::jsonb),
  'kayit_sayisi',(SELECT count(*) FROM gruplar),'tuketim_toplami',coalesce((SELECT sum(token) FROM gruplar),0)
 ) INTO v_sonuc;
 RETURN v_sonuc;
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_firma_esnek_token_kullanimi(uuid,uuid,uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_firma_esnek_token_kullanimi(uuid,uuid,uuid,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_firma_esnek_token_kullanimi_kuruldu;
