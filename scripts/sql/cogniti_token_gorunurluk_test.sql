-- Tek oturum, geçici sahte veriler, ROLLBACK. Gerçek kayıtlar değiştirilmez.
BEGIN;
CREATE TEMP TABLE sonuclar(test text, sonuc text) ON COMMIT DROP;
CREATE TEMP TABLE firmalar(firma_id uuid,aktif boolean) ON COMMIT DROP;
CREATE TEMP TABLE kullanicilar(kullanici_id uuid,firma_id uuid,rol text,takim_id uuid,bolge_id uuid,aktif_mi boolean,ad text,soyad text) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_hesaplari(firma_id uuid,paket_turu text,asim_borcu bigint DEFAULT 0) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_tuketimleri(tuketim_id uuid DEFAULT gen_random_uuid(),firma_id uuid,gonderen_turu text,gonderen_id uuid,alici_turu text,alici_kimligi text,islem_turu text,kaynak_id uuid,islem_anahtari text,asim_miktari bigint DEFAULT 0,created_at timestamptz DEFAULT now()) ON COMMIT DROP;
CREATE TEMP TABLE cogniti_token_yuklemeleri(firma_id uuid,yukleme_id uuid DEFAULT gen_random_uuid(),miktar bigint,kalan bigint,yukleme_turu text,donem_yil integer,donem_ay integer,son_kullanim_at timestamptz,created_at timestamptz DEFAULT now()) ON COMMIT DROP;
CREATE TEMP TABLE eclub_kisiler(kisi_id uuid,ad text,soyad text) ON COMMIT DROP;
CREATE TEMP TABLE eczanem_musteriler(musteri_id uuid,ad_soyad text) ON COMMIT DROP;
CREATE TEMP TABLE eczanem_gonderimler(gonderim_id uuid,eczane_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE eclub_eczane_firma(eczane_id uuid,firma_id uuid,aktif_mi boolean,baglayan_utt_id uuid) ON COMMIT DROP;
CREATE FUNCTION pg_temp.cogniti_token_bakiye(p_firma uuid) RETURNS TABLE(paket_turu text,net_bakiye bigint,paket_asimi bigint) LANGUAGE sql AS $$ SELECT h.paket_turu,coalesce(sum(y.kalan),0)::bigint-h.asim_borcu,h.asim_borcu FROM pg_temp.cogniti_token_hesaplari h LEFT JOIN pg_temp.cogniti_token_yuklemeleri y ON y.firma_id=h.firma_id WHERE h.firma_id=p_firma GROUP BY h.paket_turu,h.asim_borcu $$;
CREATE OR REPLACE FUNCTION pg_temp.cogniti_token_raporu(p_kullanici uuid,p_kapsam text DEFAULT 'kapsam',p_sayfa integer DEFAULT 0,p_arama text DEFAULT '',p_tur text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_temp,pg_catalog AS $$
DECLARE k record; h record; b record; kayitlar jsonb; yuklemeler jsonb; v_yonetici boolean; v_kapsam text; v_limit integer:=25; v_toplam bigint;
BEGIN
 IF p_kullanici IS NULL OR p_kapsam IS NULL OR p_kapsam NOT IN ('benim','kapsam') OR length(coalesce(p_arama,''))>100 OR coalesce(p_tur,'') NOT IN ('','yayin','tclub_oneri','cclub_challenge','eclub_oneri','eczanem_musteri','viva_davet') OR p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>100000 THEN RAISE EXCEPTION 'Geçersiz rapor isteği.' USING ERRCODE='22023'; END IF;
 SELECT k1.kullanici_id,k1.firma_id,k1.rol,k1.takim_id,k1.bolge_id INTO k
 FROM pg_temp.kullanicilar k1 JOIN pg_temp.firmalar f ON f.firma_id=k1.firma_id AND f.aktif=true
 WHERE k1.kullanici_id=p_kullanici AND k1.aktif_mi=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Kullanıcı veya firma bulunamadı.' USING ERRCODE='42501'; END IF;
 SELECT * INTO h FROM pg_temp.cogniti_token_hesaplari WHERE firma_id=k.firma_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false); END IF;
 SELECT * INTO b FROM pg_temp.cogniti_token_bakiye(k.firma_id);
 v_yonetici:=lower(k.rol) IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm');
 v_kapsam:=CASE WHEN p_kapsam='benim' THEN 'benim' WHEN v_yonetici THEN 'firma' WHEN lower(k.rol)='tm' AND k.takim_id IS NOT NULL THEN 'takim' WHEN lower(k.rol)='bm' AND k.bolge_id IS NOT NULL AND k.takim_id IS NOT NULL THEN 'bolge' ELSE 'benim' END;
 WITH yetkili AS MATERIALIZED (
  SELECT t.tuketim_id,t.created_at,t.islem_turu,t.asim_miktari,t.kaynak_id,t.gonderen_id,
    coalesce(nullif(concat_ws(' ',g.ad,g.soyad),''),nullif(concat_ws(' ',ek.ad,ek.soyad),''),'Kullanıcı bulunamadı') AS gonderen,
    CASE WHEN t.alici_turu='firma_kullanicisi' THEN coalesce(nullif(concat_ws(' ',a.ad,a.soyad),''),'Kullanıcı bulunamadı')
         WHEN t.alici_turu='eclub_kisi' THEN coalesce(nullif(concat_ws(' ',ea.ad,ea.soyad),''),'Kişi bulunamadı')
         WHEN t.alici_turu='eczanem_musteri' THEN coalesce(m.ad_soyad,'Müşteri bulunamadı')
         WHEN t.alici_turu='viva_ozel_davetli' THEN t.alici_kimligi ELSE '—' END AS alici
  FROM pg_temp.cogniti_token_tuketimleri t
  LEFT JOIN pg_temp.kullanicilar g ON t.gonderen_turu='firma_kullanicisi' AND g.kullanici_id=t.gonderen_id AND g.firma_id=t.firma_id
  LEFT JOIN pg_temp.eclub_kisiler ek ON t.gonderen_turu='eclub_kisi' AND ek.kisi_id=t.gonderen_id
  LEFT JOIN pg_temp.kullanicilar a ON t.alici_turu='firma_kullanicisi' AND a.kullanici_id::text=t.alici_kimligi
  LEFT JOIN pg_temp.eclub_kisiler ea ON t.alici_turu='eclub_kisi' AND ea.kisi_id::text=t.alici_kimligi
  LEFT JOIN pg_temp.eczanem_musteriler m ON t.alici_turu='eczanem_musteri' AND m.musteri_id::text=t.alici_kimligi
  WHERE t.firma_id=k.firma_id AND (
   (t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=k.kullanici_id) OR v_kapsam='firma'
   OR (t.gonderen_turu='firma_kullanicisi' AND g.firma_id=k.firma_id AND
     ((v_kapsam='takim' AND g.takim_id=k.takim_id) OR (v_kapsam='bolge' AND g.bolge_id=k.bolge_id AND g.takim_id=k.takim_id)))
   OR (t.gonderen_turu='eclub_kisi' AND v_kapsam IN ('takim','bolge') AND EXISTS (
     SELECT 1 FROM pg_temp.eczanem_gonderimler eg
     JOIN pg_temp.eclub_eczane_firma ef ON ef.eczane_id=eg.eczane_id AND ef.firma_id=t.firma_id AND ef.aktif_mi=true
     JOIN pg_temp.kullanicilar u ON u.kullanici_id=ef.baglayan_utt_id AND u.firma_id=t.firma_id
     WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND
      ((v_kapsam='takim' AND u.takim_id=k.takim_id) OR (v_kapsam='bolge' AND u.takim_id=k.takim_id AND u.bolge_id=k.bolge_id)))))

 ), gruplar AS MATERIALIZED (
  SELECT islem_turu,kaynak_id,gonderen_id,gonderen,created_at,count(*)::bigint AS miktar,
   sum(asim_miktari)::bigint AS asim_miktari,
   jsonb_agg(jsonb_build_object('alici',alici,'asim_miktari',asim_miktari) ORDER BY alici,tuketim_id) AS alicilar
  FROM yetkili GROUP BY islem_turu,kaynak_id,gonderen_id,gonderen,created_at
 ), secim AS (
  SELECT * FROM gruplar WHERE (coalesce(p_tur,'')='' OR islem_turu=p_tur)
   AND (coalesce(trim(p_arama),'')='' OR position(lower(trim(p_arama)) IN lower(gonderen||' '||islem_turu||' '||alicilar::text))>0)
  ORDER BY created_at DESC,kaynak_id DESC,gonderen_id DESC,islem_turu LIMIT v_limit+1 OFFSET p_sayfa*v_limit
 )
 SELECT coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC,x.kaynak_id DESC,x.gonderen_id DESC,x.islem_turu) FROM secim x),'[]'::jsonb),
  coalesce((SELECT sum(miktar) FROM gruplar),0)::bigint INTO kayitlar,v_toplam;
 IF v_yonetici THEN
  SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.created_at DESC),'[]'::jsonb) INTO yuklemeler FROM (
   SELECT y.miktar,y.kalan,y.yukleme_turu,y.donem_yil,y.donem_ay,y.son_kullanim_at,y.created_at,
    (y.son_kullanim_at IS NOT NULL AND y.son_kullanim_at<=statement_timestamp()) AS suresi_doldu
   FROM pg_temp.cogniti_token_yuklemeleri y WHERE y.firma_id=k.firma_id ORDER BY y.created_at DESC,y.yukleme_id DESC LIMIT 50) q;
 ELSE yuklemeler:='[]'::jsonb; END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam',v_kapsam,'yonetici',v_yonetici,'paket_turu',h.paket_turu,
  'bakiye',b.net_bakiye,'paket_asimi',b.paket_asimi,'toplam',v_toplam,'kayitlar',kayitlar,'yuklemeler',yuklemeler);
