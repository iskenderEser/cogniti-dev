-- Yalnız belirtilen 35 üye. Supabase SQL Editor / postgres rolü için.
-- Kalıcı verilere INSERT/UPDATE/DELETE yapmaz. Yalnız geçici rapor tabloları oluşturur.
-- Canlı pg_catalog üzerinden public tablolarındaki UUID kolonlarını keşfeder.
-- Üye/Auth UUID'lerinden başlayıp bulunan satırların tek kolonlu UUID birincil
-- anahtarlarını izler. Paylaşılan eczane/ürün/yayın yabancı anahtarlarını yaymaz.
-- UUID'yi yalnız JSON/metin/dizi içinde tutan kayıtlar ve dış servis logları kapsanmaz.
-- Auth şifre hashleri, tokenlar ve oturum sırları rapora alınmaz.

BEGIN ISOLATION LEVEL REPEATABLE READ;
SET LOCAL statement_timeout = '120s';

CREATE TEMP TABLE inceleme_hedef (musteri_id uuid PRIMARY KEY) ON COMMIT DROP;
INSERT INTO inceleme_hedef VALUES
  ('a378c4ee-af06-488b-a0b8-865f35374731'::uuid),
  ('ec3428ee-69e1-4881-af72-794e05b0eb25'::uuid),
  ('1694573f-7ed0-47be-a426-ecf3a7c2df57'::uuid),
  ('68ea1095-be3c-49bc-a3c2-875c4aa861ab'::uuid),
  ('81622f26-cfec-4c3d-8dbd-76218eb82dab'::uuid),
  ('632281fe-01ed-4dca-abd4-b374b9f7884e'::uuid),
  ('47ff4bcc-45db-4447-8104-04a669457b09'::uuid),
  ('5ea57d73-7861-44a8-a2fd-e360d086ea73'::uuid),
  ('af96197b-5fe1-452f-9250-92fb0ee001d7'::uuid),
  ('d3cfc682-a909-4910-8412-9edc4d3da67a'::uuid),
  ('4b1cc6b3-dce5-411a-be6a-7788e439340a'::uuid),
  ('d9e16652-764f-420d-89ed-d4a4fc4674b6'::uuid),
  ('e4e7c47f-a7df-45ab-bb71-b3957259e2c9'::uuid),
  ('a6f5bbd0-1698-4431-977e-a04bc4cd81df'::uuid),
  ('5de3e87b-851a-4de6-ac7a-ef9a217c0696'::uuid),
  ('b68dcc58-4c19-465c-9ecb-9974c0c4a419'::uuid),
  ('54c1e0bd-ab0e-4d70-8fa2-a1ff60f0bc62'::uuid),
  ('c3a5e97e-502c-43bd-9de0-dbfa0b59b72c'::uuid),
  ('e4d56614-fc43-40b1-a5c7-1550da7fbc11'::uuid),
  ('a9df563c-3028-4e31-b313-cf8df066bada'::uuid),
  ('4c1ba589-7e74-4e99-9474-dbacd79909b9'::uuid),
  ('4af70f17-6ba2-4464-a6a7-a798702c6167'::uuid),
  ('0958cdbf-fe54-45e4-a44f-f0df3edebb54'::uuid),
  ('ae380632-0d44-4433-93ed-d6824c68eadb'::uuid),
  ('97bb0635-499d-4085-a4b9-f22f42d1e9fc'::uuid),
  ('39b5a1ff-d9b8-49fc-90ee-b79a2a3ceef9'::uuid),
  ('99d587e3-9112-472e-9901-f786aede3c52'::uuid),
  ('aa71b58d-a04b-4468-8cae-8e489f27e413'::uuid),
  ('582fb580-ffb3-437a-9ce8-f020f90aefb2'::uuid),
  ('e7492a62-207b-4939-b1e2-90331bce30c1'::uuid),
  ('be1fe1a2-af6c-4362-8010-39a0548220ad'::uuid),
  ('af8be03f-543d-44ae-be75-bda050066166'::uuid),
  ('63e42236-16f0-4b0b-ad7c-95e93a0209c7'::uuid),
  ('75b64f03-996b-4b9e-b2e4-cb0a1367a410'::uuid),
  ('25372d10-91a0-4f0c-80a2-f35583f3111c'::uuid);

