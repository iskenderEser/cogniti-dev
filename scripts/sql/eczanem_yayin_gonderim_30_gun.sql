-- KULLANICI ÇALIŞTIRACAK. Yalnız Eczanem dağıtımı için PM çıkışından itibaren 30×24 saat.
-- PM ailesi: pm, jr_pm, kd_pm. Çıkış anındaki üretici/rol kaydedilir.
-- Token bloklama/tüketim altyapısını değiştirmez. Önceden teslim edilmiş yayınların izlenme/puan hakkını değiştirmez.
-- Mevcut yayınların başlangıcı ilk turdan; yoksa kayıtlı yayın tarihinden alınır. Kurulum günü yeni 30 gün tanımlanmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eczanem-yayin-gonderim-30-gun',0));
CREATE TABLE IF NOT EXISTS public.eczanem_yayin_gonderim_sureleri (
 yayin_id uuid PRIMARY KEY REFERENCES public.yayin_yonetimi(yayin_id) ON DELETE CASCADE,
 baslangic_at timestamptz NOT NULL CHECK(isfinite(baslangic_at)),
 created_at timestamptz NOT NULL DEFAULT statement_timestamp()
);
ALTER TABLE public.eczanem_yayin_gonderim_sureleri
 ADD COLUMN IF NOT EXISTS uretici_id uuid REFERENCES public.kullanicilar(kullanici_id),
 ADD COLUMN IF NOT EXISTS uretici_rol text;
-- Önceden kurulmuş süreler korunur; yalnız eksik kaynak kimliği tamamlanır.
-- Geçmiş çıkış rolü ayrı kaydedilmediği için mevcut üretici rolüyle eşlenir.
UPDATE public.eczanem_yayin_gonderim_sureleri s SET uretici_id=y.uretici_id,uretici_rol=lower(btrim(k.rol))
 FROM public.yayin_yonetimi y JOIN public.kullanicilar k ON k.kullanici_id=y.uretici_id
 WHERE s.yayin_id=y.yayin_id AND s.uretici_id IS NULL AND s.uretici_rol IS NULL;
ALTER TABLE public.eczanem_yayin_gonderim_sureleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eczanem_yayin_gonderim_sureleri FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.eczanem_yayin_gonderim_sureleri TO service_role;
DROP POLICY IF EXISTS eczanem_sure_sunucu_okuma ON public.eczanem_yayin_gonderim_sureleri;
CREATE POLICY eczanem_sure_sunucu_okuma ON public.eczanem_yayin_gonderim_sureleri FOR SELECT TO service_role USING (true);

CREATE OR REPLACE FUNCTION public.eczanem_yayin_ilk_cikis_zamanini_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE ilk timestamptz; kaynak_rol text;
BEGIN
 SELECT lower(btrim(rol)) INTO kaynak_rol FROM public.kullanicilar WHERE kullanici_id=NEW.uretici_id;
 -- Diğer kaynakların çıkış kimliği de sabitlenir; bu onlara dağıtım hakkı vermez.
 -- Böylece sonradan PM rolü verilmesi eski yayını PM çıkışlı yapmaz.
 IF NEW.durum='yayinda' AND coalesce(NEW.hedef_roller,ARRAY[]::text[]) @> ARRAY['eczanem']::text[] THEN
  SELECT min(baslangic_tarihi) INTO ilk FROM public.yayin_tekrar_kayitlari WHERE yayin_id=NEW.yayin_id AND tur_no=1;
  ilk:=least(coalesce(ilk,NEW.yayin_tarihi,statement_timestamp()),statement_timestamp());
  INSERT INTO public.eczanem_yayin_gonderim_sureleri(yayin_id,baslangic_at,uretici_id,uretici_rol) VALUES(NEW.yayin_id,ilk,NEW.uretici_id,kaynak_rol)
   ON CONFLICT(yayin_id) DO NOTHING;
 END IF;
 RETURN NEW;
END;
$f$;
REVOKE ALL ON FUNCTION public.eczanem_yayin_ilk_cikis_zamanini_kaydet() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_eczanem_yayin_ilk_cikis_zamani ON public.yayin_yonetimi;
CREATE TRIGGER trg_eczanem_yayin_ilk_cikis_zamani AFTER INSERT OR UPDATE OF durum,yayin_tarihi,hedef_roller,uretici_id ON public.yayin_yonetimi
 FOR EACH ROW EXECUTE FUNCTION public.eczanem_yayin_ilk_cikis_zamanini_kaydet();

