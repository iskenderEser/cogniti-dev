import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";
import { GlobalWindow } from "happy-dom";
import * as performans from "@/lib/eclub/performans";
import { eclubPerformansGrafikSecenegi } from "@/lib/eclub/performansGrafik";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) if (!(key in globalThis)) {
  // @ts-expect-error Test DOM ortamı.
  globalThis[key] = win[key];
}
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
// @ts-expect-error React test ortamı.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const noopIcon = () => React.createElement("span");
const donem = performans.eclubPerformansDonemi(new Date("2026-10-11T12:00:00Z"));
const data = performans.eclubPerformansiHesapla({ donem, izlemeler: [{ izleme_id: "i", kisi_id: "k", yayin_id: "y", arac_turu: "podcast", izleme_bitis: donem.haftalar[1].baslangic, tamamlandi_mi: true }], puanlar: [{ kazanilan_puan_id: "p", izleme_id: "i", kisi_id: "k", yayin_id: "y", eczane_id: "e", puan: 80 }], kayiplar: [], baglar: [], eczaneIdler: ["e"], yayinIdler: ["y"], uyeler: [{ kisi_id: "k", ad: "Ayşe", soyad: "Yılmaz" }] });

test("grafik seçimi üye katkısını açar; otomatik güncelleme seçimleri korur ve ürün değişiminde eski veri gizlenir", async () => {
  const portal = document.createElement("div"), container = document.createElement("div"); document.body.append(portal,container);
  let urunId = "u1", fail = false; let calls = 0;
  const oldFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    calls++; assert.ok(url.includes(`urun_id=${urunId}`));
    return Response.json(fail ? { hata: "Okuma başarısız" } : data, { status: fail ? 500 : 200 });
  }) as typeof fetch;
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime, "react-dom": ReactDOM,
    "next/navigation": { useParams: () => ({ firma_id: "f" }) },
    "lucide-react": { BookOpen: noopIcon, CheckCircle2: noopIcon, Headphones: noopIcon, Image: noopIcon, Trophy: noopIcon, Users: noopIcon, Video: noopIcon },
    "@/lib/eclub/performans": performans,
    "@/lib/eclub/performansGrafik": { eclubPerformansGrafikSecenegi },
    "./EclubFirmaSecimi": { useEclubFirmaSecimi: () => ({ urunId, urunAdi: "Laropen", aksiyonAlani: portal }) },
    "./EclubKisiSayfa": { EclubKisiStat: (p: { etiket: string; deger: string }) => React.createElement("div",null,p.etiket+": "+p.deger) },
    "@/components/grafik/EChart": { default: (p: { onClick: (v: unknown) => void }) => React.createElement("div",null,
      ...performans.ECLUB_PERFORMANS_TURLERI.map((t,i) => React.createElement("button", { key:t.tur, onClick: () => p.onClick({ seriesId:t.tur, value:[2,i,t.tur === "podcast" ? 80 : 0] }) }, t.ad+" noktasını seç"))) },
    "@/components/ui/yenile-butonu": { YenileButonu: (p: { onYenile: () => void }) => React.createElement("button", { onClick: p.onYenile }, "Yenile") },
    "@/components/kontrol/SadeKontroller": { SadeTabloSecimi: () => null },
    "./eclub-performans.module.css": { default: new Proxy({}, { get: (_t,key) => String(key) }) },
  };
  const compiled = ts.transpileModule(readFileSync("components/eclub/EclubYayinPerformansi.tsx","utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports: { default?: React.ComponentType } = {};
  vm.runInNewContext(compiled,{ exports, require: (id: string) => { if (!(id in modules)) throw new Error(id); return modules[id]; }, AbortController, window, document, fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args), Date, Number, Error, encodeURIComponent });
  const root = createRoot(container);
  const draw = () => root.render(React.createElement(exports.default!));
  try {
    await React.act(async () => { draw(); });
    assert.match(container.textContent!,/Bu dönemde kazanılan puan80/);
    assert.equal(container.querySelector("select, [role=combobox]"),null);
    assert.equal(container.textContent!.includes("Yayın türü"),false);
    assert.match(container.querySelector("h3")!.textContent!,/Video · 2. Hafta/);
    await React.act(async () => { [...container.querySelectorAll("button")].find(b => b.textContent === "Podcast noktasını seç")!.click(); });
    assert.match(container.querySelector("h3")!.textContent!,/Podcast · 2. Hafta/);
    assert.match(container.querySelector('[role="rowgroup"]')!.textContent!,/Ayşe Yılmaz/);
    assert.match(container.querySelector('[role="rowgroup"]')!.textContent!,/80 puan/);
    for (const ad of ["Görsel", "Literatür", "Video"]) {
      await React.act(async () => { [...container.querySelectorAll("button")].find(b => b.textContent === ad+" noktasını seç")!.click(); });
      assert.equal(container.querySelector("h3")!.textContent,ad+" · 2. Hafta");
      assert.equal(container.querySelector('[role="rowgroup"] [role="row"]'),null);
    }
    await React.act(async () => { [...container.querySelectorAll("button")].find(b => b.textContent === "Podcast noktasını seç")!.click(); });
    await React.act(async () => { window.dispatchEvent(new win.Event("focus")); });
    assert.match(container.querySelector("h3")!.textContent!,/Podcast · 2. Hafta/);
    assert.equal(calls,2);
    assert.equal(portal.querySelector("button"),null);
    fail = true; urunId = "u2";
    await React.act(async () => { draw(); });
    assert.equal(container.querySelector('[role="rowgroup"] [role="row"]'),null);
    assert.match(container.querySelector('[role="alert"]')!.textContent!,/Okuma başarısız/);
    fail = false;
    await React.act(async () => { [...container.querySelectorAll("button")].find(b => b.textContent === "Tekrar dene")!.click(); });
    assert.equal(container.querySelector('[role="alert"]'),null);
    assert.match(container.querySelector("h3")!.textContent!,/Video · 2. Hafta/);
  } finally { await React.act(async () => { root.unmount(); }); portal.remove(); container.remove(); globalThis.fetch = oldFetch; }
});
