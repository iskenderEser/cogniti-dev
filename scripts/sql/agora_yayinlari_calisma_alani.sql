-- Önkoşul: agora_kurulum_tamamlama.sql. Kullanıcı tarafından uygulanır.
BEGIN;
CREATE OR REPLACE FUNCTION public.agora_yayinlarim_oku(p_auth_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
DECLARE firma uuid;
BEGIN
 firma:=public.agora_satin_alma_yetki(p_auth_id);
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object(
 'siparis_id',s.siparis_id,'partner_id',s.partner_id,'sirket_adi',p.sirket_adi,
 'egitim_adi',s.egitim_adi,'partner_egitim_id',s.partner_egitim_id,'kategori',s.paket->>'kategori',
 'yayin_araci',s.paket->>'yayin_araci','siparis_tarihi',s.siparis_tarihi,
 'kapak_video_guid',CASE WHEN s.paket->>'yayin_araci'='video' THEN s.paket->'medya'->>'dosya_yolu' END,
 'kapak_yolu',s.paket->'medya'->>'kapak_yolu',
 'yayin_sayisi',(SELECT count(*) FROM public.agora_yayin_hazirliklari h
 JOIN public.soru_setleri q ON q.talep_id=h.talep_id
 JOIN public.soru_seti_durumu d ON d.soru_seti_id=q.soru_seti_id
 JOIN public.yayin_yonetimi y ON y.soru_seti_durum_id=d.soru_seti_durum_id
 WHERE h.siparis_id=s.siparis_id AND h.uretici_id=p_auth_id),
 'hazirliklar',(SELECT coalesce(jsonb_agg(jsonb_build_object('istek_id',h.istek_id,'talep_id',h.talep_id,'hedef',h.hedef,
 'ayarlandi',EXISTS(SELECT 1 FROM public.ogrenme_araclari a WHERE a.talep_id=h.talep_id AND a.metadata->>'agora_yayin_ayarlari'='true'),
 'egitim_turu',t.egitim_turu,'urun_id',t.urun_id,'teknik_id',t.teknik_id) ORDER BY h.olusturuldu_at DESC),'[]')
 FROM public.agora_yayin_hazirliklari h JOIN public.talepler t ON t.talep_id=h.talep_id
 WHERE h.siparis_id=s.siparis_id AND h.uretici_id=p_auth_id AND t.yayin_oncesi_silme_durumu IS NULL
 AND NOT EXISTS(SELECT 1 FROM public.soru_setleri q JOIN public.soru_seti_durumu d ON d.soru_seti_id=q.soru_seti_id
 JOIN public.yayin_yonetimi y ON y.soru_seti_durum_id=d.soru_seti_durum_id WHERE q.talep_id=h.talep_id))
 ) ORDER BY s.siparis_tarihi DESC),'[]') FROM public.agora_siparisleri s
 JOIN public.agora_partner_profilleri p ON p.partner_id=s.partner_id
 WHERE s.alici_id=p_auth_id AND s.firma_id=firma);
END $f$;

