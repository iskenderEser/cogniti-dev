-- Yalniz Eczanem puan-TL oraninin merkezi firma tanimina baglanmasi.
-- Mevcut tarifeler, puanlar, indirim talepleri, onay/mutabakat fonksiyonlari degismez.
BEGIN;
CREATE OR REPLACE VIEW public.eczanem_merkezi_urun_tarifeleri AS
 SELECT t.tarife_id,t.urun_id,m.karsilik_puan AS puan,m.karsilik_tl AS tl,
 t.gecerlilik_baslangic,t.olusturan_id,t.created_at,t.satis_fiyati
 FROM public.urunler u
 JOIN public.eczanem_firma_cek_tanimlari m ON m.firma_id=u.firma_id
 CROSS JOIN LATERAL (
  SELECT * FROM public.eczanem_urun_tarifeleri r WHERE r.urun_id=u.urun_id AND r.gecerlilik_baslangic<=now()
  ORDER BY r.gecerlilik_baslangic DESC,r.created_at DESC,r.tarife_id DESC LIMIT 1
 )t;
REVOKE ALL ON public.eczanem_merkezi_urun_tarifeleri FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.eczanem_merkezi_urun_tarifeleri TO service_role;

-- Yeni urun tarifesinde PM kaynakli oran yerine merkezi tanim kullanilir.
CREATE OR REPLACE FUNCTION public.tg_eczanem_merkezi_tarife_orani()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE v_oran public.eczanem_firma_cek_tanimlari%ROWTYPE;
BEGIN
 SELECT m.* INTO v_oran FROM public.urunler u JOIN public.eczanem_firma_cek_tanimlari m ON m.firma_id=u.firma_id
 WHERE u.urun_id=NEW.urun_id FOR SHARE OF m;
 IF v_oran.firma_id IS NULL THEN RAISE EXCEPTION 'Firma icin Eczanem puan-TL karsiligi tanimlanmalidir.' USING ERRCODE='22023'; END IF;
 NEW.puan:=v_oran.karsilik_puan; NEW.tl:=v_oran.karsilik_tl;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.tg_eczanem_merkezi_tarife_orani() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS eczanem_merkezi_tarife_orani ON public.eczanem_urun_tarifeleri;
CREATE TRIGGER eczanem_merkezi_tarife_orani BEFORE INSERT ON public.eczanem_urun_tarifeleri
 FOR EACH ROW EXECUTE FUNCTION public.tg_eczanem_merkezi_tarife_orani();

-- Disari aktarimin bakiye hesabi da ayni oran kaynagini okur; tarife tarihcesi korunur.
DO $export$
DECLARE s text; eski text;
BEGIN
 IF to_regprocedure('public.admin_firma_export_snapshot(uuid)') IS NOT NULL THEN
  SELECT pg_get_functiondef('public.admin_firma_export_snapshot(uuid)'::regprocedure) INTO s;
  IF strpos(s,'''eczanem_merkezi_tarifeler''')=0 THEN
   eski:=' v_veri:=v_veri||jsonb_build_object(''tarifeler'',v_satirlar);';
   IF strpos(s,eski)=0 THEN RAISE EXCEPTION 'Firma dokumu tarife bolumu beklenen surumde degil; islem geri alindi.'; END IF;
   s:=replace(s,eski,eski||E'\n SELECT coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) INTO v_satirlar FROM public.eczanem_merkezi_urun_tarifeleri t WHERE t.urun_id IN (SELECT urun_id FROM public.urunler WHERE firma_id=p_firma);\n v_veri:=v_veri||jsonb_build_object(''eczanem_merkezi_tarifeler'',v_satirlar);');
   EXECUTE s;
  END IF;
 END IF;
END;
$export$;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eczanem_merkezi_donusum_baglantisi_hazir;
