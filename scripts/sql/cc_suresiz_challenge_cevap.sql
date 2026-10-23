-- Bulgu 2 — C-Club süresiz challenge cevap/referral düzeltmesi.
-- Yalnız public.cc_cevaplari_kaydet(uuid, uuid, jsonb) güncellenir.
-- Kaynak: soru_kesinti_faz5_cevap.sql. Eski son_tarih reddi kaldırılmıştır.
-- Sahiplik, tamamlama, ileri sarma, soru erişimi, cevap tekilliği,
-- soru puanları, kayıplar ve referral kontrolleri korunur.
-- E-Club/Eczanem fonksiyonları ve geçmiş veriler değiştirilmez.
-- Kullanıcı SQL Editor'da dosyanın tamamını çalıştırır; tekrar çalıştırılabilir.

BEGIN;

CREATE OR REPLACE FUNCTION public.cc_cevaplari_kaydet(p_izleme_id uuid, p_bm_id uuid, p_cevaplar jsonb)
 RETURNS TABLE(toplam_kazanim integer, toplam_kayip integer, referral_yazildi boolean, referral_gonderen_id uuid, referral_puani integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_izleme public.cc_izleme_kayitlari%ROWTYPE;
  v_sorular jsonb := '[]'::jsonb;
  v_soru_seti_durum_id uuid;
  v_gelen_indeksler integer[];
  v_atanan_indeksler integer[];
  v_cevap jsonb;
  v_indeks integer;
  v_verilen text;
  v_dogru text;
  v_puan integer;
  v_kazanim integer := 0;
  v_kayip integer := 0;
  v_challenge public.challenge_kayitlari%ROWTYPE;
  v_referral integer := 0;
  v_referral_yazildi boolean := false;
  v_satir integer := 0;
BEGIN
  SELECT ik.*
  INTO v_izleme
  FROM public.cc_izleme_kayitlari ik
  WHERE ik.izleme_id = p_izleme_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'İzleme kaydı bulunamadı.' USING ERRCODE = 'P0002';
  END IF;
  IF v_izleme.bm_id <> p_bm_id THEN
    RAISE EXCEPTION 'İzleme kaydı BM kullanıcısına ait değil.' USING ERRCODE = '42501';
  END IF;
  IF NOT v_izleme.tamamlandi_mi
     OR v_izleme.ileri_sarildi_mi
     OR COALESCE(cardinality(v_izleme.soru_indeksleri), 0) = 0 THEN
    RAISE EXCEPTION 'Bu izleme için cevaplanabilir soru bulunmuyor.' USING ERRCODE = 'P0001';
  END IF;
  IF v_izleme.cevaplandi_mi THEN
    RAISE EXCEPTION 'Bu izleme için sorular zaten cevaplandı.' USING ERRCODE = '23505';
  END IF;
  -- [Faz 5] Kapanmış soru hakkıyla (yeniden başlatılmış izleme) cevap yazılamaz.
  IF NOT COALESCE(v_izleme.soru_erisimi_acik_mi, false) THEN
    RAISE EXCEPTION 'Bu izleme için soru hakkı kapanmıştır.' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_typeof(p_cevaplar) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_cevaplar) = 0
     OR EXISTS (
       SELECT 1 FROM jsonb_array_elements(p_cevaplar) cevap
       WHERE jsonb_typeof(cevap) <> 'object'
          OR jsonb_typeof(cevap->'soru_index') <> 'number'
          OR jsonb_typeof(cevap->'verilen_cevap') <> 'string'
          OR (cevap->>'soru_index') !~ '^[0-9]+$'
          OR btrim(cevap->>'verilen_cevap') = ''
     ) THEN
    RAISE EXCEPTION 'Cevap biçimi geçersiz.' USING ERRCODE = '22023';
  END IF;

  SELECT ARRAY_AGG((cevap->>'soru_index')::integer ORDER BY (cevap->>'soru_index')::integer)
  INTO v_gelen_indeksler
  FROM jsonb_array_elements(p_cevaplar) cevap;

  SELECT ARRAY_AGG(indeks ORDER BY indeks)
  INTO v_atanan_indeksler
  FROM unnest(v_izleme.soru_indeksleri) indeks;

  IF v_gelen_indeksler IS DISTINCT FROM v_atanan_indeksler THEN
    RAISE EXCEPTION 'Cevaplar atanmış soru kümesiyle birebir eşleşmiyor.' USING ERRCODE = '22023';
  END IF;

  SELECT
    CASE WHEN jsonb_typeof(vyd.sorular) = 'array' THEN vyd.sorular ELSE '[]'::jsonb END,
    vyd.soru_seti_durum_id
  INTO v_sorular, v_soru_seti_durum_id
  FROM public.v_yayin_detay vyd
  WHERE vyd.yayin_id = v_izleme.yayin_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Yayın soru seti bulunamadı.' USING ERRCODE = 'P0002';
  END IF;

  FOR v_cevap IN SELECT value FROM jsonb_array_elements(p_cevaplar)
  LOOP
    v_indeks := (v_cevap->>'soru_index')::integer;
    v_verilen := v_cevap->>'verilen_cevap';

    IF v_indeks < 0 OR v_indeks >= jsonb_array_length(v_sorular) THEN
      RAISE EXCEPTION 'Cevaplanan soru güncel soru setinde bulunamadı.' USING ERRCODE = '22023';
    END IF;

    SELECT secenek->>'harf'
    INTO v_dogru
    FROM jsonb_array_elements(v_sorular->v_indeks->'secenekler') secenek
    WHERE COALESCE((secenek->>'dogru')::boolean, false)
    LIMIT 1;

    IF v_dogru IS NULL OR NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_sorular->v_indeks->'secenekler') secenek
      WHERE secenek->>'harf' = v_verilen
    ) THEN
      RAISE EXCEPTION 'Verilen cevap güncel soru seçenekleriyle eşleşmiyor.' USING ERRCODE = '22023';
    END IF;

    SELECT GREATEST(0, COALESCE(MAX(sp.soru_puani), 0))::integer
    INTO v_puan
    FROM public.soru_seti_puanlari sp
    WHERE sp.soru_seti_durum_id = v_soru_seti_durum_id
      AND sp.soru_index = v_indeks;

    IF v_verilen = v_dogru THEN
      IF v_puan > 0 THEN
        INSERT INTO public.cc_kazanilan_puanlar
          (bm_id, yayin_id, izleme_id, puan_turu, puan)
        VALUES
          (p_bm_id, v_izleme.yayin_id, p_izleme_id, 'cevaplama', v_puan);
      END IF;
      v_kazanim := v_kazanim + v_puan;
    ELSE
      INSERT INTO public.cc_yanlis_cevap_kayitlari
        (bm_id, yayin_id, izleme_id, soru_index, verilen_cevap, dogru_cevap, kaybedilen_puan)
      VALUES
        (p_bm_id, v_izleme.yayin_id, p_izleme_id, v_indeks, v_verilen, v_dogru, v_puan);
      v_kayip := v_kayip + v_puan;
    END IF;
  END LOOP;

  UPDATE public.cc_izleme_kayitlari
  SET cevaplandi_mi = true,
      soru_erisimi_acik_mi = false             -- [Faz 5] cevaplandı: hak kapanır
  WHERE izleme_id = p_izleme_id;

  IF v_izleme.izleme_turu = 'challenge' AND v_izleme.challenge_id IS NOT NULL THEN
    SELECT ck.*
    INTO v_challenge
    FROM public.challenge_kayitlari ck
    WHERE ck.challenge_id = v_izleme.challenge_id
    FOR UPDATE;

    IF NOT FOUND
       OR v_challenge.alan_id <> p_bm_id
       OR v_challenge.yayin_id <> v_izleme.yayin_id THEN
      RAISE EXCEPTION 'İzlemenin challenge bağı doğrulanamadı.' USING ERRCODE = 'P0001';
    END IF;
    -- Süresiz challenge: tarihsel son_tarih cevap veya referral için engel değildir.

    SELECT COALESCE(MAX(
      CASE WHEN (sa.deger #>> '{}') ~ '^[0-9]+$' THEN (sa.deger #>> '{}')::integer END
    ), 10)
    INTO v_referral
    FROM public.sistem_ayarlari sa
    WHERE sa.anahtar = 'cc_referral_puani';

    INSERT INTO public.cc_kazanilan_puanlar
      (bm_id, yayin_id, challenge_id, izleme_id, puan_turu, puan)
    VALUES
      (v_challenge.gonderen_id, v_izleme.yayin_id, v_izleme.challenge_id,
       p_izleme_id, 'cc_referral', v_referral)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_satir = ROW_COUNT;
    v_referral_yazildi := v_satir > 0;

    -- [Faz 5] challenge_kayitlari.izlendi_mi = true GÜNCELLEMESİ KALDIRILDI:
    -- artık video tamamlanınca cc_izleme_tamamla içinde yapılıyor.
  END IF;

  RETURN QUERY SELECT
    v_kazanim,
    v_kayip,
    v_referral_yazildi,
    CASE WHEN v_challenge.challenge_id IS NOT NULL THEN v_challenge.gonderen_id ELSE NULL END,
    CASE WHEN v_referral_yazildi THEN v_referral ELSE 0 END;
END;
$function$;

REVOKE ALL ON FUNCTION public.cc_cevaplari_kaydet(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cc_cevaplari_kaydet(uuid, uuid, jsonb)
  TO service_role;

COMMIT;

SELECT
  position('v_challenge.son_tarih' IN pg_get_functiondef('public.cc_cevaplari_kaydet(uuid,uuid,jsonb)'::regprocedure)) = 0
  AND position('soru_erisimi_acik_mi' IN pg_get_functiondef('public.cc_cevaplari_kaydet(uuid,uuid,jsonb)'::regprocedure)) > 0
  AND position('FOR UPDATE' IN pg_get_functiondef('public.cc_cevaplari_kaydet(uuid,uuid,jsonb)'::regprocedure)) > 0
  AND position('cc_referral' IN pg_get_functiondef('public.cc_cevaplari_kaydet(uuid,uuid,jsonb)'::regprocedure)) > 0
  AS cc_suresiz_cevap_hazir;
