-- KULLANICI ÇALIŞTIRACAK. Esnek Paket satın alma altyapısı — Adım 1.
-- Ön koşul: firmalar, kullanicilar, merkezi tarife ve son Esnek Paket oranları.
-- Eski token hesapları, yüklemeler, tüketim fonksiyonları ve KKÖ değiştirilmez.
-- Bu adım UI/API açmaz; gönderim ve rezervasyon bağlantıları sonraki adımlardadır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('cogniti-esnek-siparis-kurulum',0));

CREATE TABLE IF NOT EXISTS public.cogniti_satin_alma_bakiyeleri (
 bakiye_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 bakiye_turu text NOT NULL CHECK(bakiye_turu IN ('kisisel','firma_ortak')),
 sahip_id uuid REFERENCES public.kullanicilar(kullanici_id),
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 CHECK((bakiye_turu='kisisel' AND sahip_id IS NOT NULL) OR (bakiye_turu='firma_ortak' AND sahip_id IS NULL)),
 UNIQUE(firma_id,bakiye_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS cogniti_satin_alma_kisisel_tek
 ON public.cogniti_satin_alma_bakiyeleri(firma_id,sahip_id) WHERE bakiye_turu='kisisel';
CREATE UNIQUE INDEX IF NOT EXISTS cogniti_satin_alma_ortak_tek
 ON public.cogniti_satin_alma_bakiyeleri(firma_id) WHERE bakiye_turu='firma_ortak';

CREATE TABLE IF NOT EXISTS public.cogniti_esnek_paket_siparisleri (
 siparis_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 firma_id uuid NOT NULL REFERENCES public.firmalar(firma_id),
 bakiye_id uuid NOT NULL,
 satin_alan_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 satin_alan_rol text NOT NULL,
 satin_alan_ad_soyad text NOT NULL,
 token_adedi integer NOT NULL CHECK(token_adedi>0),
 birim_fiyat numeric(14,2) NOT NULL CHECK(birim_fiyat>0 AND birim_fiyat<=1000000000),
 toplam_tutar numeric(18,2) GENERATED ALWAYS AS (token_adedi*birim_fiyat) STORED,
 tarife_surumu integer NOT NULL CHECK(tarife_surumu>0),
 islem_anahtari uuid NOT NULL,
 siparis_tarihi timestamptz NOT NULL DEFAULT statement_timestamp(),
 FOREIGN KEY(firma_id,bakiye_id) REFERENCES public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_id),
 UNIQUE(satin_alan_id,islem_anahtari),
 UNIQUE(siparis_id,firma_id,bakiye_id,token_adedi)
);
CREATE TABLE IF NOT EXISTS public.cogniti_esnek_paket_yuklemeleri (
 yukleme_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 siparis_id uuid NOT NULL UNIQUE,
 firma_id uuid NOT NULL,
 bakiye_id uuid NOT NULL,
 miktar integer NOT NULL CHECK(miktar>0),
 kalan integer NOT NULL CHECK(kalan BETWEEN 0 AND miktar),
 son_kullanim_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 CHECK(son_kullanim_at>created_at),
 FOREIGN KEY(siparis_id,firma_id,bakiye_id,miktar)
  REFERENCES public.cogniti_esnek_paket_siparisleri(siparis_id,firma_id,bakiye_id,token_adedi)
);
CREATE INDEX IF NOT EXISTS cogniti_esnek_siparis_firma_tarih ON public.cogniti_esnek_paket_siparisleri(firma_id,siparis_tarihi DESC,siparis_id);
CREATE INDEX IF NOT EXISTS cogniti_esnek_yukleme_bakiye ON public.cogniti_esnek_paket_yuklemeleri(bakiye_id,son_kullanim_at) WHERE kalan>0;
ALTER TABLE public.cogniti_satin_alma_bakiyeleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_esnek_paket_siparisleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cogniti_esnek_paket_yuklemeleri ENABLE ROW LEVEL SECURITY;
-- Sunucu da doğrudan tablo yazmaz: yalnız aşağıdaki denetimli fonksiyon.
REVOKE ALL ON public.cogniti_satin_alma_bakiyeleri,public.cogniti_esnek_paket_siparisleri,public.cogniti_esnek_paket_yuklemeleri
 FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.cogniti_esnek_paket_siparis_olustur(
 p_auth_id uuid,p_token_adedi integer,p_tarife_surumu integer,p_birim_fiyat numeric,p_anahtar uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE k record; s public.cogniti_esnek_paket_siparisleri%ROWTYPE; v_tur text; v_sahip uuid;
 v_bakiye uuid; v_surum integer; v_degerler jsonb; v_katsayi numeric; v_birim numeric; v_son timestamptz;
BEGIN
 IF p_auth_id IS NULL OR p_anahtar IS NULL OR p_token_adedi IS NULL OR p_token_adedi<=0
  OR p_tarife_surumu IS NULL OR p_tarife_surumu<=0 OR p_birim_fiyat IS NULL
  OR p_birim_fiyat::text IN ('NaN','Infinity','-Infinity') OR p_birim_fiyat<=0 OR p_birim_fiyat>1000000000
  OR p_birim_fiyat<>round(p_birim_fiyat,2) THEN
  RAISE EXCEPTION 'Sipariş bilgileri geçersiz.' USING ERRCODE='22023';
 END IF;
 -- Kimlik oturumdan gelir; rol, firma ve sahiplik istemciden alınmaz.
 SELECT u.kullanici_id,u.firma_id,lower(btrim(u.rol)) AS rol,u.ad,u.soyad INTO k
 FROM public.kullanicilar u JOIN public.firmalar f ON f.firma_id=u.firma_id
 WHERE u.kullanici_id=p_auth_id AND u.aktif_mi=true AND f.aktif=true FOR SHARE OF u,f;
 IF NOT FOUND THEN RAISE EXCEPTION 'Satın alma yetkiniz bulunmuyor.' USING ERRCODE='42501'; END IF;
 IF k.rol IN ('pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per') THEN
  v_tur:='kisisel'; v_sahip:=k.kullanici_id;
 ELSIF k.rol IN ('gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin') THEN
  v_tur:='firma_ortak'; v_sahip:=NULL;
 ELSE
  RAISE EXCEPTION 'Satın alma yetkiniz bulunmuyor.' USING ERRCODE='42501';
 END IF;
 -- Aynı kişinin aynı onayı eş zamanlı gelse de tek sipariş ve tek yükleme.
 PERFORM pg_advisory_xact_lock(hashtextextended('cogniti-esnek-siparis:'||p_auth_id::text||':'||p_anahtar::text,0));
 SELECT * INTO s FROM public.cogniti_esnek_paket_siparisleri
 WHERE satin_alan_id=p_auth_id AND islem_anahtari=p_anahtar;
 IF FOUND THEN
  IF s.firma_id<>k.firma_id OR s.token_adedi<>p_token_adedi OR s.tarife_surumu<>p_tarife_surumu OR s.birim_fiyat<>p_birim_fiyat THEN
   RAISE EXCEPTION 'İşlem anahtarı farklı siparişte kullanılmış.' USING ERRCODE='22023';
  END IF;
  RETURN jsonb_build_object('siparis_id',s.siparis_id,'yeniden_deneme',true);
 END IF;
 -- Fiyat ve sürüm satın alma anında sunucuda doğrulanır. Değişmiş fiyat için tekrar onay gerekir.
 SELECT surum,degerler INTO v_surum,v_degerler FROM public.cogniti_fiyat_tarifesi WHERE tekil FOR SHARE;
 SELECT katsayi INTO v_katsayi FROM public.cogniti_sm2_fiyat_oranlari WHERE token_adedi=p_token_adedi AND ay=0 FOR SHARE;
 v_birim:=round((v_degerler->>'kko_token_tl')::numeric*v_katsayi,2);
 IF v_birim IS NULL OR v_birim<=0 OR v_birim::text IN ('NaN','Infinity','-Infinity') OR v_surum IS NULL THEN
  RAISE EXCEPTION 'Esnek Paket fiyatı bulunamadı.' USING ERRCODE='22023';
 END IF;
 IF v_surum<>p_tarife_surumu OR v_birim<>p_birim_fiyat THEN
  RAISE EXCEPTION 'Fiyat güncellendi. Güncel tutarı yeniden onaylayın.' USING ERRCODE='P0001';
 END IF;
 INSERT INTO public.cogniti_satin_alma_bakiyeleri(firma_id,bakiye_turu,sahip_id)
 VALUES(k.firma_id,v_tur,v_sahip) ON CONFLICT DO NOTHING;
 SELECT bakiye_id INTO STRICT v_bakiye FROM public.cogniti_satin_alma_bakiyeleri
 WHERE firma_id=k.firma_id AND bakiye_turu=v_tur AND sahip_id IS NOT DISTINCT FROM v_sahip FOR UPDATE;
 INSERT INTO public.cogniti_esnek_paket_siparisleri(firma_id,bakiye_id,satin_alan_id,satin_alan_rol,satin_alan_ad_soyad,token_adedi,birim_fiyat,tarife_surumu,islem_anahtari)
 VALUES(k.firma_id,v_bakiye,k.kullanici_id,k.rol,concat_ws(' ',k.ad,k.soyad),p_token_adedi,v_birim,v_surum,p_anahtar)
 RETURNING * INTO s;
 -- 31 Aralık sonuna kadar: takip eden yılın 1 Ocak Türkiye gece yarısı hariç.
 v_son:=make_date(extract(year FROM statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::integer+1,1,1)::timestamp AT TIME ZONE 'Europe/Istanbul';
 INSERT INTO public.cogniti_esnek_paket_yuklemeleri(siparis_id,firma_id,bakiye_id,miktar,kalan,son_kullanim_at)
 VALUES(s.siparis_id,k.firma_id,v_bakiye,p_token_adedi,p_token_adedi,v_son);
 RETURN jsonb_build_object('siparis_id',s.siparis_id,'yeniden_deneme',false);
END;
$f$;
REVOKE ALL ON FUNCTION public.cogniti_esnek_paket_siparis_olustur(uuid,integer,integer,numeric,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cogniti_esnek_paket_siparis_olustur(uuid,integer,integer,numeric,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS cogniti_esnek_paket_siparis_adim1_kuruldu;
