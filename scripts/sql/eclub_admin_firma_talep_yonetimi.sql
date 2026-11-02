-- Adım 6: admin E-Club çek taleplerinin firma bazında takibi.
BEGIN;
CREATE OR REPLACE FUNCTION public.eclub_admin_talep_json(t public.eclub_store_cek_talepleri)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
 SELECT jsonb_build_object(
 'talep_id',t.talep_id,'firma_id',t.firma_id,'yayin_id',t.yayin_id,'created_at',t.created_at,
 'durum',t.durum,'toplanan_puan',t.toplanan_puan,'talep_edilen_cek_tl',t.talep_edilen_cek_tl,
 'siparis_verildi_mi',t.siparis_verildi_mi,'siparis_adet',t.siparis_adet,'siparis_mal_fazlasi',t.siparis_mal_fazlasi,
 'tm_onay_tarihi',t.tm_onay_tarihi,'cek_kodu',t.cek_kodu,'cek_gonderim_tarihi',t.cek_gonderim_tarihi,
 'eczane_adi',coalesce((SELECT em.eczane_adi FROM public.eclub_eczaneler e LEFT JOIN public.eclub_eczane_master em ON em.gln=e.gln WHERE e.eczane_id=t.eczane_id),'Eczane'),
 'gln',(SELECT gln FROM public.eclub_eczaneler WHERE eczane_id=t.eczane_id),
 'talep_eden',coalesce((SELECT concat_ws(' ',ad,soyad) FROM public.eclub_kisiler WHERE kisi_id=t.talep_eden_kisi_id),'—'),
 'rol',(SELECT rol FROM public.eclub_kisiler WHERE kisi_id=t.talep_eden_kisi_id),
 'utt_adi',coalesce((SELECT concat_ws(' ',ad,soyad) FROM public.kullanicilar WHERE kullanici_id=t.utt_id),'—'),
 'bm_adi',coalesce((SELECT concat_ws(' ',ad,soyad) FROM public.kullanicilar WHERE kullanici_id=t.bm_id),'—'),
 'tm_adi',coalesce((SELECT concat_ws(' ',ad,soyad) FROM public.kullanicilar WHERE kullanici_id=t.tm_id),'—'),
 'urun_adi',coalesce((SELECT u.urun_adi FROM public.v_yayin_kunye k LEFT JOIN public.urunler u ON u.urun_id=k.urun_id WHERE k.yayin_id=t.yayin_id),'Ürün'),
 'talep_no',(SELECT talep_no FROM public.v_yayin_kunye WHERE yayin_id=t.yayin_id),
 'teslimat',coalesce((SELECT jsonb_agg(x) FROM (SELECT kanal,durum,count(*) AS adet FROM public.eclub_cek_teslimat_outbox WHERE talep_id=t.talep_id GROUP BY kanal,durum)x),'[]'::jsonb)
 );
$fn$;

CREATE OR REPLACE FUNCTION public.eclub_admin_firma_ozetleri()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
 WITH a AS (SELECT * FROM public.eclub_store_cek_talepleri WHERE tm_id IS NOT NULL AND tm_onay_tarihi IS NOT NULL
  AND durum IN ('onaylandi','teslimat_bekliyor','cek_kodlari_gonderildi','iptal'))
 SELECT jsonb_build_object('firmalar',coalesce(jsonb_agg(jsonb_build_object(
  'firma_id',f.firma_id,'firma_adi',f.firma_adi,'aktif',f.aktif,'eclub_aktif',f.eclub_aktif,
  'toplam',o.toplam,'bekleyen',o.bekleyen,'teslimatta',o.teslimatta,'tamamlanan',o.tamamlanan,'iptal',o.iptal,'puan',o.puan,'tl',o.tl
 ) ORDER BY f.firma_adi),'[]'::jsonb)) FROM public.firmalar f CROSS JOIN LATERAL (
  SELECT count(*) toplam,count(*) FILTER(WHERE durum='onaylandi') bekleyen,
  count(*) FILTER(WHERE durum='teslimat_bekliyor') teslimatta,count(*) FILTER(WHERE durum='cek_kodlari_gonderildi') tamamlanan,
  count(*) FILTER(WHERE durum='iptal') iptal,coalesce(sum(toplanan_puan) FILTER(WHERE durum<>'iptal'),0) puan,
  coalesce(sum(talep_edilen_cek_tl) FILTER(WHERE durum<>'iptal'),0) tl FROM a WHERE firma_id=f.firma_id
 )o WHERE f.firma_id<>'15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid;
$fn$;

