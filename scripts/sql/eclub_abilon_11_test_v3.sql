-- SON SET / V3: Kullanıcının belirlediği 11 varyasyon. Eski SQL yerine bunu çalıştırın.
-- Çek Talebi UX görünüm seti: yalnız Adil Güçlü / Test Eczanesi 003 / Abilon.
-- Tamamını tek parça çalıştırın. Gerçek yayın, puan, izleme veya talep oluşturmaz.
-- 3 model x 3 puan baremi = 9; 299p ve 1200p sınır örnekleri = 2; toplam 11.
-- Test koşulları: 2p=1 TL; siparişle artış %10; satış şartları 10+1 / 20+3 / 45+10.
-- Ekran bu tabloyu yalnız hedef kişinin yetkili eczane/firma kapsamında okur.
-- Bütün örnekler salt okunurdur; talep/teslimat ve dönem kuralları değiştirilmez.
-- Temizlik: eclub_tek_urun_11_ux_senaryosu_temizle.sql
BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtextextended('eclub-tek-urun-11-ux-v1', 0));

CREATE TABLE IF NOT EXISTS public.eclub_cek_karti_ux_testleri (
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
  CHECK (senaryo_id = ('e1400000-0000-4000-8000-' || lpad(sira::text,12,'0'))::uuid)
);
ALTER TABLE public.eclub_cek_karti_ux_testleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eclub_cek_karti_ux_testleri FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eclub_cek_karti_ux_testleri TO service_role;
LOCK TABLE public.eclub_cek_karti_ux_testleri IN SHARE ROW EXCLUSIVE MODE;

DO $kurulum$
DECLARE
  v_kisi constant uuid := '3b0b6c01-428e-4797-a8ad-67d5d2400b5f';
  v_eczane constant uuid := '0d8385df-4eed-429e-b691-81acee1ad606';
  v_urun constant uuid := '90c0ca99-8d17-40d9-97d7-5b209bd730b0';
  v_yayin constant uuid := 'f364c684-eadc-4ccc-8671-f333da7b555f';
  v_firma uuid; v_temel jsonb;
  v_baremler jsonb; v_senaryo jsonb; v_id uuid; r record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.eclub_kisi_eczane ke
    JOIN public.eclub_kisiler k ON k.kisi_id=ke.kisi_id
    JOIN public.eclub_eczaneler e ON e.eczane_id=ke.eczane_id
    JOIN public.eclub_eczane_master em ON em.gln=e.gln
    WHERE ke.kisi_id=v_kisi AND ke.eczane_id=v_eczane AND ke.aktif_mi
      AND lower(k.rol)='eczaci' AND k.auth_user_id IS NOT NULL
      AND em.kaynak='test' AND e.gln='1110000000003'
  ) THEN RAISE EXCEPTION 'Hedef test eczanesi/eczacı bağı doğrulanamadı.'; END IF;

  SELECT ky.firma_id,
    jsonb_build_object(
      'urun_id', u.urun_id, 'urun_adi', u.urun_adi,
      'firma_id', f.firma_id, 'firma_adi', f.firma_adi,
      'eczane_id', e.eczane_id, 'eczane_adi', em.eczane_adi,
      'talep_no', ky.talep_no,
      'karsilik_puan', 2, 'karsilik_tl', 1,
      'donem_kodu', d.donem_kodu,
      'talep_durumu', NULL, 'cek_kodu', NULL
    ) INTO v_firma, v_temel
  FROM public.yayin_yonetimi y
  JOIN public.v_yayin_kunye ky ON ky.yayin_id=y.yayin_id
  JOIN public.urunler u ON u.urun_id=ky.urun_id
  JOIN public.firmalar f ON f.firma_id=ky.firma_id
  JOIN public.eclub_eczane_firma ef ON ef.firma_id=f.firma_id
  JOIN public.eclub_eczaneler e ON e.eczane_id=ef.eczane_id
  JOIN public.eclub_eczane_master em ON em.gln=e.gln
  CROSS JOIN public.eclub_store_aktif_donem() d
  WHERE y.yayin_id=v_yayin AND ky.urun_id=v_urun AND ef.eczane_id=v_eczane
    AND ef.aktif_mi AND f.aktif AND f.eclub_aktif AND f.eclub_store_aktif
    AND y.durum='yayinda' AND y.cek_karsiligi_var_mi;
  IF v_temel IS NULL THEN RAISE EXCEPTION 'Abilon kaynak yayını/çek koşulları doğrulanamadı.'; END IF;
  -- Test koşulları açıkça tanımlıdır; gerçek yayının barem ve tarifesi değiştirilmez.
  FOR r IN
    SELECT * FROM (VALUES
      (1, 'siparissiz_cek', 'Siparişsiz çek · 300p-500p', 400),
      (2, 'siparissiz_cek', 'Siparişsiz çek · 501p-750p', 625),
      (3, 'siparissiz_cek', 'Siparişsiz çek · 751p-1100p', 925),
      (4, 'serbest_siparis', 'Siparişle artan çek · 300p-500p', 400),
      (5, 'serbest_siparis', 'Siparişle artan çek · 501p-750p', 625),
      (6, 'serbest_siparis', 'Siparişle artan çek · 751p-1100p', 925),
      (7, 'satis_sartli', 'Sipariş zorunlu çek · 300p-500p', 400),
      (8, 'satis_sartli', 'Sipariş zorunlu çek · 501p-750p', 625),
      (9, 'satis_sartli', 'Sipariş zorunlu çek · 751p-1100p', 925),
      (10, 'siparissiz_cek', 'Siparişsiz çek · 300p altında', 299),
      (11, 'serbest_siparis', 'Siparişle artan çek · 1100p üzerinde', 1200)
    ) AS senaryolar(sira,model,etiket,puan)
    ORDER BY sira
  LOOP
    v_id := ('e1400000-0000-4000-8000-' || lpad(r.sira::text,12,'0'))::uuid;
    v_baremler := CASE WHEN r.model='siparissiz_cek' THEN
      '[{"min_puan":300,"max_puan":500,"adet":0,"mal_fazlasi":0},
        {"min_puan":501,"max_puan":750,"adet":0,"mal_fazlasi":0},
        {"min_puan":751,"max_puan":1100,"adet":0,"mal_fazlasi":0}]'::jsonb
    ELSE
      '[{"min_puan":300,"max_puan":500,"adet":10,"mal_fazlasi":1},
        {"min_puan":501,"max_puan":750,"adet":20,"mal_fazlasi":3},
        {"min_puan":751,"max_puan":1100,"adet":45,"mal_fazlasi":10}]'::jsonb
    END;
    v_senaryo := v_temel || jsonb_build_object(
      'yayin_id',v_id,'satis_sarti_tipi',r.model,'toplanan_puan',r.puan,
      'barem_tablosu',v_baremler,
      'gizli_sart_katlama_orani',CASE WHEN r.model='serbest_siparis' THEN 10 ELSE 0 END
    );
    IF EXISTS (
      SELECT 1 FROM public.yayin_yonetimi WHERE yayin_id=v_id
    ) OR EXISTS (
      SELECT 1 FROM public.eclub_cek_karti_ux_testleri t WHERE t.senaryo_id=v_id
        AND (t.kisi_id IS DISTINCT FROM v_kisi OR t.eczane_id IS DISTINCT FROM v_eczane
          OR t.firma_id IS DISTINCT FROM v_firma OR t.urun_id IS DISTINCT FROM v_urun
          OR t.kaynak_yayin_id IS DISTINCT FROM v_yayin)
    ) THEN RAISE EXCEPTION 'UX test kimliği farklı kapsamla çakışıyor: %',v_id; END IF;
    INSERT INTO public.eclub_cek_karti_ux_testleri
      (senaryo_id,kisi_id,eczane_id,firma_id,urun_id,kaynak_yayin_id,sira,etiket,veri)
    VALUES (v_id,v_kisi,v_eczane,v_firma,v_urun,v_yayin,r.sira,r.etiket,v_senaryo)
    ON CONFLICT(senaryo_id) DO UPDATE SET etiket=EXCLUDED.etiket,veri=EXCLUDED.veri;
  END LOOP;
  IF (SELECT count(*) FROM public.eclub_cek_karti_ux_testleri
      WHERE kisi_id=v_kisi AND eczane_id=v_eczane AND urun_id=v_urun)<>11 THEN
    RAISE EXCEPTION 'Tek üründe tam 11 senaryo oluşturulamadı; işlem geri alındı.';
  END IF;
