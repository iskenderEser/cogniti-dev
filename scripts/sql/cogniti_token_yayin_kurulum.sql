-- İçeriğin ilk gerçek yayına alınması: gönderici firmanın hedef kişi başına 1 tokenı.
-- Plan kaydı/tarih değişimi/durdurup devam etme tüketmez. Geçmiş yayınlara geriye dönük işlem yapmaz.
-- E-Club ve Eczanem sonraki dağıtım aşamalarında mevcut tetikleyicilerle tüketilir.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-yayin-v1',0));
DO $$ BEGIN
 IF to_regprocedure('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)') IS NULL
 OR to_regprocedure('public.yayin_planlananlari_aktive(uuid)') IS NULL THEN
  RAISE EXCEPTION 'Token tüketimi veya planlı yayın aktivasyonu kurulu değil.';
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_yayin_acilis_kaydet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_firma uuid; v_takim uuid; v_gonderen_firma uuid; v_alici uuid;
BEGIN
 IF NEW.durum IS DISTINCT FROM 'yayinda' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  -- Devam etme, puan/tarih düzenleme ve teknik tekrar yeni bir gönderim değildir.
  IF OLD.durum IS DISTINCT FROM 'planlandi' THEN RETURN NEW; END IF;
 END IF;
 IF NOT (coalesce(NEW.hedef_roller,ARRAY['utt']) && ARRAY['utt','bm']) THEN RETURN NEW; END IF;
 SELECT firma_id,takim_id INTO v_firma,v_takim FROM public.v_yayin_detay WHERE yayin_id=NEW.yayin_id;
 SELECT firma_id INTO v_gonderen_firma FROM public.kullanicilar WHERE kullanici_id=NEW.uretici_id;
 IF v_firma IS NULL OR v_gonderen_firma IS DISTINCT FROM v_firma THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:yayin_firma_yok' USING ERRCODE='P0001';
 END IF;
 -- Hesabı kilitle: toplu tüketimde hesap değişimi veya eş zamanlı yükleme araya giremez.
 PERFORM 1 FROM public.cogniti_token_hesaplari WHERE firma_id=v_gonderen_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001'; END IF;
 FOR v_alici IN
  SELECT k.kullanici_id FROM public.kullanicilar k
  LEFT JOIN public.bolgeler b ON b.bolge_id=k.bolge_id
  WHERE k.firma_id=v_gonderen_firma AND k.aktif_mi=true AND (
   ('bm'=ANY(coalesce(NEW.hedef_roller,ARRAY['utt'])) AND k.rol='bm') OR
   ('utt'=ANY(coalesce(NEW.hedef_roller,ARRAY['utt'])) AND k.rol IN ('utt','kd_utt')
    AND (v_takim IS NULL OR coalesce(k.takim_id,b.takim_id)=v_takim)))
  ORDER BY k.kullanici_id
 LOOP
  BEGIN
   PERFORM public.cogniti_token_tuket(v_gonderen_firma,'firma_kullanicisi',NEW.uretici_id,
    'firma_kullanicisi',v_alici::text,'yayin',NEW.yayin_id,
    'yayin-acilis:'||NEW.yayin_id::text||':'||v_alici::text);
  EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM='Yetersiz token bakiyesi.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
   ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001';
   ELSE RAISE;
   END IF;
  END;
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_yayin_acilis_kaydet() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_token_yayin_acilis ON public.yayin_yonetimi;
CREATE TRIGGER trg_cogniti_token_yayin_acilis AFTER INSERT OR UPDATE OF durum ON public.yayin_yonetimi
 FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_yayin_acilis_kaydet();

-- Bildirim listesi tüketimin nedeni değildir; ilk gönderimde kaydedilen alıcıların anlık görüntüsüdür.
CREATE OR REPLACE FUNCTION public.cogniti_token_yayin_gonderim_alicilari(p_yayin_id uuid)
RETURNS TABLE(kullanici_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT DISTINCT t.alici_kimligi::uuid FROM public.cogniti_token_tuketimleri t
 WHERE t.islem_turu='yayin' AND t.kaynak_id=p_yayin_id AND t.alici_turu='firma_kullanicisi'
 ORDER BY 1;
$$;
REVOKE ALL ON FUNCTION public.cogniti_token_yayin_gonderim_alicilari(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_yayin_gonderim_alicilari(uuid) TO service_role;

-- Aynı aktivasyon noktası: durum güncellemesi token tetikleyicisinden geçer.
-- Cron'da tek firmanın yetersiz bakiyesi diğer firmaların yayınlarını durdurmaz.
-- Başarısız yayın planlandı kalır; anlık 'hemen yayınla' isteğine hata aynen döner.
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
   aktive_sayisi:=aktive_sayisi+1;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
   IF p_yayin_id IS NULL AND SQLERRM IN ('COGNITI_TOKEN:bakiye_yetersiz','COGNITI_TOKEN:hesap_yok','COGNITI_TOKEN:yayin_firma_yok') THEN
    RAISE WARNING 'Yayın % planlandı bırakıldı: %',y.yayin_id,SQLERRM;
   ELSE RAISE;
   END IF;
  END;
 END LOOP;
 RETURN aktive_sayisi;
END $$;
REVOKE ALL ON FUNCTION public.yayin_planlananlari_aktive(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.yayin_planlananlari_aktive(uuid) TO service_role;
COMMIT;
SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.yayin_yonetimi'::regclass
 AND tgname='trg_cogniti_token_yayin_acilis' AND tgenabled='O' AND NOT tgisinternal) AS yayin_token_baglantisi_kuruldu,
 to_regprocedure('public.cogniti_token_yayin_gonderim_alicilari(uuid)') IS NOT NULL AS yayin_alici_listesi_kuruldu;
