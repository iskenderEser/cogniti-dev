// İzole PostgreSQL kontrolü; canlı DB'ye bağlanmaz.
// ECLUB_SQL_TEST_RUNTIME=/.../pglite/dist/index.js node scripts/denetim/eclub-cek-talepleri-gorunumu-dogrula.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const runtime=process.env.ECLUB_SQL_TEST_RUNTIME;
if (!runtime) throw new Error('ECLUB_SQL_TEST_RUNTIME PGlite dosyasını göstermeli.');
const { PGlite }=await import(pathToFileURL(runtime).href);
const db=new PGlite();
const read=async p=>readFile(new URL('../../'+p,import.meta.url),'utf8');
const ekle=await read('scripts/sql/eclub_cek_talepleri_test_verisi_ekle.sql');
const temizle=await read('scripts/sql/eclub_cek_talepleri_test_verisi_temizle.sql');
const kaynak=await read('scripts/sql/eclub_store_yeni_donem_satis_sartli_cek.sql');
await db.exec(`
CREATE TABLE eclub_eczaneler(eczane_id uuid PRIMARY KEY,gln text);
CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif bool,eclub_aktif bool,eclub_store_aktif bool);
CREATE TABLE yayin_yonetimi(yayin_id uuid PRIMARY KEY,satis_sarti_tipi text,cek_karsiligi_var_mi bool);
CREATE TABLE eclub_kisiler(kisi_id uuid PRIMARY KEY,rol text);
CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,takim_id uuid,bolge_id uuid,rol text,aktif_mi bool);
CREATE TABLE eclub_kisi_eczane(kisi_id uuid,eczane_id uuid,aktif_mi bool);
CREATE TABLE eclub_eczane_master(gln text,kaynak text);
CREATE TABLE eclub_eczane_firma(id uuid,eczane_id uuid,firma_id uuid,aktif_mi bool);
CREATE TABLE eclub_utt_eczane(eczane_firma_id uuid,utt_id uuid,aktif_mi bool);
CREATE TABLE urunler(urun_id uuid PRIMARY KEY,urun_adi text);
CREATE TABLE v_yayin_kunye(yayin_id uuid,urun_id uuid,firma_id uuid);
CREATE TABLE eclub_cek_teslimat_outbox(talep_id uuid);
CREATE TABLE eclub_bildirimler(kayit_id uuid,kayit_turu text);
CREATE TABLE eclub_siparis_utt_onaylari(talep_id uuid);
CREATE TABLE eclub_store_puan_devirleri(kaynak_talep_id uuid,kullanilan_talep_id uuid);
CREATE FUNCTION eclub_eczane_depolari_hazir(uuid) RETURNS bool LANGUAGE sql AS $$ SELECT false $$;
`);
await db.exec(kaynak.match(/CREATE TABLE IF NOT EXISTS public\.eclub_store_cek_talepleri \([\s\S]*?\n\);/)[0]);
await db.exec(`ALTER TABLE eclub_store_cek_talepleri ADD COLUMN tm_id uuid REFERENCES kullanicilar(kullanici_id),ADD COLUMN tm_onay_tarihi timestamptz;
CREATE UNIQUE INDEX test_donem_tekil ON eclub_store_cek_talepleri(eczane_id,yayin_id,donem_kodu) WHERE durum<>'iptal';
ALTER TABLE eclub_store_cek_talepleri ADD CHECK(durum IN('beklemede','bm_onayinda','tm_onayinda','onaylandi','teslimat_bekliyor','cek_kodlari_gonderildi','iptal'));
`);
// Canlıdaki sipariş/depo kapısı aynen kurulur; eczanenin deposu hazır değildir.
const depoSql=await read('scripts/sql/eclub_depo_tercihleri.sql');
await db.exec(depoSql.match(/CREATE OR REPLACE FUNCTION public\.eclub_siparis_depo_kapisi\(\)[\s\S]*?END \$f\$;/)[0]);
await db.exec(`CREATE TRIGGER eclub_siparis_depo_kapisi_trg BEFORE INSERT
  ON eclub_store_cek_talepleri FOR EACH ROW EXECUTE FUNCTION eclub_siparis_depo_kapisi();`);
