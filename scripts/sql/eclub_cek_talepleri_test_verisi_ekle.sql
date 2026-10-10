-- Çek Talepleri sayfası için yalnız görünüm verisi.
-- Supabase SQL Editor'da tamamını tek parça çalıştırın.
-- Gerçek talep/onay RPC'si, sipariş, puan, bildirim veya teslimat işi oluşturmaz.
-- Gelecek test dönemleri mevcut puan bakiyesinden düşülmez.
-- Sipariş verildi bayrağı kapalıdır; adet/MF yalnız karttaki örnek koşuldur.
-- Temizlik: eclub_cek_talepleri_test_verisi_temizle.sql (şimdi çalıştırılmaz).
BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-cek-talepleri-gorunum-v1', 0));
LOCK TABLE public.eclub_store_cek_talepleri IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE cek_talebi_ornekleri (
  sira integer PRIMARY KEY, talep_id uuid, yayin_id uuid, durum text,
  puan integer, tutar numeric(10,2), siparis_tipi text,
  adet integer, mf integer, donem text, kod text
) ON COMMIT DROP;
INSERT INTO cek_talebi_ornekleri
  (sira, talep_id, yayin_id, durum, puan, tutar, siparis_tipi, adet, mf, donem, kod)
SELECT x.sira, x.talep_id, x.yayin_id, x.durum, x.puan, x.tutar,
  x.siparis_tipi, x.adet, x.mf, x.donem, x.kod
FROM jsonb_to_recordset($veri$
[
  {"sira":1,"yayin_id":"bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50","durum":"beklemede","puan":300,"tutar":60,"siparis_tipi":"siparissiz_cek","adet":0,"mf":0,"donem":"2098-P1","kod":null,"talep_id":"e1300000-0000-4000-8000-000000000001"},
  {"sira":2,"yayin_id":"3a6e0db1-bc42-44cf-ab16-b99630681ae9","durum":"bm_onayinda","puan":500,"tutar":150,"siparis_tipi":"serbest_siparis","adet":10,"mf":1,"donem":"2098-P2","kod":null,"talep_id":"e1300000-0000-4000-8000-000000000002"},
  {"sira":3,"yayin_id":"f364c684-eadc-4ccc-8671-f333da7b555f","durum":"tm_onayinda","puan":300,"tutar":60,"siparis_tipi":"satis_sartli","adet":10,"mf":2,"donem":"2098-P3","kod":null,"talep_id":"e1300000-0000-4000-8000-000000000003"},
  {"sira":4,"yayin_id":"bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50","durum":"onaylandi","puan":400,"tutar":80,"siparis_tipi":"siparissiz_cek","adet":0,"mf":0,"donem":"2098-P4","kod":null,"talep_id":"e1300000-0000-4000-8000-000000000004"},
  {"sira":5,"yayin_id":"3a6e0db1-bc42-44cf-ab16-b99630681ae9","durum":"teslimat_bekliyor","puan":500,"tutar":150,"siparis_tipi":"serbest_siparis","adet":10,"mf":1,"donem":"2098-P5","kod":"TEST-CEK-KUYRUK","talep_id":"e1300000-0000-4000-8000-000000000005"},
  {"sira":6,"yayin_id":"bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50","durum":"cek_kodlari_gonderildi","puan":500,"tutar":100,"siparis_tipi":"siparissiz_cek","adet":0,"mf":0,"donem":"2098-P6","kod":"TEST-CEK-TESLIM","talep_id":"e1300000-0000-4000-8000-000000000006"},
  {"sira":7,"yayin_id":"f364c684-eadc-4ccc-8671-f333da7b555f","durum":"iptal","puan":300,"tutar":60,"siparis_tipi":"satis_sartli","adet":10,"mf":2,"donem":"2099-P1","kod":null,"talep_id":"e1300000-0000-4000-8000-000000000007"}
]
$veri$::jsonb) AS x(
  sira integer, talep_id uuid, yayin_id uuid, durum text,
  puan integer, tutar numeric(10,2), siparis_tipi text,
  adet integer, mf integer, donem text, kod text
);

