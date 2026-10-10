-- E-Club: sipariş verilmemiş zorunlu yayın puanı ve 8 Ocak yıl sonu kapanışı.
-- Supabase SQL Editor'da TEK PARÇA çalıştırılır. Canlı DB'de ajan çalıştırmaz.
-- Kullanılmayan bakiye kapatılır; kazanım/talep/teslimat tarihçesi silinmez.
-- Önce eclub_kullanilmayan_puan_tam_devir.sql uygulanmış olmalıdır.
-- pg_cron etkin olmalıdır. Eksik bağımlılık veya tutarsız bakiye işlemi geri alır.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-puan-kapanisi-20261010', 0));
LOCK TABLE public.eclub_kazanilan_puanlar, public.eclub_store_cek_talepleri,
  public.eclub_store_puan_devirleri IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.yayin_yonetimi IN SHARE MODE;
DO $kontrol$
BEGIN
  IF to_regprocedure('public.eclub_store_onceki_deviri_hazirla(uuid,uuid,text)') IS NULL
    OR to_regprocedure('public.get_eclub_eczane_store_ozet(uuid)') IS NULL
    OR to_regprocedure('public.eclub_store_cek_talebi_olustur(uuid,uuid,boolean)') IS NULL
    OR to_regclass('public.eclub_tam_devir_gecis_yedegi') IS NULL THEN
    RAISE EXCEPTION 'Tam devir kurulumu veya gerekli E-Club fonksiyonları eksik.';
  END IF;
  IF to_regprocedure('cron.schedule(text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'pg_cron etkin değil; otomatik puan kapanışı kurulamadı.';
  END IF;
  IF coalesce(current_setting('cron.timezone', true), 'GMT') NOT IN ('GMT','UTC','Etc/UTC') THEN
    RAISE EXCEPTION 'Cron saat dilimi UTC olmalı; Türkiye gece yarısı planı kurulamadı.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.eclub_kazanilan_puanlar
    WHERE cek_karsiligi_var_mi AND created_at IS NULL) THEN
    RAISE EXCEPTION 'Kazanım tarihi eksik çekli puan bulundu; dönem hesabı yapılmadı.';
  END IF;
