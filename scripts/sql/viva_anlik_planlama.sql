-- Viva: anlık yayın ve planlama. KULLANICI ÇALIŞTIRACAK; ajan canlı DB'ye bağlanmaz.
-- Önkoşul: mevcut Viva aşama 1–2 kurulumu. Tablo/kolon eklemez.
-- Eski kurulum dosyası değiştirilmez; iki mevcut fonksiyon bu sürüme güncellenir.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-anlik-planlama'));

CREATE OR REPLACE FUNCTION public.viva_ozet(p_auth uuid,p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('etkinlik_id',e.etkinlik_id,'baslik',e.baslik,'aciklama',e.aciklama,
 'yayin_turu',coalesce(e.olusturma_ozeti->>'yayin_turu','planli'),'baslangic',e.baslangic,'bitis',e.bitis,'durum',e.durum,'surum',e.surum,'sahip_id',e.sahip_id,
 'sahip_adi',s.ad||' '||s.soyad,'firma_adi',coalesce(f.firma_adi,'Cogniti'),
 'yonetebilir',e.sahip_id=p_auth,'oda_acik',e.durum IN ('planlandi','canli') AND e.bitis>now())
 FROM viva_etkinlikler e JOIN kullanicilar s ON s.kullanici_id=e.sahip_id
 LEFT JOIN firmalar f ON f.firma_id=e.firma_id WHERE e.etkinlik_id=p_id
$$;

CREATE OR REPLACE FUNCTION public.viva_islem(p_auth uuid,p_islem text,p_veri jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e viva_etkinlikler%ROWTYPE; s kullanicilar%ROWTYPE; k jsonb; id uuid; yeni boolean:=false;
 bas timestamptz; bit timestamptz; v_durum text; sonuc jsonb; offst integer;
 v_anlik boolean; v_sure integer;
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
 IF coalesce(p_veri->>'yayin_turu','planli') NOT IN ('anlik','planli')
 THEN RAISE EXCEPTION 'Yayın türü geçersiz.' USING ERRCODE='22023'; END IF;
 IF NOT yeni AND e.olusturma_ozeti->>'yayin_turu'='anlik'
 THEN RAISE EXCEPTION 'Başlatılmış anlık yayın yeniden planlanamaz.' USING ERRCODE='22023'; END IF;
 v_anlik:=p_veri->>'yayin_turu' IS NOT DISTINCT FROM 'anlik';
 v_durum:=p_veri->>'durum';
 IF v_anlik THEN
  IF NOT yeni OR v_durum IS DISTINCT FROM 'planlandi'
   OR p_veri ? 'baslangic' OR p_veri ? 'bitis'
   OR jsonb_typeof(p_veri->'sure_dakika') IS DISTINCT FROM 'number'
   OR coalesce(p_veri->>'sure_dakika','') !~ '^[0-9]{1,4}$'
  THEN RAISE EXCEPTION 'Anlık yayın bilgileri geçersiz.' USING ERRCODE='22023'; END IF;
  v_sure:=(p_veri->>'sure_dakika')::integer;
  IF v_sure NOT BETWEEN 1 AND 1440 THEN RAISE EXCEPTION 'Yayın süresi geçersiz.' USING ERRCODE='22023'; END IF;
  -- Başlangıç yalnız DB saati; yanıt kaybındaki tekrar aynı anahtar kontrolünden döner.
  bas:=now(); bit:=bas+make_interval(mins=>v_sure);
 ELSE
  bas:=(p_veri->>'baslangic')::timestamptz; bit:=(p_veri->>'bitis')::timestamptz;
 END IF;
 IF bas IS NULL OR bit IS NULL OR bit<=bas OR coalesce(v_durum,'') NOT IN ('taslak','planlandi')
 OR (NOT yeni AND e.durum='planlandi' AND v_durum='taslak')
 OR (NOT v_anlik AND v_durum='planlandi' AND bas<=now()) OR coalesce(length(btrim(p_veri->>'baslik')),0) NOT BETWEEN 1 AND 160
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

REVOKE ALL ON FUNCTION public.viva_ozet(uuid,uuid),public.viva_islem(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_ozet(uuid,uuid),public.viva_islem(uuid,text,jsonb) TO service_role;
COMMIT;
SELECT to_regprocedure('public.viva_islem(uuid,text,jsonb)') IS NOT NULL AS planlama_fonksiyonu;
