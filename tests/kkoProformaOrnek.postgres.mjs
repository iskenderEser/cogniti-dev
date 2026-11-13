import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
const bin = process.argv[2];
if (!bin) throw Error('Yerel PostgreSQL bin yolu gerekli');
const root = mkdtempSync('/tmp/cogniti-kko-proforma-'), data = join(root, 'data');
const config = { host: root, port: 55484, user: 'proforma_test', database: 'postgres', statement_timeout: 5000 };
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
 run('pg_ctl', ['-D', data, '-l', join(root, 'log'), '-o', `-k ${root} -h '' -p ${config.port}`, '-w', 'start']); started = true;
 await a.connect(); await b.connect(); connected = true;
 assert.equal((await a.query('SELECT inet_server_addr() a')).rows[0].a,null);
 await a.query(`
 CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,firma_adi text,adres text,vergi_dairesi text,vergi_numarasi text,aktif boolean,firma_admin_aktif boolean);
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,aktif_mi boolean,ad text,soyad text);
 CREATE TABLE cogniti_satin_alma_bakiyeleri(bakiye_id uuid PRIMARY KEY,firma_id uuid,bakiye_turu text,sahip_id uuid,UNIQUE(firma_id,bakiye_id));
 CREATE TABLE cogniti_esnek_paket_yuklemeleri(yukleme_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid,bakiye_id uuid,siparis_id uuid,abonelik_siparis_id uuid,miktar integer CHECK(miktar>0),kalan integer CHECK(kalan BETWEEN 0 AND miktar),created_at timestamptz DEFAULT statement_timestamp(),son_kullanim_at timestamptz,kko_donem date,kko_birim_fiyat numeric(14,2),CHECK(son_kullanim_at>created_at),CHECK((siparis_id IS NOT NULL AND kko_donem IS NULL) OR (siparis_id IS NULL AND abonelik_siparis_id IS NULL AND kko_donem IS NOT NULL AND miktar=1500 AND kko_donem=date_trunc('month',kko_donem)::date AND kko_birim_fiyat>0)),FOREIGN KEY(firma_id,bakiye_id) REFERENCES cogniti_satin_alma_bakiyeleri(firma_id,bakiye_id));
 CREATE UNIQUE INDEX cogniti_kko_aylik_tek ON cogniti_esnek_paket_yuklemeleri(bakiye_id,kko_donem) WHERE kko_donem IS NOT NULL;
 CREATE TABLE cogniti_esnek_gonderim_tuketimleri(tuketim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),yukleme_id uuid REFERENCES cogniti_esnek_paket_yuklemeleri(yukleme_id),firma_id uuid,bakiye_id uuid,gonderen_id uuid REFERENCES kullanicilar(kullanici_id),akis text CHECK(akis IN ('yayin_acilis','eclub_oneri')),kaynak_id uuid,alici_id uuid,miktar integer CHECK(miktar=1),islem_kimligi text UNIQUE,created_at timestamptz DEFAULT statement_timestamp(),FOREIGN KEY(firma_id,bakiye_id) REFERENCES cogniti_satin_alma_bakiyeleri(firma_id,bakiye_id));
 CREATE TABLE eczanem_token_bloklari(yukleme_id uuid,firma_id uuid,bakiye_id uuid,durum text);
 CREATE TABLE cogniti_fiyat_tarifesi(tekil boolean PRIMARY KEY,degerler jsonb);
 INSERT INTO cogniti_fiyat_tarifesi VALUES(true,'{"kko_token_tl":9.90}');
 `);
 const f='0c504d88-b9fb-40bb-beae-5bae33cb99ac',u='b0838fab-302c-49b3-af44-9bad88945a0f',y='c06a2026-1110-4000-8000-000000000001';
 await a.query("INSERT INTO firmalar VALUES($1,'Hepifarma','Adres','VD','123',true,true)",[f]);
 await a.query("INSERT INTO kullanicilar VALUES($1,$3,'pm',true,'Merve','Duran'),($2,$3,'admin',true,'Test','Admin')",[u,id(10),f]);
 await a.query("INSERT INTO cogniti_satin_alma_bakiyeleri VALUES($1,$2,'kisisel',$3)",[id(20),f,u]);
 await a.query("INSERT INTO cogniti_esnek_paket_yuklemeleri(yukleme_id,firma_id,bakiye_id,siparis_id,miktar,kalan,son_kullanim_at) VALUES($1,$2,$3,$4,2500,2500,now()+interval '1 year')",[id(50),f,id(20),id(51)]);
 const baseline=(await a.query('SELECT to_jsonb(y) v FROM cogniti_esnek_paket_yuklemeleri y WHERE yukleme_id=$1',[id(50)])).rows[0].v;
 await a.query(readFileSync('scripts/sql/cogniti_kko_proforma_onayi.sql','utf8'));
 const seed=readFileSync('scripts/sql/cogniti_kko_proforma_silinecek_ornek.sql','utf8'),clean=readFileSync('scripts/sql/cogniti_kko_proforma_ornek_temizle.sql','utf8');
 await a.query(seed);await a.query(seed);
 assert.equal((await a.query('SELECT count(*) n FROM cogniti_esnek_gonderim_tuketimleri')).rows[0].n,'100');
 let list=(await a.query('SELECT cogniti_kko_proformalari_oku($1,$2) r',[id(10),f])).rows[0].r;
 assert.equal(list.toplam,1);let row=list.siparisler[0];
 assert.match(row.satin_alan_ad_soyad,/SİLİNECEK TEST KAYDI/);assert.match(row.proforma.test_notu,/SİLİNECEK TEST KAYDI/);
 assert.equal(row.token_adedi,100);assert.equal(row.toplam_tutar,990);assert.equal(row.kdv,198);assert.equal(row.onay,null);assert.equal(row.onaylanabilir,true);
 await a.query('SELECT cogniti_kko_proforma_onayla($1,$2,$3,$4)',[id(10),f,y,'SİLİNECEK TEST KAYDI — örnek admin onayı']);
 assert.equal((await a.query('SELECT cogniti_kko_proformalari_oku($1,$2,0,$3,true) r',[id(10),f,''])).rows[0].r.toplam,1);
 await a.query(clean);await a.query(clean);
 assert.equal((await a.query('SELECT count(*) n FROM cogniti_kko_proforma_onaylari')).rows[0].n,'0');
 assert.equal((await a.query('SELECT count(*) n FROM cogniti_esnek_gonderim_tuketimleri')).rows[0].n,'0');
 assert.deepEqual((await a.query('SELECT to_jsonb(y) v FROM cogniti_esnek_paket_yuklemeleri y WHERE yukleme_id=$1',[id(50)])).rows[0].v,baseline);
 // Aynı dönemde gerçek kaydı varsa örnek yazılmaz.
 await a.query("INSERT INTO cogniti_esnek_paket_yuklemeleri(yukleme_id,firma_id,bakiye_id,miktar,kalan,created_at,son_kullanim_at,kko_donem,kko_birim_fiyat) VALUES($1,$2,$3,1500,1500,'2026-10-01 00:00+03','2026-11-01 00:00+03','2026-10-01',9.9)",[id(60),f,id(20)]);
 await assert.rejects(a.query(seed),/zaten var/);await a.query('ROLLBACK');
 assert.equal((await a.query('SELECT count(*) n FROM cogniti_esnek_gonderim_tuketimleri')).rows[0].n,'0');
 assert.equal((await a.query('SELECT count(*) n FROM cogniti_esnek_paket_yuklemeleri WHERE yukleme_id=$1',[id(60)])).rows[0].n,'1');
 console.log('Geçti: 100 sahte kullanım, görünür SİLİNECEK notu, 990+198 TL, tekrar kurulum, proforma/admin onayı, dar temizlik, gerçek kayıt/bakiye korunması.');
} finally {
 if (connected) {await a.end();await b.end();}
 if(started)run('pg_ctl',['-D',data,'-m','immediate','-w','stop']);
}
