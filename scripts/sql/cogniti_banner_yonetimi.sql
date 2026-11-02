-- Cogniti/firma bannerları aynı sayfanın mevcut sıralarını ve limitini paylaşır.
-- Görseller ve mevcut sıralamalar korunur. Yalnız kaynak bilgisi eklenir.
BEGIN;

ALTER TABLE public.eclub_firma_bannerlari
  ADD COLUMN IF NOT EXISTS kaynak text NOT NULL DEFAULT 'firma';
ALTER TABLE public.eczanem_sayfa_bannerlari
  ADD COLUMN IF NOT EXISTS kaynak text NOT NULL DEFAULT 'firma';

UPDATE public.eclub_firma_bannerlari SET kaynak = 'cogniti'
WHERE firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid AND kaynak = 'firma';
UPDATE public.eczanem_sayfa_bannerlari SET kaynak = 'cogniti'
WHERE firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid AND kaynak = 'firma';

ALTER TABLE public.eclub_firma_bannerlari DROP CONSTRAINT IF EXISTS eclub_banner_kaynak_check;
ALTER TABLE public.eclub_firma_bannerlari ADD CONSTRAINT eclub_banner_kaynak_check CHECK (kaynak IN ('firma','cogniti'));
ALTER TABLE public.eczanem_sayfa_bannerlari DROP CONSTRAINT IF EXISTS eczanem_banner_kaynak_check;
ALTER TABLE public.eczanem_sayfa_bannerlari ADD CONSTRAINT eczanem_banner_kaynak_check CHECK (kaynak IN ('firma','cogniti'));

CREATE OR REPLACE FUNCTION public.banner_kaynak_koruma()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $f$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.kaynak IS DISTINCT FROM OLD.kaynak THEN
    RAISE EXCEPTION 'Bannerın kaynağı değiştirilemez; diğer kaynağın bannerı korunur.' USING ERRCODE='23514';
  END IF;
  IF NEW.firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid AND NEW.kaynak <> 'cogniti' THEN
    RAISE EXCEPTION 'Ortak ana sayfa bannerları Cogniti kaynağıyla yönetilir.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$f$;
DROP TRIGGER IF EXISTS banner_kaynak_koruma ON public.eclub_firma_bannerlari;
CREATE TRIGGER banner_kaynak_koruma BEFORE INSERT OR UPDATE ON public.eclub_firma_bannerlari
FOR EACH ROW EXECUTE FUNCTION public.banner_kaynak_koruma();
DROP TRIGGER IF EXISTS banner_kaynak_koruma ON public.eczanem_sayfa_bannerlari;
CREATE TRIGGER banner_kaynak_koruma BEFORE INSERT OR UPDATE ON public.eczanem_sayfa_bannerlari
FOR EACH ROW EXECUTE FUNCTION public.banner_kaynak_koruma();

CREATE OR REPLACE FUNCTION public.admin_banner_kaydet(
  p_firma_id uuid, p_alan text, p_sira integer, p_dosya_yolu text,
  p_kaynak text, p_beklenen_yol text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
DECLARE
  v_limit integer;
  v_yol text;
  v_kaynak text;
  v_gorunur boolean;
  v_var boolean;
BEGIN
  IF p_firma_id IS NULL OR p_alan IS NULL OR p_alan NOT IN ('firma','uye-ana-sayfa','uyeler','uye-yayinlari','indirim-onayi')
    OR p_kaynak IS NULL OR p_kaynak NOT IN ('firma','cogniti')
    OR p_dosya_yolu IS NULL OR p_dosya_yolu = '' THEN
    RAISE EXCEPTION 'Geçersiz banner bilgileri.' USING ERRCODE='22023';
  END IF;
  IF p_firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid AND p_kaynak <> 'cogniti' THEN
    RAISE EXCEPTION 'Ortak bannerlar Cogniti kaynağıyla yönetilir.' USING ERRCODE='22023';
  END IF;
  v_limit := CASE WHEN p_firma_id = '15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid
    AND p_alan IN ('firma','uye-ana-sayfa') THEN 5 ELSE 3 END;
  IF p_sira IS NULL OR p_sira < 1 OR p_sira > v_limit THEN
    RAISE EXCEPTION 'Bu sayfanın banner limiti %; Cogniti ve firma bannerları birlikte sayılır.', v_limit USING ERRCODE='22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('banner:' || p_firma_id::text || ':' || p_alan, 0));
  IF p_alan = 'firma' THEN
    SELECT dosya_yolu, kaynak, gorunur INTO v_yol,v_kaynak,v_gorunur
    FROM public.eclub_firma_bannerlari WHERE firma_id=p_firma_id AND sira=p_sira FOR UPDATE;
  ELSE
    SELECT dosya_yolu, kaynak, gorunur INTO v_yol,v_kaynak,v_gorunur
    FROM public.eczanem_sayfa_bannerlari WHERE firma_id=p_firma_id AND alan=p_alan AND sira=p_sira FOR UPDATE;
  END IF;
  v_var := FOUND;
  IF v_var AND v_kaynak <> p_kaynak THEN
    RAISE EXCEPTION 'Bu banner alanı diğer kaynağa ait. Sayfayı yenileyin.' USING ERRCODE='40001';
  END IF;
  IF v_yol IS DISTINCT FROM p_beklenen_yol THEN
    RAISE EXCEPTION 'Banner işlem sırasında değişti. Sayfayı yenileyin.' USING ERRCODE='40001';
  END IF;
  v_gorunur := coalesce(v_gorunur,true);
  IF p_alan = 'firma' THEN
    INSERT INTO public.eclub_firma_bannerlari(firma_id,sira,dosya_yolu,gorunur,kaynak,updated_at)
    VALUES(p_firma_id,p_sira,p_dosya_yolu,v_gorunur,p_kaynak,now())
    ON CONFLICT(firma_id,sira) DO UPDATE SET dosya_yolu=EXCLUDED.dosya_yolu,updated_at=EXCLUDED.updated_at;
  ELSE
    INSERT INTO public.eczanem_sayfa_bannerlari(firma_id,alan,sira,dosya_yolu,gorunur,kaynak,updated_at)
    VALUES(p_firma_id,p_alan,p_sira,p_dosya_yolu,v_gorunur,p_kaynak,now())
    ON CONFLICT(firma_id,alan,sira) DO UPDATE SET dosya_yolu=EXCLUDED.dosya_yolu,updated_at=EXCLUDED.updated_at;
  END IF;
  RETURN jsonb_build_object('sira',p_sira,'gorunur',v_gorunur);
END;
$f$;
REVOKE ALL ON FUNCTION public.admin_banner_kaydet(uuid,text,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_banner_kaydet(uuid,text,integer,text,text,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_banner_yonetimi_hazir;
