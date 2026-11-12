import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
const bin = process.argv[2];
if (!bin) throw Error('Yerel PostgreSQL bin yolu gerekli');
const root = mkdtempSync('/tmp/cogniti-kko-proforma-'), data = join(root, 'data');
const config = { host: root, port: 55485, user: 'proforma_test', database: 'postgres', statement_timeout: 5000 };
const a = new pg.Client(config), b = new pg.Client(config);
let started = false, connected = false;
const run = (name, args) => execFileSync(join(bin, name), args, { stdio: 'pipe' });
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const seller = '15853eba-a94c-4528-9a07-0ee0b8677a02';
const read = async (user, approved = false, firm = 1, page = 0, search = '') => (await a.query(
 'SELECT cogniti_kko_proformalari_oku($1,$2,$3,$4,$5) r', [id(user), id(firm), page, search, approved])).rows[0].r;
const approve = (db, user, order, note = '') => db.query('SELECT cogniti_kko_proforma_onayla($1,$2,$3,$4) r', [id(user), id(1), id(order), note]);
try {
 run('initdb', ['-D', data, '-U', config.user, '-A', 'trust', '--no-locale', '--encoding=UTF8']);
 run('pg_ctl', ['-D', data, '-l', join(root, 'log'), '-o', `-k ${root} -h '' -p ${config.port}`, '-w', 'start']); started=true;
 await a.connect();await b.connect();connected=true;
 assert.equal((await a.query('SELECT inet_server_addr() a')).rows[0].a,null);
 await a.query(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,firma_adi text,adres text,vergi_dairesi text,vergi_numarasi text,aktif boolean,firma_admin_aktif boolean);
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,aktif_mi boolean,ad text,soyad text);
 CREATE TABLE viva_etkinlikler(etkinlik_id uuid PRIMARY KEY,firma_id uuid,baslangic timestamptz,bitis timestamptz,baslik text,durum text);
 CREATE TABLE cogniti_viva_tuketim_isleri(etkinlik_id uuid PRIMARY KEY,firma_id uuid,sahip_id uuid,durum text,donem date,kapanis timestamptz,toplam_saniye numeric,katilim_sayisi integer,usd_dakika numeric,kur numeric,katsayi numeric);
 `);
 await a.query("INSERT INTO firmalar VALUES($1,'Firma A','Adres','VD','111',true,true),($2,'Firma B','','','',true,true)",[id(1),id(2)]);
 await a.query("INSERT INTO kullanicilar VALUES($1,$5,'admin',true,'Test','Admin'),($2,$5,'firma_admin',true,'Firma','Admini'),($3,$6,'firma_admin',true,'Diğer','Admin'),($4,$5,'pm',true,'Merve','Duran')",[id(10),id(11),id(12),id(13),id(1),id(2)]);
 for(const [n,date,seconds,status] of [[30,'2026-10-10',360000,'tamam'],[31,'2026-10-20',600,'tamam'],[32,'2026-10-25',0,'bekliyor'],[33,'2026-11-10',60,'tamam'],[34,'2026-09-10',60,'tamam'],[35,'2026-08-10',60,'tamam']]){
 await a.query("INSERT INTO viva_etkinlikler VALUES($1,$2,$3::date+time '12:00',$3::date+time '13:00','Yayın '||$4::text,'sona_erdi')",[id(n),id(1),date,n]);
 await a.query("INSERT INTO cogniti_viva_tuketim_isleri VALUES($1,$2,$3,$4,date_trunc('month',$5::date)::date,$5::date+time '13:00',$6,100,.004,55,1.5)",[id(n),id(1),id(13),status,date,seconds]);
 }
 const sql=readFileSync('scripts/sql/cogniti_viva_proforma_onayi.sql','utf8');await a.query(sql);await a.query(sql);
 const read=async(user,month='2026-10-01',approved=false)=>(await a.query('SELECT cogniti_viva_proforma_oku($1,$2,$3,$4) r',[id(user),id(1),month,approved])).rows[0].r;
 const approve=(db,user,month='2026-10-01',note='')=>db.query('SELECT cogniti_viva_proforma_onayla($1,$2,$3,$4) r',[id(user),id(1),month,note]);
 let r=await read(11);assert.equal(r.belge.satirlar.length,2);assert.equal(r.belge.satirlar[0].birim_fiyat,.33);assert.equal(r.belge.toplam_tutar,1983.3);assert.equal(r.belge.kdv,396.66);assert.equal(r.belge.genel_tutar,2379.96);assert.equal(r.bekleyen,1);assert.equal(r.onaylanabilir,false);
 await assert.rejects(approve(a,11),e=>e.code==='22023');
 await assert.rejects(read(12),e=>e.code==='42501');await assert.rejects(read(13),e=>e.code==='42501');await assert.rejects(read(11,'2026-10-01',true),e=>e.code==='42501');
 assert.equal((await read(10,'2026-11-01')).belge,null);await assert.rejects(approve(a,11,'2026-11-01'),e=>e.code==='22023');
 await a.query("UPDATE cogniti_viva_tuketim_isleri SET durum='tamam' WHERE etkinlik_id=$1",[id(32)]);
 const before=(await a.query('SELECT jsonb_agg(to_jsonb(j) ORDER BY etkinlik_id) v FROM cogniti_viva_tuketim_isleri j')).rows[0].v;
 assert.equal((await read(11)).onaylanabilir,true);
 const first=(await approve(a,11)).rows[0].r;assert.equal(first.tur,'firma');
 assert.equal((await read(10,'2026-10-01',true)).belge.satirlar.length,2);
 assert.deepEqual((await approve(a,10,'2026-10-01','Tekrar')).rows[0].r,first);
 assert.deepEqual((await a.query('SELECT jsonb_agg(to_jsonb(j) ORDER BY etkinlik_id) v FROM cogniti_viva_tuketim_isleri j')).rows[0].v,before);
 await a.query("UPDATE firmalar SET adres='Yeni adres' WHERE firma_id=$1",[id(1)]);
 await a.query("UPDATE viva_etkinlikler SET baslik='Yeni ad' WHERE etkinlik_id=$1",[id(30)]);
 r=await read(10,'2026-10-01',true);assert.equal(r.belge.alici.adres,'Adres');assert.equal(r.belge.satirlar[0].yayin_adi,'Yayın 30');
 await assert.rejects(approve(a,10,'2026-09-01',' '),e=>e.code==='22023');
 assert.equal((await approve(a,10,'2026-09-01','Firma talebi')).rows[0].r.aciklama,'Firma talebi');
 await a.query('BEGIN');await approve(a,10,'2026-08-01','İlk açıklama');let finished=false;
 const pending=approve(b,11,'2026-08-01').then(r=>{finished=true;return r;});await new Promise(r=>setTimeout(r,80));assert.equal(finished,false);await a.query('COMMIT');assert.equal((await pending).rows[0].r.aciklama,'İlk açıklama');
 assert.equal((await a.query('SELECT count(*) n FROM cogniti_viva_proforma_onaylari')).rows[0].n,'3');
 await a.query('SET ROLE authenticated');await assert.rejects(a.query('SELECT * FROM cogniti_viva_proforma_onaylari'),e=>e.code==='42501');await a.query('RESET ROLE');
 console.log('Geçti: aylık çok satırlı belge, 0,33 TL, KDV, ay kapanışı, bekleyen kullanım, firma/admin yetkisi, zorunlu açıklama, belge koruması, tekrar/eşzamanlı onay, tüketim kayıtlarına dokunulmaması.');
} finally {
 if (connected) {await a.end();await b.end();}
 if(started)run('pg_ctl',['-D',data,'-m','immediate','-w','stop']);
}
