// Yalnız /tmp altında yerel Unix socket ve sahte şema/veri kullanır.
// ECZANEM_TEST_PG_BIN=/postgres/bin node scripts/denetim/admin-eczanem-uyeleri-dogrula.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';

const bin = process.env.ECZANEM_TEST_PG_BIN;
if (!bin) throw new Error('ECZANEM_TEST_PG_BIN gerekli.');
const dizin = mkdtempSync(join(tmpdir(), 'hb-admin-uye-'));
const data = join(dizin, 'data');
const socket = join(dizin, 's'); mkdirSync(socket);
const calistir = (komut, args) => execFileSync(join(bin, komut), args, { stdio: 'pipe' });
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const baglan = () => new pg.Client({ host: socket, port: 56636, user: 'postgres', database: 'postgres' });
let db, ikinci, basladi = false;
const testler = [];
async function kontrol(ad, fn) { await fn(); testler.push(ad); console.log(`PASS ${ad}`); }
const liste = async (firma = 1, eczane = null, durum = 'tumu', q = '', sayfa = 1) => (await db.query('SELECT admin_eczanem_uyeleri_oku($1,$2,$3,$4,$5,20) AS veri', [id(firma), eczane ? id(eczane) : null, durum, q, sayfa])).rows[0].veri;
const degistir = (musteri, eczane, aktif, mevcut, firma = 1, admin = 91, client = db) => client.query('SELECT admin_eczanem_uyelik_durum_degistir($1,$2,$3,$4,$5,$6) AS veri', [id(admin), id(firma), id(musteri), id(eczane), aktif, mevcut]);
try {
  calistir('initdb', ['-D', data, '-U', 'postgres', '--no-locale', '--encoding=UTF8', '--auth=trust']);
  calistir('pg_ctl', ['-D', data, '-l', join(dizin, 'postgres.log'), '-o', `-c listen_addresses='' -c unix_socket_directories=${socket} -p 56636`, '-w', 'start']);
  basladi = true;
  db = baglan(); await db.connect();
  await db.query(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, email text);
    CREATE TABLE firmalar(firma_id uuid PRIMARY KEY, firma_adi text);
    CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY, rol text, aktif_mi boolean);
    CREATE TABLE eclub_eczaneler(eczane_id uuid PRIMARY KEY, gln text UNIQUE);
    CREATE TABLE eclub_eczane_master(gln text PRIMARY KEY, eczane_adi text);
    CREATE TABLE eclub_eczane_firma(firma_id uuid, eczane_id uuid, aktif_mi boolean);
    CREATE TABLE eczanem_musteriler(musteri_id uuid PRIMARY KEY, auth_user_id uuid, ad_soyad text, telefon text, aktif_mi boolean);
    CREATE TABLE eczanem_uyelikler(uyelik_id uuid PRIMARY KEY, musteri_id uuid, eczane_id uuid, aktif_mi boolean, created_at timestamptz DEFAULT now(), son_islem_yapan_kisi_id uuid, son_islem_tarihi timestamptz, UNIQUE(musteri_id,eczane_id));
  `);
  const temel = readFileSync('scripts/sql/eczanem_butunluk_paketi.sql', 'utf8');
  await db.query(temel.slice(temel.indexOf('CREATE OR REPLACE VIEW public.v_eczanem_musteri_liste_admin'), temel.lastIndexOf('COMMIT;')));
  const sql = readFileSync('scripts/sql/admin_eczanem_uye_yonetimi.sql', 'utf8');
  await kontrol('Kurulum iki kez değiştirilmeden çalışır', async () => { await db.query(sql); await db.query(sql); });
  for (const firma of [1,2,3]) await db.query('INSERT INTO firmalar VALUES ($1,$2)', [id(firma), `Firma ${firma}`]);
  for (const e of [11,12,13,14]) {
    await db.query('INSERT INTO eclub_eczaneler VALUES ($1,$2)',[id(e),String(e)]);
    await db.query('INSERT INTO eclub_eczane_master VALUES ($1,$2)',[String(e),`Eczane ${e}`]);
  }
  for (const [f,e] of [[1,11],[1,12],[2,12],[2,13],[3,14]]) await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,true)',[id(f),id(e)]);
  await db.query('INSERT INTO kullanicilar VALUES($1,\'admin\',true),($2,\'utt\',true),($3,\'admin\',false)',[id(91),id(92),id(93)]);
  for (const m of [21,22,23,24]) {
    await db.query('INSERT INTO auth.users VALUES($1,$2)',[id(m),`uye${m}@example.test`]);
    await db.query('INSERT INTO eczanem_musteriler VALUES($1,$1,$2,$3,$4)',[id(m),`Üye ${m}`,`055500000${m}`,m!==22]);
  }
  for(const [u,m,e,a] of [[31,21,11,true],[32,21,12,false],[33,23,11,false],[34,24,13,true],[35,22,11,false]])
    await db.query('INSERT INTO eczanem_uyelikler(uyelik_id,musteri_id,eczane_id,aktif_mi) VALUES($1,$2,$3,$4)',[id(u),id(m),id(e),a]);
  await kontrol('Firma kapsamı, tekil kişi sayısı ve aktif/pasif üyelik sayıları doğru', async()=>{
    const r=await liste(); assert.equal(r.uyeler.length,4); assert.deepEqual(r.ozet,{toplam_uye:3,aktif_uyelik:1,pasif_uyelik:3}); assert.ok(r.uyeler.every(u=>u.eczane_id!==id(13))); assert.equal(r.eczaneler.length,2);
  });
  await kontrol('Ad, telefon, durum ve eczane filtreleri sunucuda çalışır',async()=>{
    assert.equal((await liste(1,null,'aktif')).uyeler.length,1);
    assert.equal((await liste(1,null,'pasif')).uyeler.length,3);
    assert.equal((await liste(1,null,'tumu','Üye 21')).uyeler.length,2);
    assert.equal((await liste(1,null,'tumu','0555 000 0021')).uyeler.length,2);
    assert.equal((await liste(1,12)).uyeler.length,1);
    assert.equal((await liste(1,null,'tumu','%')).uyeler.length,0);
  });
  await kontrol('Firma dışı eczane listesi ve müdahalesi reddedilir', async()=>{
    await assert.rejects(liste(1,13),{code:'42501'});
    await assert.rejects(degistir(24,13,false,true),{code:'42501'});
  });
  await kontrol('Admin olmayan, pasif admin ve kapalı üye hesabı reddedilir',async()=>{
    await assert.rejects(degistir(21,11,false,true,1,92),{code:'42501'});
    await assert.rejects(degistir(21,11,false,true,1,93),{code:'42501'});
    await assert.rejects(degistir(22,11,true,false),{code:'23514'});
  });
  await kontrol('Pasife alma yalnız hedef üyeliği değiştirir ve admin kaydıyla 30 günlük zaman başlangıcını yazar',async()=>{
    await degistir(21,11,false,true);
    const u=(await db.query('SELECT * FROM eczanem_uyelikler WHERE uyelik_id=$1',[id(31)])).rows[0];
    assert.equal(u.aktif_mi,false);assert.equal(u.son_islem_yapan_kisi_id,null);assert.ok(Math.abs(Date.now()-u.son_islem_tarihi.getTime())<5000);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM admin_eczanem_uyelik_islemleri WHERE admin_id=$1 AND firma_id=$2',[id(91),id(1)])).rows[0].n,1);
    assert.equal((await liste(2,13)).uyeler[0].aktif_mi,true);
    assert.equal((await liste(1,12)).uyeler[0].aktif_mi,false);
  });
  await kontrol('Aynı durum tekrarında pasif kullanım süresi ve işlem kaydı yenilenmez',async()=>{
    const before=(await db.query('SELECT son_islem_tarihi FROM eczanem_uyelikler WHERE uyelik_id=$1',[id(31)])).rows[0];
    assert.equal((await degistir(21,11,false,false)).rows[0].veri.degisti,false);
    assert.deepEqual((await db.query('SELECT son_islem_tarihi FROM eczanem_uyelikler WHERE uyelik_id=$1',[id(31)])).rows[0],before);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM admin_eczanem_uyelik_islemleri')).rows[0].n,1);
  });
  await kontrol('Yeniden aktif etme çalışır; eski durumla işlem 409 karşılığı verir',async()=>{
    await degistir(21,11,true,false);
    await assert.rejects(degistir(21,11,true,false),{code:'40001'});
  });
  await kontrol('Denetim kaydı başarısızsa üyelik değişikliği de geri alınır',async()=>{
    await db.query(`CREATE FUNCTION test_log_hatasi() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test log hatası'; END $$;
      CREATE TRIGGER test_log_hatasi BEFORE INSERT ON admin_eczanem_uyelik_islemleri FOR EACH ROW EXECUTE FUNCTION test_log_hatasi();`);
    await assert.rejects(degistir(21,11,false,true),/test log hatası/);
    assert.equal((await liste(1,11,'aktif')).uyeler.length,1);
    await db.query('DROP TRIGGER test_log_hatasi ON admin_eczanem_uyelik_islemleri');
  });
  await kontrol('İki bağımsız bağlantıda aynı üyeliğe yarış eski durumu geçersiz kılar',async()=>{
    ikinci=baglan(); await ikinci.connect();
    await db.query('BEGIN'); await degistir(21,11,false,true);
    const bekleyen=degistir(21,11,false,true,1,91,ikinci);
    const sonuc=assert.rejects(bekleyen,{code:'40001'});
    let kilit=false;
    for(let i=0;i<20;i++) {
      const r=await db.query("SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1",[ikinci.processID]);
      if(r.rows[0]?.wait_event_type==='Lock'){kilit=true;break;}
      await new Promise(r=>setTimeout(r,10));
    }
    assert.ok(kilit,'İkinci bağlantı satır kilidinde beklemeli');
    await db.query('COMMIT'); await sonuc;
    await ikinci.end(); ikinci=null;
  });
  await kontrol('1000 üstü kayıtlar sayılır, kararlı sayfalanır, boş filtre ve fazla sayfa yönetilir',async()=>{
    await db.query(`WITH yeni AS (
      INSERT INTO eczanem_musteriler(musteri_id,ad_soyad,telefon,aktif_mi)
      SELECT gen_random_uuid(),'Sahte Üye '||n, '0500'||lpad(n::text,7,'0'),true FROM generate_series(1,1005) n RETURNING musteri_id
    ) INSERT INTO eczanem_uyelikler(uyelik_id,musteri_id,eczane_id,aktif_mi) SELECT gen_random_uuid(),musteri_id,$1,true FROM yeni`,[id(14)]);
    const ilk=await liste(3),son=await liste(3,null,'tumu','',999);
    assert.equal(ilk.ozet.toplam_uye,1005);assert.equal(ilk.uyeler.length,20);assert.equal(son.uyeler.length,5);assert.equal(son.sayfalama.sayfa,51);
    assert.equal(new Set([...ilk.uyeler,...(await liste(3,null,'tumu','',2)).uyeler].map(u=>u.musteri_id)).size,40);
    const bos=await liste(3,null,'pasif');assert.equal(bos.uyeler.length,0);assert.equal(bos.sayfalama.toplam_sayfa,1);
  });
  await kontrol('Anon ve authenticated RPC ve işlem tablosuna erişemez; service_role erişir',async()=>{
    for(const rol of ['anon','authenticated']){
      await db.query(`SET ROLE ${rol}`);
      await assert.rejects(db.query('SELECT admin_eczanem_uyeleri_oku($1)',[id(1)]),{code:'42501'});
      await assert.rejects(degistir(21,11,true,false),{code:'42501'});
      await assert.rejects(db.query('SELECT * FROM admin_eczanem_uyelik_islemleri'),{code:'42501'});
      await db.query('RESET ROLE');
    }
    await db.query('SET ROLE service_role'); assert.equal((await liste()).sayfalama.toplam,4); await db.query('RESET ROLE');
  });
  writeFileSync(join(dizin,'sonuclar.json'),JSON.stringify({postgres:'17.10',passed:testler.length,tests:testler,scope:'Yerel Unix socket, sahte şema ve veriler, değiştirilmemiş kurulum SQL’i'},null,2));
  console.log(`SONUÇ: ${testler.length} kontrol geçti. Kayıt: ${dizin}/sonuclar.json`);
} finally {
  if(ikinci) await ikinci.end();
  if(db) await db.end();
  if(basladi) calistir('pg_ctl',['-D',data,'-m','immediate','-w','stop']);
}
