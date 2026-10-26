-- Viva e-posta davetleri / adım 7. KULLANICI ÇALIŞTIRACAK.
-- Önkoşul: viva_eposta_davetleri.sql, viva_eposta_gonderim_isleyici.sql.
-- Yalnız bekleyen/hatalı daveti mevcut kimlik ve Resend anahtarıyla kuyruğa alır.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('cogniti-viva-eposta-yeniden-dene'));

CREATE OR REPLACE FUNCTION public.viva_eposta_yeniden_dene(
 p_auth uuid,p_etkinlik uuid,p_davet uuid,p_surum integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e viva_etkinlikler%ROWTYPE; d viva_davetler%ROWTYPE; g viva_eposta_gonderimleri%ROWTYPE;
BEGIN
 IF p_auth IS NULL OR p_etkinlik IS NULL OR p_davet IS NULL OR p_surum IS NULL OR p_surum<1
 THEN RAISE EXCEPTION 'Davet bilgileri geçersiz.' USING ERRCODE='22023'; END IF;
 -- Viva düzenleme ve iptal işlemleriyle aynı kilit sırası.
 SELECT * INTO e FROM viva_etkinlikler WHERE etkinlik_id=p_etkinlik FOR UPDATE;
 IF NOT FOUND OR e.sahip_id<>p_auth OR NOT viva_sahip_aktif(p_etkinlik)
 THEN RAISE EXCEPTION 'Davet yönetme yetkiniz yok.' USING ERRCODE='42501'; END IF;
 IF e.surum<>p_surum THEN RAISE EXCEPTION 'Etkinlik değişti.' USING ERRCODE='40001'; END IF;
 IF e.durum NOT IN ('planlandi','canli') OR e.bitis<=now()
 THEN RAISE EXCEPTION 'Etkinlik için davet gönderilemez.' USING ERRCODE='22023'; END IF;
 SELECT * INTO d FROM viva_davetler WHERE davet_id=p_davet AND etkinlik_id=p_etkinlik FOR UPDATE;
 IF NOT FOUND OR d.iptal THEN RAISE EXCEPTION 'Davet geçersiz.' USING ERRCODE='22023'; END IF;
 SELECT * INTO g FROM viva_eposta_gonderimleri WHERE davet_id=p_davet FOR UPDATE;
 IF NOT FOUND OR g.durum NOT IN ('bekliyor','hata')
  OR g.deneme_sayisi>=5 OR (g.ilk_deneme IS NOT NULL AND g.ilk_deneme<=now()-interval '23 hours')
 THEN RAISE EXCEPTION 'Bu davet yeniden gönderime uygun değil.' USING ERRCODE='22023'; END IF;
 UPDATE viva_eposta_gonderimleri SET durum='bekliyor',sonraki_deneme=NULL,
  hata_kodu=NULL,updated_at=now() WHERE davet_id=p_davet;
 RETURN viva_eposta_detay(p_auth,p_etkinlik);
END $$;

REVOKE ALL ON FUNCTION public.viva_eposta_yeniden_dene(uuid,uuid,uuid,integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.viva_eposta_yeniden_dene(uuid,uuid,uuid,integer) TO service_role;
COMMIT;

SELECT to_regprocedure('public.viva_eposta_yeniden_dene(uuid,uuid,uuid,integer)') IS NOT NULL AS yeniden_dene_fonksiyonu,
 NOT has_function_privilege('anon','public.viva_eposta_yeniden_dene(uuid,uuid,uuid,integer)','EXECUTE') AS anon_kapali,
 NOT has_function_privilege('authenticated','public.viva_eposta_yeniden_dene(uuid,uuid,uuid,integer)','EXECUTE') AS istemci_kapali,
 has_function_privilege('service_role','public.viva_eposta_yeniden_dene(uuid,uuid,uuid,integer)','EXECUTE') AS sunucu_acik;
