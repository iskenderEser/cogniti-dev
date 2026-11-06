-- Agora satın alma: önce vitrin kurulumu uygulanmış olmalıdır.
-- Kullanıcı çalıştırır. Sipariş + token + üreticinin yayın havuzu tek transaction'dır.
BEGIN;
DO $f$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_cogniti_token_sifirda_pasif' AND tgenabled<>'D' AND NOT tgisinternal) THEN
  RAISE EXCEPTION 'Önce cogniti_token_kko_aylik_kurulum.sql uygulanmalı: eski otomatik pasife alma kuralı hâlâ etkin.';
 END IF;
END $f$;
ALTER TABLE public.cogniti_token_tuketimleri DROP CONSTRAINT IF EXISTS cogniti_token_tuketimleri_islem_turu_check;
ALTER TABLE public.cogniti_token_tuketimleri ADD CONSTRAINT cogniti_token_tuketimleri_islem_turu_check
 CHECK(islem_turu IN ('yayin','tclub_oneri','cclub_challenge','eclub_oneri','eczanem_musteri','viva_davet','viva_sure','agora_satin_alma'));
CREATE TABLE IF NOT EXISTS public.agora_siparisleri (
 siparis_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 alici_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 egitim_id uuid NOT NULL REFERENCES public.agora_partner_egitimleri(egitim_id),
 partner_id uuid NOT NULL REFERENCES public.agora_is_partnerleri(partner_id),
 partner_egitim_id text NOT NULL, egitim_adi text NOT NULL, egitim_surumu integer NOT NULL,
 satin_alma_bedeli numeric(12,2) NOT NULL CHECK(satin_alma_bedeli>=0),
 kko_birim_fiyati numeric(12,2) NOT NULL CHECK(kko_birim_fiyati>0),
 token_tutari bigint NOT NULL CHECK(token_tutari>=0),
 borca_yazilan_token bigint NOT NULL CHECK(borca_yazilan_token BETWEEN 0 AND token_tutari),
 hizmet_orani numeric(4,2) NOT NULL DEFAULT 15 CHECK(hizmet_orani=15),
 hizmet_bedeli numeric(12,2) NOT NULL, odenecek_tutar numeric(12,2) NOT NULL,
 tuketim_id uuid REFERENCES public.cogniti_token_tuketimleri(tuketim_id),
 -- Kaynak sonradan değiştirilse/pasife alınsa bile satın alınan paket korunur.
 paket jsonb NOT NULL, siparis_tarihi timestamptz NOT NULL DEFAULT now(),
 UNIQUE(alici_id,egitim_id), CHECK(hizmet_bedeli+odenecek_tutar=satin_alma_bedeli)
);
CREATE INDEX IF NOT EXISTS agora_siparis_egitim ON public.agora_siparisleri(egitim_id);
ALTER TABLE public.agora_siparisleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_siparisleri FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.agora_satin_alma_yetki(p_auth_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_firma uuid;
BEGIN
 SELECT k.firma_id INTO v_firma FROM public.kullanicilar k JOIN public.firmalar f USING(firma_id)
 WHERE k.kullanici_id=p_auth_id AND k.aktif_mi AND f.aktif
 AND lower(k.rol) IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per');
 IF v_firma IS NULL THEN RAISE EXCEPTION 'Sipariş verme yetkiniz bulunmuyor.' USING ERRCODE='42501'; END IF;
 RETURN v_firma;
END $f$;

CREATE OR REPLACE FUNCTION public.agora_satin_al(p_auth_id uuid,p_egitim_id uuid,p_surum integer,p_fiyat numeric,p_kko_birim numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE firma uuid; e public.agora_partner_egitimleri%ROWTYPE; s public.agora_siparisleri%ROWTYPE;
 h public.cogniti_token_hesaplari%ROWTYPE; medya jsonb; y record; toplam bigint; v_kalan bigint; pay bigint; tid uuid;
BEGIN
 firma:=public.agora_satin_alma_yetki(p_auth_id);
 -- Tüm firma alımları token hesabı kilidini paylaşır; farklı üreticiler de aynı kilitten geçer.
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Firmanın token hesabı bulunamadı.' USING ERRCODE='22023'; END IF;
 SELECT * INTO s FROM public.agora_siparisleri WHERE alici_id=p_auth_id AND egitim_id=p_egitim_id;
 IF FOUND THEN RETURN jsonb_build_object('mevcut',true,'siparis_id',s.siparis_id,'token_tutari',s.token_tutari,'borca_yazilan_token',s.borca_yazilan_token); END IF;
 SELECT * INTO e FROM public.agora_partner_egitimleri WHERE egitim_id=p_egitim_id FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.agora_yayindaki_egitimler WHERE egitim_id=p_egitim_id) THEN
  RAISE EXCEPTION 'Yayın artık Agora’da satışta değil.' USING ERRCODE='40001'; END IF;
 IF p_surum IS DISTINCT FROM e.surum OR p_fiyat IS DISTINCT FROM e.fiyat_tl THEN
  RAISE EXCEPTION 'Yayın veya fiyat değişti. Agora’yı yenileyip tekrar onaylayın.' USING ERRCODE='40001'; END IF;
 -- Birim fiyat yalnız sunucudaki ortak fiyat kaynağından gelir; istemciden alınmaz.
 IF p_kko_birim IS NULL OR p_kko_birim<=0 OR p_kko_birim::text IN ('NaN','Infinity','-Infinity') THEN
  RAISE EXCEPTION 'Token birim fiyatı geçersiz.' USING ERRCODE='22023'; END IF;
 IF e.yayin_araci='video' THEN
  SELECT jsonb_build_object('dosya_yolu',v.video_guid,'dosya_boyutu',v.dosya_boyutu,'sure_saniye',v.sure_saniye,'mime_type','video/mp4') INTO medya
  FROM public.agora_partner_videolari v WHERE v.yukleme_id=e.yayin_egitim_video_id AND v.egitim_id=e.egitim_id AND v.durum='hazir';
 ELSE
  SELECT jsonb_build_object('dosya_yolu',a.dosya_yolu,'dosya_boyutu',a.dosya_boyutu,'sure_saniye',a.sure_saniye,'mime_type',a.mime_type,'checksum_sha256',a.checksum_sha256)||public.agora_partner_podcast_ek_paket(a.yukleme_id) INTO medya
  FROM public.agora_partner_podcastleri a WHERE a.yukleme_id=e.yayin_podcast_id AND a.egitim_id=e.egitim_id AND a.durum='hazir';
 END IF;
 IF medya IS NULL THEN RAISE EXCEPTION 'Yayının kaynak dosyası hazır değil.' USING ERRCODE='40001'; END IF;
 IF h.paket_turu='aylik' THEN PERFORM public.cogniti_token_aylik_donemi_yukle(firma);
 ELSE PERFORM public.cogniti_token_kko_aylik_yukle(firma); END IF;
 toplam:=round(e.fiyat_tl/p_kko_birim); v_kalan:=toplam;
 IF toplam>0 THEN
  INSERT INTO public.cogniti_token_tuketimleri(firma_id,gonderen_turu,gonderen_id,alici_turu,alici_kimligi,islem_turu,kaynak_id,islem_anahtari,miktar)
  VALUES(firma,'firma_kullanicisi',p_auth_id,'firma_kullanicisi',p_auth_id::text,'agora_satin_alma',e.egitim_id,'agora:'||p_auth_id||':'||e.egitim_id,toplam) RETURNING tuketim_id INTO tid;
  FOR y IN SELECT * FROM public.cogniti_token_yuklemeleri WHERE firma_id=firma AND kalan>0
   AND (son_kullanim_at IS NULL OR son_kullanim_at>statement_timestamp())
   ORDER BY son_kullanim_at ASC NULLS LAST,created_at,yukleme_id FOR UPDATE LOOP
   EXIT WHEN v_kalan=0; pay:=least(v_kalan,y.kalan);
   UPDATE public.cogniti_token_yuklemeleri SET kalan=cogniti_token_yuklemeleri.kalan-pay WHERE yukleme_id=y.yukleme_id;
   INSERT INTO public.cogniti_token_tuketim_dagilimlari(firma_id,tuketim_id,yukleme_id,miktar) VALUES(firma,tid,y.yukleme_id,pay);
   v_kalan:=v_kalan-pay;
  END LOOP;
  UPDATE public.cogniti_token_tuketimleri SET asim_miktari=v_kalan WHERE tuketim_id=tid;
  -- Hem aylık hem KKÖ hesabında eksik tutar borçtur; firmalar.aktif değiştirilmez.
  UPDATE public.cogniti_token_hesaplari SET asim_borcu=asim_borcu+v_kalan,updated_at=now() WHERE firma_id=firma;
 END IF;
 INSERT INTO public.agora_siparisleri(firma_id,alici_id,egitim_id,partner_id,partner_egitim_id,egitim_adi,egitim_surumu,
 satin_alma_bedeli,kko_birim_fiyati,token_tutari,borca_yazilan_token,hizmet_bedeli,odenecek_tutar,tuketim_id,paket)
 VALUES(firma,p_auth_id,e.egitim_id,e.partner_id,e.partner_egitim_id,e.egitim_adi,e.surum,e.fiyat_tl,p_kko_birim,toplam,v_kalan,
 round(e.fiyat_tl*0.15,2),e.fiyat_tl-round(e.fiyat_tl*0.15,2),tid,
 jsonb_build_object('bilgiler',e.bilgiler,'kategori',e.kategori,'yayin_araci',e.yayin_araci,'medya',medya)) RETURNING * INTO s;
 RETURN jsonb_build_object('mevcut',false,'siparis_id',s.siparis_id,'token_tutari',toplam,'borca_yazilan_token',v_kalan);
END $f$;
REVOKE ALL ON FUNCTION public.agora_satin_alma_yetki(uuid),public.agora_satin_al(uuid,uuid,integer,numeric,numeric) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_satin_al(uuid,uuid,integer,numeric,numeric) TO service_role;

ALTER TABLE public.agora_vitrin_haftalik_ozet ADD COLUMN IF NOT EXISTS siparis_sayisi bigint;
-- Geçişte mevcut haftanın boş sipariş ölçümü bir kere başlatılır.
UPDATE public.agora_vitrin_haftalik_ozet SET siparis_sayisi=(SELECT count(*) FROM public.agora_siparisleri) WHERE siparis_sayisi IS NULL;
CREATE OR REPLACE FUNCTION public.agora_vitrin_oku(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_hafta date:=(date_trunc('week',now() AT TIME ZONE 'Europe/Istanbul'))::date; ozet jsonb; partnerler jsonb; yayinlar jsonb;
BEGIN
 PERFORM public.agora_vitrin_yetki(p_auth_id);
 INSERT INTO public.agora_vitrin_haftalik_ozet(hafta,partner_sayisi,yayin_sayisi,siparis_sayisi)
 SELECT v_hafta,(SELECT count(*) FROM public.agora_is_partnerleri p JOIN public.agora_partner_profilleri f USING(partner_id) WHERE p.ilk_giris_durumu='onaylandi' AND p.uyelik_durumu='onaylandi'),
 (SELECT count(*) FROM public.agora_yayindaki_egitimler),(SELECT count(*) FROM public.agora_siparisleri)
 ON CONFLICT DO NOTHING;
 SELECT jsonb_build_object('partner_sayisi',s.partner_sayisi,'yayin_sayisi',s.yayin_sayisi,'siparis_sayisi',s.siparis_sayisi,'hafta',s.hafta) INTO ozet
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
   (SELECT count(*) FROM public.agora_siparisleri s WHERE s.egitim_id=y.egitim_id) AS siparis_sayisi,
   e.surum,EXISTS(SELECT 1 FROM public.agora_siparisleri s WHERE s.alici_id=p_auth_id AND s.egitim_id=y.egitim_id) AS satin_alindi
  FROM public.agora_yayindaki_egitimler y JOIN public.agora_partner_egitimleri e USING(egitim_id)
  LEFT JOIN public.agora_vitrin_etkilesimleri i ON i.egitim_id=y.egitim_id AND i.auth_id=p_auth_id
 ) r;
 RETURN jsonb_build_object('stat',ozet,'partnerler',partnerler,'yayinlar',yayinlar);
END;
$f$;


-- Kullanıcının satın aldığı paketler yalnız kendi yayın havuzunda görünür.
CREATE OR REPLACE FUNCTION public.agora_havuz_oku(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE firma uuid;
BEGIN
 firma:=public.agora_satin_alma_yetki(p_auth_id);
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('siparis_id',s.siparis_id,'egitim_adi',s.egitim_adi,
 'partner_egitim_id',s.partner_egitim_id,'yayin_araci',s.paket->>'yayin_araci') ORDER BY s.siparis_tarihi DESC),'[]')
 FROM public.agora_siparisleri s WHERE s.alici_id=p_auth_id AND s.firma_id=firma);