-- Mevcut hazır içerik zincirini kullanır; orijinal medya dosyası çoğaltılmaz.
-- Ayarlar sunucuda ortak üretici kurallarıyla temizlenir, sahiplik ayrıca burada doğrulanır.
CREATE OR REPLACE FUNCTION public.agora_yayin_ayarla(p_auth_id uuid,p_siparis_id uuid,p_hedef text,p_istek_id uuid,p_ayarlar jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE firma uuid; k public.kullanicilar%ROWTYPE; h public.agora_yayin_hazirliklari%ROWTYPE;
 sonuc jsonb; talep uuid; tur text; urun uuid; teknik uuid; hedefler text[]; tekniksiz boolean;
BEGIN
 firma:=public.agora_satin_alma_yetki(p_auth_id);
 SELECT * INTO k FROM public.kullanicilar WHERE kullanici_id=p_auth_id;
 PERFORM 1 FROM public.agora_siparisleri WHERE siparis_id=p_siparis_id AND alici_id=p_auth_id AND firma_id=firma;
 IF NOT FOUND THEN RAISE EXCEPTION 'Satın aldığınız yayın bulunamadı.' USING ERRCODE='42501'; END IF;
 IF p_istek_id IS NULL OR p_hedef IS NULL OR p_hedef NOT IN ('utt','bm','eczaci','eczane_teknisyeni','eczaci_ve_eczane_teknisyeni','eczanem')
 OR (lower(k.rol) LIKE 'ik_%' AND p_hedef IN ('eczaci','eczane_teknisyeni','eczaci_ve_eczane_teknisyeni'))
 OR (p_hedef='eczanem' AND lower(k.rol) NOT IN ('pm','jr_pm','kd_pm','med_md')) THEN
 RAISE EXCEPTION 'Hedef kitleye yetkiniz yok.' USING ERRCODE='42501'; END IF;
 tur:=p_ayarlar->>'egitim_turu'; urun:=(p_ayarlar->>'urun_id')::uuid; teknik:=(p_ayarlar->>'teknik_id')::uuid;
 IF tur IS NULL OR NOT (CASE
 WHEN lower(k.rol) IN ('pm','jr_pm','kd_pm') THEN tur='urun_egitimi'
 WHEN lower(k.rol)='med_md' THEN tur IN ('medikal_egitim','urun_medikal_egitim')
 WHEN lower(k.rol) LIKE 'egt_%' THEN tur IN ('satis_teknikleri','yonetim_egitimi')
 WHEN lower(k.rol) LIKE 'ik_%' THEN tur IN ('ik_egitimi','yonetim_egitimi') ELSE false END)
 THEN RAISE EXCEPTION 'Eğitim türüne yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF lower(k.rol) IN ('pm','jr_pm','kd_pm') AND k.takim_id IS NULL THEN RAISE EXCEPTION 'Takım kaydı eksik.' USING ERRCODE='23514'; END IF;
 IF (tur IN ('urun_egitimi','urun_medikal_egitim') OR p_hedef='eczanem') AND urun IS NULL THEN
 RAISE EXCEPTION 'Ürün seçimi zorunludur.' USING ERRCODE='23514'; END IF;
 tekniksiz:=p_hedef IN ('eczaci','eczane_teknisyeni','eczaci_ve_eczane_teknisyeni','eczanem');
 IF tur='satis_teknikleri' AND NOT tekniksiz AND teknik IS NULL THEN
 RAISE EXCEPTION 'Teknik seçimi zorunludur.' USING ERRCODE='23514'; END IF;
 IF urun IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.urunler WHERE urun_id=urun AND firma_id=firma) THEN
 RAISE EXCEPTION 'Ürün firmanıza ait değil.' USING ERRCODE='42501'; END IF;
 IF teknik IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.teknikler WHERE teknik_id=teknik AND firma_id=firma) THEN
 RAISE EXCEPTION 'Teknik firmanıza ait değil.' USING ERRCODE='42501'; END IF;
 IF tur NOT IN ('urun_egitimi','urun_medikal_egitim','satis_teknikleri') AND p_hedef<>'eczanem' THEN urun:=NULL; END IF;
 IF tur NOT IN ('urun_egitimi','satis_teknikleri') OR tekniksiz THEN teknik:=NULL; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_istek_id::text,71));
 SELECT * INTO h FROM public.agora_yayin_hazirliklari WHERE istek_id=p_istek_id FOR UPDATE;
 IF FOUND THEN
  IF h.uretici_id<>p_auth_id OR h.siparis_id<>p_siparis_id THEN RAISE EXCEPTION 'Hazırlık size ait değil.' USING ERRCODE='42501'; END IF;
  talep:=h.talep_id;
 ELSE
  sonuc:=public.agora_yayin_hazirla(p_auth_id,p_siparis_id,p_hedef,p_istek_id);talep:=(sonuc->>'talep_id')::uuid;
 END IF;
 PERFORM 1 FROM public.talepler WHERE talep_id=talep FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.soru_setleri q JOIN public.soru_seti_durumu d ON d.soru_seti_id=q.soru_seti_id
 JOIN public.yayin_yonetimi y ON y.soru_seti_durum_id=d.soru_seti_durum_id WHERE q.talep_id=talep) THEN
 RAISE EXCEPTION 'Yayımlanmış hazırlık değiştirilemez.' USING ERRCODE='40001'; END IF;
 hedefler:=CASE WHEN p_hedef='eczaci_ve_eczane_teknisyeni' THEN ARRAY['eczaci','eczane_teknisyeni'] ELSE ARRAY[p_hedef] END;
 UPDATE public.talepler SET egitim_turu=tur,icerik_turu=CASE tur WHEN 'urun_egitimi' THEN 'urun' WHEN 'urun_medikal_egitim' THEN 'urun_medikal'
 WHEN 'satis_teknikleri' THEN 'egitim' WHEN 'yonetim_egitimi' THEN 'yonetim' WHEN 'medikal_egitim' THEN 'medikal' ELSE 'ik' END,
 urun_id=urun,teknik_id=teknik,hedef_roller=hedefler WHERE talep_id=talep;
 UPDATE public.agora_yayin_hazirliklari SET hedef=p_hedef WHERE istek_id=p_istek_id;
 UPDATE public.ogrenme_araclari SET metadata=coalesce(metadata,'{}')||'{"agora_yayin_ayarlari":true}'::jsonb WHERE talep_id=talep;
 RETURN jsonb_build_object('talep_id',talep);
END $f$;
REVOKE ALL ON FUNCTION public.agora_yayinlarim_oku(uuid),public.agora_yayin_ayarla(uuid,uuid,text,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.agora_yayinlarim_oku(uuid),public.agora_yayin_ayarla(uuid,uuid,text,uuid,jsonb) TO service_role;
COMMIT;
SELECT to_regprocedure('public.agora_yayinlarim_oku(uuid)') IS NOT NULL
 AND to_regprocedure('public.agora_yayin_ayarla(uuid,uuid,text,uuid,jsonb)') IS NOT NULL AS agora_yayinlari_calisma_alani_hazir;
