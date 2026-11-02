-- Firma bannerı: Türkiye takvimi, rezervasyon, iptal ve mevcut token borcu.
BEGIN;
ALTER TABLE public.cogniti_token_tuketimleri DROP CONSTRAINT IF EXISTS cogniti_token_tuketimleri_islem_turu_check;
ALTER TABLE public.cogniti_token_tuketimleri ADD CONSTRAINT cogniti_token_tuketimleri_islem_turu_check
 CHECK(islem_turu IN ('yayin','tclub_oneri','cclub_challenge','eclub_oneri','eczanem_musteri','viva_davet','viva_sure','banner_yayin','banner_iptal'));
CREATE TABLE IF NOT EXISTS public.firma_banner_rezervasyonlari(
 rezervasyon_id uuid PRIMARY KEY,
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 alan text NOT NULL CHECK(alan IN ('firma','uye-ana-sayfa','uyeler','uye-yayinlari','indirim-onayi')),
 sira smallint NOT NULL CHECK(sira BETWEEN 1 AND 3),
 baslangic date NOT NULL CHECK(extract(isodow FROM baslangic)=1),
 hafta_sayisi smallint NOT NULL CHECK(hafta_sayisi IN (1,2)),
 durum text NOT NULL DEFAULT 'rezerve' CHECK(durum IN ('rezerve','yayinda','tamamlandi','iptal','kaldirildi','suresi_gecti')),
 olusturan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 ucret_islendi boolean NOT NULL DEFAULT false,
 son_hata text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.firma_banner_haftalari(
 rezervasyon_id uuid NOT NULL REFERENCES public.firma_banner_rezervasyonlari(rezervasyon_id) ON DELETE CASCADE,
 hafta_no smallint NOT NULL CHECK(hafta_no IN (0,1)),
 dosya_yolu text NOT NULL CHECK(length(dosya_yolu)>0),
 PRIMARY KEY(rezervasyon_id,hafta_no)
);
ALTER TABLE public.firma_banner_rezervasyonlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firma_banner_haftalari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.firma_banner_rezervasyonlari,public.firma_banner_haftalari FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.firma_banner_rezervasyonlari,public.firma_banner_haftalari TO service_role;
CREATE INDEX IF NOT EXISTS firma_banner_takvim_idx ON public.firma_banner_rezervasyonlari(firma_id,alan,sira,baslangic);
CREATE OR REPLACE FUNCTION public.firma_banner_simdi() RETURNS timestamptz LANGUAGE sql STABLE AS $$SELECT statement_timestamp()$$;
CREATE OR REPLACE FUNCTION public.firma_banner_an(p_gun date) RETURNS timestamptz LANGUAGE sql IMMUTABLE AS $$SELECT p_gun::timestamp AT TIME ZONE 'Europe/Istanbul'$$;

-- Alan kilidi manuel Cogniti bannerı ile haftalık rezervasyon arasında da paylaşılır.
CREATE OR REPLACE FUNCTION public.firma_banner_manuel_koruma() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a text;
BEGIN
 IF TG_TABLE_NAME='eclub_firma_bannerlari' THEN a:='firma'; ELSE a:=NEW.alan; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('firma-banner:'||NEW.firma_id||':'||a||':'||NEW.sira,0));
 IF EXISTS(SELECT 1 FROM public.firma_banner_rezervasyonlari r WHERE r.firma_id=NEW.firma_id AND r.alan=a AND r.sira=NEW.sira
  AND r.durum IN ('rezerve','yayinda') AND public.firma_banner_an(r.baslangic+r.hafta_sayisi*7)>public.firma_banner_simdi()) THEN
  RAISE EXCEPTION 'Bu banner alanında haftalık rezervasyon var.' USING ERRCODE='40001';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS firma_banner_manuel_koruma ON public.eclub_firma_bannerlari;
CREATE TRIGGER firma_banner_manuel_koruma BEFORE INSERT OR UPDATE ON public.eclub_firma_bannerlari FOR EACH ROW EXECUTE FUNCTION public.firma_banner_manuel_koruma();
DROP TRIGGER IF EXISTS firma_banner_manuel_koruma ON public.eczanem_sayfa_bannerlari;
CREATE TRIGGER firma_banner_manuel_koruma BEFORE INSERT OR UPDATE ON public.eczanem_sayfa_bannerlari FOR EACH ROW EXECUTE FUNCTION public.firma_banner_manuel_koruma();

