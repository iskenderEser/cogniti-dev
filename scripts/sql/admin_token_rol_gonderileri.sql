-- Admin / firma token kullanımı. Salt okunur rapor; tüketim ve bakiye kurallarını değiştirmez.
BEGIN;
CREATE OR REPLACE FUNCTION public.admin_token_gonderi_raporu(
 p_firma uuid, p_yil integer DEFAULT NULL, p_ay integer DEFAULT NULL,
 p_rol text DEFAULT NULL, p_gonderen uuid DEFAULT NULL, p_arac text DEFAULT 'tumu',
 p_sayfa integer DEFAULT 0, p_detay uuid DEFAULT NULL, p_detay_sayfa integer DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_sonuc jsonb;
BEGIN
 IF p_firma IS NULL OR (p_yil IS NOT NULL AND p_yil NOT BETWEEN 2026 AND 2036)
  OR (p_ay IS NOT NULL AND (p_yil IS NULL OR p_ay NOT BETWEEN 1 AND 12))
  OR p_arac IS NULL OR p_arac NOT IN ('tumu','video','podcast','gorsel','flip_pdf','viva','bilinmiyor')
  OR p_sayfa IS NULL OR p_sayfa NOT BETWEEN 0 AND 1000000
  OR p_detay_sayfa IS NULL OR p_detay_sayfa NOT BETWEEN 0 AND 1000000
 THEN RAISE EXCEPTION 'Geçersiz rapor filtresi.' USING ERRCODE='22023'; END IF;
 WITH ham AS MATERIALIZED (
  SELECT t.*, coalesce(nullif(k.rol,''),nullif(ek.rol,''),'bilinmiyor') AS rol,
   coalesce(nullif(trim(concat_ws(' ',k.ad,k.soyad)),''),nullif(trim(concat_ws(' ',ek.ad,ek.soyad)),''),t.gonderen_id::text) AS gonderen,
   coalesce(nullif(trim(concat_ws(' ',ak.ad,ak.soyad)),''),nullif(trim(concat_ws(' ',ae.ad,ae.soyad)),''),nullif(am.ad_soyad,''),t.alici_kimligi) AS alici,
   CASE t.alici_turu WHEN 'eczanem_musteri' THEN 'musteri' WHEN 'viva_ozel_davetli' THEN 'ozel_davetli'
    ELSE coalesce(nullif(ak.rol,''),nullif(ae.rol,''),'bilinmiyor') END AS alici_rol,
   CASE WHEN t.islem_turu='viva_sure' THEN coalesce(j.kapanis,e.bitis,t.created_at) ELSE t.created_at END AS tarih,
   CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN 'viva' ELSE coalesce(y.arac_turu::text,'bilinmiyor') END AS arac,
   y.firma_adi,y.talep_no,y.urun_adi,e.baslik AS etkinlik,
   CASE WHEN t.islem_turu='viva_sure' THEN jsonb_build_object('durum',j.durum,'katilim',j.katilim_sayisi,
    'oturum',j.oturum_sayisi,'kisi_saniye',j.toplam_saniye,'tamamlandi',j.tamamlandi,
    'usd_dakika',j.usd_dakika,'kur',j.kur,'katsayi',j.katsayi,'token_fiyati',j.kko_fiyat) END AS daily,
   -- Aynı işlemin tüm alıcıları aynı transaction zamanını taşır. Tekrar gönderimler birleşmez.
   -- Viva muhasebe kaydındaki alıcı, teknik hesap sahibidir; katılımcı olarak gösterilmez.
   min(t.tuketim_id::text) OVER (PARTITION BY t.gonderen_turu,t.gonderen_id,t.islem_turu,t.kaynak_id,
    CASE WHEN t.islem_turu IN ('viva_sure','viva_davet') THEN NULL ELSE t.created_at END) AS grup_id
  FROM public.cogniti_token_tuketimleri t
  LEFT JOIN public.kullanicilar k ON t.gonderen_turu='firma_kullanicisi' AND k.kullanici_id=t.gonderen_id AND k.firma_id=t.firma_id
  LEFT JOIN public.eclub_kisiler ek ON t.gonderen_turu='eclub_kisi' AND ek.kisi_id=t.gonderen_id
  LEFT JOIN public.kullanicilar ak ON t.alici_turu='firma_kullanicisi' AND ak.kullanici_id::text=t.alici_kimligi AND ak.firma_id=t.firma_id
  LEFT JOIN public.eclub_kisiler ae ON t.alici_turu='eclub_kisi' AND ae.kisi_id::text=t.alici_kimligi
  LEFT JOIN public.eczanem_musteriler am ON t.alici_turu='eczanem_musteri' AND am.musteri_id::text=t.alici_kimligi
  LEFT JOIN public.viva_etkinlikler e ON t.islem_turu IN ('viva_sure','viva_davet') AND e.etkinlik_id=t.kaynak_id AND e.firma_id=t.firma_id
  LEFT JOIN public.cogniti_viva_tuketim_isleri j ON j.etkinlik_id=e.etkinlik_id AND j.firma_id=t.firma_id
  LEFT JOIN LATERAL (SELECT v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu FROM public.v_yayin_detay v
   WHERE t.islem_turu NOT IN ('viva_sure','viva_davet') AND v.yayin_id=t.kaynak_id AND v.firma_id=t.firma_id
   ORDER BY v.firma_adi,v.talep_no,v.urun_adi,v.arac_turu LIMIT 1) y ON true
  WHERE t.firma_id=p_firma
 ), donem AS MATERIALIZED (
  SELECT * FROM ham WHERE p_yil IS NULL OR (tarih >= make_date(p_yil,coalesce(p_ay,1),1)::timestamp AT TIME ZONE 'Europe/Istanbul'
   AND tarih < (make_date(p_yil,coalesce(p_ay,1),1)::timestamp + CASE WHEN p_ay IS NULL THEN interval '1 year' ELSE interval '1 month' END) AT TIME ZONE 'Europe/Istanbul')
 ), roller AS (
  SELECT rol,sum(miktar) AS token,sum(asim_miktari) AS asim,count(DISTINCT grup_id) AS gonderi FROM donem GROUP BY rol
 ), gruplar AS MATERIALIZED (
  SELECT grup_id AS id,rol,gonderen_id,gonderen,min(tarih) AS tarih,max(created_at) AS kayit_tarihi,
   islem_turu,kaynak_id,arac,firma_adi,talep_no,urun_adi,etkinlik,
   CASE WHEN islem_turu='viva_sure' THEN NULL ELSE count(DISTINCT (alici_turu,alici_kimligi)) END AS alici_sayisi,
   CASE WHEN islem_turu='viva_sure' THEN '[]'::jsonb ELSE to_jsonb(array_agg(DISTINCT alici_rol ORDER BY alici_rol)) END AS alici_roller,
   sum(miktar) AS token,sum(asim_miktari) AS asim,(array_agg(daily))[1] AS daily
  FROM donem WHERE (p_rol IS NULL OR rol=p_rol)
   AND (p_gonderen IS NULL OR gonderen_id=p_gonderen) AND (p_arac='tumu' OR arac=p_arac)
  GROUP BY grup_id,rol,gonderen_id,gonderen,islem_turu,kaynak_id,arac,firma_adi,talep_no,urun_adi,etkinlik
 ), sayfa AS (
  SELECT * FROM gruplar ORDER BY tarih DESC,id LIMIT 50 OFFSET p_sayfa::bigint*50
 ), detay AS (
  SELECT h.* FROM donem h JOIN gruplar g ON g.id=h.grup_id WHERE g.id=p_detay::text AND h.islem_turu<>'viva_sure'
  ORDER BY h.created_at,h.tuketim_id LIMIT 50 OFFSET p_detay_sayfa::bigint*50
 )
 SELECT jsonb_build_object(
  'roller',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY token DESC,rol) FROM roller r),'[]'::jsonb),
  'gonderenler',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.ad,s.id) FROM (
   SELECT DISTINCT gonderen_id AS id,gonderen AS ad FROM donem WHERE p_rol IS NULL OR rol=p_rol) s),'[]'::jsonb),
  'satirlar',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY tarih DESC,id) FROM sayfa s),'[]'::jsonb),
  'kayit_sayisi',(SELECT count(*) FROM gruplar),
  'toplam',(SELECT jsonb_build_object('token',coalesce(sum(miktar),0),'asim',coalesce(sum(asim_miktari),0)) FROM donem),
  'genel_toplam',(SELECT jsonb_build_object('token',coalesce(sum(miktar),0),'asim',coalesce(sum(asim_miktari),0)) FROM ham),
  'liste_toplam',(SELECT jsonb_build_object('token',coalesce(sum(token),0),'asim',coalesce(sum(asim),0)) FROM gruplar),
  'detay',coalesce((SELECT jsonb_agg(jsonb_build_object('id',tuketim_id,'alici',alici,'alici_rol',alici_rol,
   'kimlik',alici_kimligi,'tarih',created_at,'token',miktar,'asim',asim_miktari) ORDER BY created_at,tuketim_id) FROM detay),'[]'::jsonb),
  'detay_sayisi',(SELECT count(*) FROM donem h JOIN gruplar g ON g.id=h.grup_id WHERE g.id=p_detay::text AND h.islem_turu<>'viva_sure')
 ) INTO v_sonuc;
 RETURN v_sonuc;
END $$;
REVOKE ALL ON FUNCTION public.admin_token_gonderi_raporu(uuid,integer,integer,text,uuid,text,integer,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_token_gonderi_raporu(uuid,integer,integer,text,uuid,text,integer,uuid,integer) TO service_role;
COMMIT;
SELECT true AS admin_token_rol_gonderileri_hazir;
