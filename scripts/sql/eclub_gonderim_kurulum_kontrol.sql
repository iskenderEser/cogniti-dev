-- Adım 12: kurulum öncesi/sonrası SALT OKUNUR yapısal kontrol.
-- Proje sahibi SQL Editor'da çalıştırır. Gönderim, plan veya bildirim oluşturmaz.
-- Eksik görünen migration yalnız operasyon rehberindeki sırayla tamamlanır.
BEGIN READ ONLY;
SET LOCAL timezone = 'Europe/Istanbul';
WITH gerekli_nesneler(ad,aciklama) AS (VALUES
 ('public.kullanicilar','UTT kimlik ve kapsamı'),('public.firmalar','Firma/modül durumu'),
 ('public.eclub_kisiler','Üye kimlikleri'),('public.urunler','Ürün kimlikleri'),
 ('public.yayin_yonetimi','Mühürlü yayın ve tur başlangıcı'),
 ('public.v_yayin_detay','Yayın/araç/kapsam görünümü'),('public.v_yayin_kunye','Yayının ürün bağlantısı'),
 ('public.ogrenme_araclari','Araç bilgisi'),('public.yayin_tekrar_kayitlari','Yayın tur geçmişi'),
 ('public.eclub_utt_yayin_incelemeleri','UTT gönderim öncesi inceleme'),
 ('public.eclub_kisi_eczane','Üye–eczane üyeliği'),('public.eclub_eczane_firma','Eczane–firma bağı'),
 ('public.eclub_utt_eczane','UTT portföy bağı'),('public.eclub_oneri_kayitlari','Gerçek gönderimler'),
 ('public.eclub_yayin_gonderim_planlari','Ayrı plan rezervasyonu'),('public.sistem_ayarlari','Geçerlilik ayarı')
), gerekli_rpc(ad,aciklama) AS (VALUES
 ('public.eclub_gonderim_uygunlugu(uuid,uuid,uuid,timestamptz)','Uygunluk RPC'),
 ('public.eclub_gonderim_kontrol_hesapla(uuid,uuid,uuid,timestamptz,text,uuid,timestamptz)','Ortak kota/tarih hesabı'),
 ('public.eclub_yayin_gonder(uuid,uuid,uuid,uuid)','Yeni gerçek gönderim yazıcısı'),
 ('public.eclub_oneri_atomik_kaydet(uuid,uuid,uuid,uuid,timestamptz,timestamptz)','Eski RPC girişinin korunması'),
 ('public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamptz,uuid,boolean)','Toplu gönderim/plan/önizleme'),
 ('public.eclub_planlanan_gonderimi_isle(text[])','Plan gerçekleştirme işleyicisi')
), gerekli_trigger(tablo,ad,ertelenmis) AS (VALUES
 ('public.eclub_oneri_kayitlari','trg_eclub_gonderim_oneri_kapisi',false),
 ('public.eclub_oneri_kayitlari','trg_eclub_gonderim_sure_kapisi',false),
 ('public.eclub_yayin_gonderim_planlari','trg_eclub_gonderim_plan_kapisi',false),
 ('public.eclub_oneri_kayitlari','trg_eclub_oneri_plan_sonuc',true),
 ('public.eclub_yayin_gonderim_planlari','trg_eclub_plan_oneri_sonuc',true)
), gerekli_index(ad) AS (VALUES
 ('public.eclub_oneri_plan_uq'),('public.eclub_gonderim_plan_islem_uq'),('public.eclub_gonderim_plan_oneri_uq')
), rpc_tanimlari AS (
 SELECT ad, coalesce(pg_get_functiondef(to_regprocedure(ad)),'') AS tanim FROM gerekli_rpc
), kontroller AS (
 SELECT 'nesne:'||ad kod,to_regclass(ad) IS NOT NULL uygun,aciklama FROM gerekli_nesneler
 UNION ALL SELECT 'rpc:'||ad,to_regprocedure(ad) IS NOT NULL,aciklama FROM gerekli_rpc
 UNION ALL SELECT 'trigger:'||ad,EXISTS(SELECT 1 FROM pg_trigger t
  WHERE t.tgrelid=to_regclass(g.tablo) AND t.tgname=g.ad AND NOT t.tgisinternal
   AND t.tgenabled IN ('O','A') AND (NOT g.ertelenmis OR (t.tgdeferrable AND t.tginitdeferred))),
  CASE WHEN ertelenmis THEN 'Aktif ve commit sonunda karşılıklı sonuç kontrolü' ELSE 'Aktif yazım kapısı' END FROM gerekli_trigger g
 UNION ALL SELECT 'tekillik:'||ad,EXISTS(SELECT 1 FROM pg_index i
  WHERE i.indexrelid=to_regclass(g.ad) AND i.indisunique AND i.indisvalid AND i.indisready),
  'Tekil, geçerli ve hazır indeks' FROM gerekli_index g
 UNION ALL SELECT 'plan_rls',EXISTS(SELECT 1 FROM pg_class WHERE oid=to_regclass('public.eclub_yayin_gonderim_planlari') AND relrowsecurity),
  'Plan tablosunun satır güvenliği açık'
 UNION ALL SELECT 'plan_istemciye_kapali',coalesce(bool_and(NOT has_table_privilege(r.rol,to_regclass('public.eclub_yayin_gonderim_planlari'),'SELECT,INSERT,UPDATE,DELETE')),false),
  'Anon ve authenticated plan tablosuna doğrudan erişemez' FROM (VALUES('anon'),('authenticated')) r(rol)
 UNION ALL SELECT 'rpc_istemciye_kapali',coalesce(bool_and(NOT has_function_privilege(r.rol,to_regprocedure(g.ad),'EXECUTE')),false),
  'Gönderim/plan RPC çağrıları istemciye kapalı' FROM gerekli_rpc g CROSS JOIN (VALUES('anon'),('authenticated')) r(rol)
 UNION ALL SELECT 'service_role_yazicilari',coalesce(bool_and(has_function_privilege('service_role',to_regprocedure(ad),'EXECUTE')),false),
  'API/worker kanonik RPCleri çalıştırabilir' FROM gerekli_rpc WHERE ad NOT LIKE '%kontrol_hesapla%'
 UNION ALL SELECT 'ozel_hesap_service_role_kapali',NOT coalesce(has_function_privilege('service_role',
  to_regprocedure('public.eclub_gonderim_kontrol_hesapla(uuid,uuid,uuid,timestamptz,text,uuid,timestamptz)'),'EXECUTE'),true),
  'Test saati alan özel hesap dış çağrıya kapalı'
 UNION ALL SELECT 'eski_rpc_yeni_yaziciya_bagli',coalesce(bool_and(position('public.eclub_yayin_gonder(p_oneren_id, p_kisi_id, p_yayin_id, NULL)' IN tanim)>0),false),
  'Eski araç/tarih girdileri yeni kuralları aşamaz' FROM rpc_tanimlari WHERE ad LIKE '%oneri_atomik_kaydet%'
 UNION ALL SELECT 'gecerlilik_15_gun',EXISTS(SELECT 1 FROM public.sistem_ayarlari WHERE anahtar='eclub_oneri_gecerlilik_gun' AND deger='15'::jsonb),
  'Yeni gerçek gönderimde 15 günlük süre ayarı'
 UNION ALL SELECT 'eski_21_ayari_yok',NOT EXISTS(SELECT 1 FROM public.sistem_ayarlari WHERE anahtar='eclub_ayni_video_tekrar_bekleme_gun'),
  'Eski araç tekrar bekleme ayarı kaldırılmış'
 UNION ALL SELECT 'sure_trigger_15_gun',coalesce(position('interval ''15 days''' IN pg_get_functiondef(to_regprocedure('public.eclub_gonderim_sure_kapisi()')))>0,false),
  'Yazım kapısı yeni gönderimin bitişini gerçek başlangıçtan hesaplıyor'
 UNION ALL SELECT 'hafta_ve_donem_sinirlari',coalesce(bool_and(position('interval ''14 days''' IN tanim)>0 AND position('interval ''2 months''' IN tanim)>0
  AND position('ileri_donem_planlanamaz' IN tanim)>0),false),
  'Takip eden hafta ve mevcut iki aylık dönem kontrolleri birlikte mevcut' FROM rpc_tanimlari WHERE ad LIKE '%kontrol_hesapla%'
)
SELECT kod,uygun,aciklama FROM kontroller ORDER BY kod;
COMMIT;
