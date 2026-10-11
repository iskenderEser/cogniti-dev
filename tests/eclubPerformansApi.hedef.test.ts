import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { eclubFirmaKapsami } from "@/lib/eclub/firmaGezinme";
import { eclubPerformansDonemi, eclubPerformansiHesapla } from "@/lib/eclub/performans";

const f = "10000000-0000-4000-8000-000000000001", u = "20000000-0000-4000-8000-000000000001";
const d = eclubPerformansDonemi(new Date("2026-10-11T12:00:00Z"));
function api({ authenticated = true, allowed = true, product = true, count = 1, failed = false } = {}) {
  const tables: Record<string, Record<string, unknown>[]> = {
    urunler: product ? [{ firma_id: f, urun_id: u }] : [],
    eclub_eczane_firma: [{ firma_id: f, eczane_id: "e1", aktif_mi: true }, { firma_id: f, eczane_id: "e2", aktif_mi: true }],
    v_yayin_kunye: [{ firma_id: f, urun_id: u, yayin_id: "y1" }],
    eclub_kisi_eczane: [{ id: "b1", kisi_id: "k1", eczane_id: "e1", aktif_mi: true, baslangic_tarihi: d.baslangic, bitis_tarihi: null, created_at: d.baslangic }],
    eclub_kisiler: [{ kisi_id: "k1", ad: "Adil", soyad: "Güçlü" }],
    eclub_izleme_kayitlari: Array.from({ length: count }, (_,i) => ({ izleme_id: `i${i}`, kisi_id: "k1", yayin_id: "y1", arac_turu: "video", tamamlandi_mi: true, izleme_bitis: d.haftalar[0].baslangic })),
    eclub_kazanilan_puanlar: Array.from({ length: count }, (_,i) => ({ kazanilan_puan_id: `p${i}`, izleme_id: `i${i}`, kisi_id: "k1", yayin_id: "y1", eczane_id: "e1", puan: 10, created_at: d.haftalar[0].baslangic })),
    eclub_ileri_sarma_kayitlari: [],
  };
  // Başka eczanenin yüksek puanı, yetkili eczanenin toplamına katılmamalı.
  tables.eclub_kazanilan_puanlar.push({ kazanilan_puan_id: "foreign", izleme_id: "foreign", kisi_id: "other", yayin_id: "y1", eczane_id: "e2", puan: 9000, created_at: d.haftalar[0].baslangic });
  let reads = 0;
  const admin = { from(name: string) {
    reads++;
    let rows = [...(tables[name] ?? [])];
    const builder = {
      select() { return builder; },
      eq(k: string, v: unknown) { rows = rows.filter(r => r[k] === v); return builder; },
      in(k: string, values: unknown[]) { rows = rows.filter(r => values.includes(r[k])); return builder; },
      gte(k: string, v: string) { rows = rows.filter(r => String(r[k]) >= v); return builder; },
      lt(k: string, v: string) { rows = rows.filter(r => String(r[k]) < v); return builder; },
      lte(k: string, v: string) { rows = rows.filter(r => String(r[k]) <= v); return builder; },
      order(k: string) { rows.sort((a,b) => String(a[k]).localeCompare(String(b[k]))); return builder; },
      async maybeSingle() { return { data: rows[0] ?? null, error: null }; },
      async range(first: number, last: number) { return { data: failed && name === "eclub_kazanilan_puanlar" ? null : rows.slice(first,last + 1), error: failed && name === "eclub_kazanilan_puanlar" ? { message: "Okuma hatası" } : null }; },
    }; return builder;
  } };
  const json = (hata: string, status: number) => Response.json({ hata }, { status });
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: Response },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: authenticated ? { id: "auth" } : null }, error: null }) } }), createAdminClient: () => admin },
    "@/lib/eclub/kisiErisim": { eclubKisiErisimi: async () => ({ kisi: { kisi_id: "k1", rol: "eczaci" }, eczane_idler: ["e1"], firmalar: allowed ? [{ firma_id: f, aktif: true, eclub_aktif: true, eclub_store_aktif: false }] : [] }) },
    "@/lib/eclub/firmaGezinme": { eclubFirmaKapsami },
    "@/lib/utils/roller": { ECLUB_TUKETICI_ROLLERI: ["eczaci"] },
    "@/lib/uretim/rpc": { uuidGecerliMi: (s: string) => /^[a-f0-9-]{36}$/i.test(s) },
    "@/lib/utils/hataIsle": { rolHatasi: (s: string) => json(s,403), sunucuHatasi: () => json("Sunucu hatası",500), validasyonHatasi: (s: string) => json(s,400), yetkiHatasi: () => json("Yetkisiz",401) },
    "@/lib/eclub/performans": { eclubPerformansDonemi: () => d, eclubPerformansiHesapla },
  };
  const source = readFileSync("app/(panel)/eclub/api/performans/route.ts", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: { GET?: (r: Request) => Promise<Response> } = {};
  vm.runInNewContext(compiled, { exports, require: (id: string) => { if (!(id in modules)) throw new Error(id); return modules[id]; }, URL, Date, Set, Map, Error });
  return { get: (query = `firma_id=${f}&urun_id=${u}`) => exports.GET!(new Request(`http://localhost/eclub/api/performans?${query}`)), reads: () => reads };
}

test("oturumsuz istek veri okumadan reddedilir; firma ve ürün yetkisi sunucuda doğrulanır", async () => {
  const noAuth = api({ authenticated: false });
  assert.equal((await noAuth.get()).status, 401); assert.equal(noAuth.reads(),0);
  const noFirm = api({ allowed: false }); assert.equal((await noFirm.get()).status,403); assert.equal(noFirm.reads(),0);
  const bad = api(); assert.equal((await bad.get("firma_id=bad&urun_id=bad")).status,400); assert.equal(bad.reads(),0);
  assert.equal((await api({ product: false }).get()).status,403);
});
test("Store kapalıyken performans açıktır; başka eczanenin verisi döndürülmez", async () => {
  const res = await api().get(); assert.equal(res.status,200);
  assert.equal(res.headers.get("Cache-Control"),"private, no-store");
  const body = await res.json(); assert.equal(body.ozet.puan,10); assert.equal(body.ozet.uye,1);
  assert.equal(JSON.stringify(body).includes("other"),false);
});
test("1000 satır sınırı toplamı kırpmaz; okuma hatası sıfır performans diye sunulmaz", async () => {
  const res = await api({ count: 1001 }).get(); const body = await res.json();
  assert.equal(body.ozet.puan,10010); assert.equal(body.ozet.tamamlanan,1001);
  assert.equal((await api({ failed: true }).get()).status,500);
});
