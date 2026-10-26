-- Viva 2.4. KULLANICI ÇALIŞTIRACAK. Ajan DB'ye erişmez/SQL çalıştırmaz.
-- Önce 1, 2.1 ve 2.2 SQL kurulumları tamamlanmış olmalı.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-asama2-4'));
CREATE TABLE IF NOT EXISTS public.viva_daily_erisimler(
 etkinlik_id uuid NOT NULL REFERENCES public.viva_etkinlikler ON DELETE CASCADE,
 nesil integer NOT NULL, daily_user_id text NOT NULL CHECK(daily_user_id ~ '^vi_[a-f0-9]{32}$'),
 auth_id uuid, davet_hash text, oturum_hash text, bitis timestamptz NOT NULL,
 engellendi boolean NOT NULL DEFAULT false, uygulandi boolean NOT NULL DEFAULT false,
 PRIMARY KEY(etkinlik_id,nesil,daily_user_id),
 CHECK((auth_id IS NOT NULL AND davet_hash IS NULL AND oturum_hash IS NULL) OR
 (auth_id IS NULL AND davet_hash IS NOT NULL AND oturum_hash IS NOT NULL AND davet_hash ~ '^[a-f0-9]{64}$' AND oturum_hash ~ '^[a-f0-9]{64}$'))
);
CREATE TABLE IF NOT EXISTS public.viva_daily_yasam(
 etkinlik_id uuid PRIMARY KEY REFERENCES public.viva_etkinlikler ON DELETE CASCADE,
 oturum_id text, durum text NOT NULL DEFAULT 'bekliyor' CHECK(durum IN ('bekliyor','tamam','hata')),
 kira uuid, kira_bitis timestamptz, son_kontrol timestamptz NOT NULL DEFAULT '-infinity', hata_kodu text
);
ALTER TABLE public.viva_daily_erisimler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_daily_yasam ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.viva_daily_erisimler,public.viva_daily_yasam FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.viva_daily_erisimler,public.viva_daily_yasam TO service_role;

-- Tarihi değişmeyen durum/katılımcı güncellemeleri odayı gereksiz yere eski saydırmaz.
CREATE OR REPLACE FUNCTION public.viva_daily_surum_esle() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.baslangic=OLD.baslangic AND NEW.bitis=OLD.bitis THEN
  UPDATE viva_daily_odalar SET eslesen_surumu=NEW.surum,hedef_surumu=NEW.surum
  WHERE etkinlik_id=NEW.etkinlik_id AND durum='hazir' AND eslesen_surumu=OLD.surum;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS viva_daily_surum_esle ON public.viva_etkinlikler;
CREATE TRIGGER viva_daily_surum_esle AFTER UPDATE ON public.viva_etkinlikler
 FOR EACH ROW EXECUTE FUNCTION public.viva_daily_surum_esle();
