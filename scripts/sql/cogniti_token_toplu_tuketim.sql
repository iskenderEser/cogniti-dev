-- Toplu token tüketimi: tek veritabanı işleminde tamamı başarılı olur veya tümü geri alınır.
-- Gönderim kayıtlarıyla aynı transaction içinde çağrılmalıdır; entegrasyon henüz yapılmamıştır.
BEGIN;
CREATE OR REPLACE FUNCTION public.cogniti_token_toplu_tuket(p_firma uuid,p_gonderimler jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE h public.cogniti_token_hesaplari%ROWTYPE; v jsonb; id uuid; sonuc jsonb:='[]'::jsonb;
BEGIN
 IF p_firma IS NULL OR jsonb_typeof(p_gonderimler) IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Firma ve gönderim listesi gereklidir.' USING ERRCODE='22023';
 END IF;
 IF jsonb_array_length(p_gonderimler) NOT BETWEEN 1 AND 300 THEN
  RAISE EXCEPTION 'Gönderim listesi 1 ile 300 arasında kayıt içermelidir.' USING ERRCODE='22023';
 END IF;
 SELECT * INTO h FROM public.cogniti_token_hesaplari WHERE firma_id=p_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Token hesabı bulunamadı.' USING ERRCODE='22023'; END IF;
 FOR v IN SELECT value FROM jsonb_array_elements(p_gonderimler) LOOP
  IF jsonb_typeof(v) IS DISTINCT FROM 'object' THEN
   RAISE EXCEPTION 'Gönderim kaydı geçersiz.' USING ERRCODE='22023';
  END IF;
  id:=public.cogniti_token_tuket(p_firma,v->>'gonderen_turu',(v->>'gonderen_id')::uuid,
   v->>'alici_turu',v->>'alici_kimligi',v->>'islem_turu',(v->>'kaynak_id')::uuid,v->>'islem_anahtari');
  sonuc:=sonuc||jsonb_build_array(jsonb_build_object('islem_anahtari',v->>'islem_anahtari','tuketim_id',id));
 END LOOP;
 RETURN sonuc;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_toplu_tuket(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cogniti_token_toplu_tuket(uuid,jsonb) TO service_role;
COMMIT;
