-- UTT/BM hedefli yayınlarda TL karşılıklı / TL'siz puan.
-- Mevcut yayınlar ve puan kayıtları değiştirilmez; geçmiş oranlar uydurulmaz.
-- Performans/lig sorguları korunur. Yalnız FirmaStore bakiyesinden TL'siz
-- saha yayınlarının net puanı çıkarılır. UTT'de eski otomatik çekli işaretler
-- sipariş hakkı sayılmaz. Puan/TL oranı yayın üzerinde saklanır.
BEGIN;

-- E-Club varsayılanları saha için açık bir puan modeli seçimi değildir.
ALTER TABLE public.yayin_yonetimi ADD COLUMN IF NOT EXISTS saha_puan_modeli text;
ALTER TABLE public.yayin_yonetimi ALTER COLUMN saha_puan_modeli DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.tg_saha_yayin_puan_modeli()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.saha_puan_modeli IS DISTINCT FROM OLD.saha_puan_modeli
       OR (((COALESCE(OLD.hedef_roller, ARRAY[]::text[]) && ARRAY['utt','bm'])
         OR (COALESCE(NEW.hedef_roller, ARRAY[]::text[]) && ARRAY['utt','bm']))
       AND (NEW.cek_karsiligi_var_mi IS DISTINCT FROM OLD.cek_karsiligi_var_mi
         OR NEW.karsilik_puan IS DISTINCT FROM OLD.karsilik_puan
         OR NEW.karsilik_tl IS DISTINCT FROM OLD.karsilik_tl
         OR NEW.hedef_roller IS DISTINCT FROM OLD.hedef_roller)) THEN
      RAISE EXCEPTION 'Yayımlanmış UTT/BM içeriğinin puan modeli ve dönüşüm oranı değiştirilemez.';
    END IF;
    RETURN NEW;
  END IF;

  IF COALESCE(cardinality(NEW.hedef_roller), 0) = 0
     OR NOT (NEW.hedef_roller <@ ARRAY['utt','bm']::text[]) THEN
    IF NEW.saha_puan_modeli IS NOT NULL THEN
      RAISE EXCEPTION 'Saha puan modeli yalnız UTT/BM hedefli yayınlarda kullanılabilir.';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.saha_puan_modeli IS NULL OR NEW.saha_puan_modeli NOT IN ('tl_karsilikli','tlsiz') THEN
    RAISE EXCEPTION 'UTT/BM yayını için açık saha puan modeli seçimi zorunludur.';
  END IF;
  IF NEW.cek_karsiligi_var_mi IS DISTINCT FROM (NEW.saha_puan_modeli = 'tl_karsilikli') THEN
    RAISE EXCEPTION 'Saha puan modeli ile çek karşılığı bilgisi uyuşmuyor.';
  END IF;
  IF NEW.cek_karsiligi_var_mi IS NULL THEN
    RAISE EXCEPTION 'UTT/BM yayını için puan modeli zorunludur.';
  END IF;
  IF NEW.satis_sarti_tipi IS NOT NULL OR NEW.gizli_sart_katlama_orani IS NOT NULL
     OR NEW.barem_tablosu IS NOT NULL THEN
    RAISE EXCEPTION 'UTT/BM yayınında E-Club sipariş veya barem koşulları bulunamaz.';
  END IF;
  IF NEW.cek_karsiligi_var_mi THEN
    IF NEW.karsilik_puan IS NULL OR NEW.karsilik_puan <= 0
       OR NEW.karsilik_tl IS NULL OR NEW.karsilik_tl <= 0
       OR NEW.karsilik_tl::text IN ('NaN', 'Infinity', '-Infinity') THEN
      RAISE EXCEPTION 'TL karşılıklı yayında pozitif puan ve TL karşılığı zorunludur.';
    END IF;
  ELSIF NEW.karsilik_puan IS NOT NULL OR NEW.karsilik_tl IS NOT NULL THEN
    RAISE EXCEPTION 'TL’siz yayında puan–TL karşılığı bulunamaz.';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.tg_saha_yayin_puan_modeli() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_saha_yayin_puan_modeli ON public.yayin_yonetimi;
CREATE TRIGGER trg_saha_yayin_puan_modeli
BEFORE INSERT OR UPDATE ON public.yayin_yonetimi
FOR EACH ROW EXECUTE FUNCTION public.tg_saha_yayin_puan_modeli();