END $$;
DO $test$
DECLARE f uuid:=gen_random_uuid(); f2 uuid:=gen_random_uuid(); t1 uuid:=gen_random_uuid();t2 uuid:=gen_random_uuid();b1 uuid:=gen_random_uuid();b2 uuid:=gen_random_uuid(); gm uuid:=gen_random_uuid();tm uuid:=gen_random_uuid();bm uuid:=gen_random_uuid();utt uuid:=gen_random_uuid();baska uuid:=gen_random_uuid();diger uuid:=gen_random_uuid();ecz uuid:=gen_random_uuid();kisi uuid:=gen_random_uuid();m uuid:=gen_random_uuid();g uuid:=gen_random_uuid();kay uuid:=gen_random_uuid();res jsonb;
BEGIN
 INSERT INTO pg_temp.firmalar VALUES(f,true),(f2,true);
 INSERT INTO pg_temp.kullanicilar VALUES(gm,f,'gm',null,null,true,'Murat','GM'),(tm,f,'tm',t1,null,true,'Elif','TM'),(bm,f,'bm',t1,b1,true,'Deniz','BM'),(utt,f,'utt',t1,b1,true,'Berk','UTT'),(baska,f,'utt',t2,b2,true,'Can','UTT'),(diger,f2,'gm',null,null,true,'Başka','Firma');
 INSERT INTO pg_temp.cogniti_token_hesaplari VALUES(f,'kullandigin_kadar_ode',0),(f2,'aylik',0);
 INSERT INTO pg_temp.cogniti_token_yuklemeleri(firma_id,miktar,kalan,yukleme_turu) VALUES(f,1500,1480,'kko');
 INSERT INTO pg_temp.eclub_kisiler VALUES(kisi,'Ayşe','Eczacı');
 INSERT INTO pg_temp.eczanem_musteriler VALUES(m,'Müşteri Bir');
 INSERT INTO pg_temp.eczanem_gonderimler VALUES(g,ecz);
 INSERT INTO pg_temp.eclub_eczane_firma VALUES(ecz,f,true,utt);
 INSERT INTO pg_temp.cogniti_token_tuketimleri(firma_id,gonderen_turu,gonderen_id,alici_turu,alici_kimligi,islem_turu,kaynak_id,islem_anahtari) VALUES
 (f,'firma_kullanicisi',utt,'eclub_kisi',kisi::text,'eclub_oneri',kay,'a'),(f,'firma_kullanicisi',utt,'firma_kullanicisi',bm::text,'eclub_oneri',kay,'b'),(f,'firma_kullanicisi',baska,'firma_kullanicisi',bm::text,'yayin',gen_random_uuid(),'c'),(f,'eclub_kisi',kisi,'eczanem_musteri',m::text,'eczanem_musteri',gen_random_uuid(),'eczanem-gonderim:'||g::text),(f2,'firma_kullanicisi',diger,'firma_kullanicisi',bm::text,'yayin',gen_random_uuid(),'d');
 res:=pg_temp.cogniti_token_raporu(gm,'kapsam',0,'','');
 IF (res->>'toplam')::int<>4 OR jsonb_array_length(res->'yuklemeler')<>1 OR (res->>'bakiye')::int<>1480 THEN RAISE EXCEPTION 'Firma görünümü hatalı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('GM yalnız kendi firmasını ve yüklemeleri görür','BAŞARILI');
 res:=pg_temp.cogniti_token_raporu(tm,'kapsam',0,'','');
 IF (res->>'toplam')::int<>3 OR jsonb_array_length(res->'yuklemeler')<>0 THEN RAISE EXCEPTION 'TM kapsamı hatalı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('TM kendi takımı ve bağlı eczane tüketimini görür','BAŞARILI');
 res:=pg_temp.cogniti_token_raporu(bm,'kapsam',0,'','');
 IF (res->>'toplam')::int<>3 THEN RAISE EXCEPTION 'BM kapsamı hatalı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('BM bölgesi ve bağlı eczane tüketimini görür','BAŞARILI');
 res:=pg_temp.cogniti_token_raporu(utt,'kapsam',0,'','');
 IF (res->>'toplam')::int<>2 OR (res->>'bakiye')::int<>1480 OR jsonb_array_length(res->'kayitlar')<>1 THEN RAISE EXCEPTION 'UTT görünümü veya grup hatalı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('UTT kendi gönderimini ve firma bakiyesini görür; toplu kayıt gruplanır','BAŞARILI');
 res:=pg_temp.cogniti_token_raporu(tm,'benim',0,'','');
 IF (res->>'toplam')::int<>0 THEN RAISE EXCEPTION 'Benim seçimi kapsamı açtı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('Benim gönderimlerim yalnız kendi kayıtlarını gösterir','BAŞARILI');
 res:=pg_temp.cogniti_token_raporu(gm,'kapsam',0,'Müşteri Bir','eczanem_musteri');
 IF jsonb_array_length(res->'kayitlar')<>1 OR res->'kayitlar'->0->'alicilar'->0->>'alici'<>'Müşteri Bir' THEN RAISE EXCEPTION 'Filtre hatalı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('İşlem ve alıcı araması doğru kaydı getirir','BAŞARILI');
 BEGIN PERFORM pg_temp.cogniti_token_raporu(kisi,'kapsam',0,'',''); RAISE EXCEPTION 'Eczacı rapora erişti'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 INSERT INTO pg_temp.sonuclar VALUES('Eczane çalışanı token raporuna erişemez','BAŞARILI');
 res:=pg_temp.cogniti_token_raporu(gm,'kapsam',1,'','');
 IF jsonb_array_length(res->'kayitlar')<>0 THEN RAISE EXCEPTION 'Sayfalama hatalı'; END IF;
 INSERT INTO pg_temp.sonuclar VALUES('Sayfalama yetkili sonuçlarda uygulanır','BAŞARILI');
END $test$;
SELECT * FROM pg_temp.sonuclar ORDER BY test;
ROLLBACK;
