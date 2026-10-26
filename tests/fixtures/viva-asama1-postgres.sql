-- Yalnız yerel sahte temel şema; üretimde çalıştırılmaz.
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,firma_adi text NOT NULL,aktif boolean NOT NULL,eclub_aktif boolean NOT NULL);
CREATE TABLE takimlar(takim_id uuid PRIMARY KEY,firma_id uuid REFERENCES firmalar,takim_adi text);
CREATE TABLE bolgeler(bolge_id uuid PRIMARY KEY,takim_id uuid REFERENCES takimlar,bolge_adi text);
CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,ad text NOT NULL,soyad text NOT NULL,eposta text,
 rol text NOT NULL,firma_id uuid REFERENCES firmalar,takim_id uuid REFERENCES takimlar,bolge_id uuid REFERENCES bolgeler,aktif_mi boolean);
CREATE TABLE eclub_kisiler(kisi_id uuid PRIMARY KEY,auth_user_id uuid UNIQUE,ad text NOT NULL,soyad text NOT NULL,rol text);
CREATE TABLE eclub_eczane_firma(id uuid PRIMARY KEY,eczane_id uuid NOT NULL,firma_id uuid REFERENCES firmalar,aktif_mi boolean);
CREATE TABLE eclub_utt_eczane(id uuid PRIMARY KEY,eczane_firma_id uuid REFERENCES eclub_eczane_firma,utt_id uuid REFERENCES kullanicilar,aktif_mi boolean);
CREATE TABLE eclub_kisi_eczane(id uuid PRIMARY KEY,kisi_id uuid REFERENCES eclub_kisiler,eczane_id uuid,aktif_mi boolean);
