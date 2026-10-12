-- E-Club > Firmalar > Hediye Çeki Takibi için 11 salt okunur görünüm örneği.
-- Hedef: Adil Güçlü / Test Eczanesi 003 / Hepifarma / Abilon.
-- Supabase SQL Editor'da tamamını TEK PARÇA çalıştırın.
-- Gerçek talep, sipariş, puan, onay, çek teslimatı, e-posta veya push oluşturmaz.
-- Bu kayıtlar yalnız eclub_cek_takip_ux_testleri tablosunda tutulur.
-- Temizlik: eclub_cek_takip_11_ux_senaryosu_temizle.sql (şimdi çalıştırılmaz).

BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-cek-takip-11-ux-v1', 0));

CREATE TABLE IF NOT EXISTS public.eclub_cek_takip_ux_testleri (
  senaryo_id uuid PRIMARY KEY,
  kisi_id uuid NOT NULL REFERENCES public.eclub_kisiler(kisi_id),
  eczane_id uuid NOT NULL REFERENCES public.eclub_eczaneler(eczane_id),
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
  urun_id uuid NOT NULL REFERENCES public.urunler(urun_id),
  kaynak_yayin_id uuid NOT NULL REFERENCES public.yayin_yonetimi(yayin_id),
  sira integer NOT NULL CHECK (sira BETWEEN 1 AND 11),
  etiket text NOT NULL,
  veri jsonb NOT NULL CHECK (jsonb_typeof(veri) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kisi_id, eczane_id, urun_id, sira),
  CHECK (senaryo_id = ('e1500000-0000-4000-8000-' || lpad(sira::text, 12, '0'))::uuid)
);
ALTER TABLE public.eclub_cek_takip_ux_testleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eclub_cek_takip_ux_testleri FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eclub_cek_takip_ux_testleri TO service_role;
LOCK TABLE public.eclub_cek_takip_ux_testleri IN SHARE ROW EXCLUSIVE MODE;
NOTIFY pgrst, 'reload schema';

