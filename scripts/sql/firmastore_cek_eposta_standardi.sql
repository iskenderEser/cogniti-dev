-- Süreç 12: FirmaStore hediye çeki teslim e-postası şablon standardizasyonu.
-- Kullanıcı çalıştırır. Mevcut tablo ve kayıtları değiştirmez; yalnız store_admin_firma_talep_islem fonksiyonunu günceller.
BEGIN;

CREATE OR REPLACE FUNCTION public.store_admin_firma_talep_islem(
 p_firma uuid,p_siparis uuid,p_admin uuid,p_islem text,p_not text DEFAULT NULL,p_kodlar jsonb DEFAULT NULL,p_from text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $fn$
DECLARE s public.store_siparisler%ROWTYPE;v_sahip uuid;r record;sonuc record;v_ad text;v_eposta text;v_firma text;v_urun text;v_hitap text;v_tl_metni text;v_parantez text;v_icerik text;v_html_liste text;v_link_var boolean;v_kapanis text;v_kapanis_html text;v_html text;v_once text;e public.store_cek_eposta_kuyrugu%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin AND rol='admin') THEN RAISE EXCEPTION 'Admin yetkisi gerekli.' USING ERRCODE='42501';END IF;
 SELECT kullanici_id INTO v_sahip FROM public.store_siparisler WHERE siparis_id=p_siparis AND firma_id=p_firma;
 IF NOT FOUND THEN RAISE EXCEPTION 'Talep seçili firmaya ait değil.' USING ERRCODE='P0002';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('hbstore:siparis:'||v_sahip::text,0));
 SELECT * INTO s FROM public.store_siparisler WHERE siparis_id=p_siparis AND firma_id=p_firma FOR UPDATE;
 IF NOT FOUND OR NOT public.store_admin_kuyrukta_mi(s.created_at,s.durum,s.guncellenme_at,clock_timestamp()) THEN RAISE EXCEPTION 'Talep admin işlemine açık değil.' USING ERRCODE='22023';END IF;
 v_once:=s.durum;
 IF p_islem='hazirla' THEN
  IF s.durum IN('hazirlaniyor','kargoda') THEN RETURN jsonb_build_object('ok',true);END IF;
  IF s.durum<>'beklemede' THEN RAISE EXCEPTION 'Yalnız bekleyen talep hazırlanabilir.' USING ERRCODE='22023';END IF;
  UPDATE public.store_siparisler SET durum='hazirlaniyor',guncellenme_at=clock_timestamp() WHERE siparis_id=p_siparis;
 ELSIF p_islem='iptal' THEN
  IF nullif(btrim(p_not),'') IS NULL THEN RAISE EXCEPTION 'İptal nedeni zorunludur.' USING ERRCODE='22023';END IF;
  SELECT * INTO sonuc FROM public.store_siparis_iptal(p_siparis,p_admin,true,p_not);
  IF sonuc.ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%',sonuc.hata USING ERRCODE='22023';END IF;
 ELSIF p_islem='teslim' THEN
  IF jsonb_typeof(p_kodlar) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Çek kodları gerekli.' USING ERRCODE='22023';END IF;
  IF jsonb_array_length(p_kodlar)<>s.adet OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_kodlar) x WHERE jsonb_typeof(x)<>'object' OR (coalesce(x->>'cek_kodu','') !~ '^[A-Za-z0-9][A-Za-z0-9 _./-]*$' OR length(x->>'cek_kodu')>512) OR (nullif(x->>'kullanim_linki','') IS NOT NULL AND (length(x->>'kullanim_linki')>2048 OR x->>'kullanim_linki' !~ '^https://[^[:space:]<>]+$'))) THEN RAISE EXCEPTION 'Her adet için geçerli alfanümerik kod ve varsa HTTPS bağlantısı girin.' USING ERRCODE='22023';END IF;
  IF (SELECT count(DISTINCT lower(btrim(x->>'cek_kodu'))) FROM jsonb_array_elements(p_kodlar)x)<>s.adet THEN RAISE EXCEPTION 'Aynı kod iki kez kullanılamaz.' USING ERRCODE='22023';END IF;
  IF s.durum='teslim_edildi' THEN
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_kodlar) WITH ORDINALITY x(veri,sira) WHERE NOT EXISTS(SELECT 1 FROM public.store_cek_teslimleri t WHERE t.siparis_id=p_siparis AND t.sira=x.sira AND t.cek_kodu=x.veri->>'cek_kodu' AND coalesce(t.kullanim_linki,'')=coalesce(x.veri->>'kullanim_linki',''))) THEN RAISE EXCEPTION 'Teslim edilmiş kodlar değiştirilemez.' USING ERRCODE='22023';END IF;
    RETURN jsonb_build_object('ok',true);
  END IF;
  IF s.durum NOT IN('hazirlaniyor','kargoda') THEN RAISE EXCEPTION 'Önce talebi hazırlamaya alın.' USING ERRCODE='22023';END IF;
  INSERT INTO public.store_cek_teslimleri(firma_id,siparis_id,kullanici_id,urun_id,sira,cek_kodu,kullanim_linki,teslim_eden)
   SELECT p_firma,p_siparis,s.kullanici_id,s.urun_id,x.sira,x.veri->>'cek_kodu',nullif(x.veri->>'kullanim_linki',''),p_admin FROM jsonb_array_elements(p_kodlar) WITH ORDINALITY x(veri,sira);
  UPDATE public.store_siparisler SET durum='teslim_edildi',teslim_alma_at=clock_timestamp(),guncellenme_at=clock_timestamp() WHERE siparis_id=p_siparis;
  SELECT btrim(concat_ws(' ',ad,soyad)),eposta INTO v_ad,v_eposta FROM public.kullanicilar WHERE kullanici_id=s.kullanici_id;
  SELECT coalesce(nullif(btrim(firma_adi),''),'Firma') INTO v_firma FROM public.firmalar WHERE firma_id=p_firma;
  SELECT coalesce(nullif(btrim(ad),''),'Hediye Çeki') INTO v_urun FROM public.store_urunler WHERE urun_id=s.urun_id;
  v_hitap:=CASE WHEN coalesce(v_ad,'')<>'' THEN 'Sayın '||v_ad||',' ELSE 'Sayın Kullanıcımız,' END;
  v_tl_metni:=CASE WHEN s.toplam_tl IS NULL THEN NULL WHEN s.toplam_tl=trunc(s.toplam_tl) THEN trunc(s.toplam_tl)::text||' TL' ELSE replace(s.toplam_tl::text,'.',',')||' TL' END;
  v_parantez:=s.adet::text||' adet'||CASE WHEN v_tl_metni IS NULL THEN '' ELSE ' · '||v_tl_metni END;
  SELECT string_agg('- Çek kodunuz: '||t.cek_kodu||CASE WHEN t.kullanim_linki IS NULL THEN '' ELSE E'\n- Kullanım bağlantısı: '||t.kullanim_linki END,E'\n\n' ORDER BY t.sira),
         string_agg('<li style="margin: 0 0 '||CASE WHEN t.kullanim_linki IS NULL THEN '6' ELSE '4' END||'px 0;"><strong>Çek kodunuz:</strong> '||replace(replace(replace(replace(replace(t.cek_kodu,'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')||'</li>'||CASE WHEN t.kullanim_linki IS NULL THEN '' ELSE '<li style="margin: 0 0 8px 0;"><strong>Kullanım bağlantısı:</strong> <a href="'||replace(replace(replace(replace(replace(t.kullanim_linki,'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')||'" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">Hediye çekini kullan</a> ('||replace(replace(replace(replace(replace(t.kullanim_linki,'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')||')</li>' END,'' ORDER BY t.sira),
         bool_or(t.kullanim_linki IS NOT NULL)
    INTO v_icerik,v_html_liste,v_link_var
    FROM public.store_cek_teslimleri t WHERE t.siparis_id=p_siparis;
  v_kapanis:=CASE WHEN coalesce(v_link_var,false) THEN 'Çek kodunuzu ve kullanım bağlantısını Cogniti içindeki Taleplerim ekranından da görebilirsiniz.' ELSE 'Çek kodunuzu Cogniti içindeki Taleplerim ekranından da görebilirsiniz.' END;
  v_kapanis_html:=CASE WHEN coalesce(v_link_var,false) THEN 'Çek kodunuzu ve kullanım bağlantısını Cogniti içindeki <strong>Taleplerim</strong> ekranından da görebilirsiniz.' ELSE 'Çek kodunuzu Cogniti içindeki <strong>Taleplerim</strong> ekranından da görebilirsiniz.' END;
  v_html:='<p style="margin: 0 0 16px 0;">'||replace(replace(replace(replace(replace(v_hitap,'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')||'</p>'
    ||'<p style="margin: 0 0 16px 0;">'||replace(replace(replace(replace(replace(v_firma,'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')||' FirmaStore kapsamındaki <strong>'||replace(replace(replace(replace(replace(v_urun,'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')||'</strong> (<strong>'||replace(replace(replace(replace(replace(v_parantez,'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')||'</strong>) talebiniz tamamlanmıştır.</p>'
    ||'<ul style="margin: 0 0 16px 0; padding-left: 20px;">'||coalesce(v_html_liste,'')||'</ul>'
    ||'<p style="margin: 0 0 16px 0;">'||v_kapanis_html||'</p>'
    ||'<p style="margin: 0;">Cogniti · bilgi taşır</p>';
  INSERT INTO public.store_cek_eposta_kuyrugu(firma_id,siparis_id,kullanici_id,govde)
   VALUES(p_firma,p_siparis,s.kullanici_id,jsonb_build_object(
    'from',nullif(p_from,''),
    'to',jsonb_build_array(v_eposta),
    'subject','FirmaStore Hediye Çekiniz Hazır',
    'html',v_html,
    'text',v_hitap||E'\n\n'||v_firma||' FirmaStore kapsamındaki '||v_urun||' ('||v_parantez||') talebiniz tamamlanmıştır.'||E'\n\n'||coalesce(v_icerik,'')||E'\n\n'||v_kapanis||E'\n\nCogniti · bilgi taşır'
   ));
 ELSIF p_islem='eposta_yeniden' THEN
  SELECT * INTO e FROM public.store_cek_eposta_kuyrugu WHERE siparis_id=p_siparis AND firma_id=p_firma FOR UPDATE;
  IF NOT FOUND OR e.durum IN('gonderildi','isleniyor') OR (e.ilk_deneme_at IS NOT NULL AND e.ilk_deneme_at<clock_timestamp()-interval '23 hours') THEN RAISE EXCEPTION 'Gönderim tekrar denenemez; sağlayıcı durumunu kontrol edin.' USING ERRCODE='22023';END IF;
  IF e.ilk_deneme_at IS NULL THEN
   SELECT eposta INTO v_eposta FROM public.kullanicilar WHERE kullanici_id=s.kullanici_id;
   UPDATE public.store_cek_eposta_kuyrugu SET govde=jsonb_set(govde,'{to}',jsonb_build_array(v_eposta)) WHERE is_id=e.is_id;
  END IF;
  UPDATE public.store_cek_eposta_kuyrugu SET durum='bekliyor',sonraki_at=clock_timestamp(),hata_kodu=NULL,deneme=0 WHERE is_id=e.is_id;
 ELSE RAISE EXCEPTION 'Geçersiz işlem.' USING ERRCODE='22023';END IF;
 INSERT INTO public.store_talep_islem_gecmisi(firma_id,siparis_id,islem,onceki_durum,sonraki_durum,aciklama,yapan_id)
 SELECT p_firma,p_siparis,p_islem,v_once,durum,left(p_not,2000),p_admin FROM public.store_siparisler WHERE siparis_id=p_siparis;
 RETURN jsonb_build_object('ok',true);
END;$fn$;

REVOKE ALL ON FUNCTION public.store_admin_firma_talep_islem(uuid,uuid,uuid,text,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.store_admin_firma_talep_islem(uuid,uuid,uuid,text,text,jsonb,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
