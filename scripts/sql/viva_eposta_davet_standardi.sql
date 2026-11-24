-- Süreç 13: Viva harici e-posta davet konu başlığının Title Case standardına güncellenmesi.
-- Kullanıcı çalıştırır. Mevcut tablo ve kayıtları değiştirmez; yalnız viva_eposta_is_al fonksiyonunu günceller.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-eposta-gonderim'));

CREATE OR REPLACE FUNCTION public.viva_eposta_is_al(p_kilit uuid,p_gonderici text,p_site text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_icerik jsonb; v_deneme integer; v_hash text;
BEGIN
 IF p_kilit IS NULL OR nullif(btrim(p_gonderici),'') IS NULL
  OR nullif(btrim(p_site),'') IS NULL THEN
  RAISE EXCEPTION 'Gönderim ayarları eksik.' USING ERRCODE='22023';
 END IF;

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
   'from',p_gonderici,'to',d.eposta,'subject','Cogniti Viva Canlı Yayın Davetiniz',
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

REVOKE ALL ON FUNCTION public.viva_eposta_is_al(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_eposta_is_al(uuid,text,text) TO service_role;
COMMIT;
