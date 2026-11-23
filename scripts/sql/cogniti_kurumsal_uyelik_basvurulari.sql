BEGIN;

CREATE TABLE IF NOT EXISTS public.cogniti_kurumsal_uyelik_basvurulari (
  on_basvuru_id uuid PRIMARY KEY REFERENCES public.cogniti_kurumsal_on_basvuru(id) ON DELETE CASCADE,
  durum text NOT NULL DEFAULT 'taslak'
    CHECK (durum IN ('taslak', 'incelemede', 'onaylandi', 'reddedildi')),
  firma_bilgileri jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(firma_bilgileri) = 'object'),
  logo_yolu text,
  logo_dosya_adi text,
  sozlesme_yolu text,
  sozlesme_dosya_adi text,
  ticaret_sicil_yolu text,
  ticaret_sicil_dosya_adi text,
  vergi_levhasi_yolu text,
  vergi_levhasi_dosya_adi text,
  isim_listesi jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(isim_listesi) = 'array'),
  urun_listesi jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(urun_listesi) = 'array'),
  olusturuldu_at timestamptz NOT NULL DEFAULT now(),
  guncellendi_at timestamptz NOT NULL DEFAULT now(),
  gonderildi_at timestamptz,
  karar_at timestamptz,
  karar_veren uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  karar_notu text,
  olusturulan_firma_id uuid REFERENCES public.firmalar(firma_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cogniti_kurumsal_uyelik_basvurulari_durum
  ON public.cogniti_kurumsal_uyelik_basvurulari (durum, gonderildi_at DESC);

ALTER TABLE public.cogniti_kurumsal_uyelik_basvurulari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_kurumsal_uyelik_basvurulari FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cogniti_kurumsal_uyelik_basvurulari TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kurumsal-uyelik-belgeleri',
  'kurumsal-uyelik-belgeleri',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT true AS cogniti_kurumsal_uyelik_basvurulari_hazir;