END;
$kontrol$;
CREATE TABLE IF NOT EXISTS public.eclub_puan_kapanis_gecis_yedegi (
  anahtar text PRIMARY KEY, kayit jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eclub_puan_kapanis_gecis_yedegi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eclub_puan_kapanis_gecis_yedegi FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.eclub_puan_kapanis_gecis_yedegi TO service_role;
INSERT INTO public.eclub_puan_kapanis_gecis_yedegi(anahtar, kayit)
SELECT f, jsonb_build_object('tanim', pg_get_functiondef(f::regprocedure))
FROM unnest(ARRAY['public.eclub_store_onceki_deviri_hazirla(uuid,uuid,text)',
 'public.get_eclub_eczane_store_ozet(uuid)',
 'public.eclub_store_cek_talebi_olustur(uuid,uuid,boolean)']) f
ON CONFLICT (anahtar) DO NOTHING;
INSERT INTO public.eclub_puan_kapanis_gecis_yedegi(anahtar, kayit)
SELECT 'devir:' || d.devir_id, to_jsonb(d) FROM public.eclub_store_puan_devirleri d
ON CONFLICT (anahtar) DO NOTHING;

-- Aynı dönem için kapanış bir kez sayılır; iptal sonrası miktar yeniden hesaplanabilir.
CREATE TABLE IF NOT EXISTS public.eclub_store_puan_silinmeleri (
  eczane_id uuid NOT NULL REFERENCES public.eclub_eczaneler(eczane_id),
  yayin_id uuid NOT NULL REFERENCES public.yayin_yonetimi(yayin_id),
  donem_kodu text NOT NULL CHECK (donem_kodu ~ '^[0-9]{4}-P[1-6]$'),
  satis_sarti_tipi text NOT NULL CHECK (satis_sarti_tipi IN ('satis_sartli','serbest_siparis','siparissiz_cek')),
  silinen_puan bigint NOT NULL DEFAULT 0 CHECK (silinen_puan >= 0),
  neden text CHECK (neden IN ('yil_sonu','siparis_verilmedi')),
  kapanis_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  guncellenme_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (eczane_id, yayin_id, donem_kodu)
);
ALTER TABLE public.eclub_store_puan_silinmeleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eclub_store_puan_silinmeleri FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.eclub_store_puan_silinmeleri TO service_role;

CREATE OR REPLACE FUNCTION public.eclub_store_donem_kosulunu_sabitle(
  p_eczane_id uuid, p_yayin_id uuid, p_donem text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $f$
DECLARE v_tip text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.eclub_store_puan_silinmeleri s
    WHERE s.eczane_id = p_eczane_id AND s.yayin_id = p_yayin_id AND s.donem_kodu = p_donem)
    THEN RETURN; END IF;
  -- Geçmiş talebin kaydettiği koşul önceliklidir. Talep yoksa yayının mevcut koşulu kullanılır.
  SELECT coalesce((SELECT t.siparis_tipi FROM public.eclub_store_cek_talepleri t
    WHERE t.eczane_id = p_eczane_id AND t.yayin_id = p_yayin_id AND t.donem_kodu = p_donem
    ORDER BY (t.durum <> 'iptal') DESC, t.created_at DESC LIMIT 1), y.satis_sarti_tipi)
  INTO v_tip FROM public.yayin_yonetimi y WHERE y.yayin_id = p_yayin_id;
  IF v_tip IS NULL OR v_tip NOT IN ('satis_sartli','serbest_siparis','siparissiz_cek') THEN
    RAISE EXCEPTION 'Yayının sipariş koşulu doğrulanamadı: %', p_yayin_id;
  END IF;
  INSERT INTO public.eclub_store_puan_silinmeleri(eczane_id,yayin_id,donem_kodu,satis_sarti_tipi)
  VALUES (p_eczane_id,p_yayin_id,p_donem,v_tip) ON CONFLICT DO NOTHING;
END;
$f$;

-- Yeni kazanımlarda dönem koşulu sabitlenir; sonraki dönem değişikliğinden etkilenmez.
CREATE OR REPLACE FUNCTION public.eclub_store_kazanim_donem_kosulu()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $f$
DECLARE v_donem text;
BEGIN
  IF NEW.cek_karsiligi_var_mi THEN
    IF NEW.created_at IS NULL THEN RAISE EXCEPTION 'Çekli puanın kazanım tarihi eksik.'; END IF;
    v_donem := extract(year FROM NEW.created_at AT TIME ZONE 'Europe/Istanbul')::int::text
      || '-P' || ((extract(month FROM NEW.created_at AT TIME ZONE 'Europe/Istanbul')::int + 1) / 2)::text;
    PERFORM public.eclub_store_donem_kosulunu_sabitle(NEW.eczane_id,NEW.yayin_id,v_donem);
  END IF;
  RETURN NEW;
END;
$f$;
DROP TRIGGER IF EXISTS tg_eclub_store_kazanim_donem_kosulu ON public.eclub_kazanilan_puanlar;
CREATE TRIGGER tg_eclub_store_kazanim_donem_kosulu AFTER INSERT ON public.eclub_kazanilan_puanlar
FOR EACH ROW EXECUTE FUNCTION public.eclub_store_kazanim_donem_kosulu();
-- Mevcut kazanım/talep/devir kapsamlarının dönem koşullarını başlangıçta sabitle.
DO $kosullar$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT kp.eczane_id,kp.yayin_id,
      extract(year FROM kp.created_at AT TIME ZONE 'Europe/Istanbul')::int::text
      || '-P' || ((extract(month FROM kp.created_at AT TIME ZONE 'Europe/Istanbul')::int + 1) / 2)::text AS donem
    FROM public.eclub_kazanilan_puanlar kp WHERE kp.cek_karsiligi_var_mi
    UNION SELECT t.eczane_id,t.yayin_id,t.donem_kodu FROM public.eclub_store_cek_talepleri t
    UNION SELECT d.eczane_id,d.yayin_id,d.kaynak_donem_kodu FROM public.eclub_store_puan_devirleri d
  LOOP
    PERFORM public.eclub_store_donem_kosulunu_sabitle(r.eczane_id,r.yayin_id,r.donem);
  END LOOP;
END;
$kosullar$;

CREATE OR REPLACE FUNCTION public.eclub_store_devir_ve_silinme_hesapla(
  p_eczane_id uuid, p_yayin_id uuid, p_hedef_donem text, p_an timestamptz
)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
AS $fonksiyon$
DECLARE
  v_hedef_bas timestamptz;
  v_hedef_bit timestamptz;
  v_ilk text;
  v_kaynak text;
  v_sonraki text;
  v_bas timestamptz;
  v_bit timestamptz;
  v_kazanc bigint;
  v_gelen bigint;
  v_kullanilan bigint;
  v_kalan bigint;
  v_talep uuid;
  v_tip text;
  v_siparis boolean;
  v_silinen bigint;
  v_neden text;
  v_toplam_silinen bigint;
BEGIN
  -- Dönem kodu ve takvim ortak fonksiyondan doğrulanır.
  SELECT baslangic, bitis_haric INTO v_hedef_bas, v_hedef_bit
  FROM public.eclub_store_donem_sinirlari(p_hedef_donem);
  IF v_hedef_bas IS NULL OR p_eczane_id IS NULL OR p_yayin_id IS NULL THEN
    RAISE EXCEPTION 'Geçersiz devir kapsamı';
  END IF;
  -- Aynı eczane/yayın için hesaplama zinciri tek işlemde yürür.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    'eclub-tam-devir:' || p_eczane_id || ':' || p_yayin_id, 0));

  SELECT min(donem) INTO v_ilk FROM (
    SELECT extract(year FROM kp.created_at AT TIME ZONE 'Europe/Istanbul')::integer::text
      || '-P' || ((extract(month FROM kp.created_at AT TIME ZONE 'Europe/Istanbul')::integer + 1) / 2)::text AS donem
    FROM public.eclub_kazanilan_puanlar kp
    WHERE kp.eczane_id = p_eczane_id AND kp.yayin_id = p_yayin_id
      AND kp.cek_karsiligi_var_mi = true AND kp.created_at < v_hedef_bit
    UNION ALL
    SELECT d.kaynak_donem_kodu FROM public.eclub_store_puan_devirleri d
    WHERE d.eczane_id = p_eczane_id AND d.yayin_id = p_yayin_id
    UNION ALL
    SELECT t.donem_kodu FROM public.eclub_store_cek_talepleri t
    WHERE t.eczane_id = p_eczane_id AND t.yayin_id = p_yayin_id
  ) kaynaklar;
  IF v_ilk IS NULL OR v_ilk > p_hedef_donem THEN RETURN; END IF;
  v_kaynak := v_ilk;

  WHILE v_kaynak <= p_hedef_donem LOOP
    SELECT baslangic, bitis_haric, sonraki_donem_kodu
    INTO v_bas, v_bit, v_sonraki
    FROM public.eclub_store_donem_sinirlari(v_kaynak);
    -- Önceki dönemin talep hakkı 7. günün sonuna kadar korunur.
    IF p_an < v_bit + interval '7 days' THEN
      IF v_kaynak = p_hedef_donem THEN EXIT; END IF;
      RAISE EXCEPTION 'Kaynak dönem talep süresi henüz kapanmadı: %', v_kaynak;
    END IF;
    PERFORM public.eclub_store_donem_kosulunu_sabitle(p_eczane_id, p_yayin_id, v_kaynak);
    SELECT s.satis_sarti_tipi INTO STRICT v_tip
    FROM public.eclub_store_puan_silinmeleri s
    WHERE s.eczane_id = p_eczane_id AND s.yayin_id = p_yayin_id
      AND s.donem_kodu = v_kaynak;
    SELECT EXISTS (
      SELECT 1 FROM public.eclub_store_cek_talepleri t
      WHERE t.eczane_id = p_eczane_id AND t.yayin_id = p_yayin_id
        AND t.donem_kodu = v_kaynak AND t.durum <> 'iptal'
        AND t.siparis_verildi_mi = true
    ) INTO v_siparis;
    v_neden := CASE
      WHEN right(v_kaynak, 2) = 'P6' THEN 'yil_sonu'
      WHEN v_tip = 'satis_sartli' AND NOT v_siparis THEN 'siparis_verilmedi'
      ELSE NULL END;
    -- Mevcut gösterim dönemi ancak süresi dolan bakiye varsa kapatılır.
    -- Diğer dönemlerin devri, takip eden dönemin hesabında hazırlanır.
    IF v_kaynak = p_hedef_donem AND v_neden IS NULL THEN EXIT; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(
      'eclub-devir:' || p_eczane_id || ':' || p_yayin_id || ':' || v_kaynak, 0));

    SELECT coalesce(sum(kp.puan), 0) INTO v_kazanc
    FROM public.eclub_kazanilan_puanlar kp
    WHERE kp.eczane_id = p_eczane_id AND kp.yayin_id = p_yayin_id
      AND kp.cek_karsiligi_var_mi = true
      AND kp.created_at >= v_bas AND kp.created_at < v_bit;
    -- Tarihsel hesabın girdisi kullanılmış devirleri de içerir;
    -- kullanılan tutar aşağıdaki talep kaydından yalnız bir kez düşülür.
    SELECT coalesce(sum(d.puan), 0) INTO v_gelen
    FROM public.eclub_store_puan_devirleri d
    WHERE d.eczane_id = p_eczane_id AND d.yayin_id = p_yayin_id
      AND d.hedef_donem_kodu = v_kaynak AND d.iptal_edildi = false;
    SELECT coalesce(sum(t.toplanan_puan), 0) INTO v_kullanilan
    FROM public.eclub_store_cek_talepleri t
    WHERE t.eczane_id = p_eczane_id AND t.yayin_id = p_yayin_id
      AND t.donem_kodu = v_kaynak AND t.durum <> 'iptal';
    SELECT t.talep_id INTO v_talep
    FROM public.eclub_store_cek_talepleri t
    WHERE t.eczane_id = p_eczane_id AND t.yayin_id = p_yayin_id
      AND t.donem_kodu = v_kaynak AND t.durum <> 'iptal';
    -- Kaynağı doğrulanamayan eski bakiyeyi sessizce kapatma.
    -- Önceki dönem silinmesiyle sıfırlanan zincir ise geçerli bir kapanıştır.
    IF v_kazanc + v_gelen = 0 AND EXISTS (
      SELECT 1 FROM public.eclub_store_puan_devirleri d
      WHERE d.eczane_id=p_eczane_id AND d.yayin_id=p_yayin_id
        AND d.kaynak_donem_kodu=v_kaynak AND NOT d.iptal_edildi
    ) AND NOT EXISTS (
      SELECT 1 FROM public.eclub_store_puan_silinmeleri s
      WHERE s.eczane_id=p_eczane_id AND s.yayin_id=p_yayin_id
        AND s.donem_kodu<v_kaynak AND s.silinen_puan>0
    ) THEN
      RAISE EXCEPTION 'Eski devrin kazanım kaynağı doğrulanamadı: eczane %, yayın %, dönem %',
        p_eczane_id,p_yayin_id,v_kaynak;
    END IF;
    v_kalan := v_kazanc + v_gelen - v_kullanilan;
    IF v_kalan < 0 OR v_kalan > 2147483647 THEN
      RAISE EXCEPTION 'Devir hesabı tutarsız: eczane %, yayın %, dönem %, kazanç %, gelen %, kullanılan %',
        p_eczane_id, p_yayin_id, v_kaynak, v_kazanc, v_gelen, v_kullanilan;
    END IF;

    v_silinen := CASE WHEN v_neden IS NOT NULL THEN v_kalan ELSE 0 END;
    UPDATE public.eclub_store_puan_silinmeleri s
    SET silinen_puan = v_silinen, neden = v_neden,
      kapanis_at = v_bit + interval '7 days', guncellenme_at = now()
    WHERE s.eczane_id = p_eczane_id AND s.yayin_id = p_yayin_id
      AND s.donem_kodu = v_kaynak;
    v_kalan := v_kalan - v_silinen;

    IF v_kalan > 0 THEN
      INSERT INTO public.eclub_store_puan_devirleri (
        eczane_id, yayin_id, kaynak_donem_kodu, hedef_donem_kodu, puan, kaynak_talep_id
      ) VALUES (p_eczane_id, p_yayin_id, v_kaynak, v_sonraki, v_kalan::integer, v_talep)
      ON CONFLICT (eczane_id, yayin_id, kaynak_donem_kodu) WHERE iptal_edildi = false
      DO UPDATE SET puan = EXCLUDED.puan,
        hedef_donem_kodu = EXCLUDED.hedef_donem_kodu,
        kaynak_talep_id = EXCLUDED.kaynak_talep_id,
        guncellenme_at = now()
      WHERE eclub_store_puan_devirleri.puan IS DISTINCT FROM EXCLUDED.puan
        OR eclub_store_puan_devirleri.hedef_donem_kodu IS DISTINCT FROM EXCLUDED.hedef_donem_kodu
        OR eclub_store_puan_devirleri.kaynak_talep_id IS DISTINCT FROM EXCLUDED.kaynak_talep_id;
    ELSE
      -- Eski artık kaydı artık geçerli değilse tarihçe korunarak pasifleştirilir.
      UPDATE public.eclub_store_puan_devirleri
      SET iptal_edildi = true, guncellenme_at = now()
      WHERE eczane_id = p_eczane_id AND yayin_id = p_yayin_id
        AND kaynak_donem_kodu = v_kaynak AND iptal_edildi = false;
    END IF;
    -- Girdi devir bir sonraki döneme taşındı veya talebe ayrıldı.
    UPDATE public.eclub_store_puan_devirleri
    SET kullanildi_mi = true, kullanilan_talep_id = v_talep, guncellenme_at = now()
    WHERE eczane_id = p_eczane_id AND yayin_id = p_yayin_id
      AND hedef_donem_kodu = v_kaynak AND iptal_edildi = false
      AND (kullanildi_mi = false OR kullanilan_talep_id IS DISTINCT FROM v_talep);
    v_kaynak := v_sonraki;
  END LOOP;

  -- Bağımsız toplam kontrolü: geçmiş kazanım - kullanılan puan = hedefe gelen bakiye.
  -- Kullanılmış hedef devirleri de sayılır; hedef dönemin talebi burada düşülmez.
  SELECT coalesce(sum(kp.puan), 0) INTO v_kazanc
  FROM public.eclub_kazanilan_puanlar kp
  WHERE kp.eczane_id = p_eczane_id AND kp.yayin_id = p_yayin_id
    AND kp.cek_karsiligi_var_mi = true AND kp.created_at < v_hedef_bas;
  SELECT coalesce(sum(t.toplanan_puan), 0) INTO v_kullanilan
  FROM public.eclub_store_cek_talepleri t
  WHERE t.eczane_id = p_eczane_id AND t.yayin_id = p_yayin_id
    AND t.donem_kodu < p_hedef_donem AND t.durum <> 'iptal';
  SELECT coalesce(sum(d.puan), 0) INTO v_gelen
  FROM public.eclub_store_puan_devirleri d
  WHERE d.eczane_id = p_eczane_id AND d.yayin_id = p_yayin_id
    AND d.hedef_donem_kodu = p_hedef_donem AND d.iptal_edildi = false;
  SELECT coalesce(sum(s.silinen_puan), 0) INTO v_toplam_silinen
  FROM public.eclub_store_puan_silinmeleri s
  WHERE s.eczane_id = p_eczane_id AND s.yayin_id = p_yayin_id
    AND s.donem_kodu < p_hedef_donem;
  IF v_kazanc - v_kullanilan - v_toplam_silinen <> v_gelen THEN
    RAISE EXCEPTION 'Toplam puan mutabakatı başarısız: eczane %, yayın %, beklenen %, bulunan %',
      p_eczane_id, p_yayin_id, v_kazanc - v_kullanilan - v_toplam_silinen, v_gelen;
  END IF;
