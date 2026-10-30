import assert from "node:assert/strict";
import test from "node:test";
import { TUM_ROLLER, ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { vivaFormDogrula, vivaIcRolMu, vivaTarihGirdisi, vivaYerelZamaniUtc, vivaDonusYolu } from "@/lib/viva/sozlesme";
import { vivaGirdi, vivaHash, vivaKodHash, vivaToken, vivaTokenGecerli } from "@/lib/viva/sunucu";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import * as crypto from "node:crypto";
import ts from "typescript";
import * as sozlesme from "@/lib/viva/sozlesme";
import * as eposta from "@/lib/viva/eposta";

const id = "00000000-0000-4000-8000-000000000001";
const form = { baslik: "Tanıtım", aciklama: "", egitim_turu: "medikal_egitim", urun_id: null, baslangic: "2027-01-01T21:30:00Z", bitis: "2027-01-01T22:00:00Z", durum: "planlandi", katilimcilar: [{ tur: "ic", id }] };
test("tüm iç roller Viva oluşturucu grubundadır; EClub ve müşteri değildir", () => {
  for (const rol of TUM_ROLLER) assert.equal(vivaIcRolMu(rol), true);
  for (const rol of [...ECLUB_TUKETICI_ROLLERI, "musteri", "bilinmeyen"]) assert.equal(vivaIcRolMu(rol), false);
});
test("Türkiye gece yarısındaki tarih tarayıcı saat diliminden bağımsızdır", () => {
  assert.equal(vivaYerelZamaniUtc("2027-01-02T00:30"), "2027-01-01T21:30:00.000Z");
  assert.equal(vivaTarihGirdisi("2027-01-01T21:30:00Z"), "2027-01-02T00:30");
});
test("olmayan günler reddedilir, artık yıl kabul edilir", () => {
  assert.throws(() => vivaYerelZamaniUtc("2027-02-29T12:00"));
  assert.throws(() => vivaYerelZamaniUtc("2027-13-01T12:00"));
  assert.equal(vivaYerelZamaniUtc("2028-02-29T12:00"), "2028-02-29T09:00:00.000Z");
});
test("form zorunlu başlık, tarih ve katılımcı kimliklerini doğrular", () => {
  assert.equal(vivaFormDogrula(form, 0), null);
  for (const ek of [{ baslik: " " }, { bitis: form.baslangic }, { katilimcilar: [{ tur: "ic", id: "hata" }] }, { katilimcilar: [...form.katilimcilar, ...form.katilimcilar] }]) assert.ok(vivaFormDogrula({ ...form, ...ek }, 0));
});
test("geçmişe planlama ve istemciden canlı durumuna geçiş reddedilir", () => {
  assert.ok(vivaFormDogrula(form, Date.parse(form.baslangic)));
  assert.ok(vivaFormDogrula({ ...form, durum: "canli" }, 0));
  assert.equal(vivaFormDogrula({ ...form, durum: "taslak" }, Date.parse(form.bitis) + 1), null);
});
test("giriş dönüşü yalnız Viva iç adreslerini kabul eder", () => {
  assert.equal(vivaDonusYolu(`?viva=${encodeURIComponent(`/viva/${id}/oda`)}`), `/viva/${id}/oda`);
  for (const url of ["https://example.test", "//example.test", "/admin", "/viva/../../admin", "/viva/davet/token"]) assert.equal(vivaDonusYolu(`?viva=${encodeURIComponent(url)}`), null);
});
test("mutasyon başka origin, büyük gövde ve bozuk JSON kabul etmez", async () => {
  await assert.rejects(vivaGirdi(new Request("https://cogniti.test/viva/api", { method: "POST", headers: { origin: "https://other.test", "content-type": "application/json" }, body: "{}" })), /doğrulanamadı/);
  for (const body of ["{", "[]", "null"]) await assert.rejects(vivaGirdi(new Request("https://cogniti.test/viva/api", { method: "POST", headers: { "content-type": "application/json" }, body })));
  await assert.rejects(vivaGirdi(new Request("https://cogniti.test/viva/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "a".repeat(66_000) }) })), /büyük/);
  assert.deepEqual(await vivaGirdi(new Request("https://cogniti.test/viva/api", { method: "POST", headers: { origin: "https://cogniti.test", "content-type": "application/json" }, body: '{"islem":"iptal"}' })), { islem: "iptal" });
});
test("davetler yüksek entropili; kod özeti davet ve sunucu anahtarına bağlıdır", () => {
  const tokens = new Set(Array.from({ length: 100 }, vivaToken));
  assert.equal(tokens.size, 100);
  for (const token of tokens) assert.equal(vivaTokenGecerli(token), true);
  assert.equal(vivaTokenGecerli("hata"), false);
  const onceki = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "yalniz-test-anahtari";
  try {
    assert.equal(vivaKodHash("davet-a", "123456").length, 64);
    assert.notEqual(vivaKodHash("davet-a", "123456"), vivaKodHash("davet-b", "123456"));
    assert.notEqual(vivaHash("123456"), vivaKodHash("davet-a", "123456"));
  } finally { if (onceki === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = onceki; }
});

// E-posta taşıma katmanı tamamen sahte bağımlılıklarla sınanır; DB/ağ erişimi yok.
function epostaOrtami(basarili: boolean, ayarVar = true) {
  const islemler: string[] = [], epostalar: Record<string, unknown>[] = [];
  const exports: Record<string, unknown> = {};
  const modules: Record<string, unknown> = {
    "node:crypto": crypto, "next/server": { NextResponse: {} },
    "@/lib/supabase/server": { createClient: () => { throw new Error("Auth çağrısı beklenmiyor."); }, createAdminClient: () => ({ rpc: async (_name: string, v: { p_islem: string }) => {
      islemler.push(v.p_islem);
      return { data: v.p_islem === "kod_ayir" ? { eposta: "davetli@example.test", ad: "Davetli", baslik: "Viva", davet_id: id } : {}, error: null };
    } }) },
    "@/lib/utils/rolCozucu": {}, "@/lib/utils/roller": {}, "./sozlesme": sozlesme, "./eposta": eposta,
  };
  const code = ts.transpileModule(readFileSync("lib/viva/sunucu.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: (name: string) => { assert.ok(name in modules, name); return modules[name]; },
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: "yalniz-test", ...(ayarVar ? { RESEND_API_KEY: "sahte", ECLUB_DAVET_EMAIL_FROM: "viva@example.test" } : {}) } },
    AbortSignal, fetch: async (_url: string, init: RequestInit) => { epostalar.push(JSON.parse(String(init.body))); return { ok: basarili, json: async () => ({ id: "sahte-gonderim" }) }; },
  });
  return { islemler, epostalar, gonder: exports.vivaKodGonder as (token: string) => Promise<{ mesaj: string }> };
}
test("kod yalnız davetin kayıtlı adresine gönderilir; cevap kodu açığa çıkarmaz", async () => {
  const o = epostaOrtami(true);
  const sonuc = await o.gonder(vivaToken());
  assert.deepEqual(o.islemler, ["kod_ayir"]);
  assert.deepEqual(o.epostalar[0].to, ["davetli@example.test"]);
  assert.match(String(o.epostalar[0].text), /\b\d{6}\b/);
  assert.equal(/\b\d{6}\b/.test(JSON.stringify(sonuc)), false);
});
test("başarısız e-posta gönderimi ayrılan doğrulama kodunu geçersizleştirir", async () => {
  const o = epostaOrtami(false);
  await assert.rejects(o.gonder(vivaToken()), /Kod gönderilemedi/);
  assert.deepEqual(o.islemler, ["kod_ayir", "kod_iptal"]);
});
test("eksik e-posta ayarında DB veya gönderim çağrısı yapılmaz", async () => {
  const o = epostaOrtami(true, false);
  await assert.rejects(o.gonder(vivaToken()), /gönderilemiyor/);
  assert.equal(o.islemler.length, 0); assert.equal(o.epostalar.length, 0);
});
