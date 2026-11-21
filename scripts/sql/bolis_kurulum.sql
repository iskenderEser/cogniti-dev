-- BOLIS (Bilgi Derinliği Ölçüm ve Sınav Merkezi) — Faz 1 Temel Şema Kurulumu
-- KULLANICI SUPABASE SQL EDITOR'DA ÇALIŞTIRACAKTIR.
BEGIN;

-- 1. Sınavlar
CREATE TABLE IF NOT EXISTS public.bolis_sinavlari (
  sinav_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id) ON DELETE CASCADE,
  olusturan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
  erisim_kodu text NOT NULL UNIQUE CHECK (char_length(erisim_kodu) BETWEEN 6 AND 32),
  baslik text NOT NULL CHECK (char_length(btrim(baslik)) BETWEEN 2 AND 200),
  aciklama text NOT NULL DEFAULT '' CHECK (char_length(aciklama) <= 2000),
  hedef_roller text[] NOT NULL CHECK (
    cardinality(hedef_roller) >= 1
    AND hedef_roller <@ ARRAY['utt', 'bm', 'eczaci', 'eczane_teknisyeni', 'eczanem']::text[]
  ),
  yayin_araci text NOT NULL DEFAULT 'yayin_yok' CHECK (
    yayin_araci IN ('yayin_yok', 'video', 'podcast', 'gorsel', 'flip_pdf', 'viva')
  ),
  -- Video standardı: yalnızca 36 karakterlik ham Bunny GUID saklanır (AGENTS.md 4. kural)
  yayin_video_guid text CHECK (
    yayin_video_guid IS NULL
    OR yayin_video_guid ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  ),
  yayin_dosya_yolu text,
  yayin_viva_etkinlik_id uuid,
  yayin_baslik text,
  sure_modu text NOT NULL DEFAULT 'baslayinca_sure' CHECK (
    sure_modu IN ('sabit_pencere', 'baslayinca_sure')
  ),
  sure_dakika integer NOT NULL CHECK (sure_dakika BETWEEN 1 AND 480),
  baslangic_at timestamptz,
  bitis_at timestamptz,
  kayit_tipi text NOT NULL DEFAULT 'kendi_kaydi' CHECK (
    kayit_tipi IN ('hazir_liste', 'kendi_kaydi', 'anonim')
  ),
  durum text NOT NULL DEFAULT 'taslak' CHECK (
    durum IN ('taslak', 'yayinda', 'kapali')
  ),
  olusturuldu_at timestamptz NOT NULL DEFAULT now(),
  guncellendi_at timestamptz NOT NULL DEFAULT now(),
  CHECK (bitis_at IS NULL OR baslangic_at IS NULL OR bitis_at > baslangic_at)
);

CREATE INDEX IF NOT EXISTS idx_bolis_sinavlari_firma_durum
  ON public.bolis_sinavlari (firma_id, durum, olusturuldu_at DESC);

-- 2. Sorular (1–100 soru, yalnız Çoktan Seçmeli, 2–10 seçenek)
CREATE TABLE IF NOT EXISTS public.bolis_sorulari (
  soru_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id uuid NOT NULL REFERENCES public.bolis_sinavlari(sinav_id) ON DELETE CASCADE,
  sira integer NOT NULL CHECK (sira BETWEEN 1 AND 100),
  soru_metni text NOT NULL CHECK (char_length(btrim(soru_metni)) >= 1),
  secenekler jsonb NOT NULL CHECK (
    jsonb_typeof(secenekler) = 'array'
    AND jsonb_array_length(secenekler) BETWEEN 2 AND 10
  ),
  dogru_secenek text NOT NULL CHECK (char_length(btrim(dogru_secenek)) >= 1),
  puan numeric(8,2) NOT NULL CHECK (puan > 0),
  olusturuldu_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sinav_id, sira)
);

CREATE INDEX IF NOT EXISTS idx_bolis_sorulari_sinav
  ON public.bolis_sorulari (sinav_id, sira);

