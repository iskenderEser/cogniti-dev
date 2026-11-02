-- Yalniz kod/baglanti teslimati. Mevcut kuyruk ve yeniden deneme kurallari korunur.
BEGIN;
ALTER TABLE public.eclub_store_cek_talepleri ADD COLUMN IF NOT EXISTS kullanim_linki text;
DO $payload$
DECLARE s text;
BEGIN
 SELECT pg_get_functiondef('public.eclub_store_admin_kod_teslim(uuid,uuid,text)'::regprocedure) INTO s;
 IF strpos(s,'''kullanim_linki''')=0 THEN
  IF strpos(s,'''cek_tutari_tl'', v_t.talep_edilen_cek_tl')=0 THEN RAISE EXCEPTION 'Kod teslim fonksiyonunun beklenen sürümü bulunamadı.'; END IF;
  s:=replace(s,'''cek_tutari_tl'', v_t.talep_edilen_cek_tl','''cek_tutari_tl'', v_t.talep_edilen_cek_tl, ''kullanim_linki'', v_t.kullanim_linki, ''firma_id'', v_t.firma_id');
  EXECUTE s;
 END IF;
 SELECT pg_get_functiondef('public.eclub_admin_talep_json(public.eclub_store_cek_talepleri)'::regprocedure) INTO s;
 IF strpos(s,'''kullanim_linki''')=0 THEN
  IF strpos(s,'''cek_kodu'',t.cek_kodu')=0 THEN RAISE EXCEPTION 'Admin talep alanları beklenen sürümde değil.'; END IF;
  s:=replace(s,'''cek_kodu'',t.cek_kodu','''cek_kodu'',t.cek_kodu,''kullanim_linki'',t.kullanim_linki');
  s:=replace(s,'''teslimat'',coalesce', $ayrinti$'teslimat_ayrintilari',coalesce((SELECT jsonb_agg(jsonb_build_object('kanal',kanal,'durum',durum,'deneme',deneme_sayisi,'max_deneme',max_deneme,'son_hata',son_hata_kodu,'tamamlanma_at',tamamlanma_at)) FROM public.eclub_cek_teslimat_outbox WHERE talep_id=t.talep_id),'[]'::jsonb),'teslimat',coalesce$ayrinti$);
  EXECUTE s;
 END IF;
END;
$payload$;
CREATE OR REPLACE FUNCTION public.eclub_admin_kod_baglanti_teslim(p_admin uuid,p_firma uuid,p_talep uuid,p_kod text,p_link text DEFAULT NULL)
RETURNS TABLE(ok boolean,hata text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE t public.eclub_store_cek_talepleri%ROWTYPE; v_link text:=nullif(btrim(p_link),''); v_ok boolean; v_hata text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin AND lower(rol)='admin' AND aktif_mi=true) THEN RAISE EXCEPTION 'Admin yetkisi doğrulanamadı.' USING ERRCODE='42501'; END IF;
 IF p_kod IS NULL OR btrim(p_kod)!~'^[A-Za-z0-9][A-Za-z0-9 _./-]{2,199}$'
 OR (v_link IS NOT NULL AND (length(v_link)>2048 OR v_link!~'^https://[^/?#[:space:]@]+([/?#][^[:space:]]*)?$' OR position(chr(92) in v_link)>0)) THEN
  RAISE EXCEPTION 'Geçerli çek kodu ve varsa HTTPS kullanım bağlantısı girin.' USING ERRCODE='22023'; END IF;
 SELECT * INTO t FROM public.eclub_store_cek_talepleri WHERE talep_id=p_talep FOR UPDATE;
 IF t.talep_id IS NULL OR p_firma IS NULL OR t.firma_id IS DISTINCT FROM p_firma OR p_firma='15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid THEN RAISE EXCEPTION 'Talep seçilen firmaya ait değil.' USING ERRCODE='42501'; END IF;
 IF t.durum IN ('teslimat_bekliyor','cek_kodlari_gonderildi') THEN
  RETURN QUERY SELECT t.cek_kodu=btrim(p_kod) AND t.kullanim_linki IS NOT DISTINCT FROM v_link,
   CASE WHEN t.cek_kodu=btrim(p_kod) AND t.kullanim_linki IS NOT DISTINCT FROM v_link THEN NULL::text ELSE 'Teslim edilmiş kod/bağlantı değiştirilemez.' END;
  RETURN;
 END IF;
 UPDATE public.eclub_store_cek_talepleri SET kullanim_linki=v_link WHERE talep_id=p_talep;
 SELECT r.ok,r.hata INTO v_ok,v_hata FROM public.eclub_admin_firma_talep_islem(p_admin,p_firma,p_talep,'cek_kodu_teslim',btrim(p_kod))r;
 IF v_ok IS NOT TRUE THEN UPDATE public.eclub_store_cek_talepleri SET kullanim_linki=t.kullanim_linki WHERE talep_id=p_talep; END IF;
 RETURN QUERY SELECT coalesce(v_ok,false),v_hata;
END;
$fn$;

-- Ortak takip listesine kod/bağlantı eklenmez. Yalnız aktif ana eczacı/e-posta alıcısı okuyabilir.
CREATE OR REPLACE FUNCTION public.eclub_cek_teslim_bilgisi(p_kisi uuid,p_talep uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
 SELECT jsonb_build_object('talep_id',t.talep_id,'firma_id',t.firma_id,'cek_kodu',t.cek_kodu,'kullanim_linki',t.kullanim_linki,'tutar_tl',t.talep_edilen_cek_tl)
 FROM public.eclub_store_cek_talepleri t
 WHERE t.talep_id=p_talep AND t.durum IN ('teslimat_bekliyor','cek_kodlari_gonderildi') AND t.cek_kodu IS NOT NULL
 AND EXISTS(SELECT 1 FROM public.eclub_kisiler k JOIN public.eclub_kisi_eczane ke ON ke.kisi_id=k.kisi_id
  WHERE k.kisi_id=p_kisi AND lower(k.rol)='eczaci' AND k.auth_user_id IS NOT NULL AND ke.eczane_id=t.eczane_id AND ke.aktif_mi=true)
 AND EXISTS(SELECT 1 FROM public.eclub_cek_teslimat_outbox o WHERE o.talep_id=t.talep_id AND o.kanal='eposta' AND o.alici_kisi_id=p_kisi);
$fn$;

CREATE OR REPLACE FUNCTION public.eclub_cek_eposta_isi_al(p_lease_saniye integer DEFAULT 120)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_is public.eclub_cek_teslimat_outbox%rowtype;
BEGIN
  SELECT * INTO v_is
  FROM public.eclub_cek_teslimat_outbox
  WHERE kanal = 'eposta'
    AND deneme_sayisi < max_deneme
    AND sonraki_deneme_at <= now()
    AND (
      durum = 'bekliyor'
      OR durum = 'basarisiz'
      OR (durum = 'isleniyor' AND lease_bitis < now())
    )
  ORDER BY created_at, outbox_id
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  UPDATE public.eclub_cek_teslimat_outbox
  SET durum = 'isleniyor',
      deneme_sayisi = deneme_sayisi + 1,
      lease_bitis = now() + make_interval(secs => greatest(30, p_lease_saniye)),
      son_hata_kodu = NULL,
      guncellenme_at = now()
  WHERE outbox_id = v_is.outbox_id;

  RETURN jsonb_build_object(
    'outbox_id', v_is.outbox_id,
    'talep_id', v_is.talep_id,
    'alici_eposta', v_is.alici_eposta,
    'alici_adi', v_is.payload ->> 'alici_adi',
    'cek_kodu', v_is.payload ->> 'cek_kodu',
    'cek_tutari_tl', v_is.payload ->> 'cek_tutari_tl', 'kullanim_linki', v_is.payload ->> 'kullanim_linki'
  );
END $function$
;
DO $bildirim$
DECLARE s text;
BEGIN
 SELECT pg_get_functiondef('public.eclub_cek_uygulama_bildirimi_yaz()'::regprocedure) INTO s;
 s:=replace(s,'Eczanenizin Migros hediye çeki hazır. Çek kodunu Çek Taleplerim ekranından görüntüleyebilirsiniz.','Eczanenizin hediye çeki hazır. Ana eczacı kod ve varsa kullanım bağlantısını Hediye Çeki Takibi alanından görüntüleyebilir.');
 EXECUTE s;
END;
$bildirim$;
REVOKE ALL ON FUNCTION public.eclub_admin_kod_baglanti_teslim(uuid,uuid,uuid,text,text), public.eclub_cek_teslim_bilgisi(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_admin_kod_baglanti_teslim(uuid,uuid,uuid,text,text), public.eclub_cek_teslim_bilgisi(uuid,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eclub_kod_baglanti_teslimati_hazir;
