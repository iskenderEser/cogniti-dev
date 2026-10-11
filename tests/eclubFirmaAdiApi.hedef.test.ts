import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { eclubFirmaKapsami, eclubFirmaRotasiKapsami } from "@/lib/eclub/firmaGezinme";

const firma = { firma_id: "0c504d88-b9fb-40bb-beae-5bae33cb99ac", firma_adi: "İki İsimli Firma", aktif: true, eclub_aktif: true, eclub_store_aktif: true };
function api(path: string) {
  let okunanFirma: unknown;
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: Response },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "auth" } }, error: null }) } }),
      createAdminClient: () => ({ from: () => { const query = {
        select: () => query, eq: (_: string, id: unknown) => { okunanFirma = id; return query; },
        order: async () => ({ data: [{ urun_id: "u1", urun_adi: "Ürün" }], error: null }),
      }; return query; } }),
    },
    "@/lib/eclub/kisiErisim": { eclubKisiErisimi: async () => ({ kisi: { rol: "eczaci" }, firmalar: [firma] }) },
    "@/lib/eclub/firmaGezinme": { eclubFirmaKapsami, eclubFirmaRotasiKapsami },
    "@/lib/eclub/bannerSunucu": { firmaBannerlariniOku: async (_: unknown, id: string) => { okunanFirma = id; return { bannerlar: [{ sira: 1, url: "banner.webp" }], error: null }; } },
    "@/lib/eclub/banner": { bannerKurulumuEksik: () => false },
    "@/lib/utils/roller": { ECLUB_TUKETICI_ROLLERI: ["eczaci"] },
    "@/lib/uretim/rpc": { uuidGecerliMi: (s: string) => /^[a-f0-9-]{36}$/i.test(s) },
    "@/lib/utils/hataIsle": { rolHatasi: () => Response.json({}, { status: 403 }), yetkiHatasi: () => Response.json({}, { status: 401 }), validasyonHatasi: () => Response.json({}, { status: 400 }), hataYaniti: () => Response.json({}, { status: 500 }), sunucuHatasi: () => Response.json({}, { status: 500 }) },
  };
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: { GET?: (r: Request) => Promise<Response> } = {};
  vm.runInNewContext(compiled, { exports, require: (id: string) => modules[id], URL, Error });
  return { get: (query: string) => exports.GET!(new Request(`http://localhost/api?${query}`)), okunanFirma: () => okunanFirma };
}
for (const path of ["app/(panel)/eclub/firmalar/api/route.ts", "app/(panel)/eclub/api/bannerlar/route.ts"]) {
  test(`${path}: firma adı doğru kimliğe çözülür; yabancı firma okunmaz`, async () => {
    const normal = api(path);
    assert.equal((await normal.get("firma=iki-isimli-firma")).status, 200);
    assert.equal(normal.okunanFirma(), firma.firma_id);
    const eski = api(path);
    assert.equal((await eski.get(`firma=${firma.firma_id}`)).status, 200);
    assert.equal(eski.okunanFirma(), firma.firma_id);
    const yabanci = api(path);
    assert.equal((await yabanci.get("firma=baska-firma")).status, 403);
    assert.equal(yabanci.okunanFirma(), undefined);
  });
}