DO $kurulum$
DECLARE
  v_kisi constant uuid := '3b0b6c01-428e-4797-a8ad-67d5d2400b5f';
  v_eczane constant uuid := '0d8385df-4eed-429e-b691-81acee1ad606';
  v_urun constant uuid := '90c0ca99-8d17-40d9-97d7-5b209bd730b0';
  v_yayin constant uuid := 'f364c684-eadc-4ccc-8671-f333da7b555f';
  v_firma uuid;
  v_firma_adi text;
  v_urun_adi text;
  v_simdi timestamptz := now();
  v_id uuid;
  v_veri jsonb;
  r record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.eclub_kisi_eczane ke
    JOIN public.eclub_kisiler k ON k.kisi_id = ke.kisi_id
    JOIN public.eclub_eczaneler e ON e.eczane_id = ke.eczane_id
    JOIN public.eclub_eczane_master em ON em.gln = e.gln
    WHERE ke.kisi_id = v_kisi AND ke.eczane_id = v_eczane AND ke.aktif_mi
      AND lower(k.rol) = 'eczaci' AND k.auth_user_id IS NOT NULL
      AND em.kaynak = 'test' AND e.gln = '1110000000003'
  ) THEN
    RAISE EXCEPTION 'Hedef test eczanesi/eczacı bağı doğrulanamadı.';
  END IF;

  SELECT ky.firma_id, f.firma_adi, u.urun_adi
    INTO v_firma, v_firma_adi, v_urun_adi
  FROM public.yayin_yonetimi y
  JOIN public.v_yayin_kunye ky ON ky.yayin_id = y.yayin_id
  JOIN public.urunler u ON u.urun_id = ky.urun_id
  JOIN public.firmalar f ON f.firma_id = ky.firma_id
  JOIN public.eclub_eczane_firma ef
    ON ef.firma_id = f.firma_id AND ef.eczane_id = v_eczane AND ef.aktif_mi
  WHERE y.yayin_id = v_yayin AND ky.urun_id = v_urun
    AND f.aktif AND f.eclub_aktif AND f.eclub_store_aktif;
  IF v_firma IS NULL OR lower(v_urun_adi) IS DISTINCT FROM 'abilon'
    OR nullif(btrim(v_firma_adi), '') IS NULL THEN
    RAISE EXCEPTION 'Abilon kaynak yayını/firma/eczane kapsamı doğrulanamadı.';
  END IF;

  -- 7 durumun tamamı; siparişsiz, tercihli (iki seçim) ve zorunlu sipariş.
  -- Puan/çek tutarları karşılaştırma için 2 puan = 1 TL, tercihli siparişte +%%10.
  FOR r IN
    SELECT * FROM (VALUES
      ( 1, 'UTT bekliyor · siparişsiz',             'siparissiz_cek', 'beklemede',                400, 200.00::numeric, false,  0,  0, NULL::text),
      ( 2, 'UTT bekliyor · tercihli/siparişsiz',   'serbest_siparis','beklemede',                625, 312.50::numeric, false,  0,  0, NULL::text),
      ( 3, 'UTT bekliyor · tercihli/siparişli',    'serbest_siparis','beklemede',                625, 343.75::numeric, true,  20,  3, NULL::text),
      ( 4, 'UTT bekliyor · zorunlu sipariş',       'satis_sartli',   'beklemede',                925, 462.50::numeric, true,  45, 10, NULL::text),
      ( 5, 'BM onayında · tercihli/siparişli',     'serbest_siparis','bm_onayinda',             400, 220.00::numeric, true,  10,  1, NULL::text),
      ( 6, 'TM onayında · zorunlu sipariş',        'satis_sartli',   'tm_onayinda',             625, 312.50::numeric, true,  20,  3, NULL::text),
      ( 7, 'Onaylandı · çek kodu bekliyor',        'siparissiz_cek', 'onaylandi',               925, 462.50::numeric, false,  0,  0, NULL::text),
      ( 8, 'Teslimat kuyruğunda · siparişli',      'serbest_siparis','teslimat_bekliyor',      925, 508.75::numeric, true,  45, 10, 'UX-CEK-KUYRUK-08'),
      ( 9, 'Çek kodu gönderildi · siparişsiz',     'siparissiz_cek', 'cek_kodlari_gonderildi',  400, 200.00::numeric, false,  0,  0, 'UX-CEK-TESLIM-09'),
      (10, 'Çek kodu gönderildi · siparişli',      'serbest_siparis','cek_kodlari_gonderildi',  625, 343.75::numeric, true,  20,  3, 'UX-CEK-TESLIM-10'),
      (11, 'İptal edildi · tercihli/siparişsiz',   'serbest_siparis','iptal',                   625, 312.50::numeric, false,  0,  0, NULL::text)
    ) AS x(sira, etiket, model, durum, puan, tutar, siparis_verildi, adet, mf, kod)
    ORDER BY x.sira
  LOOP
    v_id := ('e1500000-0000-4000-8000-' || lpad(r.sira::text, 12, '0'))::uuid;
    IF EXISTS (SELECT 1 FROM public.eclub_store_cek_talepleri t WHERE t.talep_id = v_id)
      OR EXISTS (
        SELECT 1 FROM public.eclub_cek_takip_ux_testleri t
        WHERE t.senaryo_id = v_id
          AND (t.kisi_id IS DISTINCT FROM v_kisi OR t.eczane_id IS DISTINCT FROM v_eczane
            OR t.firma_id IS DISTINCT FROM v_firma OR t.urun_id IS DISTINCT FROM v_urun
            OR t.kaynak_yayin_id IS DISTINCT FROM v_yayin OR t.sira IS DISTINCT FROM r.sira)
      ) THEN
      RAISE EXCEPTION 'UX test kimliği farklı kapsamla çakışıyor: %', v_id;
    END IF;

    v_veri := jsonb_build_object(
      'firma_adi', v_firma_adi, 'urun_adi', v_urun_adi, 'yayin_id', v_yayin,
      'toplanan_puan', r.puan, 'talep_edilen_cek_tl', r.tutar,
      'siparis_tipi', r.model, 'siparis_verildi_mi', r.siparis_verildi,
      'siparis_adet', r.adet, 'siparis_mal_fazlasi', r.mf,
      'durum', r.durum, 'cek_kodu', r.kod,
      'created_at', v_simdi - (12-r.sira) * interval '1 day',
      'donem_kodu', '2026-P4', 'senaryo_etiketi', r.etiket
    );
    INSERT INTO public.eclub_cek_takip_ux_testleri
      (senaryo_id, kisi_id, eczane_id, firma_id, urun_id, kaynak_yayin_id, sira, etiket, veri)
    VALUES (v_id, v_kisi, v_eczane, v_firma, v_urun, v_yayin, r.sira, r.etiket, v_veri)
    ON CONFLICT (senaryo_id) DO UPDATE
      SET etiket = EXCLUDED.etiket, veri = EXCLUDED.veri;
  END LOOP;

  IF (SELECT count(*) FROM public.eclub_cek_takip_ux_testleri t
      WHERE t.kisi_id = v_kisi AND t.eczane_id = v_eczane AND t.urun_id = v_urun) <> 11 THEN
    RAISE EXCEPTION 'Tek üründe tam 11 Çek Takibi örneği oluşturulamadı; işlem geri alındı.';
  END IF;
END;
$kurulum$;

SELECT 'TAMAMLANDI' AS sql_sonucu, t.sira, t.etiket,
  t.veri->>'urun_adi' AS urun_adi,
  t.veri->>'siparis_tipi' AS talep_modeli,
  t.veri->>'durum' AS durum,
  (t.veri->>'siparis_verildi_mi')::boolean AS siparis_verildi_mi,
  (t.veri->>'toplanan_puan')::integer AS puan,
  (t.veri->>'talep_edilen_cek_tl')::numeric(10,2) AS cek_tutari_tl,
  t.veri->>'cek_kodu' AS cek_kodu
FROM public.eclub_cek_takip_ux_testleri t
WHERE t.kisi_id = '3b0b6c01-428e-4797-a8ad-67d5d2400b5f'::uuid
  AND t.eczane_id = '0d8385df-4eed-429e-b691-81acee1ad606'::uuid
  AND t.urun_id = '90c0ca99-8d17-40d9-97d7-5b209bd730b0'::uuid
ORDER BY t.sira;
COMMIT;