END;
$kurulum$;

SELECT 'TAMAMLANDI' AS sql_sonucu,sira,etiket,veri->>'urun_adi' AS urun_adi,
  veri->>'satis_sarti_tipi' AS talep_modeli,
  (veri->>'toplanan_puan')::integer AS havuz_puani,
  (veri->>'karsilik_puan')::integer AS karsilik_puan,
  (veri->>'karsilik_tl')::numeric AS karsilik_tl,
  CASE WHEN veri->>'satis_sarti_tipi'='serbest_siparis' THEN 10 ELSE NULL END AS artis_yuzdesi,
  CASE WHEN (veri->>'toplanan_puan')::integer<300 THEN 0
       ELSE round(least((veri->>'toplanan_puan')::integer,1100)/2.0,2) END AS baz_cek_tl,
  CASE WHEN veri->>'satis_sarti_tipi'='serbest_siparis'
       THEN round(least((veri->>'toplanan_puan')::integer,1100)/2.0*1.10,2)
       ELSE NULL END AS siparisle_artirilmis_cek_tl,
  greatest((veri->>'toplanan_puan')::integer-1100,0) AS tavan_ustu_kalan_puan,
  veri->'barem_tablosu' AS baremler
FROM public.eclub_cek_karti_ux_testleri
WHERE kisi_id='3b0b6c01-428e-4797-a8ad-67d5d2400b5f'::uuid
  AND eczane_id='0d8385df-4eed-429e-b691-81acee1ad606'::uuid
  AND urun_id='90c0ca99-8d17-40d9-97d7-5b209bd730b0'::uuid
ORDER BY sira;
COMMIT;
