-- E-Club yeni gönderim kurgusu — Adım 4: atomik kota ve tarih kontrolü.
-- Ön koşul: eclub_yayin_gonderim_planlari.sql (Adım 3) kurulmuş olmalıdır.
-- SQL'i proje sahibi Supabase SQL Editor'da tamamını birlikte çalıştırır.
-- Eski gönderim RPC'sinin/ayarlarının değiştirilmesi Adım 5'tedir.
-- API, bildirim ve cron kurulumu bu dosyanın kapsamı dışındadır.

BEGIN;

SELECT pg_advisory_xact_lock(hashtextextended('eclub-gonderim-kota-v1', 0));

-- Öneri oluşturulurken kendi plan rezervasyonunu tanımak için ters bağlantı.
-- Gerçekleşmiş plan ayrıca sayılmaz; öneri gerçek başlangıç zamanında sayılır.
ALTER TABLE public.eclub_oneri_kayitlari ADD COLUMN IF NOT EXISTS plan_id uuid;
DO $kisit$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.eclub_oneri_kayitlari'::regclass
      AND conname = 'eclub_oneri_plan_fk') THEN
    ALTER TABLE public.eclub_oneri_kayitlari ADD CONSTRAINT eclub_oneri_plan_fk
      FOREIGN KEY (plan_id) REFERENCES public.eclub_yayin_gonderim_planlari(plan_id);
  END IF;
END;
$kisit$;
CREATE UNIQUE INDEX IF NOT EXISTS eclub_oneri_plan_uq
  ON public.eclub_oneri_kayitlari(plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS eclub_oneri_yayin_zaman_idx
  ON public.eclub_oneri_kayitlari(oneren_id, kisi_id, yayin_id, oneri_baslangic);
CREATE INDEX IF NOT EXISTS eclub_oneri_uye_zaman_idx
  ON public.eclub_oneri_kayitlari(oneren_id, kisi_id, oneri_baslangic);

-- Aynı UTT–üye kilidi, hem ürün hem yayın hesaplarını kapsar.
-- Çoklu kayıt RPC'si de bütün üye kilitlerini UUID sırasıyla ÖNCEDEN almalıdır.
-- Bu yardımcı istemciye açık değildir.
CREATE OR REPLACE FUNCTION public.eclub_gonderim_kapsamini_kilitle(
  p_utt_id uuid, p_kisi_id uuid
) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $f$
BEGIN
  IF p_utt_id IS NULL OR p_kisi_id IS NULL THEN
    RAISE EXCEPTION 'Gönderen ve alıcı zorunludur.' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(
    concat_ws(':', 'eclub-gonderim', p_utt_id::text, p_kisi_id::text), 0));
END;
$f$;

