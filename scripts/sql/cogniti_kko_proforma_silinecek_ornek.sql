-- KULLANICI ÇALIŞTIRACAK. Yalnız Hepifarma / Merve Duran / Ekim 2026 örneği.
-- SİLİNECEK TEST KAYDI. Gerçek sipariş, yayın, bildirim veya KKÖ etkinleştirmesi oluşturmaz.
-- Süresi geçmiş 100 adet sahte kullanım; mevcut kullanılabilir paket bakiyeleri değişmez.
BEGIN;
-- Mevcut KKÖ alım listesindeki gerçekleşen tüketim hesabı kullanılır.
CREATE OR REPLACE VIEW public.cogniti_kko_proforma_kayitlari AS
 SELECT y.yukleme_id kayit_id,y.firma_id,y.bakiye_id,y.kko_donem donem,
 y.kko_donem::timestamp AT TIME ZONE 'Europe/Istanbul' siparis_tarihi,
 (CASE WHEN t.test_kaydi THEN 'SİLİNECEK TEST KAYDI · ' ELSE '' END)
 || CASE WHEN b.bakiye_turu='firma_ortak' THEN 'Firma Token Hesabı' ELSE concat_ws(' ',k.ad,k.soyad) END satin_alan_ad_soyad,
 b.bakiye_turu,'kko'::text paket_turu,t.token token_adedi,y.kko_birim_fiyat birim_fiyat,
 t.token*y.kko_birim_fiyat toplam_tutar,round(t.token*y.kko_birim_fiyat/5,2) kdv,
 y.kko_donem < date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date AS onaylanabilir
 FROM public.cogniti_esnek_paket_yuklemeleri y
 JOIN public.cogniti_satin_alma_bakiyeleri b ON b.bakiye_id=y.bakiye_id AND b.firma_id=y.firma_id
 LEFT JOIN public.kullanicilar k ON k.kullanici_id=b.sahip_id AND k.firma_id=b.firma_id
 CROSS JOIN LATERAL (
  SELECT coalesce(sum(g.miktar),0) + (
   SELECT count(*) FROM public.eczanem_token_bloklari z
   WHERE z.yukleme_id=y.yukleme_id AND z.firma_id=y.firma_id AND z.bakiye_id=y.bakiye_id AND z.durum='tuketildi'
  ) AS token,coalesce(bool_and(g.islem_kimligi LIKE 'cogniti-test:kko-proforma:%'),false) AS test_kaydi
  FROM public.cogniti_esnek_gonderim_tuketimleri g
  WHERE g.yukleme_id=y.yukleme_id AND g.firma_id=y.firma_id AND g.bakiye_id=y.bakiye_id
 ) t
 WHERE y.kko_donem IS NOT NULL AND t.token>0;
