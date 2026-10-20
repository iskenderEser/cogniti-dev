import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as banner from "@/lib/eclub/banner";

const firmaId = "11111111-1111-4111-8111-111111111111";
type Kayit = { firma_id: string; alan?: string; sira: number; dosya_yolu: string };
function ortam() {
  const durum = { yetkili: true, kisitEksik: false };
  const kayitlar = new Map<string, Kayit>();
  const yuklenenler: string[] = [], silinenler: string[] = [], tablolar: string[] = [];
  const anahtar = (tablo: string, k: Kayit) => `${tablo}:${k.firma_id}:${k.alan ?? "firma"}:${k.sira}`;
  const eski: Kayit = { firma_id: firmaId, sira: 1, dosya_yolu: "eski-eclub.png" };
  kayitlar.set(anahtar(banner.ECLUB_BANNER_TABLO, eski), eski);
  const admin = {
    from(tablo: string) {
      tablolar.push(tablo);
      const filtreler: Record<string, unknown> = {};
      let sil = false;
      const satirlar = () => [...kayitlar.entries()].filter(([k, v]) => k.startsWith(tablo + ":") && Object.entries(filtreler).every(([a, d]) => v[a as keyof Kayit] === d));
      const sorgu = {
        select() { return sorgu; },
        eq(alan: string, deger: unknown) { filtreler[alan] = deger; return sorgu; },
        delete() { sil = true; return sorgu; },
        async maybeSingle() { return { data: tablo === "firmalar" ? { firma_id: filtreler.firma_id, firma_adi: "Firma" } : satirlar()[0]?.[1] ?? null, error: null }; },
        async upsert(kayit: Kayit) { if (durum.kisitEksik) return { error: { code: "23514" } }; kayitlar.set(anahtar(tablo, kayit), kayit); return { error: null }; },
        then(resolve: (value: unknown) => unknown) { const rows = satirlar(); if (sil) rows.forEach(([k]) => kayitlar.delete(k)); return Promise.resolve({ data: rows.map(([, v]) => v), error: null }).then(resolve); },
      };
      return sorgu;
    },
    storage: { from: () => ({ upload: async (yol: string) => { yuklenenler.push(yol); return { error: null }; }, remove: async (yollar: string[]) => { silinenler.push(...yollar); return { error: null }; }, getPublicUrl: (yol: string) => ({ data: { publicUrl: `https://example.invalid/${yol}` } }) }) },
  };
  const json = (data: unknown, options?: ResponseInit) => Response.json(data, options);
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: { json } },
    "@/lib/utils/adminGirisKontrol": { adminGirisKontrol: async () => durum.yetkili ? { gecerli: true } : { gecerli: false, yanit: json({}, { status: 403 }) } },
    "@/lib/supabase/server": { createAdminClient: () => admin },
    "@/lib/uretim/rpc": { uuidGecerliMi: (id: string) => /^[0-9a-f-]{36}$/i.test(id) },
    "@/lib/utils/hataIsle": { validasyonHatasi: (hata: string) => json({ hata }, { status: 400 }), hataYaniti: (hata: string) => json({ hata }, { status: 500 }), sunucuHatasi: (error: unknown) => { throw error; } },
    "@/lib/eclub/banner": banner,
    "@/lib/eclub/bannerSunucu": { firmaBannerlariniOku: async (_: unknown, id: string, alan: string) => ({ error: null, bannerlar: [...kayitlar.entries()].filter(([k, v]) => k.startsWith((alan === "firma" ? banner.ECLUB_BANNER_TABLO : banner.ECZANEM_BANNER_TABLO) + ":") && v.firma_id === id && (alan === "firma" || v.alan === alan)).map(([, v]) => ({ sira: v.sira, url: v.dosya_yolu })) }) },
  };
  const exports: Record<string, (req: Request) => Promise<Response>> = {};
  const compiled = ts.transpileModule(readFileSync("app/admin/api/eclub/bannerlar/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let siraNo = 0;
  vm.runInNewContext(compiled, { exports, URL, File, crypto: { randomUUID: () => `dosya-${++siraNo}` }, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
  const png = () => new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "banner.png", { type: "image/png" });
  return {
    durum, kayitlar, yuklenenler, silinenler, tablolar,
    get: (alan = "uye-ana-sayfa") => exports.GET(new Request(`http://localhost/admin/api/eclub/bannerlar?firma_id=${firmaId}&alan=${alan}`)),
    post: (id = firmaId, sira = 1, alan = "uye-ana-sayfa", dosya = png()) => { const form = new FormData(); form.set("firma_id", id); form.set("alan", alan); form.set("sira", String(sira)); form.set("dosya", dosya); return exports.POST(new Request("http://localhost/admin/api/eclub/bannerlar", { method: "POST", body: form })); },
    sil: () => exports.DELETE(new Request(`http://localhost/admin/api/eclub/bannerlar?firma_id=${firmaId}&alan=uye-ana-sayfa&sira=1`, { method: "DELETE" })),
  };
}

test("Eczanem bannerı yüklenir, değiştirilir, silinir; aynı sıradaki E-Club kaydı korunur", async () => {
  const o = ortam();
  assert.equal((await (await o.get()).json()).bannerlar.length, 0);
  assert.equal((await o.post()).status, 200);
  const ilk = o.yuklenenler[0]; assert.match(ilk, /\/uye-ana-sayfa\/1-/);
  assert.equal((await (await o.get()).json()).bannerlar.length, 1);
  assert.equal((await o.post()).status, 200); assert.ok(o.silinenler.includes(ilk));
  assert.equal((await o.sil()).status, 200);
  assert.equal((await (await o.get()).json()).bannerlar.length, 0);
  assert.equal((await (await o.get("firma")).json()).bannerlar[0].url, "eski-eclub.png");
  assert.equal(o.silinenler.includes("eski-eclub.png"), false);
});

test("Eczanem üye alanında platform beş, diğer firmalar üç; eski sayfalar üç banner ile sınırlıdır", async () => {
  const o = ortam();
  assert.equal((await o.post(banner.PLATFORM_FIRMA_ID, 5)).status, 200);
  assert.equal((await o.post(firmaId, 4)).status, 400);
  assert.equal((await o.post(banner.PLATFORM_FIRMA_ID, 4, "uyeler")).status, 400);
  assert.equal((await o.post(firmaId, 3)).status, 200);
});

test("SQL kurulumu eksikse yeni dosya temizlenir ve doğru kurulum dosyası belirtilir", async () => {
  const o = ortam(); o.durum.kisitEksik = true;
  const response = await o.post(); assert.equal(response.status, 503);
  assert.match((await response.json()).hata, /eczanem_uye_bannerlari.sql/);
  assert.equal(o.silinenler[0], o.yuklenenler[0]); assert.equal(o.kayitlar.size, 1);
});

test("yetkisiz istekler ve geçersiz dosya/alan yükleme yapamaz", async () => {
  const o = ortam(); o.durum.yetkili = false;
  for (const response of [await o.get(), await o.post(), await o.sil()]) assert.equal(response.status, 403);
  assert.equal(o.tablolar.length, 0);
  o.durum.yetkili = true;
  assert.equal((await o.post(firmaId, 1, "bilinmeyen")).status, 400);
  assert.equal((await o.post(firmaId, 1, "uye-ana-sayfa", new File(["sahte"], "banner.png", { type: "image/png" }))).status, 400);
  assert.equal(o.yuklenenler.length, 0);
});
