-- Yayın Raporları / Öğrenme Aracı Performansı
-- Kullanıcı tarafından SQL Editor'da çalıştırılır.
--
-- Mevcut aracTuruDagilimi.ts hesabını veritabanına taşır.
-- Dört araç: video, podcast, gorsel (Dijital Broşür), flip_pdf (Literatür).
-- Tümü mevcut v_rapor_arac_turu_ozet / v_rapor_arac_turu_olaylari verisini kullanır.
-- Tarih aralığı mevcut karttaki gibi başlangıç dahil, bitiş hariçtir: [başlangıç, bitiş).
-- Yeni yayınlar yayın tarihiyle; tüketim, puan ve etkileşimler olay tarihiyle süzülür.
-- Önceki dönemlerin yayınlarının seçili dönemdeki hareketleri de hesaba katılır.
--
-- Tek dosya, üç fonksiyon:
-- 1. Ortak kapsam ve veri kaynağı (iç kullanım).
-- 2. Dört aracın özetleri ve rol toplamları; tüm yayın listesini taşımaz.
-- 3. Tek aracın etkileşim alan yayınları; UUID imleciyle en fazla 200 kayıt.
--
-- p_yonetici_id = API'deki kapsam.raporKimligi. Üreticide kendi kullanıcı kimliği;
-- yöneticide kendi kimliği; admin için mevcut API'nin çözdüğü firma yöneticisi.
-- p_rapor_rolu = 'tumu', 'utt', 'bm', 'eczaci', 'eczane_teknisyeni', 'eczanem'. Üye tüketimi musteri kimliğinden okunur.
-- Tümü'ne yeni bir hedef rol / aktif tüketici / gerçek oynatma koşulu eklenmez.
-- Bu dosya ikinci kartın fonksiyonlarını veya mevcut görünümleri değiştirmez.
-- Uygulama bağlantısı ayrıca yapılır; yalnız SQL kurulması ekranı değiştirmez.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_yayin_raporlari_arac_kaynagi_v1(
  p_yonetici_id uuid,
  p_baslangic timestamptz,
  p_bitis timestamptz,
  p_rapor_rolu text,
  p_arac_turu text
)
RETURNS TABLE (
  kaynak text,
  yayin_id uuid,
  arac_turu text,
  talep_id uuid,
  talep_no integer,
  olay_turu text,
  rol text,
  adet bigint,
  puan bigint,
  arac_puani bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $function$
WITH rapor_scope AS (
  SELECT
    k.firma_id,
    CASE WHEN k.rol IN (
      'pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz',
      'ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'
    ) THEN k.kullanici_id ELSE NULL::uuid END AS uretici_id
  FROM public.kullanicilar k
  WHERE k.kullanici_id = p_yonetici_id
    AND k.aktif_mi = true
    AND k.firma_id IS NOT NULL
    AND k.rol IN (
      'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm',
      'pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz',
      'ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'
    )
    AND p_rapor_rolu IN ('tumu','utt','bm','eczaci','eczane_teknisyeni','eczanem')
)
SELECT
  'yayin'::text, y.yayin_id, y.arac_turu::text, y.talep_id, y.talep_no,
  NULL::text, NULL::text, 0::bigint, 0::bigint,
  COALESCE(y.arac_puani, 0)::bigint
FROM public.v_rapor_arac_turu_ozet y
JOIN rapor_scope rs ON (
  (rs.uretici_id IS NOT NULL AND y.uretici_id = rs.uretici_id)
  OR (rs.uretici_id IS NULL AND y.firma_id = rs.firma_id)
)
WHERE y.yayin_tarihi >= p_baslangic
  AND y.yayin_tarihi < p_bitis
  AND y.arac_turu IN ('video','podcast','gorsel','flip_pdf')
  AND (p_arac_turu IS NULL OR y.arac_turu = p_arac_turu)
  AND (
    p_rapor_rolu = 'tumu'
    OR (
      p_rapor_rolu = 'utt'
      AND y.firma_id = rs.firma_id
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = y.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['utt']::text[]
      )
    )
    OR (
      p_rapor_rolu = 'bm'
      AND y.firma_id = rs.firma_id
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = y.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['bm']::text[]
      )
    )
    OR (
      p_rapor_rolu = 'eczaci'
      AND y.firma_id = rs.firma_id
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = y.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['eczaci']::text[]
      )
    )
    OR (
      p_rapor_rolu = 'eczane_teknisyeni'
      AND y.firma_id = rs.firma_id
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = y.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['eczane_teknisyeni']::text[]
      )
    )
    OR (
      p_rapor_rolu = 'eczanem'
      AND y.firma_id = rs.firma_id
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = y.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['eczanem']::text[]
      )
    )
  )

UNION ALL

