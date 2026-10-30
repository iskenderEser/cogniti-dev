-- Viva eğitim türü ve ilgili ürün. Kullanıcı Supabase SQL Editor'da çalıştırır.
-- Mevcut etkinliklere tür/ürün atanmaz; tüketim ve davet kayıtları değiştirilmez.
-- Önkoşul: Viva anlık/planlı etkinlik ve mevcut davet kurulumu.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('viva-egitim-urun-v1'));
ALTER TABLE public.viva_etkinlikler ADD COLUMN IF NOT EXISTS egitim_turu text;
ALTER TABLE public.viva_etkinlikler ADD COLUMN IF NOT EXISTS urun_id uuid REFERENCES public.urunler(urun_id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.viva_etkinlikler'::regclass AND conname='viva_egitim_urun_kurali') THEN
  ALTER TABLE public.viva_etkinlikler ADD CONSTRAINT viva_egitim_urun_kurali CHECK (
   (egitim_turu IS NULL AND urun_id IS NULL) OR
   (egitim_turu IS NOT NULL AND egitim_turu IN ('urun_egitimi','urun_medikal_egitim','medikal_egitim','satis_teknikleri','yonetim_egitimi','ik_egitimi')
    AND (egitim_turu NOT IN ('urun_egitimi','urun_medikal_egitim') OR urun_id IS NOT NULL))
  );
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.viva_urun_firma_dogrula() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.urun_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.urunler u WHERE u.urun_id=NEW.urun_id AND u.firma_id=NEW.firma_id
 ) THEN RAISE EXCEPTION 'Seçilen ürün firmanıza ait değil.' USING ERRCODE='22023'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_viva_urun_firma ON public.viva_etkinlikler;
CREATE TRIGGER trg_viva_urun_firma BEFORE INSERT OR UPDATE OF urun_id,firma_id ON public.viva_etkinlikler
 FOR EACH ROW EXECUTE FUNCTION public.viva_urun_firma_dogrula();
