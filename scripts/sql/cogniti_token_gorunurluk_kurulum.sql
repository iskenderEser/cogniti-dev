-- Firma çalışanlarının token raporu; okuma yetkisi sunucuda belirlenir.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_raporu(p_kullanici uuid,p_kapsam text DEFAULT 'kapsam',p_sayfa integer DEFAULT 0,p_arama text DEFAULT '',p_tur text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; h record; b record; kayitlar jsonb; yuklemeler jsonb; v_yonetici boolean; v_kapsam text; v_limit integer:=25; v_toplam bigint;
BEGIN
 IF p_kullanici IS NULL OR p_kapsam IS NULL OR p_kapsam NOT IN ('benim','kapsam') OR length(coalesce(p_arama,''))>100 OR coalesce(p_tur,'') NOT IN ('','yayin','tclub_oneri','cclub_challenge','eclub_oneri','eczanem_musteri','viva_davet') OR p_sayfa IS NULL OR p_sayfa<0 OR p_sayfa>100000 THEN RAISE EXCEPTION 'Geçersiz rapor isteği.' USING ERRCODE='22023'; END IF;
 SELECT k1.kullanici_id,k1.firma_id,k1.rol,k1.takim_id,k1.bolge_id INTO k
 FROM public.kullanicilar k1 JOIN public.firmalar f ON f.firma_id=k1.firma_id AND f.aktif=true
 WHERE k1.kullanici_id=p_kullanici AND k1.aktif_mi=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Kullanıcı veya firma bulunamadı.' USING ERRCODE='42501'; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false); END IF;
 SELECT * INTO b FROM public.cogniti_token_bakiye(k.firma_id);
 v_yonetici:=lower(k.rol) IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm');
 v_kapsam:=CASE WHEN p_kapsam='benim' THEN 'benim' WHEN v_yonetici THEN 'firma' WHEN lower(k.rol)='tm' AND k.takim_id IS NOT NULL THEN 'takim' WHEN lower(k.rol)='bm' AND k.bolge_id IS NOT NULL AND k.takim_id IS NOT NULL THEN 'bolge' ELSE 'benim' END;
 WITH yetkili AS MATERIALIZED (
  SELECT t.tuketim_id,t.created_at,t.islem_turu,t.asim_miktari,t.kaynak_id,t.gonderen_id,
    coalesce(nullif(concat_ws(' ',g.ad,g.soyad),''),nullif(concat_ws(' ',ek.ad,ek.soyad),''),'Kullanıcı bulunamadı') AS gonderen,
    CASE WHEN t.alici_turu='firma_kullanicisi' THEN coalesce(nullif(concat_ws(' ',a.ad,a.soyad),''),'Kullanıcı bulunamadı')
         WHEN t.alici_turu='eclub_kisi' THEN coalesce(nullif(concat_ws(' ',ea.ad,ea.soyad),''),'Kişi bulunamadı')
         WHEN t.alici_turu='eczanem_musteri' THEN coalesce(m.ad_soyad,'Müşteri bulunamadı')
         WHEN t.alici_turu='viva_ozel_davetli' THEN t.alici_kimligi ELSE '—' END AS alici
  FROM public.cogniti_token_tuketimleri t
  LEFT JOIN public.kullanicilar g ON t.gonderen_turu='firma_kullanicisi' AND g.kullanici_id=t.gonderen_id AND g.firma_id=t.firma_id
  LEFT JOIN public.eclub_kisiler ek ON t.gonderen_turu='eclub_kisi' AND ek.kisi_id=t.gonderen_id
  LEFT JOIN public.kullanicilar a ON t.alici_turu='firma_kullanicisi' AND a.kullanici_id::text=t.alici_kimligi
  LEFT JOIN public.eclub_kisiler ea ON t.alici_turu='eclub_kisi' AND ea.kisi_id::text=t.alici_kimligi
  LEFT JOIN public.eczanem_musteriler m ON t.alici_turu='eczanem_musteri' AND m.musteri_id::text=t.alici_kimligi
  WHERE t.firma_id=k.firma_id AND (
   (t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=k.kullanici_id) OR v_kapsam='firma'
   OR (t.gonderen_turu='firma_kullanicisi' AND g.firma_id=k.firma_id AND
     ((v_kapsam='takim' AND g.takim_id=k.takim_id) OR (v_kapsam='bolge' AND g.bolge_id=k.bolge_id AND g.takim_id=k.takim_id)))
   OR (t.gonderen_turu='eclub_kisi' AND v_kapsam IN ('takim','bolge') AND EXISTS (
     SELECT 1 FROM public.eczanem_gonderimler eg
     JOIN public.eclub_eczane_firma ef ON ef.eczane_id=eg.eczane_id AND ef.firma_id=t.firma_id AND ef.aktif_mi=true
     JOIN public.kullanicilar u ON u.kullanici_id=ef.baglayan_utt_id AND u.firma_id=t.firma_id
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
   FROM public.cogniti_token_yuklemeleri y WHERE y.firma_id=k.firma_id ORDER BY y.created_at DESC,y.yukleme_id DESC LIMIT 50) q;
 ELSE yuklemeler:='[]'::jsonb; END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam',v_kapsam,'yonetici',v_yonetici,'paket_turu',h.paket_turu,
  'bakiye',b.net_bakiye,'paket_asimi',b.paket_asimi,'toplam',v_toplam,'kayitlar',kayitlar,'yuklemeler',yuklemeler);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_raporu(uuid,text,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_raporu(uuid,text,integer,text,text) TO service_role;
COMMIT;
SELECT to_regprocedure('public.cogniti_token_raporu(uuid,text,integer,text,text)') IS NOT NULL AS token_raporu_kuruldu;
