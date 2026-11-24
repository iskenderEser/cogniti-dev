-- Adım 5: Eczanem telefon sorgulama hız sınırı ve KVKK uyumlu denetim kaydı.
-- Eczane personeli başına 15 dakikada 20, eczane başına 15 dakikada 40 sorgu sınırı uygulanır.
-- Telefon numarası açık yazılmaz; yalnız SHA-256 özeti kaydedilir.
-- Bu dosyayı kullanıcı Supabase SQL Editor'da çalıştırır.

BEGIN;

CREATE TABLE IF NOT EXISTS public.eczanem_telefon_sorgu_kayitlari (
  kayit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eczane_id uuid NOT NULL REFERENCES public.eclub_eczaneler(eczane_id) ON DELETE CASCADE,
  kisi_id uuid NOT NULL,
  telefon_hash text NOT NULL CHECK (length(telefon_hash) = 64),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eczanem_telefon_sorgu_kisi_tarih
  ON public.eczanem_telefon_sorgu_kayitlari (kisi_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_eczanem_telefon_sorgu_eczane_tarih
  ON public.eczanem_telefon_sorgu_kayitlari (eczane_id, created_at DESC);

ALTER TABLE public.eczanem_telefon_sorgu_kayitlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eczanem_telefon_sorgu_kayitlari FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.eczanem_telefon_sorgu_kayitlari TO service_role;

CREATE OR REPLACE FUNCTION public.eczanem_telefon_sorgu_kontrol(
  p_eczane_id uuid,
  p_kisi_id uuid,
  p_telefon_hash text,
  p_pencere_dakika integer DEFAULT 15,
  p_kisi_limit integer DEFAULT 20,
  p_eczane_limit integer DEFAULT 40
)
RETURNS TABLE(izinli boolean, kalan integer, hata text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pencere_baslangici timestamptz;
  v_kisi_sayisi integer := 0;
  v_eczane_sayisi integer := 0;
BEGIN
  IF p_eczane_id IS NULL OR p_kisi_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Eczane ve personel bilgisi zorunludur.';
    RETURN;
  END IF;

  IF length(COALESCE(p_telefon_hash, '')) <> 64 THEN
    RETURN QUERY SELECT false, 0, 'Geçersiz sorgu özeti.';
    RETURN;
  END IF;

  IF NOT public.eczanem_personel_eczane_yetkili_mi(p_kisi_id, p_eczane_id) THEN
    RETURN QUERY SELECT false, 0, 'Bu eczanede aktif işlem yetkiniz yok.';
    RETURN;
  END IF;

  -- Eşzamanlı isteklerin sınırı aşmasını önlemek için sabit sırada işlem kilidi.
  PERFORM pg_advisory_xact_lock(hashtextextended('eczanem_tel_sorgu_eczane:' || p_eczane_id::text, 31));
  PERFORM pg_advisory_xact_lock(hashtextextended('eczanem_tel_sorgu_kisi:' || p_kisi_id::text, 37));

  v_pencere_baslangici := now() - make_interval(mins => GREATEST(1, COALESCE(p_pencere_dakika, 15)));

  SELECT count(*)::integer
  INTO v_kisi_sayisi
  FROM public.eczanem_telefon_sorgu_kayitlari k
  WHERE k.kisi_id = p_kisi_id
    AND k.created_at >= v_pencere_baslangici;

  IF v_kisi_sayisi >= GREATEST(1, COALESCE(p_kisi_limit, 20)) THEN
    RETURN QUERY SELECT false, 0, 'Çok fazla telefon sorgulaması yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.';
    RETURN;
  END IF;

  SELECT count(*)::integer
  INTO v_eczane_sayisi
  FROM public.eczanem_telefon_sorgu_kayitlari k
  WHERE k.eczane_id = p_eczane_id
    AND k.created_at >= v_pencere_baslangici;

  IF v_eczane_sayisi >= GREATEST(1, COALESCE(p_eczane_limit, 40)) THEN
    RETURN QUERY SELECT false, 0, 'Eczaneniz kısa sürede çok fazla telefon sorgulaması yaptı. Lütfen birkaç dakika sonra tekrar deneyin.';
    RETURN;
  END IF;

  INSERT INTO public.eczanem_telefon_sorgu_kayitlari (eczane_id, kisi_id, telefon_hash)
  VALUES (p_eczane_id, p_kisi_id, p_telefon_hash);

  RETURN QUERY SELECT
    true,
    LEAST(
      GREATEST(1, COALESCE(p_kisi_limit, 20)) - v_kisi_sayisi - 1,
      GREATEST(1, COALESCE(p_eczane_limit, 40)) - v_eczane_sayisi - 1
    ),
    NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.eczanem_telefon_sorgu_kontrol(uuid, uuid, text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eczanem_telefon_sorgu_kontrol(uuid, uuid, text, integer, integer, integer)
  TO service_role;

NOTIFY pgrst, $$reload schema$$;

COMMIT;
