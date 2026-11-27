-- cogniti.net ana sayfasındaki sosyal medya ve dış bağlantı ikonları için tablo kurulumu.
-- Tamamını Supabase SQL Editor'de tek parça çalıştırın.
BEGIN;

CREATE TABLE IF NOT EXISTS public.cogniti_sosyal_linkler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad text NOT NULL CHECK (char_length(trim(ad)) BETWEEN 1 AND 80),
  url text NOT NULL CHECK (url ~* '^https?://'),
  ikon_yolu text NOT NULL UNIQUE CHECK (ikon_yolu LIKE 'sosyal-ikonlar/%'),
  sira integer NOT NULL DEFAULT 1 CHECK (sira >= 1),
  gorunur boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cogniti_sosyal_linkler_gorunur_sira
  ON public.cogniti_sosyal_linkler (gorunur, sira, created_at);

ALTER TABLE public.cogniti_sosyal_linkler ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cogniti_sosyal_linkler FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cogniti_sosyal_linkler TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT 'TAMAMLANDI' AS sql_sonucu, to_regclass('public.cogniti_sosyal_linkler') AS tablo;