SELECT
  'olay'::text, o.yayin_id, o.arac_turu::text, o.talep_id, o.talep_no,
  o.olay_turu::text, COALESCE(NULLIF(o.rol, ''), 'bilinmiyor')::text,
  COALESCE(o.adet, 0)::bigint, COALESCE(o.puan, 0)::bigint, 0::bigint
FROM public.v_rapor_arac_turu_olaylari o
JOIN rapor_scope rs ON (
  (rs.uretici_id IS NOT NULL AND o.uretici_id = rs.uretici_id)
  OR (rs.uretici_id IS NULL AND o.firma_id = rs.firma_id)
)
WHERE o.olay_tarihi >= p_baslangic
  AND o.olay_tarihi < p_bitis
  AND o.arac_turu IN ('video','podcast','gorsel','flip_pdf')
  AND (p_arac_turu IS NULL OR o.arac_turu = p_arac_turu)
  AND (
    p_rapor_rolu = 'tumu'
    OR (
      p_rapor_rolu = 'utt'
      AND o.firma_id = rs.firma_id
      AND o.rol IN ('utt','kd_utt')
      AND EXISTS (
        SELECT 1 FROM public.kullanicilar k
        WHERE k.kullanici_id = o.aktor_id
          AND k.firma_id = rs.firma_id
          AND k.aktif_mi = true
          AND k.rol IN ('utt','kd_utt')
      )
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = o.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['utt']::text[]
      )
    )
    OR (
      p_rapor_rolu = 'bm'
      AND o.firma_id = rs.firma_id
      AND o.rol = 'bm'
      AND EXISTS (
        SELECT 1 FROM public.kullanicilar k
        WHERE k.kullanici_id = o.aktor_id
          AND k.firma_id = rs.firma_id
          AND k.aktif_mi = true
          AND k.rol = 'bm'
      )
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = o.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['bm']::text[]
      )
    )
    OR (
      p_rapor_rolu = 'eczaci'
      AND o.firma_id = rs.firma_id
      AND o.rol IN ('eczaci','ikinci_eczaci','yardimci_eczaci')
      AND EXISTS (
        SELECT 1 FROM public.eclub_kisiler ek
        WHERE ek.kisi_id = o.aktor_id
          AND LOWER(ek.rol) IN ('eczaci','ikinci_eczaci','yardimci_eczaci')
      )
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = o.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['eczaci']::text[]
      )
    )
    OR (
      p_rapor_rolu = 'eczane_teknisyeni'
      AND o.firma_id = rs.firma_id
      AND o.rol = 'eczane_teknisyeni'
      AND EXISTS (
        SELECT 1 FROM public.eclub_kisiler ek
        WHERE ek.kisi_id = o.aktor_id
          AND LOWER(ek.rol) = 'eczane_teknisyeni'
      )
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = o.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['eczane_teknisyeni']::text[]
      )
    )
    OR (
      p_rapor_rolu = 'eczanem'
      AND o.firma_id = rs.firma_id
      AND o.rol = 'musteri'
      AND EXISTS (
        SELECT 1 FROM public.eczanem_musteriler em
        WHERE em.musteri_id = o.aktor_id
      )
      AND EXISTS (
        SELECT 1 FROM public.yayin_yonetimi yy
        WHERE yy.yayin_id = o.yayin_id
          AND COALESCE(yy.hedef_roller, ARRAY['utt']::text[]) && ARRAY['eczanem']::text[]
      )
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_yayin_raporlari_arac_performansi_v1(
  p_yonetici_id uuid,
  p_baslangic timestamptz,
  p_bitis timestamptz,
  p_rapor_rolu text DEFAULT 'tumu'
)
RETURNS TABLE (
  arac_turu text,
  yayin_sayisi bigint,
  kayitli_arac_puani bigint,
  baslatma bigint,
  tamamlama bigint,
  dogru_cevap bigint,
  yanlis_cevap bigint,
  kazanilan_puan bigint,
  kaybedilen_puan bigint,
  oneri_gonderildi bigint,
  oneri_tamamlandi bigint,
  challenge_gonderildi bigint,
  challenge_tamamlandi bigint,
  eclub_dagitim bigint,
  eclub_dagitim_tamamlandi bigint,
  eczanem_dagitim bigint,
  eczanem_dagitim_tamamlandi bigint,
  net_kazanilan_puan bigint,
  dogru_cevap_yuzdesi numeric,
  roller jsonb,
  etkilesim_yayin_sayisi bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $function$
WITH turler(sira, arac_turu) AS (
  VALUES (1,'video'::text), (2,'podcast'::text), (3,'gorsel'::text), (4,'flip_pdf'::text)
),
-- Aynı kaynak üzerinde genel toplam ve rol toplamları birlikte alınır.
-- Yeni yayın sayısında mevcut uygulamadaki satır sayımı korunur; DISTINCT eklenmez.
-- Etkileşim alan yayın sayısı ise mevcut Map gibi yayın kimliğine göre tekildir.
gruplar AS (
  SELECT
    k.arac_turu,
    k.rol,
    GROUPING(k.rol) AS genel_toplam,
    COUNT(*) FILTER (WHERE k.kaynak = 'yayin') AS yayin_sayisi,
    COALESCE(SUM(k.arac_puani) FILTER (WHERE k.kaynak = 'yayin'), 0)::bigint AS kayitli_arac_puani,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'baslatma'), 0)::bigint AS baslatma,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'tamamlama'), 0)::bigint AS tamamlama,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'dogru_cevap'), 0)::bigint AS dogru_cevap,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'yanlis_cevap'), 0)::bigint AS yanlis_cevap,
    COALESCE(SUM(k.puan) FILTER (WHERE k.olay_turu = 'kazanilan_puan'), 0)::bigint AS kazanilan_puan,
    COALESCE(SUM(k.puan) FILTER (WHERE k.olay_turu = 'kaybedilen_puan'), 0)::bigint AS kaybedilen_puan,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'oneri_gonderildi'), 0)::bigint AS oneri_gonderildi,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'oneri_tamamlandi'), 0)::bigint AS oneri_tamamlandi,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'challenge_gonderildi'), 0)::bigint AS challenge_gonderildi,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'challenge_tamamlandi'), 0)::bigint AS challenge_tamamlandi,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'eclub_dagitim'), 0)::bigint AS eclub_dagitim,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'eclub_dagitim_tamamlandi'), 0)::bigint AS eclub_dagitim_tamamlandi,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'eczanem_dagitim'), 0)::bigint AS eczanem_dagitim,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'eczanem_dagitim_tamamlandi'), 0)::bigint AS eczanem_dagitim_tamamlandi,
    COUNT(DISTINCT k.yayin_id) FILTER (WHERE k.kaynak = 'olay') AS etkilesim_yayin_sayisi,
    BOOL_OR(k.olay_turu IN ('baslatma','tamamlama','kazanilan_puan','kaybedilen_puan')) AS rol_metrigi_var
  FROM public.get_yayin_raporlari_arac_kaynagi_v1(
    p_yonetici_id, p_baslangic, p_bitis, p_rapor_rolu, NULL::text
  ) k
  GROUP BY GROUPING SETS ((k.arac_turu), (k.arac_turu, k.rol))
),
rol_json AS (
  SELECT
    g.arac_turu,
    jsonb_object_agg(g.rol, jsonb_build_object(
      'baslatma', g.baslatma,
      'tamamlama', g.tamamlama,
      'kazanilan_puan', g.kazanilan_puan,
      'kaybedilen_puan', g.kaybedilen_puan,
      'net_puan', g.kazanilan_puan - g.kaybedilen_puan
    )) AS roller
  FROM gruplar g
  WHERE g.genel_toplam = 0 AND g.rol_metrigi_var = true
  GROUP BY g.arac_turu
)
SELECT
  t.arac_turu,
  COALESCE(g.yayin_sayisi, 0)::bigint,
  COALESCE(g.kayitli_arac_puani, 0)::bigint,
  COALESCE(g.baslatma, 0)::bigint,
  COALESCE(g.tamamlama, 0)::bigint,
  COALESCE(g.dogru_cevap, 0)::bigint,
  COALESCE(g.yanlis_cevap, 0)::bigint,
  COALESCE(g.kazanilan_puan, 0)::bigint,
  COALESCE(g.kaybedilen_puan, 0)::bigint,
  COALESCE(g.oneri_gonderildi, 0)::bigint,
  COALESCE(g.oneri_tamamlandi, 0)::bigint,
  COALESCE(g.challenge_gonderildi, 0)::bigint,
  COALESCE(g.challenge_tamamlandi, 0)::bigint,
  COALESCE(g.eclub_dagitim, 0)::bigint,
  COALESCE(g.eclub_dagitim_tamamlandi, 0)::bigint,
  COALESCE(g.eczanem_dagitim, 0)::bigint,
  COALESCE(g.eczanem_dagitim_tamamlandi, 0)::bigint,
  (COALESCE(g.kazanilan_puan, 0) - COALESCE(g.kaybedilen_puan, 0))::bigint,
  CASE WHEN COALESCE(g.dogru_cevap, 0) + COALESCE(g.yanlis_cevap, 0) = 0 THEN NULL::numeric
    ELSE ROUND(1000::numeric * g.dogru_cevap / (g.dogru_cevap + g.yanlis_cevap)) / 10
  END,
  COALESCE(r.roller, '{}'::jsonb),
  COALESCE(g.etkilesim_yayin_sayisi, 0)::bigint
