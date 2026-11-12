-- Güncel merkezi tarife ve abonelik paket yönetimi üzerine uygulanır.
BEGIN;
LOCK TABLE public.cogniti_fiyat_tarifesi IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION public.cogniti_fiyat_degerleri_gecerli(p_degerler jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $f$
DECLARE anahtar text; deger jsonb; sayi numeric; anahtarlar text[] := ARRAY['kko_token_miktari','kko_asim_tl','kko_token_tl','paket_10k_token_miktari','paket_10k_token_tl','paket_10k_asim_tl','paket_30k_token_miktari','paket_30k_token_tl','paket_30k_asim_tl','paket_75k_token_miktari','paket_75k_token_tl','paket_75k_asim_tl','uretim_video_tl','uretim_podcast_tl','uretim_brosur_tl','uretim_literatur_tl','uretim_soru_seti_tl','banner_haftalik_token','viva_kisi_dakika_usd','viva_usd_tl','viva_satis_katsayisi','paket_25k_token_miktari','paket_25k_token_tl','esnek_2500_token_tl','esnek_50000_token_tl']::text[];
BEGIN
 IF p_degerler IS NULL OR jsonb_typeof(p_degerler) <> 'object' THEN RETURN false; END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(p_degerler)) <> cardinality(anahtarlar) THEN RETURN false; END IF;
 FOREACH anahtar IN ARRAY anahtarlar LOOP
  IF NOT p_degerler ? anahtar THEN RETURN false; END IF;
  deger := p_degerler->anahtar;
  IF anahtar='uretim_literatur_tl' AND deger='null'::jsonb THEN CONTINUE; END IF;
  IF jsonb_typeof(deger) <> 'number' THEN RETURN false; END IF;
  sayi := deger::text::numeric;
  IF (CASE WHEN anahtar='kko_asim_tl' THEN sayi < 0 ELSE sayi <= 0 END) OR sayi > 1000000000 OR sayi <> round(sayi,6)
    OR (anahtar IN ('esnek_2500_token_tl','esnek_50000_token_tl') AND sayi <> round(sayi,2))
    OR (anahtar IN ('kko_token_miktari','banner_haftalik_token','paket_10k_token_miktari','paket_30k_token_miktari','paket_75k_token_miktari','paket_25k_token_miktari') AND sayi <> trunc(sayi)) THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END;
$f$;

DO $migration$
DECLARE
  tarife public.cogniti_fiyat_tarifesi%ROWTYPE;
BEGIN
  SELECT * INTO STRICT tarife FROM public.cogniti_fiyat_tarifesi WHERE tekil;
  IF NOT (tarife.degerler ? 'uretim_soru_seti_tl') THEN
    UPDATE public.cogniti_fiyat_tarifesi
    SET degerler = degerler || '{"uretim_soru_seti_tl":2000}'::jsonb,
        surum = surum + 1,
        guncellendi_at = statement_timestamp()
    WHERE tekil
    RETURNING * INTO tarife;

    INSERT INTO public.cogniti_fiyat_tarifesi_gecmisi (
      surum, degerler, kaydedildi_at, kaydeden, abonelik_paketleri
    ) VALUES (
      tarife.surum, tarife.degerler, tarife.guncellendi_at, tarife.guncelleyen, tarife.abonelik_paketleri
    );
  END IF;

  IF NOT public.cogniti_fiyat_degerleri_gecerli(tarife.degerler) THEN
    RAISE EXCEPTION 'Güncel fiyat tarifesi doğrulanamadı.';
  END IF;
END;
$migration$;

COMMIT;
SELECT true AS cogniti_soru_seti_fiyat_tarifesi_kuruldu;
