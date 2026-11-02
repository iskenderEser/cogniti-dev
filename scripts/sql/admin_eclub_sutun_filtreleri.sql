-- İşlem hariç tüm sütun başlıkları için firma kapsamlı açılır liste filtreleri.
-- Yalnız okuma fonksiyonunu günceller; üye ve eczane kayıtlarını değiştirmez.
BEGIN;
DROP FUNCTION IF EXISTS public.admin_eclub_uyeleri_oku(uuid,uuid,text,text,text,integer,integer);
DROP FUNCTION IF EXISTS public.admin_eclub_uyeleri_oku(uuid,text,integer,integer);
DROP FUNCTION IF EXISTS public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,text);
DROP FUNCTION IF EXISTS public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,uuid);
CREATE OR REPLACE FUNCTION public.admin_eclub_uyeleri_oku(p_firma_id uuid, p_arama text DEFAULT '', p_sayfa integer DEFAULT 1, p_limit integer DEFAULT 20, p_filtreler jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $f$
DECLARE
  v_sonuc jsonb;
  v_filtreler jsonb;
  v_alanlar text[] := ARRAY['takim_id','bolge_id','temsilci_id','il','ilce','gln','eczane_id','rol','kisi_id','telefon','eposta','durum'];
BEGIN
  IF p_firma_id IS NULL OR p_sayfa IS NULL OR p_sayfa<1 OR p_limit IS NULL
    OR p_limit NOT BETWEEN 1 AND 50 OR length(coalesce(p_arama,''))>80
    OR jsonb_typeof(coalesce(p_filtreler,'{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'Geçersiz liste parametreleri.' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM firmalar WHERE firma_id=p_firma_id) THEN
    RAISE EXCEPTION 'Firma bulunamadı.' USING ERRCODE='P0002';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_each(coalesce(p_filtreler,'{}'::jsonb)) f
    WHERE NOT (f.key=ANY(v_alanlar)) OR jsonb_typeof(f.value)<>'string'
      OR length(f.value#>>'{}')>254) THEN
    RAISE EXCEPTION 'Geçersiz sütun filtresi.' USING ERRCODE='22023';
  END IF;
  SELECT coalesce(jsonb_object_agg(f.key,f.value),'{}'::jsonb) INTO v_filtreler
    FROM jsonb_each(coalesce(p_filtreler,'{}'::jsonb)) f WHERE f.value<>'""'::jsonb;
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
  ), organizasyon AS MATERIALIZED (
    SELECT DISTINCT ef.eczane_id,k.kullanici_id AS temsilci_id,
      concat_ws(' ',k.ad,k.soyad) AS temsilci_adi,
      t.takim_id,t.takim_adi,b.bolge_id,b.bolge_adi
    FROM eclub_eczane_firma ef
    JOIN eclub_utt_eczane ue ON ue.eczane_firma_id=ef.id AND ue.aktif_mi=true
    JOIN kullanicilar k ON k.kullanici_id=ue.utt_id AND k.firma_id=p_firma_id
    LEFT JOIN takimlar t ON t.takim_id=k.takim_id AND t.firma_id=p_firma_id
    LEFT JOIN bolgeler b ON b.bolge_id=k.bolge_id AND b.takim_id=t.takim_id
    WHERE ef.firma_id=p_firma_id AND ef.aktif_mi=true
      AND ef.eczane_id IN (SELECT eczane_id FROM eczaneler)
  ), genis AS MATERIALIZED (
    SELECT u.*,o.temsilci_id,o.temsilci_adi,o.takim_adi,o.bolge_adi,
      jsonb_build_object(
        'takim_id',coalesce(nullif(o.takim_id::text,''),'__bos__'),
        'bolge_id',coalesce(nullif(o.bolge_id::text,''),'__bos__'),
        'temsilci_id',coalesce(nullif(o.temsilci_id::text,''),'__bos__'),
        'il',coalesce(nullif(u.il,''),'__bos__'),
        'ilce',coalesce(nullif(u.ilce,''),'__bos__'),
        'gln',coalesce(nullif(u.gln,''),'__bos__'),
        'eczane_id',coalesce(nullif(u.eczane_id::text,''),'__bos__'),
        'rol',coalesce(nullif(u.rol,''),'__bos__'),
        'kisi_id',coalesce(nullif(u.kisi_id::text,''),'__bos__'),
        'telefon',coalesce(nullif(u.telefon,''),'__bos__'),
        'eposta',coalesce(nullif(u.eposta,''),'__bos__'),
        'durum',coalesce(nullif(CASE WHEN u.aktif_mi THEN 'aktif' ELSE 'pasif' END,''),'__bos__')
      ) AS degerler,
      jsonb_build_object(
        'takim_id',coalesce(nullif(o.takim_adi,''),'Bilgi yok'),
        'bolge_id',coalesce(nullif(o.bolge_adi,''),'Bilgi yok'),
        'temsilci_id',coalesce(nullif(o.temsilci_adi,''),'Bilgi yok'),
        'il',coalesce(nullif(u.il,''),'Bilgi yok'),
        'ilce',coalesce(nullif(u.ilce,''),'Bilgi yok'),
        'gln',coalesce(nullif(u.gln,''),'Bilgi yok'),
        'eczane_id',coalesce(nullif(u.eczane_adi,''),'Bilgi yok'),
        'rol',coalesce(nullif(u.rol,''),'Bilgi yok'),
        'kisi_id',coalesce(nullif(concat_ws(' ',u.ad,u.soyad),''),'Bilgi yok'),
        'telefon',coalesce(nullif(u.telefon,''),'Bilgi yok'),
        'eposta',coalesce(nullif(u.eposta,''),'Bilgi yok'),
        'durum',coalesce(nullif(CASE WHEN u.aktif_mi THEN 'Aktif' ELSE 'Pasif' END,''),'Bilgi yok')
      ) AS etiketler
    FROM kayitlar u LEFT JOIN organizasyon o ON o.eczane_id=u.eczane_id
  ), eslesen AS MATERIALIZED (
    SELECT * FROM genis g WHERE g.degerler @> v_filtreler
      AND (coalesce(p_arama,'')='' OR position(lower(p_arama) IN
        lower(concat_ws(' ',g.ad,g.soyad,g.telefon,g.eposta,g.eczane_adi,g.gln,g.il,g.ilce)))>0)
  ), filtreli AS MATERIALIZED (
    SELECT k.* FROM kayitlar k WHERE EXISTS (SELECT 1 FROM eslesen g WHERE g.uyelik_id=k.uyelik_id)
  ), sayfalama AS (
    SELECT count(*) AS toplam,
      greatest(1,ceil(count(*)::numeric/p_limit)::integer) AS toplam_sayfa,
      least(p_sayfa,greatest(1,ceil(count(*)::numeric/p_limit)::integer)) AS sayfa
    FROM filtreli
  ), sayfa AS MATERIALIZED (
    SELECT * FROM filtreli ORDER BY eczane_adi,ad,soyad,eczane_id,kisi_id
    LIMIT p_limit OFFSET ((SELECT sayfa FROM sayfalama)-1)::bigint*p_limit
  ), secenekler AS (
    SELECT DISTINCT v.key AS anahtar,v.value AS deger,g.etiketler->>v.key AS etiket
    FROM genis g CROSS JOIN LATERAL jsonb_each_text(g.degerler) v
  )
  SELECT jsonb_build_object(
    'uyeler',coalesce((SELECT jsonb_agg(to_jsonb(s)||jsonb_build_object(
      'sorumlular',coalesce((SELECT jsonb_agg(to_jsonb(r)
        ORDER BY r.takim_adi,r.bolge_adi,r.temsilci_adi,r.temsilci_id)
        FROM (SELECT DISTINCT g.temsilci_id,g.temsilci_adi,g.takim_adi,g.bolge_adi
          FROM eslesen g WHERE g.eczane_id=s.eczane_id AND g.temsilci_id IS NOT NULL) r),'[]'::jsonb))
      ORDER BY s.eczane_adi,s.ad,s.soyad,s.eczane_id,s.kisi_id) FROM sayfa s),'[]'::jsonb),
    'secenekler',coalesce((SELECT jsonb_object_agg(k.anahtar,coalesce((
      SELECT jsonb_agg(jsonb_build_object('deger',o.deger,'etiket',o.etiket) ORDER BY o.etiket,o.deger)
      FROM secenekler o WHERE o.anahtar=k.anahtar),'[]'::jsonb))
      FROM unnest(v_alanlar) AS k(anahtar)),'{}'::jsonb),
    'sayfalama',(SELECT to_jsonb(p)||jsonb_build_object('limit',p_limit) FROM sayfalama p)
  ) INTO v_sonuc;
  RETURN v_sonuc;
END;
$f$;

REVOKE ALL ON FUNCTION public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT to_regprocedure('public.admin_eclub_uyeleri_oku(uuid,text,integer,integer,jsonb)') IS NOT NULL AS admin_eclub_sutun_filtreleri_hazir;
