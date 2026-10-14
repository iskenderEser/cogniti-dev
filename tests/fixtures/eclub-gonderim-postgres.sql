-- Yalnız izole yerel test kümesi. Gerçek üyeler veya Supabase bağlantısı yoktur.
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean,eclub_aktif boolean);
CREATE TABLE urunler(urun_id uuid PRIMARY KEY);
CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid REFERENCES firmalar,takim_id uuid,rol text,aktif_mi boolean);
CREATE TABLE eclub_kisiler(kisi_id uuid PRIMARY KEY,rol text,auth_user_id uuid,aktif_mi boolean DEFAULT true);
CREATE TABLE ogrenme_araclari(arac_id uuid PRIMARY KEY,legacy_video_id uuid);
CREATE TABLE yayin_yonetimi(yayin_id uuid PRIMARY KEY,firma_id uuid,takim_id uuid,durum text,hedef_roller text[],urun_id uuid,
 arac_id uuid,arac_turu text,yayin_tarihi timestamptz,tekrar_periyot_gun integer DEFAULT 0);
CREATE VIEW v_yayin_detay AS SELECT * FROM yayin_yonetimi;
CREATE VIEW v_yayin_kunye AS SELECT yayin_id,urun_id FROM yayin_yonetimi;
CREATE TABLE yayin_tekrar_kayitlari(yayin_id uuid,tur_no integer,baslangic_tarihi timestamptz);
CREATE TABLE eclub_utt_yayin_incelemeleri(utt_id uuid,yayin_id uuid,tamamlandi_at timestamptz);
CREATE TABLE eclub_kisi_eczane(id uuid PRIMARY KEY,kisi_id uuid,eczane_id uuid,aktif_mi boolean);
CREATE TABLE eclub_eczane_firma(id uuid PRIMARY KEY,eczane_id uuid,firma_id uuid,aktif_mi boolean);
CREATE TABLE eclub_utt_eczane(id uuid PRIMARY KEY,eczane_firma_id uuid,utt_id uuid,aktif_mi boolean);
CREATE TABLE eclub_oneri_kayitlari(oneri_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),oneren_id uuid REFERENCES kullanicilar,
 kisi_id uuid REFERENCES eclub_kisiler,yayin_id uuid REFERENCES yayin_yonetimi,arac_id uuid REFERENCES ogrenme_araclari,
 arac_turu text,video_id uuid,oneri_baslangic timestamptz,oneri_bitis timestamptz,izlendi_mi boolean,created_at timestamptz DEFAULT now());
CREATE TABLE sistem_ayarlari(anahtar text PRIMARY KEY,deger jsonb,aciklama text,updated_at timestamptz DEFAULT now());

-- Üye davranışını değiştirmeden sınamak için mevcut öğrenme RPC'lerinin bağımlılıkları.
ALTER TABLE yayin_yonetimi ADD COLUMN ogrenme_araci_puani integer DEFAULT 40,
 ADD COLUMN video_puani integer DEFAULT 40,ADD COLUMN arac_sure_saniye integer DEFAULT 120,
 ADD COLUMN video_suresi_saniye integer DEFAULT 120;
CREATE OR REPLACE VIEW v_yayin_detay AS SELECT * FROM yayin_yonetimi;
CREATE FUNCTION get_urun_from_yayin(uuid) RETURNS uuid LANGUAGE sql AS $$SELECT urun_id FROM yayin_yonetimi WHERE yayin_id=$1$$;
CREATE TABLE eclub_izleme_kayitlari(izleme_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),yayin_id uuid,kisi_id uuid,
 oneri_id uuid UNIQUE REFERENCES eclub_oneri_kayitlari,arac_turu text DEFAULT 'video',video_suresi_saniye integer DEFAULT 120,
 tamamlandi_mi boolean DEFAULT false,izleme_baslangic timestamptz DEFAULT now(),izleme_bitis timestamptz,
 tamamlama_kaniti jsonb,soru_hakki_var_mi boolean,soru_hakki_nedeni text,soru_erisimi_acik_mi boolean,soru_indeksleri integer[]);
CREATE TABLE eclub_kazanilan_puanlar(kisi_id uuid,eczane_id uuid NOT NULL,yayin_id uuid,izleme_id uuid REFERENCES eclub_izleme_kayitlari,
 puan_turu text,puan integer,urun_id uuid,created_at timestamptz DEFAULT now(),UNIQUE(izleme_id,puan_turu));
CREATE TABLE eclub_utt_puanlari(utt_id uuid,kisi_id uuid,yayin_id uuid,izleme_id uuid,oneri_id uuid UNIQUE REFERENCES eclub_oneri_kayitlari,urun_id uuid,puan integer);
CREATE TABLE eclub_dogru_cevap_kayitlari(kayit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kisi_id uuid,yayin_id uuid,
 izleme_id uuid REFERENCES eclub_izleme_kayitlari,soru_index integer,kazanilan_puan integer,urun_id uuid,UNIQUE(izleme_id,soru_index));
CREATE TABLE eclub_yanlis_cevap_kayitlari(kayit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kisi_id uuid,yayin_id uuid,
 izleme_id uuid REFERENCES eclub_izleme_kayitlari,soru_index integer,kaybedilen_puan integer CHECK(kaybedilen_puan=0),urun_id uuid,UNIQUE(izleme_id,soru_index));
CREATE TABLE eclub_ileri_sarma_kayitlari(kayit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),olay_id uuid UNIQUE,
 izleme_id uuid REFERENCES eclub_izleme_kayitlari,kisi_id uuid,yayin_id uuid,urun_id uuid,
 atlama_baslangic integer,atlama_bitis integer,atlanan_sure integer,kaybedilen_puan integer);
