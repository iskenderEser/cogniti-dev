// VIVA_PG_BIN=/.../bin node tests/vivaAsama1.postgres.mjs
// Geçici küme, yalnız Unix socket; Supabase veya gerçek kullanıcı bağlantısı yok.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pg from 'pg';

const bin = process.env.VIVA_PG_BIN;
const wasm = process.env.VIVA_PGLITE_MODULE;
if (!bin && !wasm) throw new Error('VIVA_PG_BIN veya VIVA_PGLITE_MODULE belirtin.');
const root = mkdtempSync('/tmp/cogniti-viva-');
const dir = join(root,'data'), sock = join(root,'socket'); mkdirSync(sock);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const hash = s => createHash('sha256').update(s).digest('hex');
const opts = { host:sock, port:55447, user:'viva_test', database:'postgres' };
let started=false, db, other;
const passed=[];
async function check(name,fn) { await fn(); passed.push(name); console.log(`OK ${passed.length}: ${name}`); }
try {
 if (!wasm) {
 execFileSync(join(bin,'initdb'),['-D',dir,'-U','viva_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',dir,'-l',join(root,'postgres.log'),'-o',`-k ${sock} -h '' -p 55447`,'-w','start'],{stdio:'pipe'}); started=true;
 db=new pg.Client(opts); other=new pg.Client(opts); await db.connect(); await other.connect();
 } else {
 const {PGlite}=await import(wasm); const engine=new PGlite();
 const conn={ query:async(sql,params)=> params ? engine.query(sql,params) : (await engine.exec(sql)).at(-1), end:async()=>engine.close() };
 db=conn; other={query:conn.query,end:async()=>{}};
 }
 const sql=readFileSync('scripts/sql/viva_asama1.sql','utf8');
 await db.query(readFileSync('tests/fixtures/viva-asama1-postgres.sql','utf8'));
 await check('Migration gerçek PostgreSQL üzerinde iki kez kurulabilir',async()=>{await db.query(sql);await db.query(sql);});
 const roles=readFileSync('lib/utils/roller.ts','utf8');
 const named = key => [...roles.split(`export const ${key} = [`)[1].split('];')[0].matchAll(/"([a-z_]+)"/g)].map(x=>x[1]);
 const allRoles=[...named('URETICI_ROLLER'),...named('YONETICI_ROLLER'),'admin','tm','bm','utt','kd_utt','iu'];
 await db.query('INSERT INTO firmalar VALUES($1,$2,true,true),($3,$4,true,true)',[id(100),'Firma A',id(101),'Firma B']);
 await db.query('INSERT INTO takimlar VALUES($1,$2,$3),($4,$2,$5),($6,$7,$8)',[id(110),id(100),'Takım A',id(111),'Takım B',id(112),id(101),'Dış takım']);
 await db.query('INSERT INTO bolgeler VALUES($1,$2,$3),($4,$2,$5),($6,$7,$8),($9,$10,$11)',[id(120),id(110),'Bölge A',id(121),'Bölge B',id(122),id(111),'Bölge C',id(123),id(112),'Dış bölge']);
 const users=[['utt',1,100,110,120],['kd_utt',2,100,110,120],['pm',3,100,110,null],['med_md',4,100,null,null],
 ['bm',5,100,110,120],['tm',6,100,110,null],['utt',7,100,110,121],['utt',8,100,111,122],['utt',9,101,112,123],
 ['iu',10,null,null,null],['admin',11,null,null,null],['utt',12,100,110,120]];
 for(const [rol,n,f,t,b] of users) await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id(n),`Kişi${n}`,'Test',`k${n}@example.test`,rol,f?id(f):null,t?id(t):null,b?id(b):null,n!==12]);
 for(let n=0;n<allRoles.length;n++) await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,$4,$5,$6,$7,$8,true)',[id(200+n),allRoles[n],'Rol',`r${n}@example.test`,allRoles[n],id(100),id(110),id(120)]);
 await db.query('INSERT INTO eclub_kisiler VALUES($1,$2,$3,$4,$5),($6,$7,$8,$4,$5)',[id(20),id(40),'Üye A','Test','eczaci',id(21),id(41),'Üye B']);
 await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,$3,true),($4,$5,$3,true),($6,$2,$7,true)',[id(30),id(50),id(100),id(31),id(51),id(32),id(101)]);
 await db.query('INSERT INTO eclub_utt_eczane VALUES($1,$2,$3,true),($4,$5,$6,true),($7,$8,$9,true)',[id(60),id(30),id(1),id(61),id(31),id(7),id(62),id(32),id(9)]);
 await db.query('INSERT INTO eclub_kisi_eczane VALUES($1,$2,$3,true),($4,$5,$6,true)',[id(70),id(20),id(50),id(71),id(21),id(51)]);
 const rpc=async(a,op,v={},client=db)=>(await client.query('SELECT viva_islem($1,$2,$3) AS v',[id(a),op,JSON.stringify(v)])).rows[0].v;
 const guest=async(token,op,v={})=>(await db.query('SELECT viva_misafir_islem($1,$2,$3) AS v',[hash(token),op,JSON.stringify(v)])).rows[0].v;
 const form=(n,extra={})=>({etkinlik_id:id(n),baslik:'Canlı Tanıtım',aciklama:'Test etkinliği',baslangic:new Date(Date.now()+3600_000).toISOString(),bitis:new Date(Date.now()+7200_000).toISOString(),durum:'taslak',katilimcilar:[{tur:'eclub',id:id(20)}],...extra});
 const scope=async(a,b,type='ic')=>(await db.query(`SELECT ${type==='ic'?'viva_ic_kapsam':'viva_eclub_kapsam'}($1,$2) AS v`,[id(a),id(b)])).rows[0].v;
 await check('Tüm iç roller kendi firma kapsamında etkinlik oluşturabilir',async()=>{for(let i=0;i<allRoles.length;i++){const a=200+i;assert.equal((await rpc(a,'baglam')).olusturabilir,true);assert.equal((await rpc(a,'olustur',form(1000+i,{katilimcilar:[]}))).etkinlik.sahip_id,id(a));}});
 await check('Organizasyonsuz İÜ/admin yalnız Cogniti platform ekibini seçer',async()=>{assert.equal(await scope(10,11),true);assert.equal(await scope(10,1),false);assert.equal((await rpc(10,'olustur',form(1100,{katilimcilar:[{tur:'ic',id:id(11)}]}))).etkinlik.firma_adi,'Cogniti');});
 await check('UTT iç katılımcılarda kendi bölgesini korur',async()=>{assert.equal(await scope(1,2),true);assert.equal(await scope(1,7),false);assert.equal(await scope(1,12),false);});
 await check('PM/TM takımı ve medikal firma sınırı uygulanır',async()=>{for(const a of [3,6]){assert.equal(await scope(a,7),true);assert.equal(await scope(a,8),false);}assert.equal(await scope(4,8),true);assert.equal(await scope(4,9),false);});
 await check('UTT yalnız kendi aktif EClub listesinden katılımcı seçer',async()=>{assert.equal(await scope(1,20,'eclub'),true);assert.equal(await scope(1,21,'eclub'),false);assert.equal(await scope(9,20,'eclub'),true);});
 await check('EClub üyesi oluşturucu değildir, normal davetli olabilir',async()=>{assert.equal((await rpc(40,'baglam')).olusturabilir,false);await assert.rejects(rpc(40,'olustur',form(1200)),{code:'42501'});});
 await check('Taslak davetli listesinde görünmez; yetkisiz detay reddedilir',async()=>{await rpc(1,'olustur',form(1201));assert.equal((await rpc(40,'liste')).etkinlikler.length,0);await assert.rejects(rpc(40,'detay',{etkinlik_id:id(1201)}),{code:'42501'});});
 const v=form(1202,{durum:'planlandi'}); let live=await rpc(1,'olustur',v);
 await check('Aynı oluşturma anahtarı aynı etkinliği döndürür',async()=>{assert.equal((await rpc(1,'olustur',v)).etkinlik.surum,1);await assert.rejects(rpc(1,'olustur',{...v,baslik:'Farklı'}),{code:'40001'});});
 await check('Planlanan etkinlik yalnız seçilen ve halen yetkili üyeye açılır',async()=>{const x=await rpc(40,'detay',{etkinlik_id:id(1202)});assert.equal(x.etkinlik.oda_acik,true);assert.deepEqual(x.katilimcilar,[]);assert.deepEqual(x.davetler,[]);await assert.rejects(rpc(41,'detay',{etkinlik_id:id(1202)}),{code:'42501'});await assert.rejects(rpc(9,'detay',{etkinlik_id:id(1202)}),{code:'42501'});});
 await check('Farklı firma ve kapsam dışı katılımcıyla kayıt oluşturulmaz',async()=>{await assert.rejects(rpc(1,'olustur',form(1203,{katilimcilar:[{tur:'ic',id:id(9)}]})),{code:'42501'});assert.equal((await db.query('SELECT count(*)::int n FROM viva_etkinlikler WHERE etkinlik_id=$1',[id(1203)])).rows[0].n,0);});
 await check('Yinelenen katılımcı bütün oluşturma işlemini geri alır',async()=>{await assert.rejects(rpc(1,'olustur',form(1204,{katilimcilar:[{tur:'eclub',id:id(20)},{tur:'eclub',id:id(20)}]})),{code:'23505'});assert.equal((await db.query('SELECT count(*)::int n FROM viva_etkinlikler WHERE etkinlik_id=$1',[id(1204)])).rows[0].n,0);});
 await check('Geçmişe planlama, sahte canlı durumu ve ters tarihler reddedilir',async()=>{for(const x of [{durum:'planlandi',baslangic:new Date(Date.now()-1000).toISOString()},{durum:'canli'},{bitis:new Date(Date.now()-1000).toISOString()}])await assert.rejects(rpc(1,'olustur',form(1205,x)),{code:'22023'});});
 await check(wasm?'Eski sürümden ikinci düzenleme reddedilir (sıralı)':'Aynı sürümden eş zamanlı iki düzenlemenin yalnız biri geçer',async()=>{const x={...v,surum:1,baslik:'Düzenlendi'};const r=wasm ? [await rpc(1,'kaydet',x).then(value=>({status:'fulfilled',value})),await rpc(1,'kaydet',{...x,baslik:'Diğer'},other).then(value=>({status:'fulfilled',value}),reason=>({status:'rejected',reason}))] : await Promise.allSettled([rpc(1,'kaydet',x),rpc(1,'kaydet',{...x,baslik:'Diğer'},other)]);assert.equal(r.filter(v=>v.status==='fulfilled').length,1);assert.equal(r.find(v=>v.status==='rejected').reason.code,'40001');live=await rpc(1,'detay',{etkinlik_id:id(1202)});});
 await check('Planlanmış etkinlik taslağa geri alınamaz',async()=>{await assert.rejects(rpc(1,'kaydet',{...v,surum:live.etkinlik.surum,durum:'taslak'}),{code:'22023'});});
 const addInvite=async(token,email='guest@example.test')=>{const d=await rpc(1,'detay',{etkinlik_id:id(1202)});return rpc(1,'davet_ekle',{etkinlik_id:id(1202),surum:d.etkinlik.surum,ad:'Özel Davetli',eposta:email,hash:hash(token)});};
 await addInvite('guest-one');
 await check('Özel davet Cogniti üyeliği oluşturmaz, ham bağlantı saklamaz',async()=>{const x=await guest('guest-one','bilgi');assert.equal(x.dogrulandi,false);assert.equal(x.eposta_maskeli,'g***@example.test');assert.equal(x.eposta,undefined);const r=await db.query('SELECT token_hash FROM viva_davetler');assert.equal(r.rows[0].token_hash,hash('guest-one'));assert.equal((await db.query('SELECT count(*)::int n FROM eclub_kisiler')).rows[0].n,2);});
 await check(wasm?'Kod gönderiminde yinelenen istek hız sınırına takılır (tek bağlantı)':'Doğrulama kodu gönderimi eş zamanlı çift gönderimi engeller',async()=>{const out=await Promise.all([guest('guest-one','kod_ayir',{kod_hash:hash('code-one')}),guest('guest-one','kod_ayir',{kod_hash:hash('code-two')})]);assert.equal(out.filter(x=>x.status===429).length,1);assert.equal((await db.query('SELECT gonderim_sayisi n FROM viva_davetler WHERE token_hash=$1',[hash('guest-one')])).rows[0].n,1);});
 await check('Hatalı kod denemeleri kalıcı sayılır ve beş denemede kapanır',async()=>{for(let i=0;i<5;i++)assert.equal((await guest('guest-one','dogrula',{kod_hash:hash('wrong'),oturum_hash:hash('session')})).status,403);assert.equal((await db.query('SELECT deneme n FROM viva_davetler WHERE token_hash=$1',[hash('guest-one')])).rows[0].n,5);assert.equal((await guest('guest-one','dogrula',{kod_hash:hash('code-one'),oturum_hash:hash('session')})).status,403);});
 await check('Yeni kod eskisini geçersizleştirir; doğrulama tek kullanımlıdır',async()=>{await db.query("UPDATE viva_davetler SET kod_gonderim=now()-interval '61 seconds' WHERE token_hash=$1",[hash('guest-one')]);await guest('guest-one','kod_ayir',{kod_hash:hash('new-code')});assert.equal((await guest('guest-one','dogrula',{kod_hash:hash('code-one'),oturum_hash:hash('session')})).status,403);assert.equal((await guest('guest-one','dogrula',{kod_hash:hash('new-code'),oturum_hash:hash('session')})).dogrulandi,true);assert.equal((await guest('guest-one','dogrula',{kod_hash:hash('new-code'),oturum_hash:hash('session')})).status,403);assert.equal((await guest('guest-one','bilgi',{oturum_hash:hash('session')})).dogrulandi,true);});
 await check('Kodun ve misafir oturumunun süresi dolunca erişim kapanır',async()=>{await db.query("UPDATE viva_davetler SET oturum_bitis=now()-interval '1 second',kod_hash=$2,kod_bitis=now()-interval '1 second' WHERE token_hash=$1",[hash('guest-one'),hash('expired')]);assert.equal((await guest('guest-one','bilgi',{oturum_hash:hash('session')})).dogrulandi,false);assert.equal((await guest('guest-one','dogrula',{kod_hash:hash('expired'),oturum_hash:hash('session')})).status,403);});
 await check('Yeni davet aynı e-postanın eski bağlantı ve oturumunu kapatır',async()=>{await addInvite('guest-two');assert.equal((await guest('guest-one','bilgi',{oturum_hash:hash('session')})).status,403);assert.equal((await guest('guest-two','bilgi')).dogrulandi,false);});
 await check('Davet iptali ve etkinlik tarihi değişimi erişimi günceller',async()=>{let d=await rpc(1,'detay',{etkinlik_id:id(1202)});const invite=d.davetler.find(x=>!x.iptal);await rpc(1,'davet_iptal',{etkinlik_id:id(1202),surum:d.etkinlik.surum,davet_id:invite.davet_id});assert.equal((await guest('guest-two','bilgi')).status,403);await addInvite('guest-three');d=await rpc(1,'detay',{etkinlik_id:id(1202)});await rpc(1,'kaydet',{...v,surum:d.etkinlik.surum,bitis:new Date(Date.now()+10_800_000).toISOString()});assert.equal(Date.parse((await guest('guest-three','bilgi')).bitis)>Date.parse(v.bitis),true);});
 await check('Kişi–eczane bağının kalkması üyeye erişimi kapatır',async()=>{await db.query('UPDATE eclub_kisi_eczane SET aktif_mi=false WHERE kisi_id=$1',[id(20)]);await assert.rejects(rpc(40,'detay',{etkinlik_id:id(1202)}),{code:'42501'});await db.query('UPDATE eclub_kisi_eczane SET aktif_mi=true WHERE kisi_id=$1',[id(20)]);});
 await check('Düzenleyenin pasife alınması hem üye hem misafir erişimini kapatır',async()=>{await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(1)]);await assert.rejects(rpc(40,'detay',{etkinlik_id:id(1202)}),{code:'42501'});assert.equal((await guest('guest-three','bilgi')).status,403);await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[id(1)]);});
 await check(wasm?'İptal sonrası eski sürüm etkinliği geri açamaz (sıralı)':'Düzenleme ile iptal yarışı iptal durumunu geri açmaz',async()=>{const d=await rpc(1,'detay',{etkinlik_id:id(1202)});if(wasm){await rpc(1,'iptal',{etkinlik_id:id(1202),surum:d.etkinlik.surum});await assert.rejects(rpc(1,'kaydet',{...v,surum:d.etkinlik.surum}),{code:'40001'});}else{await db.query('BEGIN');await db.query('SELECT 1 FROM viva_etkinlikler WHERE etkinlik_id=$1 FOR UPDATE',[id(1202)]);const pending=rpc(1,'kaydet',{...v,surum:d.etkinlik.surum},other);await rpc(1,'iptal',{etkinlik_id:id(1202),surum:d.etkinlik.surum});await db.query('COMMIT');await assert.rejects(pending,{code:'40001'});}assert.equal((await rpc(1,'detay',{etkinlik_id:id(1202)})).etkinlik.durum,'iptal');assert.equal((await guest('guest-three','bilgi')).status,403);assert.equal((await rpc(40,'detay',{etkinlik_id:id(1202)})).etkinlik.oda_acik,false);});
 await check('anon/authenticated tabloları veya Viva fonksiyonlarını doğrudan kullanamaz',async()=>{for(const role of ['anon','authenticated']){await db.query(`SET ROLE ${role}`);await assert.rejects(db.query('SELECT * FROM viva_etkinlikler'),{code:'42501'});await assert.rejects(db.query('SELECT viva_islem($1,$2,$3)',[id(1),'liste','{}']),{code:'42501'});await db.query('RESET ROLE');}});
 await check('Liste sayfalaması 20 kayıt ve devam bilgisini üretir',async()=>{for(let i=0;i<21;i++)await rpc(4,'olustur',form(2000+i,{katilimcilar:[]}));const first=await rpc(4,'liste');const next=await rpc(4,'liste',{offset:20});assert.equal(first.etkinlikler.length,20);assert.equal(first.devam_var,true);assert.equal(next.etkinlikler.length,1);});
 const version=(await db.query('SHOW server_version')).rows[0].server_version;
 const report={engine:wasm?'PostgreSQL/WASM (PGlite), tek bağlantı':'Native PostgreSQL, iki Unix socket bağlantısı',concurrency_verified:!wasm,not_run:wasm?['İki bağımsız bağlantıyla kilit bekleme ve eş zamanlı yarış testleri']:[],postgres:version,passed:passed.length,tests:passed,scope:wasm?'Yerel PostgreSQL/WASM, sahte temel şema, gerçek Viva migration/RPC; sıralı sürüm ve erişim kontrolleri. Canlı Supabase, e-posta ve çok bağlantılı yarış testi yok.':'Yalnız Unix socket, sahte temel şema, gerçek Viva migration/RPC; canlı Supabase veya e-posta gönderimi yok.'};
 writeFileSync('docs/VIVA_ASAMA_1_TEST_SONUCLARI.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:passed.length,postgres:version}));
} catch(error) {
 console.error(JSON.stringify({hata:error.message,kod:error.code,konum:error.position,detay:error.detail,where:error.where}));
 process.exitCode=1;
} finally {
 if(db)await db.end().catch(()=>{});if(other)await other.end().catch(()=>{});
 if(started)execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','fast','-w','stop'],{stdio:'pipe'});
 console.log(wasm?'Yerel PostgreSQL/WASM kapatıldı.':started?'Yerel PostgreSQL durduruldu.':'Yerel PostgreSQL başlatılamadı.');
}
