-- Adım 6. Ön koşul: Adım 3, 4 ve 5 SQL'leri.
-- Proje sahibi Supabase SQL Editor'da çalıştırır. Cron kurulmaz.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('eclub-gonderim-api-toplu-v1', 0));

CREATE OR REPLACE FUNCTION public.eclub_yayin_toplu_islem(
  p_utt_id uuid, p_kisi_idler uuid[], p_yayin_idler uuid[],
  p_hedef_at timestamptz DEFAULT NULL, p_islem_anahtari uuid DEFAULT NULL,
  p_onizleme boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public, pg_temp
SET timezone = 'Europe/Istanbul'
AS $f$
DECLARE
  v_kisi uuid; v_yayin uuid; v_simdi timestamptz; v_hedef timestamptz;
  v_kontrol jsonb; v_kayit record; v_plan record; v_plan_id uuid; v_oneri_id uuid;
  v_sonuclar jsonb := '[]'; v_ozet jsonb := '{}'; v_sanal jsonb := '{}'; v_anahtar text;
  v_ek integer; v_kalan integer; v_kaydedildi boolean; v_sebep text;
BEGIN
  IF p_utt_id IS NULL OR coalesce(cardinality(p_kisi_idler),0) NOT BETWEEN 1 AND 100
    OR coalesce(cardinality(p_yayin_idler),0) NOT BETWEEN 1 AND 20
    OR cardinality(p_kisi_idler) * cardinality(p_yayin_idler) > 300
    OR array_position(p_kisi_idler,NULL) IS NOT NULL OR array_position(p_yayin_idler,NULL) IS NOT NULL
    OR p_onizleme IS NULL OR (p_hedef_at IS NOT NULL AND NOT isfinite(p_hedef_at))
    OR (p_hedef_at IS NOT NULL AND p_islem_anahtari IS NULL AND NOT p_onizleme) THEN
    RAISE EXCEPTION 'Geçersiz toplu gönderim girdisi.' USING ERRCODE = '22023';
  END IF;
  -- Bütün alıcı kilitleri aynı sırada alınır; ters sıralı toplu istekler yarışmaz.
  FOR v_kisi IN SELECT DISTINCT unnest(p_kisi_idler) ORDER BY 1 LOOP
    PERFORM public.eclub_gonderim_kapsamini_kilitle(p_utt_id,v_kisi);
  END LOOP;
  FOR v_kisi IN SELECT DISTINCT unnest(p_kisi_idler) ORDER BY 1 LOOP
    -- Yayın seçim sırası korunur; aynı ürünün kalan hakkını önce seçilen tüketir.
    FOR v_yayin IN SELECT id FROM unnest(p_yayin_idler) WITH ORDINALITY t(id,sira)
      GROUP BY id ORDER BY min(sira) LOOP
      PERFORM public.eclub_gonderim_erisimini_kilitle(p_utt_id,v_kisi,v_yayin);
      v_simdi := clock_timestamp(); v_hedef := coalesce(p_hedef_at,v_simdi);
      v_plan_id := NULL; v_oneri_id := NULL; v_kaydedildi := false; v_sebep := NULL;
      IF p_hedef_at IS NOT NULL AND NOT p_onizleme THEN
        SELECT * INTO v_plan FROM public.eclub_yayin_gonderim_planlari
          WHERE utt_id=p_utt_id AND kisi_id=v_kisi AND yayin_id=v_yayin
            AND islem_anahtari=p_islem_anahtari;
        IF FOUND THEN
          v_sonuclar := v_sonuclar || jsonb_build_array(jsonb_build_object(
            'kisi_id',v_kisi,'yayin_id',v_yayin,'kaydedildi',false,
            'plan_id',v_plan.plan_id,'durum',v_plan.durum,
            'sebep',CASE WHEN v_plan.hedef_gonderim_at=p_hedef_at
              THEN 'plan_zaten_kayitli' ELSE 'islem_anahtari_uyusmuyor' END));
          CONTINUE;
        END IF;
      END IF;
      v_kontrol := public.eclub_gonderim_kontrol_hesapla(p_utt_id,v_kisi,v_yayin,
        v_hedef,CASE WHEN p_hedef_at IS NULL THEN 'gonder' ELSE 'planla' END,NULL,v_simdi);
      v_anahtar := v_kisi::text || ':' || coalesce(v_kontrol->>'urun_id','');
      v_ek := coalesce((v_sanal->>v_anahtar)::integer,0);
      IF p_onizleme AND v_kontrol ? 'haftalik_kullanilan' THEN
        v_kontrol := v_kontrol || jsonb_build_object(
          'haftalik_kullanilan',(v_kontrol->>'haftalik_kullanilan')::integer+v_ek,
          'haftalik_kalan',greatest(0,(v_kontrol->>'haftalik_kalan')::integer-v_ek));
        IF (v_kontrol->>'haftalik_kalan')::integer=0 THEN
          v_kontrol := v_kontrol || jsonb_build_object('uygun',false,'sebep','haftalik_urun_kotasi');
        END IF;
      END IF;
      IF (v_kontrol->>'uygun')::boolean THEN
        IF p_onizleme THEN
          -- Salt okunur önizleme: kayıt/öneri/bildirim oluşturmaz.
          v_sanal := jsonb_set(v_sanal,ARRAY[v_anahtar],to_jsonb(v_ek+1));
        ELSIF p_hedef_at IS NOT NULL THEN
          INSERT INTO public.eclub_yayin_gonderim_planlari
            (utt_id,kisi_id,yayin_id,urun_id,hedef_gonderim_at,islem_anahtari)
          VALUES (p_utt_id,v_kisi,v_yayin,(v_kontrol->>'urun_id')::uuid,p_hedef_at,p_islem_anahtari)
          RETURNING plan_id INTO v_plan_id;
          v_kaydedildi := true;
        ELSE
          SELECT * INTO v_kayit FROM public.eclub_yayin_gonder(p_utt_id,v_kisi,v_yayin,NULL);
          v_kaydedildi := v_kayit.kaydedildi; v_sebep := v_kayit.sebep;
          IF v_kaydedildi THEN v_oneri_id := v_kayit.oneri_id; END IF;
        END IF;
      ELSE
        v_sebep := v_kontrol->>'sebep';
      END IF;
      v_kalan := greatest(0,coalesce((v_kontrol->>'haftalik_kalan')::integer,0)
        - CASE WHEN v_kaydedildi OR (p_onizleme AND (v_kontrol->>'uygun')::boolean) THEN 1 ELSE 0 END);
      IF v_kontrol ? 'haftalik_kullanilan' THEN
        v_ozet := jsonb_set(v_ozet,ARRAY[v_anahtar],jsonb_build_object(
          'kisi_id',v_kisi,'urun_id',v_kontrol->>'urun_id','haftalik_kalan',v_kalan,
          'haftalik_kullanilan',(v_kontrol->>'haftalik_kullanilan')::integer
            + CASE WHEN v_kaydedildi OR (p_onizleme AND (v_kontrol->>'uygun')::boolean) THEN 1 ELSE 0 END));
      END IF;
      v_sonuclar := v_sonuclar || jsonb_build_array(v_kontrol || jsonb_build_object(
        'kisi_id',v_kisi,'yayin_id',v_yayin,'kaydedildi',v_kaydedildi,
        'sebep',v_sebep,'uygun',v_sebep IS NULL,'haftalik_kalan_secim_sonrasi',v_kalan,
        'tekrar_durumu',CASE WHEN NOT (v_kontrol ? 'adayla_donemlik_tekrar') THEN NULL
          WHEN (v_kontrol->>'adayla_donemlik_tekrar')::integer=0 THEN 'ilk_gonderim' ELSE 'yeniden_gonderim' END,
        'plan_id',v_plan_id,'oneri_id',v_oneri_id));
    END LOOP;
  END LOOP;
  RETURN jsonb_build_object('sonuclar',v_sonuclar,'onizleme',p_onizleme,'hedef_gonderim_at',p_hedef_at,
    'haftalik_ozet',coalesce((SELECT jsonb_agg(value ORDER BY key) FROM jsonb_each(v_ozet)),'[]'::jsonb));
END;
$f$;
REVOKE ALL ON FUNCTION public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamptz,uuid,boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamptz,uuid,boolean)
  TO service_role;
COMMIT;
SELECT to_regprocedure('public.eclub_yayin_toplu_islem(uuid,uuid[],uuid[],timestamptz,uuid,boolean)')
  IS NOT NULL AS toplu_islem_rpc_var;
