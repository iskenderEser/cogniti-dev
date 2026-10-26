-- Viva 2.2. KULLANICI ÇALIŞTIRACAK; ajan DB'ye erişmez veya SQL çalıştırmaz.
-- Önkoşul: viva_asama1.sql ve viva_asama2_1.sql kurulu.
-- Yeni katılım yetki RPC'si; HTTP isteği, token saklama veya mevcut kayıt güncellemesi yapmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-asama2-2'));
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
  'oturum_bitis',v_oturum_bitis,'oda',viva_daily_oda_ozet(id));
END $$;
REVOKE ALL ON FUNCTION public.viva_daily_katilim_baglam(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_daily_katilim_baglam(uuid,uuid,text,text) TO service_role;
COMMIT;
SELECT to_regprocedure('public.viva_daily_katilim_baglam(uuid,uuid,text,text)') IS NOT NULL AS katilim_fonksiyonu,
 NOT has_function_privilege('anon','public.viva_daily_katilim_baglam(uuid,uuid,text,text)','EXECUTE') AS anonim_erisim_kapali,
 NOT has_function_privilege('authenticated','public.viva_daily_katilim_baglam(uuid,uuid,text,text)','EXECUTE') AS istemci_rpc_kapali,
 has_function_privilege('service_role','public.viva_daily_katilim_baglam(uuid,uuid,text,text)','EXECUTE') AS sunucu_rpc_acik;