END;
$fonksiyon$;

CREATE OR REPLACE FUNCTION public.eclub_store_silinen_donem_puani(
  p_eczane_id uuid, p_yayin_id uuid, p_donem text
) RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $f$
  SELECT coalesce((SELECT s.silinen_puan FROM public.eclub_store_puan_silinmeleri s
    WHERE s.eczane_id=p_eczane_id AND s.yayin_id=p_yayin_id AND s.donem_kodu=p_donem),0);
$f$;

CREATE OR REPLACE FUNCTION public.eclub_store_onceki_deviri_hazirla(
  p_eczane_id uuid, p_yayin_id uuid, p_hedef_donem text
) RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp
AS $f$
BEGIN
  PERFORM public.eclub_store_devir_ve_silinme_hesapla(p_eczane_id,p_yayin_id,p_hedef_donem,now());
END;
$f$;

-- Mevcut okuma imzası ve kolonları korunur. Silinen bakiye tüm tutar hesaplarından düşülür.
DO $okuma$
DECLARE v_tanim text; v_yeni text; v_eski constant text :=
  'coalesce\(z[.]puan,[[:space:]]*0\)[[:space:]]*[+][[:space:]]*coalesce\(g[.]puan,[[:space:]]*0\)';
BEGIN
  SELECT pg_get_functiondef('public.get_eclub_eczane_store_ozet(uuid)'::regprocedure) INTO v_tanim;
  IF strpos(v_tanim, 'eclub_store_silinen_donem_puani') = 0 THEN
    IF v_tanim !~ v_eski THEN RAISE EXCEPTION 'Okuma fonksiyonunun bakiye hesabı beklenen yapıda değil.'; END IF;
    v_yeni := regexp_replace(v_tanim, v_eski,
      'greatest(coalesce(z.puan, 0) + coalesce(g.puan, 0) - public.eclub_store_silinen_donem_puani(v_eczane, y.yayin_id, v_d.donem_kodu), 0)', 'g');
    EXECUTE v_yeni;
  END IF;