-- Ortak hesap: anlık gönderim, plan oluşturma ve gerçekleşme aynı kaynağı kullanır.
-- p_simdi yalnız iç çağrı/test içindir; dış okuma RPC'si sunucu saatini kullanır.
-- İlk gönderim ayrı, hedef dönemde yeniden gönderim sayısı en fazla ikidir.
CREATE OR REPLACE FUNCTION public.eclub_gonderim_kontrol_hesapla(
  p_utt_id uuid, p_kisi_id uuid, p_yayin_id uuid,
  p_hedef_at timestamptz, p_islem text,
  p_plan_id uuid, p_simdi timestamptz
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
SET timezone = 'Europe/Istanbul'
AS $f$
DECLARE
  v_utt record;
  v_yayin record;
  v_kisi record;
  v_plan record;
  v_hedef_rol text;
  v_hedef_tr timestamp;
  v_simdi_tr timestamp;
  v_hafta_tr timestamp;
  v_donem_tr timestamp;
  v_donem_bas timestamptz;
  v_donem_bit timestamptz;
  v_hafta_bas timestamptz;
  v_hafta_bit timestamptz;
  v_tur timestamptz;
  v_periyot integer;
  v_haftalik integer;
  v_tekrar integer;
  v_ilk_at timestamptz;
  v_onceki_at timestamptz;
  v_sonraki_at timestamptz;
  v_sonuc jsonb;
BEGIN
  IF p_utt_id IS NULL OR p_kisi_id IS NULL OR p_yayin_id IS NULL
    OR p_hedef_at IS NULL OR p_simdi IS NULL
    OR NOT isfinite(p_hedef_at) OR NOT isfinite(p_simdi)
    OR p_islem IS NULL OR p_islem NOT IN ('gonder', 'planla', 'gerceklestir') THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'gecersiz_girdi');
  END IF;

  v_hedef_tr := p_hedef_at AT TIME ZONE 'Europe/Istanbul';
  v_simdi_tr := p_simdi AT TIME ZONE 'Europe/Istanbul';
  IF extract(isodow FROM v_hedef_tr) NOT BETWEEN 1 AND 5 THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'hedef_hafta_sonu');
  END IF;
  IF p_islem = 'planla' THEN
    IF p_hedef_at <= p_simdi THEN
      RETURN jsonb_build_object('uygun', false, 'sebep', 'hedef_gecmiste');
    END IF;
    IF v_hedef_tr >= date_trunc('week', v_simdi_tr) + interval '14 days' THEN
      RETURN jsonb_build_object('uygun', false, 'sebep', 'takip_eden_hafta_asildi');
    END IF;
    -- Ocak–Şubat, Mart–Nisan, ...; hafta koşulundan bağımsız uygulanır.
    v_donem_tr := make_date(extract(year FROM v_simdi_tr)::integer,
      ((extract(month FROM v_simdi_tr)::integer - 1) / 2) * 2 + 1, 1)::timestamp;
    IF v_hedef_tr < v_donem_tr OR v_hedef_tr >= v_donem_tr + interval '2 months' THEN
      RETURN jsonb_build_object('uygun', false, 'sebep', 'ileri_donem_planlanamaz');
    END IF;
  END IF;

  IF p_plan_id IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.eclub_yayin_gonderim_planlari
      WHERE plan_id = p_plan_id;
    IF NOT FOUND OR v_plan.utt_id <> p_utt_id OR v_plan.kisi_id <> p_kisi_id
      OR v_plan.yayin_id <> p_yayin_id
      OR v_plan.durum NOT IN ('bekliyor', 'isleniyor') THEN
      RETURN jsonb_build_object('uygun', false, 'sebep', 'plan_uyusmuyor');
    END IF;
    IF p_islem = 'gerceklestir' AND (
      p_hedef_at < v_plan.hedef_gonderim_at
      OR v_hedef_tr::date <> (v_plan.hedef_gonderim_at AT TIME ZONE 'Europe/Istanbul')::date
    ) THEN
      RETURN jsonb_build_object('uygun', false, 'sebep', 'plan_gunu_gecersiz');
    END IF;
  ELSIF p_islem = 'gerceklestir' THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'plan_zorunlu');
  END IF;

  SELECT k.firma_id, k.takim_id INTO v_utt
  FROM public.kullanicilar k JOIN public.firmalar f ON f.firma_id = k.firma_id
  WHERE k.kullanici_id = p_utt_id AND lower(k.rol) IN ('utt', 'kd_utt')
    AND k.aktif_mi = true AND f.aktif = true AND f.eclub_aktif = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'utt_yetkisiz');
  END IF;
  SELECT y.firma_id, y.takim_id, y.durum, y.hedef_roller, ky.urun_id
  INTO v_yayin FROM public.v_yayin_detay y
  JOIN public.v_yayin_kunye ky ON ky.yayin_id = y.yayin_id
  WHERE y.yayin_id = p_yayin_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'yayin_bulunamadi');
  END IF;
  IF v_yayin.durum IS DISTINCT FROM 'yayinda' THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'yayin_aktif_degil');
  END IF;
  IF v_yayin.firma_id IS DISTINCT FROM v_utt.firma_id
    OR (v_yayin.takim_id IS NOT NULL AND v_yayin.takim_id IS DISTINCT FROM v_utt.takim_id) THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'yayin_kapsam_disi');
  END IF;
  IF v_yayin.urun_id IS NULL THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'urun_bagi_yok');
  END IF;
  IF p_plan_id IS NOT NULL THEN
    IF v_plan.urun_id IS DISTINCT FROM v_yayin.urun_id THEN
      RETURN jsonb_build_object('uygun', false, 'sebep', 'plan_urun_uyusmuyor');
    END IF;
  END IF;
  SELECT k.rol, k.auth_user_id INTO v_kisi FROM public.eclub_kisiler k
    WHERE k.kisi_id = p_kisi_id;
  IF NOT FOUND OR v_kisi.auth_user_id IS NULL THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'alici_hesabi_yok');
  END IF;
  v_hedef_rol := CASE
    WHEN lower(v_kisi.rol) IN ('eczaci', 'ikinci_eczaci', 'yardimci_eczaci') THEN 'eczaci'
    WHEN lower(v_kisi.rol) = 'eczane_teknisyeni' THEN 'eczane_teknisyeni'
    ELSE NULL END;
  IF v_hedef_rol IS NULL OR NOT (v_hedef_rol = ANY(coalesce(v_yayin.hedef_roller, ARRAY[]::text[]))) THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'rol_uyumsuz');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.eclub_kisi_eczane ke
    JOIN public.eclub_eczane_firma ef ON ef.eczane_id = ke.eczane_id
    JOIN public.eclub_utt_eczane ue ON ue.eczane_firma_id = ef.id
    WHERE ke.kisi_id = p_kisi_id AND ke.aktif_mi = true
      AND ef.firma_id = v_utt.firma_id AND ef.aktif_mi = true
      AND ue.utt_id = p_utt_id AND ue.aktif_mi = true
  ) THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'aktif_alici_bagi_yok');
  END IF;

  -- Gönderim öncesi inceleme kapısı korunur; kota kimliği yalnız yayındır.
  SELECT coalesce((SELECT t.baslangic_tarihi FROM public.yayin_tekrar_kayitlari t
    WHERE t.yayin_id = p_yayin_id ORDER BY t.tur_no DESC LIMIT 1), y.yayin_tarihi),
    y.tekrar_periyot_gun INTO v_tur, v_periyot
    FROM public.yayin_yonetimi y WHERE y.yayin_id = p_yayin_id;
  IF v_periyot > 0 AND v_tur < p_simdi THEN
    v_tur := v_tur + floor(extract(epoch FROM (p_simdi - v_tur)) / (v_periyot * 86400))::integer
      * make_interval(days => v_periyot);
  END IF;
  IF v_tur IS NULL OR NOT EXISTS (SELECT 1 FROM public.eclub_utt_yayin_incelemeleri i
    WHERE i.utt_id = p_utt_id AND i.yayin_id = p_yayin_id
      AND i.tamamlandi_at >= v_tur) THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'inceleme_tamamlanmadi');
  END IF;

  v_hafta_tr := date_trunc('week', v_hedef_tr);
  v_hafta_bas := v_hafta_tr AT TIME ZONE 'Europe/Istanbul';
  v_hafta_bit := (v_hafta_tr + interval '5 days') AT TIME ZONE 'Europe/Istanbul';
  v_donem_tr := make_date(extract(year FROM v_hedef_tr)::integer,
    ((extract(month FROM v_hedef_tr)::integer - 1) / 2) * 2 + 1, 1)::timestamp;
  v_donem_bas := v_donem_tr AT TIME ZONE 'Europe/Istanbul';
  v_donem_bit := (v_donem_tr + interval '2 months') AT TIME ZONE 'Europe/Istanbul';

  -- Eksik yayın/ürün çözümlemesi kota boşmuş gibi gösterilemez.
  IF EXISTS (SELECT 1 FROM public.eclub_oneri_kayitlari o
    LEFT JOIN public.v_yayin_kunye ky ON ky.yayin_id = o.yayin_id
    WHERE o.oneren_id = p_utt_id AND o.kisi_id = p_kisi_id
      AND o.oneri_baslangic >= v_hafta_bas AND o.oneri_baslangic < v_hafta_bit
      AND ky.yayin_id IS NULL) THEN
    RETURN jsonb_build_object('uygun', false, 'sebep', 'gecmis_urun_bagi_cozulemedi');
  END IF;

  SELECT count(*)::integer INTO v_haftalik FROM (
    SELECT o.oneri_baslangic AS an FROM public.eclub_oneri_kayitlari o
      JOIN public.v_yayin_kunye ky ON ky.yayin_id = o.yayin_id
      WHERE o.oneren_id = p_utt_id AND o.kisi_id = p_kisi_id AND ky.urun_id = v_yayin.urun_id
    UNION ALL
    SELECT pl.hedef_gonderim_at FROM public.eclub_yayin_gonderim_planlari pl
      WHERE pl.utt_id = p_utt_id AND pl.kisi_id = p_kisi_id AND pl.urun_id = v_yayin.urun_id
        AND pl.durum IN ('bekliyor', 'isleniyor')
        AND (p_plan_id IS NULL OR pl.plan_id <> p_plan_id)
        AND NOT EXISTS (SELECT 1 FROM public.eclub_oneri_kayitlari o WHERE o.plan_id = pl.plan_id)
  ) AS faaliyet WHERE an >= v_hafta_bas AND an < v_hafta_bit;

  -- Dönem sınırı sayımı sıfırlar; 15 günlük aralık dönem sınırında kaybolmaz.
  WITH faaliyet AS (
    SELECT o.oneri_baslangic AS an FROM public.eclub_oneri_kayitlari o
      WHERE o.oneren_id = p_utt_id AND o.kisi_id = p_kisi_id AND o.yayin_id = p_yayin_id
    UNION ALL
    SELECT pl.hedef_gonderim_at FROM public.eclub_yayin_gonderim_planlari pl
      WHERE pl.utt_id = p_utt_id AND pl.kisi_id = p_kisi_id AND pl.yayin_id = p_yayin_id
        AND pl.durum IN ('bekliyor', 'isleniyor')
        AND (p_plan_id IS NULL OR pl.plan_id <> p_plan_id)
        AND NOT EXISTS (SELECT 1 FROM public.eclub_oneri_kayitlari o WHERE o.plan_id = pl.plan_id)
  ) SELECT min(an), max(an) FILTER (WHERE an <= p_hedef_at),
      min(an) FILTER (WHERE an >= p_hedef_at),
      count(*) FILTER (WHERE an >= v_donem_bas AND an < v_donem_bit)::integer
    INTO v_ilk_at, v_onceki_at, v_sonraki_at, v_tekrar FROM faaliyet;

  -- Aday dahil say; bütün geçmişteki ilk olay yeniden gönderim değildir.
  v_ilk_at := least(coalesce(v_ilk_at, p_hedef_at), p_hedef_at);
  v_tekrar := v_tekrar + 1 - CASE
    WHEN v_ilk_at >= v_donem_bas AND v_ilk_at < v_donem_bit THEN 1 ELSE 0 END;
  v_sonuc := jsonb_build_object('uygun', true, 'sebep', NULL,
    'urun_id', v_yayin.urun_id, 'haftalik_kullanilan', v_haftalik,
    'haftalik_kalan', greatest(0, 3 - v_haftalik), 'adayla_donemlik_tekrar', v_tekrar,
    'onceki_gonderim_at', v_onceki_at, 'sonraki_gonderim_at', v_sonraki_at,
    'yeniden_gonderilebilir_at', v_onceki_at + interval '15 days');
  IF v_haftalik >= 3 THEN
    RETURN v_sonuc || jsonb_build_object('uygun', false, 'sebep', 'haftalik_urun_kotasi');
  END IF;
  IF v_tekrar > 2 THEN
    RETURN v_sonuc || jsonb_build_object('uygun', false, 'sebep', 'donemlik_tekrar_kotasi');
  END IF;
  IF (v_onceki_at IS NOT NULL AND p_hedef_at - v_onceki_at < interval '15 days')
    OR (v_sonraki_at IS NOT NULL AND v_sonraki_at - p_hedef_at < interval '15 days') THEN
    RETURN v_sonuc || jsonb_build_object('uygun', false, 'sebep', 'on_bes_gun_araligi');
  END IF;
  RETURN v_sonuc;
