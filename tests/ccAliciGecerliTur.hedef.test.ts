import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { readFileSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tekrarIzlemeKontrol } from "@/lib/cclub/tekrarIzlemeKontrol";
import { aylikKotaKontrol, aliciAylikKontrol } from "@/lib/cclub/kotaKontrol";

const TUR = "2026-10-01T00:00:00.000Z";
type Satir = Record<string, unknown>;
function izleme(bm: string, zaman: string, tamamlandi = true): Satir {
  return { izleme_id: bm + zaman, bm_id: bm, yayin_id: "yayin", arac_id: "arac", izleme_baslangic: zaman, tamamlandi_mi: tamamlandi };
}
function dbHazirla(izlemeler: Satir[], aylik = 0, aliciyaGonderildi = false, aracTuru = "video") {
  const challenge = Array.from({ length: aylik }, (_, i) => ({
    gonderen_id: "gonderen", alan_id: aliciyaGonderildi && i === 0 ? "alici" : "diger" + i,
    created_at: new Date().toISOString(),
  }));
  return {
    from(tablo: string) {
      let rows: Satir[] = tablo === "cc_izleme_kayitlari" ? izlemeler
        : tablo === "challenge_kayitlari" ? challenge
        : tablo === "v_yayin_detay" ? [{ yayin_id: "yayin", arac_id: "arac", arac_turu: aracTuru, hedef_roller: ["bm"], durum: "yayinda" }]
        : tablo === "kullanicilar" ? ["gonderen", "alici"].map((id) => ({ kullanici_id: id, rol: "bm", firma_id: "firma", aktif_mi: true, ad: id, soyad: "BM" }))
        : [];
      const result = () => ({ data: rows, count: rows.length, error: null });
      const q = {
        select() { return q; },
        eq(key: string, value: unknown) { rows = rows.filter((r) => r[key] === value); return q; },
        gte(key: string, value: string) { rows = rows.filter((r) => String(r[key]) >= value); return q; },
        limit(n: number) { rows = rows.slice(0, n); return q; },
        async single() { return { data: rows[0] ?? null, error: null }; },
        async maybeSingle() { return { data: rows[0] ?? null, error: null }; },
        then(resolve: (r: ReturnType<typeof result>) => unknown) { return Promise.resolve(resolve(result())); },
      };
      return q;
    },
  };
}

test("alıcı kontrolü yalnız geçerli turdaki tamamlanmış ilgili yayını sayar", async () => {
  const cases = [
    { rows: [izleme("alici", "2026-09-30T23:59:59.999Z")], izin: true },
    { rows: [izleme("alici", TUR)], izin: false },
    { rows: [izleme("alici", "2026-10-02T00:00:00.000Z")], izin: false },
    { rows: [izleme("alici", TUR, false)], izin: true },
    { rows: [izleme("diger", TUR)], izin: true },
    { rows: [{ ...izleme("alici", TUR), yayin_id: "baska-yayin" }], izin: true },
  ];
  for (const c of cases) {
    const db = dbHazirla(c.rows) as unknown as SupabaseClient;
    assert.equal((await tekrarIzlemeKontrol(db, "alici", "Alıcı", "yayin", TUR)).izlenmemis, c.izin);
  }
});

