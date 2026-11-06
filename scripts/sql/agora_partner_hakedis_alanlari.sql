-- Agora partner hak edişleri: onaylanan %20 KDV ve iki ayrı ödeme günü.
-- KULLANICI ÇALIŞTIRACAK. Önkoşul: Agora satın alma kurulumu.
-- Test platformundaki mevcut ve yeni siparişler aynı hesaplama kuralını kullanır.
BEGIN;

-- Mevcut odenecek_tutar alanı, %15 Cogniti payı düşülmüş KDV hariç hak ediştir.
-- Satın alma işlevi bu alanı yazmayı sürdürür; KDV ve toplam otomatik hesaplanır.
ALTER TABLE public.agora_siparisleri
  ADD COLUMN IF NOT EXISTS kdv_tutari numeric(14,2)
    GENERATED ALWAYS AS (round(odenecek_tutar * 0.20, 2)) STORED,
  ADD COLUMN IF NOT EXISTS kdvli_odenecek_tutar numeric(14,2)
    GENERATED ALWAYS AS (round(odenecek_tutar * 1.20, 2)) STORED,
  ADD COLUMN IF NOT EXISTS planlanan_odeme_gunu date,
  ADD COLUMN IF NOT EXISTS odenen_gun date;

COMMENT ON COLUMN public.agora_siparisleri.kdv_tutari
  IS 'Partnerin KDV hariç hak edişi üzerinden %20 KDV; kuruşa yuvarlanır.';
COMMENT ON COLUMN public.agora_siparisleri.kdvli_odenecek_tutar
  IS 'Partnere ödenecek KDV dahil toplam: hak ediş x 1,20.';
COMMENT ON COLUMN public.agora_siparisleri.planlanan_odeme_gunu
  IS 'Partner hak edişinin planlanan ödeme günü; belirlenene kadar NULL.';
COMMENT ON COLUMN public.agora_siparisleri.odenen_gun
  IS 'Partner hak edişinin fiilen ödendiği gün; ödeme gerçekleşene kadar NULL.';

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT true AS agora_partner_hakedis_alanlari_hazir;