END;
$f$;

-- Yetki veya yayın durumu işlem sırasında değişirse kayıtla yarışmasın.
CREATE OR REPLACE FUNCTION public.eclub_gonderim_erisimini_kilitle(
  p_utt_id uuid, p_kisi_id uuid, p_yayin_id uuid
) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $f$
BEGIN
  PERFORM 1 FROM public.kullanicilar k JOIN public.firmalar f ON f.firma_id = k.firma_id
    WHERE k.kullanici_id = p_utt_id FOR SHARE OF k, f;
  PERFORM 1 FROM public.yayin_yonetimi y WHERE y.yayin_id = p_yayin_id FOR SHARE;
  PERFORM 1 FROM public.eclub_kisiler k WHERE k.kisi_id = p_kisi_id FOR SHARE;
  PERFORM 1 FROM public.eclub_kisi_eczane ke
    JOIN public.eclub_eczane_firma ef ON ef.eczane_id = ke.eczane_id
    JOIN public.eclub_utt_eczane ue ON ue.eczane_firma_id = ef.id
    WHERE ke.kisi_id = p_kisi_id AND ke.aktif_mi = true AND ue.utt_id = p_utt_id
      AND ue.aktif_mi = true AND ef.aktif_mi = true
    ORDER BY ke.id, ef.id, ue.id FOR SHARE OF ke, ef, ue;