-- Kurulu bakiye fonksiyonunun dönem ve harcama/iade hesabı aynen korunur.
-- Güncel gövde beklenen RETURN sözleşmesinde değilse tüm kurulum geri alınır.
DO $bakiye$
DECLARE
  v_kaynak text;
  v_eski constant text := 'RETURN v_kazanim - v_kayip - v_harcama + v_iade;';
BEGIN
  v_kaynak := pg_get_functiondef('public.get_harcama_bakiyesi_tarihli(uuid,timestamp with time zone)'::regprocedure);
  IF strpos(v_kaynak, '-- saha-tlsiz-net-puan-ayrimi') > 0
     OR strpos(v_kaynak, '-- utt-acik-secim-siparis-puani') > 0 THEN RETURN; END IF;
  IF strpos(v_kaynak, v_eski) = 0 THEN
    RAISE EXCEPTION 'FirmaStore bakiye hesabı beklenen yapıda değil; hiçbir değişiklik uygulanmadı.';
  END IF;
  v_kaynak := replace(v_kaynak, v_eski, $patch$
  -- utt-acik-secim-siparis-puani
  -- Lig/performance tüm puanları görür. Mağazada TL'siz net kazanım harcanmaz.
  -- Kaybı da çıkarılan kazançla birlikte ayır: iki kez kesinti oluşmasın.
  RETURN v_kazanim - v_kayip - v_harcama + v_iade + COALESCE((
    SELECT SUM(x.duzeltme)::integer
    FROM (
      SELECT -p.puan AS duzeltme, p.yayin_id, p.created_at
      FROM public.kazanilan_puanlar p
      WHERE v_rol IN ('utt','kd_utt') AND p.kullanici_id = p_kullanici_id
        AND p.puan_turu IN ('izleme','cevaplama','oneri','extra')
      UNION ALL
      SELECT p.kaybedilen_puan, p.yayin_id, p.created_at
      FROM public.ileri_sarma_kayitlari p
      WHERE v_rol IN ('utt','kd_utt') AND p.kullanici_id = p_kullanici_id
      UNION ALL
      SELECT p.kaybedilen_puan, p.yayin_id, p.created_at
      FROM public.yanlis_cevap_kayitlari p
      WHERE v_rol IN ('utt','kd_utt') AND p.kullanici_id = p_kullanici_id
      UNION ALL
      SELECT p.kaybedilen_puan, p.yayin_id, p.created_at
      FROM public.oneri_kayip_kayitlari p
      WHERE v_rol IN ('utt','kd_utt') AND p.kullanici_id = p_kullanici_id
      UNION ALL
      SELECT -p.puan, p.yayin_id, p.created_at
      FROM public.cc_kazanilan_puanlar p
      WHERE v_rol = 'bm' AND p.bm_id = p_kullanici_id
        AND p.puan_turu IN ('izleme','cevaplama','extra','cc_gonderme','cc_referral')
      UNION ALL
      SELECT p.kaybedilen_puan, p.yayin_id, p.created_at
      FROM public.cc_ileri_sarma_kayitlari p
      WHERE v_rol = 'bm' AND p.bm_id = p_kullanici_id
      UNION ALL
      SELECT p.kaybedilen_puan, p.yayin_id, p.created_at
      FROM public.cc_yanlis_cevap_kayitlari p
      WHERE v_rol = 'bm' AND p.bm_id = p_kullanici_id
      UNION ALL
      SELECT p.kaybedilen_puan, p.yayin_id, p.created_at
      FROM public.challenge_kayip_kayitlari p
      WHERE v_rol = 'bm' AND p.kullanici_id = p_kullanici_id
    ) x
    JOIN public.yayin_yonetimi y ON y.yayin_id = x.yayin_id
    WHERE (y.cek_karsiligi_var_mi = false
      OR (v_rol IN ('utt','kd_utt') AND y.saha_puan_modeli IS DISTINCT FROM 'tl_karsilikli'))
      AND y.hedef_roller && ARRAY['utt','bm']::text[]
      AND x.created_at >= v_kazanim_bas AND x.created_at < v_kazanim_bit
  ), 0);
$patch$);
  EXECUTE v_kaynak;
END;
$bakiye$;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT true AS saha_yayin_puan_tl_modeli_hazir;