CREATE OR REPLACE FUNCTION public.firma_banner_uygun_mu(p_firma uuid,p_alan text,p_sira integer,p_bas date,p_hafta integer)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d date; n integer; once integer:=0; sonra integer:=0;
BEGIN
 IF p_bas IS NULL OR p_hafta IS NULL OR p_hafta NOT IN(1,2) OR extract(isodow FROM p_bas)<>1 THEN RETURN false; END IF;
 IF (p_alan='firma' AND EXISTS(SELECT 1 FROM public.eclub_firma_bannerlari WHERE firma_id=p_firma AND sira=p_sira))
 OR (p_alan<>'firma' AND EXISTS(SELECT 1 FROM public.eczanem_sayfa_bannerlari WHERE firma_id=p_firma AND alan=p_alan AND sira=p_sira)) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.firma_banner_rezervasyonlari r WHERE r.firma_id=p_firma AND r.alan=p_alan AND r.sira=p_sira AND r.durum IN('rezerve','yayinda')
  AND r.baslangic<p_bas+p_hafta*7 AND r.baslangic+r.hafta_sayisi*7>p_bas) THEN RETURN false; END IF;
 -- Ayrı rezervasyonlarla da iki ardışık hafta aşılamaz; kullanılan geçmiş haftalar korunur.
 FOR n IN 1..2 LOOP
  d:=p_bas-n*7;
  IF EXISTS(SELECT 1 FROM public.firma_banner_rezervasyonlari r WHERE r.firma_id=p_firma AND r.alan=p_alan AND r.sira=p_sira
   AND r.durum IN('rezerve','yayinda','tamamlandi','kaldirildi') AND d>=r.baslangic AND d<r.baslangic+r.hafta_sayisi*7) THEN once:=once+1; ELSE EXIT; END IF;
 END LOOP;
 FOR n IN 0..1 LOOP
  d:=p_bas+(p_hafta+n)*7;
  IF EXISTS(SELECT 1 FROM public.firma_banner_rezervasyonlari r WHERE r.firma_id=p_firma AND r.alan=p_alan AND r.sira=p_sira
   AND r.durum IN('rezerve','yayinda','tamamlandi','kaldirildi') AND d>=r.baslangic AND d<r.baslangic+r.hafta_sayisi*7) THEN sonra:=sonra+1; ELSE EXIT; END IF;
 END LOOP;
 RETURN once+p_hafta+sonra<=2;
END $$;

