-- E-Club yeni gönderim kurgusu — Adım 5.
-- Ön koşullar: Adım 3 plan tablosu ve Adım 4 kota/tarih kontrolü kurulmuş olmalıdır.
-- Tamamını birlikte Supabase SQL Editor'da proje sahibi çalıştırır.
-- Öneri/puan geçmişi değiştirilmez. API, ekran ve cron sonraki adımlardadır.

BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eclub-gonderim-rpc-v1', 0));

-- Yeni gerçek gönderimlerde süre her zaman başlangıçtan 15 gündür.
-- Eski istemci/RPC tarihleri bu değeri kısaltamaz veya uzatamaz.
-- Mevcut geçmiş kayıtların süreleri bu kurulumda değiştirilmez.
CREATE OR REPLACE FUNCTION public.eclub_gonderim_sure_kapisi()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
SET timezone = 'Europe/Istanbul'
AS $f$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Adım 4'ün oneri_kapisi trigger'ı alfabetik sırada önce çalışır;
    -- oneri_baslangic artık gerçek veritabanı saatidir.
    NEW.oneri_bitis := NEW.oneri_baslangic + interval '15 days';
  ELSIF NEW.oneri_bitis IS DISTINCT FROM OLD.oneri_bitis THEN
    RAISE EXCEPTION 'Gerçek gönderimin geçerlilik süresi değiştirilemez.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$f$;
DROP TRIGGER IF EXISTS trg_eclub_gonderim_sure_kapisi ON public.eclub_oneri_kayitlari;
CREATE TRIGGER trg_eclub_gonderim_sure_kapisi BEFORE INSERT OR UPDATE
  ON public.eclub_oneri_kayitlari FOR EACH ROW
  EXECUTE FUNCTION public.eclub_gonderim_sure_kapisi();

-- Yeni kanonik yazıcı: kimlik yalnız UTT + üye + yayındır.
-- Araç/video bilgisi yayın üzerinden çözülür; tekrar hesabının girdisi değildir.
-- Plan gerçekleşmesi de bu fonksiyondan geçerek aynı kota ve süreyi kullanır.
CREATE OR REPLACE FUNCTION public.eclub_yayin_gonder(
  p_utt_id uuid, p_kisi_id uuid, p_yayin_id uuid, p_plan_id uuid DEFAULT NULL
) RETURNS TABLE(oneri_id uuid, kaydedildi boolean, sebep text, yeniden_gonderilebilir_at timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
SET timezone = 'Europe/Istanbul'
AS $f$
DECLARE
  v_kontrol jsonb;
  v_plan record;
  v_arac_id uuid;
  v_arac_turu text;
  v_video_id uuid;
  v_oneri_id uuid;
  v_baslangic timestamptz;
  v_simdi timestamptz;
BEGIN
  IF p_utt_id IS NULL OR p_kisi_id IS NULL OR p_yayin_id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, false, 'gecersiz_girdi'::text, NULL::timestamptz;
    RETURN;
  END IF;
  PERFORM public.eclub_gonderim_kapsamini_kilitle(p_utt_id, p_kisi_id);
  PERFORM public.eclub_gonderim_erisimini_kilitle(p_utt_id, p_kisi_id, p_yayin_id);
  v_simdi := clock_timestamp();

  IF p_plan_id IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.eclub_yayin_gonderim_planlari
      WHERE plan_id = p_plan_id FOR UPDATE;
    IF NOT FOUND OR ROW(v_plan.utt_id, v_plan.kisi_id, v_plan.yayin_id)
      IS DISTINCT FROM ROW(p_utt_id, p_kisi_id, p_yayin_id) THEN
      RETURN QUERY SELECT NULL::uuid, false, 'plan_uyusmuyor'::text, NULL::timestamptz;
      RETURN;
    END IF;
    IF v_plan.durum = 'gerceklesti' THEN
      -- Sonuç kaydı korunur; ikinci öneri ve ikinci bildirim üretilmez.
      RETURN QUERY SELECT v_plan.oneri_id::uuid, false, 'plan_zaten_gerceklesti'::text, NULL::timestamptz;
      RETURN;
    END IF;
    IF v_plan.durum <> 'isleniyor' OR v_plan.lease_bitis IS NULL OR v_plan.lease_bitis <= v_simdi THEN
      RETURN QUERY SELECT NULL::uuid, false, 'plan_sahiplenilmedi'::text, NULL::timestamptz;
      RETURN;
    END IF;
  END IF;

  v_kontrol := public.eclub_gonderim_kontrol_hesapla(p_utt_id, p_kisi_id, p_yayin_id,
    v_simdi, CASE WHEN p_plan_id IS NULL THEN 'gonder' ELSE 'gerceklestir' END, p_plan_id, v_simdi);
  IF NOT (v_kontrol->>'uygun')::boolean THEN
    RETURN QUERY SELECT NULL::uuid, false, (v_kontrol->>'sebep')::text,
      (v_kontrol->>'yeniden_gonderilebilir_at')::timestamptz;
    RETURN;
  END IF;

  SELECT y.arac_id, y.arac_turu, oa.legacy_video_id
    INTO v_arac_id, v_arac_turu, v_video_id
  FROM public.v_yayin_detay y JOIN public.ogrenme_araclari oa ON oa.arac_id = y.arac_id
  WHERE y.yayin_id = p_yayin_id;
  IF NOT FOUND OR v_arac_id IS NULL OR v_arac_turu IS NULL
    OR v_arac_turu NOT IN ('video', 'podcast', 'gorsel', 'flip_pdf') THEN
    RAISE EXCEPTION 'Yayının öğrenme aracı çözülemedi.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.eclub_oneri_kayitlari (
    oneren_id, kisi_id, yayin_id, arac_id, arac_turu, video_id, plan_id,
    oneri_baslangic, oneri_bitis, izlendi_mi, created_at
  ) VALUES (
    p_utt_id, p_kisi_id, p_yayin_id, v_arac_id, v_arac_turu, v_video_id, p_plan_id,
    v_simdi, v_simdi + interval '15 days', false, clock_timestamp()
  ) RETURNING eclub_oneri_kayitlari.oneri_id, eclub_oneri_kayitlari.oneri_baslangic
    INTO v_oneri_id, v_baslangic;

  IF p_plan_id IS NOT NULL THEN
    UPDATE public.eclub_yayin_gonderim_planlari
    SET durum = 'gerceklesti', oneri_id = v_oneri_id, gerceklesti_at = v_baslangic,
      lease_bitis = NULL, son_hata_kodu = NULL, son_hata_at = NULL,
      guncellenme_at = clock_timestamp()
    WHERE plan_id = p_plan_id;
  END IF;
  RETURN QUERY SELECT v_oneri_id, true, NULL::text, NULL::timestamptz;
