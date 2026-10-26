-- KULLANICI CALISTIRACAK. A basladiktan sonra 10 saniye icinde AYRI editor/baglantida.
-- Daily/HTTP yok. Test kimligi ve baslik birlikte kontrol edilir; mevcut veri silinmez.
BEGIN;
CREATE TEMP TABLE viva_yaris_sonuc(bekleme_ms numeric,kilit_beklemesi_gozlendi boolean,tek_bitirme_sonucu boolean,test_verisi_temizlendi boolean) ON COMMIT DROP;
DO $$
DECLARE e public.viva_etkinlikler%ROWTYPE; bas timestamptz; ms numeric; tek boolean;
BEGIN
 SELECT * INTO e FROM public.viva_etkinlikler WHERE etkinlik_id='fde4de54-a7a6-45f0-8bee-87dbacee2606' AND baslik='[VIVA 2.6 YARIS TESTI]';
 IF NOT FOUND THEN RAISE EXCEPTION 'Once A dosyasini baslatin; test kaydi henuz yok.';END IF;
 bas:=clock_timestamp();
 PERFORM public.viva_daily_yasam_islem(e.sahip_id,e.etkinlik_id,'bitir',jsonb_build_object('surum',e.surum));
 ms:=extract(epoch FROM clock_timestamp()-bas)*1000;
 SELECT durum='sona_erdi' AND surum=2 INTO tek FROM public.viva_etkinlikler WHERE etkinlik_id=e.etkinlik_id;
 DELETE FROM public.viva_etkinlikler WHERE etkinlik_id=e.etkinlik_id AND baslik='[VIVA 2.6 YARIS TESTI]';
 INSERT INTO viva_yaris_sonuc VALUES(round(ms,1),ms>=500,tek,NOT EXISTS(SELECT 1 FROM public.viva_etkinlikler WHERE etkinlik_id=e.etkinlik_id));
END $$;
SELECT * FROM viva_yaris_sonuc;
COMMIT;
-- kilit_beklemesi_gozlendi=false ise B gec baslatilmis olabilir; A+B yeniden denenebilir.
-- Bu dosya yalniz bu etiketli sentetik kaydin temizligini de yapar.