CREATE OR REPLACE FUNCTION public.firma_banner_rezerve(p_aktor uuid,p_firma uuid,p_id uuid,p_alan text,p_sira integer,p_bas date,p_yollar text[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.firma_banner_rezervasyonlari%ROWTYPE; n integer:=cardinality(p_yollar); i integer;
BEGIN
 IF NOT public.firma_yonetim_yazma_yetkili_mi(p_aktor,p_firma) THEN RAISE EXCEPTION 'Firma yönetimi işlem yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_alan IS NULL OR p_alan NOT IN('firma','uye-ana-sayfa','uyeler','uye-yayinlari','indirim-onayi') OR p_sira IS NULL OR p_sira NOT BETWEEN 1 AND 3
 OR n IS NULL OR n NOT IN(1,2) OR p_bas IS NULL OR extract(isodow FROM p_bas)<>1 OR public.firma_banner_an(p_bas)<=public.firma_banner_simdi()
 OR EXISTS(SELECT 1 FROM unnest(p_yollar) y WHERE y IS NULL OR y NOT LIKE 'firma-banner-rezervasyon/'||p_firma||'/%') THEN
  RAISE EXCEPTION 'Geçerli pazartesi, alan ve her hafta için görsel seçin.' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.cogniti_token_hesaplari WHERE firma_id=p_firma;
 IF NOT FOUND THEN RAISE EXCEPTION 'Önce firmanın token hesabı tanımlanmalıdır.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('firma-banner:'||p_firma||':'||p_alan||':'||p_sira,0));
 SELECT * INTO r FROM public.firma_banner_rezervasyonlari WHERE rezervasyon_id=p_id;
 IF FOUND THEN RAISE EXCEPTION 'Rezervasyon zaten kaydedilmiş; listeyi yenileyin.' USING ERRCODE='40001'; END IF;
 IF NOT public.firma_banner_uygun_mu(p_firma,p_alan,p_sira,p_bas,n) THEN RAISE EXCEPTION 'Alan dolu veya iki ardışık hafta sınırı aşılıyor. Takvimi yenileyin.' USING ERRCODE='40001'; END IF;
 INSERT INTO public.firma_banner_rezervasyonlari(rezervasyon_id,firma_id,alan,sira,baslangic,hafta_sayisi,olusturan_id) VALUES(p_id,p_firma,p_alan,p_sira,p_bas,n,p_aktor);
 FOR i IN 1..n LOOP INSERT INTO public.firma_banner_haftalari VALUES(p_id,i-1,p_yollar[i]); END LOOP;
 RETURN p_id;
END $$;

-- Diğer token motorları değişmez. Banner bedeli tek tüketim ve gerçek dağılımla kaydedilir.
CREATE OR REPLACE FUNCTION public.firma_banner_ucret_isle(p_id uuid,p_iptal boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.firma_banner_rezervasyonlari%ROWTYPE; h public.cogniti_token_hesaplari%ROWTYPE;
 y record; tid uuid; v_kalan bigint; alinan bigint; borc bigint; bedel bigint; an timestamptz:=public.firma_banner_simdi();
BEGIN
 SELECT * INTO r FROM public.firma_banner_rezervasyonlari WHERE rezervasyon_id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Rezervasyon bulunamadı.'; END IF;
 IF r.ucret_islendi THEN RETURN; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=r.firma_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Firmanın token hesabı yok.'; END IF;
 IF h.paket_turu='kullandigin_kadar_ode' THEN PERFORM public.cogniti_token_kko_aylik_yukle(r.firma_id);
 ELSE PERFORM public.cogniti_token_aylik_donemi_yukle(r.firma_id); END IF;
 bedel:=r.hafta_sayisi*200; v_kalan:=bedel;
 INSERT INTO public.cogniti_token_tuketimleri(firma_id,gonderen_turu,gonderen_id,alici_turu,alici_kimligi,islem_turu,kaynak_id,islem_anahtari,miktar,asim_miktari)
 VALUES(r.firma_id,'firma_kullanicisi',r.olusturan_id,'firma_kullanicisi',r.firma_id::text,CASE WHEN p_iptal THEN 'banner_iptal' ELSE 'banner_yayin' END,r.rezervasyon_id,'banner:'||r.rezervasyon_id,bedel,0)
 RETURNING tuketim_id INTO tid;
 FOR y IN SELECT * FROM public.cogniti_token_yuklemeleri WHERE firma_id=r.firma_id AND kalan>0 AND(son_kullanim_at IS NULL OR son_kullanim_at>an)
  ORDER BY son_kullanim_at ASC NULLS LAST,created_at,yukleme_id FOR UPDATE LOOP
  EXIT WHEN v_kalan<=0;
  alinan:=least(v_kalan,y.kalan); v_kalan:=v_kalan-alinan;
  UPDATE public.cogniti_token_yuklemeleri SET kalan=cogniti_token_yuklemeleri.kalan-alinan WHERE yukleme_id=y.yukleme_id;
  INSERT INTO public.cogniti_token_tuketim_dagilimlari(firma_id,tuketim_id,yukleme_id,miktar) VALUES(r.firma_id,tid,y.yukleme_id,alinan);
 END LOOP;
 borc:=v_kalan;
 UPDATE public.cogniti_token_tuketimleri SET asim_miktari=borc WHERE tuketim_id=tid;
 UPDATE public.cogniti_token_hesaplari SET asim_borcu=asim_borcu+borc,updated_at=an WHERE firma_id=r.firma_id;
 UPDATE public.firma_banner_rezervasyonlari SET ucret_islendi=true,son_hata=NULL WHERE rezervasyon_id=p_id;
END $$;

CREATE OR REPLACE FUNCTION public.firma_banner_iptal(p_aktor uuid,p_firma uuid,p_id uuid,p_beklenen_kesinti integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.firma_banner_rezervasyonlari%ROWTYPE; ceza boolean; an timestamptz:=public.firma_banner_simdi();
BEGIN
 IF NOT public.firma_yonetim_yazma_yetkili_mi(p_aktor,p_firma) THEN RAISE EXCEPTION 'Firma yönetimi işlem yetkiniz yok.' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.firma_banner_rezervasyonlari WHERE rezervasyon_id=p_id AND firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Rezervasyon bulunamadı.' USING ERRCODE='P0002'; END IF;
 IF r.durum IN('iptal','kaldirildi') THEN RETURN jsonb_build_object('ok',true,'kesinti',CASE WHEN r.ucret_islendi THEN r.hafta_sayisi*200 ELSE 0 END); END IF;
 IF r.durum NOT IN('rezerve','yayinda') OR public.firma_banner_an(r.baslangic+r.hafta_sayisi*7)<=an THEN RAISE EXCEPTION 'Bu rezervasyon sona ermiş.' USING ERRCODE='22023'; END IF;
 ceza:=an>public.firma_banner_an(r.baslangic)-interval '24 hours';
 IF p_beklenen_kesinti IS DISTINCT FROM (CASE WHEN ceza OR r.ucret_islendi THEN r.hafta_sayisi*200 ELSE 0 END) THEN
  RAISE EXCEPTION 'İptal bedeli değişti. Takvimi yenileyip güncel bedeli onaylayın.' USING ERRCODE='40001'; END IF;
 IF ceza THEN PERFORM public.firma_banner_ucret_isle(p_id,true); END IF;
 UPDATE public.firma_banner_rezervasyonlari SET durum=CASE WHEN an>=public.firma_banner_an(r.baslangic) THEN 'kaldirildi' ELSE 'iptal' END WHERE rezervasyon_id=p_id;
 RETURN jsonb_build_object('ok',true,'kesinti',CASE WHEN ceza OR r.ucret_islendi THEN r.hafta_sayisi*200 ELSE 0 END);
END $$;

CREATE OR REPLACE FUNCTION public.firma_banner_gorsel_degistir(p_aktor uuid,p_firma uuid,p_id uuid,p_hafta integer,p_yol text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.firma_banner_rezervasyonlari%ROWTYPE;
BEGIN
 IF NOT public.firma_yonetim_yazma_yetkili_mi(p_aktor,p_firma) THEN RAISE EXCEPTION 'Firma yönetimi işlem yetkiniz yok.' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.firma_banner_rezervasyonlari WHERE rezervasyon_id=p_id AND firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Rezervasyon bulunamadı.' USING ERRCODE='P0002'; END IF;
 IF p_hafta IS NULL OR p_hafta<0 OR p_hafta>=r.hafta_sayisi OR r.durum NOT IN('rezerve','yayinda') OR public.firma_banner_an(r.baslangic+p_hafta*7)<=public.firma_banner_simdi()
 OR p_yol IS NULL OR p_yol NOT LIKE 'firma-banner-rezervasyon/'||p_firma||'/%' THEN RAISE EXCEPTION 'Başlayan haftanın görseli değiştirilemez.' USING ERRCODE='22023'; END IF;
 UPDATE public.firma_banner_haftalari SET dosya_yolu=p_yol WHERE rezervasyon_id=p_id AND hafta_no=p_hafta;
END $$;

CREATE OR REPLACE FUNCTION public.firma_banner_yayinlari_isle() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r record; sayi integer:=0; an timestamptz:=public.firma_banner_simdi();
BEGIN
 UPDATE public.firma_banner_rezervasyonlari SET durum=CASE WHEN ucret_islendi THEN 'tamamlandi' ELSE 'suresi_gecti' END
 WHERE durum IN('rezerve','yayinda') AND public.firma_banner_an(baslangic+hafta_sayisi*7)<=an;
 FOR r IN SELECT rezervasyon_id FROM public.firma_banner_rezervasyonlari WHERE durum='rezerve' AND public.firma_banner_an(baslangic)<=an
  ORDER BY baslangic,rezervasyon_id LIMIT 200 FOR UPDATE SKIP LOCKED LOOP
  BEGIN
   PERFORM public.firma_banner_ucret_isle(r.rezervasyon_id);
   UPDATE public.firma_banner_rezervasyonlari SET durum='yayinda',son_hata=NULL WHERE rezervasyon_id=r.rezervasyon_id;
   sayi:=sayi+1;
  EXCEPTION WHEN OTHERS THEN
   UPDATE public.firma_banner_rezervasyonlari SET son_hata='Ücret işlenemedi; yayın henüz başlamadı.' WHERE rezervasyon_id=r.rezervasyon_id;
  END;
 END LOOP;
 RETURN sayi;
END $$;

CREATE OR REPLACE FUNCTION public.firma_banner_takvim(p_firma uuid,p_alan text,p_sira integer,p_bas date,p_hafta integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d date; onerilen date; kayitlar jsonb; eski jsonb; i integer; azami integer; engel boolean;
BEGIN
 IF p_firma IS NULL OR p_alan IS NULL OR p_alan NOT IN('firma','uye-ana-sayfa','uyeler','uye-yayinlari','indirim-onayi') OR p_sira IS NULL OR p_sira NOT BETWEEN 1 AND 3 OR p_hafta IS NULL OR p_hafta NOT IN(1,2) OR p_bas IS NULL OR extract(isodow FROM p_bas)<>1 THEN RAISE EXCEPTION 'Geçersiz takvim isteği.' USING ERRCODE='22023'; END IF;
 IF p_alan='firma' THEN SELECT coalesce(jsonb_agg(to_jsonb(b)),'[]') INTO eski FROM public.eclub_firma_bannerlari b WHERE firma_id=p_firma;
 ELSE SELECT coalesce(jsonb_agg(to_jsonb(b)),'[]') INTO eski FROM public.eczanem_sayfa_bannerlari b WHERE firma_id=p_firma AND alan=p_alan; END IF;
 engel:=EXISTS(SELECT 1 FROM jsonb_array_elements(eski) b WHERE (b->>'sira')::integer=p_sira);
 d:=greatest(p_bas,(date_trunc('week',public.firma_banner_simdi() AT TIME ZONE 'Europe/Istanbul')::date+7));
 -- Her rezervasyon en fazla iki hafta kaplar; boş haftaya kadar sabit ufuk sınırı yoktur.
 SELECT count(*)::integer*3+4 INTO azami FROM public.firma_banner_rezervasyonlari WHERE firma_id=p_firma AND alan=p_alan AND sira=p_sira;
 IF NOT engel THEN
  FOR i IN 1..azami LOOP
   IF public.firma_banner_uygun_mu(p_firma,p_alan,p_sira,d,p_hafta) THEN onerilen:=d; EXIT; END IF;
   d:=d+7;
  END LOOP;
 END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.baslangic,x.sira),'[]') INTO kayitlar FROM (
  SELECT r.*,public.firma_banner_an(r.baslangic) baslangic_at,public.firma_banner_an(r.baslangic+r.hafta_sayisi*7) bitis_at,
   (SELECT jsonb_agg(jsonb_build_object('hafta_no',h.hafta_no,'dosya_yolu',h.dosya_yolu,'baslangic_at',public.firma_banner_an(r.baslangic+h.hafta_no*7)) ORDER BY h.hafta_no) FROM public.firma_banner_haftalari h WHERE h.rezervasyon_id=r.rezervasyon_id) gorseller
  FROM public.firma_banner_rezervasyonlari r WHERE r.firma_id=p_firma AND r.alan=p_alan
   AND (r.durum IN('rezerve','yayinda') OR r.baslangic>=p_bas AND r.baslangic<p_bas+56)
 )x;
 RETURN jsonb_build_object('simdi',public.firma_banner_simdi(),'onerilen',onerilen,'manuel_engel',engel,'uygun',public.firma_banner_an(p_bas)>public.firma_banner_simdi() AND public.firma_banner_uygun_mu(p_firma,p_alan,p_sira,p_bas,p_hafta),'rezervasyonlar',kayitlar,'mevcut_bannerlar',eski);
END $$;

CREATE OR REPLACE VIEW public.firma_banner_aktif_haftalar AS
 SELECT r.firma_id,r.alan,r.sira,h.dosya_yolu,true AS gorunur,public.firma_banner_an(r.baslangic+(h.hafta_no+1)*7) AS bitis_at
 FROM public.firma_banner_rezervasyonlari r JOIN public.firma_banner_haftalari h USING(rezervasyon_id)
 WHERE r.durum='yayinda' AND r.ucret_islendi
 AND public.firma_banner_simdi()>=public.firma_banner_an(r.baslangic+h.hafta_no*7)
 AND public.firma_banner_simdi()<public.firma_banner_an(r.baslangic+(h.hafta_no+1)*7);
REVOKE ALL ON public.firma_banner_aktif_haftalar FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.firma_banner_aktif_haftalar TO service_role;
DO $yetki$ DECLARE r record; BEGIN
 FOR r IN SELECT p.oid::regprocedure AS imza FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('firma_banner_simdi','firma_banner_an','firma_banner_manuel_koruma','firma_banner_uygun_mu','firma_banner_rezerve','firma_banner_ucret_isle','firma_banner_iptal','firma_banner_gorsel_degistir','firma_banner_yayinlari_isle','firma_banner_takvim') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',r.imza);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',r.imza);
 END LOOP;
END $yetki$;
DO $cron$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='cron') THEN RAISE EXCEPTION 'pg_cron bulunamadı; otomatik yayın için kurulum gerekli.'; END IF;
 PERFORM cron.schedule('firma-banner-haftalik-yayin','* * * * *','SELECT public.firma_banner_yayinlari_isle();');
END $cron$;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS firma_banner_haftalik_yonetim_hazir;
