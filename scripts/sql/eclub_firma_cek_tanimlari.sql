-- Adım 2: Firma bazında E-Club dönüşüm tanımı. PM ve hesaplama fonksiyonlarını değiştirmez.
BEGIN;
CREATE TABLE IF NOT EXISTS public.eclub_firma_cek_tanimlari (
 firma_id uuid PRIMARY KEY REFERENCES public.firmalar(firma_id),
 karsilik_puan integer NOT NULL CHECK(karsilik_puan>0),
 karsilik_tl numeric(12,2) NOT NULL CHECK(karsilik_tl>0 AND karsilik_tl<=999999999.99),
 surum integer NOT NULL DEFAULT 1 CHECK(surum>0),
 guncelleyen_id uuid NOT NULL REFERENCES public.kullanicilar(kullanici_id),
 guncellenme_at timestamptz NOT NULL DEFAULT now(),
 CHECK(firma_id<>'15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid)
);
ALTER TABLE public.eclub_firma_cek_tanimlari ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.eclub_firma_cek_tanimlari FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.eclub_firma_cek_tanimlari TO service_role;

CREATE OR REPLACE FUNCTION public.admin_eclub_firma_cek_tanimi_kaydet(
 p_admin_id uuid,p_firma_id uuid,p_puan integer,p_tl numeric,p_surum integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE v_tanim public.eclub_firma_cek_tanimlari%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kullanicilar WHERE kullanici_id=p_admin_id AND lower(rol)='admin') THEN
  RAISE EXCEPTION 'Bu işlem yalnız admin tarafından yapılabilir.' USING ERRCODE='42501';
 END IF;
 IF p_puan IS NULL OR p_puan<=0 OR p_tl IS NULL OR p_tl<=0 OR p_tl>999999999.99
  OR p_tl::text IN ('NaN','Infinity','-Infinity') OR round(p_tl,2)<>p_tl OR p_surum IS NULL OR p_surum<0
  OR p_firma_id IS NULL OR p_firma_id='15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid THEN
  RAISE EXCEPTION 'Geçerli firma, pozitif tam sayı puan ve en fazla iki ondalıklı TL girin.' USING ERRCODE='22023';
 END IF;
 PERFORM 1 FROM public.firmalar WHERE firma_id=p_firma_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='P0002'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('eclub-firma-cek-tanimi/'||p_firma_id::text,0));
 SELECT * INTO v_tanim FROM public.eclub_firma_cek_tanimlari WHERE firma_id=p_firma_id FOR UPDATE;
 IF coalesce(v_tanim.surum,0)<>p_surum THEN
  RAISE EXCEPTION 'Tanım başka bir işlemde değişti. Listeyi yenileyip tekrar deneyin.' USING ERRCODE='40001';
 END IF;
 INSERT INTO public.eclub_firma_cek_tanimlari(firma_id,karsilik_puan,karsilik_tl,guncelleyen_id)
 VALUES(p_firma_id,p_puan,p_tl,p_admin_id)
 ON CONFLICT(firma_id) DO UPDATE SET karsilik_puan=excluded.karsilik_puan,karsilik_tl=excluded.karsilik_tl,
 surum=eclub_firma_cek_tanimlari.surum+1,guncelleyen_id=p_admin_id,guncellenme_at=clock_timestamp()
 RETURNING * INTO v_tanim;
 RETURN jsonb_build_object('firma_id',v_tanim.firma_id,'karsilik_puan',v_tanim.karsilik_puan,
 'karsilik_tl',v_tanim.karsilik_tl,'surum',v_tanim.surum,'guncellenme_at',v_tanim.guncellenme_at);
END;
$fn$;
REVOKE ALL ON FUNCTION public.admin_eclub_firma_cek_tanimi_kaydet(uuid,uuid,integer,numeric,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_eclub_firma_cek_tanimi_kaydet(uuid,uuid,integer,numeric,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS eclub_firma_cek_tanimlari_hazir;
