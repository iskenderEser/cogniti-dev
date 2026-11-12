import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../app/(panel)/yayin-katalogu/api/route.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });

function katalog(rol = "pm") {
  const filtreler = [];
  const kayit = (id, sahip) => ({
    soru_seti_durum_id: id,
    soru_setleri: { talepler: { talep_id: sahip, uretici_id: sahip, urun_adi: "Eğitim", uretim_bedeli_token: 2700 } },
  });
  const sorgu = {
    select() { return this; },
    eq(...args) { filtreler.push(args); return this; },
    gt(...args) { filtreler.push(args); return this; },
    is(...args) { filtreler.push(args); return this; },
    async order() {
      return { data: [kayit("son-onay", "uretici"), kayit("eski-onay", "uretici"), kayit("diger-onay", "diger")] };
    },
  };
  const moduller = {
    "next/server": { NextResponse: Response },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "uretici" } } }) } }),
      createAdminClient: () => ({ from: () => sorgu }),
    },
    "@/lib/utils/hataIsle": {
      rolHatasi: () => new Response(null, { status: 403 }),
      sunucuHatasi: (error) => { throw error; },
    },
    "@/lib/utils/roller": { URETICI_ROLLER: ["pm"], YAYINDAKI_VIDEO_GORENLER: ["pm", "gm"] },
    "@/lib/video/yayindakiVideolar": { getYayindakiVideolar: async () => [] },
    "@/lib/utils/rolCozucu": { rolCozucu: async () => rol },
  };
  const exports = {};
  runInNewContext(outputText, { exports, require: (name) => moduller[name] });
  return {
    filtreler,
    getir: (kapsam) => exports.GET({ nextUrl: new URL(`https://cogniti.test/yayin-katalogu/api?kapsam=${kapsam}`) }),
  };
}

test("Sizin Yayınlarınız yalnız sahibinin onaylı ve sabit bedelli talebini bir kez döndürür", async () => {
  const { getir, filtreler } = katalog();
  const response = await getir("benim");
  const { odemeBekleyenler } = await response.json();
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(filtreler, [
    ["durum", "onaylandi"],
    ["soru_setleri.talepler.uretici_id", "uretici"],
    ["soru_setleri.talepler.uretim_bedeli_turu", "sabit"],
    ["soru_setleri.talepler.uretim_bedeli_token", 0],
    ["soru_setleri.talepler.yayin_oncesi_silme_durumu", null],
    ["soru_setleri.talepler.uretim_bedeli_odendi_at", null],
  ]);
  assert.deepEqual(odemeBekleyenler, [
    { talep_id: "uretici", yayin_id: "son-onay", urun_adi: "Eğitim", token: 2700 },
  ]);
});

test("Diğer kataloglarda ödeme kayıtları okunmaz ve yönetici benim kapsamına giremez", async () => {
  const { getir, filtreler } = katalog();
  for (const kapsam of ["tumu", "digerleri"]) {
    assert.deepEqual(await (await getir(kapsam)).json(), { videolar: [] });
  }
  assert.equal(filtreler.length, 0);
  assert.equal((await katalog("gm").getir("benim")).status, 403);
});
