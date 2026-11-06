import { PGlite } from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const repo = process.env.COGNITI_HAKEDIS_TEST_ROOT ?? new URL('../', import.meta.url);
const file = name => {
  const staged = process.env.COGNITI_HAKEDIS_TEST_STAGE ? new URL('scripts/sql/' + name, process.env.COGNITI_HAKEDIS_TEST_STAGE) : null;
  return readFile(staged && existsSync(staged) ? staged : new URL('scripts/sql/' + name, repo), 'utf8');
};
const db = new PGlite();
let passed = 0;
const eq = (a, b) => { assert.deepEqual(a, b); passed++; };
const fail = async promise => { await assert.rejects(promise); passed++; };
const id = n => '10000000-0000-4000-8000-' + String(n).padStart(12, '0');
const admin = id(1), p1 = id(11), p2 = id(12), p3 = id(13), e1 = id(21), e2 = id(22), firma = id(31);
const token = 'a'.repeat(64), token2 = 'b'.repeat(64), token3 = 'c'.repeat(64);

try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE firmalar(firma_id uuid PRIMARY KEY);
    CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,rol text,aktif_mi boolean);
    CREATE TABLE agora_is_partnerleri(partner_id uuid PRIMARY KEY,giris_surum integer DEFAULT 1,
      erisim_acik boolean DEFAULT true,ilk_giris_durumu text DEFAULT 'onaylandi',uyelik_durumu text DEFAULT 'onaylandi');
    CREATE TABLE agora_partner_profilleri(partner_id uuid PRIMARY KEY);
    CREATE TABLE agora_partner_oturumlari(token_ozeti text PRIMARY KEY,partner_id uuid,giris_surum integer,bitis_at timestamptz);
    CREATE TABLE agora_partner_egitimleri(egitim_id uuid PRIMARY KEY,egitim_adi text,fiyat_tl numeric);
    CREATE TABLE cogniti_token_tuketimleri(tuketim_id uuid PRIMARY KEY);
  `);
  const purchase = await file('agora_satin_alma.sql');
  await db.exec(purchase.slice(purchase.indexOf('CREATE TABLE IF NOT EXISTS public.agora_siparisleri'), purchase.indexOf('CREATE OR REPLACE FUNCTION public.agora_satin_alma_yetki')));
  const auth = await file('agora_partner_ilk_giris_onayi.sql');
  await db.exec(auth.slice(auth.indexOf('CREATE OR REPLACE FUNCTION public.agora_partner_admin_dogrula'), auth.indexOf('CREATE OR REPLACE FUNCTION public.agora_partner_basvurulari')));
  await db.exec('REVOKE ALL ON FUNCTION agora_partner_admin_dogrula(uuid) FROM PUBLIC,anon,authenticated,service_role');
  await db.exec(await file('agora_partner_hakedis_alanlari.sql'));
  const sql = await file('agora_partner_hakedis_okuma.sql');
  await db.exec(sql); passed++;
  await db.exec(sql); passed++;
  await db.query('INSERT INTO firmalar VALUES($1)', [firma]);
  await db.query("INSERT INTO kullanicilar VALUES($1,'admin',true)", [admin]);
  for (const partner of [p1, p2, p3]) {
    await db.query('INSERT INTO agora_is_partnerleri(partner_id) VALUES($1)', [partner]);
    await db.query('INSERT INTO agora_partner_profilleri VALUES($1)', [partner]);
  }
  for (const [hash, partner] of [[token, p1], [token2, p2], [token3, p3]]) {
    await db.query("INSERT INTO agora_partner_oturumlari VALUES($1,$2,1,now()+interval '1 hour')", [hash, partner]);
  }
  await db.query("INSERT INTO agora_partner_egitimleri VALUES($1,'Yeni ad',99999),($2,'Diğer eğitim',5000)", [e1, e2]);
  for (let i = 1; i <= 27; i++) {
    const alici = id(100 + i);
    await db.query("INSERT INTO kullanicilar VALUES($1,'pm',true)", [alici]);
    await db.query(`INSERT INTO agora_siparisleri(siparis_id,firma_id,alici_id,egitim_id,partner_id,
      partner_egitim_id,egitim_adi,egitim_surumu,satin_alma_bedeli,kko_birim_fiyati,token_tutari,
      borca_yazilan_token,hizmet_bedeli,odenecek_tutar,paket,siparis_tarihi)
      VALUES($1,$2,$3,$4,$5,$6,'Satış anındaki ad',1,10000,9.90,1010,0,1500,8500,'{}','2026-11-06T11:00:00+03:00')`,
    [id(200 + i), firma, alici, i <= 25 ? e1 : e2, i <= 25 ? p1 : p2, i <= 25 ? 'PE-10001' : 'PE-20001']);
  }
  await db.query("UPDATE agora_siparisleri SET planlanan_odeme_gunu='2026-11-15',odenen_gun='2026-11-16' WHERE siparis_id=$1", [id(225)]);
  const partnerRead = async (hash = token, page = 1) => (await db.query('SELECT agora_partner_hakedisleri_oku($1,$2) d', [hash, page])).rows[0].d;
  const adminRead = async (partner = p1, page = 1, actor = admin) => (await db.query('SELECT agora_partner_admin_hakedisleri_oku($1,$2,$3) d', [actor, partner, page])).rows[0].d;
  const first = await partnerRead();
  eq(first.partner_id, p1); eq(first.toplam, 25); eq(first.kayitlar.length, 20);
  eq(first.kayitlar.map(r => r.siparis_id), Array.from({ length: 20 }, (_, n) => id(225 - n)));
  eq(first.kayitlar.every(r => r.partner_egitim_id === 'PE-10001'), true);
  eq({ ...first.kayitlar[0], siparis_tarihi: new Date(first.kayitlar[0].siparis_tarihi).toISOString() }, {
    siparis_id: id(225), partner_egitim_id: 'PE-10001', egitim_adi: 'Satış anındaki ad',
    siparis_tarihi: '2026-11-06T08:00:00.000Z', satin_alma_bedeli: 10000, hizmet_bedeli: 1500,
    hak_edis: 8500, kdv_tutari: 1700, kdvli_odenecek_tutar: 10200,
    planlanan_odeme_gunu: '2026-11-15', odenen_gun: '2026-11-16',
  });
  eq(await adminRead(), first);
  const second = await partnerRead(token, 2);
  eq(second.toplam, 25); eq(second.kayitlar.length, 5);
  eq(new Set([...first.kayitlar, ...second.kayitlar].map(r => r.siparis_id)).size, 25);
  eq((await partnerRead(token, 3)).kayitlar, []);
  eq((await partnerRead(token2)).toplam, 2); eq((await partnerRead(token2)).partner_id, p2);
  eq((await partnerRead(token3)).toplam, 0); eq((await partnerRead(token3)).kayitlar, []);
  eq(await adminRead(id(999)), null);
  eq(await partnerRead('yanlis'), null);
  for (const page of [0, -1, 100001, null]) { await fail(partnerRead(token, page)); await fail(adminRead(p1, page)); }
  await db.query("UPDATE agora_partner_oturumlari SET bitis_at=now()-interval '1 second' WHERE token_ozeti=$1", [token]);
  eq(await partnerRead(), null);
  await db.query("UPDATE agora_partner_oturumlari SET bitis_at=now()+interval '1 hour',giris_surum=2 WHERE token_ozeti=$1", [token]);
  eq(await partnerRead(), null);
  await db.query('UPDATE agora_partner_oturumlari SET giris_surum=1 WHERE token_ozeti=$1', [token]);
  for (const [alan, deger, eski] of [['erisim_acik', false, true], ['ilk_giris_durumu', 'reddedildi', 'onaylandi'], ['uyelik_durumu', 'onay_bekliyor', 'onaylandi']]) {
    await db.query(`UPDATE agora_is_partnerleri SET ${alan}=$1 WHERE partner_id=$2`, [deger, p1]);
    eq(await partnerRead(), null); eq((await adminRead()).toplam, 25);
    await db.query(`UPDATE agora_is_partnerleri SET ${alan}=$1 WHERE partner_id=$2`, [eski, p1]);
  }
  const roller = ['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per',
    'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','tm','bm','utt','kd_utt','iu','firma_admin'];
  for (let n = 0; n < roller.length; n++) {
    const actor = id(300 + n);
    await db.query('INSERT INTO kullanicilar VALUES($1,$2,true)', [actor, roller[n]]);
    await fail(adminRead(p1, 1, actor));
  }
  await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1', [admin]);
  await fail(adminRead());
  await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1', [admin]);
  for (const role of ['anon', 'authenticated', 'service_role']) {
    await db.exec('SET ROLE ' + role);
    await fail(db.query('SELECT * FROM agora_siparisleri'));
    await fail(db.query('SELECT agora_partner_hakedis_kayitlari($1,1)', [p2]));
    if (role === 'service_role') { eq((await partnerRead()).toplam, 25); eq((await adminRead()).toplam, 25); }
    else { await fail(partnerRead()); await fail(adminRead()); }
    await db.exec('RESET ROLE');
  }
  const writeSql = await file('agora_partner_hakedis_odeme_gunu.sql');
  await db.exec(writeSql); await db.exec(writeSql); passed += 2;
  const save = (actor=admin, partner=p1, order=id(225), day='2027-01-20', old='2026-11-15') =>
    db.query('SELECT agora_partner_admin_odeme_gunu_kaydet($1,$2,$3,$4::date,$5::date) AS data', [actor,partner,order,day,old]);
  eq((await save()).rows[0].data, {siparis_id:id(225),planlanan_odeme_gunu:'2027-01-20'});
  eq((await partnerRead()).kayitlar[0].planlanan_odeme_gunu, '2027-01-20');
  eq((await partnerRead()).kayitlar[0].odenen_gun, '2026-11-16');
  eq((await partnerRead()).kayitlar[0].hak_edis, 8500);
  await fail(save()); // stale value cannot overwrite
  await fail(save(admin,p2)); // other partner scope
  await fail(save(admin,p1,id(999))); // missing order
  await fail(save(admin,p1,id(225),'2026-02-30','2027-01-20'));
  eq((await save(admin,p1,id(225),null,'2027-01-20')).rows[0].data.planlanan_odeme_gunu,null);
  eq((await save(admin,p1,id(225),'2027-02-01',null)).rows[0].data.planlanan_odeme_gunu,'2027-02-01');
  for (let n=0;n<roller.length;n++) await fail(save(id(300+n),p1,id(225),null,'2027-02-01'));
  await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[admin]);
  await fail(save(admin,p1,id(225),null,'2027-02-01'));
  await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[admin]);
  for (const role of ['anon','authenticated']) {
    await db.exec('SET ROLE '+role); await fail(save()); await db.exec('RESET ROLE');
  }
  await db.exec('SET ROLE service_role');
  eq((await save(admin,p1,id(225),'2027-02-02','2027-02-01')).rows[0].data.planlanan_odeme_gunu,'2027-02-02');
  await db.exec('RESET ROLE');
  console.log(JSON.stringify({ passed, scope: 'Yerel PGlite; sahte kimlik/oturum tabloları, gerçek sipariş şeması, admin doğrulayıcı ve hak ediş SQLleri. Supabase bağlantısı yok.' }));
} finally { await db.close(); }