REVOKE ALL ON public.cogniti_kko_proforma_kayitlari FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_kko_proforma_belgesi(p_siparis uuid,p_firma uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT jsonb_build_object(
  'belge_no','PF-K-'||s.kayit_id::text,'tarih',s.siparis_tarihi,
  'duzenleyen',jsonb_build_object('unvan','Mill Danışmanlık Org. ve Eğt. Hiz. Ltd. Şti',
    'adres','Göktürk Merkez M. İstanbul C. Üstüküme S. No: D51 Göktürk-Eyüp-İstanbul',
    'vergi_dairesi','Gaziosmanpaşa','vergi_numarasi','6210464784'),
  'alici',jsonb_build_object('unvan',a.firma_adi,'adres',coalesce(a.adres,''),
    'vergi_dairesi',coalesce(a.vergi_dairesi,''),'vergi_numarasi',coalesce(a.vergi_numarasi,'')),
  'token_adedi',s.token_adedi,'birim_fiyat',s.birim_fiyat,'toplam_tutar',s.toplam_tutar,
  'kdv',s.kdv,'donem',s.donem,
  'test_notu',CASE WHEN s.satin_alan_ad_soyad LIKE 'SİLİNECEK TEST KAYDI · %'
    THEN 'SİLİNECEK TEST KAYDI — yalnız KKÖ proforma görüntüleme ve onay akışını göstermek için oluşturulmuştur.' ELSE '' END
 )
 FROM public.cogniti_kko_proforma_kayitlari s
 JOIN public.firmalar a ON a.firma_id=s.firma_id
 WHERE s.kayit_id=p_siparis AND s.firma_id=p_firma;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_kko_proforma_belgesi(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
DO $test$
DECLARE
 f constant uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
 u constant uuid := 'b0838fab-302c-49b3-af44-9bad88945a0f';
 y constant uuid := 'c06a2026-1110-4000-8000-000000000001';
 b uuid; fiyat numeric; mevcut record;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('cogniti-test:kko-proforma:hepifarma:2026-10',0));
 IF NOT EXISTS(SELECT 1 FROM public.firmalar WHERE firma_id=f AND firma_adi='Hepifarma')
 OR NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=u AND firma_id=f AND ad='Merve' AND soyad='Duran') THEN
  RAISE EXCEPTION 'Hepifarma / Merve Duran kapsamı doğrulanamadı; test verisi yazılmadı.';
 END IF;
 SELECT bakiye_id INTO b FROM public.cogniti_satin_alma_bakiyeleri
 WHERE firma_id=f AND sahip_id=u AND bakiye_turu='kisisel' FOR UPDATE;
 IF b IS NULL THEN RAISE EXCEPTION 'Merve Duran kişisel token hesabı bulunamadı; yeni hesap açılmadı.'; END IF;
 SELECT * INTO mevcut FROM public.cogniti_esnek_paket_yuklemeleri WHERE yukleme_id=y;
 IF FOUND THEN
  IF mevcut.firma_id IS DISTINCT FROM f OR mevcut.bakiye_id IS DISTINCT FROM b
   OR mevcut.kko_donem IS DISTINCT FROM date '2026-10-01'
   OR mevcut.miktar<>1500 OR mevcut.kalan<>1400
   OR mevcut.siparis_id IS NOT NULL OR mevcut.abonelik_siparis_id IS NOT NULL
   OR (SELECT count(*) FROM public.cogniti_esnek_gonderim_tuketimleri
       WHERE yukleme_id=y AND firma_id=f AND bakiye_id=b
        AND islem_kimligi LIKE 'cogniti-test:kko-proforma:hepifarma:2026-10:%')<>100
   OR (SELECT count(*) FROM public.cogniti_esnek_gonderim_tuketimleri WHERE yukleme_id=y)<>100 THEN
   RAISE EXCEPTION 'Örnek kimliğinde beklenmeyen kayıt var; hiçbir kayıt değiştirilmedi.';
  END IF;
  RETURN;
 END IF;
 IF EXISTS(SELECT 1 FROM public.cogniti_esnek_paket_yuklemeleri WHERE bakiye_id=b AND kko_donem=date '2026-10-01') THEN
  RAISE EXCEPTION 'Bu hesabın Ekim 2026 KKÖ kaydı zaten var; gerçek kayda dokunulmadı.';
 END IF;
 SELECT (degerler->>'kko_token_tl')::numeric INTO fiyat FROM public.cogniti_fiyat_tarifesi WHERE tekil;
 IF fiyat IS NULL OR fiyat<=0 OR fiyat::text IN ('NaN','Infinity','-Infinity') THEN
  RAISE EXCEPTION 'KKÖ birim fiyatı doğrulanamadı; örnek oluşturulmadı.';
 END IF;
 INSERT INTO public.cogniti_esnek_paket_yuklemeleri
 (yukleme_id,siparis_id,abonelik_siparis_id,firma_id,bakiye_id,miktar,kalan,created_at,son_kullanim_at,kko_donem,kko_birim_fiyat)
 VALUES(y,NULL,NULL,f,b,1500,1400,'2026-10-01 00:00:00+03','2026-11-01 00:00:00+03','2026-10-01',fiyat);
 INSERT INTO public.cogniti_esnek_gonderim_tuketimleri
 (tuketim_id,firma_id,bakiye_id,yukleme_id,gonderen_id,akis,kaynak_id,alici_id,islem_kimligi,miktar,created_at)
 SELECT md5('cogniti-test:kko-proforma:hepifarma:2026-10:'||n::text)::uuid,
 f,b,y,u,'yayin_acilis','c06a2026-1110-4000-8000-000000000002'::uuid,
 md5('cogniti-test:kko-proforma:alici:'||n::text)::uuid,
 'cogniti-test:kko-proforma:hepifarma:2026-10:'||n::text,1,'2026-10-15 12:00:00+03'::timestamptz
 FROM generate_series(1,100) n;
END;
$test$;
COMMENT ON VIEW public.cogniti_kko_proforma_kayitlari IS
 'KKÖ gerçek tüketim listesi. cogniti-test:kko-proforma: işaretli örnekler SİLİNECEK TEST KAYDI olarak gösterilir.';
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_kko_silinecek_ornek_olusturuldu;
