import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { GlobalWindow } from "happy-dom";
import * as takip from "@/lib/eclub/store/cekTakipOnbellek";
import * as vitrin from "@/lib/eclub/store/vitrinOnbellek";
import * as gezinme from "@/lib/eclub/firmaGezinme";
import * as tipler from "@/lib/eclub/store/eclubStoreTipler";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) if (!(key in globalThis)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: Reflect.get(win, key) });
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
const { createRoot } = await import("react-dom/client");

test("takip dönüşü beklemez; doğrulama sonrası bildirim okunur, iptal iki önbelleği yeniler ve yetki hatası veriyi kaldırır", async () => {
  const eskiFetch = globalThis.fetch, eskiSaat = Date.now;
  let saat = eskiSaat(); Date.now = () => saat;
  const talep: takip.CekTalebi = { firma_id: "f", talep_id: "t", firma_adi: "Firma", urun_id: "u", urun_adi: "Ürün", talep_eden_kisi_id: "k", toplanan_puan: 100, talep_edilen_cek_tl: 10, siparis_verildi_mi: false, siparis_adet: 0, siparis_mal_fazlasi: 0, durum: "beklemede", cek_kodu: null, created_at: "2026-10-11T12:00:00Z" };
  const payload = (durum: takip.CekTalebi["durum"] = "beklemede") => ({ firma: { firma_id: "f", firma_adi: "Firma", eclub_store_aktif: true }, talepler: [{ ...talep, durum }] });
  await takip.cekTakipOnbellegi.iste("takip-kisi:f", async () => payload());
  await vitrin.vitrinOnbellegi.iste("takip-kisi:f", async () => ({}));
  saat += 61_000;
  let tamamla!: (r: Response) => void;
  const calls: string[] = [], hatalar: string[] = [];
  globalThis.fetch = ((url: string, opts?: RequestInit) => {
    calls.push(`${opts?.method ?? "GET"} ${url}`);
    return opts?.method ? Promise.resolve(Response.json({ mesaj: "İptal edildi" })) : new Promise<Response>(r => { tamamla = r; });
  }) as typeof fetch;
  const empty = () => null;
  const children = (p: { children?: React.ReactNode }) => React.createElement("div", null, p.children);
  const hata = (s: string) => { hatalar.push(s); };
  const router = { replace: empty };
  const kullanici = { id: "takip-kisi", kimlik_turu: "eclub_kisi" };
  const searchParams = new URLSearchParams();
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime, "next/link": { default: children },
    "next/navigation": { useRouter: () => router, useSearchParams: () => searchParams },
    "lucide-react": Object.fromEntries(["Check", "CheckCircle2", "Clock3", "Copy", "Gift", "Store", "XCircle"].map(k => [k, empty])),
    "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici, yukleniyor: false }) },
    "@/components/HataMesaji": { useHataMesaji: () => ({ hata, basari: empty, mesajlar: [] }), HataMesajiContainer: empty },
    "@/components/eclub/EclubFirmaSecimi": { useEclubFirmaSecimi: () => ({ firmaId: "f", gomulu: true, urunId: "u" }) },
    "@/components/eclub/EclubKisiSayfa": { EclubKisiSayfa: children, EclubKisiBaslik: empty, EclubKisiStat: empty, EclubKisiYukleniyor: empty, EclubKisiBosDurum: (p: { baslik: string }) => React.createElement("span", null, p.baslik) },
    "@/components/eclub/EclubHediyeCekiBilgiPaneli": { default: empty },
    "@/components/eclub/EclubFirmaCekTakibiSkeleton": { default: () => React.createElement("span", null, "İskelet") },
    "@/lib/bildirimler/rozet": { bildirimRozetleriniYenile: empty },
    "@/lib/eclub/firmaGezinme": gezinme,
    "@/lib/eclub/store/eclubStoreTipler": tipler,
    "@/lib/eclub/store/cekTakipOnbellek": takip,
    "@/lib/eclub/store/vitrinOnbellek": vitrin,
  };
  const compiled = ts.transpileModule(readFileSync("app/(panel)/eclub/cek-taleplerim/page.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports: { default?: React.ComponentType } = {};
  vm.runInNewContext(compiled, { exports, require: (id: string) => { if (!(id in modules)) throw new Error(id); return modules[id]; }, fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args), Date, Error, Promise, encodeURIComponent });
  const container = document.createElement("div"), root = createRoot(container);
  const draw = () => root.render(React.createElement(exports.default!));
  try {
    await React.act(async () => draw());
    assert.match(container.textContent!, /Ürün/);
    assert.equal(container.querySelector("button")!.disabled, true);
    assert.equal(calls.some(s => s.startsWith("PUT")), false);
    await React.act(async () => tamamla(Response.json(payload())));
    assert.equal(container.querySelector("button")!.disabled, false);
    assert.equal(calls.filter(s => s.startsWith("PUT")).length, 1);
    await React.act(async () => container.querySelector("button")!.click());
    assert.ok(calls.includes("PATCH /eclub/api/cek-talepleri"));
    assert.equal(vitrin.vitrinOnbellegi.oku("takip-kisi:f"), null);
    assert.equal(takip.cekTakipOnbellegi.oku("takip-kisi:f"), null);
    await React.act(async () => tamamla(Response.json(payload("iptal"))));
    assert.equal(container.querySelector("button"), null);
    assert.equal(takip.cekTakipOnbellegi.oku("takip-kisi:f")?.talepler?.[0].durum, "iptal");
    assert.equal(takip.cekTakipOnbellegi.oku("baska-kisi:f"), null);
    await React.act(async () => root.render(null));
    await React.act(async () => draw());
    await React.act(async () => tamamla(Response.json({ hata: "Yetki yok" }, { status: 403 })));
    assert.doesNotMatch(container.textContent!, /Ürün/);
    assert.equal(takip.cekTakipOnbellegi.oku("takip-kisi:f"), null);
    assert.deepEqual(hatalar, ["Yetki yok"]);
  } finally { await React.act(async () => root.unmount()); globalThis.fetch = eskiFetch; Date.now = eskiSaat; }
});
