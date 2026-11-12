import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { PANEL_NAV } from "@/components/panel/panelNav.config";
import { URETICI_ROLLER } from "@/lib/utils/roller";

const route = ts.transpileModule(readFileSync("app/eczanem/bm/api/yayinlar/route.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function endpoint({ rol = "bm", aktif = true, modul = true } = {}) {
  const cagrilar: string[] = [];
  const db = { from: (tablo: string) => ({ select: () => ({ eq: (_alan: string, firma: string) => {
    if (tablo === "v_yayin_kunye") {
      assert.equal(firma, "firma");
      return { in: () => ({ data: [{ yayin_id: "y1", urun_id: "p1" }], error: null }) };
    }
    return { maybeSingle: async () => ({ data: { rol, aktif_mi: aktif, firma_id: "firma", takim_id: "takim" }, error: null }) };
  } }) }) };
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: Response },
    "@/lib/utils/roller": { URETICI_ROLLER },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "bm" } }, error: null }) } }),
      createAdminClient: () => db,
    },
    "@/lib/eczanem/erisim": { uttEczanemErisimi: async () => ({ ok: true, acik: modul }) },
    "@/lib/eclub/yonetimKapsami": { eclubYonetimKapsaminiGetir: async () => ({ uttler: [
      { utt_id: "utt-1", utt_adi: "İlk UTT", bolge_id: "bolge-1", bolge_adi: "Merkez", bm_id: "bm-1", bm_adi: "İlk BM" },
      { utt_id: "utt-2", utt_adi: "İkinci UTT", bolge_id: "bolge-2", bolge_adi: "Kuzey", bm_id: "bm-2", bm_adi: "İkinci BM" },
    ] }) },
    "@/lib/eczanem/gonderim": {
      uttEczanemVerisi: async (_db: unknown, id: string) => {
        cagrilar.push(id);
        return { yayinlar: [{ yayin_id: "y1" }], gonderimler: [
          { yayin_id: "y1", eczane_id: "e1", created_at: "2026-11-01", gonderen_utt_id: id },
          { yayin_id: "y1", eczane_id: "e2", created_at: "2026-11-02", gonderen_utt_id: "baska-utt" },
        ] };
      },
    },
    "@/lib/eczanem/uyeGonderimOzeti": {
      uttEczanemUyeGonderimOzeti: async (_db: unknown, id: string | string[]) => { cagrilar.push(String(id)); return { gonderiSayisi: 1 }; },
      uttEczanemUyeGonderimRafi: async (_db: unknown, id: string | string[], _firma: string, ay: Date) => {
        cagrilar.push(String(id), ay.toISOString());
        return { yayinlar: [] };
      },
    },
    "@/lib/utils/hataIsle": {
      yetkiHatasi: () => Response.json({}, { status: 401 }),
      rolHatasi: () => Response.json({}, { status: 403 }),
      validasyonHatasi: () => Response.json({}, { status: 400 }),
      sunucuHatasi: (error: unknown) => { throw error; },
    },
  };
  const exports: { GET?: (r: unknown) => Promise<Response>; POST?: unknown } = {};
  vm.runInNewContext(route, { exports, require: (id: string) => modules[id] });
  assert.equal(exports.POST, undefined);
  return { cagrilar, get: (query: string, yol = "/") => exports.GET!({ nextUrl: new URL(`http://localhost${yol}?${query}`) }) };
}

test("Üretici iki yayın sekmesine kendi API yolundan ve temsilci kapsamından erişir", async () => {
  const yol = "/eczanem/uretici/api/yayinlar";
  const pm = endpoint({ rol: "pm" });
  const eczane = await pm.get("gorunum=eczane&bm_id=bm-2", yol);
  const uye = await pm.get("gorunum=uye&donem=2026-10&bolge_id=bolge-2", yol);
  assert.equal(eczane.status, 200);
  assert.equal(uye.status, 200);
  const eczaneVerisi = await eczane.json();
  const uyeVerisi = await uye.json();
  assert.equal(eczaneVerisi.urunler, undefined);
  assert.equal(uyeVerisi.urunler, undefined);
  assert.deepEqual(eczaneVerisi.urunBaglari, { y1: "p1" });
  assert.equal((await pm.get("gorunum=eczane&utt_id=kapsam-disi", yol)).status, 403);
  assert.equal((await pm.get("gorunum=eczane")).status, 403);
  assert.equal((await endpoint({ rol: "tm" }).get("gorunum=eczane", yol)).status, 403);
});

test("BM menüsünde iki yayın sekmesi açılır ve yetki kapısı kapsam dışı UTT'yi reddeder", async () => {
  const oge = PANEL_NAV.find((grup) => grup.baslik === "Eczanem")!.oglar;
  const bmYollari = oge.filter(({ path }) => typeof path === "string" && path.startsWith("/eczanem/bm/"));
  assert.deepEqual(bmYollari.slice(0, 2).map(({ path }) => path), ["/eczanem/bm/yayinlar", "/eczanem/bm/uyelere-gonderilen-yayinlar"]);
  for (const sekme of bmYollari.slice(0, 2)) {
    const ctx = { rolKucu: "bm", storeAcik: true, ccAcik: true, eclubAcik: true, eczanemAcik: true };
    assert.equal(sekme.gate(ctx), true);
    assert.equal(sekme.gate({ ...ctx, rolKucu: "tm" }), false);
    assert.equal(sekme.gate({ ...ctx, eczanemAcik: false }), false);
  }
  const bm = endpoint();
  assert.equal((await bm.get("gorunum=eczane&utt_id=kapsam-disi")).status, 403);
  assert.deepEqual(bm.cagrilar, []);
  for (const api of [endpoint({ rol: "utt" }), endpoint({ aktif: false }), endpoint({ modul: false })]) {
    assert.equal((await api.get("gorunum=eczane&utt_id=utt-1")).status, 403);
    assert.deepEqual(api.cagrilar, []);
  }
});

