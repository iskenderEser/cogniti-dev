-- Viva 1. aşama. Yalnız yeni Viva nesnelerini kurar; mevcut öğrenme/puan tablolarına yazmaz.
-- Bu dosya canlı kurulum teyidi değildir. Önce izole PostgreSQL'de doğrulanır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-asama1'));

CREATE TABLE IF NOT EXISTS public.viva_etkinlikler (
 etkinlik_id uuid PRIMARY KEY,
 sahip_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 firma_id uuid REFERENCES public.firmalar(firma_id),
 baslik text NOT NULL CHECK(length(btrim(baslik)) BETWEEN 1 AND 160),
 aciklama text NOT NULL DEFAULT '' CHECK(length(aciklama)<=4000),
 baslangic timestamptz NOT NULL, bitis timestamptz NOT NULL CHECK(bitis>baslangic),
 durum text NOT NULL DEFAULT 'taslak' CHECK(durum IN ('taslak','planlandi','canli','sona_erdi','iptal')),
 surum integer NOT NULL DEFAULT 1 CHECK(surum>0),
 olusturma_ozeti jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.viva_katilimcilar (
 etkinlik_id uuid NOT NULL REFERENCES public.viva_etkinlikler ON DELETE CASCADE,
 tur text NOT NULL CHECK(tur IN ('ic','eclub')),
 kullanici_id uuid REFERENCES public.kullanicilar(kullanici_id),
 kisi_id uuid REFERENCES public.eclub_kisiler(kisi_id),
 CHECK((tur='ic' AND kullanici_id IS NOT NULL AND kisi_id IS NULL) OR
       (tur='eclub' AND kullanici_id IS NULL AND kisi_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS viva_katilimci_ic_tek ON public.viva_katilimcilar(etkinlik_id,kullanici_id) WHERE tur='ic';
CREATE UNIQUE INDEX IF NOT EXISTS viva_katilimci_eclub_tek ON public.viva_katilimcilar(etkinlik_id,kisi_id) WHERE tur='eclub';
CREATE INDEX IF NOT EXISTS viva_sahip_tarih ON public.viva_etkinlikler(sahip_id,baslangic);
CREATE TABLE IF NOT EXISTS public.viva_davetler (
 davet_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), etkinlik_id uuid NOT NULL REFERENCES public.viva_etkinlikler ON DELETE CASCADE,
 ad text NOT NULL CHECK(length(btrim(ad)) BETWEEN 1 AND 120),
 eposta text NOT NULL CHECK(length(eposta)<=254 AND eposta ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 iptal boolean NOT NULL DEFAULT false,
 kod_hash text, kod_bitis timestamptz, kod_gonderim timestamptz,
 gonderim_pencere timestamptz, gonderim_sayisi integer NOT NULL DEFAULT 0,
 deneme integer NOT NULL DEFAULT 0,
 oturum_hash text, oturum_bitis timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS viva_davet_eposta_tek ON public.viva_davetler(etkinlik_id,eposta) WHERE NOT iptal;
ALTER TABLE public.viva_etkinlikler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_katilimcilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_davetler ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.viva_etkinlikler,public.viva_katilimcilar,public.viva_davetler FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.viva_etkinlikler,public.viva_katilimcilar,public.viva_davetler TO service_role;

CREATE OR REPLACE FUNCTION public.viva_duzenleyen_aktif(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM kullanicilar k LEFT JOIN firmalar f ON f.firma_id=k.firma_id
 WHERE k.kullanici_id=p_id AND k.aktif_mi IS TRUE
 AND (k.firma_id IS NULL OR f.aktif IS TRUE))
$$;

-- Organizasyonsuz platform çalışanları yalnız kendi platform ekibine erişir.
-- UTT/BM: bölge; TM/PM: takım; diğer firma rolleri: firma.
CREATE OR REPLACE FUNCTION public.viva_ic_kapsam(p_sahip uuid,p_hedef uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM kullanicilar s JOIN kullanicilar h ON h.kullanici_id=p_hedef
 LEFT JOIN bolgeler sb ON sb.bolge_id=s.bolge_id LEFT JOIN bolgeler hb ON hb.bolge_id=h.bolge_id
 WHERE s.kullanici_id=p_sahip AND viva_duzenleyen_aktif(s.kullanici_id) AND h.aktif_mi IS TRUE
 AND s.firma_id IS NOT DISTINCT FROM h.firma_id AND (
 s.kullanici_id=h.kullanici_id OR
 CASE WHEN s.firma_id IS NULL THEN true
 WHEN s.rol IN ('utt','kd_utt','bm') THEN s.bolge_id IS NOT NULL AND h.bolge_id=s.bolge_id
 WHEN s.rol IN ('tm','pm','jr_pm','kd_pm') THEN coalesce(sb.takim_id,s.takim_id) IS NOT NULL
   AND coalesce(hb.takim_id,h.takim_id)=coalesce(sb.takim_id,s.takim_id)
 ELSE true END))
$$;

CREATE OR REPLACE FUNCTION public.viva_eclub_kapsam(p_sahip uuid,p_kisi uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM kullanicilar s
 JOIN firmalar f ON f.firma_id=s.firma_id AND f.aktif AND f.eclub_aktif
 JOIN eclub_eczane_firma ef ON ef.firma_id=f.firma_id AND ef.aktif_mi
 JOIN eclub_utt_eczane ue ON ue.eczane_firma_id=ef.id AND ue.aktif_mi
 JOIN kullanicilar u ON u.kullanici_id=ue.utt_id AND u.aktif_mi AND u.firma_id=f.firma_id
 JOIN eclub_kisi_eczane ke ON ke.eczane_id=ef.eczane_id AND ke.aktif_mi
 JOIN eclub_kisiler ek ON ek.kisi_id=ke.kisi_id
 WHERE s.kullanici_id=p_sahip AND s.aktif_mi AND ek.kisi_id=p_kisi
 AND CASE WHEN s.rol IN ('utt','kd_utt') THEN u.kullanici_id=s.kullanici_id
 ELSE viva_ic_kapsam(s.kullanici_id,u.kullanici_id) END)
$$;

CREATE OR REPLACE FUNCTION public.viva_sahip_aktif(p_etkinlik uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM viva_etkinlikler e JOIN kullanicilar s ON s.kullanici_id=e.sahip_id
 WHERE e.etkinlik_id=p_etkinlik AND viva_duzenleyen_aktif(s.kullanici_id)
 AND e.firma_id IS NOT DISTINCT FROM s.firma_id)
$$;

CREATE OR REPLACE FUNCTION public.viva_erisim(p_auth uuid,p_etkinlik uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM viva_etkinlikler e WHERE e.etkinlik_id=p_etkinlik AND viva_sahip_aktif(e.etkinlik_id)
 AND (e.sahip_id=p_auth OR (e.durum<>'taslak' AND EXISTS(
 SELECT 1 FROM viva_katilimcilar k LEFT JOIN eclub_kisiler ek ON ek.kisi_id=k.kisi_id
 WHERE k.etkinlik_id=e.etkinlik_id AND (
 (k.tur='ic' AND k.kullanici_id=p_auth AND viva_ic_kapsam(e.sahip_id,p_auth)) OR
 (k.tur='eclub' AND ek.auth_user_id=p_auth AND viva_eclub_kapsam(e.sahip_id,k.kisi_id)))))))
$$;

CREATE OR REPLACE FUNCTION public.viva_kisiler(p_sahip uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(x ORDER BY x->>'ad'),'[]'::jsonb) FROM (
 SELECT jsonb_build_object('id',k.kullanici_id,'tur','ic','ad',k.ad||' '||k.soyad,'alt',k.rol) x
 FROM kullanicilar k WHERE k.kullanici_id<>p_sahip AND viva_ic_kapsam(p_sahip,k.kullanici_id)
 UNION ALL
 SELECT jsonb_build_object('id',k.kisi_id,'tur','eclub','ad',k.ad||' '||k.soyad,'alt',k.rol)
 FROM eclub_kisiler k WHERE viva_eclub_kapsam(p_sahip,k.kisi_id)) adaylar
$$;

CREATE OR REPLACE FUNCTION public.viva_ozet(p_auth uuid,p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('etkinlik_id',e.etkinlik_id,'baslik',e.baslik,'aciklama',e.aciklama,
 'baslangic',e.baslangic,'bitis',e.bitis,'durum',e.durum,'surum',e.surum,'sahip_id',e.sahip_id,
 'sahip_adi',s.ad||' '||s.soyad,'firma_adi',coalesce(f.firma_adi,'Cogniti'),
 'yonetebilir',e.sahip_id=p_auth,'oda_acik',e.durum IN ('planlandi','canli') AND e.bitis>now())
 FROM viva_etkinlikler e JOIN kullanicilar s ON s.kullanici_id=e.sahip_id
 LEFT JOIN firmalar f ON f.firma_id=e.firma_id WHERE e.etkinlik_id=p_id
$$;

CREATE OR REPLACE FUNCTION public.viva_detay(p_auth uuid,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sahip boolean; kisiler jsonb; davetler jsonb;
BEGIN
 IF NOT viva_erisim(p_auth,p_id) THEN RAISE EXCEPTION 'Etkinliğe erişim yetkiniz yok.' USING ERRCODE='42501'; END IF;
 SELECT sahip_id=p_auth INTO sahip FROM viva_etkinlikler WHERE etkinlik_id=p_id;
 IF sahip THEN
 SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO kisiler FROM (
 SELECT jsonb_build_object('id',coalesce(k.kullanici_id,k.kisi_id),'tur',k.tur,
 'ad',coalesce(i.ad,ek.ad)||' '||coalesce(i.soyad,ek.soyad),'alt',coalesce(i.rol,ek.rol)) x
 FROM viva_katilimcilar k LEFT JOIN kullanicilar i ON i.kullanici_id=k.kullanici_id
 LEFT JOIN eclub_kisiler ek ON ek.kisi_id=k.kisi_id WHERE k.etkinlik_id=p_id) t;
 SELECT coalesce(jsonb_agg(jsonb_build_object('davet_id',davet_id,'ad',ad,'eposta',eposta,'iptal',iptal) ORDER BY created_at),'[]'::jsonb)
 INTO davetler FROM viva_davetler WHERE etkinlik_id=p_id;
 END IF;
 RETURN jsonb_build_object('etkinlik',viva_ozet(p_auth,p_id),'katilimcilar',coalesce(kisiler,'[]'),
 'davetler',coalesce(davetler,'[]'));
END $$;

CREATE OR REPLACE FUNCTION public.viva_islem(p_auth uuid,p_islem text,p_veri jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e viva_etkinlikler%ROWTYPE; s kullanicilar%ROWTYPE; k jsonb; id uuid; yeni boolean:=false;
 bas timestamptz; bit timestamptz; v_durum text; sonuc jsonb; offst integer;
BEGIN
 IF p_islem IN ('baglam','liste') THEN
 IF p_islem='baglam' THEN
 SELECT * INTO s FROM kullanicilar WHERE kullanici_id=p_auth AND viva_duzenleyen_aktif(p_auth);
 IF NOT FOUND THEN
 IF NOT EXISTS(SELECT 1 FROM eclub_kisiler ek JOIN eclub_kisi_eczane ke ON ke.kisi_id=ek.kisi_id AND ke.aktif_mi
 JOIN eclub_eczane_firma ef ON ef.eczane_id=ke.eczane_id AND ef.aktif_mi
 JOIN firmalar f ON f.firma_id=ef.firma_id AND f.aktif AND f.eclub_aktif WHERE ek.auth_user_id=p_auth)
 THEN RAISE EXCEPTION 'Viva erişiminiz yok.' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('olusturabilir',false,'kapsam','Davet edildiğiniz etkinlikler','kisiler','[]'::jsonb);
 END IF;
 RETURN jsonb_build_object('olusturabilir',true,'kapsam',CASE WHEN s.firma_id IS NULL THEN 'Cogniti platform ekibi'
 WHEN s.rol IN ('utt','kd_utt','bm') THEN 'Kendi bölgeniz ve yetkili EClub listeniz'
 WHEN s.rol IN ('tm','pm','jr_pm','kd_pm') THEN 'Kendi takımınız' ELSE 'Kendi firmanız' END,'kisiler',viva_kisiler(p_auth));
 END IF;
 offst:=greatest(0,coalesce((p_veri->>'offset')::integer,0));
 SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO sonuc FROM
 (SELECT viva_ozet(p_auth,etkinlik_id) x FROM viva_etkinlikler WHERE viva_erisim(p_auth,etkinlik_id)
 ORDER BY baslangic DESC,etkinlik_id LIMIT 21 OFFSET offst) t;
 RETURN jsonb_build_object('etkinlikler',(SELECT coalesce(jsonb_agg(value),'[]'::jsonb) FROM jsonb_array_elements(sonuc) WITH ORDINALITY a(value,n) WHERE n<=20),
 'devam_var',jsonb_array_length(sonuc)>20);
 END IF;
 id:=(p_veri->>'etkinlik_id')::uuid;
 IF p_islem='detay' THEN RETURN viva_detay(p_auth,id); END IF;
 IF NOT viva_duzenleyen_aktif(p_auth) THEN RAISE EXCEPTION 'Etkinlik yönetme yetkiniz yok.' USING ERRCODE='42501'; END IF;
 SELECT * INTO s FROM kullanicilar WHERE kullanici_id=p_auth;
 IF p_islem='olustur' THEN
 PERFORM pg_advisory_xact_lock(hashtextextended(id::text,0));
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=id FOR UPDATE;
 IF FOUND THEN
 IF e.sahip_id<>p_auth OR e.olusturma_ozeti<>p_veri THEN RAISE EXCEPTION 'Bu işlem anahtarı başka bir kayıt için kullanılmış.' USING ERRCODE='40001'; END IF;
 RETURN viva_detay(p_auth,id);
 END IF;
 yeni:=true;
 ELSE
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=id FOR UPDATE;
 IF NOT FOUND OR e.sahip_id<>p_auth OR NOT viva_sahip_aktif(id) THEN RAISE EXCEPTION 'Etkinliği yönetme yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF e.surum<>coalesce((p_veri->>'surum')::integer,0) THEN RAISE EXCEPTION 'Etkinlik değişti. Güncel halini açıp yeniden deneyin.' USING ERRCODE='40001'; END IF;
 END IF;
 IF p_islem IN ('olustur','kaydet') THEN
 IF NOT yeni AND e.durum NOT IN ('taslak','planlandi') THEN RAISE EXCEPTION 'Bu etkinlik artık düzenlenemez.' USING ERRCODE='22023'; END IF;
 bas:=(p_veri->>'baslangic')::timestamptz; bit:=(p_veri->>'bitis')::timestamptz; v_durum:=p_veri->>'durum';
 IF bas IS NULL OR bit IS NULL OR bit<=bas OR coalesce(v_durum,'') NOT IN ('taslak','planlandi')
 OR (NOT yeni AND e.durum='planlandi' AND v_durum='taslak')
 OR (v_durum='planlandi' AND bas<=now()) OR coalesce(length(btrim(p_veri->>'baslik')),0) NOT BETWEEN 1 AND 160
 OR length(coalesce(p_veri->>'aciklama',''))>4000 OR jsonb_typeof(p_veri->'katilimcilar') IS DISTINCT FROM 'array'
 THEN RAISE EXCEPTION 'Başlık, tarih, durum veya katılımcılar geçersiz.' USING ERRCODE='22023'; END IF;
 FOR k IN SELECT value FROM jsonb_array_elements(p_veri->'katilimcilar') LOOP
 IF coalesce(k->>'tur','') NOT IN ('ic','eclub') OR k->>'id' IS NULL OR
 NOT (CASE WHEN k->>'tur'='ic' THEN viva_ic_kapsam(p_auth,(k->>'id')::uuid) ELSE viva_eclub_kapsam(p_auth,(k->>'id')::uuid) END)
 THEN RAISE EXCEPTION 'Katılımcı organizasyon kapsamınızın dışında.' USING ERRCODE='42501'; END IF;
 END LOOP;
 IF yeni THEN
 INSERT INTO viva_etkinlikler(etkinlik_id,sahip_id,firma_id,baslik,aciklama,baslangic,bitis,durum,olusturma_ozeti)
 VALUES(id,p_auth,s.firma_id,btrim(p_veri->>'baslik'),coalesce(p_veri->>'aciklama',''),bas,bit,v_durum,p_veri);
 ELSE
 UPDATE viva_etkinlikler SET baslik=btrim(p_veri->>'baslik'),aciklama=coalesce(p_veri->>'aciklama',''),baslangic=bas,bitis=bit,
 durum=v_durum,surum=surum+1,updated_at=now() WHERE etkinlik_id=id;
 DELETE FROM viva_katilimcilar WHERE etkinlik_id=id;
 END IF;
 INSERT INTO viva_katilimcilar(etkinlik_id,tur,kullanici_id,kisi_id)
 SELECT id,value->>'tur',CASE WHEN value->>'tur'='ic' THEN (value->>'id')::uuid END,
 CASE WHEN value->>'tur'='eclub' THEN (value->>'id')::uuid END FROM jsonb_array_elements(p_veri->'katilimcilar');
 ELSIF p_islem='iptal' THEN
 IF e.durum NOT IN ('taslak','planlandi','iptal') THEN RAISE EXCEPTION 'Bu aşamada canlı etkinlik yönetimi bağlı değil.' USING ERRCODE='22023'; END IF;
 UPDATE viva_etkinlikler SET durum='iptal',surum=surum+1,updated_at=now() WHERE etkinlik_id=id;
 UPDATE viva_davetler SET iptal=true,kod_hash=NULL,oturum_hash=NULL WHERE etkinlik_id=id;
 ELSIF p_islem='davet_ekle' THEN
 IF e.durum<>'planlandi' OR e.bitis<=now() THEN RAISE EXCEPTION 'Özel davet için geçerli planlanmış etkinlik gerekir.' USING ERRCODE='22023'; END IF;
 -- Aynı adrese yeni bağlantı verildiğinde önceki davet ve oturum kapanır.
 UPDATE viva_davetler SET iptal=true,kod_hash=NULL,oturum_hash=NULL WHERE etkinlik_id=id AND eposta=lower(btrim(p_veri->>'eposta')) AND NOT iptal;
 INSERT INTO viva_davetler(etkinlik_id,ad,eposta,token_hash) VALUES(id,btrim(p_veri->>'ad'),lower(btrim(p_veri->>'eposta')),p_veri->>'hash');
 UPDATE viva_etkinlikler SET surum=surum+1,updated_at=now() WHERE etkinlik_id=id;
 ELSIF p_islem='davet_iptal' THEN
 UPDATE viva_davetler SET iptal=true,kod_hash=NULL,oturum_hash=NULL WHERE etkinlik_id=id AND davet_id=(p_veri->>'davet_id')::uuid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Davet bulunamadı.' USING ERRCODE='22023'; END IF;
 UPDATE viva_etkinlikler SET surum=surum+1,updated_at=now() WHERE etkinlik_id=id;
 ELSE RAISE EXCEPTION 'Geçersiz Viva işlemi.' USING ERRCODE='22023'; END IF;
 RETURN viva_detay(p_auth,id);
END $$;

CREATE OR REPLACE FUNCTION public.viva_misafir_islem(p_hash text,p_islem text,p_veri jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d viva_davetler%ROWTYPE; e viva_etkinlikler%ROWTYPE; o jsonb; dogrulandi boolean;
BEGIN
 -- Yönetim işlemleriyle aynı kilit sırası: önce etkinlik, sonra davet.
 SELECT etkinlik_id INTO e.etkinlik_id FROM viva_davetler WHERE token_hash=p_hash;
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=e.etkinlik_id FOR SHARE;
 SELECT * INTO d FROM viva_davetler WHERE token_hash=p_hash FOR UPDATE;
 IF d.davet_id IS NULL OR d.iptal OR e.durum NOT IN ('planlandi','canli') OR e.bitis<=now() OR NOT viva_sahip_aktif(e.etkinlik_id)
 THEN RETURN jsonb_build_object('hata','Davet geçersiz, iptal edilmiş veya süresi dolmuş.','status',403); END IF;
 o:=jsonb_build_object('baslik',e.baslik,'aciklama',e.aciklama,'baslangic',e.baslangic,'bitis',e.bitis,
 'ad',d.ad,'eposta_maskeli',left(split_part(d.eposta,'@',1),1)||'***@'||split_part(d.eposta,'@',2));
 dogrulandi:=coalesce(d.oturum_hash IS NOT NULL AND d.oturum_hash=p_veri->>'oturum_hash' AND d.oturum_bitis>now(),false);
 IF p_islem='bilgi' THEN RETURN o||jsonb_build_object('dogrulandi',dogrulandi); END IF;
 IF p_islem='kod_ayir' THEN
 IF d.kod_gonderim>now()-interval '60 seconds' THEN RETURN jsonb_build_object('hata','Yeni kod için bir dakika bekleyin.','status',429); END IF;
 IF d.gonderim_pencere>now()-interval '1 hour' AND d.gonderim_sayisi>=5 THEN RETURN jsonb_build_object('hata','Kod gönderim sınırına ulaşıldı. Daha sonra deneyin.','status',429); END IF;
 IF coalesce(p_veri->>'kod_hash','') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Geçersiz kod.' USING ERRCODE='22023'; END IF;
 UPDATE viva_davetler SET kod_hash=p_veri->>'kod_hash',kod_bitis=least(e.bitis,now()+interval '10 minutes'),deneme=0,
 kod_gonderim=now(),gonderim_sayisi=CASE WHEN gonderim_pencere>now()-interval '1 hour' THEN gonderim_sayisi+1 ELSE 1 END,
 gonderim_pencere=CASE WHEN gonderim_pencere>now()-interval '1 hour' THEN gonderim_pencere ELSE now() END WHERE davet_id=d.davet_id;
 RETURN jsonb_build_object('eposta',d.eposta,'ad',d.ad,'baslik',e.baslik,'davet_id',d.davet_id);
 ELSIF p_islem='kod_iptal' THEN
 UPDATE viva_davetler SET kod_hash=NULL,kod_bitis=NULL WHERE davet_id=d.davet_id AND kod_hash=p_veri->>'kod_hash';
 RETURN '{}'::jsonb;
 ELSIF p_islem='dogrula' THEN
 IF d.kod_hash IS NULL OR d.kod_bitis<=now() OR d.deneme>=5 THEN RETURN jsonb_build_object('hata','Kodun süresi doldu veya deneme hakkı bitti. Yeni kod isteyin.','status',403); END IF;
 IF d.kod_hash IS DISTINCT FROM p_veri->>'kod_hash' THEN
 UPDATE viva_davetler SET deneme=deneme+1 WHERE davet_id=d.davet_id;
 RETURN jsonb_build_object('hata','Doğrulama kodu hatalı.','status',403);
 END IF;
 IF coalesce(p_veri->>'oturum_hash','') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Geçersiz oturum.' USING ERRCODE='22023'; END IF;
 UPDATE viva_davetler SET kod_hash=NULL,kod_bitis=NULL,oturum_hash=p_veri->>'oturum_hash',
 oturum_bitis=least(e.bitis,now()+interval '12 hours') WHERE davet_id=d.davet_id;
 RETURN o||jsonb_build_object('dogrulandi',true,'oturum_bitis',least(e.bitis,now()+interval '12 hours'));
 ELSE RAISE EXCEPTION 'Geçersiz misafir işlemi.' USING ERRCODE='22023'; END IF;
END $$;

-- Tüm erişim sunucu API'leri ve service_role üzerinden. Yardımcılar da public çalıştırmaya kapalı.
REVOKE ALL ON FUNCTION public.viva_duzenleyen_aktif(uuid),public.viva_ic_kapsam(uuid,uuid),public.viva_eclub_kapsam(uuid,uuid),
 public.viva_sahip_aktif(uuid),public.viva_erisim(uuid,uuid),public.viva_kisiler(uuid),public.viva_ozet(uuid,uuid),
 public.viva_detay(uuid,uuid),public.viva_islem(uuid,text,jsonb),public.viva_misafir_islem(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_islem(uuid,text,jsonb),public.viva_misafir_islem(text,text,jsonb) TO service_role;
COMMIT;
