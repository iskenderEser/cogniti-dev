-- KULLANICI CALISTIRACAK. Daily/HTTP yok. A ve B iki AYRI SQL editoru/baglantida.
-- B'yi diger editorde hazir edin; A'yi baslatip 10 saniye icinde B'yi baslatin.
-- A yalniz bu sabit test kimligini olusturur. B sonunda test verisini siler.
-- Mevcut kullanici kimligi yalniz okunur. Yalniz cron pasifken calistirin.
BEGIN;
DO $$
DECLARE eid uuid:='fde4de54-a7a6-45f0-8bee-87dbacee2606'; sahip uuid;r jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM public.viva_etkinlikler WHERE etkinlik_id=eid) THEN
  RAISE EXCEPTION 'Test kimligi zaten var; once B dosyasiyla onceki testi bitirin. Veri degistirilmedi.';
 END IF;
 SELECT kullanici_id INTO sahip FROM public.kullanicilar WHERE public.viva_duzenleyen_aktif(kullanici_id) ORDER BY kullanici_id LIMIT 1;
 IF sahip IS NULL THEN RAISE EXCEPTION 'Aktif duzenleyen yok.';END IF;
 PERFORM public.viva_islem(sahip,'olustur',jsonb_build_object('etkinlik_id',eid,'baslik','[VIVA 2.6 YARIS TESTI]','aciklama','Yalniz SQL testi; B dosyasi temizler.',
  'baslangic',now()+interval '1 hour','bitis',now()+interval '2 hours','durum','planlandi','katilimcilar','[]'::jsonb));
END $$;
COMMIT;
BEGIN;
DO $$
DECLARE e public.viva_etkinlikler%ROWTYPE;
BEGIN
 SELECT * INTO e FROM public.viva_etkinlikler WHERE etkinlik_id='fde4de54-a7a6-45f0-8bee-87dbacee2606' AND baslik='[VIVA 2.6 YARIS TESTI]';
 IF NOT FOUND THEN RAISE EXCEPTION 'Test kaydi yok.';END IF;
 PERFORM public.viva_daily_yasam_islem(e.sahip_id,e.etkinlik_id,'bitir',jsonb_build_object('surum',e.surum));
 PERFORM pg_sleep(10); -- Kullanici iki gercek baglantida kilit beklemesini gozler.
END $$;
COMMIT;
SELECT 'A tamamlandi; B sonucunu kontrol edin.' AS sonuc;
