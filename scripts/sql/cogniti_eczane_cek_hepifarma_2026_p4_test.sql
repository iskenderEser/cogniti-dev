-- Kullanıcı yalnız test ortamında çalıştırır. Hepifarma / Temmuz–Ağustos 2026.
BEGIN;

DO $test$
DECLARE
  v_talep constant uuid := 'e1500000-0000-4000-8000-000000000004';
  v_firma constant uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
  v_eczane constant uuid := '0d8385df-4eed-429e-b691-81acee1ad606';
  v_kisi constant uuid := '3b0b6c01-428e-4797-a8ad-67d5d2400b5f';
  v_utt constant uuid := '765b6890-183f-4518-b887-07003ff5cdc7';
  v_yayin constant uuid := 'bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50';
  v_donem constant text := '2026-P4';
  v_takim uuid;
  v_bolge uuid;
  v_bm uuid;
  v_tm uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('cogniti:eczane-cek-proforma:test:hepifarma:2026-P4', 0));

  IF EXISTS (
    SELECT 1 FROM public.eclub_store_cek_talepleri
    WHERE talep_id = v_talep AND firma_id = v_firma AND eczane_id = v_eczane
      AND yayin_id = v_yayin AND donem_kodu = v_donem AND durum = 'onaylandi'
      AND tm_onay_tarihi IS NOT NULL AND talep_edilen_cek_tl = 80
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.firmalar f
    JOIN public.eclub_eczane_firma ef ON ef.firma_id = f.firma_id AND ef.aktif_mi
    JOIN public.eclub_eczaneler e ON e.eczane_id = ef.eczane_id
    JOIN public.eclub_eczane_master em ON em.gln = e.gln
    JOIN public.eclub_kisi_eczane ke ON ke.eczane_id = e.eczane_id AND ke.aktif_mi
    JOIN public.eclub_kisiler k ON k.kisi_id = ke.kisi_id
    JOIN public.eclub_utt_eczane ue ON ue.eczane_firma_id = ef.id AND ue.aktif_mi
    WHERE f.firma_id = v_firma AND f.firma_adi = 'Hepifarma' AND f.aktif AND f.eclub_aktif
      AND e.eczane_id = v_eczane AND e.gln = '1110000000003' AND em.kaynak = 'test'
      AND k.kisi_id = v_kisi AND k.rol = 'eczaci' AND ue.utt_id = v_utt
  ) THEN
    RAISE EXCEPTION 'Hepifarma test eczanesi ve bağlantıları doğrulanamadı.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.v_yayin_kunye k
    JOIN public.yayin_yonetimi y ON y.yayin_id = k.yayin_id
    WHERE k.yayin_id = v_yayin AND k.firma_id = v_firma
      AND y.cek_karsiligi_var_mi AND y.satis_sarti_tipi = 'siparissiz_cek'
  ) THEN
    RAISE EXCEPTION 'Hepifarma siparişsiz çek test yayını doğrulanamadı.';
  END IF;

  SELECT takim_id, bolge_id INTO STRICT v_takim, v_bolge FROM public.kullanicilar
  WHERE kullanici_id = v_utt AND firma_id = v_firma AND aktif_mi AND rol IN ('utt', 'kd_utt');
  SELECT kullanici_id INTO STRICT v_bm FROM public.kullanicilar
  WHERE firma_id = v_firma AND takim_id = v_takim AND bolge_id = v_bolge AND aktif_mi AND rol = 'bm';
  SELECT kullanici_id INTO STRICT v_tm FROM public.kullanicilar
  WHERE firma_id = v_firma AND takim_id = v_takim AND aktif_mi AND rol = 'tm';

  IF EXISTS (
    SELECT 1 FROM public.cogniti_eczane_cek_proforma_onaylari WHERE firma_id = v_firma AND donem = v_donem
  ) OR EXISTS (
    SELECT 1 FROM public.eclub_store_cek_talepleri
    WHERE firma_id = v_firma AND donem_kodu = v_donem AND durum <> 'iptal'
  ) THEN
    RAISE EXCEPTION 'Dönemde mevcut talep veya proforma var. Test kaydı eklenmedi.';
  END IF;

  INSERT INTO public.eclub_store_cek_talepleri (
    talep_id, eczane_id, firma_id, yayin_id, talep_eden_kisi_id,
    toplanan_puan, talep_edilen_cek_tl, siparis_tipi, siparis_verildi_mi,
    siparis_adet, siparis_mal_fazlasi, durum, utt_id, bm_id, tm_id,
    utt_onay_tarihi, bm_onay_tarihi, tm_onay_tarihi, devreden_puan,
    donem_kodu, created_at, guncellenme_at
  ) VALUES (
    v_talep, v_eczane, v_firma, v_yayin, v_kisi, 400, 80, 'siparissiz_cek', false,
    0, 0, 'onaylandi', v_utt, v_bm, v_tm,
    '2026-09-03 10:00:00+03', '2026-09-04 10:00:00+03', '2026-09-05 10:00:00+03', 0,
    v_donem, '2026-09-02 10:00:00+03', '2026-09-05 10:00:00+03'
  );

  IF EXISTS (SELECT 1 FROM public.eclub_cek_teslimat_outbox WHERE talep_id = v_talep)
    OR EXISTS (SELECT 1 FROM public.eclub_bildirimler WHERE kayit_turu = 'cek' AND kayit_id = v_talep)
  THEN
    RAISE EXCEPTION 'Test talebi için teslimat veya bildirim işi oluştu. İşlem geri alındı.';
  END IF;
END;
$test$;

SELECT talep_id, donem_kodu, durum, talep_edilen_cek_tl, tm_onay_tarihi
FROM public.eclub_store_cek_talepleri
WHERE talep_id = 'e1500000-0000-4000-8000-000000000004';

COMMIT;