END $f$;

-- Agora lisansları aynı değişmez medya kaynağını farklı üretici taleplerine bağlar.
-- Diğer yüklemelerdeki mevcut tekil dosya kuralı korunur.
DROP INDEX IF EXISTS public.ux_ogrenme_araclari_dosya_yolu;
CREATE UNIQUE INDEX ux_ogrenme_araclari_dosya_yolu ON public.ogrenme_araclari(dosya_yolu)
 WHERE dosya_yolu IS NOT NULL AND NOT (metadata ? 'agora_siparis_id');
CREATE TABLE IF NOT EXISTS public.agora_yayin_hazirliklari (
 istek_id uuid PRIMARY KEY, siparis_id uuid NOT NULL REFERENCES public.agora_siparisleri(siparis_id),
 uretici_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id), hedef text NOT NULL,
 talep_id uuid NOT NULL REFERENCES public.talepler(talep_id), olusturuldu_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agora_yayin_hazirliklari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agora_yayin_hazirliklari FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.agora_yayin_hazirla(p_auth_id uuid,p_siparis_id uuid,p_hedef text,p_istek_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE firma uuid; s public.agora_siparisleri%ROWTYPE; onceki public.agora_yayin_hazirliklari%ROWTYPE;
 k public.kullanicilar%ROWTYPE; b jsonb; m jsonb; sorular jsonb; hedefler text[];
 talep uuid; arac uuid; durum uuid; sonuc jsonb;
BEGIN
 firma:=public.agora_satin_alma_yetki(p_auth_id);
 SELECT * INTO k FROM public.kullanicilar WHERE kullanici_id=p_auth_id;
 IF p_istek_id IS NULL OR p_hedef IS NULL OR p_hedef NOT IN ('utt','bm','eczaci','eczane_teknisyeni','eczaci_ve_eczane_teknisyeni','eczanem')
 OR (lower(k.rol) LIKE 'ik_%' AND p_hedef IN ('eczaci','eczane_teknisyeni','eczaci_ve_eczane_teknisyeni'))
 OR (p_hedef='eczanem' AND lower(k.rol) NOT IN ('pm','jr_pm','kd_pm','med_md')) THEN
  RAISE EXCEPTION 'Bu hedef kitle için yayın hazırlama yetkiniz bulunmuyor.' USING ERRCODE='42501'; END IF;
 SELECT * INTO s FROM public.agora_siparisleri WHERE siparis_id=p_siparis_id AND alici_id=p_auth_id AND firma_id=firma;
 IF NOT FOUND THEN RAISE EXCEPTION 'Satın aldığınız yayın bulunamadı.' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_istek_id::text,71));
 SELECT * INTO onceki FROM public.agora_yayin_hazirliklari WHERE istek_id=p_istek_id;
 IF FOUND THEN
  IF onceki.uretici_id<>p_auth_id OR onceki.siparis_id<>p_siparis_id OR onceki.hedef<>p_hedef THEN
   RAISE EXCEPTION 'Hazırlama isteği değişti.' USING ERRCODE='40001'; END IF;
  RETURN jsonb_build_object('talep_id',onceki.talep_id,'mevcut',true);
 END IF;
 b:=s.paket->'bilgiler'; m:=s.paket->'medya';
 hedefler:=CASE WHEN p_hedef='eczaci_ve_eczane_teknisyeni' THEN ARRAY['eczaci','eczane_teknisyeni'] ELSE ARRAY[p_hedef] END;
 -- Partner taslak biçimini mevcut Cogniti soru seti biçimine dönüştürür.
 SELECT jsonb_agg(jsonb_build_object('soru_metni',q.value->>'soru_metni','secenekler',
  (SELECT jsonb_agg(jsonb_build_object('harf',chr(64+c.sira::integer),'metin',c.value#>>'{}',
  'dogru',c.sira-1=(q.value->>'dogru')::integer) ORDER BY c.sira)
   FROM jsonb_array_elements(q.value->'secenekler') WITH ORDINALITY c(value,sira))) ORDER BY q.sira)
 INTO sorular FROM jsonb_array_elements(b->'soru_taslaklari') WITH ORDINALITY q(value,sira);
 sonuc:=public.talep_atomik_olustur(p_auth_id,p_istek_id,jsonb_build_object(
 'firma_id',firma,'takim_id',k.takim_id,'egitim_turu',b->>'kategori','icerik_turu',s.paket->>'kategori',
 'hedef_roller',to_jsonb(hedefler),'ogrenme_araci_turu',s.paket->>'yayin_araci','urun_adi',s.egitim_adi,
 'aciklama',b->>'aciklama','hazir_video',true,'hazir_soru_seti',true,'hazir_soru_seti_verisi',sorular,
 'soru_seti_buyuklugu',(b->>'soru_seti_buyuklugu')::integer,'secenek_sayisi',(b->>'secenek_sayisi')::integer,
 'video_basi_soru_sayisi',(b->>'yayin_basi_soru')::integer));
 talep:=(sonuc->>'talep_id')::uuid;
 INSERT INTO public.ogrenme_araclari(talep_id,arac_turu,kaynak,dosya_yolu,mime_type,dosya_boyutu,checksum_sha256,sure_saniye,kapak_yolu,metadata,metadata_dogrulandi)
 VALUES(talep,s.paket->>'yayin_araci','hazir',m->>'dosya_yolu',m->>'mime_type',(m->>'dosya_boyutu')::bigint,m->>'checksum_sha256',
 (m->>'sure_saniye')::integer,m->>'kapak_yolu',
 jsonb_build_object('agora_siparis_id',s.siparis_id,'video_dogrulandi',s.paket->>'yayin_araci'='video','kapak_dogrulandi',m->>'kapak_yolu' IS NOT NULL,'transkript',m->'transkript','transkript_metni_dogrulandi',m->'transkript'->>'durum'='onaylandi'),true) RETURNING arac_id INTO arac;
 IF s.paket->>'yayin_araci'='video' THEN
  UPDATE public.talepler SET hazir_video_url=m->>'dosya_yolu' WHERE talep_id=talep;
 END IF;
 INSERT INTO public.ogrenme_araci_durumu(arac_id,durum,degistiren_id,notlar)
 VALUES(arac,'onaylandi',p_auth_id,'Agora satın alınan hazır içerik') RETURNING arac_durum_id INTO durum;
 PERFORM public.uretim_podcast_soru_zinciri_ac(talep,durum,p_auth_id,NULL);
 INSERT INTO public.agora_yayin_hazirliklari(istek_id,siparis_id,uretici_id,hedef,talep_id) VALUES(p_istek_id,s.siparis_id,p_auth_id,p_hedef,talep);
 RETURN jsonb_build_object('talep_id',talep,'mevcut',false);
END $f$;
REVOKE ALL ON FUNCTION public.agora_havuz_oku(uuid),public.agora_yayin_hazirla(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_havuz_oku(uuid),public.agora_yayin_hazirla(uuid,uuid,text,uuid) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_satin_al(uuid,uuid,integer,numeric,numeric)') IS NOT NULL
 AND to_regprocedure('public.agora_yayin_hazirla(uuid,uuid,text,uuid)') IS NOT NULL AS agora_satin_alma_hazir;