END;
$okuma$;

-- Alt limit hatası sipariş zorunlu yayına koşulsuz devir sözü vermez.
DO $talep_mesaji$
DECLARE v_tanim text; v_yeni text;
BEGIN
  SELECT pg_get_functiondef('public.eclub_store_cek_talebi_olustur(uuid,uuid,boolean)'::regprocedure)
    INTO v_tanim;
  v_yeni := replace(v_tanim, ' puan gereklidir; bakiye sonraki döneme devreder.',
    ' puan gereklidir. Kullanılmayan puanlara yayının sipariş ve yıl sonu kuralları uygulanır.');
  IF v_yeni <> v_tanim THEN EXECUTE v_yeni; END IF;
END;
$talep_mesaji$;

CREATE OR REPLACE FUNCTION public.eclub_store_puan_kapanislarini_isle()
RETURNS integer LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp
AS $f$
DECLARE r record; v_hedef text; v_sayi integer := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('eclub-puan-kapanis-tarama', 0));
  SELECT donem_kodu INTO v_hedef FROM public.eclub_store_aktif_donem();
  FOR r IN
    SELECT kp.eczane_id, kp.yayin_id FROM public.eclub_kazanilan_puanlar kp WHERE kp.cek_karsiligi_var_mi
    UNION SELECT d.eczane_id,d.yayin_id FROM public.eclub_store_puan_devirleri d
    UNION SELECT t.eczane_id,t.yayin_id FROM public.eclub_store_cek_talepleri t
  LOOP
    PERFORM public.eclub_store_onceki_deviri_hazirla(r.eczane_id,r.yayin_id,v_hedef);
    v_sayi := v_sayi + 1;
  END LOOP;
  RETURN v_sayi;
