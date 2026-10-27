-- Cogniti token: veri modeli taslağı. İzole PostgreSQL testi ve canlı şema
-- ön kontrolü yapılmadan çalıştırılmamalıdır. Gönderim entegrasyonu içermez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-token-veri-modeli'));

CREATE TABLE public.cogniti_token_hesaplari (
  firma_id uuid PRIMARY KEY REFERENCES public.firmalar(firma_id),
  paket_turu text NOT NULL CHECK (paket_turu IN ('aylik', 'kullandigin_kadar_ode')),
  asim_borcu bigint NOT NULL DEFAULT 0 CHECK (asim_borcu >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cogniti_token_yuklemeleri (
  yukleme_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id uuid NOT NULL REFERENCES public.cogniti_token_hesaplari(firma_id),
  yukleme_turu text NOT NULL CHECK (yukleme_turu IN ('aylik_paket', 'kko', 'admin_duzeltme')),
  miktar bigint NOT NULL CHECK (miktar > 0),
  kalan bigint NOT NULL CHECK (kalan BETWEEN 0 AND miktar),
  donem_yil integer, donem_ay integer,
  son_kullanim_at timestamptz,
  olusturan_id uuid REFERENCES public.kullanicilar(kullanici_id),
  aciklama text, islem_anahtari text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((donem_yil IS NULL AND donem_ay IS NULL) OR
    (donem_yil IS NOT NULL AND donem_ay IS NOT NULL AND donem_yil BETWEEN 2000 AND 9999 AND donem_ay BETWEEN 1 AND 12)),
  CHECK (yukleme_turu <> 'aylik_paket' OR (donem_yil IS NOT NULL AND son_kullanim_at IS NOT NULL)),
  CHECK (yukleme_turu <> 'kko' OR son_kullanim_at IS NULL),
  UNIQUE (firma_id, islem_anahtari), UNIQUE (firma_id, yukleme_id)
);
CREATE TABLE public.cogniti_token_tuketimleri (
  tuketim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id uuid NOT NULL REFERENCES public.cogniti_token_hesaplari(firma_id),
  gonderen_turu text NOT NULL CHECK (gonderen_turu IN ('firma_kullanicisi', 'eclub_kisi')),
  gonderen_id uuid NOT NULL,
  alici_turu text NOT NULL CHECK (alici_turu IN ('firma_kullanicisi', 'eclub_kisi', 'eczanem_musteri', 'viva_ozel_davetli')),
  alici_kimligi text NOT NULL CHECK (length(alici_kimligi) BETWEEN 1 AND 254),
  islem_turu text NOT NULL CHECK (islem_turu IN ('yayin', 'tclub_oneri', 'cclub_challenge', 'eclub_oneri', 'eczanem_musteri', 'viva_davet')),
  kaynak_id uuid NOT NULL, islem_anahtari text NOT NULL,
  asim_miktari bigint NOT NULL DEFAULT 0 CHECK (asim_miktari IN (0, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firma_id, islem_anahtari), UNIQUE (firma_id, tuketim_id)
);
CREATE TABLE public.cogniti_token_tuketim_dagilimlari (
  firma_id uuid NOT NULL, tuketim_id uuid NOT NULL, yukleme_id uuid NOT NULL,
  miktar bigint NOT NULL CHECK (miktar > 0),
  PRIMARY KEY (tuketim_id, yukleme_id),
  FOREIGN KEY (firma_id, tuketim_id) REFERENCES public.cogniti_token_tuketimleri(firma_id, tuketim_id),
  FOREIGN KEY (firma_id, yukleme_id) REFERENCES public.cogniti_token_yuklemeleri(firma_id, yukleme_id)
);
CREATE INDEX cogniti_token_yukleme_tuketim_sirasi ON public.cogniti_token_yuklemeleri
  (firma_id, son_kullanim_at, created_at, yukleme_id) WHERE kalan > 0;
CREATE INDEX cogniti_token_tuketim_firma_zaman ON public.cogniti_token_tuketimleri (firma_id, created_at DESC);
CREATE UNIQUE INDEX cogniti_token_viva_kisi_tek ON public.cogniti_token_tuketimleri
  (firma_id, kaynak_id, alici_turu, alici_kimligi) WHERE islem_turu = 'viva_davet';
ALTER TABLE public.cogniti_token_hesaplari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_token_yuklemeleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_token_tuketimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_token_tuketim_dagilimlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_token_hesaplari, public.cogniti_token_yuklemeleri,
  public.cogniti_token_tuketimleri, public.cogniti_token_tuketim_dagilimlari FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.cogniti_token_hesaplari, public.cogniti_token_yuklemeleri,
  public.cogniti_token_tuketimleri, public.cogniti_token_tuketim_dagilimlari TO service_role;
COMMIT;