END;
$f$;

-- Ekran/API uygunluk okuması; kayıt için garanti değildir, yazım kapısı tekrarlar.
CREATE OR REPLACE FUNCTION public.eclub_gonderim_uygunlugu(
  p_utt_id uuid, p_kisi_id uuid, p_yayin_id uuid, p_hedef_at timestamptz DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $f$
DECLARE v_simdi timestamptz := clock_timestamp();
BEGIN
  RETURN public.eclub_gonderim_kontrol_hesapla(p_utt_id, p_kisi_id, p_yayin_id,
    coalesce(p_hedef_at, v_simdi), CASE WHEN p_hedef_at IS NULL THEN 'gonder' ELSE 'planla' END,
    NULL, v_simdi);
END;
$f$;

-- Kayıt kapısı doğrudan INSERT/UPDATE ve eski RPC çağrılarında da uygulanır.
CREATE OR REPLACE FUNCTION public.eclub_gonderim_oneri_kapisi()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $f$
DECLARE v_sonuc jsonb; v_plan record;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF ROW(NEW.oneri_id, NEW.oneren_id, NEW.kisi_id, NEW.yayin_id, NEW.plan_id, NEW.oneri_baslangic)
      IS DISTINCT FROM ROW(OLD.oneri_id, OLD.oneren_id, OLD.kisi_id, OLD.yayin_id, OLD.plan_id, OLD.oneri_baslangic) THEN
      RAISE EXCEPTION 'Gerçekleşmiş gönderimin kimliği veya zamanı değiştirilemez.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  PERFORM public.eclub_gonderim_kapsamini_kilitle(NEW.oneren_id, NEW.kisi_id);
  PERFORM public.eclub_gonderim_erisimini_kilitle(NEW.oneren_id, NEW.kisi_id, NEW.yayin_id);
  -- Plan kaydı öneri tablosuna önceden yazılamaz; burada yalnız gerçek gönderim olur.
  NEW.oneri_baslangic := clock_timestamp();
  IF NEW.plan_id IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.eclub_yayin_gonderim_planlari
      WHERE plan_id = NEW.plan_id FOR UPDATE;
    IF NOT FOUND OR v_plan.durum <> 'isleniyor' OR v_plan.lease_bitis <= NEW.oneri_baslangic THEN
      RAISE EXCEPTION 'Plan gönderim için sahiplenilmemiş veya sahiplenme süresi bitmiş.' USING ERRCODE = '23514';
    END IF;
  END IF;
  v_sonuc := public.eclub_gonderim_kontrol_hesapla(NEW.oneren_id, NEW.kisi_id, NEW.yayin_id,
    NEW.oneri_baslangic, CASE WHEN NEW.plan_id IS NULL THEN 'gonder' ELSE 'gerceklestir' END,
    NEW.plan_id, NEW.oneri_baslangic);
  IF NOT (v_sonuc->>'uygun')::boolean THEN
    RAISE EXCEPTION 'ECLUB_GONDERIM:%', v_sonuc->>'sebep' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$f$;

CREATE OR REPLACE FUNCTION public.eclub_gonderim_plan_kapisi()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $f$
DECLARE v_sonuc jsonb; v_oneri record; v_simdi timestamptz := clock_timestamp();
BEGIN
  PERFORM public.eclub_gonderim_kapsamini_kilitle(NEW.utt_id, NEW.kisi_id);
  IF TG_OP = 'INSERT' THEN
    IF NEW.durum <> 'bekliyor' THEN
      RAISE EXCEPTION 'Yeni plan bekliyor durumunda oluşturulmalıdır.' USING ERRCODE = '23514';
    END IF;
    NEW.created_at := v_simdi;
  ELSE
    IF ROW(NEW.plan_id, NEW.utt_id, NEW.kisi_id, NEW.yayin_id, NEW.urun_id,
      NEW.hedef_gonderim_at, NEW.islem_anahtari, NEW.created_at)
      IS DISTINCT FROM ROW(OLD.plan_id, OLD.utt_id, OLD.kisi_id, OLD.yayin_id, OLD.urun_id,
      OLD.hedef_gonderim_at, OLD.islem_anahtari, OLD.created_at) THEN
      RAISE EXCEPTION 'Plan kimliği ve hedef zamanı değiştirilemez.' USING ERRCODE = '23514';
    END IF;
    IF OLD.durum IN ('gerceklesti', 'gerceklesmedi') AND NEW IS DISTINCT FROM OLD THEN
      RAISE EXCEPTION 'Sonuçlanmış plan yeniden işleme açılamaz.' USING ERRCODE = '23514';
    END IF;
    IF OLD.durum = 'bekliyor' AND NEW.durum = 'gerceklesti' THEN
      RAISE EXCEPTION 'Plan önce işleyici tarafından sahiplenilmelidir.' USING ERRCODE = '23514';
    END IF;
  END IF;
  NEW.guncellenme_at := v_simdi;
  IF NEW.durum IN ('bekliyor', 'isleniyor') THEN
    PERFORM public.eclub_gonderim_erisimini_kilitle(NEW.utt_id, NEW.kisi_id, NEW.yayin_id);
    IF NEW.durum = 'isleniyor' AND NEW.hedef_gonderim_at > v_simdi THEN
      RAISE EXCEPTION 'Planın gönderim zamanı henüz gelmedi.' USING ERRCODE = 'P0001';
    END IF;
    v_sonuc := public.eclub_gonderim_kontrol_hesapla(NEW.utt_id, NEW.kisi_id, NEW.yayin_id,
      CASE WHEN NEW.hedef_gonderim_at <= v_simdi THEN v_simdi ELSE NEW.hedef_gonderim_at END,
      CASE WHEN TG_OP = 'UPDATE' AND NEW.hedef_gonderim_at <= v_simdi THEN 'gerceklestir' ELSE 'planla' END,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.plan_id ELSE NULL END, v_simdi);
    IF NOT (v_sonuc->>'uygun')::boolean THEN
      RAISE EXCEPTION 'ECLUB_GONDERIM:%', v_sonuc->>'sebep' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.urun_id IS DISTINCT FROM (v_sonuc->>'urun_id')::uuid THEN
      RAISE EXCEPTION 'Planın ürün kimliği yayınla uyuşmuyor.' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.durum = 'gerceklesti' THEN
    SELECT * INTO v_oneri FROM public.eclub_oneri_kayitlari WHERE oneri_id = NEW.oneri_id;
    IF NOT FOUND OR ROW(v_oneri.oneren_id, v_oneri.kisi_id, v_oneri.yayin_id, v_oneri.plan_id)
      IS DISTINCT FROM ROW(NEW.utt_id, NEW.kisi_id, NEW.yayin_id, NEW.plan_id)
      OR NEW.gerceklesti_at IS DISTINCT FROM v_oneri.oneri_baslangic THEN
      RAISE EXCEPTION 'Plan sonucu gerçek gönderim kaydıyla uyuşmuyor.' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$f$;

-- Öneri ve plan birbirine bağlı olarak ancak birlikte commit edilebilir.
CREATE OR REPLACE FUNCTION public.eclub_gonderim_plan_sonucunu_dogrula()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $f$
DECLARE v_plan_id uuid;
BEGIN
  v_plan_id := NEW.plan_id;
  IF v_plan_id IS NULL THEN RETURN NULL; END IF;
  IF EXISTS (
    SELECT 1 FROM public.eclub_oneri_kayitlari o
      JOIN public.eclub_yayin_gonderim_planlari pl ON pl.plan_id = o.plan_id
    WHERE o.plan_id = v_plan_id AND (
      pl.durum <> 'gerceklesti' OR pl.oneri_id IS DISTINCT FROM o.oneri_id
      OR pl.gerceklesti_at IS DISTINCT FROM o.oneri_baslangic
      OR ROW(pl.utt_id, pl.kisi_id, pl.yayin_id) IS DISTINCT FROM ROW(o.oneren_id, o.kisi_id, o.yayin_id)
    )
  ) THEN
    RAISE EXCEPTION 'Plan ile öneri sonucu aynı transactionda tamamlanmalıdır.' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.eclub_yayin_gonderim_planlari pl
      LEFT JOIN public.eclub_oneri_kayitlari o ON o.oneri_id = pl.oneri_id
    WHERE pl.plan_id = v_plan_id AND pl.durum = 'gerceklesti'
      AND (o.oneri_id IS NULL OR o.plan_id IS DISTINCT FROM pl.plan_id)
  ) THEN
    RAISE EXCEPTION 'Gerçekleşmiş planın öneri bağlantısı eksik.' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$f$;

