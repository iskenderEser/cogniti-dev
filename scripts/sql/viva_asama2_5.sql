-- Viva 2.5. KULLANICI ÇALIŞTIRACAK. Daily/HTTP çağrısı yapmaz.
-- Önkoşul: 2.4 kurulmuş olmalı. Tablolar/RPC yalnız service_role içindir.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-asama2-5'));
CREATE TABLE IF NOT EXISTS public.viva_daily_olaylar(
 anahtar text PRIMARY KEY CHECK(anahtar ~ '^[a-f0-9]{64}$'), domain text NOT NULL,
 tur text NOT NULL, veri jsonb NOT NULL, alindi timestamptz NOT NULL DEFAULT now(),
 durum text NOT NULL DEFAULT 'bekliyor' CHECK(durum IN ('bekliyor','tamam','hata')),
 kira uuid,kira_bitis timestamptz,tekrar timestamptz NOT NULL DEFAULT now(), deneme integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.viva_daily_kayitlar(
 anahtar text PRIMARY KEY, etkinlik_id uuid NOT NULL REFERENCES public.viva_etkinlikler ON DELETE CASCADE,
 nesil integer NOT NULL, oda_adi text NOT NULL, daily_id uuid UNIQUE, instance_id uuid,
 oturum_id uuid, baslangic timestamptz, sure numeric CHECK(sure>=0),
 durum text NOT NULL CHECK(durum IN ('kaydediliyor','hazirlaniyor','hazir','hata')),
 hata_kodu text, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS viva_daily_kayit_etkinlik ON public.viva_daily_kayitlar(etkinlik_id,baslangic);
CREATE UNIQUE INDEX IF NOT EXISTS viva_daily_kayit_instance ON public.viva_daily_kayitlar(instance_id) WHERE instance_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.viva_daily_kayit_tarama(
 etkinlik_id uuid PRIMARY KEY REFERENCES public.viva_etkinlikler ON DELETE CASCADE,
 imlec uuid, son_kontrol timestamptz NOT NULL DEFAULT '-infinity', kira uuid,kira_bitis timestamptz
);
ALTER TABLE public.viva_daily_olaylar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_daily_kayitlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_daily_kayit_tarama ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.viva_daily_olaylar,public.viva_daily_kayitlar,public.viva_daily_kayit_tarama FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.viva_daily_olaylar,public.viva_daily_kayitlar,public.viva_daily_kayit_tarama TO service_role;

CREATE OR REPLACE FUNCTION public.viva_daily_kayit_islem(p_auth uuid,p_etkinlik uuid,p_islem text,p_veri jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e viva_etkinlikler%ROWTYPE; o viva_daily_odalar%ROWTYPE; j viva_daily_olaylar%ROWTYPE;
 t viva_daily_kayit_tarama%ROWTYPE; k uuid; rid uuid; iid uuid; kayit viva_daily_kayitlar%ROWTYPE; v jsonb; st text;
BEGIN
 IF p_islem IN ('liste','link','durdu','yenile') THEN
  SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=p_etkinlik;
  -- İlk sürümde kayıt yönetimi/indirmesi yalnız etkinlik sahibinde. Misafir üyeliğe dönüşmez.
  IF p_auth IS NULL OR e.sahip_id IS DISTINCT FROM p_auth OR NOT viva_sahip_aktif(p_etkinlik)
  THEN RAISE EXCEPTION 'Kayıt erişimi yok.' USING ERRCODE='42501'; END IF;
  IF p_islem='link' THEN
   SELECT * INTO kayit FROM viva_daily_kayitlar WHERE etkinlik_id=p_etkinlik AND daily_id=(p_veri->>'id')::uuid AND durum='hazir';
   IF NOT FOUND THEN RAISE EXCEPTION 'Kayıt hazır değil.' USING ERRCODE='22023'; END IF;
   RETURN jsonb_build_object('id',kayit.daily_id,'oda_adi',kayit.oda_adi,'nesil',kayit.nesil,'oturum_id',kayit.oturum_id);
  ELSIF p_islem='durdu' THEN
   UPDATE viva_daily_kayitlar SET durum='hazirlaniyor',updated_at=now()
   WHERE etkinlik_id=p_etkinlik AND instance_id=(p_veri->>'instance_id')::uuid AND durum='kaydediliyor';
  ELSIF p_islem='yenile' THEN
   INSERT INTO viva_daily_kayit_tarama(etkinlik_id) SELECT p_etkinlik WHERE EXISTS(SELECT 1 FROM viva_daily_odalar WHERE etkinlik_id=p_etkinlik)
   ON CONFLICT(etkinlik_id) DO UPDATE SET son_kontrol=CASE WHEN viva_daily_kayit_tarama.son_kontrol<now()-interval '1 minute' THEN '-infinity'::timestamptz ELSE viva_daily_kayit_tarama.son_kontrol END;
  END IF;
  RETURN jsonb_build_object('kayitlar',coalesce((SELECT jsonb_agg(jsonb_build_object('anahtar',r.anahtar,'id',r.daily_id,'baslangic',r.baslangic,'sure',r.sure,'durum',r.durum,'hata_kodu',r.hata_kodu) ORDER BY r.baslangic NULLS LAST,r.anahtar)
   FROM viva_daily_kayitlar r WHERE r.etkinlik_id=p_etkinlik),'[]'::jsonb));
 END IF;
 IF p_auth IS NOT NULL THEN RAISE EXCEPTION 'Sunucu işlemi.' USING ERRCODE='42501'; END IF;
 IF p_islem='olay_al' THEN
  IF coalesce(p_veri->>'anahtar','') !~ '^[a-f0-9]{64}$' OR p_veri->>'domain'<>'cogniti-viva.daily.co'
   OR coalesce(p_veri->>'tur','') NOT IN ('meeting.started','meeting.ended','participant.joined','participant.left','recording.started','recording.ready-to-download','recording.error')
   OR jsonb_typeof(p_veri->'veri') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Geçersiz olay.' USING ERRCODE='22023'; END IF;
  -- Savunma katmanı: HTTP normalleştiricisi atlansa bile kişisel alan/link saklanmaz.
  SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO v FROM jsonb_each(p_veri->'veri')
   WHERE key IN ('room','room_name','meeting_id','session_id','user_id','recording_id','instance_id','start_ts','joined_at','left_at','timestamp');
  INSERT INTO viva_daily_olaylar(anahtar,domain,tur,veri) VALUES(p_veri->>'anahtar',p_veri->>'domain',p_veri->>'tur',v) ON CONFLICT DO NOTHING;
  RETURN '{}'::jsonb;
 ELSIF p_islem='olay_ayir' THEN
  SELECT * INTO j FROM viva_daily_olaylar WHERE durum<>'tamam' AND tekrar<=now() AND (kira_bitis IS NULL OR kira_bitis<=now())
   AND (p_veri->>'anahtar' IS NULL OR anahtar=p_veri->>'anahtar') ORDER BY alindi LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN RETURN NULL; END IF;
  k:=gen_random_uuid(); UPDATE viva_daily_olaylar SET kira=k,kira_bitis=now()+interval '90 seconds',deneme=deneme+1 WHERE anahtar=j.anahtar;
  RETURN jsonb_build_object('anahtar',j.anahtar,'domain',j.domain,'tur',j.tur,'veri',j.veri,'kira',k);
 ELSIF p_islem IN ('olay_tamam','olay_hata') THEN
  UPDATE viva_daily_olaylar SET durum=CASE WHEN p_islem='olay_tamam' THEN 'tamam' ELSE 'hata' END,
   tekrar=now()+interval '1 minute',kira=NULL,kira_bitis=NULL
  WHERE anahtar=p_veri->>'anahtar' AND kira=(p_veri->>'kira')::uuid AND kira_bitis>now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Eski olay işi.' USING ERRCODE='40001'; END IF;
  RETURN '{}'::jsonb;
 ELSIF p_islem='tarama_ayir' THEN
  INSERT INTO viva_daily_kayit_tarama(etkinlik_id)
   SELECT d.etkinlik_id FROM viva_daily_odalar d JOIN viva_etkinlikler ev USING(etkinlik_id)
   WHERE d.oda_id IS NOT NULL AND ev.baslangic<=now() AND ev.bitis>now()-interval '48 hours' ON CONFLICT DO NOTHING;
  SELECT s.* INTO t FROM viva_daily_kayit_tarama s JOIN viva_etkinlikler ev USING(etkinlik_id)
   WHERE s.son_kontrol<now()-interval '5 minutes' AND (s.kira_bitis IS NULL OR s.kira_bitis<=now())
   AND (ev.bitis>now()-interval '48 hours' OR s.son_kontrol='-infinity'::timestamptz)
   ORDER BY s.son_kontrol LIMIT 1 FOR UPDATE OF s SKIP LOCKED;
  IF NOT FOUND THEN RETURN NULL; END IF;
  k:=gen_random_uuid(); UPDATE viva_daily_kayit_tarama SET kira=k,kira_bitis=now()+interval '90 seconds' WHERE etkinlik_id=t.etkinlik_id;
  SELECT * INTO o FROM viva_daily_odalar WHERE etkinlik_id=t.etkinlik_id;
  RETURN jsonb_build_object('etkinlik_id',t.etkinlik_id,'oda_adi',o.oda_adi,'domain',o.domain,'imlec',t.imlec,'kira',k);
 ELSIF p_islem='tarama_tamam' THEN
  UPDATE viva_daily_kayit_tarama SET imlec=(p_veri->>'imlec')::uuid,
   son_kontrol=CASE WHEN p_veri->>'imlec' IS NULL THEN now() ELSE '-infinity'::timestamptz END,kira=NULL,kira_bitis=NULL
   WHERE etkinlik_id=(p_veri->>'etkinlik_id')::uuid AND kira=(p_veri->>'kira')::uuid AND kira_bitis>now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Eski tarama işi.' USING ERRCODE='40001'; END IF;
  RETURN '{}'::jsonb;
 END IF;
 -- İsim nesli içerir; domain ve kayıtlı eşleşme birlikte doğrulanır. Kapanmış odanın kaydı alınabilir.
 SELECT * INTO o FROM viva_daily_odalar WHERE oda_adi=p_veri->>'oda_adi' AND domain=p_veri->>'domain';
 IF NOT FOUND OR o.domain<>'cogniti-viva.daily.co' OR o.oda_adi<>'viva-'||replace(o.etkinlik_id::text,'-','')||'-n'||o.nesil::text THEN RETURN NULL; END IF;
 IF p_islem='oda' THEN
  SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=o.etkinlik_id;
  RETURN jsonb_build_object('etkinlik_id',o.etkinlik_id,'nesil',o.nesil,'sahip_id',e.sahip_id,'durum',e.durum);
 ELSIF p_islem IN ('esle','kayit_hata') THEN
  -- Aynı etkinliğin kayıt eşleştirmesi serileştirilir; dosya/instance birleştirmesi kaybolmaz.
  PERFORM pg_advisory_xact_lock(hashtext('viva-kayit:'||o.etkinlik_id::text));
  iid:=(p_veri->>'instance_id')::uuid;
  IF p_islem='kayit_hata' THEN
   IF iid IS NULL THEN RAISE EXCEPTION 'Kayıt instance gerekli.' USING ERRCODE='22023'; END IF;
   UPDATE viva_daily_kayitlar SET durum=CASE WHEN durum='hazir' THEN durum ELSE 'hata' END,
    hata_kodu=CASE WHEN durum='hazir' THEN NULL ELSE 'DAILY_KAYIT_HATA' END,updated_at=now() WHERE instance_id=iid AND etkinlik_id=o.etkinlik_id;
   IF NOT FOUND THEN INSERT INTO viva_daily_kayitlar(anahtar,etkinlik_id,nesil,oda_adi,instance_id,durum,hata_kodu)
    VALUES('instance:'||iid::text,o.etkinlik_id,o.nesil,o.oda_adi,iid,'hata','DAILY_KAYIT_HATA'); END IF;
  ELSE
   rid:=(p_veri->>'id')::uuid;st:=p_veri->>'durum';
   IF rid IS NULL OR p_veri->>'oturum_id' IS NULL OR p_veri->>'baslangic' IS NULL OR st NOT IN ('kaydediliyor','hazir') THEN RAISE EXCEPTION 'Kayıt bilgisi geçersiz.' USING ERRCODE='22023'; END IF;
   SELECT * INTO kayit FROM viva_daily_kayitlar WHERE daily_id=rid;
   IF FOUND AND (kayit.etkinlik_id<>o.etkinlik_id OR kayit.nesil<>o.nesil OR kayit.oturum_id IS DISTINCT FROM (p_veri->>'oturum_id')::uuid)
   THEN RAISE EXCEPTION 'Kayıt eşleşmesi değiştirilemez.' USING ERRCODE='22023'; END IF;
   IF iid IS NOT NULL THEN
    DELETE FROM viva_daily_kayitlar WHERE anahtar='instance:'||iid::text AND etkinlik_id=o.etkinlik_id;
   END IF;
   INSERT INTO viva_daily_kayitlar(anahtar,etkinlik_id,nesil,oda_adi,daily_id,instance_id,oturum_id,baslangic,sure,durum)
   VALUES(rid::text,o.etkinlik_id,o.nesil,o.oda_adi,rid,iid,(p_veri->>'oturum_id')::uuid,to_timestamp((p_veri->>'baslangic')::numeric),(p_veri->>'sure')::numeric,st)
   ON CONFLICT(anahtar) DO UPDATE SET
    durum=CASE WHEN viva_daily_kayitlar.durum='hazir' THEN 'hazir' WHEN EXCLUDED.durum='hazir' THEN 'hazir' WHEN viva_daily_kayitlar.durum IN ('hazirlaniyor','hata') THEN viva_daily_kayitlar.durum ELSE EXCLUDED.durum END,
    instance_id=coalesce(viva_daily_kayitlar.instance_id,EXCLUDED.instance_id),sure=coalesce(EXCLUDED.sure,viva_daily_kayitlar.sure),
    hata_kodu=CASE WHEN EXCLUDED.durum='hazir' THEN NULL ELSE viva_daily_kayitlar.hata_kodu END,updated_at=now();
  END IF;
  RETURN '{}'::jsonb;
 END IF;
 RAISE EXCEPTION 'Geçersiz kayıt işlemi.' USING ERRCODE='22023';
END $$;
REVOKE ALL ON FUNCTION public.viva_daily_kayit_islem(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_daily_kayit_islem(uuid,uuid,text,jsonb) TO service_role;
COMMIT;
SELECT to_regclass('public.viva_daily_olaylar') IS NOT NULL AS olay_tablosu,
 to_regclass('public.viva_daily_kayitlar') IS NOT NULL AS kayit_tablosu,
 to_regprocedure('public.viva_daily_kayit_islem(uuid,uuid,text,jsonb)') IS NOT NULL AS kayit_fonksiyonu,
 NOT has_function_privilege('authenticated','public.viva_daily_kayit_islem(uuid,uuid,text,jsonb)','EXECUTE') AS istemci_rpc_kapali;
