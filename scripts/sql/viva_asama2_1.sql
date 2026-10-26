-- Viva 2.1: Daily oda eşleştirmesi. KULLANICI ÇALIŞTIRACAK; ajan SQL çalıştırmaz.
-- Önkoşul: viva_asama1.sql kullanıcı tarafından kurulmuş olmalı.
-- Yalnız yeni Viva oda tablosu/fonksiyonlarını kurar; Daily'ye HTTP isteği yapmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-asama2-1'));
CREATE TABLE IF NOT EXISTS public.viva_daily_odalar (
 etkinlik_id uuid PRIMARY KEY REFERENCES public.viva_etkinlikler(etkinlik_id) ON DELETE CASCADE,
 domain text NOT NULL CHECK(domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.daily\.co$'),
 nesil integer NOT NULL DEFAULT 1 CHECK(nesil>0),
 oda_adi text NOT NULL UNIQUE CHECK(oda_adi ~ '^viva-[a-f0-9]{32}-n[1-9][0-9]*$'),
 oda_id text CHECK(length(oda_id) BETWEEN 1 AND 128),
 durum text NOT NULL DEFAULT 'hazirlaniyor' CHECK(durum IN ('hazirlaniyor','hazir','hata','kapali')),
 hedef_surumu integer NOT NULL CHECK(hedef_surumu>0),
 hedef_baslangic timestamptz NOT NULL, hedef_bitis timestamptz NOT NULL CHECK(hedef_bitis>hedef_baslangic),
 eslesen_surumu integer CHECK(eslesen_surumu>0),
 kira_anahtari uuid, kira_bitis timestamptz,
 hata_kodu text CHECK(hata_kodu ~ '^[A-Z_]{1,40}$'),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((kira_anahtari IS NULL)=(kira_bitis IS NULL))
);
ALTER TABLE public.viva_daily_odalar ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.viva_daily_odalar FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.viva_daily_odalar TO service_role;

CREATE OR REPLACE FUNCTION public.viva_daily_oda_ozet(p_etkinlik uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('etkinlik_id',o.etkinlik_id,'domain',o.domain,'oda_adi',o.oda_adi,
 'oda_id',o.oda_id,'nesil',o.nesil,'durum',o.durum,'hata_kodu',o.hata_kodu,
 'islem_suruyor',coalesce(o.kira_bitis>now(),false),
 'kapanmis',e.durum IN ('iptal','sona_erdi') OR e.bitis<=now(),
 'guncel',coalesce(o.durum='hazir' AND o.oda_id IS NOT NULL AND o.eslesen_surumu=e.surum
 AND o.hedef_baslangic=e.baslangic AND o.hedef_bitis=e.bitis
 AND e.durum IN ('planlandi','canli') AND e.bitis>now(),false))
 FROM viva_daily_odalar o JOIN viva_etkinlikler e USING(etkinlik_id) WHERE o.etkinlik_id=p_etkinlik
$$;

CREATE OR REPLACE FUNCTION public.viva_daily_oda_islem(p_auth uuid,p_etkinlik uuid,p_islem text,p_veri jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e viva_etkinlikler%ROWTYPE; o viva_daily_odalar%ROWTYPE; v_domain text; v_kira uuid;
BEGIN
 -- Kilit yalnız kısa DB işlemi boyunca tutulur; Daily HTTP isteği transaction dışında yapılır.
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=p_etkinlik FOR UPDATE;
 IF NOT FOUND OR e.sahip_id IS DISTINCT FROM p_auth OR NOT viva_sahip_aktif(p_etkinlik)
 THEN RAISE EXCEPTION 'Oda yönetimi yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF p_islem='durum' THEN RETURN jsonb_build_object('oda',viva_daily_oda_ozet(p_etkinlik)); END IF;
 IF p_islem='ayir' THEN
  IF e.durum NOT IN ('planlandi','canli') OR e.bitis<=now()
  THEN RAISE EXCEPTION 'Bu etkinlik için oda hazırlanamaz.' USING ERRCODE='22023'; END IF;
  v_domain:=p_veri->>'domain';
  IF v_domain IS NULL OR v_domain !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.daily\.co$'
  THEN RAISE EXCEPTION 'Geçersiz Daily alanı.' USING ERRCODE='22023'; END IF;
  INSERT INTO viva_daily_odalar(etkinlik_id,domain,oda_adi,hedef_surumu,hedef_baslangic,hedef_bitis)
  VALUES(p_etkinlik,v_domain,'viva-'||replace(p_etkinlik::text,'-','')||'-n1',e.surum,e.baslangic,e.bitis)
  ON CONFLICT(etkinlik_id) DO NOTHING;
  SELECT * INTO o FROM viva_daily_odalar WHERE etkinlik_id=p_etkinlik FOR UPDATE;
  IF o.domain<>v_domain OR o.durum='kapali'
  THEN RAISE EXCEPTION 'Eski oda alanı veya kapalı oda yeniden kullanılamaz.' USING ERRCODE='22023'; END IF;
  IF o.kira_bitis>now() THEN
   RETURN jsonb_build_object('oda',viva_daily_oda_ozet(p_etkinlik),'bekle',true);
  END IF;
  v_kira:=gen_random_uuid();
  UPDATE viva_daily_odalar SET durum='hazirlaniyor',hedef_surumu=e.surum,
   hedef_baslangic=e.baslangic,hedef_bitis=e.bitis,kira_anahtari=v_kira,
   kira_bitis=now()+interval '60 seconds',hata_kodu=NULL,updated_at=now() WHERE etkinlik_id=p_etkinlik;
  RETURN jsonb_build_object('oda',viva_daily_oda_ozet(p_etkinlik),'bekle',false,
   'istek',jsonb_build_object('domain',o.domain,'oda_adi',o.oda_adi,'nesil',o.nesil,
   'baslangic',e.baslangic,'bitis',e.bitis,'etkinlik_surumu',e.surum,'kira_anahtari',v_kira));
 END IF;
 SELECT * INTO o FROM viva_daily_odalar WHERE etkinlik_id=p_etkinlik FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Oda eşleştirmesi yok.' USING ERRCODE='22023'; END IF;
 v_kira:=(p_veri->>'kira_anahtari')::uuid;
 IF v_kira IS NULL OR o.kira_anahtari IS DISTINCT FROM v_kira
 THEN RAISE EXCEPTION 'Oda işlemi değişti; güncel işlemi kullanın.' USING ERRCODE='40001'; END IF;
 IF p_islem='tamamla' THEN
  IF o.kira_bitis<=now() OR e.surum<>o.hedef_surumu OR e.baslangic<>o.hedef_baslangic OR e.bitis<>o.hedef_bitis
   OR e.durum NOT IN ('planlandi','canli') OR e.bitis<=now() THEN
   UPDATE viva_daily_odalar SET durum='hata',hata_kodu='ETKINLIK_DEGISTI',
    kira_anahtari=NULL,kira_bitis=NULL,updated_at=now() WHERE etkinlik_id=p_etkinlik;
   RETURN jsonb_build_object('hata','Etkinlik veya oda işlemi değişti. Güncel halinden yeniden deneyin.','status',409);
  END IF;
  IF coalesce(length(p_veri->>'oda_id'),0) NOT BETWEEN 1 AND 128
  THEN RAISE EXCEPTION 'Geçersiz Daily oda kimliği.' USING ERRCODE='22023'; END IF;
  UPDATE viva_daily_odalar SET oda_id=p_veri->>'oda_id',durum='hazir',eslesen_surumu=e.surum,
   kira_anahtari=NULL,kira_bitis=NULL,hata_kodu=NULL,updated_at=now() WHERE etkinlik_id=p_etkinlik;
 ELSIF p_islem='hata' THEN
  UPDATE viva_daily_odalar SET durum='hata',hata_kodu=CASE WHEN coalesce(p_veri->>'hata_kodu','') ~ '^[A-Z_]{1,40}$'
   THEN p_veri->>'hata_kodu' ELSE 'DAILY_HATA' END,kira_anahtari=NULL,kira_bitis=NULL,updated_at=now()
   WHERE etkinlik_id=p_etkinlik;
 ELSE RAISE EXCEPTION 'Geçersiz oda işlemi.' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('oda',viva_daily_oda_ozet(p_etkinlik));
END $$;
REVOKE ALL ON FUNCTION public.viva_daily_oda_ozet(uuid),public.viva_daily_oda_islem(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_daily_oda_islem(uuid,uuid,text,jsonb) TO service_role;
COMMIT;
-- Kurulum kanıtı: kullanıcı sonucu paylaşacak. Hiçbir anahtar/kişisel bilgi gösterilmez.
SELECT to_regclass('public.viva_daily_odalar') IS NOT NULL AS oda_tablosu,
 to_regprocedure('public.viva_daily_oda_islem(uuid,uuid,text,jsonb)') IS NOT NULL AS oda_fonksiyonu,
 (SELECT relrowsecurity FROM pg_class WHERE oid='public.viva_daily_odalar'::regclass) AS rls_etkin,
 NOT has_table_privilege('anon','public.viva_daily_odalar','SELECT') AS anonim_erisim_kapali,
 NOT has_function_privilege('authenticated','public.viva_daily_oda_islem(uuid,uuid,text,jsonb)','EXECUTE') AS istemci_rpc_kapali;
