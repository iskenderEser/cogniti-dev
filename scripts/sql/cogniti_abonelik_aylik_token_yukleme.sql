-- Kullanıcı çalıştıracak. Ön koşul: abonelik ilk token yükleme kurulumu ve pg_cron.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS cogniti_abonelik_siparis_ay_tek
 ON public.cogniti_esnek_paket_yuklemeleri (
  abonelik_siparis_id, (date_trunc('month', created_at AT TIME ZONE 'Europe/Istanbul'))
 ) WHERE abonelik_siparis_id IS NOT NULL;
DROP INDEX IF EXISTS public.cogniti_abonelik_ilk_yukleme_tek;

CREATE OR REPLACE FUNCTION public.cogniti_abonelik_aylik_token_yukle()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE
 an timestamptz := statement_timestamp();
 ay_baslangici timestamptz := date_trunc('month', an AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
 ay_sonu timestamptz := (date_trunc('month', an AT TIME ZONE 'Europe/Istanbul') + interval '1 month') AT TIME ZONE 'Europe/Istanbul';
 siparis record;
 eklenen integer;
 toplam integer := 0;
BEGIN
 FOR siparis IN
  SELECT s.siparis_id,s.firma_id,s.aylik_token,b.bakiye_id
  FROM public.cogniti_abonelik_siparisleri s
  JOIN public.firmalar f ON f.firma_id=s.firma_id AND f.aktif
  JOIN public.cogniti_satin_alma_bakiyeleri b
   ON b.firma_id=s.firma_id AND b.bakiye_turu=s.hesap_turu
   AND b.sahip_id IS NOT DISTINCT FROM s.sahip_id
  WHERE (s.sahip_id IS NULL OR EXISTS (
   SELECT 1 FROM public.kullanicilar k WHERE k.kullanici_id=s.sahip_id AND k.firma_id=s.firma_id AND k.aktif_mi
  ))
  AND EXISTS (
   SELECT 1 FROM public.cogniti_esnek_paket_yuklemeleri y
   WHERE y.abonelik_siparis_id=s.siparis_id AND y.bakiye_id=b.bakiye_id AND y.created_at<ay_baslangici
  )
  AND NOT EXISTS (
   SELECT 1 FROM public.cogniti_esnek_paket_yuklemeleri y
   WHERE y.abonelik_siparis_id=s.siparis_id AND y.created_at>=ay_baslangici
  )
  ORDER BY b.bakiye_id,s.siparis_id
 LOOP
  PERFORM 1 FROM public.cogniti_satin_alma_bakiyeleri WHERE bakiye_id=siparis.bakiye_id FOR UPDATE;
  INSERT INTO public.cogniti_esnek_paket_yuklemeleri(
   abonelik_siparis_id,firma_id,bakiye_id,miktar,kalan,created_at,son_kullanim_at
  ) VALUES (
   siparis.siparis_id,siparis.firma_id,siparis.bakiye_id,siparis.aylik_token,siparis.aylik_token,an,ay_sonu
  )
  ON CONFLICT (abonelik_siparis_id, (date_trunc('month', created_at AT TIME ZONE 'Europe/Istanbul')))
   WHERE abonelik_siparis_id IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS eklenen = ROW_COUNT;
  IF eklenen > 0 THEN
   UPDATE public.cogniti_kko_hesap_secimleri
   SET etkin=false,kapanma_at=an WHERE bakiye_id=siparis.bakiye_id AND etkin;
   toplam := toplam + eklenen;
  END IF;
 END LOOP;
 RETURN toplam;
END;
$f$;

REVOKE ALL ON FUNCTION public.cogniti_abonelik_aylik_token_yukle() FROM PUBLIC,anon,authenticated,service_role;

-- Türkiye saatiyle ay başının ilk saatinde başlar. Saatlik tekrar, geçici kesintiyi telafi eder.
-- İş yalnız cari ayı yükler. Eski aylara geriye dönük token yazmaz.
SELECT cron.schedule('cogniti_abonelik_aylik_token', '0 * * * *',
 'SELECT public.cogniti_abonelik_aylik_token_yukle();');

COMMIT;
SELECT true AS cogniti_abonelik_aylik_token_yukleme_kuruldu;