CREATE TEMP TABLE inceleme_kimlik (
  musteri_id uuid, kimlik uuid, PRIMARY KEY (musteri_id, kimlik)
) ON COMMIT DROP;
INSERT INTO inceleme_kimlik SELECT musteri_id, musteri_id FROM inceleme_hedef;
INSERT INTO inceleme_kimlik
SELECT h.musteri_id, m.auth_user_id
FROM inceleme_hedef h JOIN public.eczanem_musteriler m USING (musteri_id)
WHERE m.auth_user_id IS NOT NULL ON CONFLICT DO NOTHING;

CREATE TEMP TABLE inceleme_satir (
  musteri_id uuid, tablo text, fiziksel_tablo oid, satir_adresi text, veri jsonb,
  PRIMARY KEY (musteri_id, fiziksel_tablo, satir_adresi)
) ON COMMIT DROP;

DO $rapor$
DECLARE t record; p record; eklenen integer; tur_eklenen integer;
BEGIN
  LOOP
    FOR t IN
      SELECT c.oid, n.nspname, c.relname,
        string_agg(format('r.%I = k.kimlik', a.attname), ' OR ' ORDER BY a.attnum) AS kosul
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
        AND NOT c.relispartition
        AND a.attnum > 0 AND NOT a.attisdropped
        AND a.atttypid = 'uuid'::regtype
      GROUP BY c.oid, n.nspname, c.relname
    LOOP
      EXECUTE format(
        'INSERT INTO inceleme_satir
         SELECT DISTINCT k.musteri_id, %L, r.tableoid, r.ctid::text, to_jsonb(r)
         FROM %I.%I r JOIN inceleme_kimlik k ON (%s)
         ON CONFLICT DO NOTHING',
         t.nspname || '.' || t.relname, t.nspname, t.relname, t.kosul);
    END LOOP;

    tur_eklenen := 0;
    FOR p IN
      SELECT n.nspname || '.' || c.relname AS tablo, a.attname
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
      WHERE n.nspname = 'public' AND con.contype = 'p'
        AND cardinality(con.conkey) = 1 AND a.atttypid = 'uuid'::regtype
        AND NOT c.relispartition
    LOOP
      INSERT INTO inceleme_kimlik
      SELECT s.musteri_id, (s.veri ->> p.attname)::uuid
      FROM inceleme_satir s
      WHERE s.tablo = p.tablo AND s.veri ->> p.attname IS NOT NULL
      ON CONFLICT DO NOTHING;
      GET DIAGNOSTICS eklenen = ROW_COUNT;
      tur_eklenen := tur_eklenen + eklenen;
    END LOOP;
    EXIT WHEN tur_eklenen = 0;
  END LOOP;
END;
$rapor$;

-- Tek sonuç: hedef doğrulaması, güvenli Auth özeti, tablo sayımları ve kayıtlar.
SELECT jsonb_build_object(
  'hedef_uye_sayisi', (SELECT count(*) FROM inceleme_hedef),
  'bulunan_uye_sayisi', (
    SELECT count(*) FROM inceleme_hedef h
    JOIN public.eczanem_musteriler m USING (musteri_id)
  ),
  'uyeler', (
    SELECT jsonb_agg(jsonb_build_object(
      'musteri_id', h.musteri_id,
      'ad_soyad', m.ad_soyad,
      'auth_user_id', m.auth_user_id,
      'kayitli_eposta', u.email,
      'uye_bulundu', m.musteri_id IS NOT NULL,
      'auth_bulundu', u.id IS NOT NULL
    ) ORDER BY m.ad_soyad)
    FROM inceleme_hedef h
    LEFT JOIN public.eczanem_musteriler m USING (musteri_id)
    LEFT JOIN auth.users u ON u.id = m.auth_user_id
  ),
  'tablo_ozeti', (
    SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.tablo), '[]'::jsonb)
    FROM (
      SELECT tablo, count(*) AS uye_kayit_eslesmesi,
        count(DISTINCT (fiziksel_tablo, satir_adresi)) AS benzersiz_kayit_sayisi,
        count(DISTINCT musteri_id) AS ilgili_uye_sayisi
      FROM inceleme_satir GROUP BY tablo
    ) x
  ),
  'kayitlar', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'musteri_id', musteri_id, 'tablo', tablo, 'kayit', veri
    ) ORDER BY musteri_id, tablo, satir_adresi), '[]'::jsonb)
    FROM inceleme_satir
  )
) AS inceleme_raporu;

COMMIT;