-- 3. Hazır Liste Davetlileri (Manuel veya Toplu Yükleme)
CREATE TABLE IF NOT EXISTS public.bolis_davetlileri (
  davetli_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id uuid NOT NULL REFERENCES public.bolis_sinavlari(sinav_id) ON DELETE CASCADE,
  davet_kodu text NOT NULL UNIQUE CHECK (char_length(davet_kodu) BETWEEN 8 AND 64),
  ad text NOT NULL CHECK (char_length(btrim(ad)) >= 1),
  soyad text NOT NULL CHECK (char_length(btrim(soyad)) >= 1),
  eposta text,
  telefon text,
  rol_grubu text CHECK (
    rol_grubu IS NULL
    OR rol_grubu IN ('utt', 'bm', 'eczaci', 'eczane_teknisyeni', 'eczanem')
  ),
  takim_adi text,
  bolge_adi text,
  eczane_adi text,
  kullanici_id uuid REFERENCES public.kullanicilar(kullanici_id) ON DELETE SET NULL,
  olusturuldu_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bolis_davetlileri_sinav
  ON public.bolis_davetlileri (sinav_id);

-- 4. Sınav Katılım Oturumları (Her katılımcı için tek giriş hakkı)
CREATE TABLE IF NOT EXISTS public.bolis_oturumlari (
  oturum_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sinav_id uuid NOT NULL REFERENCES public.bolis_sinavlari(sinav_id) ON DELETE CASCADE,
  davetli_id uuid REFERENCES public.bolis_davetlileri(davetli_id) ON DELETE SET NULL,
  kullanici_id uuid REFERENCES public.kullanicilar(kullanici_id) ON DELETE SET NULL,
  katilimci_sira integer NOT NULL CHECK (katilimci_sira >= 1),
  katilimci_etiketi text NOT NULL,
  ad text,
  soyad text,
  eposta text,
  telefon text,
  rol_grubu text CHECK (
    rol_grubu IS NULL
    OR rol_grubu IN ('utt', 'bm', 'eczaci', 'eczane_teknisyeni', 'eczanem')
  ),
  takim_adi text,
  bolge_adi text,
  eczane_adi text,
  tekil_anahtar text NOT NULL,
  durum text NOT NULL DEFAULT 'devam' CHECK (durum IN ('devam', 'tamamlandi')),
  baslangic_at timestamptz NOT NULL DEFAULT now(),
  bitis_siniri_at timestamptz NOT NULL,
  teslim_at timestamptz,
  toplam_puan numeric(10,2) NOT NULL DEFAULT 0,
  maksimum_puan numeric(10,2) NOT NULL DEFAULT 0,
  dogru_sayisi integer NOT NULL DEFAULT 0,
  yanlis_sayisi integer NOT NULL DEFAULT 0,
  bos_sayisi integer NOT NULL DEFAULT 0,
  UNIQUE (sinav_id, tekil_anahtar),
  UNIQUE (sinav_id, katilimci_sira)
);

CREATE INDEX IF NOT EXISTS idx_bolis_oturumlari_sinav_durum
  ON public.bolis_oturumlari (sinav_id, durum);

-- 5. Katılımcı Cevapları
CREATE TABLE IF NOT EXISTS public.bolis_cevaplari (
  cevap_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oturum_id uuid NOT NULL REFERENCES public.bolis_oturumlari(oturum_id) ON DELETE CASCADE,
  soru_id uuid NOT NULL REFERENCES public.bolis_sorulari(soru_id) ON DELETE CASCADE,
  secilen_secenek text,
  dogru_mu boolean,
  kazanilan_puan numeric(8,2) NOT NULL DEFAULT 0,
  cevaplandi_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (oturum_id, soru_id)
);

CREATE INDEX IF NOT EXISTS idx_bolis_cevaplari_soru
  ON public.bolis_cevaplari (soru_id);

-- RLS ve Yetkiler: Tüm erişim sunucu API'leri (service_role) üzerinden yönetilir
ALTER TABLE public.bolis_sinavlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolis_sorulari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolis_davetlileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolis_oturumlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolis_cevaplari ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.bolis_sinavlari, public.bolis_sorulari, public.bolis_davetlileri, public.bolis_oturumlari, public.bolis_cevaplari
  FROM PUBLIC, anon, authenticated;

GRANT ALL ON public.bolis_sinavlari, public.bolis_sorulari, public.bolis_davetlileri, public.bolis_oturumlari, public.bolis_cevaplari
  TO service_role;

COMMIT;
