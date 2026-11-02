-- Kurulum yalnız fonksiyonu ve ortak kayıtlardaki silinebilir işlem-yapan bağını hazırlar.
-- Bu dosyayı çalıştırmak firma veya kullanıcı SİLMEZ.
BEGIN;

-- Eczane/üyelik ortak kayıtları kalır; ayrılan firmanın eski çalışanı zorunlu olamaz.
ALTER TABLE public.eclub_depo_tercih_gecmisi ALTER COLUMN utt_id DROP NOT NULL;
ALTER TABLE public.eclub_eczane_depo_tercihleri ALTER COLUMN kaydeden_utt_id DROP NOT NULL;
ALTER TABLE public.eczanem_eclub_gecis_kayitlari ALTER COLUMN talep_eden_utt_id DROP NOT NULL;
ALTER TABLE public.eczanem_eclub_gecis_talepleri ALTER COLUMN talep_eden_utt_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_firma_kalici_sil(p_firma uuid, p_onay_adi text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $sil$
DECLARE
  f record; r record; e record; v_tablo record;
  n bigint; degisen bigint; silinen bigint := 0;
  k_id uuid; kimlikler uuid[]; anahtar text; kosul text; engel text;
  kalan bigint; ortak_kimlik boolean;
  korunan constant text[] := ARRAY[
    'eclub_eczane_master','eclub_eczaneler','eclub_kisiler','eclub_kisi_eczane',
    'eczanem_musteriler','eczanem_uyelikler','eczanem_silinen_musteriler',
    'eclub_store_siparisler','eclub_store_adresler','eclub_store_urunler','eclub_store_kategoriler',
    'store_urunler','ecza_depolari','ecza_depo_subeleri','sistem_ayarlari',
    'eclub_eczane_depo_tercihleri','eclub_depo_tercih_gecmisi',
    'eczanem_eclub_gecis_kayitlari','eczanem_eclub_gecis_talepleri','eczanem_personel_islemleri',
    'ogrenme_araci_depolama_temizleme_kuyrugu'
  ];
  sahiplik_kolonlari constant text[] := ARRAY[
    'firma_id','takim_id','bolge_id','urun_id','teknik_id','talep_id',
    'senaryo_id','senaryo_durum_id','video_id','video_durum_id','legacy_video_id',
    'legacy_video_durum_id','legacy_video_puan_id','arac_id','arac_durum_id',
    'soru_seti_id','soru_seti_durum_id','yayin_id','izleme_id','oneri_id','challenge_id',
    'gorev_id','siparis_id','kaynak_siparis_id','mutabakat_id','eczanem_indirim_onay_id',
    'etkinlik_id','tuketim_id','yukleme_id','eczane_firma_id','kaynak_kayit_id',
    'kaynak_talep_id','kullanilan_talep_id'
  ];
BEGIN
  IF p_firma IS NULL OR p_onay_adi IS NULL THEN
    RAISE EXCEPTION 'FIRMA_SIL:onay_gerekli' USING ERRCODE='22023';
  END IF;
  IF p_firma='15853eba-a94c-4528-9a07-0ee0b8677a02'::uuid THEN
    RAISE EXCEPTION 'FIRMA_SIL:platform_korunur' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('firma-kalici-sil:'||p_firma::text,0));
  SELECT firma_id,firma_adi,son_export_at INTO f FROM public.firmalar WHERE firma_id=p_firma FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'FIRMA_SIL:bulunamadi' USING ERRCODE='P0002'; END IF;
  IF p_onay_adi IS DISTINCT FROM f.firma_adi THEN
    RAISE EXCEPTION 'FIRMA_SIL:onay_uyusmuyor' USING ERRCODE='22023';
  END IF;
  -- İstisnasız tüm firmalarda zorunlu. Dışa aktarma burada yeniden çalıştırılmaz.
  IF f.son_export_at IS NULL THEN RAISE EXCEPTION 'FIRMA_SIL:export_gerekli' USING ERRCODE='P0001'; END IF;
  IF EXISTS(SELECT 1 FROM public.kullanicilar WHERE firma_id=p_firma AND lower(rol)='admin') THEN
    RAISE EXCEPTION 'FIRMA_SIL:platform_korunur' USING ERRCODE='22023';
  END IF;

  DROP TABLE IF EXISTS pg_temp.firma_sil_tablolar;
  DROP TABLE IF EXISTS pg_temp.firma_sil_hedef;
  DROP TABLE IF EXISTS pg_temp.firma_sil_baglar;
  CREATE TEMP TABLE firma_sil_tablolar(
    oid oid PRIMARY KEY, ad text NOT NULL, anahtar text NOT NULL,
    firma_kolonu boolean NOT NULL, korunur boolean NOT NULL
  ) ON COMMIT DROP;
  CREATE TEMP TABLE firma_sil_hedef(
    tablo oid NOT NULL, anahtar jsonb NOT NULL, veri jsonb NOT NULL,
    PRIMARY KEY(tablo,anahtar)
  ) ON COMMIT DROP;
  CREATE TEMP TABLE firma_sil_baglar(
    cocuk oid NOT NULL, ebeveyn oid NOT NULL, eslesme text NOT NULL,
    kolonlar text[] NOT NULL, sahiplik boolean NOT NULL, gercek_fk boolean NOT NULL
  ) ON COMMIT DROP;

  -- PK ve FK tanımları kurulu şemadan okunur: snapshot'ta bulunmayan yeni
  -- token/Viva/öğrenme çocukları da kendi ebeveyn kapsamıyla temizlenir.
  FOR r IN SELECT c.oid,c.relname FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
           WHERE ns.nspname='public' AND c.relkind='r' ORDER BY c.oid LOOP
    SELECT 'jsonb_build_object('||string_agg(format('%L,t.%I',a.attname,a.attname),',' ORDER BY u.sira)||')'
      INTO anahtar FROM pg_index i CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY u(attnum,sira)
      JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=u.attnum
      WHERE i.indrelid=r.oid AND i.indisprimary;
    IF anahtar IS NULL THEN CONTINUE; END IF;
    INSERT INTO pg_temp.firma_sil_tablolar VALUES(r.oid,r.relname,anahtar,
      EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=r.oid AND attname='firma_id' AND NOT attisdropped),
      r.relname=ANY(korunan));
  END LOOP;
  INSERT INTO pg_temp.firma_sil_baglar
  SELECT c.conrelid,c.confrelid,
    string_agg(format('to_jsonb(t)->>%L IS NOT NULL AND to_jsonb(t)->%L = p.veri->%L',a.attname,a.attname,b.attname),' AND ' ORDER BY u.sira),
    array_agg(a.attname::text ORDER BY u.sira),
    bool_or(a.attname=ANY(sahiplik_kolonlari)),true
  FROM pg_constraint c CROSS JOIN LATERAL unnest(c.conkey,c.confkey) WITH ORDINALITY u(ck,pk,sira)
  JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=u.ck
  JOIN pg_attribute b ON b.attrelid=c.confrelid AND b.attnum=u.pk
  JOIN pg_temp.firma_sil_tablolar ct ON ct.oid=c.conrelid
  JOIN pg_temp.firma_sil_tablolar pt ON pt.oid=c.confrelid
  WHERE c.contype='f' GROUP BY c.oid,c.conrelid,c.confrelid;

  -- FK olmayan, şemada doğrulanmış sahiplik alanları ve kullanıcı etkinlikleri.
  FOR r IN SELECT * FROM (VALUES
    ('eczanem_siparisler','urun_id','urunler','urun_id'),
    ('eczanem_puan_kayitlari','urun_id','urunler','urun_id'),
    ('eczanem_indirim_onaylari','kaynak_siparis_id','eczanem_siparisler','siparis_id'),
    ('eczanem_utt_mutabakatlar','mutabakat_id','eczanem_indirim_onaylari','eczanem_indirim_onay_id'),
    ('kazanilan_puanlar','kullanici_id','kullanicilar','kullanici_id'),
    ('ileri_sarma_kayitlari','kullanici_id','kullanicilar','kullanici_id'),
    ('yanlis_cevap_kayitlari','kullanici_id','kullanicilar','kullanici_id'),
    ('oneri_kayip_kayitlari','kullanici_id','kullanicilar','kullanici_id'),
    ('izleme_kayitlari','kullanici_id','kullanicilar','kullanici_id'),
    ('oneri_kayitlari','kullanici_id','kullanicilar','kullanici_id'),
    ('oneri_kayitlari','oneren_id','kullanicilar','kullanici_id'),
    ('cc_kazanilan_puanlar','bm_id','kullanicilar','kullanici_id'),
    ('cc_ileri_sarma_kayitlari','bm_id','kullanicilar','kullanici_id'),
    ('cc_yanlis_cevap_kayitlari','bm_id','kullanicilar','kullanici_id'),
    ('cc_izleme_kayitlari','bm_id','kullanicilar','kullanici_id'),
    ('challenge_kayip_kayitlari','kullanici_id','kullanicilar','kullanici_id'),
    ('challenge_kayitlari','alan_id','kullanicilar','kullanici_id'),
    ('challenge_kayitlari','gonderen_id','kullanicilar','kullanici_id'),
    ('hb_ligi_ozet_v2','kullanici_id','kullanicilar','kullanici_id'),
    ('cc_ligi_ozet','kullanici_id','kullanicilar','kullanici_id'),
    ('store_siparisler','kullanici_id','kullanicilar','kullanici_id'),
    ('store_puan_harcamalari','kullanici_id','kullanicilar','kullanici_id'),
    ('store_adresler','kullanici_id','kullanicilar','kullanici_id'),
    ('eclub_takim_adlari','utt_id','kullanicilar','kullanici_id'),
    ('eclub_utt_puanlari','utt_id','kullanicilar','kullanici_id'),
    ('eclub_utt_eczane','utt_id','kullanicilar','kullanici_id'),
    ('bildirimler','alici_id','kullanicilar','kullanici_id'),
    ('push_abonelikleri','auth_user_id','kullanicilar','kullanici_id'),
    ('push_gonderim_kayitlari','auth_user_id','kullanicilar','kullanici_id'),
    ('kimlik_provizyon_islemleri','hedef_kayit_id','kullanicilar','kullanici_id'),
    ('iu_genel_atamalari','iu_id','kullanicilar','kullanici_id'),
    ('iu_urun_atamalari','iu_id','kullanicilar','kullanici_id')
  ) m(cocuk,kolon,ebeveyn,hedef)
    JOIN pg_temp.firma_sil_tablolar ct ON ct.ad=m.cocuk
    JOIN pg_temp.firma_sil_tablolar pt ON pt.ad=m.ebeveyn
    WHERE EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=ct.oid AND attname=m.kolon AND NOT attisdropped)
  LOOP
    INSERT INTO pg_temp.firma_sil_baglar
    SELECT ct.oid,pt.oid,format('to_jsonb(t)->>%L IS NOT NULL AND to_jsonb(t)->%L = p.veri->%L',r.kolon,r.kolon,r.hedef),ARRAY[r.kolon],true,false
    FROM pg_temp.firma_sil_tablolar ct,pg_temp.firma_sil_tablolar pt WHERE ct.ad=r.cocuk AND pt.ad=r.ebeveyn;
  END LOOP;

  -- Eski bildirimlerde kayıt bağı FK yerine tür + kimlik ile tutulur.
  FOR r IN SELECT * FROM (VALUES
    ('bildirimler','talep','talepler','talep_id'),
    ('bildirimler','senaryo','senaryolar','senaryo_id'),
    ('bildirimler','video','videolar','video_id'),
    ('bildirimler','soru_seti','soru_setleri','soru_seti_id'),
    ('bildirimler','yayin','yayin_yonetimi','yayin_id'),
    ('bildirimler','oneri','oneri_kayitlari','oneri_id'),
    ('bildirimler','challenge','challenge_kayitlari','challenge_id'),
    ('eclub_bildirimler','oneri','eclub_oneri_kayitlari','oneri_id'),
    ('eclub_bildirimler','cek','eclub_store_cek_talepleri','talep_id')
  ) m(cocuk,tur,ebeveyn,hedef)
    JOIN pg_temp.firma_sil_tablolar ct ON ct.ad=m.cocuk
    JOIN pg_temp.firma_sil_tablolar pt ON pt.ad=m.ebeveyn
    WHERE EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=ct.oid AND attname='kayit_turu' AND NOT attisdropped)
      AND EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=ct.oid AND attname='kayit_id' AND NOT attisdropped)
  LOOP
    INSERT INTO pg_temp.firma_sil_baglar
    SELECT ct.oid,pt.oid,format('t.kayit_turu=%L AND to_jsonb(t)->''kayit_id''=p.veri->%L',r.tur,r.hedef),ARRAY['kayit_id'],true,false
    FROM pg_temp.firma_sil_tablolar ct,pg_temp.firma_sil_tablolar pt WHERE ct.ad=r.cocuk AND pt.ad=r.ebeveyn;
  END LOOP;

  -- Kapsam okunurken bağımlı tablolara yazı girmesini engelle. SELECT/export serbest;
  -- kilitler yalnız bu transaction boyunca tutulur, trigger/FK devre dışı bırakılmaz.
  FOR r IN SELECT DISTINCT t.oid,t.ad FROM pg_temp.firma_sil_tablolar t
    WHERE t.firma_kolonu OR EXISTS(SELECT 1 FROM pg_temp.firma_sil_baglar b WHERE b.cocuk=t.oid OR b.ebeveyn=t.oid)
    ORDER BY t.oid LOOP
    EXECUTE format('LOCK TABLE public.%I IN SHARE ROW EXCLUSIVE MODE',r.ad);
  END LOOP;
  FOR r IN SELECT * FROM pg_temp.firma_sil_tablolar WHERE firma_kolonu AND NOT korunur LOOP
    EXECUTE format('INSERT INTO pg_temp.firma_sil_hedef SELECT %s,%s,to_jsonb(t) FROM public.%I t WHERE t.firma_id=$1 ON CONFLICT DO NOTHING',r.oid,r.anahtar,r.ad) USING p_firma;
  END LOOP;
  -- Yayının firma aidiyetinin tek kaynağı künye zinciridir.
  INSERT INTO pg_temp.firma_sil_hedef
    SELECT 'public.yayin_yonetimi'::regclass,jsonb_build_object('yayin_id',y.yayin_id),to_jsonb(y)
    FROM public.yayin_yonetimi y JOIN public.v_yayin_kunye k ON k.yayin_id=y.yayin_id
    WHERE k.firma_id=p_firma ON CONFLICT DO NOTHING;
  LOOP
    degisen:=0;
    FOR e IN SELECT b.*,t.ad,t.anahtar,t.firma_kolonu FROM pg_temp.firma_sil_baglar b
      JOIN pg_temp.firma_sil_tablolar t ON t.oid=b.cocuk WHERE b.sahiplik AND NOT t.korunur LOOP
      EXECUTE format('INSERT INTO pg_temp.firma_sil_hedef SELECT %s,%s,to_jsonb(t) FROM public.%I t WHERE %s EXISTS(SELECT 1 FROM pg_temp.firma_sil_hedef p WHERE p.tablo=%s AND %s) ON CONFLICT DO NOTHING',
        e.cocuk,e.anahtar,e.ad,CASE WHEN e.firma_kolonu THEN '(t.firma_id=$1 OR t.firma_id IS NULL) AND ' ELSE '' END,e.ebeveyn,e.eslesme) USING p_firma;
      GET DIAGNOSTICS n=ROW_COUNT;degisen:=degisen+n;
    END LOOP;
    EXIT WHEN degisen=0;
  END LOOP;
  SELECT coalesce(array_agg((veri->>'kullanici_id')::uuid),'{}'::uuid[]) INTO kimlikler
    FROM pg_temp.firma_sil_hedef WHERE tablo='public.kullanicilar'::regclass;

  -- Bekleyen mağaza siparişindeki ayrılmış stok serbest bırakılır. Teslim ve
  -- iptal kayıtlarında stok daha önce sonuçlandığından ikinci iade yapılmaz.
  UPDATE public.store_urunler u SET stok=u.stok+x.adet
  FROM (
    SELECT (s.veri->>'urun_id')::uuid AS urun_id,sum((s.veri->>'adet')::integer) AS adet
    FROM pg_temp.firma_sil_hedef s WHERE s.tablo='public.store_siparisler'::regclass
      AND s.veri->>'durum' NOT IN ('iptal','teslim_edildi')
    GROUP BY s.veri->>'urun_id'
  ) x WHERE u.urun_id=x.urun_id;

  -- Korunan kayıtlardaki kişi/işlemi-yapan FK'sı kaldırılır; ortak satır silinmez.
  FOR e IN SELECT b.*,t.ad,t.anahtar FROM pg_temp.firma_sil_baglar b
    JOIN pg_temp.firma_sil_tablolar t ON t.oid=b.cocuk WHERE b.gercek_fk LOOP
    IF EXISTS(SELECT 1 FROM unnest(e.kolonlar) k JOIN pg_attribute a ON a.attrelid=e.cocuk AND a.attname=k WHERE a.attnotnull) THEN CONTINUE; END IF;
    SELECT string_agg(format('%I=NULL',k),',') INTO kosul FROM unnest(e.kolonlar) k;
    EXECUTE format('UPDATE public.%I t SET %s WHERE NOT EXISTS(SELECT 1 FROM pg_temp.firma_sil_hedef s WHERE s.tablo=%s AND to_jsonb(t) @> s.anahtar) AND EXISTS(SELECT 1 FROM pg_temp.firma_sil_hedef p WHERE p.tablo=%s AND %s)',e.ad,kosul,e.cocuk,e.ebeveyn,e.eslesme);
  END LOOP;

  -- Çocuklardan ebeveyne sil. Tüm FK'ler (CASCADE dahil) bekleyen çocuk
  -- satırı kalmadığını denetler; başka firmaya taşma halinde işlem geri alınır.
  LOOP
    degisen:=0;
    FOR v_tablo IN SELECT DISTINCT s.tablo,m.ad,m.anahtar FROM pg_temp.firma_sil_hedef s JOIN pg_temp.firma_sil_tablolar m ON m.oid=s.tablo ORDER BY s.tablo DESC LOOP
      engel:='';
      FOR e IN SELECT b.*,c.ad AS cocuk_ad FROM pg_temp.firma_sil_baglar b JOIN pg_temp.firma_sil_tablolar c ON c.oid=b.cocuk WHERE b.ebeveyn=v_tablo.tablo AND b.gercek_fk LOOP
        -- eslesme'deki p.veri ebeveyn satırıdır; çocuk t alias'ı alt sorgudadır.
        engel:=engel||format(' AND NOT EXISTS(SELECT 1 FROM public.%I t WHERE %s)',e.cocuk_ad,replace(e.eslesme,'p.veri','to_jsonb(ana)'));
      END LOOP;
      EXECUTE format('DELETE FROM public.%I ana USING pg_temp.firma_sil_hedef s WHERE s.tablo=%s AND to_jsonb(ana) @> s.anahtar%s',v_tablo.ad,v_tablo.tablo,engel);
      GET DIAGNOSTICS n=ROW_COUNT;degisen:=degisen+n;silinen:=silinen+n;
      EXECUTE format('DELETE FROM pg_temp.firma_sil_hedef s WHERE s.tablo=%s AND NOT EXISTS(SELECT 1 FROM public.%I t WHERE to_jsonb(t) @> s.anahtar)',v_tablo.tablo,v_tablo.ad);
    END LOOP;
    SELECT count(*) INTO kalan FROM pg_temp.firma_sil_hedef;
    EXIT WHEN kalan=0;
    IF degisen=0 THEN RAISE EXCEPTION 'FIRMA_SIL:bag_temizlenemedi' USING DETAIL='Silme tamamlanamadı; bütün değişiklikler geri alındı.'; END IF;
  END LOOP;

  -- Firma kullanıcılarının giriş kimlikleri de aynı transaction'da kapanır.
  -- Aynı Auth kimliği eczacı/üye olarak kullanılıyorsa o kimlik korunur.
  IF to_regclass('auth.users') IS NOT NULL THEN
    FOREACH k_id IN ARRAY kimlikler LOOP
      ortak_kimlik:=false;
      FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
        WHERE ns.nspname='public' AND c.relname IN ('eclub_kisiler','eczanem_musteriler') AND c.relkind='r'
          AND EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attname='auth_user_id' AND NOT a.attisdropped) LOOP
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE auth_user_id=$1)',r.relname) INTO ortak_kimlik USING k_id;
        EXIT WHEN ortak_kimlik;
      END LOOP;
      IF NOT ortak_kimlik THEN EXECUTE 'DELETE FROM auth.users WHERE id=$1' USING k_id; END IF;
    END LOOP;
  END IF;
  RETURN jsonb_build_object('durum','silindi','firma_id',p_firma,'silinen_kayit',silinen,'kullanici_sayisi',cardinality(kimlikler));
END;
$sil$;
REVOKE ALL ON FUNCTION public.admin_firma_kalici_sil(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_firma_kalici_sil(uuid,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
SELECT true AS firma_kalici_silme_hazir;
