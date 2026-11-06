-- Agora vitrini ve etkileşimleri. SQL kullanıcı tarafından tek parça çalıştırılır.
-- Satın alma veya token tüketimi yapmaz. Sipariş ölçümleri satın alma adımında bağlanacaktır.
BEGIN;
CREATE TABLE IF NOT EXISTS public.agora_vitrin_etkilesimleri (
 auth_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 egitim_id uuid NOT NULL REFERENCES public.agora_partner_egitimleri(egitim_id),
 begeni boolean NOT NULL DEFAULT false,
 favori boolean NOT NULL DEFAULT false,
 guncellendi_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(auth_id,egitim_id)
);
CREATE INDEX IF NOT EXISTS agora_vitrin_etkilesim_egitim ON public.agora_vitrin_etkilesimleri(egitim_id);
CREATE TABLE IF NOT EXISTS public.agora_vitrin_haftalik_ozet (
 hafta date PRIMARY KEY, partner_sayisi bigint NOT NULL, yayin_sayisi bigint NOT NULL,
 olusturuldu_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_vitrin_etkilesimleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_vitrin_haftalik_ozet ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_vitrin_etkilesimleri,public.agora_vitrin_haftalik_ozet FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.agora_vitrin_yetki(p_auth_id uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF NOT EXISTS(
  SELECT 1 FROM public.kullanicilar k JOIN public.firmalar f USING(firma_id)
  WHERE k.kullanici_id=p_auth_id AND k.aktif_mi=true AND f.aktif=true
  AND lower(k.rol) IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per','tm','gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm')
 ) THEN RAISE EXCEPTION 'Agora erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
END;
$f$;
-- Üç stat Agora geneline aittir. Haftanın ilk okuması özeti üretir, aynı hafta değişmez.
-- Sidebar ve katalog ise her okumada canlı veriden hesaplanır.
CREATE OR REPLACE FUNCTION public.agora_vitrin_oku(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_hafta date:=(date_trunc('week',now() AT TIME ZONE 'Europe/Istanbul'))::date; ozet jsonb; partnerler jsonb; yayinlar jsonb;
BEGIN
 PERFORM public.agora_vitrin_yetki(p_auth_id);
 INSERT INTO public.agora_vitrin_haftalik_ozet(hafta,partner_sayisi,yayin_sayisi)
 SELECT v_hafta,(SELECT count(*) FROM public.agora_is_partnerleri p JOIN public.agora_partner_profilleri f USING(partner_id) WHERE p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi'),
 (SELECT count(*) FROM public.agora_yayindaki_egitimler)
 ON CONFLICT DO NOTHING;
 SELECT jsonb_build_object('partner_sayisi',s.partner_sayisi,'yayin_sayisi',s.yayin_sayisi,'siparis_sayisi',NULL,'hafta',s.hafta) INTO ozet
 FROM public.agora_vitrin_haftalik_ozet s WHERE s.hafta=v_hafta;
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.yayin_sayisi DESC,r.sirket_adi COLLATE "C",r.partner_id),'[]') INTO partnerler FROM (
  SELECT p.partner_id,f.sirket_adi,count(y.egitim_id) AS yayin_sayisi
  FROM public.agora_is_partnerleri p JOIN public.agora_partner_profilleri f USING(partner_id)
  LEFT JOIN public.agora_yayindaki_egitimler y USING(partner_id)
  WHERE p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi'
  GROUP BY p.partner_id,f.sirket_adi
 ) r;
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.yayinlandi_at DESC,r.egitim_id),'[]') INTO yayinlar FROM (
  SELECT y.*,e.partner_egitim_id,public.agora_partner_kart_video_guid(y.egitim_id) AS kapak_video_guid,
   (SELECT count(*) FROM public.agora_vitrin_etkilesimleri i JOIN public.kullanicilar k ON k.kullanici_id=i.auth_id JOIN public.firmalar f USING(firma_id) WHERE i.egitim_id=y.egitim_id AND i.begeni AND k.aktif_mi AND f.aktif) AS begeni_sayisi,
   (SELECT count(*) FROM public.agora_vitrin_etkilesimleri i JOIN public.kullanicilar k ON k.kullanici_id=i.auth_id JOIN public.firmalar f USING(firma_id) WHERE i.egitim_id=y.egitim_id AND i.favori AND k.aktif_mi AND f.aktif) AS favori_sayisi,
   coalesce(i.begeni,false) AS begeni_mi,coalesce(i.favori,false) AS favori_mi,
   NULL::bigint AS siparis_sayisi
  FROM public.agora_yayindaki_egitimler y JOIN public.agora_partner_egitimleri e USING(egitim_id)
  LEFT JOIN public.agora_vitrin_etkilesimleri i ON i.egitim_id=y.egitim_id AND i.auth_id=p_auth_id
 ) r;
 RETURN jsonb_build_object('stat',ozet,'partnerler',partnerler,'yayinlar',yayinlar);
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_vitrin_etkilesim_kaydet(p_auth_id uuid,p_egitim_id uuid,p_tur text,p_deger boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM public.agora_vitrin_yetki(p_auth_id);
 IF p_tur IS NULL OR p_tur NOT IN ('begeni','favori') OR p_deger IS NULL THEN RAISE EXCEPTION 'Geçersiz etkileşim.' USING ERRCODE='22023'; END IF;
 -- Yayından kaldırma ile eşzamanlı istekte eğitim kaydını kilitle.
 PERFORM 1 FROM public.agora_partner_egitimleri WHERE egitim_id=p_egitim_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.agora_yayindaki_egitimler WHERE egitim_id=p_egitim_id) THEN RETURN false; END IF;
 INSERT INTO public.agora_vitrin_etkilesimleri AS i(auth_id,egitim_id,begeni,favori)
 VALUES(p_auth_id,p_egitim_id,p_tur='begeni' AND p_deger,p_tur='favori' AND p_deger)
 ON CONFLICT(auth_id,egitim_id) DO UPDATE SET
 begeni=CASE WHEN p_tur='begeni' THEN p_deger ELSE i.begeni END,
 favori=CASE WHEN p_tur='favori' THEN p_deger ELSE i.favori END,guncellendi_at=now();
 RETURN true;