REVOKE ALL ON FUNCTION public.viva_urun_firma_dogrula() FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.viva_egitim_urunleri(p_auth uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid; sonuc jsonb;
BEGIN
 IF p_auth IS NULL OR NOT public.viva_duzenleyen_aktif(p_auth) THEN
  RAISE EXCEPTION 'Etkinlik yönetme yetkiniz yok.' USING ERRCODE='42501';
 END IF;
 SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id=p_auth;
 SELECT coalesce(jsonb_agg(jsonb_build_object('urun_id',u.urun_id,'urun_adi',u.urun_adi) ORDER BY u.urun_adi,u.urun_id),'[]'::jsonb)
 INTO sonuc FROM public.urunler u WHERE u.firma_id=v_firma;
 RETURN sonuc;
END $$;
REVOKE ALL ON FUNCTION public.viva_egitim_urunleri(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_egitim_urunleri(uuid) TO service_role;

-- Mevcut kaydetme işlevindeki anlık/planlı zaman, sürüm, davet ve idempotensi
-- kontrolleri korunur; yalnız eğitim/ürün doğrulaması ve kolonları eklenir.
DO $patch$
DECLARE kaynak text; d record;
BEGIN
 kaynak:=pg_get_functiondef('public.viva_islem(uuid,text,jsonb)'::regprocedure);
 IF strpos(kaynak,'-- viva-egitim-urun-v1')=0 THEN
  FOR d IN SELECT * FROM (VALUES
   ($old$IF p_islem IN ('olustur','kaydet') THEN$old$,
    $new$IF p_islem IN ('olustur','kaydet') THEN
 -- viva-egitim-urun-v1
 IF coalesce(p_veri->>'egitim_turu','') NOT IN ('urun_egitimi','urun_medikal_egitim','medikal_egitim','satis_teknikleri','yonetim_egitimi','ik_egitimi') THEN
  RAISE EXCEPTION 'Eğitim türünü seçin.' USING ERRCODE='22023';
 END IF;
 IF p_veri->>'egitim_turu' IN ('urun_egitimi','urun_medikal_egitim') AND nullif(p_veri->>'urun_id','') IS NULL THEN
  RAISE EXCEPTION 'Bu eğitim türünde ilgili ürün seçimi zorunludur.' USING ERRCODE='22023';
 END IF;
 IF nullif(p_veri->>'urun_id','') IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM public.urunler u WHERE u.urun_id=(p_veri->>'urun_id')::uuid AND u.firma_id=s.firma_id
 ) THEN RAISE EXCEPTION 'Seçilen ürün firmanıza ait değil.' USING ERRCODE='22023'; END IF;$new$),
   ($old$INSERT INTO viva_etkinlikler(etkinlik_id,sahip_id,firma_id,baslik,aciklama,baslangic,bitis,durum,olusturma_ozeti)$old$,
    $new$INSERT INTO viva_etkinlikler(etkinlik_id,sahip_id,firma_id,baslik,aciklama,baslangic,bitis,durum,egitim_turu,urun_id,olusturma_ozeti)$new$),
   ($old$VALUES(id,p_auth,s.firma_id,btrim(p_veri->>'baslik'),coalesce(p_veri->>'aciklama',''),bas,bit,v_durum,p_veri);$old$,
    $new$VALUES(id,p_auth,s.firma_id,btrim(p_veri->>'baslik'),coalesce(p_veri->>'aciklama',''),bas,bit,v_durum,p_veri->>'egitim_turu',nullif(p_veri->>'urun_id','')::uuid,p_veri);$new$),
   ($old$UPDATE viva_etkinlikler SET baslik=btrim(p_veri->>'baslik'),aciklama=coalesce(p_veri->>'aciklama',''),baslangic=bas,bitis=bit,$old$,
    $new$UPDATE viva_etkinlikler SET egitim_turu=p_veri->>'egitim_turu',urun_id=nullif(p_veri->>'urun_id','')::uuid,baslik=btrim(p_veri->>'baslik'),aciklama=coalesce(p_veri->>'aciklama',''),baslangic=bas,bitis=bit,$new$)
  ) AS degisim(eski,yeni) LOOP
   IF (length(kaynak)-length(replace(kaynak,d.eski,'')))/length(d.eski)<>1 THEN
    RAISE EXCEPTION 'Viva kaydetme işlevinin yapısı beklenenden farklı; kurulum uygulanmadı.';
   END IF;
   kaynak:=replace(kaynak,d.eski,d.yeni);
  END LOOP;
  EXECUTE kaynak;
 END IF;
 kaynak:=pg_get_functiondef('public.viva_ozet(uuid,uuid)'::regprocedure);
 IF strpos(kaynak,'''egitim_turu'',e.egitim_turu')=0 THEN
  IF (length(kaynak)-length(replace(kaynak,'''aciklama'',e.aciklama,','')))/length('''aciklama'',e.aciklama,')<>1 THEN
   RAISE EXCEPTION 'Viva özet işlevinin yapısı beklenenden farklı; kurulum uygulanmadı.';
  END IF;
  kaynak:=replace(kaynak,'''aciklama'',e.aciklama,',
   $new$'aciklama',e.aciklama,'egitim_turu',e.egitim_turu,'urun_id',e.urun_id,
   'urun_adi',(SELECT u.urun_adi FROM public.urunler u WHERE u.urun_id=e.urun_id AND u.firma_id=e.firma_id),$new$);
  EXECUTE kaynak;
 END IF;

 -- Kurulu token raporuna da ürün adı bağlanır; ikinci bir SQL gerekmez.
 IF to_regprocedure('public.cogniti_token_detay_raporu_filtreli(uuid,integer,text,text)') IS NOT NULL THEN
  kaynak:=pg_get_functiondef('public.cogniti_token_detay_raporu_filtreli(uuid,integer,text,text)'::regprocedure);
  IF strpos(kaynak,'u.urun_id=ve.urun_id')=0 THEN
   IF strpos(kaynak,$old$CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN NULL ELSE y.urun_adi END AS urun$old$)=0 THEN
    RAISE EXCEPTION 'Token detay raporunun yapısı beklenenden farklı; kurulum uygulanmadı.';
   END IF;
   kaynak:=replace(kaynak,
    $old$CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN NULL ELSE y.urun_adi END AS urun$old$,
    $new$CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN
     (SELECT u.urun_adi FROM public.urunler u WHERE u.urun_id=ve.urun_id AND u.firma_id=t.firma_id)
     ELSE y.urun_adi END AS urun$new$);
   EXECUTE kaynak;
  END IF;
 END IF;
END $patch$;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.viva_egitim_urunleri(uuid)') IS NOT NULL AS viva_egitim_urun_bagi_kuruldu;
