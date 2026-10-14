-- E-Club yeni gönderim kurgusu — Adım 3: ayrı plan veri modeli.
-- Yalnız tablo, kısıt, indeks ve erişim yetkilerini hazırlar.
-- Kota RPC'leri, bildirim ve zamanlayıcı bu dosyanın kapsamı dışındadır.
-- Canlı ortamda henüz uygulanmadı. Kurulum sırası Adım 12'de hazırlanacaktır.

BEGIN;

SELECT pg_advisory_xact_lock(hashtextextended('eclub-yayin-gonderim-planlari-v1', 0));

CREATE TABLE IF NOT EXISTS public.eclub_yayin_gonderim_planlari (
  plan_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utt_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
  kisi_id uuid NOT NULL REFERENCES public.eclub_kisiler(kisi_id),
  yayin_id uuid NOT NULL REFERENCES public.yayin_yonetimi(yayin_id),
  urun_id uuid NOT NULL REFERENCES public.urunler(urun_id),
  hedef_gonderim_at timestamptz NOT NULL,
  durum text NOT NULL DEFAULT 'bekliyor',
  islem_anahtari uuid NOT NULL,
  oneri_id uuid REFERENCES public.eclub_oneri_kayitlari(oneri_id),
  gerceklesti_at timestamptz,
  isleme_alindi_at timestamptz,
  lease_bitis timestamptz,
  deneme_sayisi integer NOT NULL DEFAULT 0,
  son_hata_kodu text,
  son_hata_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  guncellenme_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT eclub_gonderim_plan_durum_ck CHECK (
    durum IN ('bekliyor', 'isleniyor', 'gerceklesti', 'gerceklesmedi')
  ),
  CONSTRAINT eclub_gonderim_plan_deneme_ck CHECK (deneme_sayisi >= 0),
  CONSTRAINT eclub_gonderim_plan_sonuc_ck CHECK (
    (durum = 'gerceklesti' AND oneri_id IS NOT NULL AND gerceklesti_at IS NOT NULL)
    OR (durum <> 'gerceklesti' AND oneri_id IS NULL AND gerceklesti_at IS NULL)
  ),
  CONSTRAINT eclub_gonderim_plan_lease_ck CHECK (
    (durum = 'isleniyor' AND isleme_alindi_at IS NOT NULL AND lease_bitis IS NOT NULL
      AND lease_bitis > isleme_alindi_at)
    OR (durum <> 'isleniyor' AND lease_bitis IS NULL)
  ),
  CONSTRAINT eclub_gonderim_plan_gerceklesme_ck CHECK (
    gerceklesti_at IS NULL OR gerceklesti_at >= hedef_gonderim_at
  ),
  CONSTRAINT eclub_gonderim_plan_hata_ck CHECK (
    (son_hata_kodu IS NULL AND son_hata_at IS NULL)
    OR (nullif(btrim(son_hata_kodu), '') IS NOT NULL AND son_hata_at IS NOT NULL)
  ),
  CONSTRAINT eclub_gonderim_plan_engel_ck CHECK (
    durum <> 'gerceklesmedi' OR nullif(btrim(son_hata_kodu), '') IS NOT NULL
  ),
  CONSTRAINT eclub_gonderim_plan_islem_uq
    UNIQUE (utt_id, islem_anahtari, yayin_id, kisi_id),
  CONSTRAINT eclub_gonderim_plan_oneri_uq UNIQUE (oneri_id)
);

-- Hedef zaman, kota rezervasyonunun zamanıdır; created_at planın kayıt zamanıdır.
CREATE INDEX IF NOT EXISTS eclub_gonderim_plan_haftalik_idx
  ON public.eclub_yayin_gonderim_planlari (utt_id, kisi_id, urun_id, hedef_gonderim_at)
  WHERE durum IN ('bekliyor', 'isleniyor');
CREATE INDEX IF NOT EXISTS eclub_gonderim_plan_tekrar_idx
  ON public.eclub_yayin_gonderim_planlari (utt_id, kisi_id, yayin_id, hedef_gonderim_at)
  WHERE durum IN ('bekliyor', 'isleniyor');
CREATE INDEX IF NOT EXISTS eclub_gonderim_plan_is_idx
  ON public.eclub_yayin_gonderim_planlari (hedef_gonderim_at, plan_id)
  WHERE durum = 'bekliyor';
CREATE INDEX IF NOT EXISTS eclub_gonderim_plan_lease_idx
  ON public.eclub_yayin_gonderim_planlari (lease_bitis, plan_id)
  WHERE durum = 'isleniyor';

ALTER TABLE public.eclub_yayin_gonderim_planlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.eclub_yayin_gonderim_planlari FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.eclub_yayin_gonderim_planlari TO service_role;

COMMENT ON TABLE public.eclub_yayin_gonderim_planlari IS
  'UTT yayın-alıcı planları. Öneri, bildirim ve öğrenme yalnız gerçek gönderimde başlar.';
COMMENT ON COLUMN public.eclub_yayin_gonderim_planlari.urun_id IS
  'Yayının v_yayin_kunye üzerinden sunucuda çözülen ürün kimliği; istemciye güvenilmez.';
COMMENT ON COLUMN public.eclub_yayin_gonderim_planlari.hedef_gonderim_at IS
  'Türkiye saatine göre seçilen mutlak gönderim anı. Sistem kendiliğinden başka güne kaydırmaz.';
COMMENT ON COLUMN public.eclub_yayin_gonderim_planlari.oneri_id IS
  'Gerçekleşme transactionında bağlanan öneri. Gerçekleşmiş plan ayrıca kota tüketmez.';
COMMENT ON COLUMN public.eclub_yayin_gonderim_planlari.islem_anahtari IS
  'Yanıt kaybında aynı kayıt isteğinin mükerrer plan oluşturmamasını sağlayan anahtar.';

COMMIT;
