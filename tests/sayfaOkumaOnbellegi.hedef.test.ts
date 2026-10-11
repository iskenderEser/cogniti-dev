import test from "node:test";
import assert from "node:assert/strict";
import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";

test("kullanıcı/kapsam ve sayfa ayrımı, oturumdan okuma, süre sonu ve bozuk kayıt", async (t) => {
  const onceki = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  } });
  t.after(() => {
    if (onceki) Object.defineProperty(globalThis, "sessionStorage", onceki);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  });
  let now = 100000;
  t.mock.method(Date, "now", () => now);
  const cache = sayfaOkumaOnbellegiOlustur<string[]>("test");
  await cache.iste("user-a:firma-1", async () => ["a"]);
  assert.deepEqual(cache.oku("user-a:firma-1"), ["a"]);
  assert.equal(cache.oku("user-b:firma-1"), null);
  assert.equal(cache.oku("user-a:firma-2"), null);
  assert.deepEqual(sayfaOkumaOnbellegiOlustur<string[]>("test").oku("user-a:firma-1"), ["a"]);
  assert.equal(sayfaOkumaOnbellegiOlustur<string[]>("other").oku("user-a:firma-1"), null);
  now += 60000;
  assert.equal(cache.oku("user-a:firma-1"), null);
  assert.equal(storage.has("hb_sayfa_test_v1_user-a:firma-1"), false);
  storage.set("hb_sayfa_test_v1_bozuk", "{");
  assert.equal(cache.oku("bozuk"), null);
  storage.set("hb_sayfa_test_v1_gelecek", JSON.stringify({ veri: ["x"], zaman: now + 1 }));
  assert.equal(cache.oku("gelecek"), null);
});

test("eş zamanlı istekler paylaşılır; arka plan doğrulaması önbelleği günceller ve hata veriyi siler", async () => {
  const cache = sayfaOkumaOnbellegiOlustur<string[]>("istek");
  let calls = 0;
  const load = async () => { calls++; return ["eski"]; };
  const first = cache.iste("user", load);
  assert.equal(cache.iste("user", load), first);
  await first;
  assert.equal(calls, 1);
  assert.deepEqual(cache.oku("user"), ["eski"]);
  await cache.iste("user", async () => ["guncel"]);
  assert.deepEqual(cache.oku("user"), ["guncel"]);
  await assert.rejects(cache.iste("user", async () => { throw new Error("yetkisiz"); }));
  assert.equal(cache.oku("user"), null);
  await cache.iste("user", async () => []);
  assert.deepEqual(cache.oku("user"), []);
  cache.sil("user");
  assert.equal(cache.oku("user"), null);
});

test("tarayıcı depolaması kapalıyken bellek önbelleği çalışır", async (t) => {
  const onceki = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get() { throw new Error("kapali"); } });
  t.after(() => {
    if (onceki) Object.defineProperty(globalThis, "sessionStorage", onceki);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  });
  const cache = sayfaOkumaOnbellegiOlustur<number>("kapali");
  await cache.iste("user", async () => 42);
  assert.equal(cache.oku("user"), 42);
  cache.sil("user");
  assert.equal(cache.oku("user"), null);
});

test("zorunlu yenilemeden önce başlayan yanıt güncel önbelleği ezmez", async () => {
  const cache = sayfaOkumaOnbellegiOlustur<string>("zorunlu");
  let tamamla!: (veri: string) => void;
  const eski = cache.iste("user", () => new Promise<string>(r => { tamamla = r; }));
  await Promise.resolve();
  await cache.iste("user", async () => "talep-sonrasi", true);
  tamamla("talep-oncesi");
  await eski;
  assert.equal(cache.oku("user"), "talep-sonrasi");
});

test("işlemle silinen önbellek bekleyen eski yanıtla tekrar doldurulmaz", async () => {
  const cache = sayfaOkumaOnbellegiOlustur<string>("silinen");
  let tamamla!: (veri: string) => void;
  const istek = cache.iste("user", () => new Promise<string>(r => { tamamla = r; }));
  await Promise.resolve();
  cache.sil("user");
  tamamla("işlem öncesi");
  await istek;
  assert.equal(cache.oku("user"), null);
});
