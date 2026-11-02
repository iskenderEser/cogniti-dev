-- FirmaStore: kullanıcı iptali <12 saat; admin kuyruğu >=12 saat.
-- Erken iptal edilenler admin kuyruğuna hiçbir zaman girmez.
-- Mevcut sipariş/puan/stok verileri dönüştürülmez. Cron gerekmez.
BEGIN;

CREATE OR REPLACE FUNCTION public.store_bekleme_bitti_mi(p_created timestamptz, p_simdi timestamptz)
RETURNS boolean LANGUAGE sql IMMUTABLE STRICT
SET search_path = pg_catalog, public, pg_temp
AS $$ SELECT p_simdi >= p_created + interval '12 hours' $$;

CREATE OR REPLACE FUNCTION public.store_admin_kuyrukta_mi(
  p_created timestamptz, p_durum text, p_guncellenme timestamptz, p_simdi timestamptz
) RETURNS boolean LANGUAGE sql IMMUTABLE STRICT
SET search_path = pg_catalog, public, pg_temp
AS $$ SELECT public.store_bekleme_bitti_mi(p_created,p_simdi)
  AND (p_durum <> 'iptal' OR public.store_bekleme_bitti_mi(p_created,p_guncellenme)) $$;

CREATE OR REPLACE FUNCTION public.store_kullanici_siparis_listesi(p_kullanici_id uuid, p_durum text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $fn$
DECLARE v_simdi timestamptz := clock_timestamp(); v_siparisler jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(x.veri ORDER BY x.created_at DESC,x.siparis_id),'[]'::jsonb)
    INTO v_siparisler FROM (
      SELECT s.created_at,s.siparis_id,jsonb_build_object(
        'siparis_id',s.siparis_id,'kullanici_id',s.kullanici_id,'urun_id',s.urun_id,
        'adet',s.adet,'puan_birim_fiyat',s.puan_birim_fiyat,'toplam_puan',s.toplam_puan,
        'firma_id',s.firma_id,'cek_birim_tl',s.cek_birim_tl,'toplam_tl',s.toplam_tl,
        'durum',s.durum,'kargo_firmasi',s.kargo_firmasi,'kargo_takip_no',s.kargo_takip_no,
        'iptal_sebebi',s.iptal_sebebi,'created_at',s.created_at,
        'guncellenme_at',s.guncellenme_at,'teslim_alma_at',s.teslim_alma_at,
        'iptal_son_at',s.created_at + interval '12 hours',
        'iptal_edilebilir',s.durum='beklemede' AND NOT public.store_bekleme_bitti_mi(s.created_at,v_simdi),
        'admin_aktarildi',public.store_admin_kuyrukta_mi(s.created_at,s.durum,s.guncellenme_at,v_simdi),
        'store_urunler',CASE WHEN u.urun_id IS NULL THEN NULL ELSE jsonb_build_object('ad',u.ad,'gorsel_url',u.gorsel_url) END
      ) AS veri
      FROM public.store_siparisler s LEFT JOIN public.store_urunler u ON u.urun_id=s.urun_id
      WHERE s.kullanici_id=p_kullanici_id AND (p_durum IS NULL OR s.durum=p_durum)
    ) x;
  RETURN jsonb_build_object('sunucu_zamani',v_simdi,'siparisler',v_siparisler);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.store_admin_siparis_listesi(p_durum text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $fn$
DECLARE v_simdi timestamptz := clock_timestamp(); v_siparisler jsonb; v_sonraki timestamptz;
BEGIN
  SELECT coalesce(jsonb_agg(x.veri ORDER BY x.created_at DESC,x.siparis_id),'[]'::jsonb)
    INTO v_siparisler FROM (
      SELECT s.created_at,s.siparis_id,jsonb_build_object(
        'siparis_id',s.siparis_id,'kullanici_id',s.kullanici_id,'urun_id',s.urun_id,
        'adet',s.adet,'puan_birim_fiyat',s.puan_birim_fiyat,'toplam_puan',s.toplam_puan,
        'firma_id',s.firma_id,'cek_birim_tl',s.cek_birim_tl,'toplam_tl',s.toplam_tl,
        'durum',s.durum,'kargo_firmasi',s.kargo_firmasi,'kargo_takip_no',s.kargo_takip_no,
        'iptal_sebebi',s.iptal_sebebi,'created_at',s.created_at,
        'guncellenme_at',s.guncellenme_at,'teslim_alma_at',s.teslim_alma_at,
        'store_urunler',CASE WHEN u.urun_id IS NULL THEN NULL ELSE jsonb_build_object('ad',u.ad,'gorsel_url',u.gorsel_url) END,
        'kullanicilar',CASE WHEN k.kullanici_id IS NULL THEN NULL ELSE jsonb_build_object('ad',k.ad,'soyad',k.soyad,'eposta',k.eposta,'rol',k.rol) END
      ) AS veri
      FROM public.store_siparisler s
      LEFT JOIN public.store_urunler u ON u.urun_id=s.urun_id
      LEFT JOIN public.kullanicilar k ON k.kullanici_id=s.kullanici_id
      WHERE public.store_admin_kuyrukta_mi(s.created_at,s.durum,s.guncellenme_at,v_simdi)
        AND (p_durum IS NULL OR s.durum=p_durum)
    ) x;
  SELECT min(s.created_at+interval '12 hours') INTO v_sonraki
    FROM public.store_siparisler s WHERE s.durum='beklemede'
      AND NOT public.store_bekleme_bitti_mi(s.created_at,v_simdi);
  RETURN jsonb_build_object('sunucu_zamani',v_simdi,'sonraki_aktarim_at',v_sonraki,'siparisler',v_siparisler);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.store_siparis_iptal(
  p_siparis_id uuid,p_iptal_eden_id uuid,p_is_admin boolean,p_sebep text
) RETURNS TABLE(ok boolean,hata text) LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $fn$
DECLARE s public.store_siparisler%ROWTYPE; v_sahip uuid; v_simdi timestamptz;
BEGIN
  IF p_siparis_id IS NULL OR p_iptal_eden_id IS NULL OR p_is_admin IS NULL THEN
    RETURN QUERY SELECT false,'İptal bilgileri eksik.'::text; RETURN;
  END IF;
  SELECT kullanici_id INTO v_sahip FROM public.store_siparisler WHERE siparis_id=p_siparis_id;
  IF NOT FOUND THEN RETURN QUERY SELECT false,'Sipariş bulunamadı.'::text; RETURN; END IF;
  -- Tekli/toplu taleple aynı sıra: kullanıcı kilidi -> sipariş -> ürün.
  PERFORM pg_advisory_xact_lock(hashtextextended('hbstore:siparis:'||v_sahip::text,0));
  SELECT * INTO s FROM public.store_siparisler WHERE siparis_id=p_siparis_id FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT false,'Sipariş bulunamadı.'::text; RETURN; END IF;
  IF s.durum='iptal' THEN RETURN QUERY SELECT false,'Sipariş zaten iptal edilmiş.'::text; RETURN; END IF;
  IF s.durum='teslim_edildi' THEN RETURN QUERY SELECT false,'Teslim edilmiş sipariş iptal edilemez.'::text; RETURN; END IF;
  IF NOT p_is_admin AND (s.kullanici_id<>p_iptal_eden_id OR s.durum<>'beklemede') THEN
    RETURN QUERY SELECT false,'Bu siparişi iptal etme yetkiniz yok.'::text; RETURN;
  END IF;
  -- Stok kilidinde beklenirken süre dolabilir; saat kilitten SONRA okunur.
  PERFORM 1 FROM public.store_urunler WHERE urun_id=s.urun_id FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT false,'Siparişin çeki bulunamadı.'::text; RETURN; END IF;
  v_simdi:=clock_timestamp();
  IF NOT p_is_admin AND public.store_bekleme_bitti_mi(s.created_at,v_simdi) THEN
    RETURN QUERY SELECT false,'12 saatlik iptal süresi doldu; talep admin işlemine aktarıldı.'::text; RETURN;
  END IF;
  IF p_is_admin AND NOT public.store_admin_kuyrukta_mi(s.created_at,s.durum,s.guncellenme_at,v_simdi) THEN
    RETURN QUERY SELECT false,'Talep kullanıcının 12 saatlik iptal süresinde; admin işlemine açık değil.'::text; RETURN;
  END IF;
  UPDATE public.store_urunler SET stok=stok+s.adet,updated_at=v_simdi WHERE urun_id=s.urun_id;
  UPDATE public.store_siparisler SET durum='iptal',iptal_sebebi=p_sebep,guncellenme_at=v_simdi WHERE siparis_id=s.siparis_id;
  INSERT INTO public.store_puan_harcamalari(kullanici_id,siparis_id,puan_miktari,tur)
    VALUES(s.kullanici_id,s.siparis_id,s.toplam_puan,'iade');
  RETURN QUERY SELECT true,NULL::text;
END;
$fn$;

-- Eski admin işlem endpoint'i veya başka durum güncellemesi erken işleyemez;
-- iptal olmuş talep eşzamanlı bir güncellemeyle yeniden açılmaz.
CREATE OR REPLACE FUNCTION public.store_admin_islem_suresi_kontrol()
RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $fn$
BEGIN
  IF NEW.durum IS DISTINCT FROM OLD.durum THEN
    IF OLD.durum IN ('iptal','teslim_edildi') THEN
      RAISE EXCEPTION 'Tamamlanmış veya iptal edilmiş talebin durumu değiştirilemez.' USING ERRCODE='22023';
    END IF;
    IF NEW.durum<>'iptal' AND NOT public.store_bekleme_bitti_mi(OLD.created_at,clock_timestamp()) THEN
      RAISE EXCEPTION '12 saatlik kullanıcı iptal süresi dolmadan admin işlemi yapılamaz.' USING ERRCODE='22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS store_admin_islem_suresi ON public.store_siparisler;
CREATE TRIGGER store_admin_islem_suresi BEFORE UPDATE OF durum ON public.store_siparisler
  FOR EACH ROW EXECUTE FUNCTION public.store_admin_islem_suresi_kontrol();

REVOKE ALL ON FUNCTION public.store_kullanici_siparis_listesi(uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.store_admin_siparis_listesi(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.store_siparis_iptal(uuid,uuid,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.store_kullanici_siparis_listesi(uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.store_admin_siparis_listesi(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.store_siparis_iptal(uuid,uuid,boolean,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.store_admin_siparis_listesi(text)') IS NOT NULL
 AND to_regprocedure('public.store_kullanici_siparis_listesi(uuid,text)') IS NOT NULL
 AND EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='store_admin_islem_suresi'
   AND tgrelid='public.store_siparisler'::regclass AND NOT tgisinternal)
 AS firmastore_12_saat_bekleme_hazir;