FROM turler t
LEFT JOIN gruplar g ON g.arac_turu = t.arac_turu AND g.genel_toplam = 1
LEFT JOIN rol_json r ON r.arac_turu = t.arac_turu
ORDER BY t.sira;
$function$;

CREATE OR REPLACE FUNCTION public.get_yayin_raporlari_arac_yayinlari_v1(
  p_yonetici_id uuid,
  p_baslangic timestamptz,
  p_bitis timestamptz,
  p_arac_turu text,
  p_rapor_rolu text DEFAULT 'tumu',
  p_sayfa_boyutu integer DEFAULT 50,
  p_son_yayin_id uuid DEFAULT NULL
)
RETURNS TABLE (
  yayin_id uuid,
  yayin_kodu text,
  talep_id uuid,
  talep_no integer,
  kayitli_arac_puani bigint,
  kazanilan_puan bigint,
  kaybedilen_puan bigint,
  baslatma bigint,
  tamamlama bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $function$
WITH sayfa AS (
  SELECT
    k.yayin_id,
    MIN(k.talep_id::text)::uuid AS talep_id,
    MIN(k.talep_no) AS talep_no,
    COALESCE(SUM(k.puan) FILTER (WHERE k.olay_turu = 'kazanilan_puan'), 0)::bigint AS kazanilan_puan,
    COALESCE(SUM(k.puan) FILTER (WHERE k.olay_turu = 'kaybedilen_puan'), 0)::bigint AS kaybedilen_puan,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'baslatma'), 0)::bigint AS baslatma,
    COALESCE(SUM(k.adet) FILTER (WHERE k.olay_turu = 'tamamlama'), 0)::bigint AS tamamlama
  FROM public.get_yayin_raporlari_arac_kaynagi_v1(
    p_yonetici_id, p_baslangic, p_bitis, p_rapor_rolu, p_arac_turu
  ) k
  WHERE k.kaynak = 'olay'
    AND p_arac_turu IN ('video','podcast','gorsel','flip_pdf')
    AND (p_son_yayin_id IS NULL OR k.yayin_id > p_son_yayin_id)
  GROUP BY k.yayin_id
  ORDER BY k.yayin_id
  LIMIT LEAST(200, GREATEST(1, COALESCE(p_sayfa_boyutu, 50)))
)
SELECT
  s.yayin_id,
  -- lib/utils/yayinKodu.ts ile aynı biçim: firma_adi + '_' + talep_no.
  CASE WHEN yd.firma_adi IS NULL OR yd.firma_adi = '' OR yd.talep_no IS NULL
    THEN '-'::text ELSE yd.firma_adi::text || '_' || yd.talep_no::text END,
  s.talep_id,
  s.talep_no,
  0::bigint, -- Mevcut etkileşim listesinde bu alan daima 0'dır; yeni yayın puanıyla karıştırılmaz.
  s.kazanilan_puan,
  s.kaybedilen_puan,
  s.baslatma,
  s.tamamlama