END;
$f$;

-- Eski RPC'nin imzası mevcut API için korunur; bütün yazım yeni kanonik kaynağa gider.
-- p_arac_id ve istemcinin başlangıç/bitiş tarihleri kuralları belirlemez.
CREATE OR REPLACE FUNCTION public.eclub_oneri_atomik_kaydet(
  p_yayin_id uuid, p_oneren_id uuid, p_kisi_id uuid, p_arac_id uuid,
  p_oneri_baslangic timestamptz, p_oneri_bitis timestamptz
) RETURNS TABLE(oneri_id uuid, kaydedildi boolean, sebep text, yeniden_gonderilebilir_at timestamptz)
LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $f$
  SELECT * FROM public.eclub_yayin_gonder(p_oneren_id, p_kisi_id, p_yayin_id, NULL);
$f$;

-- ON CONFLICT değeri de değiştirir: önceden kayıtlı 7 gün korunmaz.
INSERT INTO public.sistem_ayarlari(anahtar, deger, aciklama)
VALUES ('eclub_oneri_gecerlilik_gun', '15'::jsonb,
  'Gerçek gönderimden başlayan 15 günlük puanlı ve sorulu geçerlilik süresi.')
ON CONFLICT(anahtar) DO UPDATE SET deger = EXCLUDED.deger,
  aciklama = EXCLUDED.aciklama, updated_at = now();

-- Video/araç bitişine bağlı eski tekrar ayarı yeni kurguda kullanılmaz.
DELETE FROM public.sistem_ayarlari WHERE anahtar IN (
  'eclub_ayni_video_tekrar_bekleme_gun', 'eclub_aylik_gonderim_limiti',
  'eclub_gonderim_araligi_gun', 'eclub_alici_pencere_gun', 'eclub_alici_haftalik_limit'
);

REVOKE ALL ON FUNCTION public.eclub_gonderim_sure_kapisi() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.eclub_yayin_gonder(uuid,uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_yayin_gonder(uuid,uuid,uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.eclub_oneri_atomik_kaydet(uuid,uuid,uuid,uuid,timestamptz,timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_oneri_atomik_kaydet(uuid,uuid,uuid,uuid,timestamptz,timestamptz)
  TO service_role;

COMMIT;

SELECT
  to_regprocedure('public.eclub_yayin_gonder(uuid,uuid,uuid,uuid)') IS NOT NULL AS yeni_gonderim_rpc_var,
  position('eclub_yayin_gonder' IN pg_get_functiondef(
    'public.eclub_oneri_atomik_kaydet(uuid,uuid,uuid,uuid,timestamptz,timestamptz)'::regprocedure)) > 0
    AS eski_rpc_yeni_kurguya_bagli,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.eclub_oneri_kayitlari'::regclass
    AND tgname = 'trg_eclub_gonderim_sure_kapisi' AND NOT tgisinternal) AS sure_kapisi_var,
  EXISTS (SELECT 1 FROM public.sistem_ayarlari WHERE anahtar = 'eclub_oneri_gecerlilik_gun'
    AND deger = '15'::jsonb) AS gecerlilik_15_gun,
  NOT EXISTS (SELECT 1 FROM public.sistem_ayarlari
    WHERE anahtar = 'eclub_ayni_video_tekrar_bekleme_gun') AS eski_21_gun_ayari_kaldirildi;
