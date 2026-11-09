// Yalnız /tmp Unix socket ve sahte temel tablolar; canlı veriye bağlanmaz.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
const bin=process.env.ESNEK_PG_BIN;if(!bin)throw Error('ESNEK_PG_BIN gerekli.');
const root=mkdtempSync('/tmp/cogniti-bm-oneri-token-'),data=join(root,'data'),socket=join(root,'socket');mkdirSync(socket);
let db,started=false;const tests=[];const check=async(n,f)=>{await f();tests.push(n);console.log(`OK ${tests.length}: ${n}`);};
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
try{
 execFileSync(join(bin,'initdb'),['-D',data,'-U','bm_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',data,'-l',join(root,'log'),'-o',`-k ${socket} -h '' -p 55467`,'-w','start'],{stdio:'pipe'});started=true;
 db=new pg.Client({host:socket,port:55467,user:'bm_test',database:'postgres'});await db.connect();assert.equal((await db.query('SELECT inet_server_addr() a')).rows[0].a,null);
 await db.query(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid);
 CREATE TABLE oneri_kayitlari(oneri_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),oneren_id uuid,kullanici_id uuid,yayin_id uuid);
 CREATE TABLE test_hesap(firma_id uuid PRIMARY KEY,kalan integer);
 CREATE TABLE test_tuketim(kimlik text PRIMARY KEY,islem_turu text,miktar integer);
 CREATE FUNCTION cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text) RETURNS void LANGUAGE plpgsql AS $f$
 BEGIN
 IF NOT EXISTS(SELECT 1 FROM test_hesap WHERE firma_id=$1) THEN RAISE EXCEPTION 'Token hesabı bulunamadı.' USING ERRCODE='22023';END IF;
 UPDATE test_hesap SET kalan=kalan-1 WHERE firma_id=$1 AND kalan>0;
 IF NOT FOUND THEN RAISE EXCEPTION 'Yetersiz token bakiyesi.' USING ERRCODE='22023';END IF;
 INSERT INTO test_tuketim VALUES($8,$6,1);
 END;$f$;
 CREATE FUNCTION test_diger_kontrol() RETURNS trigger LANGUAGE plpgsql AS $f$BEGIN
 IF NEW.kullanici_id IS NULL THEN RAISE EXCEPTION 'Alıcı zorunlu.' USING ERRCODE='23514'; END IF;RETURN NEW;END;$f$;
 CREATE TRIGGER test_diger_kural BEFORE INSERT ON oneri_kayitlari FOR EACH ROW EXECUTE FUNCTION test_diger_kontrol();
 INSERT INTO kullanicilar VALUES('${id(1)}','${id(10)}');INSERT INTO test_hesap VALUES('${id(10)}',3);`);
 await db.query(readFileSync('scripts/sql/cogniti_token_tclub_kurulum.sql','utf8'));
 const send=()=>db.query('INSERT INTO oneri_kayitlari(oneren_id,kullanici_id,yayin_id) VALUES($1,$2,$3)',[id(1),id(2),id(3)]);
 await check('Önceki gerçek tetikleyici öneri başına token tüketir',async()=>{await send();assert.equal((await db.query('SELECT kalan FROM test_hesap')).rows[0].kalan,2);assert.equal((await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n,1);});
 const rollback=readFileSync('scripts/sql/bm_oneri_token_tuketimini_kaldir.sql','utf8');
 await check('Kaldırma SQLi iki kez kurulabilir; yalnız hedef tetikleyici ve işlev kalkar',async()=>{await db.query(rollback);await db.query(rollback);assert.equal((await db.query("SELECT to_regprocedure('public.cogniti_token_tclub_oneri_kaydet()') x")).rows[0].x,null);assert.equal((await db.query("SELECT count(*)::int n FROM pg_trigger WHERE tgname='test_diger_kural' AND NOT tgisinternal")).rows[0].n,1);});
 await check('Öneri yeni tüketim yazmaz; kalan ve geçmiş rapor kaynağı değişmez',async()=>{await send();await send();assert.equal((await db.query('SELECT kalan FROM test_hesap')).rows[0].kalan,2);assert.equal((await db.query("SELECT count(*)::int n FROM test_tuketim WHERE islem_turu='tclub_oneri'")).rows[0].n,1);assert.equal((await db.query('SELECT count(*)::int n FROM oneri_kayitlari')).rows[0].n,3);});
 await check('Token sıfırken öneri kaydı oluşturulur',async()=>{await db.query('UPDATE test_hesap SET kalan=0');await send();assert.equal((await db.query('SELECT kalan FROM test_hesap')).rows[0].kalan,0);});
 await check('Token hesabı yokken öneri kaydı oluşturulur; geçmiş tüketim silinmez',async()=>{await db.query('DELETE FROM test_hesap');await send();assert.equal((await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n,1);});
 await check('Token dışındaki veritabanı kontrolü korunur',async()=>{await assert.rejects(db.query('INSERT INTO oneri_kayitlari(oneren_id,yayin_id) VALUES($1,$2)',[id(1),id(3)]),e=>e.code==='23514');});
 writeFileSync('docs/BM_ONERI_TOKEN_KALDIR_TEST_SONUCLARI.json',JSON.stringify({postgres:(await db.query('SHOW server_version')).rows[0].server_version,passed:tests.length,tests,scope:'Yerel Unix socket, sahte temel tablolar; repodaki eski tetikleyici ve kaldırma SQLi değiştirilmeden çalıştırıldı. Tüketim alt işlevi gözlemci stub; canlı sistem/gerçek kullanıcı testi değildir.'},null,2)+'\n');
}finally{if(db)await db.end();if(started)execFileSync(join(bin,'pg_ctl'),['-D',data,'-m','immediate','-w','stop'],{stdio:'pipe'});rmSync(root,{recursive:true,force:true});}
