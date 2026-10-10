// Yalnız yerel PostgreSQL doğrulaması; canlı veritabanına bağlanmaz.
// ECLUB_SQL_TEST_RUNTIME=/.../pglite/dist/index.js node scripts/denetim/eclub-banner-dogrula.mjs
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
if (!process.env.ECLUB_SQL_TEST_RUNTIME) throw new Error('PGlite modülünün yolu gerekli.');
const { PGlite } = await import(pathToFileURL(process.env.ECLUB_SQL_TEST_RUNTIME).href);
const db = new PGlite();
try {
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE TABLE firmalar(firma_id uuid PRIMARY KEY, firma_adi text);');
  const sql = await readFile(new URL('../sql/eclub_firma_bannerlari.sql', import.meta.url), 'utf8');
  await db.exec(sql);
  await db.exec(sql);
  const a = '00000000-0000-4000-8000-000000000001';
  const b = '00000000-0000-4000-8000-000000000002';
  const h = '00000000-0000-4000-8000-000000000003';
  await db.query("INSERT INTO firmalar VALUES ($1,'Firma A'), ($2,'Firma B'), ($3,'Hapbilgi')", [a, b, h]);
  for (const firma of [a, b]) for (const sira of [1, 2, 3]) {
    await db.query('INSERT INTO eclub_firma_bannerlari(firma_id,sira,dosya_yolu) VALUES ($1,$2,$3)', [firma, sira, `eclub-bannerlar/${firma}/${sira}.png`]);
  }
  assert.equal((await db.query('SELECT * FROM eclub_firma_bannerlari WHERE firma_id=$1', [a])).rows.length, 3);
  await assert.rejects(db.query('INSERT INTO eclub_firma_bannerlari(firma_id,sira,dosya_yolu) VALUES ($1,4,$2)', [a, `eclub-bannerlar/${a}/4.png`]));
  await assert.rejects(db.query('UPDATE eclub_firma_bannerlari SET dosya_yolu=$1 WHERE firma_id=$2 AND sira=1', [`eclub-bannerlar/${b}/baska.png`, a]));
  for (const sira of [1, 2, 3, 4, 5]) {
    await db.query('INSERT INTO eclub_firma_bannerlari(firma_id,sira,dosya_yolu) VALUES ($1,$2,$3)', [h, sira, `eclub-bannerlar/${h}/${sira}.png`]);
  }
  await assert.rejects(db.query('INSERT INTO eclub_firma_bannerlari(firma_id,sira,dosya_yolu) VALUES ($1,6,$2)', [h, `eclub-bannerlar/${h}/6.png`]));
  // Önceki üç alan sınırının bulunduğu kurulumdan güncelleme ve kayıtların korunması.
  await db.query('DELETE FROM eclub_firma_bannerlari WHERE firma_id=$1 AND sira>3', [h]);
  await db.exec('ALTER TABLE eclub_firma_bannerlari DROP CONSTRAINT eclub_firma_bannerlari_sira_check; ALTER TABLE eclub_firma_bannerlari ADD CONSTRAINT eclub_firma_bannerlari_sira_check CHECK(sira BETWEEN 1 AND 3);');
  await db.exec(sql);
  assert.equal((await db.query('SELECT * FROM eclub_firma_bannerlari')).rows.length, 9);
  await db.query('INSERT INTO eclub_firma_bannerlari(firma_id,sira,dosya_yolu) VALUES ($1,5,$2)', [h, `eclub-bannerlar/${h}/5.png`]);
  for (const rol of ['anon', 'authenticated']) {
    await db.exec(`SET ROLE ${rol}`);
    await assert.rejects(db.query('SELECT * FROM eclub_firma_bannerlari'));
    await assert.rejects(db.query('DELETE FROM eclub_firma_bannerlari'));
    await db.exec('RESET ROLE');
  }
  await db.query('DELETE FROM firmalar WHERE firma_id=$1', [a]);
  assert.equal((await db.query('SELECT * FROM eclub_firma_bannerlari')).rows.length, 7);
  console.log('Banner SQL: kurulum, güncelleme, kayıt koruma, Hapbilgi beş/diğerleri üç alan, firma ayrımı ve erişim kontrolleri geçti.');
} finally { await db.close(); }
