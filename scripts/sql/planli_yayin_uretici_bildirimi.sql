-- scripts/sql/planli_yayin_uretici_bildirimi.sql
--
-- Planlı yayın (Video, Podcast, Görsel, Flip PDF) zamanı gelip otomatik olarak
-- yayına alındığında (p_yayin_id IS NULL), hedef alıcıların yanı sıra yayının
-- üreticisine de (y.uretici_id) yayın açılış bildirimi oluşturur.

BEGIN;

CREATE OR REPLACE FUNCTION public.yayin_planlananlari_aktive(p_yayin_id uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE aktive_sayisi integer:=0; y record; v_tarih timestamptz; v_urun_adi text;
BEGIN
 FOR y IN
  SELECT yayin_id,uretici_id,hedef_roller,yayin_tarihi FROM public.yayin_yonetimi
  WHERE durum='planlandi' AND ((p_yayin_id IS NULL AND yayin_tarihi<=now()) OR yayin_id=p_yayin_id)
  ORDER BY yayin_id FOR UPDATE SKIP LOCKED
 LOOP
  BEGIN
   v_tarih:=least(y.yayin_tarihi,now());
   UPDATE public.yayin_yonetimi SET durum='yayinda',yayin_tarihi=v_tarih WHERE yayin_id=y.yayin_id;
   INSERT INTO public.yayin_tekrar_kayitlari(yayin_id,tur_no,acilis_turu,baslangic_tarihi)
    VALUES(y.yayin_id,1,'ilk_yayin',v_tarih) ON CONFLICT(yayin_id,tur_no) DO NOTHING;
   SELECT coalesce(urun_adi,'-') INTO v_urun_adi FROM public.v_yayin_detay WHERE yayin_id=y.yayin_id;
   INSERT INTO public.bildirimler(alici_id,gonderen_id,kayit_turu,kayit_id,mesaj,goruldu_mu)
    SELECT k.kullanici_id,y.uretici_id,'yayin',y.yayin_id,'Yeni öğrenme içeriği yayında: '||coalesce(v_urun_adi,'-'),false
    FROM public.cogniti_token_yayin_gonderim_alicilari(y.yayin_id) k
    ON CONFLICT(alici_id,kayit_turu,kayit_id) DO NOTHING;
   IF y.hedef_roller && ARRAY['utt','kd_utt'] THEN
    INSERT INTO public.bildirimler(alici_id,gonderen_id,kayit_turu,kayit_id,mesaj,goruldu_mu)
     SELECT k.kullanici_id,y.uretici_id,'yayin',y.yayin_id,'Ekibinize önerebileceğiniz yeni öğrenme içeriği yayında: '||coalesce(v_urun_adi,'-'),false
     FROM public.v_yayin_detay v
     JOIN public.kullanicilar k ON k.firma_id=v.firma_id AND (v.takim_id IS NULL OR k.takim_id=v.takim_id)
     WHERE v.yayin_id=y.yayin_id AND k.rol='bm' AND k.aktif_mi=true
     ON CONFLICT(alici_id,kayit_turu,kayit_id) DO NOTHING;
   END IF;
   IF p_yayin_id IS NULL AND y.uretici_id IS NOT NULL THEN
    INSERT INTO public.bildirimler(alici_id,gonderen_id,kayit_turu,kayit_id,mesaj,goruldu_mu)
     VALUES(
      y.uretici_id,
      y.uretici_id,
      'yayin',
      y.yayin_id,
      coalesce(nullif(v_urun_adi,'-'),'Yayın')||' adlı '||y.yayin_id||' nolu planlı yayınız, başarıyla yayınlanmıştır.',
      false
     )
     ON CONFLICT(alici_id,kayit_turu,kayit_id) DO UPDATE
      SET mesaj=EXCLUDED.mesaj, goruldu_mu=false, created_at=now();
   END IF;
   aktive_sayisi:=aktive_sayisi+1;
  EXCEPTION WHEN SQLSTATE 'P0001' OR SQLSTATE '42501' OR SQLSTATE '22023' OR SQLSTATE '23514' THEN
   UPDATE public.cogniti_yayin_plan_tokenlari SET durum='serbest',son_hata=SQLSTATE,updated_at=statement_timestamp() WHERE yayin_id=y.yayin_id AND durum='ayrildi';
   RAISE WARNING 'Yayın % açılamadı; plan tokenları serbest bırakıldı: %',y.yayin_id,SQLERRM;
  END;
 END LOOP;
 RETURN aktive_sayisi;
END $$;

REVOKE ALL ON FUNCTION public.yayin_planlananlari_aktive(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.yayin_planlananlari_aktive(uuid) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS planli_yayin_uretici_bildirimi_kuruldu;
