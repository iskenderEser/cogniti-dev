-- Yalnız incelenen 11 yayının bağlı soru seti ve soru gösterim ayarları.
-- Salt okunur; Supabase SQL Editor'da çalıştırılır.
WITH hedef_yayinlar(yayin_id) AS (
  VALUES
    ('2135330d-30de-40b2-b4c2-f058e6b9d8c8'::uuid),
    ('339602bd-ec14-4527-b0f0-e43643796c75'::uuid),
    ('4602ddc1-f7f0-4526-9622-26e72593ff6b'::uuid),
    ('5eec3f78-5539-41b0-84a7-3221c86775a9'::uuid),
    ('5fac1701-a348-4a03-852d-f41a6b4f8cb3'::uuid),
    ('797688dd-b65f-43fc-9a99-337e7f41c606'::uuid),
    ('8069cf60-3693-4a5e-9d35-832a10941fae'::uuid),
    ('8d840599-fb1b-4474-8c48-f9014b0009cf'::uuid),
    ('bcdae9cd-4fc7-47be-989e-3be917abbfcf'::uuid),
    ('c19cab66-5332-40f0-8406-58955b03d0ee'::uuid),
    ('d3693736-49ca-43d3-afc8-f61698db9d45'::uuid)
), veri AS (
  SELECT h.yayin_id,
         t.soru_seti_buyuklugu AS tanimli_soru_sayisi,
         t.secenek_sayisi AS tanimli_secenek_sayisi,
         t.video_basi_soru_sayisi AS tamamlama_sonrasi_soru_sayisi,
         ss.soru_seti_id,
         ss.sorular,
         CASE WHEN jsonb_typeof(ss.sorular) = 'array'
              THEN jsonb_array_length(ss.sorular) END AS kayitli_soru_sayisi
  FROM hedef_yayinlar h
  LEFT JOIN public.yayin_yonetimi ym ON ym.yayin_id = h.yayin_id
  LEFT JOIN public.soru_seti_durumu ssd
    ON ssd.soru_seti_durum_id = ym.soru_seti_durum_id
  LEFT JOIN public.soru_setleri ss ON ss.soru_seti_id = ssd.soru_seti_id
  LEFT JOIN public.video_durumu vd ON vd.video_durum_id = ss.video_durum_id
  LEFT JOIN public.videolar v ON v.video_id = vd.video_id
  LEFT JOIN public.talepler t ON t.talep_id = v.talep_id
)
SELECT d.yayin_id,
       d.soru_seti_id,
       d.tanimli_soru_sayisi,
       d.kayitli_soru_sayisi,
       d.tanimli_secenek_sayisi,
       x.en_az_secenek_sayisi,
       x.en_cok_secenek_sayisi,
       d.tamamlama_sonrasi_soru_sayisi,
       d.tanimli_soru_sayisi = 10
         AND d.kayitli_soru_sayisi = 10
         AND d.tanimli_secenek_sayisi = 2
         AND x.en_az_secenek_sayisi = 2
         AND x.en_cok_secenek_sayisi = 2
         AND d.tamamlama_sonrasi_soru_sayisi = 2 AS sorulan_yapiya_uyuyor
FROM veri d
LEFT JOIN LATERAL (
  SELECT min(CASE WHEN jsonb_typeof(q.soru->'secenekler') = 'array'
                  THEN jsonb_array_length(q.soru->'secenekler') END) AS en_az_secenek_sayisi,
         max(CASE WHEN jsonb_typeof(q.soru->'secenekler') = 'array'
                  THEN jsonb_array_length(q.soru->'secenekler') END) AS en_cok_secenek_sayisi
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(d.sorular) = 'array' THEN d.sorular ELSE '[]'::jsonb END
  ) AS q(soru)
) x ON true
ORDER BY d.yayin_id;
