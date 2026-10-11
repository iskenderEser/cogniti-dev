-- Yalnız okuma: kart test verisi temizliğini durduran kayıtları listeler.
-- Hiçbir puan, talep, devir, yayın veya bildirim değiştirilmez.
WITH hedef AS (
  SELECT '0d8385df-4eed-429e-b691-81acee1ad606'::uuid AS eczane_id
), ornekler(yayin_id, puan_id, izleme_id) AS (
  VALUES
    ('f364c684-eadc-4ccc-8671-f333da7b555f'::uuid,
     'e1200000-0000-4000-8000-000000000101'::uuid,
     'e1200000-0000-4000-8000-000000000001'::uuid),
    ('bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50'::uuid,
     'e1200000-0000-4000-8000-000000000102'::uuid,
     'e1200000-0000-4000-8000-000000000002'::uuid),
    ('3a6e0db1-bc42-44cf-ab16-b99630681ae9'::uuid,
     'e1200000-0000-4000-8000-000000000103'::uuid,
     'e1200000-0000-4000-8000-000000000003'::uuid)
), kayitlar AS (
  SELECT '1_BAGLI_TALEP' AS kontrol, t.yayin_id,
    jsonb_build_object(
      'talep_id', t.talep_id, 'donem', t.donem_kodu, 'durum', t.durum,
      'kisi_id', t.talep_eden_kisi_id, 'utt_id', t.utt_id,
      'puan', t.toplanan_puan, 'tutar', t.talep_edilen_cek_tl,
      'siparis_verildi_mi', t.siparis_verildi_mi,
      'bilinen_e130_test_idsi', t.talep_id IN (
        SELECT ('e1300000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
        FROM generate_series(1, 7) n
      ),
      'outbox_sayisi', (SELECT count(*) FROM public.eclub_cek_teslimat_outbox o WHERE o.talep_id=t.talep_id),
      'bildirim_sayisi', (SELECT count(*) FROM public.eclub_bildirimler b WHERE b.kayit_turu='cek' AND b.kayit_id=t.talep_id),
      'siparis_onayi_sayisi', (SELECT count(*) FROM public.eclub_siparis_utt_onaylari s WHERE s.talep_id=t.talep_id)
    ) AS detay
  FROM public.eclub_store_cek_talepleri t
  JOIN ornekler x USING (yayin_id)
  JOIN hedef h ON h.eczane_id=t.eczane_id
  UNION ALL
  SELECT '2_EK_PUAN', p.yayin_id,
    jsonb_build_object(
      'puan_id', p.kazanilan_puan_id, 'izleme_id', p.izleme_id,
      'kisi_id', p.kisi_id, 'puan', p.puan, 'created_at', p.created_at,
      'gorunum_testi', i.ilerleme_durumu->>'gorunum_testi'
    )
  FROM public.eclub_kazanilan_puanlar p
  JOIN ornekler x ON x.yayin_id=p.yayin_id AND x.puan_id<>p.kazanilan_puan_id
  JOIN hedef h ON h.eczane_id=p.eczane_id
  LEFT JOIN public.eclub_izleme_kayitlari i ON i.izleme_id=p.izleme_id
  UNION ALL
  SELECT '3_DEVIR', d.yayin_id, to_jsonb(d)
  FROM public.eclub_store_puan_devirleri d
  JOIN ornekler x USING (yayin_id)
  JOIN hedef h ON h.eczane_id=d.eczane_id
)
SELECT k.kontrol, k.yayin_id, u.urun_adi, k.detay
FROM kayitlar k
LEFT JOIN public.v_yayin_kunye ky ON ky.yayin_id=k.yayin_id
LEFT JOIN public.urunler u ON u.urun_id=ky.urun_id
ORDER BY k.kontrol, k.yayin_id, k.detay::text;
