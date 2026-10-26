// Yalnız geçici yerel PostgreSQL, sahte kullanıcılar ve sahte Resend yanıtları.
import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';

const bin = process.env.VIVA_PG_BIN;
if (!bin) throw Error('VIVA_PG_BIN gerekli.');
const root = mkdtempSync('/tmp/cogniti-viva-eposta-gonderim-');
const dir = join(root, 'data'), socket = join(root, 'socket'), port = 55451;
mkdirSync(socket);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const config = { host: socket, port, user: 'viva_test', database: 'postgres' };
const key = 'yalniz-yerel-test-anahtari';
const token = davetId => crypto.createHmac('sha256', key).update(`viva-eposta-davet-v1:${davetId}`).digest('base64url');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
let db, started = false;
let assertions = 0;
const eq = (a,b) => { assertions++; assert.deepEqual(a,b); };
const form = (n, durum, adresler) => ({ etkinlik_id:id(n), baslik:`Yayın ${n}`, aciklama:'',
 yayin_turu:'planli', durum, baslangic:new Date(Date.now()+3600000).toISOString(),
 bitis:new Date(Date.now()+7200000).toISOString(), katilimcilar:[], davet_epostalari:adresler });
const candidate = (n, address) => ({ davet_id:id(n), eposta:address, token_hash:hash(token(id(n))) });
const save = (data, candidates, op='olustur') => db.query('SELECT viva_eposta_kaydet($1,$2,$3::jsonb,$4::jsonb) AS v',
 [id(1),op,JSON.stringify(data),JSON.stringify(candidates)]).then(r=>r.rows[0].v);
const claim = (lease, client=db) => client.query('SELECT viva_eposta_is_al($1,$2,$3) AS v',
 [id(lease),'Cogniti Viva <viva@example.invalid>','https://cogniti.example']).then(r=>r.rows[0].v);
const complete = (davet,lease,result,code=null,provider=null,delay=0) => db.query(
 'SELECT viva_eposta_is_bitir($1,$2,$3,$4,$5,$6) AS v',[id(davet),id(lease),result,code,provider,delay]).then(r=>r.rows[0].v);
const state = davet => db.query('SELECT durum,deneme_sayisi,sonraki_deneme,gonderim_zamani,saglayici_id,hata_kodu,kilit_id,icerik FROM viva_eposta_gonderimleri WHERE davet_id=$1',[id(davet)]).then(r=>r.rows[0]);

