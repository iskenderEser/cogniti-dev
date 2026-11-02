-- Takım (Bölüm) açılır listesi: tam kurulum. Dosyanın tamamını çalıştırın.
-- Firma kapsamlı düz E-Club üye listesi. Yalnız okuma fonksiyonu ekler.
BEGIN;

-- Kaldırılan üç filtrenin eski fonksiyon imzasını da temizle.
DROP FUNCTION IF EXISTS public.admin_eclub_uyeleri_oku(uuid,uuid,text,text,text,integer,integer);

DROP FUNCTION IF EXISTS public.admin_eclub_uyeleri_oku(uuid,text,integer,integer);

DROP FUNCTION IF EXISTS public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,text);

CREATE OR REPLACE FUNCTION public.admin_eclub_uyeleri_oku(p_firma_id uuid, p_arama text DEFAULT '', p_sayfa integer DEFAULT 1, p_limit integer DEFAULT 20, p_takim_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
DECLARE v_sonuc jsonb;
BEGIN
  IF p_firma_id IS NULL
    OR p_sayfa IS NULL OR p_sayfa < 1
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50
    OR length(coalesce(p_arama,'')) > 80 THEN
    RAISE EXCEPTION 'Geçersiz liste parametreleri.' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM firmalar WHERE firma_id=p_firma_id) THEN
    RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='P0002';
  END IF;

  IF p_takim_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM takimlar WHERE takim_id=p_takim_id AND firma_id=p_firma_id) THEN
    RAISE EXCEPTION 'Takım seçili firmaya bağlı değil.' USING ERRCODE='42501';
  END IF;

  WITH eczaneler AS MATERIALIZED (
    SELECT e.eczane_id,e.gln,coalesce(m.eczane_adi,'—') AS eczane_adi,m.il,m.ilce
    FROM eclub_eczaneler e
    LEFT JOIN eclub_eczane_master m ON m.gln=e.gln
    WHERE EXISTS (SELECT 1 FROM eclub_eczane_firma ef
      WHERE ef.eczane_id=e.eczane_id AND ef.firma_id=p_firma_id AND ef.aktif_mi=true)
  ), uyelikler AS MATERIALIZED (
    SELECT DISTINCT ON (b.eczane_id,b.kisi_id)
      b.id AS uyelik_id,b.eczane_id,b.kisi_id,b.aktif_mi,b.created_at
    FROM eclub_kisi_eczane b JOIN eczaneler e ON e.eczane_id=b.eczane_id
    ORDER BY b.eczane_id,b.kisi_id,b.aktif_mi DESC,b.created_at DESC NULLS LAST,b.id
  ), kayitlar AS MATERIALIZED (
    SELECT u.*,k.ad,k.soyad,k.rol,k.telefon,k.eposta,e.gln,e.eczane_adi,e.il,e.ilce
    FROM uyelikler u JOIN eclub_kisiler k ON k.kisi_id=u.kisi_id
    JOIN eczaneler e ON e.eczane_id=u.eczane_id
    WHERE (coalesce(p_arama,'')='' OR position(lower(p_arama) IN
        lower(concat_ws(' ',k.ad,k.soyad,k.telefon,k.eposta,e.eczane_adi,e.gln,e.il,e.ilce)))>0)
      AND (p_takim_id IS NULL OR EXISTS (
        SELECT 1 FROM eclub_eczane_firma ef
        JOIN eclub_utt_eczane ue ON ue.eczane_firma_id=ef.id AND ue.aktif_mi=true
        JOIN kullanicilar temsilci ON temsilci.kullanici_id=ue.utt_id AND temsilci.firma_id=p_firma_id
        JOIN takimlar takim ON takim.takim_id=temsilci.takim_id AND takim.firma_id=p_firma_id
        WHERE ef.eczane_id=u.eczane_id AND ef.firma_id=p_firma_id AND ef.aktif_mi=true
          AND takim.takim_id=p_takim_id
      ))
  ), sayfalama AS (
    SELECT count(*) AS toplam,
      greatest(1,ceil(count(*)::numeric/p_limit)::integer) AS toplam_sayfa,
      least(p_sayfa,greatest(1,ceil(count(*)::numeric/p_limit)::integer)) AS sayfa
    FROM kayitlar
  ), sayfa AS MATERIALIZED (
    SELECT * FROM kayitlar ORDER BY eczane_adi,ad,soyad,eczane_id,kisi_id
    LIMIT p_limit OFFSET ((SELECT sayfa FROM sayfalama)-1)::bigint*p_limit
  ), sorumlular AS (
    SELECT DISTINCT ef.eczane_id,k.kullanici_id AS temsilci_id,
      concat_ws(' ',k.ad,k.soyad) AS temsilci_adi,t.takim_adi,b.bolge_adi
    FROM eclub_eczane_firma ef
    JOIN eclub_utt_eczane ue ON ue.eczane_firma_id=ef.id AND ue.aktif_mi=true
    JOIN kullanicilar k ON k.kullanici_id=ue.utt_id AND k.firma_id=p_firma_id
    LEFT JOIN takimlar t ON t.takim_id=k.takim_id AND t.firma_id=p_firma_id
    LEFT JOIN bolgeler b ON b.bolge_id=k.bolge_id AND b.takim_id=t.takim_id
    WHERE ef.firma_id=p_firma_id AND ef.aktif_mi=true
      AND ef.eczane_id IN (SELECT eczane_id FROM sayfa)
  )
  SELECT jsonb_build_object(
    'uyeler',coalesce((SELECT jsonb_agg(to_jsonb(s)||jsonb_build_object(
      'sorumlular',coalesce((SELECT jsonb_agg(jsonb_build_object(
        'temsilci_id',r.temsilci_id,'temsilci_adi',r.temsilci_adi,
        'takim_adi',r.takim_adi,'bolge_adi',r.bolge_adi)
        ORDER BY r.takim_adi,r.bolge_adi,r.temsilci_adi,r.temsilci_id)
        FROM sorumlular r WHERE r.eczane_id=s.eczane_id),'[]'::jsonb))
      ORDER BY s.eczane_adi,s.ad,s.soyad,s.eczane_id,s.kisi_id) FROM sayfa s),'[]'::jsonb),
    'takimlar',coalesce((SELECT jsonb_agg(jsonb_build_object('takim_id',t.takim_id,'takim_adi',t.takim_adi) ORDER BY t.takim_adi,t.takim_id) FROM takimlar t WHERE t.firma_id=p_firma_id),'[]'::jsonb),
    'sayfalama',(SELECT to_jsonb(p)||jsonb_build_object('limit',p_limit) FROM sayfalama p)
  ) INTO v_sonuc;
  RETURN v_sonuc;
END;
$f$;

REVOKE ALL ON FUNCTION public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;

SELECT to_regprocedure('public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,uuid)') IS NOT NULL AS admin_eclub_uye_listesi_hazir;