test("TM bölge seçimi UTT listesini ve sorguyu daraltır", async () => {
  const tm = endpoint({ rol: "tm" });
  assert.equal((await tm.get("gorunum=eczane&bolge_id=baska-bolge")).status, 403);
  assert.equal((await tm.get("gorunum=eczane&bolge_id=bolge-2&utt_id=utt-1")).status, 403);
  assert.deepEqual(tm.cagrilar, []);
  const yanit = await tm.get("gorunum=uye&donem=2026-10&bolge_id=bolge-2");
  assert.equal(yanit.status, 200);
  const govde = await yanit.json();
  assert.deepEqual(govde.bolgeler, [
    { deger: "bolge-2", etiket: "Kuzey" }, { deger: "bolge-1", etiket: "Merkez" },
  ]);
  assert.deepEqual(govde.uttler, [{ utt_id: "utt-2", utt_adi: "İkinci UTT" }]);
  assert.equal(govde.seciliUttId, null);
  assert.deepEqual(tm.cagrilar, ["utt-2", "utt-2", "2026-10-15T12:00:00.000Z"]);
  assert.equal((await endpoint().get("gorunum=eczane&bolge_id=bolge-1")).status, 403);
});

test("TM eczane yayınları BM seçimine göre temsilciyi sınırlar", async () => {
  const tm = endpoint({ rol: "tm" });
  const eczane = await (await tm.get("gorunum=eczane")).json();
  assert.equal(eczane.seciliUttId, "utt-1");
  assert.equal(eczane.bmGruplari.length, 2);
  assert.equal((await tm.get("gorunum=eczane&bm_id=bm-2&utt_id=utt-1")).status, 403);
  const filtreli = await (await tm.get("gorunum=eczane&bm_id=bm-2")).json();
  assert.equal(filtreli.seciliUttId, "utt-2");
  assert.deepEqual(filtreli.uttler, [{ utt_id: "utt-2", utt_adi: "İkinci UTT" }]);
  const uye = await (await tm.get("gorunum=uye&donem=2026-10")).json();
  assert.equal(uye.seciliUttId, null);
  assert.deepEqual(tm.cagrilar.slice(-3), ["utt-1,utt-2", "utt-1,utt-2", "2026-10-15T12:00:00.000Z"]);
});

test("Eczane ve üye takipleri seçilen UTT'ye göre kayıt döndürür", async () => {
  const api = endpoint();
  const eczane = await api.get("gorunum=eczane");
  assert.equal(eczane.status, 200);
  const eczaneGovdesi = await eczane.json();
  assert.equal(eczaneGovdesi.seciliUttId, "utt-1");
  assert.deepEqual(eczaneGovdesi.veri.gonderimler, [
    { yayin_id: "y1", eczane_id: "e1", created_at: "2026-11-01" },
    { yayin_id: "y1", eczane_id: "e2", created_at: null },
  ]);
  const uye = await api.get("gorunum=uye&utt_id=utt-2&donem=2026-10");
  assert.equal(uye.status, 200);
  assert.equal((await uye.json()).seciliUttId, "utt-2");
  assert.deepEqual(api.cagrilar, ["utt-1", "utt-2", "utt-2", "2026-10-15T12:00:00.000Z"]);
});

test("TM iki yayın sekmesini açabilir ve kapsam dışındaki UTT'leri göremez", async () => {
  const sekmeler = PANEL_NAV.find((grup) => grup.baslik === "Eczanem")!.oglar;
  const ctx = { rolKucu: "tm", storeAcik: true, ccAcik: true, eclubAcik: true, eczanemAcik: true };
  for (const path of ["/eczanem/tm/yayinlar", "/eczanem/tm/uyelere-gonderilen-yayinlar"]) {
    assert.equal(sekmeler.find((sekme) => sekme.path === path)?.gate(ctx), true);
  }
  const tm = endpoint({ rol: "tm" });
  const uyeSorgusu = "gorunum=uye&donem=2026-10";
  assert.equal((await tm.get("gorunum=eczane&utt_id=kapsam-disi")).status, 403);
  assert.equal((await tm.get(`${uyeSorgusu}&utt_id=kapsam-disi`)).status, 403);
  assert.deepEqual(tm.cagrilar, []);
  assert.equal((await tm.get("gorunum=eczane&utt_id=utt-1")).status, 200);
  assert.equal((await tm.get(`${uyeSorgusu}&utt_id=utt-2`)).status, 200);
  assert.deepEqual(tm.cagrilar, ["utt-1", "utt-2", "utt-2", "2026-10-15T12:00:00.000Z"]);
});
