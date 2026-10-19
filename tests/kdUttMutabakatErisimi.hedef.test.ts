import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { PANEL_NAV, type NavContext } from "@/components/panel/panelNav.config";
import * as roller from "@/lib/utils/roller";
import * as mutabakat from "@/lib/eczanem/uttMutabakat";

const kullaniciId = "10000000-0000-4000-8000-000000000001";
const digerId = "20000000-0000-4000-8000-000000000002";
const mutabakatId = "30000000-0000-4000-8000-000000000003";
const tumRoller = [...roller.TUM_ROLLER, ...roller.ECLUB_TUKETICI_ROLLERI, roller.MUSTERI_ROLU];

function api(dal: "utt" | "bm" | "tm", rol: string, { oturum = true, modul = true } = {}) {
  const cagrilar: string[] = [];
  const db = { from: () => ({ select: () => ({ eq: () => ({
    single: async () => ({ data: { kullanici_id: kullaniciId, rol }, error: null }),
  }) }) }) };
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: Response },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: oturum ? { id: kullaniciId } : null }, error: null }) } }),
      createAdminClient: () => db,
    },
    "@/lib/utils/roller": roller,
    "@/lib/utils/rolCozucu": { rolCozucu: async () => rol },
    "@/lib/eczanem/erisim": { uttEczanemErisimi: async () => ({ ok: true, acik: modul }), ECZANEM_KAPALI_MESAJI: "Kapalı" },
    "@/lib/eczanem/uttMutabakat": {
      ...mutabakat,
      tumUttMutabakatKayitlariniListele: async (_db: unknown, id: string) => { cagrilar.push(id); return []; },
      uttMutabakatKarariVer: async (_db: unknown, id: string) => { cagrilar.push(id); return { karar: "onay" }; },
    },
    "@/lib/eclub/yonetimKapsami": { eclubYonetimKapsaminiGetir: async () => ({ uttler: [
      { utt_id: kullaniciId, rol: "utt", utt_adi: "UTT" },
      { utt_id: digerId, rol: "kd_utt", utt_adi: "KD UTT" },
    ] }) },
    "@/lib/utils/hataIsle": {
      yetkiHatasi: () => Response.json({}, { status: 401 }),
      rolHatasi: () => Response.json({}, { status: 403 }),
      validasyonHatasi: () => Response.json({}, { status: 400 }),
      sunucuHatasi: (error: unknown) => { throw error; },
    },
  };
  const compiled = ts.transpileModule(readFileSync(`app/eczanem/${dal}/api/mutabakat/route.ts`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: { GET?: (r: unknown) => Promise<Response>; POST?: (r: unknown) => Promise<Response> } = {};
  vm.runInNewContext(compiled, { exports, require: (id: string) => {
    if (!(id in modules)) throw new Error(`Beklenmeyen bağımlılık: ${id}`);
    return modules[id];
  } });
  return {
    cagrilar,
    get: (query = "donem=2026-09&gorunum=duz") => exports.GET!({ nextUrl: new URL(`http://localhost/?${query}`) }),
    post: () => exports.POST!({ json: async () => ({ mutabakat_id: mutabakatId, karar: "onay" }) }),
  };
}

test("Mutabakat menüsü UTT ve KD_UTT için aynı; diğer rollere ve kapalı modüle açılmaz", () => {
  const oge = PANEL_NAV.find(g => g.baslik === "Eczanem")!.oglar.find(o => o.etiket === "Mutabakat")!;
  for (const rolKucu of tumRoller) {
    const ctx: NavContext = { rolKucu, storeAcik: true, ccAcik: true, eclubAcik: true, eclubStoreAcik: true, eczanemAcik: true };
    assert.equal(oge.gate(ctx), ["utt", "kd_utt"].includes(rolKucu), rolKucu);
    assert.equal(oge.gate({ ...ctx, eczanemAcik: false }), false);
  }
});

test("UTT ve KD_UTT mutabakat okuyup karar verebilir; işlem kendi kullanıcı kimliğini taşır", async () => {
  for (const rol of ["utt", "kd_utt"]) {
    const endpoint = api("utt", rol);
    assert.equal((await endpoint.get()).status, 200);
    assert.equal((await endpoint.post()).status, 200);
    assert.deepEqual(endpoint.cagrilar, [kullaniciId, kullaniciId]);
  }
});

test("diğer roller, kapalı modül ve oturumsuz istek Mutabakat okuma/karar kapısını geçemez", async () => {
  for (const rol of tumRoller.filter(r => !["utt", "kd_utt"].includes(r))) {
    const endpoint = api("utt", rol);
    assert.equal((await endpoint.get()).status, 403, rol);
    assert.equal((await endpoint.post()).status, 403, rol);
    assert.deepEqual(endpoint.cagrilar, []);
  }
  for (const [secenek, status] of [[{ modul: false }, 403], [{ oturum: false }, 401]] as const) {
    const endpoint = api("utt", "kd_utt", secenek);
    assert.equal((await endpoint.get()).status, status);
    assert.equal((await endpoint.post()).status, status);
    assert.deepEqual(endpoint.cagrilar, []);
  }
});

test("BM/TM mutabakat listeleri kapsam içindeki UTT ve KD_UTT'yi içerir; kapsam dışı kimliği reddeder", async () => {
  for (const dal of ["bm", "tm"] as const) {
    const endpoint = api(dal, dal);
    assert.equal((await endpoint.get()).status, 200);
    assert.deepEqual(endpoint.cagrilar, [kullaniciId, digerId]);
    assert.equal((await endpoint.get(`donem=2026-09&utt_id=${mutabakatId}`)).status, 403);
    assert.deepEqual(endpoint.cagrilar, [kullaniciId, digerId]);
  }
});
