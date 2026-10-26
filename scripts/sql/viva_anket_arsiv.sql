-- KULLANICI ÇALIŞTIRACAK. Önkoşul: Viva 1 ve 2 aşamalarının mevcut kurulumu.
-- HTTP/Daily çağrısı yapmaz. Soru ve cevap arşivi yalnız ilgili yayın sahibine açıktır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-anket-arsiv'));
CREATE TABLE IF NOT EXISTS public.viva_anket_sorulari(
 soru_id uuid PRIMARY KEY, etkinlik_id uuid NOT NULL REFERENCES public.viva_etkinlikler ON DELETE CASCADE,
 soru text NOT NULL CHECK(length(btrim(soru)) BETWEEN 1 AND 300),
 secenekler jsonb NOT NULL CHECK(jsonb_typeof(secenekler)='array' AND jsonb_array_length(secenekler) BETWEEN 2 AND 8),
 silindi boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(etkinlik_id,soru_id)
);
CREATE TABLE IF NOT EXISTS public.viva_anket_oturumlari(
 oturum_id uuid PRIMARY KEY, etkinlik_id uuid NOT NULL REFERENCES public.viva_etkinlikler ON DELETE CASCADE,
 soru_id uuid NOT NULL, sira bigint GENERATED ALWAYS AS IDENTITY,
 acildi timestamptz NOT NULL DEFAULT now(), kapandi timestamptz,
 FOREIGN KEY(etkinlik_id,soru_id) REFERENCES public.viva_anket_sorulari(etkinlik_id,soru_id),
 CHECK(kapandi IS NULL OR kapandi>=acildi)
);
CREATE UNIQUE INDEX IF NOT EXISTS viva_anket_tek_acik ON public.viva_anket_oturumlari(etkinlik_id) WHERE kapandi IS NULL;
CREATE INDEX IF NOT EXISTS viva_anket_etkinlik_sira ON public.viva_anket_oturumlari(etkinlik_id,sira DESC);
CREATE TABLE IF NOT EXISTS public.viva_anket_cevaplari(
 oturum_id uuid NOT NULL REFERENCES public.viva_anket_oturumlari ON DELETE CASCADE,
 auth_id uuid NOT NULL, secim integer NOT NULL CHECK(secim BETWEEN 0 AND 7),
 cevap_zamani timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(oturum_id,auth_id)
);
ALTER TABLE public.viva_anket_sorulari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_anket_oturumlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_anket_cevaplari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.viva_anket_sorulari,public.viva_anket_oturumlari,public.viva_anket_cevaplari FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.viva_anket_sorulari,public.viva_anket_oturumlari,public.viva_anket_cevaplari TO service_role;

CREATE OR REPLACE FUNCTION public.viva_anket_ozet(p_oturum uuid,p_auth uuid,p_sahip boolean)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('soru',jsonb_build_object('id',a.oturum_id,'question',s.soru,'options',s.secenekler),
 'acik',a.kapandi IS NULL AND e.durum IN ('planlandi','canli') AND e.baslangic<=now() AND e.bitis>now(),
 'surum',a.sira*2+CASE WHEN a.kapandi IS NULL THEN 0 ELSE 1 END,
 'acildi',a.acildi,'kapandi',a.kapandi,
 'secim',(SELECT c.secim FROM viva_anket_cevaplari c WHERE c.oturum_id=a.oturum_id AND c.auth_id=p_auth),
 'sayilar',CASE WHEN p_sahip THEN (SELECT jsonb_agg((SELECT count(*) FROM viva_anket_cevaplari c WHERE c.oturum_id=a.oturum_id AND c.secim=i) ORDER BY i)
  FROM generate_series(0,jsonb_array_length(s.secenekler)-1) i) ELSE '[]'::jsonb END)
 FROM viva_anket_oturumlari a JOIN viva_anket_sorulari s USING(soru_id) JOIN viva_etkinlikler e ON e.etkinlik_id=a.etkinlik_id
 WHERE a.oturum_id=p_oturum
