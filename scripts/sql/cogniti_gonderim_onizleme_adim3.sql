-- KULLANICI ÇALIŞTIRACAK. Ön koşul: satın alma Adım 1/2, mevcut E-Club uygunluk RPC'si.
-- Yalnız önizleme. Yeni bakiye ile gönderim, tüketim, rezervasyon veya bildirim oluşturmaz.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_gonderim_token_onizle(
 p_auth_id uuid,p_akis text,p_bakiye_turu text,p_kaynak_idler uuid[],p_alici_idler uuid[],p_plan_tarihi date DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_firma uuid; v_rol text; v_tur jsonb; v_ozet jsonb; v_uygun integer:=0; v_atlanan integer:=0;
 v_gereken bigint:=0; v_mevcut bigint:=0; v_hedef timestamptz; v_kontrol jsonb; v_aday record; v_hedefler text[];
 v_not text; v_tarih date:=(statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date;
BEGIN
 IF p_akis IS NULL OR p_akis NOT IN ('yayin_acilis','eclub_oneri') OR p_bakiye_turu IS NULL OR p_bakiye_turu NOT IN ('kisisel','firma_ortak')
  OR coalesce(cardinality(p_kaynak_idler),0) NOT BETWEEN 1 AND 20 OR array_position(p_kaynak_idler,NULL) IS NOT NULL
  OR coalesce(cardinality(p_alici_idler),0)>100 OR array_position(p_alici_idler,NULL) IS NOT NULL
  OR (p_plan_tarihi IS NOT NULL AND (NOT isfinite(p_plan_tarihi) OR p_plan_tarihi<=v_tarih)) THEN
  RAISE EXCEPTION 'Önizleme seçimi geçersiz.' USING ERRCODE='22023';
 END IF;
 v_ozet:=public.cogniti_satin_alma_bakiye_ozeti(p_auth_id);
 SELECT firma_id,lower(btrim(rol)) INTO v_firma,v_rol FROM public.kullanicilar WHERE kullanici_id=p_auth_id;
 v_tur:=CASE WHEN p_bakiye_turu='kisisel' THEN v_ozet->'kisisel' ELSE v_ozet->'firma_ortak' END;
 IF v_tur IS NULL OR v_tur='null'::jsonb THEN
  RAISE EXCEPTION 'Bu bakiye size ait değil veya tanımlı değil.' USING ERRCODE='42501';
 END IF;
 v_hedef:=CASE WHEN p_plan_tarihi IS NULL THEN statement_timestamp() ELSE p_plan_tarihi::timestamp AT TIME ZONE 'Europe/Istanbul' END;
 -- Yalnız kullanıcıya ait kişisel hesap veya kendi firmasının ortak hesabı.
 SELECT coalesce(sum(y.kalan),0) INTO v_mevcut
 FROM public.cogniti_satin_alma_bakiyeleri b JOIN public.cogniti_esnek_paket_yuklemeleri y USING(firma_id,bakiye_id)
 WHERE b.firma_id=v_firma AND b.bakiye_turu=p_bakiye_turu
  AND (b.bakiye_turu='firma_ortak' OR b.sahip_id=p_auth_id) AND y.son_kullanim_at>v_hedef;
 IF p_akis='eclub_oneri' THEN
  IF v_rol NOT IN ('utt','kd_utt') OR coalesce(cardinality(p_alici_idler),0)=0
   OR cardinality(p_kaynak_idler)*cardinality(p_alici_idler)>300 THEN
   RAISE EXCEPTION 'E-Club gönderim seçimine erişiminiz bulunmuyor.' USING ERRCODE='42501';
  END IF;
  -- Mevcut gerçek toplu kota/tekrar/inceleme/tarih kontrolü. Önizleme bayrağı sabit true.
  v_kontrol:=public.eclub_yayin_toplu_islem(p_auth_id,p_alici_idler,p_kaynak_idler,CASE WHEN p_plan_tarihi IS NULL THEN NULL ELSE v_hedef END,NULL,true);
  SELECT count(*) FILTER(WHERE x->>'uygun'='true'),count(*) FILTER(WHERE x->>'uygun' IS DISTINCT FROM 'true')
   INTO v_uygun,v_atlanan FROM jsonb_array_elements(v_kontrol->'sonuclar') x;
  IF v_uygun+v_atlanan <> (SELECT count(DISTINCT x) FROM unnest(p_kaynak_idler) x)*(SELECT count(DISTINCT x) FROM unnest(p_alici_idler) x) THEN
   RAISE EXCEPTION 'Gönderim uygunluk sonucu eksik.' USING ERRCODE='22023';
  END IF;
  v_gereken:=v_uygun;
  v_not:='Yalnız mevcut gönderim kurallarına uygun yayın–alıcı eşleşmeleri hesaplandı.';
 ELSE
  IF v_rol NOT IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per')
   OR coalesce(cardinality(p_alici_idler),0)<>0 THEN
   RAISE EXCEPTION 'Yayın açılış seçimine erişiminiz bulunmuyor.' USING ERRCODE='42501';
  END IF;
  FOR v_aday IN
   SELECT DISTINCT s.soru_seti_durum_id,t.talep_id,t.firma_id,t.uretici_id,t.takim_id,t.hedef_roller,t.taslak_mi,t.yayin_oncesi_silme_durumu,s.durum
   FROM public.soru_seti_durumu s JOIN public.soru_setleri ss ON ss.soru_seti_id=s.soru_seti_id
   JOIN public.talepler t ON t.talep_id=ss.talep_id WHERE s.soru_seti_durum_id=ANY(p_kaynak_idler)
  LOOP
   IF v_aday.uretici_id<>p_auth_id OR v_aday.firma_id<>v_firma THEN RAISE EXCEPTION 'Başka üreticinin veya firmanın içeriği kullanılamaz.' USING ERRCODE='42501'; END IF;
   IF v_aday.durum<>'onaylandi' OR v_aday.taslak_mi OR v_aday.yayin_oncesi_silme_durumu IS NOT NULL
    OR EXISTS(SELECT 1 FROM public.yayin_yonetimi y WHERE y.soru_seti_durum_id=v_aday.soru_seti_durum_id) THEN
    v_atlanan:=v_atlanan+1; CONTINUE;
   END IF;
   v_uygun:=v_uygun+1; v_hedefler:=coalesce(v_aday.hedef_roller,ARRAY['utt']);
   -- İlk yayın açılışındaki mevcut token tetikleyicisiyle aynı alıcı kapsamı.
   SELECT v_gereken+count(DISTINCT u.kullanici_id) INTO v_gereken FROM public.kullanicilar u LEFT JOIN public.bolgeler b ON b.bolge_id=u.bolge_id
   WHERE u.firma_id=v_firma AND u.aktif_mi=true AND (
    ('bm'=ANY(v_hedefler) AND u.rol='bm') OR ('utt'=ANY(v_hedefler) AND u.rol IN ('utt','kd_utt')
     AND (v_aday.takim_id IS NULL OR coalesce(u.takim_id,b.takim_id)=v_aday.takim_id)));
  END LOOP;
  IF v_uygun+v_atlanan<>(SELECT count(DISTINCT x) FROM unnest(p_kaynak_idler) x) THEN
   RAISE EXCEPTION 'Yayın adayı bulunamadı.' USING ERRCODE='22023';
  END IF;
  v_not:='Bu hesap ilk yayın açılışına aittir. E-Club/Eczanem sonraki dağıtımları burada ücretlendirilmez. Yayın koşulları gönderim sırasında tekrar doğrulanır.';
 END IF;
 RETURN jsonb_build_object('akis',p_akis,'bakiye_turu',p_bakiye_turu,'planli',p_plan_tarihi IS NOT NULL,
  'uygun_kayit',v_uygun,'atlanan_kayit',v_atlanan,'gereken_token',v_gereken,'kullanilabilir_token',v_mevcut,
  'islem_sonrasi',greatest(0,v_mevcut-v_gereken),'eksik_token',greatest(0,v_gereken-v_mevcut),
  'yeterli',v_mevcut>=v_gereken,'gercek_gonderim_acik',false,'aciklama',v_not);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_gonderim_token_onizle(uuid,text,text,uuid[],uuid[],date) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_gonderim_onizleme_adim3_kuruldu;
