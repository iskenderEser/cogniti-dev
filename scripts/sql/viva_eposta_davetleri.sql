-- Viva e-posta daveti / adım 2: kayıt temeli. KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: viva_asama1.sql, viva_anlik_planlama.sql, viva_davet_kapsami.sql.
-- Bu SQL e-posta göndermez ve uygulamadaki geçici kayıt engelini kaldırmaz.
-- Mevcut Viva RPC'leri korunur; yeni kayıt bağlantısı sonraki adımlarda kurulacak.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-eposta-davetleri'));

CREATE TABLE IF NOT EXISTS public.viva_eposta_gonderimleri (
 davet_id uuid PRIMARY KEY REFERENCES public.viva_davetler(davet_id) ON DELETE CASCADE,
 sira integer NOT NULL DEFAULT 0 CHECK(sira>=0),
 durum text NOT NULL CHECK(durum IN ('taslak','bekliyor','gonderiliyor','gonderildi','hata','kontrol','iptal')),
 deneme_sayisi integer NOT NULL DEFAULT 0 CHECK(deneme_sayisi>=0),
 ilk_deneme timestamptz, son_deneme timestamptz, sonraki_deneme timestamptz,
 gonderim_zamani timestamptz,
 saglayici_id text CHECK(length(saglayici_id)<=200),
 hata_kodu text CHECK(length(hata_kodu)<=80),
 kilit_id uuid, kilit_bitis timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(durum<>'gonderildi' OR gonderim_zamani IS NOT NULL),
 CHECK((durum='gonderiliyor')=(kilit_id IS NOT NULL AND kilit_bitis IS NOT NULL)),
 CHECK((kilit_id IS NULL)=(kilit_bitis IS NULL)),
 CHECK(durum<>'taslak' OR deneme_sayisi=0)
);
CREATE INDEX IF NOT EXISTS viva_eposta_siradaki ON public.viva_eposta_gonderimleri(sonraki_deneme,created_at)
 WHERE durum IN ('bekliyor','hata');
ALTER TABLE public.viva_eposta_gonderimleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.viva_eposta_gonderimleri FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.viva_eposta_gonderimleri TO service_role;

-- Eski davet_iptal / etkinlik iptali işlemleri de gönderim kaydını kapatır.
-- Gönderilmiş davetin geçmiş zamanı saklanır; iptal edilen bağlantı tekrar açılmaz.
CREATE OR REPLACE FUNCTION public.viva_eposta_iptal_esitle() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.iptal AND NOT OLD.iptal THEN
  UPDATE viva_eposta_gonderimleri SET durum='iptal',kilit_id=NULL,kilit_bitis=NULL,
   sonraki_deneme=NULL,updated_at=now() WHERE davet_id=NEW.davet_id;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS viva_eposta_davet_iptali ON public.viva_davetler;
CREATE TRIGGER viva_eposta_davet_iptali AFTER UPDATE OF iptal ON public.viva_davetler
 FOR EACH ROW EXECUTE FUNCTION public.viva_eposta_iptal_esitle();

-- Ayrıntıda yalnız yayıncı adresleri/durumları görür; token özeti ve iş kilidi dönmez.
CREATE OR REPLACE FUNCTION public.viva_eposta_detay(p_auth uuid,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sonuc jsonb; davetler jsonb:='[]'::jsonb;
BEGIN
 sonuc:=viva_detay(p_auth,p_id);
 IF EXISTS(SELECT 1 FROM viva_etkinlikler WHERE etkinlik_id=p_id AND sahip_id=p_auth) THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object(
   'davet_id',d.davet_id,'eposta',d.eposta,'iptal',d.iptal,'durum',g.durum,
   'deneme_sayisi',g.deneme_sayisi,'son_deneme',g.son_deneme,
   'gonderim_zamani',g.gonderim_zamani,'hata_kodu',g.hata_kodu
  ) ORDER BY g.sira,g.created_at,d.davet_id),'[]'::jsonb) INTO davetler
  FROM viva_davetler d JOIN viva_eposta_gonderimleri g USING(davet_id) WHERE d.etkinlik_id=p_id;
 END IF;
 RETURN sonuc||jsonb_build_object('eposta_davetleri',davetler);
END $$;

