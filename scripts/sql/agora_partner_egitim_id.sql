-- Tamamını tek parça çalıştırın. İlk firma 10, ikinci 20; eğitim 001–999.
-- Mevcut ilk firma hapbilgi; mevcut yayındaki ilk eğitim PE-10001 olur.
-- UUID ilişkileri korunur; partner_egitim_id kart/tablo için kısa koddur.
BEGIN;
LOCK TABLE public.agora_is_partnerleri,public.agora_partner_profilleri,public.agora_partner_egitimleri IN ACCESS EXCLUSIVE MODE;
CREATE TABLE IF NOT EXISTS public.agora_partner_firma_sayaci (
 tekil boolean PRIMARY KEY DEFAULT true CHECK(tekil),son_firma_no bigint NOT NULL DEFAULT 0 CHECK(son_firma_no>=0 AND son_firma_no%10=0)
);
INSERT INTO public.agora_partner_firma_sayaci(tekil) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.agora_partner_egitim_sayaclari (
 partner_id uuid PRIMARY KEY REFERENCES public.agora_is_partnerleri(partner_id),
 firma_no bigint NOT NULL UNIQUE CHECK(firma_no>0 AND firma_no%10=0),
 son_egitim_sirasi integer NOT NULL DEFAULT 0 CHECK(son_egitim_sirasi BETWEEN 0 AND 999)
);
ALTER TABLE public.agora_partner_firma_sayaci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_partner_egitim_sayaclari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_partner_firma_sayaci,public.agora_partner_egitim_sayaclari FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.agora_partner_egitimleri ADD COLUMN IF NOT EXISTS partner_egitim_id text;

CREATE OR REPLACE FUNCTION public.agora_partner_firma_no_ayir(p_partner uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE n bigint;
BEGIN
 SELECT firma_no INTO n FROM public.agora_partner_egitim_sayaclari WHERE partner_id=p_partner;
 IF FOUND THEN RETURN n; END IF;
 PERFORM 1 FROM public.agora_partner_firma_sayaci WHERE tekil=true FOR UPDATE;
 SELECT firma_no INTO n FROM public.agora_partner_egitim_sayaclari WHERE partner_id=p_partner;
 IF FOUND THEN RETURN n; END IF;
 UPDATE public.agora_partner_firma_sayaci SET son_firma_no=son_firma_no+10 WHERE tekil=true RETURNING son_firma_no INTO n;
 INSERT INTO public.agora_partner_egitim_sayaclari(partner_id,firma_no) VALUES(p_partner,n);
 RETURN n;
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_egitim_kodu_ayir(p_partner uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE n bigint; s integer;
BEGIN
 n:=public.agora_partner_firma_no_ayir(p_partner);
 UPDATE public.agora_partner_egitim_sayaclari SET son_egitim_sirasi=son_egitim_sirasi+1
 WHERE partner_id=p_partner AND son_egitim_sirasi<999 RETURNING son_egitim_sirasi INTO s;
 IF NOT FOUND THEN RAISE EXCEPTION 'Bu partner için 999 eğitim üst sınırına ulaşıldı.' USING ERRCODE='23514'; END IF;
 RETURN 'PE-'||n::text||lpad(s::text,3,'0');
END;
$f$;

DO $m$
DECLARE v_partner record; v_egitim record;
BEGIN
 -- İlk kurulumda mevcut test firması önce numaralanır; tekrar çalıştırmada değişmez.
 FOR v_partner IN SELECT p.partner_id FROM public.agora_is_partnerleri p JOIN public.agora_partner_profilleri f USING(partner_id)
  ORDER BY CASE WHEN p.eposta='ali@testpartner.com' AND lower(f.sirket_adi)='hapbilgi' THEN 0 ELSE 1 END,p.olusturuldu_at,p.partner_id LOOP
  PERFORM public.agora_partner_firma_no_ayir(v_partner.partner_id);
 END LOOP;
 -- Önce halen yayındaki eğitimler; silinmiş kayıtların kodları da korunur/tekrar kullanılmaz.
 FOR v_egitim IN SELECT egitim_id,partner_id FROM public.agora_partner_egitimleri WHERE partner_egitim_id IS NULL
  ORDER BY partner_id,CASE WHEN silindi_at IS NULL AND durum='yayinda' THEN 0 WHEN silindi_at IS NULL THEN 1 ELSE 2 END,olusturuldu_at,egitim_id LOOP
  UPDATE public.agora_partner_egitimleri SET partner_egitim_id=public.agora_partner_egitim_kodu_ayir(v_egitim.partner_id) WHERE egitim_id=v_egitim.egitim_id;
 END LOOP;
END;
$m$;
ALTER TABLE public.agora_partner_egitimleri ALTER COLUMN partner_egitim_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS agora_partner_egitim_kodu_tekil ON public.agora_partner_egitimleri(partner_egitim_id);

CREATE OR REPLACE FUNCTION public.agora_partner_firma_kod_tetikleyici()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM public.agora_partner_firma_no_ayir(NEW.partner_id);
 RETURN NEW;
END;
$f$;
CREATE OR REPLACE FUNCTION public.agora_partner_egitim_kod_tetikleyici()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE eski_kod text;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.partner_id IS DISTINCT FROM OLD.partner_id OR NEW.partner_egitim_id IS DISTINCT FROM OLD.partner_egitim_id THEN
   RAISE EXCEPTION 'Partner eğitim kimliği değiştirilemez.';
  END IF;
  RETURN NEW;
 END IF;
 -- Aynı oluşturma isteğinin tekrarı yeni sıra tüketmez; mevcut ON CONFLICT davranışı korunur.
 PERFORM 1 FROM public.agora_partner_egitim_sayaclari WHERE partner_id=NEW.partner_id FOR UPDATE;
 SELECT partner_egitim_id INTO eski_kod FROM public.agora_partner_egitimleri WHERE partner_id=NEW.partner_id AND olusturma_istegi=NEW.olusturma_istegi;
 IF FOUND THEN NEW.partner_egitim_id:=eski_kod;
 ELSE NEW.partner_egitim_id:=public.agora_partner_egitim_kodu_ayir(NEW.partner_id); END IF;
 RETURN NEW;
END;
$f$;
DROP TRIGGER IF EXISTS agora_partner_firma_kodu ON public.agora_partner_profilleri;
CREATE TRIGGER agora_partner_firma_kodu AFTER INSERT ON public.agora_partner_profilleri FOR EACH ROW EXECUTE FUNCTION public.agora_partner_firma_kod_tetikleyici();
DROP TRIGGER IF EXISTS agora_partner_egitim_kodu ON public.agora_partner_egitimleri;
CREATE TRIGGER agora_partner_egitim_kodu BEFORE INSERT OR UPDATE ON public.agora_partner_egitimleri FOR EACH ROW EXECUTE FUNCTION public.agora_partner_egitim_kod_tetikleyici();
REVOKE ALL ON FUNCTION public.agora_partner_firma_no_ayir(uuid),public.agora_partner_egitim_kodu_ayir(uuid),public.agora_partner_firma_kod_tetikleyici(),public.agora_partner_egitim_kod_tetikleyici() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
SELECT f.sirket_adi,e.partner_egitim_id AS "ID",e.egitim_adi,e.durum
FROM public.agora_partner_egitimleri e JOIN public.agora_partner_profilleri f USING(partner_id)
WHERE e.silindi_at IS NULL ORDER BY e.partner_egitim_id;