try {
 execFileSync(join(bin,'initdb'),['-D',dir,'-U','viva_test','-A','trust','--no-locale','--encoding=UTF8']);
 execFileSync(join(bin,'pg_ctl'),['-D',dir,'-l',join(root,'postgres.log'),'-o',`-k ${socket} -h '' -p ${port}`,'-w','start']);
 started=true;db=new pg.Client(config);await db.connect();
 for (const file of ['tests/fixtures/viva-asama1-postgres.sql','scripts/sql/viva_asama1.sql',
  'scripts/sql/viva_anlik_planlama.sql','scripts/sql/viva_davet_kapsami.sql','scripts/sql/viva_eposta_davetleri.sql',
  'scripts/sql/viva_eposta_gonderim_isleyici.sql']) await db.query(readFileSync(file,'utf8'));
 await db.query(readFileSync('scripts/sql/viva_eposta_gonderim_isleyici.sql','utf8'));
 await db.query('INSERT INTO firmalar VALUES($1,$2,true,true)',[id(100),'Firma']);
 await db.query('INSERT INTO takimlar VALUES($1,$2,$3)',[id(110),id(100),'Takım']);
 await db.query('INSERT INTO bolgeler VALUES($1,$2,$3)',[id(120),id(110),'Bölge']);
 await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,$4,$5,$6,$7,$8,true)',
  [id(1),'Yerel','Yayıncı','yerel@example.invalid','utt',id(100),id(110),id(120)]);

 const planned=form(1000,'planlandi',['bir@example.invalid']);
 await save(planned,[candidate(2000,planned.davet_epostalari[0])]);
 eq((await state(2000)).durum,'bekliyor');
 const first=await claim(3000);eq(first.davet_id,id(2000));eq(first.deneme_sayisi,1);
 eq(first.icerik.to,'bir@example.invalid');eq(JSON.stringify(first.icerik).includes(token(id(2000))),false);
 eq(await claim(3001),null);
 eq(await complete(2000,3001,'gonderildi',null,'yanlis-kilit'),false);
 eq(await complete(2000,3000,'gonderildi',null,'resend-1'),true);
 eq((await state(2000)).durum,'gonderildi');eq((await state(2000)).saglayici_id,'resend-1');
 eq(await claim(3002),null);

 const draft=form(1001,'taslak',['iki@example.invalid']);
 await save(draft,[candidate(2001,draft.davet_epostalari[0])]);eq(await claim(3003),null);
 await save({ ...draft,durum:'planlandi',surum:1 },[],'kaydet');
 eq((await claim(3004)).davet_id,id(2001));
 eq(await complete(2001,3004,'hata','RESEND_HTTP_500',null,60),true);
 eq((await state(2001)).durum,'hata');
 await db.query("UPDATE viva_eposta_gonderimleri SET sonraki_deneme=now()-interval '1 second' WHERE davet_id=$1",[id(2001)]);
 const retry=await claim(3005);eq(retry.davet_id,id(2001));eq(retry.deneme_sayisi,2);
 assertions++;assert.notDeepEqual(retry.icerik,first.icerik); // farklı yayının içeriği paylaşılmamalı
 eq(retry.icerik.to,'iki@example.invalid');
 eq(await complete(2001,3005,'gonderildi',null,'resend-2'),true);

 const uncertain=form(1002,'planlandi',['uc@example.invalid']);
 await save(uncertain,[candidate(2002,uncertain.davet_epostalari[0])]);
 eq((await claim(3006)).davet_id,id(2002));
 eq(await complete(2002,3006,'hata','VIVA_EPOSTA_AG_BELIRSIZ',null,60),true);
 await db.query("UPDATE viva_eposta_gonderimleri SET ilk_deneme=now()-interval '24 hours',sonraki_deneme=now()-interval '1 second' WHERE davet_id=$1",[id(2002)]);
 eq(await claim(3007),null);eq((await state(2002)).durum,'kontrol');

 const cancelled=form(1003,'planlandi',['dort@example.invalid']);
 await save(cancelled,[candidate(2003,cancelled.davet_epostalari[0])]);
 await db.query("UPDATE viva_davetler SET iptal=true WHERE davet_id=$1",[id(2003)]);
 eq(await claim(3008),null);eq((await state(2003)).durum,'iptal');

 const simultaneous=form(1004,'planlandi',['bes@example.invalid']);
 await save(simultaneous,[candidate(2004,simultaneous.davet_epostalari[0])]);
 const other=new pg.Client(config);await other.connect();
 try {const claims=await Promise.all([claim(3009,db),claim(3010,other)]);eq(claims.filter(Boolean).length,1);}finally{await other.end();}
 eq((await state(2004)).deneme_sayisi,1);

 for(const fn of ['viva_eposta_is_al(uuid,text,text)','viva_eposta_is_bitir(uuid,uuid,text,text,text,integer)']) {
  eq((await db.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') v',['anon',fn])).rows[0].v,false);
  eq((await db.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') v',['authenticated',fn])).rows[0].v,false);
  eq((await db.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') v',['service_role',fn])).rows[0].v,true);
 }
 console.log(JSON.stringify({passed:true,assertions,scope:'yerel PostgreSQL; ağ ve canlı veritabanı kullanılmadı'}));
} finally {
 if(db)await db.end();
 if(started)execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','immediate','-w','stop']);
}
