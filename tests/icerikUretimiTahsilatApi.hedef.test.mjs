import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const yol = new URL("../app/api/satin-alma/icerik-uretimi/route.ts", import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(yol, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const talepId = "cde79fa9-0cc7-49c4-84bf-30bd46c78780";

function api({ kullanici = { id: "uretici" }, error = null, tekrar = false } = {}) {
  const cagri = [];
  const epostalar = [];
  const moduller = {
    "@/lib/agora/partnerHttp": {
      partnerJsonOku: async (request) => ({ ok: true, veri: await request.json() }),
      partnerYanit: (data, status = 200) => Response.json(data, { status }),
    },
    "@/lib/satinAlma/satinAlmaEposta": {
      icerikUretimiOnaylandiEpostasiGonder: async (_db, params) => {
        epostalar.push(params);
      },
    },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: kullanici } }) } }),
      createAdminClient: () => ({
        rpc: async (ad, args) => {
          cagri.push({ ad, args });
          return { data: error ? null : { talep_id: talepId, token: 2700, tekrar }, error };
        },
      }),
    },
    "@/lib/uretim/rpcTemel": { uuidGecerliMi: (id) => id === talepId },
  };
  const exports = {};
  runInNewContext(outputText, { exports, AbortSignal, require: (name) => moduller[name] });
  return {
    cagri,
    epostalar,
    gonder: (veri = { talep_id: talepId, hesap: "firma_ortak" }) => exports.POST({
      json: async () => veri,
    }),
  };
}

test("Tahsilat oturum, talep ve seçilen hesapla çağrılır", async () => {
  for (const hesap of ["kisisel", "firma_ortak"]) {
    const { gonder, cagri, epostalar } = api();
    const response = await gonder({ talep_id: talepId, hesap, token: 1, uretici_id: "baska-uretici" });
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(JSON.stringify(cagri)), [{
      ad: "cogniti_icerik_uretim_tahsil_et",
      args: { p_auth: "uretici", p_talep: talepId, p_hesap: hesap },
    }]);
    assert.deepEqual(JSON.parse(JSON.stringify(epostalar)), [{
      kullaniciId: "uretici",
      talepId,
      hesapTuru: hesap,
      tokenAdedi: 2700,
    }]);
  }
});

test("Yetersiz bakiye modalı için ayrı hata kodu, tekrarlanan tahsilat için başarı döner", async () => {
  const yetersizApi = api({ error: { code: "P0001", message: "ICERIK_URETIMI:bakiye_yetersiz" } });
  const yetersiz = await yetersizApi.gonder();
  assert.equal(yetersiz.status, 422);
  assert.equal((await yetersiz.json()).kod, "bakiye_yetersiz");
  assert.equal(yetersizApi.epostalar.length, 0);
  const tekrarApi = api({ tekrar: true });
  const tekrar = await tekrarApi.gonder();
  assert.deepEqual(await tekrar.json(), { ok: true, tekrar: true });
  assert.equal(tekrarApi.epostalar.length, 0);
});

test("Oturumsuz ve geçersiz hesap istekleri tahsilata ulaşmaz", async () => {
  const oturumsuz = api({ kullanici: null });
  assert.equal((await oturumsuz.gonder()).status, 401);
  assert.equal(oturumsuz.cagri.length, 0);
  const gecersiz = api();
  assert.equal((await gecersiz.gonder({ talep_id: talepId, hesap: "diger" })).status, 400);
  assert.equal(gecersiz.cagri.length, 0);
});