DROP TRIGGER IF EXISTS trg_eclub_gonderim_oneri_kapisi ON public.eclub_oneri_kayitlari;
CREATE TRIGGER trg_eclub_gonderim_oneri_kapisi BEFORE INSERT OR UPDATE
  ON public.eclub_oneri_kayitlari FOR EACH ROW
  EXECUTE FUNCTION public.eclub_gonderim_oneri_kapisi();
DROP TRIGGER IF EXISTS trg_eclub_gonderim_plan_kapisi ON public.eclub_yayin_gonderim_planlari;
CREATE TRIGGER trg_eclub_gonderim_plan_kapisi BEFORE INSERT OR UPDATE
  ON public.eclub_yayin_gonderim_planlari FOR EACH ROW
  EXECUTE FUNCTION public.eclub_gonderim_plan_kapisi();
DROP TRIGGER IF EXISTS trg_eclub_oneri_plan_sonuc ON public.eclub_oneri_kayitlari;
CREATE CONSTRAINT TRIGGER trg_eclub_oneri_plan_sonuc AFTER INSERT OR UPDATE
  ON public.eclub_oneri_kayitlari DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION public.eclub_gonderim_plan_sonucunu_dogrula();
DROP TRIGGER IF EXISTS trg_eclub_plan_oneri_sonuc ON public.eclub_yayin_gonderim_planlari;
CREATE CONSTRAINT TRIGGER trg_eclub_plan_oneri_sonuc AFTER INSERT OR UPDATE
  ON public.eclub_yayin_gonderim_planlari DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION public.eclub_gonderim_plan_sonucunu_dogrula();

