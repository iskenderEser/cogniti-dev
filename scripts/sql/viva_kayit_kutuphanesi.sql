-- Viva tasarım aktarımı / Adım 4. KULLANICI ÇALIŞTIRACAK.
-- Salt okunur kayıt özeti. Mevcut tabloları/verileri/fonksiyonları değiştirmez.
-- Önkoşul: Viva 1, anlık planlama, Daily 2.5 ve viva_kayit_indirme_7gun kurulu olmalı.
-- Daily/HTTP çağrısı yapmaz; indirme bağlantısı üretmez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-kayit-kutuphanesi'));
DO $$ BEGIN
 IF to_regclass('public.viva_daily_kayitlar') IS NULL
 OR to_regprocedure('public.viva_daily_indirme_islem(uuid,uuid,text,jsonb)') IS NULL
 OR NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='viva_etkinlikler' AND column_name='sona_erme_zamani')
 THEN RAISE EXCEPTION 'Önce mevcut Viva Daily 2.5 ve viva_kayit_indirme_7gun kurulumu tamamlanmalı.' USING ERRCODE='55000'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.viva_kayit_kutuphanesi(p_auth uuid,p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE yetkili boolean; sonuc jsonb;
BEGIN
 IF p_auth IS NULL THEN RAISE EXCEPTION 'Oturum gerekli.' USING ERRCODE='42501'; END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>1000000 THEN RAISE EXCEPTION 'Geçersiz sayfa.' USING ERRCODE='22023'; END IF;
 -- Mevcut aktif kullanıcı/firma/organizasyon kapısı; ayrı bir rol modeli yok.
 SELECT coalesce((public.viva_islem(p_auth,'baglam','{}')->>'olusturabilir')::boolean,false) INTO yetkili;
 WITH temel AS MATERIALIZED (
  SELECT e.etkinlik_id,e.baslangic,
   (SELECT count(*) FROM public.viva_daily_kayitlar k WHERE k.etkinlik_id=e.etkinlik_id) AS adet,
   coalesce(e.sona_erme_zamani,CASE WHEN e.bitis<=now() THEN e.bitis ELSE NULL END)+interval '168 hours' AS son
  FROM public.viva_etkinlikler e
  WHERE e.sahip_id=p_auth AND public.viva_sahip_aktif(e.etkinlik_id)
   AND EXISTS(SELECT 1 FROM public.viva_daily_kayitlar k WHERE k.etkinlik_id=e.etkinlik_id)
 ), sayfa AS (
  SELECT * FROM temel ORDER BY baslangic DESC,etkinlik_id LIMIT 20 OFFSET p_offset
 )
 SELECT jsonb_build_object('olusturabilir',yetkili,'toplam',(SELECT count(*) FROM temel),
  'devam_var',(SELECT count(*) FROM temel)>p_offset+20,
  'etkinlikler',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'etkinlik',public.viva_ozet(p_auth,etkinlik_id),'kayit_sayisi',adet,
   'indirme_bitis',son,'suresi_doldu',coalesce(son<=now(),false)) ORDER BY baslangic DESC,etkinlik_id) FROM sayfa),'[]'::jsonb)) INTO sonuc;
 RETURN sonuc;
END $$;
REVOKE ALL ON FUNCTION public.viva_kayit_kutuphanesi(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_kayit_kutuphanesi(uuid,integer) TO service_role;
COMMIT;
SELECT to_regprocedure('public.viva_kayit_kutuphanesi(uuid,integer)') IS NOT NULL AS kutuphane_fonksiyonu,
 NOT has_function_privilege('anon','public.viva_kayit_kutuphanesi(uuid,integer)','EXECUTE') AS anon_kapali,
 NOT has_function_privilege('authenticated','public.viva_kayit_kutuphanesi(uuid,integer)','EXECUTE') AS istemci_kapali,
 has_function_privilege('service_role','public.viva_kayit_kutuphanesi(uuid,integer)','EXECUTE') AS sunucu_acik;
