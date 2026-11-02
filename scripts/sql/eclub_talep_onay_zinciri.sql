-- Adım 5: UTT -> BM -> TM -> Admin. Merkezi talep tutarı/sürümü değişmez.
-- Mevcut ürün siparişi/depo onayları ve teslimat kanalları korunur.
BEGIN;
ALTER TABLE public.eclub_store_cek_talepleri ADD COLUMN IF NOT EXISTS utt_onay_tarihi timestamptz;

CREATE OR REPLACE FUNCTION public.eclub_store_onay_adimi(p_yapan uuid,p_idler uuid[],p_adim text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE
 v_yapan public.kullanicilar%ROWTYPE;
 v_t public.eclub_store_cek_talepleri%ROWTYPE;
 v_hedefler uuid[]; v_hedef uuid; v_beklenen text; v_sonraki text; v_adet integer; v_n integer;
BEGIN
 IF p_adim IS NULL OR p_adim NOT IN ('utt','bm','tm') OR p_idler IS NULL
 OR cardinality(p_idler)<1 OR cardinality(p_idler)>100 OR array_position(p_idler,NULL) IS NOT NULL
 OR (SELECT count(DISTINCT id) FROM unnest(p_idler) id)<>cardinality(p_idler) THEN
  RAISE EXCEPTION '1–100 farklı ve geçerli talep seçin.' USING ERRCODE='22023';
 END IF;
 SELECT * INTO v_yapan FROM public.kullanicilar WHERE kullanici_id=p_yapan FOR SHARE;
 IF v_yapan.kullanici_id IS NULL OR v_yapan.aktif_mi IS NOT TRUE OR v_yapan.firma_id IS NULL
 OR v_yapan.takim_id IS NULL OR (p_adim IN ('utt','bm') AND v_yapan.bolge_id IS NULL)
 OR (p_adim='utt' AND lower(coalesce(v_yapan.rol,'')) NOT IN ('utt','kd_utt'))
 OR (p_adim IN ('bm','tm') AND lower(v_yapan.rol) IS DISTINCT FROM p_adim) THEN
  RAISE EXCEPTION 'Aktif rol ve firma/takım/bölge kapsamı doğrulanamadı.' USING ERRCODE='42501';
 END IF;
 PERFORM 1 FROM public.firmalar WHERE firma_id=v_yapan.firma_id AND aktif=true AND eclub_aktif=true FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Firma veya E-Club aktif değil.' USING ERRCODE='42501'; END IF;
 -- Tüm kayıtlar aynı sırada kilitlenir. Kilit beklendiyse güncel durum yeniden kontrol edilir.
 PERFORM 1 FROM public.eclub_store_cek_talepleri WHERE talep_id=ANY(p_idler) ORDER BY talep_id FOR UPDATE;
 GET DIAGNOSTICS v_adet=ROW_COUNT;
 IF v_adet<>cardinality(p_idler) THEN RAISE EXCEPTION 'Seçilen taleplerden biri bulunamadı; hiçbir talep işlenmedi.' USING ERRCODE='22023'; END IF;
 v_beklenen:=CASE p_adim WHEN 'utt' THEN 'beklemede' WHEN 'bm' THEN 'bm_onayinda' ELSE 'tm_onayinda' END;
 v_sonraki:=CASE p_adim WHEN 'utt' THEN 'bm_onayinda' WHEN 'bm' THEN 'tm_onayinda' ELSE 'onaylandi' END;
 FOR v_t IN SELECT * FROM public.eclub_store_cek_talepleri WHERE talep_id=ANY(p_idler) ORDER BY talep_id LOOP
  IF v_t.firma_id IS DISTINCT FROM v_yapan.firma_id
   OR (p_adim='utt' AND v_t.utt_id IS DISTINCT FROM p_yapan)
   OR (p_adim='bm' AND v_t.bm_id IS DISTINCT FROM p_yapan)
   OR (p_adim='tm' AND v_t.tm_id IS DISTINCT FROM p_yapan) THEN
   RAISE EXCEPTION 'Talep firma veya yönetici kapsamınızda değil.' USING ERRCODE='42501';
  END IF;
  IF v_t.durum IS DISTINCT FROM v_beklenen THEN
   RAISE EXCEPTION 'Talebin durumu değişti. Listeyi yenileyin; hiçbir talep işlenmedi.' USING ERRCODE='40001';
  END IF;
  IF v_t.donusum_puan IS NULL OR v_t.donusum_puan<=0 OR v_t.donusum_tl IS NULL OR v_t.donusum_tl<=0
   OR v_t.donusum_surum IS NULL OR v_t.donusum_surum<=0 THEN
   RAISE EXCEPTION 'Talebin merkezi puan–TL kayıt bilgisi eksik.' USING ERRCODE='23514';
  END IF;
  IF p_adim='bm' THEN
   IF v_t.utt_onay_tarihi IS NULL OR NOT EXISTS(SELECT 1 FROM public.kullanicilar u
    WHERE u.kullanici_id=v_t.utt_id AND u.aktif_mi=true AND lower(u.rol) IN ('utt','kd_utt')
    AND u.firma_id=v_yapan.firma_id AND u.takim_id=v_yapan.takim_id AND u.bolge_id=v_yapan.bolge_id) THEN
    RAISE EXCEPTION 'UTT onayı veya güncel UTT kapsamı doğrulanamadı.' USING ERRCODE='42501';
   END IF;
  ELSIF p_adim='tm' THEN
   IF v_t.utt_onay_tarihi IS NULL OR v_t.bm_onay_tarihi IS NULL OR NOT EXISTS(
    SELECT 1 FROM public.kullanicilar b JOIN public.kullanicilar u ON u.kullanici_id=v_t.utt_id
    WHERE b.kullanici_id=v_t.bm_id AND b.aktif_mi=true AND lower(b.rol)='bm'
    AND b.firma_id=v_yapan.firma_id AND b.takim_id=v_yapan.takim_id
    AND u.aktif_mi=true AND lower(u.rol) IN ('utt','kd_utt') AND u.firma_id=b.firma_id
    AND u.takim_id=b.takim_id AND u.bolge_id=b.bolge_id) THEN
    RAISE EXCEPTION 'Önceki onaylar veya güncel yönetim kapsamı doğrulanamadı.' USING ERRCODE='42501';
   END IF;
  END IF;
 END LOOP;
 -- Belirsiz atama varsa ilk kişiyi seçme; bütün işlem geri alınır.
 IF p_adim='utt' THEN
  SELECT array_agg(kullanici_id ORDER BY kullanici_id) INTO v_hedefler FROM public.kullanicilar
  WHERE firma_id=v_yapan.firma_id AND takim_id=v_yapan.takim_id AND bolge_id=v_yapan.bolge_id AND aktif_mi=true AND lower(rol)='bm';
  IF cardinality(v_hedefler) IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Bölge için tek bir aktif BM atanmalıdır.' USING ERRCODE='23514'; END IF;
 ELSIF p_adim='bm' THEN
  SELECT array_agg(kullanici_id ORDER BY kullanici_id) INTO v_hedefler FROM public.kullanicilar
  WHERE firma_id=v_yapan.firma_id AND takim_id=v_yapan.takim_id AND aktif_mi=true AND lower(rol)='tm';
  IF cardinality(v_hedefler) IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Takım için tek bir aktif TM atanmalıdır.' USING ERRCODE='23514'; END IF;
 END IF;
 v_hedef:=v_hedefler[1];
 UPDATE public.eclub_store_cek_talepleri SET durum=v_sonraki,
  utt_onay_tarihi=CASE WHEN p_adim='utt' THEN clock_timestamp() ELSE utt_onay_tarihi END,
  bm_id=CASE WHEN p_adim='utt' THEN v_hedef ELSE bm_id END,
  bm_onay_tarihi=CASE WHEN p_adim='bm' THEN clock_timestamp() ELSE bm_onay_tarihi END,
  tm_id=CASE WHEN p_adim='bm' THEN v_hedef ELSE tm_id END,
  tm_onay_tarihi=CASE WHEN p_adim='tm' THEN clock_timestamp() ELSE tm_onay_tarihi END,
  guncellenme_at=clock_timestamp()
 WHERE talep_id=ANY(p_idler) AND durum=v_beklenen;
 GET DIAGNOSTICS v_n=ROW_COUNT;
 IF v_n<>v_adet THEN RAISE EXCEPTION 'Talep durumu değişti; işlem geri alındı.' USING ERRCODE='40001'; END IF;
 RETURN v_n;
END;
$fn$;
CREATE OR REPLACE FUNCTION public.eclub_store_bm_onayina_gonder(p_utt_id uuid,p_talep_idler uuid[])
RETURNS TABLE(guncellenen_adet integer) LANGUAGE sql SECURITY DEFINER SET search_path=public AS
$$ SELECT public.eclub_store_onay_adimi(p_utt_id,p_talep_idler,'utt') $$;
CREATE OR REPLACE FUNCTION public.eclub_store_bm_onayla(p_bm_id uuid,p_talep_idler uuid[])
RETURNS TABLE(guncellenen_adet integer) LANGUAGE sql SECURITY DEFINER SET search_path=public AS
$$ SELECT public.eclub_store_onay_adimi(p_bm_id,p_talep_idler,'bm') $$;
CREATE OR REPLACE FUNCTION public.eclub_store_tm_onayla(p_tm_id uuid,p_talep_idler uuid[])
RETURNS TABLE(guncellenen_adet integer) LANGUAGE sql SECURITY DEFINER SET search_path=public AS
$$ SELECT public.eclub_store_onay_adimi(p_tm_id,p_talep_idler,'tm') $$;

-- İptal, onay ve kod teslimi aynı talep satırı kilidini kullanır.
-- İptal sınırı değişmez: teslimat başladıktan sonra iptal yoktur.
CREATE OR REPLACE FUNCTION public.eclub_store_cek_talebi_iptal(p_talep_id uuid,p_kisi_id uuid,p_admin_mi boolean DEFAULT false)
RETURNS TABLE(ok boolean,hata text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE v_t public.eclub_store_cek_talepleri%ROWTYPE;
BEGIN
 IF p_kisi_id IS NULL OR p_admin_mi IS NULL THEN RETURN QUERY SELECT false,'Yetkisiz işlem.'; RETURN; END IF;
 SELECT * INTO v_t FROM public.eclub_store_cek_talepleri WHERE talep_id=p_talep_id FOR UPDATE;
 IF NOT FOUND THEN RETURN QUERY SELECT false,'Talep bulunamadı.'; RETURN; END IF;
 IF p_admin_mi THEN
  IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_kisi_id AND aktif_mi=true AND lower(rol)='admin') THEN
   RETURN QUERY SELECT false,'Admin yetkisi doğrulanamadı.'; RETURN;
  END IF;
 ELSE
  IF v_t.talep_eden_kisi_id IS DISTINCT FROM p_kisi_id OR NOT EXISTS(
   SELECT 1 FROM public.eclub_kisiler k JOIN public.eclub_kisi_eczane ke ON ke.kisi_id=k.kisi_id
   WHERE k.kisi_id=p_kisi_id AND lower(k.rol)='eczaci' AND ke.eczane_id=v_t.eczane_id AND ke.aktif_mi=true) THEN
   RETURN QUERY SELECT false,'Talebi yalnız talep sahibi ana eczacı iptal edebilir.'; RETURN;
  END IF;
 END IF;
 IF v_t.durum NOT IN ('beklemede','bm_onayinda','tm_onayinda','onaylandi') THEN RETURN QUERY SELECT false,'Bu talep artık iptal edilemez.'; RETURN; END IF;
 PERFORM 1 FROM public.eclub_store_puan_devirleri WHERE kaynak_talep_id=p_talep_id OR kullanilan_talep_id=p_talep_id ORDER BY devir_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.eclub_store_puan_devirleri WHERE kaynak_talep_id=p_talep_id AND kullanildi_mi=true AND kullanilan_talep_id IS NOT NULL AND kullanilan_talep_id<>p_talep_id) THEN
  RETURN QUERY SELECT false,'Bu talebin devreden puanı başka bir talepte kullanılmış; önce bağlı talep çözülmelidir.'; RETURN;
 END IF;
 UPDATE public.eclub_store_cek_talepleri SET durum='iptal',guncellenme_at=clock_timestamp() WHERE talep_id=p_talep_id;
 UPDATE public.eclub_store_puan_devirleri SET kullanildi_mi=false,kullanilan_talep_id=NULL,guncellenme_at=clock_timestamp() WHERE kullanilan_talep_id=p_talep_id;
 UPDATE public.eclub_store_puan_devirleri SET iptal_edildi=true,guncellenme_at=clock_timestamp() WHERE kaynak_talep_id=p_talep_id;
 RETURN QUERY SELECT true,NULL::text;
END;
$fn$;
REVOKE ALL ON FUNCTION public.eclub_store_onay_adimi(uuid,uuid[],text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.eclub_store_bm_onayina_gonder(uuid,uuid[]) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.eclub_store_bm_onayla(uuid,uuid[]) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.eclub_store_tm_onayla(uuid,uuid[]) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.eclub_store_cek_talebi_iptal(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_store_onay_adimi(uuid,uuid[],text) TO service_role;
GRANT EXECUTE ON FUNCTION public.eclub_store_bm_onayina_gonder(uuid,uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.eclub_store_bm_onayla(uuid,uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.eclub_store_tm_onayla(uuid,uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.eclub_store_cek_talebi_iptal(uuid,uuid,boolean) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eclub_talep_onay_zinciri_hazir;
