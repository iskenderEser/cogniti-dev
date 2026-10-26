-- KULLANICI ÇALIŞTIRACAK. Ajan canlı veritabanına bağlanmaz.
-- 26.10.2026 onaylı Viva davet matrisi. Tablo veya kullanıcı verisi değiştirmez.
-- Ön koşul: Viva aşama 1 ve anlık planlama kurulumu.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-davet-kapsami'));

CREATE OR REPLACE FUNCTION public.viva_ic_kapsam(p_sahip uuid,p_hedef uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(
  SELECT 1 FROM kullanicilar s JOIN kullanicilar h ON h.kullanici_id=p_hedef
  WHERE s.kullanici_id=p_sahip AND viva_duzenleyen_aktif(s.kullanici_id)
  AND h.aktif_mi IS TRUE AND s.firma_id IS NOT DISTINCT FROM h.firma_id
  AND (s.kullanici_id=h.kullanici_id OR CASE
   -- Admin/İÜ ve firmasız platform ekibinin mevcut kapsamı korunur.
   WHEN s.firma_id IS NULL THEN true
   WHEN s.rol IN ('utt','kd_utt') THEN s.bolge_id IS NOT NULL
    AND h.bolge_id=s.bolge_id AND h.rol IN ('utt','kd_utt','bm')
   ELSE true END)
 )
$$;

CREATE OR REPLACE FUNCTION public.viva_eclub_kapsam(p_sahip uuid,p_kisi uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(
  SELECT 1 FROM kullanicilar s
  JOIN firmalar f ON f.firma_id=s.firma_id AND f.aktif AND f.eclub_aktif
  JOIN eclub_eczane_firma ef ON ef.firma_id=f.firma_id AND ef.aktif_mi
  JOIN eclub_kisi_eczane ke ON ke.eczane_id=ef.eczane_id AND ke.aktif_mi
  JOIN eclub_kisiler ek ON ek.kisi_id=ke.kisi_id
  LEFT JOIN bolgeler sb ON sb.bolge_id=s.bolge_id
  LEFT JOIN eclub_utt_eczane ue ON ue.eczane_firma_id=ef.id AND ue.aktif_mi
  LEFT JOIN kullanicilar u ON u.kullanici_id=ue.utt_id AND u.aktif_mi
   AND u.firma_id=f.firma_id
  LEFT JOIN bolgeler ub ON ub.bolge_id=u.bolge_id
  WHERE s.kullanici_id=p_sahip AND s.aktif_mi IS TRUE AND ek.kisi_id=p_kisi
  AND CASE
   WHEN s.rol IN ('utt','kd_utt') THEN u.kullanici_id=s.kullanici_id
   WHEN s.rol='bm' THEN s.bolge_id IS NOT NULL AND u.bolge_id=s.bolge_id
   WHEN s.rol IN ('tm','pm','jr_pm','kd_pm') THEN coalesce(sb.takim_id,s.takim_id) IS NOT NULL
    AND coalesce(ub.takim_id,u.takim_id)=coalesce(sb.takim_id,s.takim_id)
   WHEN s.rol IN ('med_md','egt_md','egt_yrd_md','egt_yon','egt_uz',
    'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm') THEN true
   WHEN s.rol IN ('admin','iu') THEN u.kullanici_id IS NOT NULL
    AND viva_ic_kapsam(s.kullanici_id,u.kullanici_id)
   -- İK dahil diğer roller için E-Club davet yetkisi verilmez.
   ELSE false END
 )
$$;

-- Ayrı bağlam RPC'si: mevcut oluştur/kaydet/sürüm/misafir akışı değiştirilmez.
-- Kişi listesi ve kayıttaki doğrulama aynı iki kapsam fonksiyonunu kullanır.
CREATE OR REPLACE FUNCTION public.viva_davet_baglami(p_auth uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s kullanicilar%ROWTYPE; eclub_acik boolean;
BEGIN
 SELECT * INTO s FROM kullanicilar WHERE kullanici_id=p_auth AND viva_duzenleyen_aktif(p_auth);
 IF NOT FOUND THEN
  RETURN viva_islem(p_auth,'baglam','{}'::jsonb)
   || jsonb_build_object('eclub_davet_edebilir',false,'davet_kurali_surumu',1);
 END IF;
 SELECT EXISTS(SELECT 1 FROM firmalar f WHERE f.firma_id=s.firma_id AND f.aktif AND f.eclub_aktif)
  AND s.rol IN ('utt','kd_utt','bm','tm','pm','jr_pm','kd_pm','med_md',
   'egt_md','egt_yrd_md','egt_yon','egt_uz','gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','admin','iu')
 INTO eclub_acik;
 RETURN jsonb_build_object('olusturabilir',true,'davet_kurali_surumu',1,
  'eclub_davet_edebilir',eclub_acik,
  'kapsam',CASE WHEN s.firma_id IS NULL THEN 'Cogniti platform ekibi'
   WHEN s.rol IN ('utt','kd_utt') THEN 'Kendi bölgenizdeki temsilciler ve BM'
   ELSE 'Kendi firmanız' END,
  'kisiler',viva_kisiler(p_auth));
END
$$;

REVOKE ALL ON FUNCTION public.viva_ic_kapsam(uuid,uuid),public.viva_eclub_kapsam(uuid,uuid),
 public.viva_davet_baglami(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_ic_kapsam(uuid,uuid),public.viva_eclub_kapsam(uuid,uuid),
 public.viva_davet_baglami(uuid) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT to_regprocedure('public.viva_davet_baglami(uuid)') IS NOT NULL AS davet_fonksiyonu,
 NOT has_function_privilege('anon','public.viva_davet_baglami(uuid)','EXECUTE') AS anon_kapali,
 NOT has_function_privilege('authenticated','public.viva_davet_baglami(uuid)','EXECUTE') AS istemci_kapali,
 has_function_privilege('service_role','public.viva_davet_baglami(uuid)','EXECUTE') AS sunucu_acik;
