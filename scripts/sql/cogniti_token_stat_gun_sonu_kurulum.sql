BEGIN;
-- UTT stat kartları: Türkiye saatine göre dünün sonundaki değerler.
-- Salt okunur hesaplama; gönderim/tüketim/cron işlevleri değişmez.

CREATE OR REPLACE FUNCTION public.cogniti_token_gun_sonu(
 p_kullanici uuid, p_an timestamptz DEFAULT statement_timestamp()
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; h record; v_sinir timestamptz; v_limit bigint; v_kalan bigint; v_kendi bigint;
BEGIN
 IF p_an IS NULL THEN RAISE EXCEPTION 'Ölçüm zamanı eksik.' USING ERRCODE='22023'; END IF;
 SELECT u.kullanici_id,u.firma_id INTO k FROM public.kullanicilar u
 JOIN public.firmalar f ON f.firma_id=u.firma_id AND f.aktif=true
 WHERE u.kullanici_id=p_kullanici AND u.aktif_mi=true AND lower(u.rol) IN ('utt','kd_utt');
 IF NOT FOUND THEN RAISE EXCEPTION 'Token özetine erişiminiz bulunmuyor.' USING ERRCODE='42501'; END IF;
 v_sinir:=date_trunc('day',p_an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id;
 IF NOT FOUND OR h.created_at>=v_sinir THEN
  RETURN jsonb_build_object('veri_tarihi',(v_sinir AT TIME ZONE 'Europe/Istanbul')::date-1,'hazir',false);
 END IF;
 IF h.paket_turu='kullandigin_kadar_ode' THEN v_limit:=1500;
 ELSE
  SELECT y.miktar INTO v_limit FROM public.cogniti_token_yuklemeleri y
  WHERE y.firma_id=k.firma_id AND y.yukleme_turu='aylik_paket' AND y.created_at<v_sinir
  ORDER BY y.donem_yil DESC,y.donem_ay DESC,y.created_at DESC,y.yukleme_id DESC LIMIT 1;
 END IF;
 -- Kalan kolonları bugün de değişir. Bugünkü dağılım ve KKÖ sıfırlamalarını
 -- geri ekleyerek her yüklemenin dün sonundaki kalanını buluruz.
 -- Yüklemede mahsup edilen borç = miktar - kalan - dağılımlar - sıfırlamalar.
 WITH dagilim AS (
  SELECT d.yukleme_id,sum(d.miktar)::bigint AS tum,
   coalesce(sum(d.miktar) FILTER(WHERE t.created_at>=v_sinir),0)::bigint AS sonra
  FROM public.cogniti_token_tuketim_dagilimlari d
  JOIN public.cogniti_token_tuketimleri t ON t.tuketim_id=d.tuketim_id AND t.firma_id=d.firma_id
  WHERE d.firma_id=k.firma_id GROUP BY d.yukleme_id
 ), sifirlama AS (
  SELECT s.yukleme_id,sum(s.sifirlanan-s.sonradan_tuketilen)::bigint AS tum,
   coalesce(sum(s.sifirlanan-s.sonradan_tuketilen) FILTER(WHERE s.created_at>=v_sinir),0)::bigint AS sonra
  FROM public.cogniti_token_kko_devir_kayitlari s WHERE s.firma_id=k.firma_id GROUP BY s.yukleme_id
 ), yukleme AS (
  SELECT y.*,coalesce(d.tum,0) AS dagitilan,coalesce(s.tum,0) AS sifirlanan,
   y.kalan+coalesce(d.sonra,0)+coalesce(s.sonra,0) AS dun_kalan
  FROM public.cogniti_token_yuklemeleri y
  LEFT JOIN dagilim d ON d.yukleme_id=y.yukleme_id
  LEFT JOIN sifirlama s ON s.yukleme_id=y.yukleme_id WHERE y.firma_id=k.firma_id
 )
 SELECT coalesce(sum(y.dun_kalan) FILTER(WHERE y.created_at<v_sinir
    AND (y.son_kullanim_at IS NULL OR y.son_kullanim_at>=v_sinir)),0)
  - h.asim_borcu
  + (SELECT coalesce(sum(t.asim_miktari),0) FROM public.cogniti_token_tuketimleri t WHERE t.firma_id=k.firma_id AND t.created_at>=v_sinir AND (h.paket_turu='aylik' OR t.islem_turu<>'viva_sure'))
  - coalesce(sum(y.miktar-y.kalan-y.dagitilan-y.sifirlanan) FILTER(WHERE y.created_at>=v_sinir),0)
 INTO v_kalan FROM yukleme y;
 SELECT coalesce(sum(t.miktar),0) INTO v_kendi FROM public.cogniti_token_tuketimleri t
 WHERE t.firma_id=k.firma_id AND t.gonderen_turu='firma_kullanicisi'
  AND t.gonderen_id=k.kullanici_id AND t.created_at<v_sinir;
 RETURN jsonb_build_object('hazir',true,'veri_tarihi',(v_sinir AT TIME ZONE 'Europe/Istanbul')::date-1,
  'plan_limiti',v_limit,'kalan_token',v_kalan,'kullandigim_token',v_kendi);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_gun_sonu(uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_gun_sonu(uuid,timestamptz) TO service_role;

-- Kaldırılan hareket listesine ait filtreli RPC imzasını temizler; tüketim verileri korunur.
DROP FUNCTION IF EXISTS public.cogniti_token_raporu(uuid,text,integer,text,text);
CREATE OR REPLACE FUNCTION public.cogniti_token_raporu(p_kullanici uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k record; h record; b record; yuklemeler jsonb; v_yonetici boolean; v_kapsam text; v_toplam bigint;
BEGIN
 IF p_kullanici IS NULL THEN RAISE EXCEPTION 'Geçersiz rapor isteği.' USING ERRCODE='22023'; END IF;
 SELECT k1.kullanici_id,k1.firma_id,k1.rol,k1.takim_id,k1.bolge_id INTO k
 FROM public.kullanicilar k1 JOIN public.firmalar f ON f.firma_id=k1.firma_id AND f.aktif=true
 WHERE k1.kullanici_id=p_kullanici AND k1.aktif_mi=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Kullanıcı veya firma bulunamadı.' USING ERRCODE='42501'; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=k.firma_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('hesap_var',false); END IF;
 SELECT * INTO b FROM public.cogniti_token_bakiye(k.firma_id);
 v_yonetici:=lower(k.rol) IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm');
 v_kapsam:=CASE WHEN v_yonetici THEN 'firma' WHEN lower(k.rol)='tm' AND k.takim_id IS NOT NULL THEN 'takim' WHEN lower(k.rol)='bm' AND k.bolge_id IS NOT NULL AND k.takim_id IS NOT NULL THEN 'bolge' ELSE 'benim' END;
 SELECT coalesce(sum(t.miktar),0)::bigint INTO v_toplam
  FROM public.cogniti_token_tuketimleri t
  LEFT JOIN public.kullanicilar g ON t.gonderen_turu='firma_kullanicisi' AND g.kullanici_id=t.gonderen_id AND g.firma_id=t.firma_id
  WHERE t.firma_id=k.firma_id AND (
   (t.gonderen_turu='firma_kullanicisi' AND t.gonderen_id=k.kullanici_id) OR v_kapsam='firma'
   OR (t.gonderen_turu='firma_kullanicisi' AND g.firma_id=k.firma_id AND
     ((v_kapsam='takim' AND g.takim_id=k.takim_id) OR (v_kapsam='bolge' AND g.bolge_id=k.bolge_id AND g.takim_id=k.takim_id)))
   OR (t.gonderen_turu='eclub_kisi' AND v_kapsam IN ('takim','bolge') AND EXISTS (
     SELECT 1 FROM public.eczanem_gonderimler eg
     JOIN public.eclub_eczane_firma ef ON ef.eczane_id=eg.eczane_id AND ef.firma_id=t.firma_id AND ef.aktif_mi=true
     JOIN public.kullanicilar u ON u.kullanici_id=ef.baglayan_utt_id AND u.firma_id=t.firma_id
     WHERE t.islem_anahtari='eczanem-gonderim:'||eg.gonderim_id::text AND
      ((v_kapsam='takim' AND u.takim_id=k.takim_id) OR (v_kapsam='bolge' AND u.takim_id=k.takim_id AND u.bolge_id=k.bolge_id)))));
 IF v_yonetici THEN
  SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.created_at DESC),'[]'::jsonb) INTO yuklemeler FROM (
   SELECT y.miktar,y.kalan,y.yukleme_turu,y.donem_yil,y.donem_ay,y.son_kullanim_at,y.created_at,
    (y.son_kullanim_at IS NOT NULL AND y.son_kullanim_at<=statement_timestamp()) AS suresi_doldu
   FROM public.cogniti_token_yuklemeleri y WHERE y.firma_id=k.firma_id ORDER BY y.created_at DESC,y.yukleme_id DESC LIMIT 50) q;
 ELSE yuklemeler:='[]'::jsonb; END IF;
 RETURN jsonb_build_object('hesap_var',true,'kapsam',v_kapsam,'yonetici',v_yonetici,'paket_turu',h.paket_turu,
  'bakiye',b.net_bakiye,'paket_asimi',b.paket_asimi,'toplam',v_toplam,'yuklemeler',yuklemeler,
  'gun_sonu',CASE WHEN lower(k.rol) IN ('utt','kd_utt') THEN public.cogniti_token_gun_sonu(p_kullanici) ELSE NULL END);
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_raporu(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_raporu(uuid) TO service_role;
COMMIT;