$$;
REVOKE ALL ON FUNCTION public.viva_anket_ozet(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.viva_anket_islem(p_auth uuid,p_etkinlik uuid,p_islem text,p_veri jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e viva_etkinlikler%ROWTYPE; sahip boolean; s viva_anket_sorulari%ROWTYPE; a viva_anket_oturumlari%ROWTYPE;
 v jsonb; q jsonb; sid uuid; oid uuid; sec integer; aktif uuid;
BEGIN
 IF p_islem NOT IN ('liste','aktif','soru_ekle','sorular_yukle','soru_sil','ac','kapat','cevap') OR p_auth IS NULL
 THEN RAISE EXCEPTION 'Geçersiz anket işlemi.' USING ERRCODE='42501'; END IF;
 IF p_islem IN ('liste','aktif') THEN
  SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=p_etkinlik;
 ELSE SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=p_etkinlik FOR UPDATE;
 END IF;
 IF e.etkinlik_id IS NULL OR NOT viva_erisim(p_auth,p_etkinlik)
 THEN RAISE EXCEPTION 'Anket erişimi yok.' USING ERRCODE='42501'; END IF;
 sahip:=e.sahip_id=p_auth;
 IF p_islem NOT IN ('aktif','cevap') AND NOT sahip
 THEN RAISE EXCEPTION 'Yalnız yayıncı.' USING ERRCODE='42501'; END IF;
 IF p_islem IN ('soru_ekle','sorular_yukle') THEN
  IF e.durum NOT IN ('taslak','planlandi','canli') THEN RAISE EXCEPTION 'Yayın kapalı.' USING ERRCODE='22023'; END IF;
  v:=CASE WHEN p_islem='soru_ekle' THEN jsonb_build_array(p_veri->'soru') ELSE p_veri->'sorular' END;
  IF jsonb_typeof(v) IS DISTINCT FROM 'array' OR jsonb_array_length(v) NOT BETWEEN 1 AND 50
  THEN RAISE EXCEPTION 'Geçersiz soru listesi.' USING ERRCODE='22023'; END IF;
  FOR q IN SELECT value FROM jsonb_array_elements(v) LOOP
   sid:=(q->>'id')::uuid;
   IF sid IS NULL OR jsonb_typeof(q->'question') IS DISTINCT FROM 'string' OR length(btrim(q->>'question')) NOT BETWEEN 1 AND 300
    OR jsonb_typeof(q->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(q->'options') NOT BETWEEN 2 AND 8
   THEN RAISE EXCEPTION 'Geçersiz soru.' USING ERRCODE='22023'; END IF;
   IF EXISTS(SELECT 1 FROM jsonb_array_elements(q->'options') x WHERE jsonb_typeof(x) IS DISTINCT FROM 'string' OR length(btrim(x#>>'{}')) NOT BETWEEN 1 AND 150)
    OR (SELECT count(DISTINCT btrim(x#>>'{}')) FROM jsonb_array_elements(q->'options') x)<>jsonb_array_length(q->'options')
    OR octet_length((q-'id')::text)>3500
   THEN RAISE EXCEPTION 'Geçersiz seçenek.' USING ERRCODE='22023'; END IF;
   SELECT * INTO s FROM viva_anket_sorulari WHERE soru_id=sid;
   IF FOUND THEN
    IF s.etkinlik_id<>p_etkinlik OR s.soru IS DISTINCT FROM btrim(q->>'question') OR s.secenekler IS DISTINCT FROM q->'options' OR s.silindi
    THEN RAISE EXCEPTION 'Soru kimliği değiştirilemez.' USING ERRCODE='22023'; END IF;
   ELSE
    IF (SELECT count(*) FROM viva_anket_sorulari WHERE etkinlik_id=p_etkinlik AND NOT silindi)>=50
    THEN RAISE EXCEPTION 'Soru sınırı.' USING ERRCODE='22023'; END IF;
    INSERT INTO viva_anket_sorulari(soru_id,etkinlik_id,soru,secenekler) VALUES(sid,p_etkinlik,btrim(q->>'question'),q->'options');
   END IF;
  END LOOP;
 ELSIF p_islem='soru_sil' THEN
  IF e.durum NOT IN ('taslak','planlandi','canli') THEN RAISE EXCEPTION 'Yayın kapalı.' USING ERRCODE='22023'; END IF;
  -- Listeden kaldırma, önceki oturumun soru ve cevap arşivini silmez.
  UPDATE viva_anket_sorulari SET silindi=true WHERE etkinlik_id=p_etkinlik AND soru_id=(p_veri->>'soru_id')::uuid;
 ELSIF p_islem='ac' THEN
  IF e.durum NOT IN ('planlandi','canli') OR e.baslangic>now() OR e.bitis<=now()
  THEN RAISE EXCEPTION 'Yayın açık değil.' USING ERRCODE='22023'; END IF;
  sid:=(p_veri->>'soru_id')::uuid; oid:=(p_veri->>'oturum_id')::uuid;
  SELECT * INTO s FROM viva_anket_sorulari WHERE soru_id=sid AND etkinlik_id=p_etkinlik AND NOT silindi;
  IF NOT FOUND OR oid IS NULL THEN RAISE EXCEPTION 'Soru bulunamadı.' USING ERRCODE='22023'; END IF;
  SELECT * INTO a FROM viva_anket_oturumlari WHERE oturum_id=oid;
  IF FOUND THEN
   IF a.etkinlik_id<>p_etkinlik OR a.soru_id<>sid THEN RAISE EXCEPTION 'Oturum eşleşmedi.' USING ERRCODE='22023'; END IF;
  ELSE
   IF EXISTS(SELECT 1 FROM viva_anket_oturumlari WHERE etkinlik_id=p_etkinlik AND kapandi IS NULL)
   THEN RAISE EXCEPTION 'Önce açık soruyu kapatın.' USING ERRCODE='40001'; END IF;
   INSERT INTO viva_anket_oturumlari(oturum_id,etkinlik_id,soru_id) VALUES(oid,p_etkinlik,sid);
  END IF;
 ELSIF p_islem='kapat' THEN
  UPDATE viva_anket_oturumlari SET kapandi=clock_timestamp() WHERE oturum_id=(p_veri->>'oturum_id')::uuid AND etkinlik_id=p_etkinlik AND kapandi IS NULL;
 ELSIF p_islem='cevap' THEN
  IF sahip OR e.durum NOT IN ('planlandi','canli') OR e.baslangic>now() OR e.bitis<=now()
  THEN RAISE EXCEPTION 'Cevap erişimi kapalı.' USING ERRCODE='42501'; END IF;
  SELECT * INTO a FROM viva_anket_oturumlari WHERE oturum_id=(p_veri->>'oturum_id')::uuid AND etkinlik_id=p_etkinlik AND kapandi IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Soru kapalı.' USING ERRCODE='22023'; END IF;
  SELECT * INTO s FROM viva_anket_sorulari WHERE soru_id=a.soru_id;
  sec:=(p_veri->>'secim')::integer;
  IF sec IS NULL OR sec<0 OR sec>=jsonb_array_length(s.secenekler) THEN RAISE EXCEPTION 'Geçersiz cevap.' USING ERRCODE='22023'; END IF;
  INSERT INTO viva_anket_cevaplari(oturum_id,auth_id,secim) VALUES(a.oturum_id,p_auth,sec) ON CONFLICT DO NOTHING;
 END IF;
 SELECT oturum_id INTO aktif FROM viva_anket_oturumlari WHERE etkinlik_id=p_etkinlik ORDER BY sira DESC LIMIT 1;
 v:=jsonb_build_object('aktif',viva_anket_ozet(aktif,p_auth,sahip));
 IF sahip AND p_islem<>'aktif' THEN
  v:=v || jsonb_build_object('sorular',coalesce((SELECT jsonb_agg(jsonb_build_object('id',soru_id,'question',soru,'options',secenekler) ORDER BY created_at,soru_id)
   FROM viva_anket_sorulari WHERE etkinlik_id=p_etkinlik AND NOT silindi),'[]'::jsonb),
   'oturumlar',coalesce((SELECT jsonb_agg(viva_anket_ozet(oturum_id,p_auth,true) ORDER BY sira DESC)
   FROM viva_anket_oturumlari WHERE etkinlik_id=p_etkinlik),'[]'::jsonb));
 END IF;
 RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.viva_anket_islem(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_anket_islem(uuid,uuid,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.viva_anket_yayin_kapandi() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.durum IN ('sona_erdi','iptal') THEN UPDATE viva_anket_oturumlari SET kapandi=greatest(acildi,clock_timestamp()) WHERE etkinlik_id=NEW.etkinlik_id AND kapandi IS NULL; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.viva_anket_yayin_kapandi() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS viva_anket_yayin_kapanis ON public.viva_etkinlikler;
CREATE TRIGGER viva_anket_yayin_kapanis AFTER UPDATE OF durum ON public.viva_etkinlikler FOR EACH ROW EXECUTE FUNCTION public.viva_anket_yayin_kapandi();
COMMIT;
SELECT to_regclass('public.viva_anket_sorulari') IS NOT NULL AS soru_tablosu,
 to_regclass('public.viva_anket_oturumlari') IS NOT NULL AS anket_tablosu,
 to_regclass('public.viva_anket_cevaplari') IS NOT NULL AS cevap_tablosu,
 to_regprocedure('public.viva_anket_islem(uuid,uuid,text,jsonb)') IS NOT NULL AS arsiv_fonksiyonu,
 NOT has_function_privilege('authenticated','public.viva_anket_islem(uuid,uuid,text,jsonb)','EXECUTE') AS istemci_rpc_kapali;