CREATE OR REPLACE FUNCTION public.eclub_admin_firma_talepleri(
 p_firma uuid,p_durum text DEFAULT NULL,p_bas date DEFAULT NULL,p_son date DEFAULT NULL,
 p_arama text DEFAULT NULL,p_sayfa integer DEFAULT 1,p_export boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $fn$
DECLARE sonuc jsonb;
BEGIN
 IF p_firma IS NULL OR p_firma='15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid
 OR (p_durum IS NOT NULL AND p_durum NOT IN ('onaylandi','teslimat_bekliyor','cek_kodlari_gonderildi','iptal'))
 OR (p_bas IS NOT NULL AND p_son IS NOT NULL AND p_bas>p_son)
 OR coalesce(length(p_arama),0)>200 OR p_sayfa IS NULL OR p_sayfa<1 OR p_sayfa>1000000 THEN
 RAISE EXCEPTION 'Firma veya filtre bilgisi geçersiz.' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=p_firma) THEN
 RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='P0002'; END IF;
 WITH a AS MATERIALIZED (
  SELECT t.*,public.eclub_admin_talep_json(t) AS bilgi FROM public.eclub_store_cek_talepleri t
  WHERE t.firma_id=p_firma AND t.tm_id IS NOT NULL AND t.tm_onay_tarihi IS NOT NULL
   AND t.durum IN ('onaylandi','teslimat_bekliyor','cek_kodlari_gonderildi','iptal')
   AND (p_durum IS NULL OR t.durum=p_durum)
   AND (p_bas IS NULL OR t.created_at>=p_bas::timestamp AT TIME ZONE 'Europe/Istanbul')
   AND (p_son IS NULL OR t.created_at<(p_son+1)::timestamp AT TIME ZONE 'Europe/Istanbul')
 ), b AS MATERIALIZED (
  SELECT * FROM a WHERE nullif(trim(p_arama),'') IS NULL
  OR concat_ws(' ',bilgi->>'eczane_adi',bilgi->>'gln',bilgi->>'talep_eden',bilgi->>'urun_adi',bilgi->>'utt_adi',bilgi->>'bm_adi',bilgi->>'tm_adi') ILIKE '%'||p_arama||'%'
 ), sayfa AS (
  SELECT * FROM b ORDER BY created_at DESC,talep_id
  LIMIT CASE WHEN p_export THEN NULL ELSE 50 END OFFSET CASE WHEN p_export THEN 0 ELSE (p_sayfa-1)*50 END
 ), urun AS (
  SELECT bilgi->>'urun_adi' urun_adi,count(*) adet,sum(toplanan_puan) puan,sum(talep_edilen_cek_tl) tl
  FROM b WHERE durum<>'iptal' GROUP BY bilgi->>'urun_adi'
 )
 SELECT jsonb_build_object(
  'firma',(SELECT jsonb_build_object('firma_id',firma_id,'firma_adi',firma_adi) FROM public.firmalar WHERE firma_id=p_firma),
  'ozet',jsonb_build_object('toplam',count(*),'bekleyen',count(*) FILTER(WHERE durum='onaylandi'),
   'teslimatta',count(*) FILTER(WHERE durum='teslimat_bekliyor'),'tamamlanan',count(*) FILTER(WHERE durum='cek_kodlari_gonderildi'),
   'iptal',count(*) FILTER(WHERE durum='iptal'),'puan',coalesce(sum(toplanan_puan) FILTER(WHERE durum<>'iptal'),0),
   'tl',coalesce(sum(talep_edilen_cek_tl) FILTER(WHERE durum<>'iptal'),0)),
  'toplam',count(*),'sayfa',p_sayfa,
  'talepler',coalesce((SELECT jsonb_agg(bilgi ORDER BY created_at DESC,talep_id) FROM sayfa),'[]'::jsonb),
  'urun_ozeti',coalesce((SELECT jsonb_agg(urun ORDER BY urun_adi) FROM urun),'[]'::jsonb)
 ) INTO sonuc FROM b;
 RETURN sonuc;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.eclub_admin_firma_talep_islem(
 p_admin uuid,p_firma uuid,p_talep uuid,p_islem text,p_kod text DEFAULT NULL
) RETURNS TABLE(ok boolean,hata text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE t public.eclub_store_cek_talepleri%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin AND lower(rol)='admin' AND aktif_mi=true) THEN
  RAISE EXCEPTION 'Admin yetkisi doğrulanamadı.' USING ERRCODE='42501'; END IF;
 IF p_firma IS NULL OR p_firma='15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid OR p_islem IS NULL OR p_islem NOT IN ('cek_kodu_teslim','iptal') THEN
  RAISE EXCEPTION 'Firma veya işlem geçersiz.' USING ERRCODE='22023'; END IF;
 SELECT * INTO t FROM public.eclub_store_cek_talepleri WHERE talep_id=p_talep FOR UPDATE;
 IF t.talep_id IS NULL OR t.firma_id IS DISTINCT FROM p_firma THEN
  RAISE EXCEPTION 'Talep seçilen firmaya ait değil.' USING ERRCODE='42501'; END IF;
 IF t.tm_id IS NULL OR t.tm_onay_tarihi IS NULL THEN
  RETURN QUERY SELECT false,'Talep henüz TM son onayından geçmedi.'; RETURN;
 END IF;
 IF p_islem='cek_kodu_teslim' THEN
  RETURN QUERY SELECT * FROM public.eclub_store_admin_kod_teslim(p_admin,p_talep,p_kod);
 ELSE
  RETURN QUERY SELECT * FROM public.eclub_store_cek_talebi_iptal(p_talep,p_admin,true);
 END IF;
END;
$fn$;
REVOKE ALL ON FUNCTION public.eclub_admin_talep_json(public.eclub_store_cek_talepleri) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.eclub_admin_firma_ozetleri() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.eclub_admin_firma_talepleri(uuid,text,date,date,text,integer,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.eclub_admin_firma_talep_islem(uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_admin_talep_json(public.eclub_store_cek_talepleri) TO service_role;
GRANT EXECUTE ON FUNCTION public.eclub_admin_firma_ozetleri() TO service_role;
GRANT EXECUTE ON FUNCTION public.eclub_admin_firma_talepleri(uuid,text,date,date,text,integer,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.eclub_admin_firma_talep_islem(uuid,uuid,uuid,text,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eclub_admin_firma_talep_yonetimi_hazir;
