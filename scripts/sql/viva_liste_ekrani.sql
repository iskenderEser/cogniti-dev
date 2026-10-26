-- Viva tasarım aktarımı / Adım 2. KULLANICI ÇALIŞTIRACAK.
-- Salt okunur yeni RPC; mevcut Viva fonksiyonlarını, tabloları, yetkileri veya verileri değiştirmez.
-- Önkoşul: viva_asama1.sql ve viva_anlik_planlama.sql mevcut olmalı.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-liste-ekrani'));
CREATE OR REPLACE FUNCTION public.viva_liste_ekrani(p_auth uuid,p_veri jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 bolum text:=coalesce(p_veri->>'bolum','yaklasan');
 kapsam text:=coalesce(p_veri->>'kapsam','tumu');
 arama text:=btrim(coalesce(p_veri->>'arama',''));
 ay text:=coalesce(p_veri->>'ay',to_char(now() AT TIME ZONE 'Europe/Istanbul','YYYY-MM'));
 gun text:=nullif(p_veri->>'gun','');
 offst integer:=coalesce((p_veri->>'offset')::integer,0);
 yetkili boolean; sonuc jsonb;
BEGIN
 IF p_auth IS NULL THEN RAISE EXCEPTION 'Oturum gerekli.' USING ERRCODE='42501'; END IF;
 -- Aynı giriş/organizasyon kapısı; yeni bir yetki modeli oluşturulmaz.
 SELECT coalesce((public.viva_islem(p_auth,'baglam','{}')->>'olusturabilir')::boolean,false) INTO yetkili;
 IF bolum NOT IN ('yaklasan','taslak','gecmis') OR kapsam NOT IN ('tumu','duzenlediklerim','davetlerim')
 OR length(arama)>160 OR offst<0 OR offst>1000000 OR ay !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
 OR substring(ay,1,4)::int NOT BETWEEN 1900 AND 2200
 THEN RAISE EXCEPTION 'Geçersiz etkinlik filtresi.' USING ERRCODE='22023'; END IF;
 IF gun IS NOT NULL AND (gun !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR substring(gun,1,7)<>ay OR to_char(gun::date,'YYYY-MM-DD')<>gun)
 THEN RAISE EXCEPTION 'Geçersiz gün.' USING ERRCODE='22023'; END IF;
 WITH temel AS MATERIALIZED (
   SELECT e.* FROM public.viva_etkinlikler e
   WHERE public.viva_erisim(p_auth,e.etkinlik_id)
   AND (kapsam='tumu' OR (kapsam='duzenlediklerim' AND e.sahip_id=p_auth) OR (kapsam='davetlerim' AND e.sahip_id<>p_auth))
   -- %, _ veya ters bölü arama operatörü değildir; metin düz alt-dize olarak aranır.
   AND position(lower(translate(arama,'Iİ','ıi')) IN lower(translate(e.baslik,'Iİ','ıi')))>0
 ), gruplu AS MATERIALIZED (
   SELECT t.* FROM temel t WHERE
   (bolum='yaklasan' AND t.durum IN ('canli','planlandi') AND t.bitis>now()) OR
   (bolum='taslak' AND t.durum='taslak' AND t.sahip_id=p_auth) OR
   (bolum='gecmis' AND t.durum<>'taslak' AND (t.durum IN ('sona_erdi','iptal') OR t.bitis<=now()))
 ), tarihte AS MATERIALIZED (
   SELECT g.* FROM gruplu g WHERE gun IS NULL OR to_char(g.baslangic AT TIME ZONE 'Europe/Istanbul','YYYY-MM-DD')=gun
 ), liste AS MATERIALIZED (
   SELECT * FROM tarihte WHERE NOT (bolum='yaklasan' AND durum='canli')
 ), sayfa AS (
   SELECT etkinlik_id FROM liste
   ORDER BY CASE WHEN bolum='gecmis' THEN baslangic END DESC,
   CASE WHEN bolum<>'gecmis' THEN baslangic END ASC,
   CASE WHEN bolum='gecmis' THEN etkinlik_id END DESC,
   CASE WHEN bolum<>'gecmis' THEN etkinlik_id END ASC
   LIMIT 20 OFFSET offst
 ), canli AS (
   SELECT etkinlik_id FROM tarihte WHERE bolum='yaklasan' AND durum='canli'
 ), siradaki AS (
   SELECT etkinlik_id FROM temel WHERE durum='planlandi' AND bitis>now()
   AND (gun IS NULL OR to_char(baslangic AT TIME ZONE 'Europe/Istanbul','YYYY-MM-DD')=gun)
   ORDER BY baslangic,etkinlik_id LIMIT 1
 ), secili AS (
   SELECT etkinlik_id FROM sayfa UNION SELECT etkinlik_id FROM canli UNION SELECT etkinlik_id FROM siradaki
 ), kartlar AS MATERIALIZED (
   SELECT t.etkinlik_id,t.baslangic,public.viva_ozet(p_auth,t.etkinlik_id)||jsonb_build_object(
     'katilimci_sayisi',CASE WHEN t.sahip_id=p_auth THEN
       (SELECT count(*) FROM public.viva_katilimcilar k WHERE k.etkinlik_id=t.etkinlik_id) ELSE NULL END
   ) AS veri FROM temel t JOIN secili s USING(etkinlik_id)
 )
 SELECT jsonb_build_object(
   'olusturabilir',yetkili,'simdi',now(),'toplam',(SELECT count(*) FROM liste),
   'devam_var',(SELECT count(*) FROM liste)>offst+20,
   'etkinlikler',coalesce((SELECT jsonb_agg(k.veri ORDER BY
     CASE WHEN bolum='gecmis' THEN k.baslangic END DESC,CASE WHEN bolum<>'gecmis' THEN k.baslangic END ASC,
     CASE WHEN bolum='gecmis' THEN k.etkinlik_id END DESC,CASE WHEN bolum<>'gecmis' THEN k.etkinlik_id END ASC)
     FROM kartlar k JOIN sayfa s USING(etkinlik_id)),'[]'::jsonb),
   'canlilar',coalesce((SELECT jsonb_agg(k.veri ORDER BY k.baslangic,k.etkinlik_id) FROM kartlar k JOIN canli c USING(etkinlik_id)),'[]'::jsonb),
   'siradaki',(SELECT k.veri FROM kartlar k JOIN siradaki s USING(etkinlik_id)),
   'takvim',coalesce((SELECT jsonb_agg(jsonb_build_object('gun',d.gun,'adet',d.adet) ORDER BY d.gun) FROM (
     SELECT to_char(baslangic AT TIME ZONE 'Europe/Istanbul','YYYY-MM-DD') AS gun,count(*) AS adet
     FROM gruplu WHERE baslangic >= (ay||'-01')::timestamp AT TIME ZONE 'Europe/Istanbul'
     AND baslangic < ((ay||'-01')::date+interval '1 month') AT TIME ZONE 'Europe/Istanbul'
     GROUP BY 1) d),'[]'::jsonb)
 ) INTO sonuc;
 RETURN sonuc;
END $$;
REVOKE ALL ON FUNCTION public.viva_liste_ekrani(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_liste_ekrani(uuid,jsonb) TO service_role;
COMMIT;
-- Yalnız metadata kontrolü. Gerçek kullanıcı veya Daily çağrısı yapmaz.
SELECT to_regprocedure('public.viva_liste_ekrani(uuid,jsonb)') IS NOT NULL AS liste_fonksiyonu,
 NOT has_function_privilege('anon','public.viva_liste_ekrani(uuid,jsonb)','EXECUTE') AS anon_kapali,
 NOT has_function_privilege('authenticated','public.viva_liste_ekrani(uuid,jsonb)','EXECUTE') AS istemci_kapali,
 has_function_privilege('service_role','public.viva_liste_ekrani(uuid,jsonb)','EXECUTE') AS sunucu_acik;
