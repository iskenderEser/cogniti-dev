-- Gönderi planındaki saat bilgisini kalıcı kaldırır; planlar yalnız tarih tutar.
-- Mevcut kolon/RPC adları API bağlantısı kopmasın diye korunur.
-- Eski saatli RPC girdisinin saat bölümü dikkate alınmaz.
-- Gerçek gönderim başlangıcı/bitişi ve teknik işlem zamanları korunur.
-- Cron aktifliği değiştirilmez. Proje sahibi SQL Editor'da çalıştırır.
BEGIN;
SET LOCAL timezone = 'Europe/Istanbul';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-gonderim-saatsiz-v1',0));
LOCK TABLE public.eclub_yayin_gonderim_planlari IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.eclub_oneri_kayitlari IN SHARE ROW EXCLUSIVE MODE;

DO $temizle$
DECLARE v_tanim text; v_yeni text; v_tip oid;
BEGIN
 SELECT atttypid INTO v_tip FROM pg_attribute
 WHERE attrelid='public.eclub_yayin_gonderim_planlari'::regclass
  AND attname='hedef_gonderim_at' AND NOT attisdropped;
 IF v_tip='date'::regtype THEN
  IF position('::date <= (p_simdi AT TIME ZONE' IN pg_get_functiondef(
    'public.eclub_gonderim_kontrol_hesapla(uuid,uuid,uuid,timestamptz,text,uuid,timestamptz)'::regprocedure))=0
   OR position('hedef_gonderim_at <= (clock_timestamp() AT TIME ZONE' IN pg_get_functiondef(
    'public.eclub_planlanan_gonderimi_isle(text[])'::regprocedure))=0 THEN
   RAISE EXCEPTION 'Tarih kolonu var ancak gün bazlı fonksiyonlar eksik; kurulum tutarsız.';
  END IF;
  RETURN;
 END IF;
 IF v_tip IS DISTINCT FROM 'timestamptz'::regtype THEN
  RAISE EXCEPTION 'Plan hedef alanı bulunamadı veya beklenmeyen türde.';
 END IF;
 -- Bugün daha geç bir saate ayarlanmış planı erkene çekme; işlem tamamen geri alınır.
 IF EXISTS (
  SELECT 1 FROM public.eclub_yayin_gonderim_planlari
  WHERE durum IN ('bekliyor','isleniyor')
   AND hedef_gonderim_at > clock_timestamp()
   AND (hedef_gonderim_at AT TIME ZONE 'Europe/Istanbul')::date
     = (clock_timestamp() AT TIME ZONE 'Europe/Istanbul')::date
 ) THEN
  RAISE EXCEPTION 'Bugün ileri saate ayarlı açık plan var; tarih geçişi uygulanmadı.';
 END IF;

 -- Ortak kota/tekrar hesabı gün üzerinden yapılır.
 v_tanim:=pg_get_functiondef('public.eclub_gonderim_kontrol_hesapla(uuid,uuid,uuid,timestamptz,text,uuid,timestamptz)'::regprocedure);
 IF position('IF p_hedef_at <= p_simdi THEN' IN v_tanim)=0
  OR position('p_hedef_at < v_plan.hedef_gonderim_at' IN v_tanim)=0
  OR position('p_hedef_at - v_onceki_at < interval ''15 days''' IN v_tanim)=0
  OR position('v_sonraki_at - p_hedef_at < interval ''15 days''' IN v_tanim)=0
  OR position('WHERE an <= p_hedef_at' IN v_tanim)=0
  OR position('WHERE an >= p_hedef_at' IN v_tanim)=0 THEN
  RAISE EXCEPTION 'Ortak kontrol tanımı beklenen saatli sürümde değil.';
 END IF;
 v_yeni:=replace(v_tanim,'IF p_hedef_at <= p_simdi THEN',
  'IF (p_hedef_at AT TIME ZONE ''Europe/Istanbul'')::date <= (p_simdi AT TIME ZONE ''Europe/Istanbul'')::date THEN');
 v_yeni:=replace(v_yeni,'p_hedef_at < v_plan.hedef_gonderim_at',
  '(p_hedef_at AT TIME ZONE ''Europe/Istanbul'')::date < v_plan.hedef_gonderim_at');
 v_yeni:=replace(v_yeni,'(v_plan.hedef_gonderim_at AT TIME ZONE ''Europe/Istanbul'')::date','v_plan.hedef_gonderim_at');
 v_yeni:=replace(v_yeni,'p_hedef_at - v_onceki_at < interval ''15 days''',
  '(p_hedef_at AT TIME ZONE ''Europe/Istanbul'')::date - (v_onceki_at AT TIME ZONE ''Europe/Istanbul'')::date < 15');
 v_yeni:=replace(v_yeni,'v_sonraki_at - p_hedef_at < interval ''15 days''',
  '(v_sonraki_at AT TIME ZONE ''Europe/Istanbul'')::date - (p_hedef_at AT TIME ZONE ''Europe/Istanbul'')::date < 15');
 -- Önceki/sonraki seçimi de saatten bağımsızlaştır.
 v_yeni:=replace(v_yeni,'WHERE an <= p_hedef_at',
  'WHERE (an AT TIME ZONE ''Europe/Istanbul'')::date <= (p_hedef_at AT TIME ZONE ''Europe/Istanbul'')::date');
 v_yeni:=replace(v_yeni,'WHERE an >= p_hedef_at',
  'WHERE (an AT TIME ZONE ''Europe/Istanbul'')::date >= (p_hedef_at AT TIME ZONE ''Europe/Istanbul'')::date');
 EXECUTE v_yeni;

 -- Toplu işlemin girişindeki saat atılır; tekrar anahtarı tarih üzerinden eşleşir.
 v_tanim:=pg_get_functiondef('public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamptz,uuid,boolean)'::regprocedure);
 IF position('  -- Bütün alıcı kilitleri' IN v_tanim)=0 THEN
  RAISE EXCEPTION 'Toplu işlem tanımı beklenen sürümde değil.';
 END IF;
 v_yeni:=replace(v_tanim,'  -- Bütün alıcı kilitleri',
  '  IF p_hedef_at IS NOT NULL THEN
    p_hedef_at := ((p_hedef_at AT TIME ZONE ''Europe/Istanbul'')::date::timestamp AT TIME ZONE ''Europe/Istanbul'');
  END IF;
  -- Bütün alıcı kilitleri');
 EXECUTE v_yeni;

 -- Plan yazımında timestamp parametresini açıkça Türkiye tarihine dönüştür.
 v_tanim:=pg_get_functiondef('public.eclub_gonderim_plan_kapisi()'::regprocedure);
 IF position('NEW.hedef_gonderim_at > v_simdi' IN v_tanim)=0
  OR position('NEW.hedef_gonderim_at <= v_simdi' IN v_tanim)=0
  OR position('ELSE NEW.hedef_gonderim_at END' IN v_tanim)=0 THEN
  RAISE EXCEPTION 'Plan kapısı tanımı beklenen saatli sürümde değil.';
 END IF;
 v_yeni:=replace(v_tanim,'NEW.hedef_gonderim_at > v_simdi',
  'NEW.hedef_gonderim_at > (v_simdi AT TIME ZONE ''Europe/Istanbul'')::date');
 v_yeni:=replace(v_yeni,'NEW.hedef_gonderim_at <= v_simdi',
  'NEW.hedef_gonderim_at <= (v_simdi AT TIME ZONE ''Europe/Istanbul'')::date');
 v_yeni:=replace(v_yeni,'ELSE NEW.hedef_gonderim_at END',
  'ELSE (NEW.hedef_gonderim_at::timestamp AT TIME ZONE ''Europe/Istanbul'') END');
 EXECUTE v_yeni;

 -- İşleyici tarihin gelmesini kontrol eder; seçilmiş saat koşulu yoktur.
 v_tanim:=pg_get_functiondef('public.eclub_planlanan_gonderimi_isle(text[])'::regprocedure);
 IF position('hedef_gonderim_at <= clock_timestamp()' IN v_tanim)=0 THEN
  RAISE EXCEPTION 'Plan işleyicisi tanımı beklenen saatli sürümde değil.';
 END IF;
 v_yeni:=replace(v_tanim,'hedef_gonderim_at <= clock_timestamp()',
  'hedef_gonderim_at <= (clock_timestamp() AT TIME ZONE ''Europe/Istanbul'')::date');
 EXECUTE v_yeni;

 ALTER TABLE public.eclub_yayin_gonderim_planlari
  DROP CONSTRAINT IF EXISTS eclub_gonderim_plan_gerceklesme_ck;
 ALTER TABLE public.eclub_yayin_gonderim_planlari
  ALTER COLUMN hedef_gonderim_at TYPE date
  USING (hedef_gonderim_at AT TIME ZONE 'Europe/Istanbul')::date;
 ALTER TABLE public.eclub_yayin_gonderim_planlari
  ADD CONSTRAINT eclub_gonderim_plan_gerceklesme_ck CHECK (
   gerceklesti_at IS NULL OR (gerceklesti_at AT TIME ZONE 'Europe/Istanbul')::date >= hedef_gonderim_at
  );
 COMMENT ON COLUMN public.eclub_yayin_gonderim_planlari.hedef_gonderim_at IS
  'Yalnız Türkiye takvim tarihi; gönderi saati tutulmaz. Kolon adı mevcut API sözleşmesi için korunur.';
END;
$temizle$;
COMMIT;

SELECT
 (SELECT data_type='date' FROM information_schema.columns
  WHERE table_schema='public' AND table_name='eclub_yayin_gonderim_planlari' AND column_name='hedef_gonderim_at') AS plan_saat_alani_temizlendi,
 position('::date < 15' IN pg_get_functiondef('public.eclub_gonderim_kontrol_hesapla(uuid,uuid,uuid,timestamptz,text,uuid,timestamptz)'::regprocedure))>0 AS tekrar_gun_esasli,
 position('p_hedef_at := ((p_hedef_at AT TIME ZONE' IN
  pg_get_functiondef('public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamptz,uuid,boolean)'::regprocedure))>0 AS toplu_islem_tarih_esasli,
 position('NEW.hedef_gonderim_at > (v_simdi AT TIME ZONE' IN
  pg_get_functiondef('public.eclub_gonderim_plan_kapisi()'::regprocedure))>0 AS plan_kapisi_tarih_esasli,
 position('hedef_gonderim_at <= (clock_timestamp() AT TIME ZONE ''Europe/Istanbul'')::date' IN
  pg_get_functiondef('public.eclub_planlanan_gonderimi_isle(text[])'::regprocedure))>0 AS isleyici_tarih_esasli;