FROM sayfa s
LEFT JOIN LATERAL (
  SELECT d.firma_adi, d.talep_no
  FROM public.v_yayin_detay d
  WHERE d.yayin_id = s.yayin_id
  ORDER BY d.talep_no DESC NULLS LAST, d.firma_adi DESC NULLS LAST
  LIMIT 1
) yd ON true
ORDER BY s.yayin_id;
$function$;

-- Yetki kontrolü API'de, firma/üretici kapsamı fonksiyonlarda çözülür.
-- Fonksiyonlar doğrudan tarayıcıya açılmaz; mevcut admin istemcisi çağırır.
REVOKE ALL ON FUNCTION public.get_yayin_raporlari_arac_kaynagi_v1(uuid,timestamptz,timestamptz,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_yayin_raporlari_arac_performansi_v1(uuid,timestamptz,timestamptz,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_yayin_raporlari_arac_yayinlari_v1(uuid,timestamptz,timestamptz,text,text,integer,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_yayin_raporlari_arac_kaynagi_v1(uuid,timestamptz,timestamptz,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_yayin_raporlari_arac_performansi_v1(uuid,timestamptz,timestamptz,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_yayin_raporlari_arac_yayinlari_v1(uuid,timestamptz,timestamptz,text,text,integer,uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Kurulum kontrolü: başarı halinde üç alan da true döner. Rapor verisi sorgulanmaz.
SELECT
  to_regprocedure('public.get_yayin_raporlari_arac_kaynagi_v1(uuid,timestamptz,timestamptz,text,text)') IS NOT NULL AS ortak_kaynak_hazir,
  to_regprocedure('public.get_yayin_raporlari_arac_performansi_v1(uuid,timestamptz,timestamptz,text)') IS NOT NULL AS arac_ozetleri_hazir,
  to_regprocedure('public.get_yayin_raporlari_arac_yayinlari_v1(uuid,timestamptz,timestamptz,text,text,integer,uuid)') IS NOT NULL AS sayfali_yayin_listesi_hazir;
