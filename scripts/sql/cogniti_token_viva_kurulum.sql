-- Viva: fiili davet kişi başına 1 token; aynı etkinlik+kişi yalnız bir kez.
-- Taslak tüketmez. Daily oda/oturum kimliği kullanılmaz. Geçmişe tüketim yazmaz.
-- DEFERRABLE tetikleyiciler RPC transaction'ı sonundaki kesin davet listesini okur:
-- taslak → planlı düzenlemesinde silinen eski adaylar ücretlendirilmez.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-token-viva-v1',0));
DO $$ BEGIN
 IF to_regprocedure('public.cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text)') IS NULL
 OR to_regclass('public.viva_etkinlikler') IS NULL OR to_regclass('public.viva_katilimcilar') IS NULL
 OR to_regclass('public.viva_davetler') IS NULL THEN RAISE EXCEPTION 'Viva veya token önkoşulları eksik.'; END IF;
END $$;

-- UUID ve e-posta aynı kişiyi temsil ederse tek tüketimle eşleşir.
-- Katılımcı/davet satırı silinse bile eşleşme korunur. Yalnız sunucu erişir.
CREATE TABLE IF NOT EXISTS public.cogniti_token_viva_kimlikleri(
 firma_id uuid NOT NULL,etkinlik_id uuid NOT NULL,kimlik text NOT NULL,
 tuketim_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(firma_id,etkinlik_id,kimlik,tuketim_id),
 FOREIGN KEY(firma_id,tuketim_id) REFERENCES public.cogniti_token_tuketimleri(firma_id,tuketim_id)
);
ALTER TABLE public.cogniti_token_viva_kimlikleri ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cogniti_token_viva_kimlikleri FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.cogniti_token_viva_kimlikleri TO service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_viva_davet_kaydet(
 p_etkinlik uuid,p_tur text,p_kisi uuid,p_eposta text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e public.viva_etkinlikler%ROWTYPE; v_firma uuid; v_eposta text;
 v_tur text; v_alici text; v_kimlikler text[]; v_tuketim uuid; v_eslesmeler uuid[]; v_id uuid; v_auth uuid;
BEGIN
 SELECT * INTO e FROM public.viva_etkinlikler WHERE etkinlik_id=p_etkinlik FOR SHARE;
 IF NOT FOUND OR e.durum NOT IN ('planlandi','canli') THEN RETURN NULL; END IF;
 SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id=e.sahip_id;
 IF v_firma IS NULL OR v_firma IS DISTINCT FROM e.firma_id THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:viva_firma_yok' USING ERRCODE='P0001'; END IF;
 IF p_tur='ic' THEN
  SELECT lower(btrim(eposta)) INTO v_eposta FROM public.kullanicilar WHERE kullanici_id=p_kisi;
  IF NOT FOUND THEN RAISE EXCEPTION 'Viva katılımcısı bulunamadı.' USING ERRCODE='22023'; END IF;
  v_tur:='firma_kullanicisi';v_alici:=p_kisi::text;v_kimlikler:=ARRAY['ic:'||v_alici];
  FOR v_id IN SELECT kisi_id FROM public.eclub_kisiler WHERE auth_user_id=p_kisi LOOP
   v_kimlikler:=array_append(v_kimlikler,'eclub:'||v_id::text);
  END LOOP;
 ELSIF p_tur='eclub' THEN
  SELECT lower(btrim(eposta)),auth_user_id INTO v_eposta,v_auth FROM public.eclub_kisiler WHERE kisi_id=p_kisi;
  IF NOT FOUND THEN RAISE EXCEPTION 'Viva katılımcısı bulunamadı.' USING ERRCODE='22023'; END IF;
  v_tur:='eclub_kisi';v_alici:=p_kisi::text;v_kimlikler:=ARRAY['eclub:'||v_alici];
  IF v_auth IS NOT NULL AND EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=v_auth) THEN
   v_kimlikler:=array_append(v_kimlikler,'ic:'||v_auth::text);
  END IF;
 ELSIF p_tur='ozel' THEN
  v_eposta:=lower(btrim(p_eposta));
  IF coalesce(length(v_eposta),0) NOT BETWEEN 3 AND 254 THEN
   RAISE EXCEPTION 'Viva davet adresi geçersiz.' USING ERRCODE='22023'; END IF;
  v_tur:='viva_ozel_davetli';v_alici:=v_eposta;v_kimlikler:=ARRAY[]::text[];
 ELSE RAISE EXCEPTION 'Viva davet türü geçersiz.' USING ERRCODE='22023'; END IF;
 -- Aynı firmanın davet/tüketim işlemlerini seri hale getirir; tekrar davet sıfır bakiyede de geçer.
 PERFORM 1 FROM public.cogniti_token_hesaplari WHERE firma_id=v_firma FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001'; END IF;
 -- Kayıtlı kişi kimlikleri önce gelir; aynı e-posta iki farklı kişinin
 -- kimliğini kendiliğinden birleştirmez. Aynı Auth hesabı birleşik kimliktir.
 SELECT array_agg(DISTINCT k.tuketim_id) INTO v_eslesmeler
 FROM public.cogniti_token_viva_kimlikleri k
 WHERE k.firma_id=v_firma AND k.etkinlik_id=p_etkinlik AND k.kimlik=ANY(v_kimlikler);
 IF coalesce(cardinality(v_eslesmeler),0)>1 THEN
  RAISE EXCEPTION 'COGNITI_TOKEN:viva_kimlik_belirsiz' USING ERRCODE='P0001'; END IF;
 v_tuketim:=v_eslesmeler[1];
 IF v_tuketim IS NULL AND coalesce(v_eposta,'')<>'' THEN
  IF p_tur='ozel' THEN
   SELECT array_agg(DISTINCT k.tuketim_id) INTO v_eslesmeler
   FROM public.cogniti_token_viva_kimlikleri k
   WHERE k.firma_id=v_firma AND k.etkinlik_id=p_etkinlik AND k.kimlik='eposta:'||v_eposta;
  ELSE
   -- Daha önce özel adres olarak davet edilmiş ve henüz başka bir kişiye
   -- bağlanmamış e-posta bu kişinin aynı daveti olarak eşleşir.
   SELECT array_agg(DISTINCT k.tuketim_id) INTO v_eslesmeler
   FROM public.cogniti_token_viva_kimlikleri k
   JOIN public.cogniti_token_tuketimleri t ON t.firma_id=k.firma_id AND t.tuketim_id=k.tuketim_id
   WHERE k.firma_id=v_firma AND k.etkinlik_id=p_etkinlik AND k.kimlik='eposta:'||v_eposta
    AND t.alici_turu='viva_ozel_davetli'
    AND NOT EXISTS(SELECT 1 FROM public.cogniti_token_viva_kimlikleri diger
     WHERE diger.firma_id=k.firma_id AND diger.etkinlik_id=k.etkinlik_id AND diger.tuketim_id=k.tuketim_id
     AND (diger.kimlik LIKE 'ic:%' OR diger.kimlik LIKE 'eclub:%') AND NOT diger.kimlik=ANY(v_kimlikler));
  END IF;
  IF coalesce(cardinality(v_eslesmeler),0)>1 THEN
   RAISE EXCEPTION 'COGNITI_TOKEN:viva_kimlik_belirsiz' USING ERRCODE='P0001'; END IF;
  v_tuketim:=v_eslesmeler[1];
 END IF;
 IF coalesce(v_eposta,'')<>'' THEN v_kimlikler:=array_append(v_kimlikler,'eposta:'||v_eposta); END IF;
 IF v_tuketim IS NULL THEN
  BEGIN
   v_tuketim:=public.cogniti_token_tuket(v_firma,'firma_kullanicisi',e.sahip_id,v_tur,v_alici,
    'viva_davet',p_etkinlik,'viva-davet:'||p_etkinlik::text||':'||v_tur||':'||v_alici);
  EXCEPTION WHEN SQLSTATE '22023' THEN
   IF SQLERRM='Yetersiz token bakiyesi.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:bakiye_yetersiz' USING ERRCODE='P0001';
   ELSIF SQLERRM='Token hesabı bulunamadı.' THEN
    RAISE EXCEPTION 'COGNITI_TOKEN:hesap_yok' USING ERRCODE='P0001';
   ELSE RAISE;
   END IF;
  END;
 END IF;
 INSERT INTO public.cogniti_token_viva_kimlikleri(firma_id,etkinlik_id,kimlik,tuketim_id)
 SELECT v_firma,p_etkinlik,x,v_tuketim FROM unnest(v_kimlikler) k(x)
 ON CONFLICT(firma_id,etkinlik_id,kimlik,tuketim_id) DO NOTHING;
 RETURN v_tuketim;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_viva_davet_kaydet(uuid,text,uuid,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_token_viva_davet_tetikle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d record; k record;
BEGIN
 IF TG_TABLE_NAME='viva_katilimcilar' THEN
  IF EXISTS(SELECT 1 FROM public.viva_katilimcilar WHERE etkinlik_id=NEW.etkinlik_id AND tur=NEW.tur
   AND kullanici_id IS NOT DISTINCT FROM NEW.kullanici_id AND kisi_id IS NOT DISTINCT FROM NEW.kisi_id) THEN
   PERFORM public.cogniti_token_viva_davet_kaydet(NEW.etkinlik_id,NEW.tur,coalesce(NEW.kullanici_id,NEW.kisi_id),NULL);
  END IF;
 ELSIF TG_TABLE_NAME='viva_davetler' THEN
  IF TG_OP='UPDATE' THEN
   -- OTP/oturum/e-posta durumu güncellemeleri yeni davet değildir.
   IF NOT OLD.iptal OR NEW.iptal THEN RETURN NEW; END IF;
  END IF;
  SELECT * INTO d FROM public.viva_davetler WHERE davet_id=NEW.davet_id AND NOT iptal;
  IF FOUND THEN PERFORM public.cogniti_token_viva_davet_kaydet(d.etkinlik_id,'ozel',NULL,d.eposta); END IF;
 ELSE
  -- Durum değişiminde eski taslak adaylar değil son listede kalan kişiler tüketilir.
  FOR k IN SELECT * FROM public.viva_katilimcilar WHERE etkinlik_id=NEW.etkinlik_id LOOP
   PERFORM public.cogniti_token_viva_davet_kaydet(k.etkinlik_id,k.tur,coalesce(k.kullanici_id,k.kisi_id),NULL);
  END LOOP;
  FOR d IN SELECT * FROM public.viva_davetler WHERE etkinlik_id=NEW.etkinlik_id AND NOT iptal LOOP
   PERFORM public.cogniti_token_viva_davet_kaydet(d.etkinlik_id,'ozel',NULL,d.eposta);
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.cogniti_token_viva_davet_tetikle() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS trg_cogniti_token_viva_katilimci ON public.viva_katilimcilar;
CREATE CONSTRAINT TRIGGER trg_cogniti_token_viva_katilimci AFTER INSERT ON public.viva_katilimcilar
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_viva_davet_tetikle();
DROP TRIGGER IF EXISTS trg_cogniti_token_viva_ozel ON public.viva_davetler;
CREATE CONSTRAINT TRIGGER trg_cogniti_token_viva_ozel AFTER INSERT OR UPDATE ON public.viva_davetler
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.cogniti_token_viva_davet_tetikle();
DROP TRIGGER IF EXISTS trg_cogniti_token_viva_durum ON public.viva_etkinlikler;
CREATE CONSTRAINT TRIGGER trg_cogniti_token_viva_durum AFTER UPDATE ON public.viva_etkinlikler
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
 WHEN(OLD.durum='taslak' AND NEW.durum IN ('planlandi','canli'))
 EXECUTE FUNCTION public.cogniti_token_viva_davet_tetikle();
COMMIT;
SELECT count(*)=3 AS viva_token_baglantilari_kuruldu
 FROM pg_trigger WHERE tgname IN('trg_cogniti_token_viva_katilimci','trg_cogniti_token_viva_ozel','trg_cogniti_token_viva_durum')
 AND tgenabled='O' AND NOT tgisinternal AND tgrelid IN('public.viva_katilimcilar'::regclass,'public.viva_davetler'::regclass,'public.viva_etkinlikler'::regclass);