END;
$f$;

CREATE OR REPLACE FUNCTION public.agora_vitrin_medya(p_auth_id uuid,p_egitim_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 PERFORM public.agora_vitrin_yetki(p_auth_id);
 RETURN (SELECT CASE WHEN y.yayin_araci='video' THEN jsonb_build_object('tur','video','guid',v.video_guid)
 ELSE jsonb_build_object('tur','podcast','dosya_yolu',a.dosya_yolu,'mime_type',a.mime_type) END
 FROM public.agora_yayindaki_egitimler y JOIN public.agora_partner_egitimleri e USING(egitim_id)
 LEFT JOIN public.agora_partner_videolari v ON v.yukleme_id=e.yayin_egitim_video_id
 LEFT JOIN public.agora_partner_podcastleri a ON a.yukleme_id=e.yayin_podcast_id
 WHERE y.egitim_id=p_egitim_id);
END;
$f$;
REVOKE ALL ON FUNCTION public.agora_vitrin_yetki(uuid),public.agora_vitrin_oku(uuid),public.agora_vitrin_etkilesim_kaydet(uuid,uuid,text,boolean),public.agora_vitrin_medya(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_vitrin_oku(uuid),public.agora_vitrin_etkilesim_kaydet(uuid,uuid,text,boolean),public.agora_vitrin_medya(uuid,uuid) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_vitrin_oku(uuid)') IS NOT NULL
 AND NOT has_function_privilege('authenticated','public.agora_vitrin_oku(uuid)','EXECUTE') AS agora_vitrin_hazir;