DO $test$
DECLARE
  v_kisi constant uuid := '3b0b6c01-428e-4797-a8ad-67d5d2400b5f';
  v_eczane constant uuid := '0d8385df-4eed-429e-b691-81acee1ad606';
  v_utt constant uuid := '765b6890-183f-4518-b887-07003ff5cdc7';
  v_firma uuid; v_takim uuid; v_bolge uuid; v_bm uuid; v_tm uuid;
  v_simdi timestamptz := now();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.eclub_kisi_eczane ke
    JOIN public.eclub_kisiler k ON k.kisi_id=ke.kisi_id
    JOIN public.eclub_eczaneler e ON e.eczane_id=ke.eczane_id
    JOIN public.eclub_eczane_master em ON em.gln=e.gln
    WHERE ke.kisi_id=v_kisi AND ke.eczane_id=v_eczane AND ke.aktif_mi
      AND k.rol='eczaci' AND em.kaynak='test' AND e.gln='1110000000003'
  ) THEN RAISE EXCEPTION 'Hedef test eczanesi ve eczacı bağı doğrulanamadı.'; END IF;

  SELECT k.firma_id,k.takim_id,k.bolge_id INTO v_firma,v_takim,v_bolge
  FROM public.kullanicilar k JOIN public.firmalar f ON f.firma_id=k.firma_id
  WHERE k.kullanici_id=v_utt AND k.aktif_mi AND lower(k.rol) IN ('utt','kd_utt')
    AND f.aktif AND f.eclub_aktif AND f.eclub_store_aktif
    AND EXISTS (SELECT 1 FROM public.eclub_eczane_firma ef
      JOIN public.eclub_utt_eczane ue ON ue.eczane_firma_id=ef.id
      WHERE ef.eczane_id=v_eczane AND ef.firma_id=f.firma_id
        AND ef.aktif_mi AND ue.utt_id=v_utt AND ue.aktif_mi);
  IF v_firma IS NULL THEN RAISE EXCEPTION 'Test eczanesinin firma/UTT bağı doğrulanamadı.'; END IF;

  SELECT kullanici_id INTO STRICT v_bm FROM public.kullanicilar
  WHERE firma_id=v_firma AND takim_id IS NOT DISTINCT FROM v_takim
    AND bolge_id IS NOT DISTINCT FROM v_bolge AND aktif_mi AND lower(rol)='bm';
  SELECT kullanici_id INTO STRICT v_tm FROM public.kullanicilar
  WHERE firma_id=v_firma AND takim_id IS NOT DISTINCT FROM v_takim
    AND aktif_mi AND lower(rol)='tm';

  IF EXISTS (
    SELECT 1 FROM cek_talebi_ornekleri x
    LEFT JOIN public.v_yayin_kunye ky ON ky.yayin_id=x.yayin_id
    LEFT JOIN public.yayin_yonetimi y ON y.yayin_id=x.yayin_id
    LEFT JOIN public.urunler u ON u.urun_id=ky.urun_id
    WHERE ky.firma_id IS DISTINCT FROM v_firma OR u.urun_id IS NULL
      OR y.cek_karsiligi_var_mi IS DISTINCT FROM true
      OR y.satis_sarti_tipi IS DISTINCT FROM x.siparis_tipi
  ) THEN RAISE EXCEPTION 'Örnek yayınların firma/ürün/sipariş koşulları doğrulanamadı.'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.eclub_store_cek_talepleri t JOIN cek_talebi_ornekleri x USING(talep_id)
    WHERE t.eczane_id IS DISTINCT FROM v_eczane OR t.firma_id IS DISTINCT FROM v_firma
      OR t.yayin_id IS DISTINCT FROM x.yayin_id OR t.talep_eden_kisi_id IS DISTINCT FROM v_kisi
      OR t.donem_kodu IS DISTINCT FROM x.donem OR t.durum IS DISTINCT FROM x.durum
      OR t.toplanan_puan IS DISTINCT FROM x.puan OR t.talep_edilen_cek_tl IS DISTINCT FROM x.tutar
      OR t.siparis_tipi IS DISTINCT FROM x.siparis_tipi OR t.siparis_verildi_mi IS DISTINCT FROM false
      OR t.cek_kodu IS DISTINCT FROM x.kod
  ) THEN RAISE EXCEPTION 'Sabit test kimliği başka bir kayıtla çakışıyor; kayıt değiştirilmedi.'; END IF;

  INSERT INTO public.eclub_store_cek_talepleri (
    talep_id,eczane_id,firma_id,yayin_id,talep_eden_kisi_id,
    toplanan_puan,talep_edilen_cek_tl,siparis_tipi,siparis_verildi_mi,siparis_adet,siparis_mal_fazlasi,
    durum,utt_id,bm_id,bm_onay_tarihi,tm_id,tm_onay_tarihi,
    cek_kodu,cek_gonderim_tarihi,devreden_puan,donem_kodu,created_at,guncellenme_at
  ) SELECT x.talep_id,v_eczane,v_firma,x.yayin_id,v_kisi,
    x.puan,x.tutar,x.siparis_tipi,false,x.adet,x.mf,
    x.durum,v_utt,CASE WHEN x.sira BETWEEN 2 AND 6 THEN v_bm END,
    CASE WHEN x.sira BETWEEN 3 AND 6 THEN v_simdi-interval '1 day' END,
    CASE WHEN x.sira BETWEEN 3 AND 6 THEN v_tm END,
    CASE WHEN x.sira BETWEEN 4 AND 6 THEN v_simdi-interval '12 hours' END,
    x.kod,CASE WHEN x.sira=6 THEN v_simdi-interval '1 hour' END,
    0,x.donem,v_simdi-x.sira*interval '1 day',v_simdi
  FROM cek_talebi_ornekleri x
  ON CONFLICT (talep_id) DO NOTHING;

  -- Beklenmeyen bir INSERT trigger'ı gönderim işi üretirse transaction geri alınır.
  IF EXISTS (SELECT 1 FROM public.eclub_cek_teslimat_outbox o JOIN cek_talebi_ornekleri x USING(talep_id))
    OR EXISTS (SELECT 1 FROM public.eclub_bildirimler b JOIN cek_talebi_ornekleri x ON x.talep_id=b.kayit_id WHERE b.kayit_turu='cek')
    OR EXISTS (SELECT 1 FROM public.eclub_siparis_utt_onaylari s JOIN cek_talebi_ornekleri x USING(talep_id))
    OR EXISTS (SELECT 1 FROM public.eclub_store_puan_devirleri d JOIN cek_talebi_ornekleri x
      ON x.talep_id=d.kaynak_talep_id OR x.talep_id=d.kullanilan_talep_id)
  THEN RAISE EXCEPTION 'Test talebine operasyon kaydı bağlı; işlem geri alındı.'; END IF;
END;
$test$;

SELECT 'TAMAMLANDI' AS sql_sonucu,u.urun_adi,t.durum,
  t.toplanan_puan,t.talep_edilen_cek_tl,t.siparis_verildi_mi
FROM cek_talebi_ornekleri x
JOIN public.eclub_store_cek_talepleri t USING(talep_id)
JOIN public.v_yayin_kunye ky ON ky.yayin_id=t.yayin_id
JOIN public.urunler u ON u.urun_id=ky.urun_id
ORDER BY x.sira;
COMMIT;
