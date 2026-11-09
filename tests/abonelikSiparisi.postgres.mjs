import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";

const bin = process.argv[2];
const root = mkdtempSync("/tmp/cogniti-abonelik-");
const data = join(root, "data");
const pgctl = (...args) => execFileSync(join(bin, "pg_ctl"), ["-D", data, ...args], { stdio: "pipe" });
const config = { host: root, port: 55471, user: "abonelik_test", database: "postgres", statement_timeout: 5000 };
const a = new pg.Client(config);
const b = new pg.Client(config);
let started = false;

try {
  execFileSync(join(bin, "initdb"), ["-D", data, "-U", config.user, "-A", "trust", "--no-locale"], { stdio: "pipe" });
  pgctl("-l", join(root, "postgres.log"), "-o", `-k ${root} -h '' -p ${config.port}`, "-w", "start");
  started = true;
  await a.connect();
  await b.connect();
  assert.equal((await a.query("SELECT inet_server_addr() AS adres")).rows[0].adres, null);
  await a.query(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE firmalar (firma_id uuid PRIMARY KEY, aktif boolean, firma_admin_aktif boolean);
    CREATE TABLE kullanicilar (kullanici_id uuid PRIMARY KEY, firma_id uuid REFERENCES firmalar, rol text, aktif_mi boolean, ad text, soyad text);
    CREATE TABLE cogniti_fiyat_tarifesi (tekil boolean PRIMARY KEY, degerler jsonb, surum integer);
    INSERT INTO cogniti_fiyat_tarifesi VALUES (true, '{
      "paket_10k_token_miktari":5000,"paket_10k_token_tl":5.90,
      "paket_30k_token_miktari":10000,"paket_30k_token_tl":4.85,
      "paket_75k_token_miktari":15000,"paket_75k_token_tl":3.90,
      "paket_25k_token_miktari":25000,"paket_25k_token_tl":2.90
    }', 1);
  `);
  const firma = randomUUID();
  await a.query("INSERT INTO firmalar VALUES ($1,true,true)", [firma]);
  const kullanicilar = new Map();
  const ureticiler = "pm jr_pm kd_pm med_md egt_md egt_yrd_md egt_yon egt_uz ik_drk ik_md ik_yrd_md ik_uz ik_per".split(" ");
  const yoneticiler = "gm gm_yrd drk paz_md blm_md grp_pm sm firma_admin".split(" ");
  const kapali = "tm admin bm utt kd_utt iu partner eczaci musteri".split(" ");
  for (const rol of [...ureticiler, ...yoneticiler, ...kapali]) {
    const id = randomUUID();
    kullanicilar.set(rol, id);
    await a.query("INSERT INTO kullanicilar(kullanici_id,firma_id,rol,aktif_mi) VALUES ($1,$2,$3,true)", [id, firma, rol]);
  }
  const sql = readFileSync("scripts/sql/cogniti_abonelik_siparisi_kaydet.sql", "utf8");
  await a.query(sql);
  await a.query(sql);
  await a.query(`CREATE TABLE eczanem_yayin_token_hesaplari(yayin_id uuid,firma_id uuid,pm_id uuid,bakiye_id uuid);
 CREATE TABLE eczanem_token_bloklari(blok_id uuid,yukleme_id uuid,durum text,bitis_at timestamptz,bakiye_id uuid,firma_id uuid,yayin_id uuid,tuketildi_at timestamptz);
 CREATE TABLE cogniti_yayin_plan_tokenlari(yayin_id uuid,durum text);
 CREATE TABLE cogniti_yayin_plan_token_dagilimi(yayin_id uuid,yukleme_id uuid,miktar integer);
 CREATE TABLE yayin_yonetimi(yayin_id uuid PRIMARY KEY,uretici_id uuid,token_hesap_turu text,hedef_roller text[]);
 CREATE TABLE cogniti_esnek_gonderim_tuketimleri(tuketim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid,bakiye_id uuid,yukleme_id uuid,gonderen_id uuid,akis text,kaynak_id uuid,alici_id uuid,islem_kimligi text UNIQUE,miktar integer DEFAULT 1,created_at timestamptz DEFAULT now(),alici_turu text);
 CREATE VIEW v_yayin_detay AS SELECT NULL::uuid yayin_id,NULL::uuid firma_id,NULL::text firma_adi,NULL::int talep_no,NULL::text urun_adi,NULL::text arac_turu WHERE false;
 CREATE FUNCTION cogniti_yukleme_ayrilan(uuid) RETURNS bigint LANGUAGE sql SET search_path=public AS $$SELECT coalesce((SELECT count(*) FROM eczanem_token_bloklari WHERE yukleme_id=$1 AND durum='blokeli' AND bitis_at>statement_timestamp()),0)+coalesce((SELECT sum(d.miktar) FROM cogniti_yayin_plan_token_dagilimi d JOIN cogniti_yayin_plan_tokenlari h USING(yayin_id) WHERE d.yukleme_id=$1 AND h.durum='ayrildi'),0)$$;`);
  await a.query(readFileSync("scripts/sql/cogniti_esnek_paket_siparis_adim1.sql", "utf8"));
  await a.query(readFileSync("scripts/sql/cogniti_rol_kko_adim5.sql", "utf8"));
  const yuklemeSql = readFileSync("scripts/sql/cogniti_abonelik_ilk_token_yukleme.sql", "utf8");
  await a.query(yuklemeSql);
  await a.query(yuklemeSql);
  const siparis = async (rol, hesap, { db = a, paket = 1, token = 5000, kurus = 2950000, anahtar = randomUUID() } = {}) =>
    (await db.query("SELECT cogniti_abonelik_siparisi_kaydet($1,$2,$3,$4,$5,$6) AS sonuc",
      [kullanicilar.get(rol), hesap, paket, token, kurus, anahtar])).rows[0].sonuc.siparis_id;

  for (const rol of [...ureticiler, ...yoneticiler]) {
    const hesap = ureticiler.includes(rol) ? "kisisel" : "firma_ortak";
    const id = await siparis(rol, hesap);
    const { rows: [kayit] } = await a.query("SELECT * FROM cogniti_abonelik_siparisleri WHERE siparis_id=$1", [id]);
    assert.equal(kayit.firma_id, firma);
    assert.equal(kayit.sahip_id, hesap === "kisisel" ? kullanicilar.get(rol) : null);
    assert.equal(kayit.kdv_kurus, "590000");
    const { rows: [yukleme] } = await a.query(`
      SELECT y.kalan, b.bakiye_turu, b.sahip_id
      FROM cogniti_esnek_paket_yuklemeleri y JOIN cogniti_satin_alma_bakiyeleri b USING (bakiye_id)
      WHERE y.abonelik_siparis_id=$1`, [id]);
    assert.equal(yukleme.kalan, 5000);
    assert.equal(yukleme.bakiye_turu, hesap);
    assert.equal(yukleme.sahip_id, kayit.sahip_id);
    await assert.rejects(siparis(rol, hesap === "kisisel" ? "firma_ortak" : "kisisel"), { code: "42501" });
  }
  for (const rol of kapali) await assert.rejects(siparis(rol, "firma_ortak"), { code: "42501" });
  await a.query("UPDATE firmalar SET firma_admin_aktif=false");
  await assert.rejects(siparis("firma_admin", "firma_ortak"), { code: "42501" });
  await a.query("UPDATE kullanicilar SET aktif_mi=false WHERE rol='pm'");
  await assert.rejects(siparis("pm", "kisisel"), { code: "42501" });
  await a.query("UPDATE kullanicilar SET aktif_mi=true WHERE rol='pm'");
  await a.query("UPDATE firmalar SET aktif=false");
  await assert.rejects(siparis("pm", "kisisel"), { code: "42501" });
  await a.query("UPDATE firmalar SET aktif=true");
  console.log("Rol, hesap sahipliği ve aktiflik kontrolleri geçti.");

  for (const [paket, token, kurus] of [[2, 10000, 4850000], [3, 15000, 5850000], [4, 25000, 7250000]]) {
    await siparis("pm", "kisisel", { paket, token, kurus });
  }
  await assert.rejects(siparis("pm", "kisisel", { kurus: 1 }), { code: "P0001" });
  const anahtar = randomUUID();
  const [ilk, tekrar] = await Promise.all([
    siparis("pm", "kisisel", { anahtar }),
    siparis("pm", "kisisel", { anahtar, db: b }),
  ]);
  assert.equal(ilk, tekrar);
  assert.equal((await a.query("SELECT count(*)::int AS adet FROM cogniti_abonelik_siparisleri WHERE islem_anahtari=$1", [anahtar])).rows[0].adet, 1);
  await a.query("UPDATE cogniti_fiyat_tarifesi SET degerler=jsonb_set(degerler,'{paket_10k_token_tl}','6'),surum=2");
  assert.equal(await siparis("pm", "kisisel", { anahtar }), ilk);
  await assert.rejects(siparis("pm", "kisisel"), { code: "P0001" });
  await assert.rejects(siparis("pm", "kisisel", { anahtar, kurus: 3000000 }), { code: "22023" });
  assert.equal((await a.query("SELECT count(*)::int AS adet FROM cogniti_esnek_paket_yuklemeleri WHERE abonelik_siparis_id=$1", [ilk])).rows[0].adet, 1);
  const { rows: [ozet] } = await a.query("SELECT cogniti_satin_alma_bakiye_ozeti($1) AS veri", [kullanicilar.get("pm")]);
  assert.equal(ozet.veri.kisisel.paket, "abonelik");
  assert.equal(ozet.veri.kisisel.kalan, 60000);
  const yayin = randomUUID();
  await a.query("INSERT INTO yayin_yonetimi VALUES ($1,$2,'kisisel',ARRAY['utt'])", [yayin, kullanicilar.get("pm")]);
  await a.query("SELECT cogniti_esnek_gonderim_tuket($1,'kisisel','yayin_acilis',$2,$3,$4)", [kullanicilar.get("pm"), yayin, randomUUID(), randomUUID()]);
  assert.equal((await a.query("SELECT cogniti_satin_alma_bakiye_ozeti($1) AS veri", [kullanicilar.get("pm")])).rows[0].veri.kisisel.kalan, 59999);
  const hataliAnahtar = randomUUID();
  await a.query(`CREATE FUNCTION test_yukleme_hatasi() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'Test yükleme hatası'; END$$;
    CREATE TRIGGER test_yukleme_hatasi BEFORE INSERT ON cogniti_esnek_paket_yuklemeleri FOR EACH ROW EXECUTE FUNCTION test_yukleme_hatasi();`);
  await assert.rejects(siparis("pm", "kisisel", { anahtar: hataliAnahtar, kurus: 3000000 }), /Test yükleme hatası/);
  assert.equal((await a.query("SELECT count(*)::int AS adet FROM cogniti_abonelik_siparisleri WHERE islem_anahtari=$1", [hataliAnahtar])).rows[0].adet, 0);
  await a.query("DROP TRIGGER test_yukleme_hatasi ON cogniti_esnek_paket_yuklemeleri");
  console.log("İlk yükleme, bakiye, gerçek tüketim ve işlem geri alma kontrolleri geçti.");
  console.log("Dört paket, tarife değişikliği, fiyat kaydı ve iki bağlantıyla tekrar kontrolü geçti.");

  await a.query("SET ROLE authenticated");
  await assert.rejects(siparis("pm", "kisisel"), { code: "42501" });
  await a.query("RESET ROLE");
  await a.query("SET ROLE service_role");
  await assert.rejects(a.query("SELECT * FROM cogniti_abonelik_siparisleri"), { code: "42501" });
  await siparis("pm", "kisisel", { kurus: 3000000 });
  console.log("Veritabanı erişim sınırları geçti.");
  await a.query("RESET ROLE");
  await a.query(`CREATE SCHEMA IF NOT EXISTS cron;
    CREATE TABLE cron.test_isler (ad text PRIMARY KEY, zaman text, komut text);
    CREATE OR REPLACE FUNCTION cron.schedule(text,text,text) RETURNS bigint LANGUAGE sql AS $$
      INSERT INTO cron.test_isler VALUES ($1,$2,$3) ON CONFLICT (ad) DO UPDATE SET komut=EXCLUDED.komut RETURNING 1::bigint
    $$;`);
  const aylikSql = readFileSync("scripts/sql/cogniti_abonelik_aylik_token_yukleme.sql", "utf8");
  await a.query(aylikSql);
  await a.query(aylikSql);
  assert.equal((await a.query("SELECT count(*)::int AS adet FROM cron.test_isler WHERE ad='cogniti_abonelik_aylik_token'")).rows[0].adet, 1);
  const ilkYukleme = await siparis("pm", "kisisel", { kurus: 3000000 });
  await a.query(`
    UPDATE cogniti_esnek_paket_yuklemeleri
    SET created_at=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul' - interval '15 days',
        son_kullanim_at=date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul',
        kalan=3500
    WHERE abonelik_siparis_id=$1`, [ilkYukleme]);
  const yenile = async db => (await db.query("SELECT cogniti_abonelik_aylik_token_yukle() AS adet")).rows[0].adet;
  assert.equal((await Promise.all([yenile(a), yenile(b)])).reduce((x,y) => x+y,0), 1);
  assert.equal(await yenile(a), 0);
  const { rows: aylar } = await a.query(`
    SELECT kalan, son_kullanim_at>statement_timestamp() AS gecerli
    FROM cogniti_esnek_paket_yuklemeleri WHERE abonelik_siparis_id=$1 ORDER BY created_at
  `, [ilkYukleme]);
  assert.deepEqual(aylar, [{ kalan: 3500, gecerli: false }, { kalan: 5000, gecerli: true }]);
  console.log("Aylık yükleme, iki bağlantıyla tekrar, ay sonu sınırı ve cron kaydı geçti.");
  const devirSql = readFileSync("scripts/sql/cogniti_abonelik_devir_adim1.sql", "utf8");
  await a.query(devirSql);
  await a.query(devirSql);
  const ayFarki = async id => (await a.query(`
    SELECT EXTRACT(YEAR FROM age(son_kullanim_at AT TIME ZONE 'Europe/Istanbul',
             date_trunc('month', created_at AT TIME ZONE 'Europe/Istanbul')))::int * 12
         + EXTRACT(MONTH FROM age(son_kullanim_at AT TIME ZONE 'Europe/Istanbul',
             date_trunc('month', created_at AT TIME ZONE 'Europe/Istanbul')))::int AS ay
    FROM cogniti_esnek_paket_yuklemeleri WHERE abonelik_siparis_id=$1 ORDER BY created_at
  `, [id])).rows.map(row => row.ay);
  assert.deepEqual(await ayFarki(ilkYukleme), [1, 1]);
  const devirSiparisi = await siparis("pm", "kisisel", { kurus: 3000000 });
  assert.deepEqual(await ayFarki(devirSiparisi), [2]);
  await a.query(`
    UPDATE cogniti_esnek_paket_yuklemeleri
    SET created_at=created_at-interval '1 month',son_kullanim_at=son_kullanim_at-interval '1 month'
    WHERE abonelik_siparis_id=$1`, [devirSiparisi]);
  assert.equal(await yenile(a), 1);
  assert.deepEqual(await ayFarki(devirSiparisi), [2, 2]);
  console.log("İlk ve aylık yeni yüklemelerde takip eden ay sonu; mevcut tarihler korunuyor.");
  const oranSql = readFileSync("scripts/sql/cogniti_abonelik_ilk_donem_orani.sql", "utf8");
  await a.query(oranSql);
  await a.query(oranSql);
  const { rows: [takvim] } = await a.query(`
    SELECT to_char(statement_timestamp() AT TIME ZONE 'Europe/Istanbul','YYYY-MM-DD') AS bugun,
           to_char((statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::date-1,'YYYY-MM-DD') AS dun`);
  const [yil, ay, gun] = takvim.bugun.split("-").map(Number);
  const kalanGun = Math.min(30, new Date(Date.UTC(yil, ay, 0)).getUTCDate() - gun + 1);
  const oranliSiparis = async (baslangic, anahtar, db = a) => (await db.query(
    "SELECT cogniti_abonelik_siparisi_kaydet($1,'kisisel',1,5000,3000000,$2,$3) AS veri",
    [kullanicilar.get("pm"), anahtar, baslangic])).rows[0].veri.siparis_id;
  const oranAnahtari = randomUUID();
  await assert.rejects(oranliSiparis(takvim.dun, oranAnahtari), { code: "P0001" });
  const [oranSiparisId, ayniSiparis] = await Promise.all([
    oranliSiparis(takvim.bugun, oranAnahtari), oranliSiparis(takvim.bugun, oranAnahtari, b),
  ]);
  assert.equal(oranSiparisId, ayniSiparis);
  const { rows: [oranli] } = await a.query(`
    SELECT s.aylik_token, s.aylik_kurus, s.ilk_donem_gun, s.ilk_donem_token, s.ilk_donem_kurus, s.ilk_donem_kdv_kurus, y.miktar
    FROM cogniti_abonelik_siparisleri s
    JOIN cogniti_esnek_paket_yuklemeleri y ON y.abonelik_siparis_id=s.siparis_id
    WHERE s.siparis_id=$1`, [oranSiparisId]);
  assert.deepEqual(oranli, {
    aylik_token: 5000, aylik_kurus: "3000000", ilk_donem_gun: kalanGun,
    ilk_donem_token: Math.round(5000 * kalanGun / 30), ilk_donem_kurus: String(100000 * kalanGun),
    ilk_donem_kdv_kurus: String(20000 * kalanGun), miktar: Math.round(5000 * kalanGun / 30),
  });
  await a.query(`UPDATE cogniti_esnek_paket_yuklemeleri SET created_at=created_at-interval '1 month',
    son_kullanim_at=son_kullanim_at-interval '1 month' WHERE abonelik_siparis_id=$1`, [oranSiparisId]);
  assert.equal(await yenile(a), 1);
  assert.equal((await a.query(`SELECT miktar FROM cogniti_esnek_paket_yuklemeleri
    WHERE abonelik_siparis_id=$1 ORDER BY created_at DESC LIMIT 1`, [oranSiparisId])).rows[0].miktar, 5000);
  console.log("İlk dönem oranı, eski tarih reddi, tekrarlanan onay ve sonraki ay tam yükleme geçti.");

  const devirUreticisi = randomUUID();
  await a.query("INSERT INTO kullanicilar(kullanici_id,firma_id,rol,aktif_mi) VALUES ($1,$2,'pm',true)", [devirUreticisi, firma]);
  const { rows: [devirOnayi] } = await a.query(
    "SELECT cogniti_abonelik_siparisi_kaydet($1,'kisisel',1,5000,3000000,$2,$3) AS veri",
    [devirUreticisi, randomUUID(), takvim.bugun],
  );
  await a.query(`
    UPDATE cogniti_esnek_paket_yuklemeleri
    SET created_at=created_at-interval '1 month',
        son_kullanim_at=son_kullanim_at-interval '1 month',
        kalan=100
    WHERE abonelik_siparis_id=$1`, [devirOnayi.veri.siparis_id]);
  const kullanilabilir = async () => (await a.query(
    "SELECT cogniti_satin_alma_bakiye_ozeti($1) AS veri", [devirUreticisi],
  )).rows[0].veri.kisisel.kalan;
  assert.equal(await kullanilabilir(), 100);
  assert.equal(await yenile(a), 1);
  assert.equal(await kullanilabilir(), 5100);
  assert.equal(await yenile(a), 0);
  assert.equal(await kullanilabilir(), 5100);
  const { rows: devirYuklemeleri } = await a.query(`
    SELECT kalan FROM cogniti_esnek_paket_yuklemeleri
    WHERE abonelik_siparis_id=$1 ORDER BY created_at`, [devirOnayi.veri.siparis_id]);
  assert.deepEqual(devirYuklemeleri, [{ kalan: 100 }, { kalan: 5000 }]);
  console.log("Devreden 100 token ve yeni 5.000 token kullanılabilir bakiyede 5.100 olarak görünüyor.");

  const devirYayini = randomUUID();
  await a.query("INSERT INTO yayin_yonetimi VALUES ($1,$2,'kisisel',ARRAY['utt'])", [devirYayini, devirUreticisi]);
  const devirAlıcısı = randomUUID();
  const tuket = () => a.query(
    "SELECT cogniti_esnek_gonderim_tuket($1,'kisisel','yayin_acilis',$2,$3,$4)",
    [devirUreticisi, devirYayini, devirAlıcısı, devirYayini],
  );
  await tuket();
  await tuket();
  const { rows: tuketimSonrasi } = await a.query(`
    SELECT kalan FROM cogniti_esnek_paket_yuklemeleri
    WHERE abonelik_siparis_id=$1 ORDER BY created_at`, [devirOnayi.veri.siparis_id]);
  assert.deepEqual(tuketimSonrasi, [{ kalan: 99 }, { kalan: 5000 }]);
  assert.equal(await kullanilabilir(), 5099);
  console.log("İlk tüketim devreden yüklemeden düştü; yeni yükleme ve aynı işlemin tekrarında bakiye korundu.");

  const ozetOku = async () => (await a.query(
    "SELECT cogniti_satin_alma_bakiye_ozeti($1) AS veri", [devirUreticisi],
  )).rows[0].veri.kisisel;
  const oncekiOzet = await ozetOku();
  await a.query(`
    UPDATE cogniti_esnek_paket_yuklemeleri
    SET son_kullanim_at=statement_timestamp()
    WHERE yukleme_id=(
      SELECT yukleme_id FROM cogniti_esnek_paket_yuklemeleri
      WHERE abonelik_siparis_id=$1 ORDER BY created_at LIMIT 1
    )`, [devirOnayi.veri.siparis_id]);
  const sonrakiOzet = await ozetOku();
  assert.equal(sonrakiOzet.kalan, 5000);
  assert.equal(sonrakiOzet.suresi_dolan, oncekiOzet.suresi_dolan + 99);
  assert.equal(sonrakiOzet.kullanilan, oncekiOzet.kullanilan);
  console.log("Süresi dolan 99 token kullanılabilir bakiyeden çıktı ve tüketim sayılmadı.");

  // Test saatini değiştirmek yerine iki yüklemeyi bir ay önceye taşı.
  // Böylece cari ay, siparişin üçüncü ayını temsil eder.
  for (const gecerli of [false, true]) {
    await a.query(`
      WITH ay AS (
        SELECT date_trunc('month',statement_timestamp() AT TIME ZONE 'Europe/Istanbul') AS baslangic
      )
      UPDATE cogniti_esnek_paket_yuklemeleri y
      SET created_at=(ay.baslangic - CASE WHEN $2 THEN interval '1 month' ELSE interval '2 months' END)
            AT TIME ZONE 'Europe/Istanbul',
          son_kullanim_at=(ay.baslangic + CASE WHEN $2 THEN interval '1 month' ELSE interval '0' END)
            AT TIME ZONE 'Europe/Istanbul'
      FROM ay WHERE y.abonelik_siparis_id=$1 AND (y.son_kullanim_at>statement_timestamp())=$2`,
    [devirOnayi.veri.siparis_id, gecerli]);
  }
  assert.equal(await yenile(a), 1);
  assert.equal(await yenile(a), 0);
  const ucuncuAyOzeti = await ozetOku();
  assert.equal(ucuncuAyOzeti.kalan, 10000);
  assert.equal(ucuncuAyOzeti.suresi_dolan, 99);
  assert.equal(ucuncuAyOzeti.kullanilan, oncekiOzet.kullanilan);

  await a.query("SELECT cogniti_esnek_gonderim_tuket($1,'kisisel','yayin_acilis',$2,$3,$4)",
    [devirUreticisi, devirYayini, randomUUID(), randomUUID()]);
  const { rows: ucAy } = await a.query(`
    SELECT kalan FROM cogniti_esnek_paket_yuklemeleri
    WHERE abonelik_siparis_id=$1 ORDER BY created_at`, [devirOnayi.veri.siparis_id]);
  assert.deepEqual(ucAy, [{ kalan: 99 }, { kalan: 4999 }, { kalan: 5000 }]);
  assert.equal(await kullanilabilir(), 9999);
  console.log("Üç aylık senaryo geçti: ilk aydan kalan 99 token üçüncü ayda kullanılamadı, tüketim ikinci ayın devrinden düştü.");

} finally {
  await Promise.allSettled([a.end(), b.end()]);
  if (started) pgctl("-m", "immediate", "-w", "stop");
  rmSync(root, { recursive: true, force: true });
}
