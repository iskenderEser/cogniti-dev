-- Tek onayda birden fazla FirmaStore çeki. Mevcut sipariş fonksiyonu korunur.
-- Herhangi bir satır başarısızsa tüm stok/puan/sipariş değişiklikleri geri alınır.
-- Aynı onayın tekrar gönderilmesi ikinci sipariş/harcama üretmez.
BEGIN;
ALTER TABLE public.store_siparisler ADD COLUMN IF NOT EXISTS toplu_talep_anahtari uuid;
CREATE UNIQUE INDEX IF NOT EXISTS store_siparis_toplu_talep_tekil_idx
  ON public.store_siparisler(kullanici_id, toplu_talep_anahtari, urun_id)
  WHERE toplu_talep_anahtari IS NOT NULL;

CREATE OR REPLACE FUNCTION public.store_coklu_cek_talep_olustur(
  p_kullanici_id uuid, p_cekler jsonb, p_talep_anahtari uuid
) RETURNS TABLE(ok boolean, siparis_ids uuid[], hata text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $fn$
DECLARE
  r record; sonuc record; ids uuid[] := '{}'::uuid[];
  adet integer; mevcut integer;
BEGIN
  IF p_kullanici_id IS NULL OR p_talep_anahtari IS NULL
    OR jsonb_typeof(p_cekler) IS DISTINCT FROM 'array' THEN
    RETURN QUERY SELECT false, '{}'::uuid[], 'Geçerli kullanıcı, onay ve çek listesi zorunludur.'::text; RETURN;
  END IF;
  adet := jsonb_array_length(p_cekler);
  IF adet < 1 OR adet > 100 THEN
    RETURN QUERY SELECT false, '{}'::uuid[], '1–100 farklı çek seçin.'::text; RETURN;
  END IF;

  -- Mevcut tekli taleple aynı kullanıcı kilidi; tüm seçimin bakiyesi korunur.
  PERFORM pg_advisory_xact_lock(hashtextextended('hbstore:siparis:' || p_kullanici_id::text, 0));
  BEGIN
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_cekler) e WHERE jsonb_typeof(e) <> 'object') THEN
      RAISE EXCEPTION 'Geçersiz çek listesi.';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_to_recordset(p_cekler) AS x(urun_id uuid, adet integer, beklenen_baz_puan integer, beklenen_birim_tl numeric)
      WHERE x.urun_id IS NULL OR x.adet IS NULL OR x.adet < 1
        OR x.beklenen_baz_puan IS NULL OR x.beklenen_baz_puan < 1
        OR x.beklenen_birim_tl IS NULL OR x.beklenen_birim_tl <= 0
        OR x.beklenen_birim_tl > 9999999999.99
        OR x.beklenen_birim_tl <> round(x.beklenen_birim_tl, 2)
    ) OR (SELECT count(DISTINCT x.urun_id) FROM jsonb_to_recordset(p_cekler) AS x(urun_id uuid)) <> adet THEN
      RAISE EXCEPTION 'Her çek için farklı kimlik, pozitif adet, puan ve geçerli TL tutarı zorunludur.';
    END IF;
    IF (SELECT sum(x.adet::bigint * x.beklenen_baz_puan) FROM jsonb_to_recordset(p_cekler) AS x(adet integer, beklenen_baz_puan integer)) > 2147483647 THEN
      RAISE EXCEPTION 'Toplam talep puanı izin verilen sınırı aşıyor.';
    END IF;

    SELECT count(*) INTO mevcut FROM public.store_siparisler s
      WHERE s.kullanici_id = p_kullanici_id AND s.toplu_talep_anahtari = p_talep_anahtari;
    IF mevcut > 0 THEN
      IF mevcut <> adet OR EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p_cekler) AS x(urun_id uuid, adet integer, beklenen_baz_puan integer, beklenen_birim_tl numeric)
        WHERE NOT EXISTS (SELECT 1 FROM public.store_siparisler s
          WHERE s.kullanici_id = p_kullanici_id AND s.toplu_talep_anahtari = p_talep_anahtari
            AND s.urun_id = x.urun_id AND s.adet = x.adet
            AND s.puan_birim_fiyat = x.beklenen_baz_puan AND s.cek_birim_tl = x.beklenen_birim_tl)
      ) THEN RAISE EXCEPTION 'Bu onay başka bir çek seçimi için kullanılmış; onayı yeniden açın.'; END IF;
      SELECT array_agg(s.siparis_id ORDER BY s.urun_id) INTO ids FROM public.store_siparisler s
        WHERE s.kullanici_id = p_kullanici_id AND s.toplu_talep_anahtari = p_talep_anahtari;
      RETURN QUERY SELECT true, ids, NULL::text; RETURN;
    END IF;

    -- Ürün kilitleri her toplu talepte aynı sırada alınır.
    FOR r IN SELECT * FROM jsonb_to_recordset(p_cekler)
      AS x(urun_id uuid, adet integer, beklenen_baz_puan integer, beklenen_birim_tl numeric)
      ORDER BY x.urun_id
    LOOP
      SELECT * INTO sonuc FROM public.store_cek_siparis_olustur(
        p_kullanici_id, r.urun_id, r.adet, r.beklenen_baz_puan, r.beklenen_birim_tl);
      IF sonuc.ok IS DISTINCT FROM true OR sonuc.siparis_id IS NULL THEN
        RAISE EXCEPTION '%', coalesce(sonuc.hata, 'Çek talebi oluşturulamadı.');
      END IF;
      UPDATE public.store_siparisler s SET toplu_talep_anahtari = p_talep_anahtari
        WHERE s.siparis_id = sonuc.siparis_id AND s.kullanici_id = p_kullanici_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Çek talebi doğrulanamadı.'; END IF;
      ids := array_append(ids, sonuc.siparis_id);
    END LOOP;
    RETURN QUERY SELECT true, ids, NULL::text;
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN RETURN QUERY SELECT false, '{}'::uuid[], SQLERRM::text;
    WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RETURN QUERY SELECT false, '{}'::uuid[], 'Çek listesi veya tutarlar geçersiz.'::text;
  END;
END;
$fn$;
REVOKE ALL ON FUNCTION public.store_coklu_cek_talep_olustur(uuid,jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_coklu_cek_talep_olustur(uuid,jsonb,uuid) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT to_regprocedure('public.store_coklu_cek_talep_olustur(uuid,jsonb,uuid)') IS NOT NULL AS firmastore_coklu_talep_hazir;