CREATE OR REPLACE FUNCTION public.viva_daily_katilim_baglam(
 p_auth uuid,p_etkinlik uuid,p_davet_hash text,p_oturum_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e viva_etkinlikler%ROWTYPE; d viva_davetler%ROWTYPE; id uuid;
 v_ad text; v_kimlik text; v_rol text; v_oturum_bitis timestamptz;
BEGIN
 -- Üye kimliği veya etkinliğe özel doğrulanmış misafir oturumu. İkisi karıştırılmaz.
 IF p_auth IS NOT NULL AND p_etkinlik IS NOT NULL AND p_davet_hash IS NULL AND p_oturum_hash IS NULL THEN
  id:=p_etkinlik;
 ELSIF p_auth IS NULL AND p_etkinlik IS NULL
  AND coalesce(p_davet_hash,'') ~ '^[a-f0-9]{64}$' AND coalesce(p_oturum_hash,'') ~ '^[a-f0-9]{64}$' THEN
  SELECT etkinlik_id INTO id FROM viva_davetler WHERE token_hash=p_davet_hash;
 ELSE RAISE EXCEPTION 'Katılım kimliği geçersiz.' USING ERRCODE='42501'; END IF;
 -- Mevcut yönetim/misafir kilit sırası korunur: önce etkinlik, sonra davet.
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=id FOR SHARE;
 IF NOT FOUND OR NOT viva_sahip_aktif(id) OR e.durum NOT IN ('planlandi','canli') OR e.bitis<=now()
 THEN RAISE EXCEPTION 'Etkinliğe şu anda katılınamaz.' USING ERRCODE='42501'; END IF;
 IF p_auth IS NOT NULL THEN
  IF NOT viva_erisim(p_auth,id) THEN RAISE EXCEPTION 'Katılım yetkiniz yok.' USING ERRCODE='42501'; END IF;
  v_rol:=CASE WHEN e.sahip_id=p_auth THEN 'sunucu' ELSE 'katilimci' END;
  v_kimlik:='uye:'||p_auth::text;
  SELECT k.ad||' '||k.soyad INTO v_ad FROM kullanicilar k WHERE k.kullanici_id=p_auth AND k.aktif_mi
   AND (e.sahip_id=p_auth OR EXISTS(SELECT 1 FROM viva_katilimcilar x WHERE x.etkinlik_id=id AND x.tur='ic' AND x.kullanici_id=p_auth AND viva_ic_kapsam(e.sahip_id,p_auth)));
  IF v_ad IS NULL THEN
   SELECT k.ad||' '||k.soyad INTO v_ad FROM eclub_kisiler k JOIN viva_katilimcilar x ON x.kisi_id=k.kisi_id AND x.tur='eclub'
    WHERE x.etkinlik_id=id AND k.auth_user_id=p_auth AND viva_eclub_kapsam(e.sahip_id,k.kisi_id) ORDER BY k.kisi_id LIMIT 1;
  END IF;
 ELSE
  SELECT * INTO d FROM viva_davetler WHERE token_hash=p_davet_hash AND etkinlik_id=id FOR SHARE;
  IF NOT FOUND OR d.iptal OR d.oturum_hash IS DISTINCT FROM p_oturum_hash OR d.oturum_bitis IS NULL OR d.oturum_bitis<=now()
  THEN RAISE EXCEPTION 'Davet e-postası doğrulanmamış veya davet süresi dolmuş.' USING ERRCODE='42501'; END IF;
  v_rol:='izleyici';v_kimlik:='davet:'||d.davet_id::text;v_ad:=d.ad;v_oturum_bitis:=d.oturum_bitis;
 END IF;
 IF coalesce(length(btrim(v_ad)),0)=0 THEN RAISE EXCEPTION 'Katılım kimliği doğrulanamadı.' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('etkinlik_id',e.etkinlik_id,'surum',e.surum,'sahip_id',e.sahip_id,
  'kimlik',v_kimlik,'ad',v_ad,'rol',v_rol,'baslangic',e.baslangic,'bitis',e.bitis,
  'oturum_bitis',v_oturum_bitis,'oturum_izi',CASE WHEN p_auth IS NULL THEN d.oturum_hash ELSE NULL END,'oda',viva_daily_oda_ozet(id));
END $$;

CREATE OR REPLACE FUNCTION public.viva_daily_yasam_islem(p_auth uuid,p_etkinlik uuid,p_islem text,p_veri jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e viva_etkinlikler%ROWTYPE; o viva_daily_odalar%ROWTYPE; j viva_daily_yasam%ROWTYPE;
 b jsonb; kimlik text; k uuid; kapat boolean; red boolean; v_ids jsonb; v_surum integer;
BEGIN
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=p_etkinlik FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Etkinlik bulunamadı.' USING ERRCODE='42501'; END IF;
 SELECT * INTO o FROM viva_daily_odalar WHERE etkinlik_id=p_etkinlik;
 IF p_islem='erisim_kaydet' THEN
  b:=viva_daily_katilim_baglam(p_auth,CASE WHEN p_auth IS NOT NULL THEN p_etkinlik ELSE NULL END,p_veri->>'davet_hash',p_veri->>'oturum_hash');
  IF (b->>'etkinlik_id')::uuid<>p_etkinlik OR NOT coalesce((b#>>'{oda,guncel}')::boolean,false)
   OR (b->>'surum')::integer<>coalesce((p_veri->>'surum')::integer,0)
   OR o.nesil<>coalesce((p_veri->>'nesil')::integer,0)
   OR p_veri->>'daily_user_id' IS NULL OR p_veri->>'daily_user_id' !~ '^vi_[a-f0-9]{32}$'
  THEN RAISE EXCEPTION 'Katılım bilgisi değişti.' USING ERRCODE='40001'; END IF;
  INSERT INTO viva_daily_erisimler(etkinlik_id,nesil,daily_user_id,auth_id,davet_hash,oturum_hash,bitis)
  VALUES(p_etkinlik,o.nesil,p_veri->>'daily_user_id',p_auth,p_veri->>'davet_hash',p_veri->>'oturum_hash',
   least(e.bitis,coalesce((b->>'oturum_bitis')::timestamptz,e.bitis)))
  ON CONFLICT(etkinlik_id,nesil,daily_user_id) DO UPDATE SET bitis=EXCLUDED.bitis;
  IF EXISTS(SELECT 1 FROM viva_daily_erisimler WHERE etkinlik_id=p_etkinlik AND nesil=o.nesil
   AND daily_user_id=p_veri->>'daily_user_id' AND engellendi)
  THEN RAISE EXCEPTION 'Bu görüşmeye erişiminiz kaldırılmış.' USING ERRCODE='42501'; END IF;
  RETURN '{}'::jsonb;
 END IF;
 IF p_auth IS NOT NULL AND (e.sahip_id<>p_auth OR NOT viva_sahip_aktif(p_etkinlik))
 THEN RAISE EXCEPTION 'Yayın yönetimi yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF p_islem IN ('oku','basladi','bitir','katilimci_cikar') AND p_auth IS NULL
 THEN RAISE EXCEPTION 'Yayın sahibinin oturumu gerekli.' USING ERRCODE='42501'; END IF;
 INSERT INTO viva_daily_yasam(etkinlik_id) VALUES(p_etkinlik) ON CONFLICT DO NOTHING;
 SELECT * INTO j FROM viva_daily_yasam WHERE etkinlik_id=p_etkinlik FOR UPDATE;
 IF p_islem='basladi' THEN
  IF e.durum='canli' AND j.oturum_id=p_veri->>'oturum_id' THEN NULL;
  ELSE
   IF e.durum NOT IN ('planlandi','canli') OR e.baslangic>now() OR e.bitis<=now()
    OR e.surum<>coalesce((p_veri->>'surum')::integer,0) OR o.oda_id IS NULL OR o.durum<>'hazir'
    OR NOT coalesce((viva_daily_oda_ozet(p_etkinlik)->>'guncel')::boolean,false)
    OR o.oda_adi IS DISTINCT FROM p_veri->>'oda_adi' OR o.nesil<>coalesce((p_veri->>'nesil')::integer,0)
    OR coalesce(p_veri->>'oturum_id','') !~ '^[a-fA-F0-9-]{36}$'
   THEN RAISE EXCEPTION 'Yayın başlangıcı değişti.' USING ERRCODE='40001'; END IF;
   IF e.durum='planlandi' THEN UPDATE viva_etkinlikler SET durum='canli',surum=surum+1,updated_at=now() WHERE etkinlik_id=p_etkinlik; END IF;
   UPDATE viva_daily_yasam SET oturum_id=p_veri->>'oturum_id' WHERE etkinlik_id=p_etkinlik;
  END IF;
 ELSIF p_islem='bitir' THEN
  IF e.durum NOT IN ('sona_erdi','iptal') THEN
   IF e.durum NOT IN ('planlandi','canli') OR e.surum<>coalesce((p_veri->>'surum')::integer,0)
   THEN RAISE EXCEPTION 'Etkinlik değişti.' USING ERRCODE='40001'; END IF;
   UPDATE viva_etkinlikler SET durum='sona_erdi',surum=surum+1,updated_at=now() WHERE etkinlik_id=p_etkinlik;
   UPDATE viva_daily_odalar SET durum='kapali',kira_anahtari=NULL,kira_bitis=NULL WHERE etkinlik_id=p_etkinlik;
   UPDATE viva_daily_yasam SET durum='bekliyor' WHERE etkinlik_id=p_etkinlik;
  END IF;
 ELSIF p_islem='katilimci_cikar' THEN
  IF e.durum NOT IN ('planlandi','canli') OR e.surum<>coalesce((p_veri->>'surum')::integer,0)
  THEN RAISE EXCEPTION 'Etkinlik değişti.' USING ERRCODE='40001'; END IF;
  DELETE FROM viva_katilimcilar WHERE etkinlik_id=p_etkinlik AND tur=p_veri->>'tur'
   AND coalesce(kullanici_id,kisi_id)=(p_veri->>'kisi_id')::uuid;
  IF FOUND THEN UPDATE viva_etkinlikler SET surum=surum+1,updated_at=now() WHERE etkinlik_id=p_etkinlik; END IF;
 ELSIF p_islem='saglayici_bitti' THEN
  IF p_auth IS NOT NULL THEN RAISE EXCEPTION 'Sağlayıcı işlemi.' USING ERRCODE='42501'; END IF;
  IF j.oturum_id IS NULL OR j.oturum_id IS DISTINCT FROM p_veri->>'oturum_id'
   OR o.nesil IS DISTINCT FROM (p_veri->>'nesil')::integer THEN RETURN jsonb_build_object('eski',true); END IF;
  -- Sağlayıcı oturumunun bitmesi, sahibin herkes için bitirme talimatı değildir.
  -- Son kişinin bağlantı kaybında etkinlik kapanmaz; yeni oturumla geri dönülebilir.
  UPDATE viva_daily_yasam SET son_kontrol=now() WHERE etkinlik_id=p_etkinlik;
 ELSIF p_islem='ayir' THEN
  IF p_auth IS NOT NULL THEN RAISE EXCEPTION 'İşleyici işlemi.' USING ERRCODE='42501'; END IF;
  IF j.kira_bitis>now() THEN RETURN jsonb_build_object('bekle',true); END IF;
  IF e.durum IN ('planlandi','canli') AND (e.bitis<=now() OR NOT viva_sahip_aktif(p_etkinlik)) THEN
   UPDATE viva_etkinlikler SET durum=CASE WHEN e.bitis<=now() THEN 'sona_erdi' ELSE 'iptal' END,surum=surum+1,updated_at=now() WHERE etkinlik_id=p_etkinlik RETURNING * INTO e;
  END IF;
  kapat:=e.durum IN ('sona_erdi','iptal');
  IF kapat THEN UPDATE viva_daily_odalar SET durum='kapali',kira_anahtari=NULL,kira_bitis=NULL WHERE etkinlik_id=p_etkinlik; END IF;
  UPDATE viva_daily_erisimler a SET engellendi=true WHERE a.etkinlik_id=p_etkinlik AND a.nesil=o.nesil AND NOT a.engellendi AND (
   kapat OR a.bitis<=now() OR (a.auth_id IS NOT NULL AND NOT viva_erisim(a.auth_id,p_etkinlik)) OR
   (a.auth_id IS NULL AND NOT EXISTS(SELECT 1 FROM viva_davetler d WHERE d.etkinlik_id=p_etkinlik
    AND d.token_hash=a.davet_hash AND NOT d.iptal AND d.oturum_hash=a.oturum_hash AND d.oturum_bitis>now())));
  k:=gen_random_uuid();
  UPDATE viva_daily_yasam SET kira=k,kira_bitis=now()+interval '90 seconds',son_kontrol=now() WHERE etkinlik_id=p_etkinlik;
  SELECT coalesce(jsonb_agg(daily_user_id),'[]') INTO v_ids FROM
   (SELECT daily_user_id FROM viva_daily_erisimler WHERE etkinlik_id=p_etkinlik AND nesil=o.nesil AND engellendi AND NOT uygulandi ORDER BY daily_user_id LIMIT 100) a;
  RETURN jsonb_build_object('bekle',false,'kira',k,'oda_adi',o.oda_adi,'domain',o.domain,'nesil',o.nesil,'kapat',kapat,'user_ids',v_ids);
 ELSIF p_islem IN ('tamamla','hata') THEN
  IF p_auth IS NOT NULL OR j.kira IS NULL OR j.kira IS DISTINCT FROM (p_veri->>'kira')::uuid OR j.kira_bitis<=now()
  THEN RAISE EXCEPTION 'Yayın işi değişti.' USING ERRCODE='40001'; END IF;
  IF p_islem='tamamla' THEN
   UPDATE viva_daily_erisimler SET uygulandi=true WHERE etkinlik_id=p_etkinlik AND nesil=o.nesil AND engellendi
    AND daily_user_id IN(SELECT jsonb_array_elements_text(coalesce(p_veri->'user_ids','[]')));
  END IF;
  UPDATE viva_daily_yasam SET kira=NULL,kira_bitis=NULL,durum=CASE WHEN p_islem='hata' THEN 'hata'
    WHEN (e.durum IN ('sona_erdi','iptal') AND NOT coalesce((p_veri->>'kapat')::boolean,false)) THEN 'bekliyor'
    WHEN EXISTS(SELECT 1 FROM viva_daily_erisimler a WHERE a.etkinlik_id=p_etkinlik AND a.nesil=o.nesil AND a.engellendi AND NOT a.uygulandi) THEN 'bekliyor' ELSE 'tamam' END,
   hata_kodu=CASE WHEN p_islem='hata' THEN 'DAILY_ISLEMI_TAMAMLANAMADI' ELSE NULL END WHERE etkinlik_id=p_etkinlik;
 ELSIF p_islem<>'oku' THEN RAISE EXCEPTION 'Geçersiz işlem.' USING ERRCODE='22023'; END IF;
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=p_etkinlik;
 SELECT * INTO j FROM viva_daily_yasam WHERE etkinlik_id=p_etkinlik;
 RETURN jsonb_build_object('etkinlik_id',e.etkinlik_id,'sahip_id',e.sahip_id,'surum',e.surum,'durum',e.durum,
  'oda_adi',o.oda_adi,'domain',o.domain,'nesil',o.nesil,'oturum_id',j.oturum_id,'islem_durumu',j.durum);
END $$;
CREATE OR REPLACE FUNCTION public.viva_daily_yasam_siradaki() RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT e.etkinlik_id FROM viva_etkinlikler e LEFT JOIN viva_daily_odalar o USING(etkinlik_id)
 LEFT JOIN viva_daily_yasam j USING(etkinlik_id)
 WHERE ((o.oda_id IS NOT NULL AND (e.durum IN ('planlandi','canli') OR coalesce(j.durum,'bekliyor')<>'tamam'))
 OR (e.durum IN ('planlandi','canli') AND e.bitis<=now()))
 AND (j.kira_bitis IS NULL OR j.kira_bitis<=now())
 ORDER BY coalesce(j.son_kontrol,'-infinity'::timestamptz) LIMIT 20
$$;
REVOKE ALL ON FUNCTION public.viva_daily_surum_esle(),public.viva_daily_yasam_islem(uuid,uuid,text,jsonb),public.viva_daily_yasam_siradaki() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_daily_yasam_islem(uuid,uuid,text,jsonb),public.viva_daily_yasam_siradaki() TO service_role;
COMMIT;
SELECT to_regclass('public.viva_daily_erisimler') IS NOT NULL AS erisim_tablosu,
 to_regclass('public.viva_daily_yasam') IS NOT NULL AS yasam_tablosu,
 to_regprocedure('public.viva_daily_yasam_islem(uuid,uuid,text,jsonb)') IS NOT NULL AS yasam_fonksiyonu,
 NOT has_function_privilege('authenticated','public.viva_daily_yasam_islem(uuid,uuid,text,jsonb)','EXECUTE') AS istemci_rpc_kapali;