-- Yayına hiç çıkmamış planlarda başlangıç, ilk gerçek aktivasyonda kaydedilir.
INSERT INTO public.eczanem_yayin_gonderim_sureleri(yayin_id,baslangic_at,uretici_id,uretici_rol)
 SELECT y.yayin_id,least(coalesce(t.ilk,y.yayin_tarihi),statement_timestamp()),y.uretici_id,lower(btrim(k.rol))
 FROM public.yayin_yonetimi y
 JOIN public.kullanicilar k ON k.kullanici_id=y.uretici_id
 LEFT JOIN LATERAL(SELECT min(baslangic_tarihi) AS ilk FROM public.yayin_tekrar_kayitlari WHERE yayin_id=y.yayin_id AND tur_no=1) t ON true
 WHERE coalesce(y.hedef_roller,ARRAY[]::text[]) @> ARRAY['eczanem']::text[]
  AND y.durum IN ('yayinda','Durduruldu') AND coalesce(t.ilk,y.yayin_tarihi) IS NOT NULL
 ON CONFLICT(yayin_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.eczanem_yayin_gonderim_suresini_koru()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE baslangic timestamptz; yayin_durum text; kaynak_rol text; kaynak_id uuid; yayin_uretici uuid; hedefler text[];
BEGIN
 SELECT s.baslangic_at,y.durum,s.uretici_rol,s.uretici_id,y.uretici_id,y.hedef_roller INTO baslangic,yayin_durum,kaynak_rol,kaynak_id,yayin_uretici,hedefler
 FROM public.eczanem_yayin_gonderim_sureleri s JOIN public.yayin_yonetimi y USING(yayin_id)
 WHERE s.yayin_id=NEW.yayin_id FOR SHARE OF s,y;
 IF kaynak_rol IS NULL OR kaynak_rol NOT IN ('pm','jr_pm','kd_pm') OR kaynak_id IS NULL
  OR kaynak_id IS DISTINCT FROM yayin_uretici OR NOT (coalesce(hedefler,ARRAY[]::text[]) @> ARRAY['eczanem']::text[]) THEN
  RAISE EXCEPTION 'ECZANEM_GONDERIM:pm_kaynagi_dogrulanamadi' USING ERRCODE='P0001';
 END IF;
 IF baslangic IS NULL THEN
  RAISE EXCEPTION 'ECZANEM_GONDERIM:sure_dogrulanamadi' USING ERRCODE='P0001';
 END IF;
 IF yayin_durum IS DISTINCT FROM 'yayinda' THEN
  RAISE EXCEPTION 'ECZANEM_GONDERIM:yayin_kapali' USING ERRCODE='P0001';
 END IF;
 -- Kilit beklenmiş olsa bile gerçek işlem anında süre kontrol edilir. Tam sınırda gönderim kapalıdır.
 IF clock_timestamp()<baslangic OR clock_timestamp()>=baslangic+interval '720 hours' THEN
  RAISE EXCEPTION 'ECZANEM_GONDERIM:sure_doldu' USING ERRCODE='P0001';
 END IF;
 RETURN NEW;
END;
$f$;
REVOKE ALL ON FUNCTION public.eczanem_yayin_gonderim_suresini_koru() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_eczanem_eczane_gonderim_suresi ON public.eczanem_eczane_gonderimleri;
CREATE TRIGGER trg_eczanem_eczane_gonderim_suresi BEFORE INSERT ON public.eczanem_eczane_gonderimleri
 FOR EACH ROW EXECUTE FUNCTION public.eczanem_yayin_gonderim_suresini_koru();
DROP TRIGGER IF EXISTS trg_eczanem_danisan_gonderim_suresi ON public.eczanem_gonderimler;
CREATE TRIGGER trg_eczanem_danisan_gonderim_suresi BEFORE INSERT ON public.eczanem_gonderimler
 FOR EACH ROW EXECUTE FUNCTION public.eczanem_yayin_gonderim_suresini_koru();
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eczanem_yayin_gonderim_30_gun_kuruldu;
