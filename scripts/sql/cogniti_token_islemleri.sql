-- Cogniti token yükleme ve tek gönderim işlemleri. HENÜZ TEST EDİLMEDİ.
-- Canlıya uygulamadan önce ayrı bir işlemde doğrulanmalıdır.
BEGIN;

CREATE OR REPLACE FUNCTION public.cogniti_token_yukle(
  p_firma uuid, p_tur text, p_miktar bigint, p_anahtar text,
  p_yil integer DEFAULT NULL, p_ay integer DEFAULT NULL,
  p_olusturan uuid DEFAULT NULL, p_aciklama text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE;
  y public.cogniti_token_yuklemeleri%ROWTYPE;
  v_id uuid; v_son timestamptz; v_mahsup bigint;
BEGIN
  IF p_firma IS NULL OR p_miktar IS NULL OR p_miktar <= 0 OR coalesce(btrim(p_anahtar),'') = ''
    OR p_tur NOT IN ('aylik_paket','kko','admin_duzeltme') OR p_tur IS NULL THEN
    RAISE EXCEPTION 'Geçersiz token yükleme bilgisi.' USING ERRCODE='22023';
  END IF;
  SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=p_firma FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Token hesabı bulunamadı.' USING ERRCODE='22023'; END IF;
  IF p_tur='aylik_paket' THEN
    IF h.paket_turu <> 'aylik' OR p_yil IS NULL OR p_yil NOT BETWEEN 2000 AND 9998 OR p_ay IS NULL OR p_ay NOT BETWEEN 1 AND 12 THEN
      RAISE EXCEPTION 'Aylık dönem veya paket geçersiz.' USING ERRCODE='22023';
    END IF;
    v_son := (make_date(p_yil,p_ay,1)::timestamp + interval '2 months') AT TIME ZONE 'Europe/Istanbul';
  ELSE
    IF p_yil IS NOT NULL OR p_ay IS NOT NULL OR (p_tur='kko' AND h.paket_turu <> 'kullandigin_kadar_ode') THEN
      RAISE EXCEPTION 'Yükleme türü veya dönem geçersiz.' USING ERRCODE='22023';
    END IF;
  END IF;
  SELECT * INTO y FROM public.cogniti_token_yuklemeleri WHERE firma_id=p_firma AND islem_anahtari=p_anahtar;
  IF FOUND THEN
    IF y.yukleme_turu IS DISTINCT FROM p_tur OR y.miktar IS DISTINCT FROM p_miktar
      OR y.donem_yil IS DISTINCT FROM p_yil OR y.donem_ay IS DISTINCT FROM p_ay
      OR y.olusturan_id IS DISTINCT FROM p_olusturan OR y.aciklama IS DISTINCT FROM p_aciklama THEN
      RAISE EXCEPTION 'İşlem anahtarı farklı yüklemede kullanılmış.' USING ERRCODE='22023';
    END IF;
    RETURN y.yukleme_id;
  END IF;
  IF p_tur='aylik_paket' AND v_son <= now() THEN
    RAISE EXCEPTION 'Süresi dolmuş aylık paket yüklenemez.' USING ERRCODE='22023';
  END IF;
  v_mahsup := least(h.asim_borcu,p_miktar);
  INSERT INTO public.cogniti_token_yuklemeleri(firma_id,yukleme_turu,miktar,kalan,donem_yil,donem_ay,son_kullanim_at,olusturan_id,aciklama,islem_anahtari)
  VALUES(p_firma,p_tur,p_miktar,p_miktar-v_mahsup,p_yil,p_ay,v_son,p_olusturan,p_aciklama,p_anahtar)
  RETURNING yukleme_id INTO v_id;
  UPDATE public.cogniti_token_hesaplari SET asim_borcu=asim_borcu-v_mahsup,updated_at=now() WHERE firma_id=p_firma;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.cogniti_token_tuket(
 p_firma uuid,p_gonderen_turu text,p_gonderen uuid,p_alici_turu text,p_alici text,
 p_islem_turu text,p_kaynak uuid,p_anahtar text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; t public.cogniti_token_tuketimleri%ROWTYPE;
  y public.cogniti_token_yuklemeleri%ROWTYPE; v_id uuid;
BEGIN
 IF p_firma IS NULL OR p_gonderen IS NULL OR p_kaynak IS NULL OR coalesce(btrim(p_anahtar),'')=''
   OR coalesce(btrim(p_alici),'')='' THEN RAISE EXCEPTION 'Eksik tüketim bilgisi.' USING ERRCODE='22023'; END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Token hesabı bulunamadı.' USING ERRCODE='22023'; END IF;
 SELECT * INTO t FROM public.cogniti_token_tuketimleri WHERE firma_id=p_firma AND islem_anahtari=p_anahtar;
 IF FOUND THEN
   IF ROW(t.gonderen_turu,t.gonderen_id,t.alici_turu,t.alici_kimligi,t.islem_turu,t.kaynak_id)
     IS DISTINCT FROM ROW(p_gonderen_turu,p_gonderen,p_alici_turu,p_alici,p_islem_turu,p_kaynak) THEN
     RAISE EXCEPTION 'İşlem anahtarı farklı tüketimde kullanılmış.' USING ERRCODE='22023'; END IF;
   RETURN t.tuketim_id;
 END IF;
 IF p_islem_turu='viva_davet' THEN
   SELECT * INTO t FROM public.cogniti_token_tuketimleri
   WHERE firma_id=p_firma AND islem_turu='viva_davet' AND kaynak_id=p_kaynak
     AND alici_turu=p_alici_turu AND alici_kimligi=p_alici;
   IF FOUND THEN RETURN t.tuketim_id; END IF;
 END IF;
 SELECT * INTO y FROM public.cogniti_token_yuklemeleri
 WHERE firma_id=p_firma AND kalan>0 AND (son_kullanim_at IS NULL OR son_kullanim_at>now())
 ORDER BY son_kullanim_at ASC NULLS LAST, created_at, yukleme_id LIMIT 1 FOR UPDATE;
 IF NOT FOUND AND h.paket_turu='kullandigin_kadar_ode' THEN
   RAISE EXCEPTION 'Yetersiz token bakiyesi.' USING ERRCODE='22023'; END IF;
 INSERT INTO public.cogniti_token_tuketimleri(firma_id,gonderen_turu,gonderen_id,alici_turu,alici_kimligi,islem_turu,kaynak_id,islem_anahtari,asim_miktari)
 VALUES(p_firma,p_gonderen_turu,p_gonderen,p_alici_turu,p_alici,p_islem_turu,p_kaynak,p_anahtar,CASE WHEN y.yukleme_id IS NULL THEN 1 ELSE 0 END)
 RETURNING tuketim_id INTO v_id;
 IF y.yukleme_id IS NULL THEN
   UPDATE public.cogniti_token_hesaplari SET asim_borcu=asim_borcu+1,updated_at=now() WHERE firma_id=p_firma;
 ELSE
   UPDATE public.cogniti_token_yuklemeleri SET kalan=kalan-1 WHERE yukleme_id=y.yukleme_id;
   INSERT INTO public.cogniti_token_tuketim_dagilimlari(firma_id,tuketim_id,yukleme_id,miktar) VALUES(p_firma,v_id,y.yukleme_id,1);
 END IF;
 RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text),
 public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_yukle(uuid,text,bigint,text,integer,integer,uuid,text),
 public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text) TO service_role;
COMMIT;
