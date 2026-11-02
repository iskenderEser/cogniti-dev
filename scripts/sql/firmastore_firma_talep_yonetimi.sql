-- Önkoşul: firmastore_12_saat_bekleme.sql. Kullanıcı çalıştırır.
-- Firma seçimi zorunlu; teslim + eposta kuyruğu atomik. Mevcut kayıtlar silinmez.
BEGIN;
ALTER TABLE public.store_siparisler DROP CONSTRAINT IF EXISTS store_siparisler_durum_check;
ALTER TABLE public.store_siparisler ADD CONSTRAINT store_siparisler_durum_check
 CHECK(durum IN ('beklemede','hazirlaniyor','kargoda','teslim_edildi','iptal'));
CREATE INDEX IF NOT EXISTS store_firma_talep_idx ON public.store_siparisler(firma_id,created_at DESC,siparis_id);

CREATE TABLE IF NOT EXISTS public.store_cek_teslimleri(
 teslim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 siparis_id uuid NOT NULL REFERENCES public.store_siparisler(siparis_id) ON DELETE CASCADE,
 kullanici_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 urun_id uuid NOT NULL REFERENCES public.store_urunler(urun_id),
 sira integer NOT NULL CHECK(sira>0), cek_kodu text NOT NULL,
 kullanim_linki text, teslim_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 teslim_eden uuid REFERENCES public.kullanicilar(kullanici_id) ON DELETE SET NULL,
 UNIQUE(siparis_id,sira),
 CHECK(length(cek_kodu) BETWEEN 1 AND 512),
 CHECK(kullanim_linki IS NULL OR (length(kullanim_linki)<=2048 AND kullanim_linki ~ '^https://[^[:space:]<>]+$'))
);
CREATE UNIQUE INDEX IF NOT EXISTS store_cek_kod_tekil_idx ON public.store_cek_teslimleri(urun_id,lower(btrim(cek_kodu)));
CREATE TABLE IF NOT EXISTS public.store_talep_islem_gecmisi(
 islem_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 siparis_id uuid NOT NULL REFERENCES public.store_siparisler(siparis_id) ON DELETE CASCADE,
 islem text NOT NULL, onceki_durum text, sonraki_durum text, aciklama text,
 yapan_id uuid REFERENCES public.kullanicilar(kullanici_id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS public.store_cek_eposta_kuyrugu(
 is_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 siparis_id uuid NOT NULL UNIQUE REFERENCES public.store_siparisler(siparis_id) ON DELETE CASCADE,
 kullanici_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 govde jsonb NOT NULL, durum text NOT NULL DEFAULT 'bekliyor' CHECK(durum IN('bekliyor','isleniyor','gonderildi','hata','kontrol')),
 deneme integer NOT NULL DEFAULT 0, ilk_deneme_at timestamptz, sonraki_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 lease_id uuid,lease_bitis timestamptz,hata_kodu text,saglayici_id text,gonderim_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.store_cek_teslimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_talep_islem_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_cek_eposta_kuyrugu ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_cek_teslimleri,public.store_talep_islem_gecmisi,public.store_cek_eposta_kuyrugu FROM anon,authenticated;
GRANT ALL ON public.store_cek_teslimleri,public.store_talep_islem_gecmisi,public.store_cek_eposta_kuyrugu TO service_role;

CREATE OR REPLACE FUNCTION public.store_firma_talep_kesiti(
 p_firma uuid,p_durum text,p_bas date,p_son date,p_arama text
) RETURNS SETOF public.store_siparisler LANGUAGE sql VOLATILE
SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT s.* FROM public.store_siparisler s LEFT JOIN public.kullanicilar k USING(kullanici_id)
 LEFT JOIN public.store_urunler u USING(urun_id)
 WHERE s.firma_id=p_firma AND public.store_admin_kuyrukta_mi(s.created_at,s.durum,s.guncellenme_at,clock_timestamp())
 AND (p_durum IS NULL OR CASE WHEN s.durum='kargoda' THEN 'hazirlaniyor' ELSE s.durum END=p_durum)
 AND (p_bas IS NULL OR s.created_at >= p_bas::timestamp AT TIME ZONE 'Europe/Istanbul')
 AND (p_son IS NULL OR s.created_at < (p_son+1)::timestamp AT TIME ZONE 'Europe/Istanbul')
 AND (coalesce(btrim(p_arama),'')='' OR strpos(lower(concat_ws(' ',k.ad,k.soyad,u.ad,s.siparis_id::text,s.toplu_talep_anahtari::text)),lower(btrim(p_arama)))>0)
$$;
CREATE OR REPLACE FUNCTION public.store_firma_talep_json(s public.store_siparisler)
RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT (to_jsonb(s)-ARRAY['kargo_firmasi','kargo_takip_no']) || jsonb_build_object(
 'durum',CASE WHEN s.durum='kargoda' THEN 'hazirlaniyor' ELSE s.durum END,
 'kullanicilar',(SELECT jsonb_build_object('ad',k.ad,'soyad',k.soyad,'rol',k.rol,'eposta',k.eposta) FROM public.kullanicilar k WHERE k.kullanici_id=s.kullanici_id),
 'store_urunler',(SELECT jsonb_build_object('ad',u.ad,'gorsel_url',u.gorsel_url) FROM public.store_urunler u WHERE u.urun_id=s.urun_id),
 'teslimler',coalesce((SELECT jsonb_agg(jsonb_build_object('cek_kodu',t.cek_kodu,'kullanim_linki',t.kullanim_linki,'teslim_at',t.teslim_at) ORDER BY t.sira) FROM public.store_cek_teslimleri t WHERE t.siparis_id=s.siparis_id),'[]'::jsonb),
 'eposta',(SELECT jsonb_build_object('durum',e.durum,'hata_kodu',e.hata_kodu,'deneme',e.deneme,'gonderim_at',e.gonderim_at,'alici',e.govde->'to'->>0) FROM public.store_cek_eposta_kuyrugu e WHERE e.siparis_id=s.siparis_id),
 'gecmis',coalesce((SELECT jsonb_agg(jsonb_build_object('islem',g.islem,'aciklama',g.aciklama,'created_at',g.created_at,'yapan',concat_ws(' ',k.ad,k.soyad)) ORDER BY g.created_at) FROM public.store_talep_islem_gecmisi g LEFT JOIN public.kullanicilar k ON k.kullanici_id=g.yapan_id WHERE g.siparis_id=s.siparis_id),'[]'::jsonb))
$$;
CREATE OR REPLACE FUNCTION public.store_admin_firma_ozetleri()
RETURNS jsonb LANGUAGE sql VOLATILE SET search_path=pg_catalog,public,pg_temp AS $$
 WITH kesin AS(SELECT * FROM public.store_siparisler s WHERE public.store_admin_kuyrukta_mi(s.created_at,s.durum,s.guncellenme_at,clock_timestamp())),
 o AS(SELECT firma_id,count(*) toplam,count(*) FILTER(WHERE durum='beklemede') bekleyen,
 count(*) FILTER(WHERE durum IN('hazirlaniyor','kargoda')) hazirlanan,count(*) FILTER(WHERE durum='teslim_edildi') tamamlanan,
 count(*) FILTER(WHERE durum='iptal') iptal,coalesce(sum(toplam_puan) FILTER(WHERE durum<>'iptal'),0) puan,
 coalesce(sum(toplam_tl) FILTER(WHERE durum<>'iptal'),0) tl,count(*) FILTER(WHERE durum<>'iptal' AND toplam_tl IS NULL) tl_eksik FROM kesin GROUP BY firma_id)
 SELECT jsonb_build_object('firmalar',coalesce((SELECT jsonb_agg(jsonb_build_object('firma_id',f.firma_id,'firma_adi',f.firma_adi,'aktif',f.aktif,'modul_acik',f.hbstore_aktif,
 'toplam',coalesce(o.toplam,0),'bekleyen',coalesce(o.bekleyen,0),'hazirlanan',coalesce(o.hazirlanan,0),'tamamlanan',coalesce(o.tamamlanan,0),'iptal',coalesce(o.iptal,0),
 'puan',coalesce(o.puan,0),'tl',coalesce(o.tl,0),'tl_eksik',coalesce(o.tl_eksik,0)) ORDER BY f.firma_adi)
 FROM public.firmalar f LEFT JOIN o ON o.firma_id=f.firma_id WHERE f.hbstore_aktif OR o.toplam>0),'[]'::jsonb),
 'firmasiz_talep',coalesce((SELECT count(*) FROM kesin WHERE firma_id IS NULL),0))
$$;
CREATE OR REPLACE FUNCTION public.store_admin_firma_talepleri(
 p_firma uuid,p_durum text DEFAULT NULL,p_bas date DEFAULT NULL,p_son date DEFAULT NULL,p_arama text DEFAULT NULL,
 p_sayfa integer DEFAULT 1,p_export boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $fn$
DECLARE f record;v_ozet jsonb;v_satirlar jsonb;v_cekler jsonb;n bigint;v_an timestamptz:=clock_timestamp();
BEGIN
 SELECT firma_id,firma_adi INTO f FROM public.firmalar WHERE firma_id=p_firma;
 IF NOT FOUND THEN RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='P0002'; END IF;
 IF p_sayfa<1 OR (p_bas IS NOT NULL AND p_son IS NOT NULL AND p_bas>p_son) THEN RAISE EXCEPTION 'Geçersiz sayfa veya tarih aralığı.' USING ERRCODE='22023'; END IF;
 -- Tek materialized kesit: liste ve özet aynı filtreyi kullanır.
 WITH q AS MATERIALIZED(SELECT * FROM public.store_firma_talep_kesiti(p_firma,p_durum,p_bas,p_son,p_arama)),
 satirlar AS(SELECT * FROM q ORDER BY created_at DESC,siparis_id LIMIT CASE WHEN p_export THEN 100001 ELSE 50 END OFFSET CASE WHEN p_export THEN 0 ELSE (p_sayfa-1)::bigint*50 END)
 SELECT count(*),jsonb_build_object('toplam',count(*),'bekleyen',count(*) FILTER(WHERE durum='beklemede'),
 'hazirlanan',count(*) FILTER(WHERE durum IN('hazirlaniyor','kargoda')),'tamamlanan',count(*) FILTER(WHERE durum='teslim_edildi'),'iptal',count(*) FILTER(WHERE durum='iptal'),
 'puan',coalesce(sum(toplam_puan) FILTER(WHERE durum<>'iptal'),0),'tl',coalesce(sum(toplam_tl) FILTER(WHERE durum<>'iptal'),0),'tl_eksik',count(*) FILTER(WHERE durum<>'iptal' AND toplam_tl IS NULL)),
 coalesce((SELECT jsonb_agg(public.store_firma_talep_json(s::public.store_siparisler) ORDER BY s.created_at DESC,s.siparis_id) FROM satirlar s),'[]'::jsonb),
 coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM(SELECT q.urun_id,max(u.ad) ad,sum(q.adet) adet,sum(q.toplam_puan) puan,sum(q.toplam_tl) tl FROM q LEFT JOIN public.store_urunler u USING(urun_id) WHERE q.durum<>'iptal' GROUP BY q.urun_id ORDER BY max(u.ad)) c),'[]'::jsonb)
 INTO n,v_ozet,v_satirlar,v_cekler FROM q;
 IF p_export AND n>100000 THEN RAISE EXCEPTION 'Dışa aktarmak için tarih aralığını daraltın.' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('firma',to_jsonb(f),'ozet',v_ozet,'cek_ozeti',v_cekler,'talepler',v_satirlar,'toplam',n,'sayfa',p_sayfa,'sunucu_zamani',v_an);
END;$fn$;

CREATE OR REPLACE FUNCTION public.store_admin_firma_talep_islem(
 p_firma uuid,p_siparis uuid,p_admin uuid,p_islem text,p_not text DEFAULT NULL,p_kodlar jsonb DEFAULT NULL,p_from text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $fn$
DECLARE s public.store_siparisler%ROWTYPE;v_sahip uuid;r record;sonuc record;v_ad text;v_eposta text;v_firma text;v_urun text;v_icerik text;v_once text;e public.store_cek_eposta_kuyrugu%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin AND rol='admin') THEN RAISE EXCEPTION 'Admin yetkisi gerekli.' USING ERRCODE='42501';END IF;
 SELECT kullanici_id INTO v_sahip FROM public.store_siparisler WHERE siparis_id=p_siparis AND firma_id=p_firma;
 IF NOT FOUND THEN RAISE EXCEPTION 'Talep seçili firmaya ait değil.' USING ERRCODE='P0002';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('hbstore:siparis:'||v_sahip::text,0));
 SELECT * INTO s FROM public.store_siparisler WHERE siparis_id=p_siparis AND firma_id=p_firma FOR UPDATE;
 IF NOT FOUND OR NOT public.store_admin_kuyrukta_mi(s.created_at,s.durum,s.guncellenme_at,clock_timestamp()) THEN RAISE EXCEPTION 'Talep admin işlemine açık değil.' USING ERRCODE='22023';END IF;
 v_once:=s.durum;
 IF p_islem='hazirla' THEN
  IF s.durum IN('hazirlaniyor','kargoda') THEN RETURN jsonb_build_object('ok',true);END IF;
  IF s.durum<>'beklemede' THEN RAISE EXCEPTION 'Yalnız bekleyen talep hazırlanabilir.' USING ERRCODE='22023';END IF;
  UPDATE public.store_siparisler SET durum='hazirlaniyor',guncellenme_at=clock_timestamp() WHERE siparis_id=p_siparis;
 ELSIF p_islem='iptal' THEN
  IF nullif(btrim(p_not),'') IS NULL THEN RAISE EXCEPTION 'İptal nedeni zorunludur.' USING ERRCODE='22023';END IF;
  SELECT * INTO sonuc FROM public.store_siparis_iptal(p_siparis,p_admin,true,p_not);
  IF sonuc.ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%',sonuc.hata USING ERRCODE='22023';END IF;
 ELSIF p_islem='teslim' THEN
  IF jsonb_typeof(p_kodlar) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Çek kodları gerekli.' USING ERRCODE='22023';END IF;
  IF jsonb_array_length(p_kodlar)<>s.adet OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_kodlar) x WHERE jsonb_typeof(x)<>'object' OR (coalesce(x->>'cek_kodu','') !~ '^[A-Za-z0-9][A-Za-z0-9 _./-]*$' OR length(x->>'cek_kodu')>512) OR (nullif(x->>'kullanim_linki','') IS NOT NULL AND (length(x->>'kullanim_linki')>2048 OR x->>'kullanim_linki' !~ '^https://[^[:space:]<>]+$'))) THEN RAISE EXCEPTION 'Her adet için geçerli alfanümerik kod ve varsa HTTPS bağlantısı girin.' USING ERRCODE='22023';END IF;
  IF (SELECT count(DISTINCT lower(btrim(x->>'cek_kodu'))) FROM jsonb_array_elements(p_kodlar)x)<>s.adet THEN RAISE EXCEPTION 'Aynı kod iki kez kullanılamaz.' USING ERRCODE='22023';END IF;
  IF s.durum='teslim_edildi' THEN
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_kodlar) WITH ORDINALITY x(veri,sira) WHERE NOT EXISTS(SELECT 1 FROM public.store_cek_teslimleri t WHERE t.siparis_id=p_siparis AND t.sira=x.sira AND t.cek_kodu=x.veri->>'cek_kodu' AND coalesce(t.kullanim_linki,'')=coalesce(x.veri->>'kullanim_linki',''))) THEN RAISE EXCEPTION 'Teslim edilmiş kodlar değiştirilemez.' USING ERRCODE='22023';END IF;
    RETURN jsonb_build_object('ok',true);
  END IF;
  IF s.durum NOT IN('hazirlaniyor','kargoda') THEN RAISE EXCEPTION 'Önce talebi hazırlamaya alın.' USING ERRCODE='22023';END IF;
  INSERT INTO public.store_cek_teslimleri(firma_id,siparis_id,kullanici_id,urun_id,sira,cek_kodu,kullanim_linki,teslim_eden)
   SELECT p_firma,p_siparis,s.kullanici_id,s.urun_id,x.sira,x.veri->>'cek_kodu',nullif(x.veri->>'kullanim_linki',''),p_admin FROM jsonb_array_elements(p_kodlar) WITH ORDINALITY x(veri,sira);
  UPDATE public.store_siparisler SET durum='teslim_edildi',teslim_alma_at=clock_timestamp(),guncellenme_at=clock_timestamp() WHERE siparis_id=p_siparis;
  SELECT concat_ws(' ',ad,soyad),eposta INTO v_ad,v_eposta FROM public.kullanicilar WHERE kullanici_id=s.kullanici_id;
  SELECT firma_adi INTO v_firma FROM public.firmalar WHERE firma_id=p_firma;
  SELECT ad INTO v_urun FROM public.store_urunler WHERE urun_id=s.urun_id;
  SELECT string_agg('Çek kodu: '||t.cek_kodu||CASE WHEN t.kullanim_linki IS NULL THEN '' ELSE E'\nKullanım bağlantısı: '||t.kullanim_linki END,E'\n\n' ORDER BY t.sira) INTO v_icerik FROM public.store_cek_teslimleri t WHERE t.siparis_id=p_siparis;
  INSERT INTO public.store_cek_eposta_kuyrugu(firma_id,siparis_id,kullanici_id,govde)
   VALUES(p_firma,p_siparis,s.kullanici_id,jsonb_build_object('from',nullif(p_from,''),'to',jsonb_build_array(v_eposta),'subject','FirmaStore hediye çekiniz hazır','text',
    'Merhaba '||v_ad||E',\n\n'||v_firma||' FirmaStore talebiniz tamamlandı.'||E'\n'||v_urun||' · '||coalesce(s.toplam_tl::text,'')||E' TL\n\n'||v_icerik||E'\n\nÇeklerinizi Cogniti Taleplerim ekranında da görebilirsiniz.\n\nCogniti'));
 ELSIF p_islem='eposta_yeniden' THEN
  SELECT * INTO e FROM public.store_cek_eposta_kuyrugu WHERE siparis_id=p_siparis AND firma_id=p_firma FOR UPDATE;
  IF NOT FOUND OR e.durum IN('gonderildi','isleniyor') OR (e.ilk_deneme_at IS NOT NULL AND e.ilk_deneme_at<clock_timestamp()-interval '23 hours') THEN RAISE EXCEPTION 'Gönderim tekrar denenemez; sağlayıcı durumunu kontrol edin.' USING ERRCODE='22023';END IF;
  IF e.ilk_deneme_at IS NULL THEN
   SELECT eposta INTO v_eposta FROM public.kullanicilar WHERE kullanici_id=s.kullanici_id;
   UPDATE public.store_cek_eposta_kuyrugu SET govde=jsonb_set(govde,'{to}',jsonb_build_array(v_eposta)) WHERE is_id=e.is_id;
  END IF;
  UPDATE public.store_cek_eposta_kuyrugu SET durum='bekliyor',sonraki_at=clock_timestamp(),hata_kodu=NULL,deneme=0 WHERE is_id=e.is_id;
 ELSE RAISE EXCEPTION 'Geçersiz işlem.' USING ERRCODE='22023';END IF;
 INSERT INTO public.store_talep_islem_gecmisi(firma_id,siparis_id,islem,onceki_durum,sonraki_durum,aciklama,yapan_id)
 SELECT p_firma,p_siparis,p_islem,v_once,durum,left(p_not,2000),p_admin FROM public.store_siparisler WHERE siparis_id=p_siparis;
 RETURN jsonb_build_object('ok',true);
