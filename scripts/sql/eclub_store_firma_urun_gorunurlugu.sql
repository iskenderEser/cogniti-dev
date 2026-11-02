-- E-Club Store: global katalog + firma bazlı ürün görünürlüğü.
-- Ayar satırı yoksa ürün firmaya açıktır; yalnız kapalı istisnalar saklanır.

BEGIN;

CREATE TABLE IF NOT EXISTS public.eclub_store_urun_firma_ayarlari (
  urun_id uuid NOT NULL REFERENCES public.eclub_store_urunler(urun_id) ON DELETE CASCADE,
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id) ON DELETE CASCADE,
  aktif_mi boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (urun_id, firma_id)
);

CREATE INDEX IF NOT EXISTS idx_eclub_store_urun_firma_ayarlari_firma
  ON public.eclub_store_urun_firma_ayarlari (firma_id, aktif_mi);

ALTER TABLE public.eclub_store_urun_firma_ayarlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.eclub_store_urun_firma_ayarlari FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.eclub_store_urun_firma_ayarlari TO service_role;

CREATE OR REPLACE FUNCTION public.eclub_store_siparis_olustur(
  p_kisi_id uuid,
  p_urun_id uuid,
  p_adres_id uuid,
  p_adet integer
)
RETURNS TABLE(ok boolean, siparis_id uuid, hata text)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_urun record;
  v_toplam_puan bigint;
  v_uygun_bakiye bigint;
  v_siparis_id uuid;
  v_adres_snapshot jsonb;
  v_kalan bigint;
  v_dus bigint;
  r record;
BEGIN
  -- API denetimi tek başına yeterli değildir: service_role kullanan başka bir
  -- sunucu yolu da bu RPC'yi çağırabilir. Aktif kişi→eczane→firma zincirini
  -- burada kilitleyerek pasifleştirme ile siparişin yarışmasını da sıralarız.
  PERFORM ke.id
  FROM public.eclub_kisi_eczane ke
  JOIN public.eclub_eczane_firma ef
    ON ef.eczane_id = ke.eczane_id
   AND ef.aktif_mi = true
  JOIN public.firmalar f
    ON f.firma_id = ef.firma_id
   AND f.aktif = true
   AND f.eclub_aktif = true
  WHERE ke.kisi_id = p_kisi_id
    AND ke.aktif_mi = true
  LIMIT 1
  FOR UPDATE OF ke;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid,
      'Aktif E-Club üyeliğiniz bulunmadığı için yeni sipariş oluşturamazsınız.';
    RETURN;
  END IF;

  SELECT urun_id, puan_fiyat, stok, aktif_mi
    INTO v_urun
  FROM public.eclub_store_urunler
  WHERE urun_id = p_urun_id
  FOR UPDATE;

  IF NOT FOUND OR v_urun.aktif_mi = false THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Ürün bulunamadı veya pasif.';
    RETURN;
  END IF;
  IF v_urun.stok < p_adet THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Yetersiz stok.';
    RETURN;
  END IF;

  v_toplam_puan := v_urun.puan_fiyat::bigint * p_adet;

  SELECT COALESCE(SUM(b.bakiye), 0)
    INTO v_uygun_bakiye
  FROM public.get_eclub_store_firma_bakiye(p_kisi_id) b
  LEFT JOIN public.eclub_store_urun_firma_ayarlari a
    ON a.urun_id = p_urun_id
   AND a.firma_id = b.firma_id
  WHERE COALESCE(a.aktif_mi, true);

  IF v_uygun_bakiye < v_toplam_puan THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Bu ürün için kullanılabilir firma puanı yetersiz.';
    RETURN;
  END IF;

  SELECT to_jsonb(a)
    INTO v_adres_snapshot
  FROM public.eclub_store_adresler a
  WHERE a.adres_id = p_adres_id
    AND a.kisi_id = p_kisi_id;

  IF v_adres_snapshot IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Adres bulunamadı.';
    RETURN;
  END IF;

  INSERT INTO public.eclub_store_siparisler (
    kisi_id, urun_id, adres_id, adres_snapshot, adet,
    puan_birim_fiyat, toplam_puan, durum
  ) VALUES (
    p_kisi_id, p_urun_id, p_adres_id, v_adres_snapshot, p_adet,
    v_urun.puan_fiyat, v_toplam_puan, 'beklemede'
  ) RETURNING eclub_store_siparisler.siparis_id INTO v_siparis_id;

  v_kalan := v_toplam_puan;
  FOR r IN
    SELECT b.firma_id, b.bakiye
    FROM public.get_eclub_store_firma_bakiye(p_kisi_id) b
    LEFT JOIN public.eclub_store_urun_firma_ayarlari a
      ON a.urun_id = p_urun_id
     AND a.firma_id = b.firma_id
    WHERE COALESCE(a.aktif_mi, true)
    ORDER BY b.bakiye DESC
  LOOP
    EXIT WHEN v_kalan <= 0;
    v_dus := LEAST(r.bakiye, v_kalan);
    INSERT INTO public.eclub_store_siparis_firma_puan (siparis_id, firma_id, kullanilan_puan)
    VALUES (v_siparis_id, r.firma_id, v_dus);
    v_kalan := v_kalan - v_dus;
  END LOOP;

  UPDATE public.eclub_store_urunler
     SET stok = stok - p_adet,
         guncellenme_at = now()
   WHERE urun_id = p_urun_id;

  RETURN QUERY SELECT true, v_siparis_id, NULL::text;
END;
$function$;

COMMIT;

SELECT
  to_regclass('public.eclub_store_urun_firma_ayarlari') IS NOT NULL AS tablo_var,
  to_regprocedure('public.eclub_store_siparis_olustur(uuid,uuid,uuid,integer)') IS NOT NULL AS siparis_rpc_var;