END;
$f$;

DO $yetkiler$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'eclub_store_donem_kosulunu_sabitle(uuid,uuid,text)',
    'eclub_store_kazanim_donem_kosulu()',
    'eclub_store_devir_ve_silinme_hesapla(uuid,uuid,text,timestamp with time zone)',
    'eclub_store_onceki_deviri_hazirla(uuid,uuid,text)',
    'eclub_store_silinen_donem_puani(uuid,uuid,text)',
    'eclub_store_puan_kapanislarini_isle()'
  ] LOOP
    EXECUTE 'REVOKE ALL ON FUNCTION public.' || f || ' FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.' || f || ' TO service_role';
  END LOOP;
END;
$yetkiler$;
-- UTC 21:00 = Türkiye 00:00. Her gün çalışır; 8 Ocak ve iki aylık kapanışları kapsar.
SELECT cron.schedule('eclub-puan-kapanisi', '0 21 * * *', 'SELECT public.eclub_store_puan_kapanislarini_isle();');
SELECT public.eclub_store_puan_kapanislarini_isle() AS islenen_eczane_yayin;
SELECT 'TAMAMLANDI' AS sql_sonucu,
  count(*) FILTER (WHERE silinen_puan > 0) AS silinen_bakiye_kaydi,
  coalesce(sum(silinen_puan) FILTER (WHERE neden = 'siparis_verilmedi'),0) AS siparissiz_zorunlu_yayin_silinen_puan,
  coalesce(sum(silinen_puan) FILTER (WHERE neden = 'yil_sonu'),0) AS yil_sonu_silinen_puan,
  coalesce(sum(silinen_puan),0) AS silinen_toplam_puan
FROM public.eclub_store_puan_silinmeleri;
COMMIT;
