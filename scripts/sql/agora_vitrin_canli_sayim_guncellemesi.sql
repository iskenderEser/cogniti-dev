-- KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: agora_kurulum_tamamlama.sql ve agora_partner_canli_yayin_kurulum.sql uygulanmış olmalıdır.
-- Agora vitrini üst özet kartlarında Video/Podcast yayınları ile Viva Canlı Yayınlarını ayırır; sol menü partner sayaçlarına Viva Canlı Yayınlarını ve toplam siparişlere canlı yayın siparişlerini dahil eder.
BEGIN;

ALTER TABLE public.agora_vitrin_haftalik_ozet
  ADD COLUMN IF NOT EXISTS canli_yayin_sayisi bigint;

CREATE OR REPLACE FUNCTION public.agora_vitrin_oku(p_auth_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $f$
DECLARE
  v_hafta date := (date_trunc('week', now() AT TIME ZONE 'Europe/Istanbul'))::date;
  v_firma uuid;
  v_partner_sayisi bigint;
  v_yayin_sayisi bigint;
  v_canli_yayin_sayisi bigint;
  v_siparis_sayisi bigint;
  ozet jsonb;
  partnerler jsonb;
  yayinlar jsonb;
BEGIN
  PERFORM public.agora_vitrin_yetki(p_auth_id);
  SELECT firma_id INTO v_firma FROM public.kullanicilar WHERE kullanici_id = p_auth_id;

  SELECT count(*) INTO v_partner_sayisi
  FROM public.agora_is_partnerleri p
  JOIN public.agora_partner_profilleri f USING (partner_id)
  WHERE p.ilk_giris_durumu = 'onaylandi'
    AND p.uyelik_durumu = 'onaylandi';

  SELECT count(*) INTO v_yayin_sayisi
  FROM public.agora_yayindaki_egitimler;

  SELECT count(DISTINCT e.canli_egitim_id) INTO v_canli_yayin_sayisi
  FROM public.agora_partner_canli_oturumlar o
  JOIN public.agora_partner_canli_egitimler e USING (canli_egitim_id)
  WHERE e.aktif_mi
    AND o.bitis_at > now()
    AND (o.durum = 'musait' OR (v_firma IS NOT NULL AND o.durum = 'rezerve' AND o.satin_alan_firma_id = v_firma));

  SELECT
    (SELECT count(*) FROM public.agora_siparisleri) +
    (SELECT count(*) FROM public.agora_canli_siparisleri)
  INTO v_siparis_sayisi;

  INSERT INTO public.agora_vitrin_haftalik_ozet(hafta, partner_sayisi, yayin_sayisi, canli_yayin_sayisi, siparis_sayisi)
  VALUES (v_hafta, v_partner_sayisi, v_yayin_sayisi, v_canli_yayin_sayisi, v_siparis_sayisi)
  ON CONFLICT (hafta) DO UPDATE SET
    partner_sayisi = EXCLUDED.partner_sayisi,
    yayin_sayisi = EXCLUDED.yayin_sayisi,
    canli_yayin_sayisi = EXCLUDED.canli_yayin_sayisi,
    siparis_sayisi = EXCLUDED.siparis_sayisi;

  ozet := jsonb_build_object(
    'partner_sayisi', v_partner_sayisi,
    'yayin_sayisi', v_yayin_sayisi,
    'canli_yayin_sayisi', v_canli_yayin_sayisi,
    'siparis_sayisi', v_siparis_sayisi,
    'hafta', v_hafta
  );

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.yayin_sayisi DESC, r.sirket_adi COLLATE "C", r.partner_id), '[]')
  INTO partnerler
  FROM (
    SELECT
      p.partner_id,
      f.sirket_adi,
      (
        (SELECT count(*) FROM public.agora_yayindaki_egitimler y WHERE y.partner_id = p.partner_id) +
        (SELECT count(DISTINCT e.canli_egitim_id)
         FROM public.agora_partner_canli_oturumlar o
         JOIN public.agora_partner_canli_egitimler e USING (canli_egitim_id)
         WHERE e.partner_id = p.partner_id
           AND e.aktif_mi
           AND o.bitis_at > now()
           AND (o.durum = 'musait' OR (v_firma IS NOT NULL AND o.durum = 'rezerve' AND o.satin_alan_firma_id = v_firma)))
      ) AS yayin_sayisi
    FROM public.agora_is_partnerleri p
    JOIN public.agora_partner_profilleri f USING (partner_id)
    WHERE p.ilk_giris_durumu = 'onaylandi'
      AND p.uyelik_durumu = 'onaylandi'
  ) r;

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.yayinlandi_at DESC, r.egitim_id), '[]')
  INTO yayinlar
  FROM (
    SELECT y.*, e.partner_egitim_id, public.agora_partner_kart_video_guid(y.egitim_id) AS kapak_video_guid,
      (SELECT count(*) FROM public.agora_vitrin_etkilesimleri i JOIN public.kullanicilar k ON k.kullanici_id = i.auth_id JOIN public.firmalar f USING (firma_id) WHERE i.egitim_id = y.egitim_id AND i.begeni AND k.aktif_mi AND f.aktif) AS begeni_sayisi,
      (SELECT count(*) FROM public.agora_vitrin_etkilesimleri i JOIN public.kullanicilar k ON k.kullanici_id = i.auth_id JOIN public.firmalar f USING (firma_id) WHERE i.egitim_id = y.egitim_id AND i.favori AND k.aktif_mi AND f.aktif) AS favori_sayisi,
      coalesce(i.begeni, false) AS begeni_mi,
      coalesce(i.favori, false) AS favori_mi,
      (SELECT count(*) FROM public.agora_siparisleri s WHERE s.egitim_id = y.egitim_id) AS siparis_sayisi,
      e.surum,
      EXISTS(SELECT 1 FROM public.agora_siparisleri s WHERE s.alici_id = p_auth_id AND s.egitim_id = y.egitim_id) AS satin_alindi
    FROM public.agora_yayindaki_egitimler y
    JOIN public.agora_partner_egitimleri e USING (egitim_id)
    LEFT JOIN public.agora_vitrin_etkilesimleri i ON i.egitim_id = y.egitim_id AND i.auth_id = p_auth_id
  ) r;

  RETURN jsonb_build_object('stat', ozet, 'partnerler', partnerler, 'yayinlar', yayinlar);
END;
$f$;

COMMIT;
