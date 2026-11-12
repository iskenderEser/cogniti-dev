import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { satinAlmaBakiyeOzetiGecerli, yayinTokenHesabiVar } from "@/lib/satinAlma/bakiyeOzeti";

const bos = { paket: null, toplam: 0, kullanilan: 0, kalan: 0, suresi_dolan: 0, ayrilan: 0 };
const esnek = { ...bos, paket: "esnek", toplam: 2500, kalan: 2500 };
const abonelik = { ...bos, paket: "abonelik", toplam: 5000, kalan: 5000 };
test("yeni yayın kişisel veya firma hesabıyla ve etkin KKÖ ile açılabilir", () => {
  for (const hesap of [esnek, abonelik, { ...bos, paket: "kko", toplam: 1500, kalan: 1500 }]) {
    for (const veri of [{ kisisel: hesap, firma_ortak: bos }, { kisisel: null, firma_ortak: hesap }]) {
      assert.ok(satinAlmaBakiyeOzetiGecerli(veri));
      assert.equal(yayinTokenHesabiVar(veri), true);
    }
  }
  assert.equal(yayinTokenHesabiVar({ kisisel: null, firma_ortak: bos }), false);
  // Hesabın bulunması ile gönderim sırasında yeterli token bulunması ayrı kontrollerdir.
  const kullanilmis = { ...esnek, kalan: 0, kullanilan: 2500 };
  assert.ok(satinAlmaBakiyeOzetiGecerli({ kisisel: kullanilmis, firma_ortak: bos }));
  assert.equal(yayinTokenHesabiVar({ kisisel: kullanilmis, firma_ortak: bos }), true);
});
test("kayıt kontrolü oturum kimliğini kullanır, hesapsız istek reddedilir ve okuma hatası hesabın yokluğu sayılmaz", async () => {
  const exports: { yeniYayinHesapKontrolu?: (db: unknown, id: string) => Promise<Response | null> } = {};
  vm.runInNewContext(ts.transpileModule(readFileSync("lib/satinAlma/yayinHesapKontrolu.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Response, require: (ad: string) => {
    assert.equal(ad, "./bakiyeOzeti");
    return { satinAlmaBakiyeOzetiGecerli, yayinTokenHesabiVar };
  } });
  let data: unknown = { kisisel: null, firma_ortak: bos };
  let error: unknown = null;
  const db = { rpc: async (name: string, args: unknown) => {
    assert.equal(name, "cogniti_satin_alma_bakiye_ozeti");
    assert.deepEqual(JSON.parse(JSON.stringify(args)), { p_auth_id: "oturum-kimligi" });
    return { data, error };
  } };
  const kontrol = () => exports.yeniYayinHesapKontrolu!(db, "oturum-kimligi");
  assert.equal((await kontrol())?.status, 403);
  data = { kisisel: null, firma_ortak: abonelik };
  assert.equal(await kontrol(), null);
  error = { code: "PGRST202" };
  assert.equal((await kontrol())?.status, 503);
  error = null; data = {};
  assert.equal((await kontrol())?.status, 503);
});
