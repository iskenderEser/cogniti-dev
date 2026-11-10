import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";

const bin = process.argv[2];
const root = mkdtempSync("/tmp/cogniti-esnek-log-");
const data = join(root, "data");
const pgctl = (...args) => execFileSync(join(bin, "pg_ctl"), ["-D", data, ...args], { stdio: "pipe" });
const config = { host: root, port: 55472, user: "esnek_log_test", database: "postgres", statement_timeout: 5000 };
const a = new pg.Client(config);
let started = false;

try {
  execFileSync(join(bin, "initdb"), ["-D", data, "-U", config.user, "-A", "trust", "--no-locale"], { stdio: "pipe" });
  pgctl("-l", join(root, "postgres.log"), "-o", `-k ${root} -h '' -p ${config.port}`, "-w", "start");
  started = true;
  await a.connect();
  assert.equal((await a.query("SELECT inet_server_addr() AS adres")).rows[0].adres, null);
  await a.query(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean,firma_admin_aktif boolean DEFAULT true);
    CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid REFERENCES firmalar,rol text,aktif_mi boolean,ad text,soyad text);
  `);
  const firma = randomUUID(), admin = randomUUID(), pm = randomUUID();
  await a.query("INSERT INTO firmalar VALUES($1,true)", [firma]);
  await a.query("INSERT INTO kullanicilar VALUES($1,$3,'admin',true,'Test','Admin'),($2,$3,'pm',true,'Test','PM')", [admin,pm,firma]);
  const oku = name => readFileSync(`scripts/sql/${name}.sql`, "utf8");
  for (const ad of ["cogniti_merkezi_fiyat_tarifesi", "cogniti_sm2_kko_oranlari", "cogniti_esnek_paket_son_liste",
    "cogniti_aylik_abonelik_fiyatlari", "cogniti_planlama_tarife_okuma", "cogniti_esnek_paket_siparis_adim1"]) {
    await a.query(oku(ad));
  }
  const fiyatlar = async () => (await a.query("SELECT cogniti_sm2_fiyatlari_oku() AS veri")).rows[0].veri;
  const tarife = async () => (await a.query("SELECT cogniti_fiyat_tarifesi_yonet($1) AS veri", [admin])).rows[0].veri;
  const kaydet = async d => (await a.query("SELECT cogniti_fiyat_tarifesi_yonet($1,$2,$3) AS veri", [admin,d.degerler,d.surum])).rows[0].veri;
  const siparis = async (adet, surum, fiyat) => a.query(
    "SELECT cogniti_esnek_paket_siparis_olustur($1,$2,$3,$4,$5)", [pm,adet,surum,fiyat,randomUUID()]);
  const onceki = await fiyatlar();
  const sql = oku("cogniti_esnek_paket_logaritmik_fiyat");
  await a.query(sql);
  const ilk = await fiyatlar();
  const excel = JSON.parse(readFileSync("tests/fixtures/esnekPaketLogaritmik.json", "utf8"));
  assert.deepEqual(ilk.sm2.map(({token_adedi,birim_fiyat}) => ({token_adedi,birim_fiyat})), excel);
  assert.deepEqual(ilk.paketler, onceki.paketler);
  assert.deepEqual(ilk.kko, onceki.kko);
  assert.equal(ilk.surum, onceki.surum + 1);
  assert.deepEqual((await tarife()).sm2, ilk.sm2);
  await siparis(3000, ilk.surum, 5.33);
  await assert.rejects(siparis(10500, ilk.surum, 5), {code:"22023"});
  const d = await tarife();
  d.degerler.esnek_2500_token_tl = 6.5;
  const degisenIlk = await kaydet(d);
  assert.equal(degisenIlk.sm2[1].birim_fiyat, 6.27);
  await assert.rejects(siparis(3000, ilk.surum, 5.33), {code:"P0001"});
  degisenIlk.degerler.esnek_50000_token_tl = 3.75;
  const degisenSon = await kaydet(degisenIlk);
  assert.equal(degisenSon.sm2[1].birim_fiyat, 6.33);
  await siparis(3000, degisenSon.surum, 6.33);
  const eski = (await a.query("SELECT birim_fiyat FROM cogniti_esnek_paket_siparisleri ORDER BY birim_fiyat")).rows;
  assert.deepEqual(eski, [{birim_fiyat:"5.33"},{birim_fiyat:"6.33"}]);
  degisenSon.degerler.kko_token_tl = 10;
  const kkoDegisti = await kaydet(degisenSon);
  assert.deepEqual(kkoDegisti.sm2.map(x=>x.birim_fiyat), degisenSon.sm2.map(x=>x.birim_fiyat));
  await a.query(sql);
  assert.equal((await fiyatlar()).surum, kkoDegisti.surum);
  assert.equal((await fiyatlar()).sm2[1].birim_fiyat, 6.33);
  console.log("56 Excel fiyatı, iki uç fiyat değişikliği, KKÖ bağımsızlığı, sipariş ve tekrar kurulum doğrulandı.");
  await a.query(`CREATE TABLE eczanem_yayin_token_hesaplari(yayin_id uuid,firma_id uuid,pm_id uuid,bakiye_id uuid);
 CREATE TABLE eczanem_token_bloklari(blok_id uuid,yukleme_id uuid,durum text,bitis_at timestamptz,bakiye_id uuid,firma_id uuid,yayin_id uuid,tuketildi_at timestamptz);
 CREATE TABLE cogniti_yayin_plan_tokenlari(yayin_id uuid,durum text);
 CREATE TABLE cogniti_yayin_plan_token_dagilimi(yayin_id uuid,yukleme_id uuid,miktar integer);
 CREATE TABLE yayin_yonetimi(yayin_id uuid PRIMARY KEY,uretici_id uuid,token_hesap_turu text,hedef_roller text[]);
 CREATE TABLE cogniti_esnek_gonderim_tuketimleri(tuketim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid,bakiye_id uuid,yukleme_id uuid,gonderen_id uuid,akis text,kaynak_id uuid,alici_id uuid,islem_kimligi text UNIQUE,miktar integer DEFAULT 1,created_at timestamptz DEFAULT now(),alici_turu text);
 CREATE VIEW v_yayin_detay AS SELECT NULL::uuid yayin_id,NULL::uuid firma_id,NULL::text firma_adi,NULL::int talep_no,NULL::text urun_adi,NULL::text arac_turu WHERE false;
 CREATE FUNCTION cogniti_yukleme_ayrilan(uuid) RETURNS bigint LANGUAGE sql SET search_path=public AS $$SELECT coalesce((SELECT count(*) FROM eczanem_token_bloklari WHERE yukleme_id=$1 AND durum='blokeli' AND bitis_at>statement_timestamp()),0)+coalesce((SELECT sum(d.miktar) FROM cogniti_yayin_plan_token_dagilimi d JOIN cogniti_yayin_plan_tokenlari h USING(yayin_id) WHERE d.yukleme_id=$1 AND h.durum='ayrildi'),0)$$;`);
  await a.query(`CREATE SCHEMA cron; CREATE FUNCTION cron.schedule(text,text,text) RETURNS bigint LANGUAGE sql AS $$SELECT 1::bigint$$;`);
  for (const ad of ["cogniti_rol_kko_adim5","cogniti_abonelik_siparisi_kaydet","cogniti_abonelik_ilk_token_yukleme",
    "cogniti_abonelik_aylik_token_yukleme","cogniti_abonelik_ilk_donem_orani","cogniti_abonelik_devir_adim1",
    "cogniti_abonelik_paket_yonetimi"]) await a.query(oku(ad));
  const dinamikTarife = async () => (await a.query(
    "SELECT cogniti_fiyat_tarifesi_yonet($1,NULL,NULL,NULL) AS veri", [admin])).rows[0].veri;
  const paketleriKaydet = async (t,liste) => (await a.query(
    "SELECT cogniti_fiyat_tarifesi_yonet($1,$2,$3,$4) AS veri", [admin,t.degerler,t.surum,JSON.stringify(liste)])).rows[0].veri;
  const ilkDinamik = await dinamikTarife();
  assert.deepEqual(ilkDinamik.abonelik_paketleri.map(p=>p.id), [1,2,3,4]);
  const aboneOl = (paket, anahtar = randomUUID()) => a.query(`
    SELECT cogniti_abonelik_siparisi_kaydet($1,'kisisel',$2,$3,$4,$5,
      (statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date) AS veri`,
  [pm,paket.id,paket.token,Math.round(paket.aylik*100),anahtar]);
  const kayitliPaket = ilkDinamik.abonelik_paketleri[0];
  const anahtar = randomUUID();
  const eskiSiparis = (await aboneOl(kayitliPaket,anahtar)).rows[0].veri.siparis_id;
  const yeniListe = [...ilkDinamik.abonelik_paketleri.slice(1), {id:null,ad:"Yeni Paket",token:30000,birim:2.5}];
  const yeniTarife = await paketleriKaydet(ilkDinamik,yeniListe);
  assert.deepEqual(yeniTarife.abonelik_paketleri.map(p=>p.id), [2,3,4,5]);
  assert.deepEqual((await fiyatlar()).paketler,yeniTarife.abonelik_paketleri);
  await assert.rejects(aboneOl(kayitliPaket), /artık satışta değil/);
  assert.equal((await aboneOl(kayitliPaket,anahtar)).rows[0].veri.siparis_id,eskiSiparis);
  await assert.rejects(paketleriKaydet(ilkDinamik,[]), {code:"40001"});
  await assert.rejects(paketleriKaydet(yeniTarife,[kayitliPaket]), {code:"22023"});
  await aboneOl(yeniTarife.abonelik_paketleri.at(-1));
  await a.query(`UPDATE cogniti_esnek_paket_yuklemeleri SET created_at=created_at-interval '1 month',
    son_kullanim_at=son_kullanim_at-interval '1 month' WHERE abonelik_siparis_id=$1`,[eskiSiparis]);
  assert.equal((await a.query("SELECT cogniti_abonelik_aylik_token_yukle() AS adet")).rows[0].adet,1);
  const eskiAbonelik = (await a.query(`
    SELECT s.paket_adi,s.aylik_token,s.aylik_kurus,y.miktar
    FROM cogniti_abonelik_siparisleri s JOIN cogniti_esnek_paket_yuklemeleri y ON y.abonelik_siparis_id=s.siparis_id
    WHERE s.siparis_id=$1 ORDER BY y.created_at DESC LIMIT 1`,[eskiSiparis])).rows[0];
  assert.deepEqual(eskiAbonelik,{paket_adi:"Paket 1",aylik_token:5000,aylik_kurus:"2950000",miktar:5000});
  const bosTarife = await paketleriKaydet(yeniTarife,[]);
  assert.deepEqual((await fiyatlar()).paketler,[]);
  await a.query(oku("cogniti_abonelik_paket_yonetimi"));
  assert.equal((await dinamikTarife()).surum,bosTarife.surum);
  assert.deepEqual((await fiyatlar()).paketler,[]);
  console.log("Paket ekleme, kaldırma, yeni sipariş yasağı ve eski aboneliğin aynı koşullarla yenilenmesi geçti.");
} finally {
  await a.end().catch(() => {});
  if (started) pgctl("-m", "immediate", "-w", "stop");
  rmSync(root, { recursive: true, force: true });
}
