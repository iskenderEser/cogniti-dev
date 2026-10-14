-- Adım 7: zamanı gelen tek planı atomik sahiplenir ve gerçekleştirir.
-- Ön koşul: Adım 3–6 SQL'leri. Proje sahibi SQL Editor'da çalıştırır.
-- Bu dosya cron'u etkinleştirmez. Cron kaydı ayrı kurulum dosyasındadır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eclub-plan-isleyici-v1',0));

CREATE OR REPLACE FUNCTION public.eclub_planlanan_gonderimi_isle(
  p_kapali_arac_turleri text[] DEFAULT ARRAY[]::text[]
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
SET timezone = 'Europe/Istanbul'
AS $f$
DECLARE
  v_aday record; v_plan record; v_oneri record; v_kontrol jsonb;
  v_simdi timestamptz; v_sebep text; v_arac_turu text;
BEGIN
  IF p_kapali_arac_turleri IS NULL OR array_position(p_kapali_arac_turleri,NULL) IS NOT NULL
    OR NOT (p_kapali_arac_turleri <@ ARRAY['video','podcast','gorsel','flip_pdf']::text[]) THEN
    RAISE EXCEPTION 'Geçersiz araç durumu.' USING ERRCODE = '22023';
  END IF;
  -- Satır kilidinden ÖNCE diğer gönderim yollarındaki UTT–üye kilidini al.
  -- Böylece satır/kapsam kilit sırası tersine dönmez. Meşgul kapsam beklenmez.
  FOR v_aday IN
    SELECT plan_id,utt_id,kisi_id FROM public.eclub_yayin_gonderim_planlari
    WHERE hedef_gonderim_at <= clock_timestamp() AND (
      durum='bekliyor' OR (durum='isleniyor' AND lease_bitis <= clock_timestamp()))
    ORDER BY hedef_gonderim_at,plan_id LIMIT 100
  LOOP
    IF NOT pg_try_advisory_xact_lock(hashtextextended(
      concat_ws(':','eclub-gonderim',v_aday.utt_id::text,v_aday.kisi_id::text),0)) THEN
      CONTINUE;
    END IF;
    -- Yayın/üye/yetki satırları gerçek gönderim boyunca değişmesin.
    SELECT * INTO v_plan FROM public.eclub_yayin_gonderim_planlari
      WHERE plan_id=v_aday.plan_id;
    IF NOT FOUND THEN CONTINUE; END IF;
    PERFORM public.eclub_gonderim_erisimini_kilitle(v_plan.utt_id,v_plan.kisi_id,v_plan.yayin_id);
    SELECT * INTO v_plan FROM public.eclub_yayin_gonderim_planlari
      WHERE plan_id=v_aday.plan_id AND hedef_gonderim_at <= clock_timestamp()
        AND (durum='bekliyor' OR (durum='isleniyor' AND lease_bitis <= clock_timestamp()))
      FOR UPDATE SKIP LOCKED;
    IF NOT FOUND THEN CONTINUE; END IF;
    v_simdi := clock_timestamp(); v_sebep := NULL;

    -- Kendi plan rezervasyonu hariç tutulur. Gecikme aynı TR günü dışına çıktıysa
    -- ortak kontrol reddeder; başka güne otomatik kaydırma yapılmaz.
    v_kontrol := public.eclub_gonderim_kontrol_hesapla(v_plan.utt_id,v_plan.kisi_id,
      v_plan.yayin_id,v_simdi,'gerceklestir',v_plan.plan_id,v_simdi);
    IF NOT (v_kontrol->>'uygun')::boolean THEN
      v_sebep := v_kontrol->>'sebep';
    ELSE
      SELECT arac_turu INTO v_arac_turu FROM public.v_yayin_detay WHERE yayin_id=v_plan.yayin_id;
      IF v_arac_turu = ANY(p_kapali_arac_turleri) THEN v_sebep := 'arac_kullanima_kapali'; END IF;
    END IF;
    IF v_sebep IS NOT NULL THEN
      UPDATE public.eclub_yayin_gonderim_planlari SET durum='gerceklesmedi',lease_bitis=NULL,
        isleme_alindi_at=v_simdi,deneme_sayisi=deneme_sayisi+1,
        son_hata_kodu=v_sebep,son_hata_at=v_simdi WHERE plan_id=v_plan.plan_id;
      RETURN jsonb_build_object('plan_id',v_plan.plan_id,'kisi_id',v_plan.kisi_id,
        'utt_id',v_plan.utt_id,'yayin_id',v_plan.yayin_id,
        'durum','gerceklesmedi','oneri_id',NULL,'sebep',v_sebep);
    END IF;

    BEGIN
      -- Sahiplenme, öneri ve gerçekleşme tek transactiondadır. Yanıt kaybında
      -- gerçekleşmiş plan tekrar aday olamaz; plan başına tek öneri indeksi de korur.
      UPDATE public.eclub_yayin_gonderim_planlari SET durum='isleniyor',
        isleme_alindi_at=v_simdi,lease_bitis=v_simdi+interval '180 seconds',
        deneme_sayisi=deneme_sayisi+1,son_hata_kodu=NULL,son_hata_at=NULL
        WHERE plan_id=v_plan.plan_id;
      SELECT * INTO v_oneri FROM public.eclub_yayin_gonder(
        v_plan.utt_id,v_plan.kisi_id,v_plan.yayin_id,v_plan.plan_id);
      IF v_oneri.kaydedildi THEN
        RETURN jsonb_build_object('plan_id',v_plan.plan_id,'kisi_id',v_plan.kisi_id,
          'utt_id',v_plan.utt_id,'yayin_id',v_plan.yayin_id,
          'durum','gerceklesti','oneri_id',v_oneri.oneri_id,'sebep',NULL);
      END IF;
      v_sebep := coalesce(v_oneri.sebep,'gonderim_kaydedilemedi');
    EXCEPTION WHEN OTHERS THEN
      -- Başarısız iç işlem öneri/sahiplenmeyi birlikte geri alır; hata kodu
      -- plan üzerinde saklanır. İptal edilen SQL çağrısı bütünüyle geri alınır.
      IF SQLSTATE='P0001' AND SQLERRM LIKE 'ECLUB_GONDERIM:%' THEN
        v_sebep := substr(SQLERRM,length('ECLUB_GONDERIM:')+1);
      ELSE
        v_sebep := 'sql_' || SQLSTATE;
      END IF;
    END;
    -- İç işlem başarılı sahiplenmiş ama kayıt reddedilmişse deneme zaten arttı;
    -- exception'da sahiplenme geri alındığından eski deneme sayısından yazılır.
    UPDATE public.eclub_yayin_gonderim_planlari SET durum='gerceklesmedi',lease_bitis=NULL,
      isleme_alindi_at=v_simdi,deneme_sayisi=v_plan.deneme_sayisi+1,
      son_hata_kodu=v_sebep,son_hata_at=clock_timestamp() WHERE plan_id=v_plan.plan_id;
    RETURN jsonb_build_object('plan_id',v_plan.plan_id,'kisi_id',v_plan.kisi_id,
      'utt_id',v_plan.utt_id,'yayin_id',v_plan.yayin_id,
      'durum','gerceklesmedi','oneri_id',NULL,'sebep',v_sebep);
  END LOOP;
  RETURN NULL;
END;
$f$;
REVOKE ALL ON FUNCTION public.eclub_planlanan_gonderimi_isle(text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_planlanan_gonderimi_isle(text[]) TO service_role;
COMMIT;
SELECT
  to_regprocedure('public.eclub_planlanan_gonderimi_isle(text[])') IS NOT NULL AS plan_isleyici_rpc_var,
  EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public'
    AND tablename='eclub_oneri_kayitlari' AND indexname='eclub_oneri_plan_uq') AS plan_basina_tek_oneri_var;