-- p_veri: normal yayın formu + davet_epostalari:string[].
-- p_davetler: yalnız sunucunun yeni adresler için hazırladığı {eposta,davet_id,token_hash}[];
-- ham katılım token'ı hiçbir tabloda veya oluşturma özetinde saklanmaz.
-- Yeni aday kimlikleri ayrı parametredir: yanıt kaybındaki tekrar aynı formdan tanınır.
CREATE OR REPLACE FUNCTION public.viva_eposta_kaydet(
 p_auth uuid,p_islem text,p_veri jsonb,p_davetler jsonb DEFAULT '[]'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 e viva_etkinlikler%ROWTYPE; d viva_davetler%ROWTYPE;
 id uuid; yeni_id uuid; item jsonb; adaylar jsonb; aday jsonb;
 adres text; adresler text[]:=ARRAY[]::text[]; veri jsonb; v_sira integer:=0;
BEGIN
 IF p_auth IS NULL OR NOT viva_duzenleyen_aktif(p_auth) THEN
  RAISE EXCEPTION 'Etkinlik yönetme yetkiniz yok.' USING ERRCODE='42501';
 END IF;
 IF p_islem IS NULL OR p_islem NOT IN ('olustur','kaydet')
  OR jsonb_typeof(p_veri) IS DISTINCT FROM 'object'
  OR jsonb_typeof(p_veri->'davet_epostalari') IS DISTINCT FROM 'array'
  OR jsonb_typeof(p_davetler) IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'E-posta davet bilgileri geçersiz.' USING ERRCODE='22023';
 END IF;
 id:=(p_veri->>'etkinlik_id')::uuid;
 IF id IS NULL THEN RAISE EXCEPTION 'Etkinlik kimliği gerekli.' USING ERRCODE='22023'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_veri->'davet_epostalari') LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'string' THEN
   RAISE EXCEPTION 'E-posta adresi geçersiz.' USING ERRCODE='22023';
  END IF;
  adres:=lower(btrim(item#>>'{}'));
  IF length(adres) NOT BETWEEN 3 AND 254 OR adres !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
   RAISE EXCEPTION 'E-posta adresi geçersiz.' USING ERRCODE='22023';
  END IF;
  IF NOT adres=ANY(adresler) THEN adresler:=array_append(adresler,adres); END IF;
 END LOOP;
 veri:=CASE WHEN cardinality(adresler)=0 THEN p_veri-'davet_epostalari'
  ELSE jsonb_set(p_veri,'{davet_epostalari}',to_jsonb(adresler)) END;
 PERFORM pg_advisory_xact_lock(hashtextextended(id::text,0));
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=id FOR UPDATE;
 IF FOUND AND p_islem='olustur' THEN
  IF e.sahip_id<>p_auth OR NOT viva_sahip_aktif(id) THEN
   RAISE EXCEPTION 'Etkinliği yönetme yetkiniz yok.' USING ERRCODE='42501';
  END IF;
  IF e.olusturma_ozeti<>veri THEN
   RAISE EXCEPTION 'Bu işlem anahtarı başka bir kayıt için kullanılmış.' USING ERRCODE='40001';
  END IF;
  -- Daha sonra düzenlenmiş/iptal edilmiş yayını eski oluşturma isteğiyle geri alma.
  RETURN viva_eposta_detay(p_auth,id);
 END IF;

 -- Yayın, katılımcılar, adresler ve durumlar aynı transaction içinde yazılır.
 PERFORM viva_islem(p_auth,p_islem,veri);
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=id;
 UPDATE viva_davetler vd SET iptal=true,kod_hash=NULL,kod_bitis=NULL,
  oturum_hash=NULL,oturum_bitis=NULL
 WHERE vd.etkinlik_id=id AND NOT vd.iptal AND NOT vd.eposta=ANY(adresler)
  AND EXISTS(SELECT 1 FROM viva_eposta_gonderimleri g WHERE g.davet_id=vd.davet_id);

 FOREACH adres IN ARRAY adresler LOOP
  SELECT * INTO d FROM viva_davetler WHERE etkinlik_id=id AND eposta=adres AND NOT iptal FOR UPDATE;
  IF FOUND THEN
   IF NOT EXISTS(SELECT 1 FROM viva_eposta_gonderimleri WHERE davet_id=d.davet_id) THEN
    RAISE EXCEPTION 'Bu adresin mevcut bağlantı davetini önce kaldırın.' USING ERRCODE='22023';
   END IF;
   -- Aynı adrese yeni gönderim kaydı açılmaz; gönderilmiş durum korunur.
   UPDATE viva_eposta_gonderimleri SET sira=v_sira,
    durum=CASE WHEN durum='taslak' AND e.durum='planlandi' THEN 'bekliyor' ELSE durum END,
    updated_at=now() WHERE davet_id=d.davet_id;
  ELSE
   SELECT jsonb_agg(value) INTO adaylar FROM jsonb_array_elements(p_davetler)
    WHERE lower(btrim(value->>'eposta'))=adres;
   IF jsonb_array_length(adaylar) IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Yeni davet için tek bağlantı özeti gerekli.' USING ERRCODE='22023';
   END IF;
   aday:=adaylar->0;
   IF jsonb_typeof(aday->'davet_id') IS DISTINCT FROM 'string'
    OR jsonb_typeof(aday->'token_hash') IS DISTINCT FROM 'string'
    OR coalesce(aday->>'token_hash','') !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Davet bağlantısı özeti geçersiz.' USING ERRCODE='22023';
   END IF;
   yeni_id:=(aday->>'davet_id')::uuid;
   INSERT INTO viva_davetler(davet_id,etkinlik_id,ad,eposta,token_hash)
    VALUES(yeni_id,id,'Davetli',adres,aday->>'token_hash');
   INSERT INTO viva_eposta_gonderimleri(davet_id,sira,durum)
    VALUES(yeni_id,v_sira,CASE WHEN e.durum='taslak' THEN 'taslak' ELSE 'bekliyor' END);
  END IF;
  v_sira:=v_sira+1;
 END LOOP;
 RETURN viva_eposta_detay(p_auth,id);
END $$;

REVOKE ALL ON FUNCTION public.viva_eposta_iptal_esitle(),public.viva_eposta_detay(uuid,uuid),
 public.viva_eposta_kaydet(uuid,text,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_eposta_iptal_esitle(),public.viva_eposta_detay(uuid,uuid),
 public.viva_eposta_kaydet(uuid,text,jsonb,jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT to_regprocedure('public.viva_eposta_kaydet(uuid,text,jsonb,jsonb)') IS NOT NULL AS eposta_kayit_fonksiyonu,
 NOT has_function_privilege('anon','public.viva_eposta_kaydet(uuid,text,jsonb,jsonb)','EXECUTE') AS anon_kapali,
 NOT has_function_privilege('authenticated','public.viva_eposta_kaydet(uuid,text,jsonb,jsonb)','EXECUTE') AS istemci_kapali,
 has_function_privilege('service_role','public.viva_eposta_kaydet(uuid,text,jsonb,jsonb)','EXECUTE') AS sunucu_acik;
