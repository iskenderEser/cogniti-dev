import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
const bin = process.argv[2];
if (!bin) throw Error('Yerel PostgreSQL bin yolu gerekli');
const root = mkdtempSync('/tmp/cogniti-abonelik-proforma-'), data = join(root, 'data');
const config = { host: root, port: 55482, user: 'proforma_test', database: 'postgres', statement_timeout: 5000 };
const a = new pg.Client(config), b = new pg.Client(config);
let started = false, connected = false;
const run = (name, args) => execFileSync(join(bin, name), args, { stdio: 'pipe' });
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const seller = '15853eba-a94c-4528-9a07-0ee0b8677a02';
const read = async (user, approved = false, firm = 1, page = 0, search = '') => (await a.query(
 'SELECT cogniti_abonelik_proformalari_oku($1,$2,$3,$4,$5) r', [id(user), id(firm), page, search, approved])).rows[0].r;
const approve = (db, user, order, note = '') => db.query('SELECT cogniti_abonelik_proforma_onayla($1,$2,$3,$4) r', [id(user), id(1), id(order), note]);
try {
 run('initdb', ['-D', data, '-U', config.user, '-A', 'trust', '--no-locale', '--encoding=UTF8']);
 run('pg_ctl', ['-D', data, '-l', join(root, 'log'), '-o', `-k ${root} -h '' -p ${config.port}`, '-w', 'start']); started = true;
 await a.connect(); await b.connect(); connected = true;
 assert.equal((await a.query('SELECT inet_server_addr() a')).rows[0].a, null);
 await a.query(`
 CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,firma_adi text,adres text,vergi_dairesi text,vergi_numarasi text,aktif boolean,firma_admin_aktif boolean);
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,aktif_mi boolean,ad text,soyad text);
 CREATE TABLE cogniti_satin_alma_bakiyeleri(bakiye_id uuid PRIMARY KEY,firma_id uuid,bakiye_turu text);
 CREATE TABLE cogniti_abonelik_siparisleri(siparis_id uuid PRIMARY KEY,firma_id uuid,siparis_veren_id uuid,hesap_turu text,created_at timestamptz,ilk_donem_token integer,aylik_token integer,birim_fiyat numeric,ilk_donem_kurus bigint,aylik_kurus bigint,ilk_donem_kdv_kurus bigint,kdv_kurus bigint);
 CREATE TABLE cogniti_esnek_paket_yuklemeleri(yukleme_id uuid PRIMARY KEY,abonelik_siparis_id uuid,firma_id uuid,created_at timestamptz,miktar integer);
 `);
 await a.query("INSERT INTO firmalar VALUES($1,'Firma A','Adres A','Vergi A','111',true,true),($2,'Firma B','Adres B','Vergi B','222',true,true),($3,'Satıcı','Satıcı Adres','Satıcı VD','333',true,false)", [id(1),id(2),seller]);
 await a.query("INSERT INTO kullanicilar VALUES($1,$5,'admin',true,'Test','Admin'),($2,$5,'firma_admin',true,'Firma','Admini'),($3,$6,'firma_admin',true,'Diğer','Admin'),($4,$5,'pm',true,'Merve','Test')", [id(10),id(11),id(12),id(13),id(1),id(2)]);
 await a.query("INSERT INTO cogniti_satin_alma_bakiyeleri VALUES($1,$3,'kisisel'),($2,$3,'firma_ortak')", [id(20),id(21),id(1)]);
 for (const order of [30,31,32]) await a.query("INSERT INTO cogniti_abonelik_siparisleri VALUES($1,$2,$3,'kisisel','2026-11-10T09:55:00Z',3500,5000,3.18,1113000,1590000,222600,318000)",[id(order),id(1),id(13)]);
 await a.query("INSERT INTO cogniti_esnek_paket_yuklemeleri VALUES($1,$3,$4,'2026-11-10T09:55:00Z',3500),($2,$3,$4,'2026-12-01T00:01:00Z',5000)",[id(40),id(41),id(30),id(1)]);
 const sql = readFileSync('scripts/sql/cogniti_abonelik_proforma_onayi.sql','utf8');
 await a.query(sql); await a.query(sql);
 assert.equal((await read(10)).siparisler.length,4);
 assert.equal((await read(11)).siparisler.length,4);
 assert.equal((await read(10,true)).toplam,0);
 await assert.rejects(read(12), e=>e.code==='42501');
 await assert.rejects(read(13), e=>e.code==='42501');
 await assert.rejects(read(11,true), e=>e.code==='42501');
 const row=(await read(11)).siparisler.find(s=>s.kayit_id===id(30));
 assert.equal(row.proforma.alici.unvan,'Firma A');
 assert.deepEqual(row.proforma.duzenleyen,{
  unvan:'Mill Danışmanlık Org. ve Eğt. Hiz. Ltd. Şti',
  adres:'Göktürk Merkez M. İstanbul C. Üstüküme S. No: D51 Göktürk-Eyüp-İstanbul',
  vergi_dairesi:'Gaziosmanpaşa',vergi_numarasi:'6210464784'
 });
 assert.equal(row.kdv,2226);
 assert.equal(row.token_adedi,3500);assert.equal(row.toplam_tutar,11130);
 assert.equal(row.proforma.belge_no,'PF-AB-'+id(30));
 const monthly=(await read(11)).siparisler.find(s=>s.kayit_id===id(41));
 assert.equal(monthly.paket_turu,'abonelik_devam');assert.equal(monthly.token_adedi,5000);
 assert.equal(monthly.toplam_tutar,15900);assert.equal(monthly.kdv,3180);
 assert.equal(monthly.proforma.belge_no,'PF-AD-'+id(41));
 assert.ok(!(await read(11)).siparisler.some(s=>s.kayit_id===id(40)));
 await assert.rejects(approve(a,11,40),e=>e.code==='22023');
 for (const note of ['', '   ']) await assert.rejects(approve(a,10,30,note),e=>e.code==='22023');
 await assert.rejects(approve(a,12,30,''),e=>e.code==='42501');
 await assert.rejects(approve(a,13,30,''),e=>e.code==='42501');
 await assert.rejects(a.query('SELECT cogniti_abonelik_proforma_onayla($1,$2,$3,$4)',[id(11),id(2),id(30),'']),e=>e.code==='42501');
 const first=(await approve(a,11,30)).rows[0].r;
 assert.equal(first.tur,'firma');
 assert.equal((await read(10,true)).toplam,1);
 const repeated=(await approve(a,10,30,'Admin tekrar')).rows[0].r;
 assert.deepEqual(repeated,first);
 const admin=(await approve(a,10,31,'Firma yöneticisi onaylayamadığı için.')).rows[0].r;
 assert.equal(admin.tur,'admin');assert.equal(admin.aciklama,'Firma yöneticisi onaylayamadığı için.');
 await a.query("UPDATE firmalar SET adres='Değişen adres' WHERE firma_id=$1",[id(1)]);
 assert.equal((await read(10,true)).siparisler.find(s=>s.kayit_id===id(30)).proforma.alici.adres,'Adres A');
 assert.equal((await read(10)).siparisler.find(s=>s.kayit_id===id(32)).proforma.alici.adres,'Değişen adres');
 await a.query('BEGIN');await approve(a,10,32,'İlk açıklama');
 let finished=false;const waiting=approve(b,11,32).then(r=>{finished=true;return r});
 await new Promise(r=>setTimeout(r,80));assert.equal(finished,false);
 await a.query('COMMIT');const race=(await waiting).rows[0].r;
 assert.equal(race.aciklama,'İlk açıklama');assert.equal(race.tur,'admin');
 assert.equal((await a.query('SELECT count(*) n FROM cogniti_abonelik_proforma_onaylari')).rows[0].n,'3');
 assert.equal((await read(10,true,1,0,'merve')).toplam,3);
 await approve(a,11,41);assert.equal((await read(10,true)).toplam,4);
 assert.equal((await read(10,false,1,0,'devam')).toplam,1);
 await a.query('SET ROLE authenticated');
 await assert.rejects(a.query('SELECT * FROM cogniti_abonelik_proforma_onaylari'),e=>e.code==='42501');
 await assert.rejects(a.query('SELECT cogniti_abonelik_proforma_onayla($1,$2,$3,$4)',[id(11),id(1),id(30),'']),e=>e.code==='42501');
 await a.query('RESET ROLE');
 await a.query('SET ROLE service_role');
 await assert.rejects(a.query('SELECT * FROM cogniti_abonelik_proforma_kayitlari'),e=>e.code==='42501');
 await a.query('SELECT cogniti_abonelik_proformalari_oku($1,$2,0,$3,true)',[id(10),id(1),'']);
 await a.query('RESET ROLE');
 console.log('Geçti: tekrar kurulum, firma/admin yetkisi, açıklama zorunluluğu, şirket izolasyonu, onaylı liste, belge snapshotı, tekrar ve eşzamanlı onay, doğrudan erişim yasağı.');
} finally {
 if (connected) {await a.end();await b.end();}
 if(started)run('pg_ctl',['-D',data,'-m','immediate','-w','stop']);
}