REVOKE ALL ON FUNCTION public.eclub_gonderim_kapsamini_kilitle(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_gonderim_kapsamini_kilitle(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.eclub_gonderim_kontrol_hesapla(uuid,uuid,uuid,timestamptz,text,uuid,timestamptz)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.eclub_gonderim_uygunlugu(uuid,uuid,uuid,timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_gonderim_uygunlugu(uuid,uuid,uuid,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.eclub_gonderim_oneri_kapisi() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.eclub_gonderim_plan_kapisi() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.eclub_gonderim_erisimini_kilitle(uuid,uuid,uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.eclub_gonderim_plan_sonucunu_dogrula()
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;

SELECT
  to_regprocedure('public.eclub_gonderim_uygunlugu(uuid,uuid,uuid,timestamp with time zone)') IS NOT NULL AS uygunluk_rpc_var,
  to_regclass('public.eclub_oneri_plan_uq') IS NOT NULL AS plan_tekilligi_var,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.eclub_oneri_kayitlari'::regclass
    AND tgname = 'trg_eclub_gonderim_oneri_kapisi' AND NOT tgisinternal) AS oneri_kapisi_var,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.eclub_yayin_gonderim_planlari'::regclass
    AND tgname = 'trg_eclub_gonderim_plan_kapisi' AND NOT tgisinternal) AS plan_kapisi_var;
