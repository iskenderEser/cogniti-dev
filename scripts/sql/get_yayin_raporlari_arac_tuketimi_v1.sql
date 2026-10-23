-- YAPKA / 1. alt kart: dört öğrenme aracının tüketim özeti.
-- Kullanıcı tarafından SQL Editor'da çalıştırılır.
-- Yalnız yeni bir fonksiyon ekler; mevcut rapor/puan fonksiyonlarını değiştirmez.
--
-- p_yonetici_id: mevcut API'nin raporKimligi.
-- Üretici kendi yayınları; yönetici mevcut firma kapsamı; admin mevcut çözülmüş kimlik.
-- p_rapor_rolu: tumu, utt, bm, eczaci, eczane_teknisyeni, eczanem.
-- Rol, üretici/firma ve tarih sınırları mevcut ortak SQL kaynağından alınır.
-- Dört zaman seçeneğinin API'den gelen aralığı: [p_baslangic, p_bitis).
--
-- Toplam: yayın tarihi seçili aralıkta olan ve ŞU ANDA durum='yayinda'
-- olan benzersiz yayın adedi. Planlanan ve durdurulan yayınlar sayılmaz.
-- Başlatılan: izleme_baslangic seçili aralıkta olan her başlangıç kaydı 1.
-- Tamamlanan: tamamlandi_mi=true ve izleme_bitis seçili aralıkta olan her kayıt 1.
-- Başlatma/tamamlama, eski yayınların dönem içindeki hareketlerini de kapsar;
-- bu iki sayıya yayının güncel durumunu veya yayın tarihini sınırlayan yeni koşul eklenmez.
-- Tamamlama oranı: mevcut gösterim korunur; round(tamamlama/baslatma*100), en çok 100.
-- Başlatma 0 ise oran NULL (arayüzde —).
-- Potansiyel Puan ve 2. alt kart bu dosyanın kapsamı dışındadır.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_yayin_raporlari_arac_tuketimi_v1(
  p_yonetici_id uuid,
  p_baslangic timestamptz,
  p_bitis timestamptz,
  p_rapor_rolu text DEFAULT 'tumu'
)
RETURNS TABLE (
  arac_turu text,
  toplam_yayin_sayisi bigint,
  baslatma bigint,
  tamamlama bigint,
  tamamlama_orani numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $function$
WITH turler(sira, arac_turu) AS (
  VALUES (1,'video'::text), (2,'podcast'::text), (3,'gorsel'::text), (4,'flip_pdf'::text)
), kaynak AS MATERIALIZED (
  -- Ortak kaynak yayınları yayin_tarihi, olayları kendi olay_tarihi ile süzer.
  -- Başlangıç/bitiş olayları, kurulu v_rapor_arac_turu_olaylari görünümünden gelir.
  SELECT k.kaynak, k.yayin_id, k.arac_turu, k.olay_turu, k.adet
  FROM public.get_yayin_raporlari_arac_kaynagi_v1(
    p_yonetici_id, p_baslangic, p_bitis, p_rapor_rolu, NULL::text
  ) k
), yayin_toplamlari AS (
  SELECT k.arac_turu, COUNT(DISTINCT k.yayin_id)::bigint AS toplam_yayin_sayisi
  FROM kaynak k
  JOIN public.yayin_yonetimi yy ON yy.yayin_id = k.yayin_id
  WHERE k.kaynak = 'yayin'
    AND yy.durum = 'yayinda'
  GROUP BY k.arac_turu
), tuketim_toplamlari AS (
  SELECT k.arac_turu,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'baslatma'), 0)::bigint AS baslatma,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'tamamlama'), 0)::bigint AS tamamlama
  FROM kaynak k
  WHERE k.kaynak = 'olay'
  GROUP BY k.arac_turu
)
SELECT t.arac_turu,
  COALESCE(y.toplam_yayin_sayisi, 0)::bigint,
  COALESCE(o.baslatma, 0)::bigint,
  COALESCE(o.tamamlama, 0)::bigint,
  CASE WHEN o.baslatma > 0
    THEN LEAST(100::numeric, ROUND(o.tamamlama::numeric * 100 / o.baslatma))
    ELSE NULL::numeric
  END
FROM turler t
LEFT JOIN yayin_toplamlari y ON y.arac_turu = t.arac_turu
LEFT JOIN tuketim_toplamlari o ON o.arac_turu = t.arac_turu
ORDER BY t.sira;
$function$;

REVOKE ALL ON FUNCTION public.get_yayin_raporlari_arac_tuketimi_v1(uuid,timestamptz,timestamptz,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_yayin_raporlari_arac_tuketimi_v1(uuid,timestamptz,timestamptz,text)
  TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT to_regprocedure(
  'public.get_yayin_raporlari_arac_tuketimi_v1(uuid,timestamptz,timestamptz,text)'
) IS NOT NULL AS yapka_1_alt_kart_hazir;
