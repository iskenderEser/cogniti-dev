// Yalnız yerel Unix socket ve sahte kayıtlar. Canlı veritabanına bağlanmaz.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
const bin = process.env.TOKEN_PG_BIN;
if (!bin) throw new Error('TOKEN_PG_BIN ile yerel PostgreSQL bin dizinini belirtin.');
const root = mkdtempSync('/tmp/token-detay-test-');
const dir = join(root, 'data'), socket = join(root, 'socket'); mkdirSync(socket);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let started = false, db, passed = 0;
async function check(name, run) { await run(); console.log(`OK ${++passed}: ${name}`); }
try {
  execFileSync(join(bin, 'initdb'), ['-D', dir, '-U', 'token_test', '-A', 'trust', '--no-locale', '--encoding=UTF8'], { stdio: 'pipe' });
  execFileSync(join(bin, 'pg_ctl'), ['-D', dir, '-l', join(root, 'log'), '-o', `-k ${socket} -h '' -p 55459`, '-w', 'start'], { stdio: 'pipe' }); started = true;
  db = new pg.Client({ host: socket, port: 55459, user: 'token_test', database: 'postgres' }); await db.connect();
  await db.query(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
    CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean);
    CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,takim_id uuid,bolge_id uuid,aktif_mi boolean,ad text DEFAULT 'Test',soyad text DEFAULT 'Kişi');
    CREATE TABLE cogniti_token_hesaplari(firma_id uuid PRIMARY KEY,paket_turu text DEFAULT 'kullandigin_kadar_ode',created_at timestamptz DEFAULT '2026-01-01T00:00:00Z');
    CREATE TABLE cogniti_token_yuklemeleri(yukleme_id uuid DEFAULT gen_random_uuid(),firma_id uuid,miktar bigint,yukleme_turu text,donem_yil integer,donem_ay integer,created_at timestamptz);
    CREATE TABLE cogniti_token_tuketimleri(tuketim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid,gonderen_turu text,gonderen_id uuid,alici_turu text,alici_kimligi text,islem_turu text,kaynak_id uuid,islem_anahtari text,miktar bigint,created_at timestamptz);
    CREATE TABLE v_yayin_detay(yayin_id uuid,firma_id uuid,urun_adi text,arac_turu text,firma_adi text,talep_no integer);
    CREATE TABLE eclub_kisiler(kisi_id uuid PRIMARY KEY,rol text);
    CREATE TABLE viva_etkinlikler(etkinlik_id uuid PRIMARY KEY,firma_id uuid,baslik text,urun_id uuid);
    CREATE TABLE urunler(urun_id uuid PRIMARY KEY,firma_id uuid,urun_adi text);
    CREATE TABLE viva_katilimcilar(etkinlik_id uuid,tur text,kullanici_id uuid,kisi_id uuid);
    CREATE TABLE viva_davetler(etkinlik_id uuid,iptal boolean);
    CREATE TABLE cogniti_viva_tuketim_isleri(etkinlik_id uuid PRIMARY KEY,firma_id uuid,durum text,katilim_sayisi integer);
    CREATE TABLE eczanem_gonderimler(gonderim_id uuid PRIMARY KEY,eczane_id uuid,yayin_id uuid,musteri_id uuid,gonderen_kisi_id uuid,created_at timestamptz,arac_turu text);
    CREATE TABLE eczanem_eczane_gonderimleri(gonderim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),yayin_id uuid,eczane_id uuid,gonderen_utt_id uuid,created_at timestamptz,UNIQUE(yayin_id,eczane_id));
    CREATE TABLE eclub_eczane_firma(eczane_id uuid,firma_id uuid,aktif_mi boolean,baglayan_utt_id uuid);`);
  const sql = readFileSync('scripts/sql/cogniti_token_detay_raporu.sql', 'utf8');
  await check('SQL ilk ve tekrarlanan kurulumda çalışır', async () => { await db.query(sql); await db.query(sql); });
  const filtreSql=readFileSync('scripts/sql/cogniti_token_detay_filtreleri.sql','utf8');
  await check('Filtreli RPC eski raporu bozmadan kurulur ve tekrar kurulabilir', async()=>{await db.query(filtreSql);await db.query(filtreSql);});
  const eczanemSql=readFileSync('scripts/sql/cogniti_token_eczanem_detay_raporu.sql','utf8');
  await check('Eczanem raporu kurulur ve tekrar kurulabilir',async()=>{await db.query(eczanemSql);await db.query(eczanemSql);});
  const statSql=readFileSync('scripts/sql/cogniti_token_stat_ozeti.sql','utf8');
  await check('Dört stat kartının SQL özeti kurulur ve tekrar kurulabilir',async()=>{await db.query(statSql);await db.query(statSql);});
  const bmSql=readFileSync('scripts/sql/cogniti_token_bm_kullanimi.sql','utf8');
  await check('BM kapsam, özet ve iki detay raporu iki kez kurulabilir',async()=>{await db.query(bmSql);await db.query(bmSql);});
  const tmSql=readFileSync('scripts/sql/cogniti_token_tm_kullanimi.sql','utf8');
  await check('TM kapsam, özet ve iki detay raporu iki kez kurulabilir',async()=>{await db.query(tmSql);await db.query(tmSql);});
  const yoneticiSql=readFileSync('scripts/sql/cogniti_token_yonetici_kullanimi.sql','utf8');
  await check('Yönetici kapsam, özet ve iki detay raporu iki kez kurulabilir',async()=>{await db.query(yoneticiSql);await db.query(yoneticiSql);});
  await db.query('INSERT INTO firmalar VALUES($1,true),($2,true),($3,false)', [id(100), id(101), id(102)]);
  await db.query('INSERT INTO cogniti_token_hesaplari(firma_id) VALUES($1),($2)', [id(100), id(101)]);
  const users = [[1,'gm',10,20],[2,'tm',10,null],[3,'bm',10,20],[4,'utt',10,20],[5,'utt',10,21],[6,'utt',11,22],[7,'pm',11,22],[9,'utt',null,null]];
  for (const [n,role,team,region] of users) await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,$4,$5,true)', [id(n),id(100),role,team == null ? null : id(team),region == null ? null : id(region)]);
  await db.query("INSERT INTO kullanicilar VALUES($1,$2,'gm',NULL,NULL,true),($3,$4,'gm',NULL,NULL,true),($5,$6,'utt',NULL,NULL,false)", [id(8),id(101),id(98),id(102),id(99),id(100)]);
  await db.query("INSERT INTO eclub_kisiler VALUES($1,'eczaci'),($2,'eczane_teknisyeni')", [id(200),id(201)]);
  await db.query("INSERT INTO v_yayin_detay VALUES($1,$2,'Abilon','video','hepifarma',30008),($1,$2,'Abilon','video','hepifarma',30008),($3,$2,'Laropen','podcast','hepifarma',30009),($4,$5,'Gizli ürün','gorsel','Diğer Firma',50001)", [id(300),id(100),id(301),id(302),id(101)]);
  async function consume(sender, source, recipient, role = 'eclub_kisi', kind = 'eclub_oneri', amount = 1, at = '2026-10-29T02:00:00Z', company = 100, senderKind = 'firma_kullanicisi', key = 'test') {
    await db.query('INSERT INTO cogniti_token_tuketimleri(firma_id,gonderen_turu,gonderen_id,alici_turu,alici_kimligi,islem_turu,kaynak_id,islem_anahtari,miktar,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [id(company),senderKind,id(sender),role,id(recipient),kind,id(source),key,amount,at]);
  }
  await consume(4,300,200,undefined,undefined,1,'2026-10-28T21:30:00Z');
  await consume(4,300,200); await consume(4,300,201); await consume(4,301,3,'firma_kullanicisi','yayin');
  await consume(5,300,4,'firma_kullanicisi','tclub_oneri'); await consume(6,300,3,'firma_kullanicisi','cclub_challenge');
  await consume(8,302,200,undefined,undefined,1,undefined,101);
  await consume(4,400,4,'firma_kullanicisi','viva_sure',20);
  await consume(4,999,97,'firma_kullanicisi','yayin');
  await consume(4,302,200); // Aynı kaynak başka firmada olsa da ürünü açıklanmaz.
  await consume(200,300,401,'eczanem_musteri','eczanem_musteri',1,undefined,100,'eclub_kisi',`eczanem-gonderim:${id(500)}`);
  await db.query('INSERT INTO eczanem_gonderimler(gonderim_id,eczane_id) VALUES($1,$2)', [id(500),id(501)]);
  await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,true,$3)', [id(501),id(100),id(4)]);
  await db.query('INSERT INTO viva_etkinlikler(etkinlik_id,firma_id,baslik) VALUES($1,$2,$3)',[id(400),id(100),'Süre yayını']);
  await db.query("INSERT INTO viva_katilimcilar VALUES($1,'ic',$2,NULL),($1,'ic',$3,NULL)",[id(400),id(4),id(5)]);
  await db.query("INSERT INTO cogniti_viva_tuketim_isleri VALUES($1,$2,'tamam',10)",[id(400),id(100)]);
  const report = async (user, page = 0) => (await db.query('SELECT cogniti_token_detay_raporu($1,$2) result', [id(user),page])).rows[0].result;
  const total = result => result.satirlar.reduce((sum,row) => sum+row.token,0);
  const filtered=async(user,arac='tumu',page=0,gonderi='eclub')=>(await db.query('SELECT cogniti_token_detay_raporu_filtreli($1,$2,$3,$4) result',[id(user),page,gonderi,arac])).rows[0].result;
  const eczanem=async(user=4,arac='tumu',page=0)=>(await db.query('SELECT cogniti_token_eczanem_detay_raporu($1,$2,$3) result',[id(user),page,arac])).rows[0].result;
  const stat=async(user=4,at='2026-10-30T09:00:00Z')=>(await db.query('SELECT cogniti_token_gun_sonu($1,$2) result',[id(user),at])).rows[0].result;
  const bmStat=async(utt=null,user=3,at='2026-10-30T09:00:00Z')=>(await db.query('SELECT cogniti_token_bm_raporu($1,$2,$3) result',[id(user),utt===null?null:id(utt),at])).rows[0].result;
  const bmDetay=async(utt=null,arac='tumu',page=0,user=3)=>(await db.query("SELECT cogniti_token_bm_detay_raporu($1,$2,$3,'eclub',$4) result",[id(user),utt===null?null:id(utt),page,arac])).rows[0].result;
  const bmEcza=async(utt=null,arac='tumu',page=0,user=3)=>(await db.query('SELECT cogniti_token_bm_eczanem_detay_raporu($1,$2,$3,$4) result',[id(user),utt===null?null:id(utt),page,arac])).rows[0].result;
  const tmStat=async(bm=null,utt=null,user=2,at='2026-10-30T09:00:00Z')=>(await db.query('SELECT cogniti_token_tm_raporu($1,$2,$3,$4) result',[id(user),bm===null?null:id(bm),utt===null?null:id(utt),at])).rows[0].result;
  const tmDetay=async(bm=null,utt=null,arac='tumu',page=0,user=2)=>(await db.query("SELECT cogniti_token_tm_detay_raporu($1,$2,$3,$4,'eclub',$5) result",[id(user),bm===null?null:id(bm),utt===null?null:id(utt),page,arac])).rows[0].result;
  const tmEcza=async(bm=null,utt=null,arac='tumu',page=0,user=2)=>(await db.query('SELECT cogniti_token_tm_eczanem_detay_raporu($1,$2,$3,$4,$5) result',[id(user),bm===null?null:id(bm),utt===null?null:id(utt),page,arac])).rows[0].result;
  const yStat=async(tm=null,bm=null,utt=null,user=1,at='2026-10-30T09:00:00Z')=>(await db.query('SELECT cogniti_token_yonetici_raporu($1,$2,$3,$4,$5) result',[id(user),tm===null?null:id(tm),bm===null?null:id(bm),utt===null?null:id(utt),at])).rows[0].result;
  const yDetay=async(tm=null,bm=null,utt=null,arac='tumu',page=0,user=1)=>(await db.query("SELECT cogniti_token_yonetici_detay_raporu($1,$2,$3,$4,$5,'eclub',$6) result",[id(user),tm===null?null:id(tm),bm===null?null:id(bm),utt===null?null:id(utt),page,arac])).rows[0].result;
  const yEcza=async(tm=null,bm=null,utt=null,arac='tumu',page=0,user=1)=>(await db.query('SELECT cogniti_token_yonetici_eczanem_detay_raporu($1,$2,$3,$4,$5,$6) result',[id(user),tm===null?null:id(tm),bm===null?null:id(bm),utt===null?null:id(utt),page,arac])).rows[0].result;
  await check('Yönetici: firma, TM, BM ve UTT toplamları aynı alt raporlarla eşleşir',async()=>{
    const r=await yStat();assert.deepEqual(r.bmler,[]);assert.deepEqual(r.uttler,[]);assert.equal(r.tmler[0].tm_id,id(2));assert.equal(r.secili_tm_id,null);
    assert.deepEqual((await yStat(2)).gun_sonu,(await tmStat()).gun_sonu);assert.deepEqual((await yStat(2,3)).gun_sonu,(await bmStat()).gun_sonu);
    assert.deepEqual((await yStat(2,3,4)).gun_sonu,await stat());
    for(const arac of ['tumu','video','podcast','gorsel','flip_pdf','viva']){
      assert.deepEqual(await yDetay(2,null,null,arac),await tmDetay(null,null,arac));assert.deepEqual(await yDetay(2,3,4,arac),await filtered(4,arac));
    }
  });
  await check('Yönetici: farklı takımlar birleştirilir; mükerrer TM toplamı katlamaz, yöneticiler ve kapsam dışı kişiler sayılmaz',async()=>{
    await db.query('BEGIN');try{
      await db.query("INSERT INTO kullanicilar VALUES($1,$2,'tm',$3,NULL,true),($4,$2,'bm',$3,$5,true),($6,$7,'tm',$3,NULL,true),($8,$2,'tm',$3,NULL,false),($9,$2,'tm',NULL,NULL,true),($10,$2,'bm',$11,$12,false),($13,$2,'tm',$11,NULL,true),($14,$2,'kd_utt',$11,$12,true)",[id(80),id(100),id(11),id(81),id(22),id(82),id(101),id(83),id(84),id(85),id(10),id(20),id(87),id(70)]);
      await consume(6,300,200,undefined,undefined,4);await consume(70,300,200,undefined,undefined,2);await consume(70,400,70,'firma_kullanicisi','viva_sure',5);
      for(const user of [1,2,3,7,9,99])await consume(user,300,200,undefined,undefined,2);
      const r=await yStat();assert.equal(r.tmler.length,3);assert.equal(r.gun_sonu.eclub_token,35);assert.equal(total(await yDetay()),35);
      assert.equal((await yStat(2)).gun_sonu.eclub_token,31);assert.equal((await yStat(80)).gun_sonu.eclub_token,4);assert.equal((await yStat(87)).gun_sonu.eclub_token,31);
      assert.deepEqual((await yStat(2)).gun_sonu,(await tmStat()).gun_sonu);assert.equal((await yStat(2,3,70)).gun_sonu.eclub_token,7);
      assert.equal((await yStat(80,81,6)).gun_sonu.firma_toplam_token,r.gun_sonu.firma_toplam_token);assert.equal(total(await yDetay(80,81)),4);
      assert.equal(total(await yDetay(null,null,null,'viva')),25);assert.equal(total(await yDetay(null,null,null,'video')),9);
      for(const [tm,bm,utt]of [[null,3,null],[null,null,4],[2,null,4],[2,81,null],[80,3,null],[2,3,6],[2,85,null],[82,null,null],[83,null,null],[84,null,null],[97,null,null]])for(const call of [yStat,yDetay,yEcza]){
        await db.query('SAVEPOINT denied');await assert.rejects(call(tm,bm,utt),{code:'42501'});await db.query('ROLLBACK TO SAVEPOINT denied');
      }
      await consume(70,300,200,undefined,undefined,9,'2026-10-29T21:00:00Z');assert.equal((await yStat()).gun_sonu.eclub_token,35);assert.equal(total(await yDetay()),44);
    }finally{await db.query('ROLLBACK');}
  });
  await check('Yönetici: yedi yönetici rolü, boş firma, ilk gün ve servis yetkisi doğrulanır',async()=>{
    await db.query('BEGIN');try{
      for(const role of ['gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm']){
        await db.query('UPDATE kullanicilar SET rol=$1 WHERE kullanici_id=$2',[role,id(1)]);assert.equal((await yStat()).gun_sonu.eclub_token,24);
      }
      const empty=await yStat(null,null,null,8);assert.deepEqual(empty.tmler,[]);assert.equal(empty.gun_sonu.eclub_token,0);assert.equal(total(await yDetay(null,null,null,'tumu',0,8)),0);
      await db.query("UPDATE cogniti_token_hesaplari SET created_at='2026-10-29T21:00:00Z' WHERE firma_id=$1",[id(100)]);assert.equal((await yStat()).gun_sonu.hazir,false);
      await db.query('DELETE FROM cogniti_token_hesaplari WHERE firma_id=$1',[id(100)]);assert.equal((await yStat()).hesap_var,false);
    }finally{await db.query('ROLLBACK');}
    for(const user of [2,3,4,7,97,98,99])await assert.rejects(yStat(null,null,null,user),{code:'42501'});
    for(const role of ['anon','authenticated']){
      await db.query(`SET ROLE ${role}`);await assert.rejects(yStat(),{code:'42501'});await assert.rejects(yDetay(),{code:'42501'});await assert.rejects(yEcza(),{code:'42501'});await db.query('RESET ROLE');
    }
    await db.query('SET ROLE service_role');assert.equal((await yStat()).gun_sonu.eclub_token,24);await db.query('RESET ROLE');
    await assert.rejects(yDetay(null,null,null,'invalid'),{code:'22023'});await assert.rejects(yEcza(null,null,null,'tumu',-1),{code:'22023'});
  });
  await check('TM: takım toplamı, BM bölgesi ve tek UTT mevcut raporlarla aynıdır',async()=>{
    const r=await tmStat();assert.deepEqual(r.uttler,[]);assert.equal(r.bmler.length,1);assert.equal(r.bmler[0].bm_id,id(3));
    assert.equal(r.secili_bm_id,null);assert.equal(r.secili_utt_id,null);assert.deepEqual(r.gun_sonu,(await bmStat()).gun_sonu);
    assert.equal((await tmStat(3)).uttler[0].utt_id,id(4));assert.deepEqual((await tmStat(3,4)).gun_sonu,await stat());
    for(const arac of ['tumu','video','podcast','gorsel','flip_pdf','viva']){
      assert.deepEqual(await tmDetay(3,null,arac),await bmDetay(null,arac));assert.deepEqual(await tmDetay(3,4,arac),await filtered(4,arac));
    }
  });
  await check('TM: bölgeler birleşir, KD_UTT dahildir; BM/TM, başka takım, firma ve pasifler dışarıda kalır',async()=>{
    await db.query('BEGIN');try{
      await db.query("INSERT INTO kullanicilar VALUES($1,$2,'bm',$3,$4,true),($5,$2,'bm',$6,$4,true),($7,$2,'bm',$3,$4,false),($8,$9,'bm',$3,$4,true),($10,$2,'kd_utt',$3,$11,true),($12,$2,'utt',$3,$11,false)",[id(75),id(100),id(10),id(21),id(76),id(11),id(77),id(78),id(101),id(70),id(20),id(72)]);
      await consume(70,300,200,undefined,undefined,2);await consume(70,400,70,'firma_kullanicisi','viva_sure',5);await consume(5,300,200,undefined,undefined,3);
      for(const user of [2,3,6,72])await consume(user,300,200,undefined,undefined,2);
      const r=await tmStat();assert.equal(r.bmler.length,2);assert.equal(r.gun_sonu.eclub_token,34);assert.equal(total(await tmDetay()),34);
      assert.equal((await tmStat(3)).gun_sonu.eclub_token,31);assert.equal((await tmStat(75)).gun_sonu.eclub_token,3);
      assert.deepEqual((await tmStat(3)).gun_sonu,(await bmStat()).gun_sonu);assert.equal((await tmStat(3,70)).gun_sonu.eclub_token,7);
      assert.equal((await tmStat(75,5)).gun_sonu.firma_toplam_token,r.gun_sonu.firma_toplam_token);assert.equal(total(await tmDetay(75)),3);
      assert.equal(total(await tmDetay(null,null,'viva')),25);assert.equal(total(await tmDetay(null,null,'video')),8);
      for(const [bm,utt] of [[null,4],[3,5],[75,4],[3,72],[76,null],[77,null],[78,null],[97,null]])for(const call of [tmStat,tmDetay,tmEcza]){
        await db.query('SAVEPOINT denied');await assert.rejects(call(bm,utt),{code:'42501'});await db.query('ROLLBACK TO SAVEPOINT denied');
      }
      await consume(70,300,200,undefined,undefined,9,'2026-10-29T21:00:00Z');assert.equal((await tmStat()).gun_sonu.eclub_token,34);assert.equal(total(await tmDetay()),43);
    }finally{await db.query('ROLLBACK');}
  });
  await check('TM: boş takım, ilk gün, olmayan hesap ve tarayıcı/yanlış rol erişimleri korunur',async()=>{
    await db.query('BEGIN');try{
      await db.query("INSERT INTO kullanicilar VALUES($1,$2,'tm',$3,NULL,true)",[id(74),id(100),id(99)]);
      const empty=await tmStat(null,null,74);assert.deepEqual(empty.bmler,[]);assert.deepEqual(empty.uttler,[]);assert.equal(empty.gun_sonu.eclub_token,0);assert.equal(total(await tmDetay(null,null,'tumu',0,74)),0);
      await db.query("UPDATE cogniti_token_hesaplari SET created_at='2026-10-29T21:00:00Z' WHERE firma_id=$1",[id(100)]);assert.equal((await tmStat()).gun_sonu.hazir,false);
      await db.query('DELETE FROM cogniti_token_hesaplari WHERE firma_id=$1',[id(100)]);assert.equal((await tmStat()).hesap_var,false);
    }finally{await db.query('ROLLBACK');}
    for(const user of [1,3,4,7,97,98,99])await assert.rejects(tmStat(null,null,user),{code:'42501'});
    for(const role of ['anon','authenticated']){
      await db.query(`SET ROLE ${role}`);await assert.rejects(tmStat(),{code:'42501'});await assert.rejects(tmDetay(),{code:'42501'});await assert.rejects(tmEcza(),{code:'42501'});await db.query('RESET ROLE');
    }
    await assert.rejects(tmDetay(null,null,'invalid'),{code:'22023'});await assert.rejects(tmEcza(null,null,'tumu',-1),{code:'22023'});
  });
  await check('BM: tek UTT seçimi kendi raporuyla aynıdır; firma değerleri bir kez hesaplanır',async()=>{
    const r=await bmStat();assert.equal(r.uttler.length,1);assert.equal(r.uttler[0].utt_id,id(4));assert.equal(r.secili_utt_id,null);
    assert.deepEqual(r.gun_sonu,(await stat()));assert.deepEqual(await bmDetay(4),await filtered(4));
    for(const arac of ['video','podcast','gorsel','flip_pdf','viva'])assert.deepEqual(await bmDetay(4,arac),await filtered(4,arac));
    assert.deepEqual((await bmStat(4)).gun_sonu,r.gun_sonu);assert.equal((await bmStat(4)).secili_utt_id,id(4));
  });
  await check('BM: bölge UTT/Kd.UTT toplamı; BM kendisi, dış bölge, dış takım, pasif ve dış firma elenir',async()=>{
    await db.query('BEGIN');
    try{
      await db.query("INSERT INTO kullanicilar VALUES($1,$2,'kd_utt',$3,$4,true),($5,$2,'utt',$6,$4,true),($7,$2,'utt',$3,$4,false),($8,$9,'utt',$3,$4,true)",[id(70),id(100),id(10),id(20),id(71),id(11),id(72),id(73),id(101)]);
      await consume(70,300,200,undefined,undefined,2);await consume(70,400,70,'firma_kullanicisi','viva_sure',5);
      for(const user of [3,5,71,72])await consume(user,300,200,undefined,undefined,3);
      await consume(73,302,200,undefined,undefined,3,undefined,101);
      const r=await bmStat();assert.equal(r.uttler.length,2);assert.equal(r.gun_sonu.firma_toplam_token,48);assert.equal(r.gun_sonu.eclub_token,31);
      assert.equal(total(await bmDetay()),31);assert.equal(total(await bmDetay(70)),7);assert.equal(total(await bmDetay(4)),24);
      const videos=await bmDetay(null,'video');assert.equal(total(videos),5);assert.equal(videos.satirlar.filter(x=>x.rol==='eczaci').length,1);
      assert.equal(total(await bmDetay(null,'viva')),25);assert.equal((await bmStat(70)).gun_sonu.firma_toplam_token,48);
      for(const user of [3,5,6,71,72,73,97])for(const call of [bmStat,bmDetay,bmEcza]){
        await db.query('SAVEPOINT refus');await assert.rejects(call(user),{code:'42501'});await db.query('ROLLBACK TO SAVEPOINT refus');
      }
      await consume(70,300,200,undefined,undefined,9,'2026-10-29T21:00:00Z');assert.equal((await bmStat()).gun_sonu.eclub_token,31);assert.equal(total(await bmDetay()),40);
    }finally{await db.query('ROLLBACK');}
  });
  await check('BM: boş bölge, hesap ilk günü ve yetkisiz çağrılar güvenli kalır',async()=>{
    await db.query('BEGIN');
    try{
      await db.query("INSERT INTO kullanicilar VALUES($1,$2,'bm',$3,$4,true)",[id(74),id(100),id(10),id(99)]);
      const empty=await bmStat(null,74);assert.deepEqual(empty.uttler,[]);assert.equal(empty.gun_sonu.eclub_token,0);assert.equal(empty.gun_sonu.firma_toplam_token,29);assert.equal(total(await bmDetay(null,'tumu',0,74)),0);
      await db.query("UPDATE cogniti_token_hesaplari SET created_at='2026-10-29T21:00:00Z' WHERE firma_id=$1",[id(100)]);assert.equal((await bmStat()).gun_sonu.hazir,false);
      await db.query('DELETE FROM cogniti_token_hesaplari WHERE firma_id=$1',[id(100)]);assert.equal((await bmStat()).hesap_var,false);
    }finally{await db.query('ROLLBACK');}
    for(const user of [1,2,4,5,7,97,98,99])await assert.rejects(bmStat(null,user),{code:'42501'});
    for(const role of ['anon','authenticated']){
      await db.query(`SET ROLE ${role}`);await assert.rejects(bmStat(),{code:'42501'});await assert.rejects(bmDetay(),{code:'42501'});await assert.rejects(bmEcza(),{code:'42501'});await db.query('RESET ROLE');
    }
    await assert.rejects(bmDetay(null,'invalid'),{code:'22023'});await assert.rejects(bmDetay(null,'tumu',-1),{code:'22023'});
  });
  await check('Stat: firma geneli ve kendi E-Club/Viva miktarları ayrı; kayıt sayısı veya bakiye kullanılmaz',async()=>{
    assert.deepEqual(await stat(),{hazir:true,veri_tarihi:'2026-10-29',plan_limiti:1500,firma_toplam_token:29,eclub_token:24,eczanem_token:0});
    await db.query('BEGIN');
    try{
      await consume(4,300,200,undefined,undefined,1,'2026-10-29T20:59:59.999Z');
      await consume(4,300,200,undefined,undefined,7,'2026-10-29T21:00:00Z');
      await consume(4,400,4,'firma_kullanicisi','viva_sure',9,'2026-10-29T21:01:00Z');
      await consume(8,302,200,undefined,undefined,11,'2026-10-27T00:00:00Z',101);
      await consume(4,400,200,'eclub_kisi','viva_davet',3,'2026-10-27T00:00:00Z');
      await consume(4,300,200,undefined,undefined,2,'2026-09-01T00:00:00Z');
      await consume(4,300,5,'firma_kullanicisi','tclub_oneri',4,'2026-10-27T00:00:00Z');
      await consume(4,300,200,undefined,undefined,0,'2026-10-27T00:00:00Z');
      const r=await stat();assert.equal(r.firma_toplam_token,39);assert.equal(r.eclub_token,30);assert.equal(r.eczanem_token,0);
      // Türkiye gece yarısından önceki ölçüm, bir önceki gün sonunu kullanır.
      assert.equal((await stat(4,'2026-10-29T20:59:59Z')).veri_tarihi,'2026-10-28');
    }finally{await db.query('ROLLBACK');}
  });
  await check('Stat: ilk gün hazır sayılmaz; boş tüketim sıfırdır; aktif UTT ve sunucu yetkisi zorunludur',async()=>{
    await db.query('BEGIN');
    try{
      await db.query("UPDATE cogniti_token_hesaplari SET created_at='2026-10-29T21:00:00Z' WHERE firma_id=$1",[id(100)]);
      assert.deepEqual(await stat(),{hazir:false,veri_tarihi:'2026-10-29'});
      await db.query('DELETE FROM cogniti_token_hesaplari WHERE firma_id=$1',[id(100)]);
      assert.equal((await stat()).hazir,false);
    }finally{await db.query('ROLLBACK');}
    assert.equal((await stat(9)).eclub_token,0);
    for(const user of [1,2,3,7,97,98,99])await assert.rejects(stat(user),{code:'42501'});
    await assert.rejects(stat(4,null),{code:'22023'});
    for(const role of ['anon','authenticated']){await db.query(`SET ROLE ${role}`);await assert.rejects(stat(),{code:'42501'});await db.query('RESET ROLE');}
    await db.query('SET ROLE service_role');assert.equal((await stat()).firma_toplam_token,29);await db.query('RESET ROLE');
  });
  await check('Eczanem: gerçek UTT dağıtımı, eczane/üye sayısı ve kayıtlı token ayrı hesaplanır',async()=>{
    await db.query('BEGIN');
    try{
      async function dagit(yayin,eczane,utt=4){await db.query('INSERT INTO eczanem_eczane_gonderimleri(yayin_id,eczane_id,gonderen_utt_id,created_at) VALUES($1,$2,$3,$4)',[id(yayin),id(eczane),id(utt),'2026-10-27T00:00:00Z']);}
      async function musteri(n,yayin,eczane,customer,token=0,at='2026-10-28T21:30:00Z',arac='video'){
        await db.query('INSERT INTO eczanem_gonderimler VALUES($1,$2,$3,$4,$5,$6,$7)',[id(n),id(eczane),id(yayin),id(customer),id(200),at,arac]);
        if(token)await consume(200,yayin,customer,'eczanem_musteri','eczanem_musteri',token,at,100,'eclub_kisi',`eczanem-gonderim:${id(n)}`);
      }
      await dagit(300,700);await dagit(300,701);await dagit(300,702,5);await dagit(301,700);await dagit(302,703);await dagit(300,704);
      await musteri(800,300,700,900,1);await musteri(801,300,700,901);
      await musteri(802,300,701,900);await musteri(803,300,701,902,1);
      await musteri(804,300,702,903,1); // Başka UTT'ye ait gerçek dağıtım.
      await musteri(805,300,705,904,1); // UTT'nin yayın-eczane gönderimi yok.
      await musteri(806,300,700,905,1,'2026-10-26T00:00:00Z'); // Eczaneye gelmeden önce.
      await musteri(807,302,703,906); // Başka firma yayını.
      await musteri(808,301,700,907,0,undefined,'podcast');
      await musteri(809,300,704,908); // Yalnız tüketimsiz gönderimi olan eczane sayılmaz.
      await consume(200,300,908,'eczanem_musteri','eczanem_musteri',0,undefined,100,'eclub_kisi',`eczanem-gonderim:${id(809)}`);
      const r=await eczanem();const row=r.satirlar.find(x=>x.arac==='video');
      assert.equal(r.satirlar.length,1);assert.equal(row.tarih,'2026-10-29');assert.equal(row.eczane_sayisi,2);assert.equal(row.gonderilen,2);assert.equal(row.token,2);assert.equal(row.talep_no,30008);
      assert(r.satirlar.every(x=>x.token>0));
      assert.equal((await eczanem(4,'podcast')).satirlar.length,0);assert.equal((await eczanem(4,'viva')).satirlar.length,0);
      assert.equal(total(await eczanem(5)),1);assert.equal((await eczanem(6)).satirlar.length,0);
      assert.equal((await stat()).eczanem_token,total(r));assert.equal((await stat(5)).eczanem_token,1);
      assert.deepEqual(await bmEcza(4),r);assert.equal((await bmStat()).gun_sonu.eczanem_token,2);assert.equal(total(await bmEcza()),2);
      assert.deepEqual(await tmEcza(3,4),r);assert.equal((await tmStat(3)).gun_sonu.eczanem_token,2);assert.equal((await tmStat()).gun_sonu.eczanem_token,3);assert.equal(total(await tmEcza()),3);
      assert.deepEqual(await yEcza(2,3,4),r);assert.equal((await yStat()).gun_sonu.eczanem_token,3);assert.deepEqual(await yEcza(),await tmEcza());
      assert.equal((await tmEcza()).satirlar[0].eczane_sayisi,3);assert.equal((await tmEcza()).satirlar[0].gonderilen,3);
      assert(!JSON.stringify(r).includes('Gizli ürün'));assert(!JSON.stringify(r).includes('musteri_id'));
      // Güncel kurumsal bağ farklı UTT'ye taşınsa da gönderici değişmez.
      await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,true,$3)',[id(700),id(100),id(5)]);
      assert.deepEqual(await eczanem(),r);
      await db.query("UPDATE kullanicilar SET rol='kd_utt' WHERE kullanici_id=$1",[id(4)]);assert.deepEqual(await eczanem(),r);
      assert.equal((await stat()).eczanem_token,2);
      // Bugünün tüketimli müşteri gönderimi dünkü stat toplamına girmez.
      await musteri(810,300,700,909,1,'2026-10-29T21:00:00Z');
      assert.equal((await stat()).eczanem_token,2);
    }finally{await db.query('ROLLBACK');}
  });
  await check('Eczanem: yayın bazlı 50 satır sayfalaması ve araç filtresi tutarlıdır',async()=>{
    await db.query('BEGIN');
    try{
      for(let n=0;n<53;n++){
        await db.query('INSERT INTO v_yayin_detay VALUES($1,$2,$3,$4,$5,$6)',[id(2000+n),id(100),'Aynı Ürün',n===52?'gorsel':'video','hepifarma',31000+n]);
        await db.query('INSERT INTO eczanem_eczane_gonderimleri(yayin_id,eczane_id,gonderen_utt_id,created_at) VALUES($1,$2,$3,$4)',[id(2000+n),id(700),id(4),'2026-10-01T00:00:00Z']);
        await db.query('INSERT INTO eczanem_gonderimler VALUES($1,$2,$3,$4,$5,$6,$7)',[id(3000+n),id(700),id(2000+n),id(900),id(200),'2026-10-28T21:30:00Z',n===52?'gorsel':'video']);
        if(n<52)await consume(200,2000+n,900,'eczanem_musteri','eczanem_musteri',1,undefined,100,'eclub_kisi',`eczanem-gonderim:${id(3000+n)}`);
      }
      const first=await eczanem(),second=await eczanem(4,'tumu',1);
      assert.equal(first.satirlar.length,50);assert(first.devami_var);assert.equal(second.satirlar.length,2);assert(!second.devami_var);
      assert.equal(new Set([...first.satirlar,...second.satirlar].map(x=>x.id)).size,52);
      assert.deepEqual(await bmEcza(),first);assert.deepEqual(await bmEcza(null,'tumu',1),second);
      assert.deepEqual(await tmEcza(),first);assert.deepEqual(await tmEcza(null,null,'tumu',1),second);
      assert.deepEqual(await yEcza(),first);assert.deepEqual(await yEcza(null,null,null,'tumu',1),second);
      assert.equal(total(first)+total(second),52);
      const gorsel=await eczanem(4,'gorsel');assert.equal(gorsel.satirlar.length,0);
    }finally{await db.query('ROLLBACK');}
  });
  await check('Eczanem: yalnız aktif UTT/KD_UTT ve service role erişebilir',async()=>{
    for(const user of [1,2,3,7,97,98,99])await assert.rejects(eczanem(user),{code:'42501'});
    for(const arac of ['invalid',null])await assert.rejects(eczanem(4,arac),{code:'22023'});
    await assert.rejects(eczanem(4,'tumu',-1),{code:'22023'});
    for(const role of ['anon','authenticated']){await db.query(`SET ROLE ${role}`);await assert.rejects(eczanem(),{code:'42501'});await db.query('RESET ROLE');}
  });
  await check('E-Club Tümü, dört araç ve kendi Viva tüketimleri birbirinden ayrılır',async()=>{
    assert.equal(total(await filtered(4)),24);
    assert.equal(total(await filtered(4,'video')),3);
    for(const arac of ['podcast','gorsel','flip_pdf'])assert.equal(total(await filtered(4,arac)),0);
    const viva=await filtered(4,'viva');assert.equal(total(viva),20);assert(viva.satirlar.every(x=>x.arac==='viva'));
    assert.equal(viva.satirlar[0].yayin_adi,'Süre yayını');
    assert.deepEqual(viva.satirlar[0].davetli_turleri,['ic']);assert.equal(viva.satirlar[0].davetli_sayisi,2);assert.equal(viva.satirlar[0].katilim_sayisi,10);
    assert.equal(total(await filtered(5)),0); // Başka UTT’nin Viva tüketimi gelmez.
    assert.equal(total(await filtered(4,'tumu',0,'tumu')),26);
    await assert.rejects(filtered(4,'invalid'),{code:'22023'});
    await assert.rejects(filtered(4,'tumu',0,'invalid'),{code:'22023'});
  });
  await check('Viva davetlerinin üç alıcı rolü aynı etkinlik adını taşır; farklı etkinlikler birleşmez',async()=>{
    await db.query('BEGIN');
    try{
      await db.query('INSERT INTO viva_etkinlikler(etkinlik_id,firma_id,baslik) VALUES($1,$2,$3),($4,$2,$3),($5,$6,$7)',[id(410),id(100),'Deneme_11_27_10_2026',id(411),id(412),id(101),'Gizli etkinlik']);
      await db.query("INSERT INTO eclub_kisiler VALUES($1,'ikinci_eczaci')",[id(202)]);
      for(const[recipient,count]of [[200,3],[201,5],[202,1]])for(let n=0;n<count;n++)await consume(4,410,recipient,'eclub_kisi','viva_davet');
      await consume(4,411,200,'eclub_kisi','viva_davet');await consume(4,412,200,'eclub_kisi','viva_davet');
      const r=await filtered(4,'tumu');const rows=r.satirlar.filter(x=>x.yayin_adi==='Deneme_11_27_10_2026');
      assert.equal(rows.length,4);assert.equal(total({satirlar:rows}),10);
      assert.deepEqual(rows.map(x=>x.gonderilen).sort(),[1,1,3,5]);assert.equal(new Set(rows.map(x=>x.id)).size,4);
      assert(!JSON.stringify(r).includes('Gizli etkinlik'));assert(r.satirlar.some(x=>x.yayin_adi===null));
      const viva=await filtered(4,'viva'),events=viva.satirlar.filter(x=>x.yayin_adi==='Deneme_11_27_10_2026');
      assert.equal(events.length,2);assert.deepEqual(events.map(x=>x.token).sort((a,b)=>a-b),[1,9]);
      assert.equal(total(viva),total({satirlar:r.satirlar.filter(x=>x.arac==='viva')}));
      assert(events.every(x=>x.katilim_sayisi===null));
      const hidden=viva.satirlar.find(x=>x.yayin_adi===null);assert.equal(hidden.davetli_sayisi,null);assert.equal(hidden.katilim_sayisi,null);
    }finally{await db.query('ROLLBACK');}
  });
  await check('Viva: karma davetliler, kesinleşmiş Daily sayısı ve eksik ölçüm birbirine karışmaz',async()=>{
    await db.query('BEGIN');
    try{
      for(let n=0;n<20;n++)await db.query("INSERT INTO viva_katilimcilar VALUES($1,'eclub',NULL,$2)",[id(400),id(6000+n)]);
      await db.query('INSERT INTO viva_davetler VALUES($1,false),($1,true)',[id(400)]);
      const row=(await filtered(4,'viva')).satirlar[0];
      assert.deepEqual(row.davetli_turleri,['ic','eclub','ozel']);assert.equal(row.davetli_sayisi,23);assert.equal(row.katilim_sayisi,10);assert.equal(row.token,20);
      await db.query("UPDATE cogniti_viva_tuketim_isleri SET durum='bekliyor' WHERE etkinlik_id=$1",[id(400)]);
      assert.equal((await filtered(4,'viva')).satirlar[0].katilim_sayisi,null);
      await db.query("UPDATE cogniti_viva_tuketim_isleri SET durum='tamam',firma_id=$2 WHERE etkinlik_id=$1",[id(400),id(101)]);
      assert.equal((await filtered(4,'viva')).satirlar[0].katilim_sayisi,null);
      await db.query('DELETE FROM viva_katilimcilar WHERE etkinlik_id=$1',[id(400)]);
      await db.query('DELETE FROM viva_davetler WHERE etkinlik_id=$1',[id(400)]);
      const empty=(await filtered(4,'viva')).satirlar[0];assert.equal(empty.davetli_sayisi,0);assert.deepEqual(empty.davetli_turleri,[]);
    }finally{await db.query('ROLLBACK');}
  });
  await check('Viva: etkinliğe bağlı ürün rapora gelir; başka firmanın ürünü açıklanmaz',async()=>{
    await db.query('BEGIN');
    try{
      await db.query('INSERT INTO urunler VALUES($1,$2,$3),($4,$5,$6)',[id(6500),id(100),'Normavas',id(6501),id(101),'Firma dışı ürün']);
      await db.query('UPDATE viva_etkinlikler SET urun_id=$2 WHERE etkinlik_id=$1',[id(400),id(6500)]);
      const row=(await filtered(4,'viva')).satirlar[0];assert.equal(row.urun,'Normavas');assert.equal(row.token,20);assert.equal(row.davetli_sayisi,2);
      assert((await filtered(4)).satirlar.some(x=>x.arac==='viva'&&x.urun==='Normavas'));
      await db.query('UPDATE viva_etkinlikler SET urun_id=$2 WHERE etkinlik_id=$1',[id(400),id(6501)]);
      assert.equal((await filtered(4,'viva')).satirlar[0].urun,null);
    }finally{await db.query('ROLLBACK');}
  });
  await check('Araç filtresi 50 satır sınırından önce uygulanır; eski eşleşmeler kaybolmaz',async()=>{
    await db.query('BEGIN');
    try{
      for(const [n,arac] of [[310,'gorsel'],[311,'podcast'],[312,'flip_pdf']]){
        await db.query('INSERT INTO v_yayin_detay VALUES($1,$2,$3,$4,$5,$6)',[id(n),id(100),'Filtre ürünü',arac,'hepifarma',n]);
        await consume(4,n,200,undefined,undefined,1,'2026-01-01T00:00:00Z');
      }
      for(let n=1;n<=55;n++)await consume(4,300,200,undefined,undefined,1,`2026-${n<=28?'09':'08'}-${String(n<=28?n:n-28).padStart(2,'0')}T00:00:00Z`);
      assert.equal((await filtered(4)).devami_var,true);
      for(const arac of ['gorsel','podcast','flip_pdf']){
        const r=await filtered(4,arac);assert.equal(r.satirlar.length,1);assert.equal(r.satirlar[0].arac,arac);assert.equal(r.devami_var,false);
      }
      const a=await filtered(4,'video'),b=await filtered(4,'video',1);
      assert.equal(a.satirlar.length,50);assert.equal(a.devami_var,true);assert.equal(b.devami_var,false);assert.equal(total(a)+total(b),58);
    }finally{await db.query('ROLLBACK');}
  });
  await check('Türkiye günü / ürün / araç / gerçek alıcı rolü gruplanır; görünüm çoğaltmaz', async () => {
    const r = await report(4); const row = r.satirlar.find(x => x.urun === 'Abilon' && x.rol === 'eczaci');
    assert.equal(row.tarih,'2026-10-29'); assert.equal(row.gonderilen,2); assert.equal(row.token,2);
    assert.equal(row.firma_adi,'hepifarma'); assert.equal(row.talep_no,30008);
    assert.equal(row.yayin_id,id(300));
    assert(r.satirlar.some(x => x.rol === 'eczane_teknisyeni' && x.token === 1)); assert.equal(total(r),26);
  });
  await check('Aynı gün/ürün/araç/roldeki farklı yayınlar ayrı kalır; kod ve tüketim doğru eşleşir', async () => {
    await db.query('BEGIN');
    try {
      await db.query("INSERT INTO v_yayin_detay VALUES($1,$2,'Abilon','video','hepifarma',30010),($3,$2,'Abilon','video','hepifarma',30010)",[id(303),id(100),id(304)]);
      await consume(4,303,200); await consume(4,304,200);
      const r=await report(4); const rows=r.satirlar.filter(x=>x.urun==='Abilon'&&x.rol==='eczaci');
      assert.equal(rows.length,3); assert.deepEqual(rows.map(x=>x.talep_no).sort(),[30008,30010,30010]);
      assert.deepEqual(rows.map(x=>x.token).sort(),[1,1,2]); assert.equal(new Set(rows.map(x=>x.id)).size,3); assert.equal(total(r),28);
      assert.deepEqual(rows.map(x=>x.yayin_id).sort(),[id(300),id(303),id(304)]);
    } finally { await db.query('ROLLBACK'); }
  });
  await check('Viva 20 token tek kayıt olsa da 20 toplanır; sahte gönderim sayısı yoktur', async () => {
    const row = (await report(4)).satirlar.find(x => x.arac === 'viva'); assert.equal(row.token,20); assert.equal(row.gonderilen,null); assert.equal(row.urun,null); assert.equal(row.firma_adi,null); assert.equal(row.talep_no,null);
    assert.equal(row.yayin_id,null);
  });
  await check('E-Club dışındaki tüketimlere Gönderilenler bağlantısı verilmez', async () => {
    const r = await report(1);
    assert(r.satirlar.filter(x => ['musteri','bm','utt','viva_katilim','firma_kullanicisi'].includes(x.rol)).every(x => x.yayin_id === null));
    assert.equal(r.satirlar.find(x => x.urun === 'Laropen').yayin_id,null);
  });
  await check('Silinmiş yayın ve alıcı tüketimi kaybolmaz; firma dışı ürün açıklanmaz', async () => {
    const r = await report(4); assert(r.satirlar.some(x => x.urun === null && x.rol === 'firma_kullanicisi'));
    assert(!JSON.stringify(r).includes('Gizli ürün')); assert(!JSON.stringify(r).includes('Diğer Firma'));
  });
  await check('Firma/takım/bölge/kendi kapsamları ve Eczanem mevcut UTT bağı korunur', async () => {
    assert.equal(total(await report(1)),29); assert.equal(total(await report(2)),28); assert.equal(total(await report(3)),27); assert.equal(total(await report(4)),26);
    assert.equal(total(await report(8)),1); assert.equal(total(await report(7)),0); assert.equal(total(await report(9)),0);
  });
  await check('Eczanem kapsamı birden fazla bağda aynı tüketimi katlamaz', async () => {
    await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,true,$3)',[id(501),id(100),id(4)]); assert.equal(total(await report(3)),27);
  });
  await check('Pasif kullanıcı/firma ve kimliği bulunmayan kişi reddedilir', async () => {
    for(const user of [97,98,99]) { await assert.rejects(report(user),{code:'42501'}); await assert.rejects(filtered(user),{code:'42501'}); }
    await assert.rejects(report(4,-1),{code:'22023'}); await assert.rejects(report(4,10001),{code:'22023'});
  });
  await check('50 satırlı sayfalar grupları kesmez; kimlikler kararlı, toplam tamdır', async () => {
    for(let n=0;n<60;n++) await consume(4,300,200,undefined,undefined,1,`2026-08-${String(1+n%28).padStart(2,'0')}T${String(Math.floor(n/28)).padStart(2,'0')}:00:00Z`);
    // Yeni tarih grupları 28 adet: 50 sınırını aşmak için eski günler de eklenir.
    for(let n=1;n<=28;n++) await consume(4,301,200,undefined,undefined,1,`2026-07-${String(n).padStart(2,'0')}T00:00:00Z`);
    const first=await report(4), second=await report(4,1);
    assert.equal(first.satirlar.length,50); assert.equal(first.devami_var,true); assert.equal(second.devami_var,false);
    assert.equal(new Set([...first.satirlar,...second.satirlar].map(x=>x.id)).size,first.satirlar.length+second.satirlar.length);
    assert.equal(total(first)+total(second),114); assert.deepEqual(first,await report(4));
  });
  await check('Tarayıcı rollerinin RPC yetkisi yok; yalnız service role çağırabilir', async () => {
    for(const role of ['anon','authenticated']) {
      await db.query(`SET ROLE ${role}`); await assert.rejects(report(4),{code:'42501'}); await assert.rejects(filtered(4),{code:'42501'}); await db.query('RESET ROLE');
    }
    await db.query('SET ROLE service_role'); assert.equal((await report(4)).satirlar.length,50); await db.query('RESET ROLE');
  });
  console.log(`${passed} PostgreSQL kontrolü başarılı.`);
} finally {
  await db?.end().catch(()=>{});
  if(started) execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','immediate','-w','stop'],{stdio:'pipe'});
  rmSync(root,{recursive:true,force:true});
}