END;$fn$;

CREATE OR REPLACE FUNCTION public.store_cek_eposta_is_al(p_lease uuid,p_from text,p_siparis uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $fn$
DECLARE e public.store_cek_eposta_kuyrugu%ROWTYPE;
BEGIN
 UPDATE public.store_cek_eposta_kuyrugu SET durum='kontrol',hata_kodu='SAGLAYICI_KONTROL_GEREKLI' WHERE durum IN('bekliyor','hata','isleniyor') AND ilk_deneme_at<clock_timestamp()-interval '23 hours';
 SELECT * INTO e FROM public.store_cek_eposta_kuyrugu WHERE (p_siparis IS NULL OR siparis_id=p_siparis)
  AND deneme<5 AND sonraki_at<=clock_timestamp() AND (durum IN('bekliyor','hata') OR (durum='isleniyor' AND lease_bitis<clock_timestamp())) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1;
 IF NOT FOUND THEN RETURN NULL;END IF;
 IF coalesce(e.govde->'to'->>0,'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
  UPDATE public.store_cek_eposta_kuyrugu SET durum='kontrol',hata_kodu='ALICI_EPOSTA_EKSIK' WHERE is_id=e.is_id;RETURN NULL;
 END IF;
 IF coalesce(e.govde->>'from','')='' AND coalesce(p_from,'')='' THEN RETURN NULL;END IF;
 UPDATE public.store_cek_eposta_kuyrugu SET durum='isleniyor',deneme=deneme+1,ilk_deneme_at=coalesce(ilk_deneme_at,clock_timestamp()),
 lease_id=p_lease,lease_bitis=clock_timestamp()+interval '120 seconds',govde=CASE WHEN coalesce(govde->>'from','')='' THEN jsonb_set(govde,'{from}',to_jsonb(p_from)) ELSE govde END
 WHERE is_id=e.is_id RETURNING * INTO e;
 RETURN jsonb_build_object('is_id',e.is_id,'govde',e.govde);
END;$fn$;
CREATE OR REPLACE FUNCTION public.store_cek_eposta_is_bitir(p_is uuid,p_lease uuid,p_sonuc text,p_hata text DEFAULT NULL,p_saglayici text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $fn$
BEGIN
 IF p_sonuc NOT IN('gonderildi','hata','kontrol') THEN RETURN false;END IF;
 UPDATE public.store_cek_eposta_kuyrugu SET durum=CASE WHEN p_sonuc='hata' AND deneme>=5 THEN 'kontrol' ELSE p_sonuc END,
 hata_kodu=left(p_hata,100),saglayici_id=left(p_saglayici,200),gonderim_at=CASE WHEN p_sonuc='gonderildi' THEN clock_timestamp() ELSE NULL END,
 sonraki_at=clock_timestamp()+make_interval(secs=>least(3600,60*(2^greatest(deneme-1,0))::integer)),lease_id=NULL,lease_bitis=NULL
 WHERE is_id=p_is AND lease_id=p_lease AND durum='isleniyor';
 RETURN FOUND;
END;$fn$;

CREATE OR REPLACE FUNCTION public.store_kullanici_cekleri(p_siparis uuid,p_kullanici uuid)
RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('cek_kodu',t.cek_kodu,'kullanim_linki',t.kullanim_linki,'teslim_at',t.teslim_at) ORDER BY t.sira),'[]'::jsonb)
 FROM public.store_cek_teslimleri t JOIN public.store_siparisler s USING(siparis_id)
 WHERE t.siparis_id=p_siparis AND s.kullanici_id=p_kullanici AND s.durum='teslim_edildi'
$$;
DO $patch$
DECLARE eski text;yeni text;
BEGIN
 eski:=pg_get_functiondef('public.store_kullanici_siparis_listesi(uuid,text)'::regprocedure);
 IF strpos(eski,'store_kullanici_cekleri')=0 THEN
  yeni:=replace(eski,$a$'store_urunler',CASE$a$,$b$'teslimler',public.store_kullanici_cekleri(s.siparis_id,s.kullanici_id),'store_urunler',CASE$b$);
  IF yeni=eski THEN RAISE EXCEPTION 'Kullanıcı talep listesi beklenen yapıda değil.';END IF;EXECUTE yeni;
 END IF;
END;$patch$;
DO $izinler$
DECLARE imza text;
BEGIN
 FOREACH imza IN ARRAY ARRAY['store_firma_talep_kesiti(uuid,text,date,date,text)','store_firma_talep_json(store_siparisler)','store_admin_firma_ozetleri()','store_admin_firma_talepleri(uuid,text,date,date,text,integer,boolean)','store_admin_firma_talep_islem(uuid,uuid,uuid,text,text,jsonb,text)','store_cek_eposta_is_al(uuid,text,uuid)','store_cek_eposta_is_bitir(uuid,uuid,text,text,text)','store_kullanici_cekleri(uuid,uuid)'] LOOP
  EXECUTE 'REVOKE ALL ON FUNCTION public.'||imza||' FROM PUBLIC,anon,authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.'||imza||' TO service_role';
 END LOOP;
 IF to_regprocedure('public.store_teslim_aldim(uuid,uuid)') IS NOT NULL THEN
  REVOKE ALL ON FUNCTION public.store_teslim_aldim(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
 END IF;
END;$izinler$;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.store_admin_firma_talep_islem(uuid,uuid,uuid,text,text,jsonb,text)') IS NOT NULL AS firmastore_firma_talep_yonetimi_hazir;
