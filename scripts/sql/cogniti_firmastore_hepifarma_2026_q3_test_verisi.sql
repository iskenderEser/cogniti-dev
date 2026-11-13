-- Yalnız test ortamında kullanıcı çalıştırır. Hepifarma / Temmuz–Eylül 2026.
BEGIN;

CREATE TEMP TABLE firmastore_test_plan ON COMMIT DROP AS
WITH firma AS (
  SELECT firma_id FROM public.firmalar
  WHERE firma_id = '0c504d88-b9fb-40bb-beae-5bae33cb99ac' AND firma_adi = 'Hepifarma'
), kisiler AS (
  SELECT k.kullanici_id, row_number() OVER (ORDER BY random(), k.kullanici_id) AS sira
  FROM public.kullanicilar k JOIN firma USING (firma_id)
  WHERE k.aktif_mi AND k.rol IN ('utt', 'bm')
), uygun_cekler AS (
  SELECT u.urun_id, u.ad, u.minimum_siparis_tl AS birim_tl, a.baz_puan,
    ceil(3000 / nullif(u.minimum_siparis_tl, 0)) AS min_adet,
    least(floor(5000 / nullif(u.minimum_siparis_tl, 0)),
      floor(2147483647::numeric / nullif(a.baz_puan, 0))) AS max_adet
  FROM public.store_urun_firma_ayarlari a
  JOIN firma USING (firma_id)
  JOIN public.store_urunler u USING (urun_id)
  WHERE a.aktif_mi AND u.aktif_mi AND a.baz_puan > 0 AND u.minimum_siparis_tl > 0
), cekler AS (
  SELECT *, row_number() OVER (ORDER BY random(), urun_id) AS sira, count(*) OVER () AS toplam
  FROM uygun_cekler WHERE min_adet <= max_adet
)
SELECT md5('firmastore-hepifarma-2026-q3-test:' || k.kullanici_id::text)::uuid AS siparis_id,
  k.kullanici_id, c.urun_id, c.ad, c.birim_tl, c.baz_puan,
  (c.min_adet + floor(random() * (c.max_adet - c.min_adet + 1)))::integer AS adet,
  timestamptz '2026-10-01 09:00:00+03' + floor(random() * 7) * interval '1 day'
    + floor(random() * 540) * interval '1 minute' AS talep_tarihi
FROM kisiler k JOIN cekler c ON c.sira = (k.sira - 1) % c.toplam + 1;

DO $test$
DECLARE
  firma constant uuid := '0c504d88-b9fb-40bb-beae-5bae33cb99ac';
  donem constant timestamptz := '2026-07-01 00:00:00+03';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('firmastore-hepifarma-2026-q3-test', 0));
  IF statement_timestamp() < timestamptz '2026-10-08 12:00:00+03' THEN
    RAISE EXCEPTION 'Temmuz–Eylül 2026 test dönemi henüz onaya açık değil.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.store_siparisler WHERE firma_id = firma AND kaynak_ceyrek_baslangici = donem
  ) OR EXISTS (
    SELECT 1 FROM public.cogniti_firmastore_proforma_onaylari
    WHERE firma_id = firma AND cogniti_firmastore_proforma_onaylari.donem = date '2026-07-01'
  ) THEN
    RAISE EXCEPTION 'Bu dönemde sipariş veya proforma kaydı var. Test verisi eklenmedi.';
  END IF;
  IF (SELECT count(DISTINCT ad) FROM firmastore_test_plan) < 2 THEN
    RAISE EXCEPTION 'Hepifarma için en az iki uygun çek adı ve iki aktif UTT/BM gerekli.';
  END IF;

  -- Teslim edilmiş test kaydı operasyon kuyruğunda yeniden gönderime açılmaz.
  -- Sipariş RPC'si çağrılmaz. Stok, puan hareketi, çek kodu ve e-posta kaydı yazılmaz.
  INSERT INTO public.store_siparisler (
    siparis_id, toplu_talep_anahtari, firma_id, kullanici_id, urun_id, adet,
    puan_birim_fiyat, toplam_puan, cek_birim_tl, toplam_tl,
    durum, kaynak_ceyrek_baslangici, created_at, guncellenme_at, teslim_alma_at
  )
  SELECT siparis_id, siparis_id, firma, kullanici_id, urun_id, adet,
    baz_puan, baz_puan * adet, birim_tl, birim_tl * adet,
    'teslim_edildi', donem, talep_tarihi, talep_tarihi + interval '13 hours',
    talep_tarihi + interval '13 hours'
  FROM firmastore_test_plan;
END $test$;

SELECT count(*) AS test_siparisi, count(DISTINCT kullanici_id) AS kisi,
  count(DISTINCT ad) AS cek_adi, min(birim_tl * adet) AS en_dusuk_tl,
  max(birim_tl * adet) AS en_yuksek_tl, sum(birim_tl * adet) AS toplam_tl
FROM firmastore_test_plan;
COMMIT;