function apiHazirla(rows: Satir[], opts: { aylik?: number; aliciyaGonderildi?: boolean; turHatasi?: boolean; aracTuru?: string } = {}) {
  const db = dbHazirla([izleme("gonderen", TUR), ...rows], opts.aylik, opts.aliciyaGonderildi, opts.aracTuru);
  let gonderim = 0;
  const hata = (m: string, status: number) => Response.json({ hata: m }, { status });
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: Response },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "gonderen" } }, error: null }) } }),
      createAdminClient: () => db,
    },
    "@/lib/utils/hataIsle": {
      hataYaniti: (m: string) => hata(m, 500), yetkiHatasi: () => hata("yetki", 401),
      rolHatasi: (m: string) => hata(m, 403), validasyonHatasi: (m: string) => hata(m, 400),
      isKuraluHatasi: (m: string) => hata(m, 422), sunucuHatasi: (e: Error) => hata(e.message, 500),
    },
    "@/lib/cclub/uygunAliciListesi": {},
    "@/lib/cclub/kotaKontrol": { aylikKotaKontrol, aliciAylikKontrol },
    "@/lib/cclub/tekrarIzlemeKontrol": { tekrarIzlemeKontrol },
    "@/lib/cclub/kayit": { challengeOlustur: async () => { gonderim++; return { ok: true }; } },
    "@/lib/cclub/sabitler": { AYLIK_MAX_GONDERIM: 3 },
    "@/lib/zaman/kontrol": {},
    "@/lib/tclub/tur/kayit": {
      gecerliTur: async () => opts.turHatasi ? { ok: false, error: "Tur okunamadı" } : { ok: true, tur: { baslangic_tarihi: TUR } },
    },
    "@/lib/utils/rolCozucu": { rolCozucu: async () => "bm" },
    "@/lib/cclub/kartDetaylari": {},
    "@/lib/ogrenmeAraci/bayraklar": { ogrenmeAraciBayraklari: () => ({ video: true, podcast: true, gorsel: true, flip_pdf: true }) },
    "@/lib/ogrenmeAraci/yayinThumbnail": {},
  };
  const source = ts.transpileModule(readFileSync("app/(panel)/challenge-club/api/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: { POST?: (req: Request) => Promise<Response> } = {};
  vm.runInNewContext(source, {
    exports, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; },
    console, Date, Set, Map, URL,
  });
  return {
    run: () => exports.POST!(new Request("http://localhost/challenge-club/api", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yayin_id: "yayin", alan_idler: ["alici"] }),
    })),
    gonderim: () => gonderim,
  };
}

for (const aracTuru of ["video", "podcast", "gorsel", "flip_pdf"]) {
  test(aracTuru + ": POST önceki turdaki tamamlamayı engel saymaz", async () => {
    const api = apiHazirla([izleme("alici", "2026-09-30T23:59:59.999Z")], { aracTuru });
    const res = await api.run();
    assert.equal(res.status, 201);
    assert.equal((await res.json()).gonderilen_sayisi, 1);
    assert.equal(api.gonderim(), 1);
  });
}

test("POST mevcut turda tamamlayan alıcıyı atlar", async () => {
  const api = apiHazirla([izleme("alici", TUR)]);
  const res = await api.run();
  const body = await res.json();
  assert.equal(body.gonderilen_sayisi, 0);
  assert.match(body.atlanan[0].sebep, /geçerli turda/);
  assert.equal(api.gonderim(), 0);
});
test("POST mevcut turdaki yarım izlemeyi tamamlama saymaz", async () => {
  const api = apiHazirla([izleme("alici", TUR, false)]);
  assert.equal((await (await api.run()).json()).gonderilen_sayisi, 1);
});
test("aylık üç gönderim kotası dolduğunda eski tur düzeltmesi kotayı aşmaz", async () => {
  const api = apiHazirla([izleme("alici", "2026-09-01T00:00:00.000Z")], { aylik: 3 });
  const body = await (await api.run()).json();
  assert.equal(body.gonderilen_sayisi, 0);
  assert.match(body.atlanan[0].sebep, /kota/i);
  assert.equal(api.gonderim(), 0);
});
test("aynı ay aynı alıcıya ikinci gönderim hâlâ engellenir", async () => {
  const api = apiHazirla([], { aylik: 1, aliciyaGonderildi: true });
  const body = await (await api.run()).json();
  assert.equal(body.gonderilen_sayisi, 0);
  assert.match(body.atlanan[0].sebep, /zaten/i);
  assert.equal(api.gonderim(), 0);
});
test("aylık iki gönderimden sonra üçüncü gönderim açılır", async () => {
  const api = apiHazirla([], { aylik: 2 });
  assert.equal((await (await api.run()).json()).gonderilen_sayisi, 1);
});
test("geçerli tur okunamazsa gönderim yapılmaz", async () => {
  const api = apiHazirla([], { turHatasi: true });
  assert.equal((await api.run()).status, 500);
  assert.equal(api.gonderim(), 0);
});