const kisi='3b0b6c01-428e-4797-a8ad-67d5d2400b5f',eczane='0d8385df-4eed-429e-b691-81acee1ad606',utt='765b6890-183f-4518-b887-07003ff5cdc7',firma='0c504d88-b9fb-40bb-beae-5bae33cb99ac';
const pubs=[['bc71b5d2-0c91-4a7e-aa19-1a17a7a66f50','siparissiz_cek','Laropen'],['3a6e0db1-bc42-44cf-ab16-b99630681ae9','serbest_siparis','Forma XL'],['f364c684-eadc-4ccc-8671-f333da7b555f','satis_sartli','Abilon']];
await db.exec(`
INSERT INTO firmalar VALUES('${firma}',true,true,true);
INSERT INTO eclub_eczaneler VALUES('${eczane}','1110000000003');
INSERT INTO eclub_eczane_master VALUES('1110000000003','test');
INSERT INTO eclub_kisiler VALUES('${kisi}','eczaci');
INSERT INTO eclub_kisi_eczane VALUES('${kisi}','${eczane}',true);
INSERT INTO eclub_eczane_firma VALUES('${firma}','${eczane}','${firma}',true);
INSERT INTO eclub_utt_eczane VALUES('${firma}','${utt}',true);
INSERT INTO kullanicilar VALUES('${utt}','${firma}',NULL,NULL,'utt',true),
('00000000-0000-4000-8000-000000000001','${firma}',NULL,NULL,'bm',true),
('00000000-0000-4000-8000-000000000002','${firma}',NULL,NULL,'tm',true);
`);
for (const [id,tip,ad] of pubs) {
  await db.query('INSERT INTO yayin_yonetimi VALUES($1,$2,true)',[id,tip]);
  await db.query('INSERT INTO urunler VALUES($1,$2)',[id,ad]);
  await db.query('INSERT INTO v_yayin_kunye VALUES($1,$1,$2)',[id,firma]);
}
await db.exec(ekle); await db.exec(ekle);
assert.equal((await db.query('SELECT count(*)::int AS n FROM eclub_store_cek_talepleri')).rows[0].n,7);
assert.equal((await db.query('SELECT count(*)::int AS n FROM eclub_store_cek_talepleri WHERE siparis_verildi_mi')).rows[0].n,0);
assert.equal((await db.query('SELECT count(DISTINCT durum)::int AS n FROM eclub_store_cek_talepleri')).rows[0].n,7);
await db.query("INSERT INTO eclub_store_cek_talepleri(talep_id,eczane_id,firma_id,yayin_id,talep_eden_kisi_id,toplanan_puan,talep_edilen_cek_tl,siparis_tipi,donem_kodu) SELECT gen_random_uuid(),eczane_id,firma_id,yayin_id,talep_eden_kisi_id,1,1,siparis_tipi,'2026-P4' FROM eclub_store_cek_talepleri LIMIT 1");
await db.exec(temizle);
assert.equal((await db.query('SELECT count(*)::int AS n FROM eclub_store_cek_talepleri')).rows[0].n,1);
await db.exec(temizle);
await db.exec(ekle);
await db.query("UPDATE eclub_store_cek_talepleri SET toplanan_puan=999 WHERE talep_id='e1300000-0000-4000-8000-000000000001'");
await assert.rejects(db.exec(ekle),/Sabit test kimliği/); await db.exec('ROLLBACK');
assert.equal((await db.query("SELECT toplanan_puan FROM eclub_store_cek_talepleri WHERE talep_id='e1300000-0000-4000-8000-000000000001'")).rows[0].toplanan_puan,999);
await db.exec(temizle);
await db.exec(`CREATE FUNCTION test_gonderim() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN INSERT INTO eclub_cek_teslimat_outbox VALUES(NEW.talep_id); RETURN NEW; END$$;
CREATE TRIGGER test_gonderim AFTER INSERT ON eclub_store_cek_talepleri FOR EACH ROW EXECUTE FUNCTION test_gonderim();`);
await assert.rejects(db.exec(ekle),/operasyon kaydı/); await db.exec('ROLLBACK');
assert.equal((await db.query('SELECT count(*)::int AS n FROM eclub_cek_teslimat_outbox')).rows[0].n,0);
assert.equal((await db.query('SELECT count(*)::int AS n FROM eclub_store_cek_talepleri')).rows[0].n,1);
await db.close();
console.log('4 kontrol geçti: 7 durum/tekrar çalışma, sınırlı temizlik, kimlik çakışması, gönderim trigger\'ında geri alma.');
