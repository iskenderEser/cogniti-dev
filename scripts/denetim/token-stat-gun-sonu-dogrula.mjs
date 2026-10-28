// Yalnız bellek içi PostgreSQL ve sahte veri; Supabase bağlantısı yok.
import { pathToFileURL } from 'node:url';
const runtime=process.env.TOKEN_SQL_TEST_RUNTIME;
if (!runtime) throw new Error('TOKEN_SQL_TEST_RUNTIME, PGlite modülünün mutlak yolunu göstermeli.');
const { PGlite }=await import(pathToFileURL(runtime).href);
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif bool);
CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,aktif_mi bool,takim_id uuid,bolge_id uuid,ad text,soyad text);
CREATE TABLE cogniti_token_hesaplari(firma_id uuid PRIMARY KEY,paket_turu text,asim_borcu bigint,created_at timestamptz);
CREATE TABLE cogniti_token_yuklemeleri(yukleme_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid,miktar bigint,kalan bigint,yukleme_turu text,created_at timestamptz,son_kullanim_at timestamptz,donem_yil int,donem_ay int);
CREATE TABLE cogniti_token_tuketimleri(tuketim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid,gonderen_turu text,gonderen_id uuid,asim_miktari bigint DEFAULT 0,miktar bigint DEFAULT 1,created_at timestamptz,islem_turu text,kaynak_id uuid,alici_turu text,alici_kimligi text,islem_anahtari text);
CREATE TABLE cogniti_token_tuketim_dagilimlari(firma_id uuid,tuketim_id uuid,yukleme_id uuid,miktar bigint);
CREATE TABLE cogniti_token_kko_devir_kayitlari(firma_id uuid,yukleme_id uuid,sifirlanan bigint,sonradan_tuketilen bigint DEFAULT 0,created_at timestamptz);
CREATE TABLE eclub_kisiler(kisi_id uuid,ad text,soyad text);
CREATE TABLE eczanem_musteriler(musteri_id uuid,ad_soyad text);
CREATE TABLE eczanem_gonderimler(gonderim_id uuid,eczane_id uuid);
CREATE TABLE eclub_eczane_firma(eczane_id uuid,firma_id uuid,aktif_mi bool,baglayan_utt_id uuid);
CREATE FUNCTION cogniti_token_bakiye(uuid) RETURNS TABLE(net_bakiye bigint,paket_asimi bigint) LANGUAGE sql AS $$ SELECT 0::bigint,0::bigint $$;
`);
const migration=await readFile(new URL('../sql/cogniti_token_stat_gun_sonu_kurulum.sql',import.meta.url),'utf8');
await db.exec(migration);await db.exec(migration);
const f='00000000-0000-4000-8000-000000000001',u='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003';
const now='2026-10-28T12:00:00+03:00';let passed=0;
async function reset(type='kullandigin_kadar_ode',debt=0){await db.exec('TRUNCATE firmalar,kullanicilar,cogniti_token_hesaplari,cogniti_token_yuklemeleri,cogniti_token_tuketimleri,cogniti_token_tuketim_dagilimlari,cogniti_token_kko_devir_kayitlari');await db.query('INSERT INTO firmalar VALUES($1,true)',[f]);await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,rol,aktif_mi) VALUES($1,$2,'utt',true),($3,$2,'utt',true)",[u,f,other]);await db.query("INSERT INTO cogniti_token_hesaplari VALUES($1,$2,$3,'2026-09-01+03')",[f,type,debt]);}
async function load(amount,left,date='2026-10-01T00:00:00+03:00',expiry=null,type='kko'){return(await db.query('INSERT INTO cogniti_token_yuklemeleri(firma_id,miktar,kalan,yukleme_turu,created_at,son_kullanim_at,donem_yil,donem_ay) VALUES($1,$2,$3,$4,$5,$6,2026,10) RETURNING yukleme_id',[f,amount,left,type,date,expiry])).rows[0].yukleme_id;}
async function consume(date,loadId=null,who=u,over=0){const id=(await db.query("INSERT INTO cogniti_token_tuketimleri(firma_id,gonderen_turu,gonderen_id,created_at,asim_miktari,islem_turu,kaynak_id) VALUES($1,'firma_kullanicisi',$2,$3,$4,'viva_davet',gen_random_uuid()) RETURNING tuketim_id",[f,who,date,over])).rows[0].tuketim_id;if(loadId)await db.query('INSERT INTO cogniti_token_tuketim_dagilimlari VALUES($1,$2,$3,1)',[f,id,loadId]);}
const calc=async(time=now)=>(await db.query('SELECT cogniti_token_gun_sonu($1,$2) AS r',[u,time])).rows[0].r;
function ok(label){passed++;console.log('BAŞARILI: '+label);}
await reset();let y=await load(1500,1497);await consume('2026-10-27T23:59:59+03',y);await consume('2026-10-28T00:00:00+03',y);await consume('2026-10-27T10:00:00+03',y,other);let r=await calc();assert.equal(r.plan_limiti,1500);assert.equal(r.kalan_token,1498);assert.equal(r.kullandigim_token,1);assert.equal(r.veri_tarihi,'2026-10-27');ok('Bugün hariç; firma toplamı ve kendi tüketimi ayrı; gece yarısı sınırı');
await db.exec("SET TIME ZONE 'America/New_York'");assert.deepEqual(await calc(),r);ok('Sunucu saat dilimi Türkiye gün sınırını değiştirmez');
await reset('aylik',1);await consume('2026-10-27T10:00:00+03',null,u,1);await consume('2026-10-28T10:00:00+03',null,u,1);await load(10000,9999,'2026-10-28T11:00:00+03','2026-12-01T00:00:00+03','aylik_paket');r=await calc();assert.equal(r.kalan_token,-1);assert.equal(r.kullandigim_token,1);ok('Bugünkü yüklemenin borç mahsubu dünün negatif bakiyesini değiştirmez');
await reset('aylik');y=await load(10000,9999,undefined,'2026-10-28T00:00:00+03','aylik_paket');await consume('2026-10-27T10:00:00+03',y);r=await calc();assert.equal(r.kalan_token,9999);assert.equal(r.plan_limiti,10000);ok('Tam gece yarısında biten yükleme dün sonunda geçerlidir');
await db.query("UPDATE cogniti_token_yuklemeleri SET son_kullanim_at='2026-10-27T23:59:59+03'");assert.equal((await calc()).kalan_token,0);ok('Dün sonundan önce süresi dolan yükleme eklenmez');
await reset();y=await load(1500,0);await consume('2026-10-27T10:00:00+03',y);await db.query("INSERT INTO cogniti_token_kko_devir_kayitlari(firma_id,yukleme_id,sifirlanan,created_at) VALUES($1,$2,1499,'2026-11-01T00:00:00+03')",[f,y]);await load(1500,1500,'2026-11-01T00:00:00+03');r=await calc('2026-11-01T12:00:00+03');assert.equal(r.kalan_token,1499);assert.equal(r.plan_limiti,1500);ok('KKÖ ay başı sıfırlaması öncesindeki gün sonu korunur');
await reset('aylik');await load(10000,10000,undefined,'2026-12-01T00:00:00+03','aylik_paket');await load(30000,30000,'2026-10-28T10:00:00+03','2026-12-01T00:00:00+03','aylik_paket');r=await calc();assert.equal(r.plan_limiti,10000);assert.equal(r.kalan_token,10000);ok('Bugünkü yeni plan yüklemesi dünün limitine/bakiyesine eklenmez');
await reset();y=await load(1500,1500);assert.equal((await calc()).kullandigim_token,0);ok('Tüketim yokken sıfır gösterilir');
await db.query("UPDATE cogniti_token_hesaplari SET created_at='2026-10-28T01:00:00+03'");assert.equal((await calc()).hazir,false);ok('Bugün açılan hesap için sahte geçmiş üretilmez');
await db.query("UPDATE kullanicilar SET rol='kd_utt' WHERE kullanici_id=$1",[u]);assert.equal((await calc()).hazir,false);ok('Kıdemli UTT aynı özete erişir');
await db.query("UPDATE kullanicilar SET rol='eczaci' WHERE kullanici_id=$1",[u]);await assert.rejects(calc(),e=>e.code==='42501');ok('Eczacı token kartlarına erişemez');
await db.query('UPDATE kullanicilar SET firma_id=gen_random_uuid() WHERE kullanici_id=$1',[u]);await assert.rejects(calc(),e=>e.code==='42501');ok('Başka firma üzerinden veri sızmaz');
const perms=(await db.query("SELECT has_function_privilege('anon','cogniti_token_gun_sonu(uuid,timestamptz)','EXECUTE') AS a,has_function_privilege('authenticated','cogniti_token_gun_sonu(uuid,timestamptz)','EXECUTE') AS b,has_function_privilege('service_role','cogniti_token_gun_sonu(uuid,timestamptz)','EXECUTE') AS s")).rows[0];assert.deepEqual(perms,{a:false,b:false,s:true});ok('Özet RPC yalnız sunucuya açık; kurulum tekrar çalışır');
await reset();y=await load(1500,1499,'2026-09-01T00:00:00+03');await consume('2026-09-02T00:00:00+03',y);let report=(await db.query("SELECT cogniti_token_raporu($1) AS r",[u])).rows[0].r;assert.equal(report.gun_sonu.kullandigim_token,1);assert.equal(report.gun_sonu.kalan_token,1499);assert.equal('kayitlar' in report,false);ok('Gerçek özet RPC bağlantısı; gün sonu kartları korunur, hareket listesi dönmez');
console.log(`${passed} test başarılı.`);await db.close();
