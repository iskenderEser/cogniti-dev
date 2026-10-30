-- Viva: İK seçeneği yerine Genel. Kullanıcı Supabase SQL Editor'da çalıştırır.
-- Eski İK kayıtları değiştirilmez; yeni seçimlerde Genel ayrı değerle kaydedilir.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('viva-genel-etkinlik-turu'));
ALTER TABLE public.viva_etkinlikler DROP CONSTRAINT IF EXISTS viva_egitim_urun_kurali;
ALTER TABLE public.viva_etkinlikler ADD CONSTRAINT viva_egitim_urun_kurali CHECK (
 (egitim_turu IS NULL AND urun_id IS NULL) OR
 (egitim_turu IS NOT NULL AND egitim_turu IN ('urun_egitimi','urun_medikal_egitim','medikal_egitim','satis_teknikleri','yonetim_egitimi','ik_egitimi','genel')
  AND (egitim_turu NOT IN ('urun_egitimi','urun_medikal_egitim') OR urun_id IS NOT NULL))
);
DO $patch$
DECLARE kaynak text; eski text:=$old$IF coalesce(p_veri->>'egitim_turu','') NOT IN ('urun_egitimi','urun_medikal_egitim','medikal_egitim','satis_teknikleri','yonetim_egitimi','ik_egitimi') THEN$old$;
BEGIN
 kaynak:=pg_get_functiondef('public.viva_islem(uuid,text,jsonb)'::regprocedure);
 IF strpos(kaynak,'-- viva-genel-etkinlik-v1')=0 THEN
  IF (length(kaynak)-length(replace(kaynak,eski,'')))/length(eski)<>1 THEN
   RAISE EXCEPTION 'Viva etkinlik türü doğrulaması beklenenden farklı; kurulum uygulanmadı.';
  END IF;
  kaynak:=replace(kaynak,eski,$new$-- viva-genel-etkinlik-v1
 IF coalesce(p_veri->>'egitim_turu','') NOT IN ('urun_egitimi','urun_medikal_egitim','medikal_egitim','satis_teknikleri','yonetim_egitimi','genel') THEN$new$);
  kaynak:=replace(kaynak,'Eğitim türünü seçin.','Etkinlik türünü seçin.');
  EXECUTE kaynak;
 END IF;
END $patch$;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT strpos(pg_get_functiondef('public.viva_islem(uuid,text,jsonb)'::regprocedure),'-- viva-genel-etkinlik-v1')>0 AS viva_genel_etkinlik_turu_kuruldu;
