-- Viva e-posta davetleri / adım 5. KULLANICI 8. adımda uygulayacak.
-- Önkoşul: viva_eposta_davetleri.sql. Mevcut Viva cron'u kullanılır; yeni zamanlayıcı açılmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-eposta-gonderim'));

-- İlk denemedeki gönderici, alıcı ve yayın bilgileri tekrarlar için sabit tutulur.
-- Ham davet token'ı, bağlantı ve e-posta metni burada saklanmaz.
ALTER TABLE public.viva_eposta_gonderimleri ADD COLUMN IF NOT EXISTS icerik jsonb;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='viva_eposta_icerik_nesne') THEN
  ALTER TABLE public.viva_eposta_gonderimleri ADD CONSTRAINT viva_eposta_icerik_nesne
   CHECK(icerik IS NULL OR jsonb_typeof(icerik)='object');
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.viva_eposta_is_al(p_kilit uuid,p_gonderici text,p_site text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_icerik jsonb; v_deneme integer; v_hash text;
BEGIN
 IF p_kilit IS NULL OR nullif(btrim(p_gonderici),'') IS NULL
  OR nullif(btrim(p_site),'') IS NULL THEN
  RAISE EXCEPTION 'Gönderim ayarları eksik.' USING ERRCODE='22023';
 END IF;

 -- Biten/iptal edilen yayınlardan e-posta çıkmaz; gönderilmiş kayıt geçmişte kalır.
 UPDATE viva_eposta_gonderimleri g SET durum='iptal',sonraki_deneme=NULL,
  kilit_id=NULL,kilit_bitis=NULL,updated_at=now()
 WHERE g.davet_id IN (
  SELECT g2.davet_id FROM viva_eposta_gonderimleri g2
   JOIN viva_davetler d2 ON d2.davet_id=g2.davet_id
   JOIN viva_etkinlikler e2 ON e2.etkinlik_id=d2.etkinlik_id
  WHERE g2.durum IN ('bekliyor','hata','gonderiliyor')
   AND (e2.durum IN ('iptal','sona_erdi') OR e2.bitis<=now() OR d2.iptal)
   AND (g2.durum<>'gonderiliyor' OR g2.kilit_bitis<=now())
  ORDER BY g2.created_at LIMIT 30 FOR UPDATE OF g2 SKIP LOCKED
 );

 -- Resend aynı anahtarı yalnız 24 saat tutar. Belirsiz eski işlemi otomatik tekrar gönderme.
 UPDATE viva_eposta_gonderimleri g SET durum='kontrol',sonraki_deneme=NULL,
  kilit_id=NULL,kilit_bitis=NULL,hata_kodu='IDEMPOTENCY_SURESI_DOLDU',updated_at=now()
 WHERE g.davet_id IN (
  SELECT g2.davet_id FROM viva_eposta_gonderimleri g2
  WHERE g2.durum IN ('hata','gonderiliyor') AND g2.ilk_deneme<=now()-interval '23 hours'
   AND (g2.durum<>'hata' OR g2.sonraki_deneme IS NOT NULL)
   AND (g2.durum<>'gonderiliyor' OR g2.kilit_bitis<=now())
  ORDER BY g2.created_at LIMIT 30 FOR UPDATE OF g2 SKIP LOCKED
 );

 SELECT g.davet_id INTO v_id FROM viva_eposta_gonderimleri g
 JOIN viva_davetler d ON d.davet_id=g.davet_id
 JOIN viva_etkinlikler e ON e.etkinlik_id=d.etkinlik_id
 WHERE NOT d.iptal AND e.durum IN ('planlandi','canli') AND e.bitis>now()
  AND (g.durum='bekliyor'
   OR (g.durum='hata' AND g.sonraki_deneme<=now())
   OR (g.durum='gonderiliyor' AND g.kilit_bitis<=now()))
  AND (g.ilk_deneme IS NULL OR g.ilk_deneme>now()-interval '23 hours')
 ORDER BY g.created_at,g.davet_id LIMIT 1 FOR UPDATE OF g SKIP LOCKED;
 IF v_id IS NULL THEN RETURN NULL; END IF;

 UPDATE viva_eposta_gonderimleri g SET
  icerik=coalesce(g.icerik,(SELECT jsonb_build_object(
   'from',p_gonderici,'to',d.eposta,'subject','Cogniti Viva yayın daveti',
   'baslik',e.baslik,'baslangic',e.baslangic,'site',p_site)
   FROM viva_davetler d JOIN viva_etkinlikler e ON e.etkinlik_id=d.etkinlik_id
   WHERE d.davet_id=v_id)),
  durum='gonderiliyor',deneme_sayisi=g.deneme_sayisi+1,
  ilk_deneme=coalesce(g.ilk_deneme,now()),son_deneme=now(),sonraki_deneme=NULL,
  kilit_id=p_kilit,kilit_bitis=now()+interval '2 minutes',hata_kodu=NULL,updated_at=now()
 WHERE g.davet_id=v_id RETURNING g.icerik,g.deneme_sayisi INTO v_icerik,v_deneme;
 SELECT d.token_hash INTO v_hash FROM viva_davetler d WHERE d.davet_id=v_id;
 RETURN jsonb_build_object('davet_id',v_id,'kilit_id',p_kilit,'token_hash',v_hash,
  'deneme_sayisi',v_deneme,'icerik',v_icerik);
END $$;

CREATE OR REPLACE FUNCTION public.viva_eposta_is_bitir(
 p_davet uuid,p_kilit uuid,p_sonuc text,p_hata_kodu text DEFAULT NULL,
 p_saglayici_id text DEFAULT NULL,p_bekleme_saniye integer DEFAULT 0
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_sayi integer;
BEGIN
 IF p_davet IS NULL OR p_kilit IS NULL OR p_sonuc IS NULL OR p_sonuc NOT IN ('gonderildi','hata','kontrol')
  OR p_bekleme_saniye IS NULL OR p_bekleme_saniye NOT BETWEEN 0 AND 3600
  OR length(coalesce(p_hata_kodu,''))>80 OR length(coalesce(p_saglayici_id,''))>200
  OR (p_sonuc='gonderildi' AND nullif(p_saglayici_id,'') IS NULL)
 THEN RAISE EXCEPTION 'Gönderim sonucu geçersiz.' USING ERRCODE='22023'; END IF;
 UPDATE viva_eposta_gonderimleri SET durum=p_sonuc,
  gonderim_zamani=CASE WHEN p_sonuc='gonderildi' THEN now() ELSE gonderim_zamani END,
  saglayici_id=CASE WHEN p_sonuc='gonderildi' THEN p_saglayici_id ELSE saglayici_id END,
  hata_kodu=CASE WHEN p_sonuc='gonderildi' THEN NULL ELSE p_hata_kodu END,
  sonraki_deneme=CASE WHEN p_sonuc='hata' AND p_bekleme_saniye>0
   THEN now()+make_interval(secs=>p_bekleme_saniye) ELSE NULL END,
  kilit_id=NULL,kilit_bitis=NULL,updated_at=now()
 WHERE davet_id=p_davet AND kilit_id=p_kilit AND durum='gonderiliyor'
  AND EXISTS(SELECT 1 FROM viva_davetler d JOIN viva_etkinlikler e USING(etkinlik_id)
   WHERE d.davet_id=p_davet AND NOT d.iptal AND e.durum IN ('planlandi','canli') AND e.bitis>now());
 GET DIAGNOSTICS v_sayi=ROW_COUNT;
 RETURN v_sayi=1;
END $$;

REVOKE ALL ON FUNCTION public.viva_eposta_is_al(uuid,text,text),
 public.viva_eposta_is_bitir(uuid,uuid,text,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_eposta_is_al(uuid,text,text),
 public.viva_eposta_is_bitir(uuid,uuid,text,text,text,integer) TO service_role;
COMMIT;

SELECT to_regprocedure('public.viva_eposta_is_al(uuid,text,text)') IS NOT NULL AS is_al_fonksiyonu,
 to_regprocedure('public.viva_eposta_is_bitir(uuid,uuid,text,text,text,integer)') IS NOT NULL AS is_bitir_fonksiyonu,
 NOT has_function_privilege('anon','public.viva_eposta_is_al(uuid,text,text)','EXECUTE') AS anon_kapali,
 NOT has_function_privilege('authenticated','public.viva_eposta_is_al(uuid,text,text)','EXECUTE') AS istemci_kapali,
 has_function_privilege('service_role','public.viva_eposta_is_al(uuid,text,text)','EXECUTE') AS sunucu_acik;
