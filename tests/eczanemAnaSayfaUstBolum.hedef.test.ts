import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as icons from "lucide-react";
import { Window } from "happy-dom";
import ts from "typescript";

async function ortam() {
  const dom = new Window({ url: "http://localhost/eczanem" });
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const requests: Array<{ adres: string; signal: AbortSignal; resolve: (value: { ok: boolean; json: () => Promise<unknown> }) => void }> = [];
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
    "./EclubFirmaSecimi": { useEclubFirmaSecimi: () => ({ gomulu: false }) },
    "@/components/rehber/SayfaRehberi": { default: () => null },
    "./EclubKisiBanner": { default: () => null },
    "@/components/ui/sayfa-yenile-basligi": { SayfaYenileBasligi: ({ baslik, aciklama, aksiyon, altAksiyon }: Record<string, React.ReactNode>) => React.createElement("header", null, baslik, aciklama, aksiyon, altAksiyon) },
    "@/components/ui/tarih-pill": { TarihPill: () => React.createElement("time", null, "20.10.2026") },
    "@/components/ui/yenile-butonu": { YenileButonu: ({ yenileniyor, onYenile }: { yenileniyor: boolean; onYenile: () => void }) => React.createElement("button", { disabled: yenileniyor, "aria-label": "Yenile", onClick: onYenile }, "Yenile") },
    "@/components/eclub/BannerRafi": { BannerRafi: ({ bannerlar, anaSayfa }: { bannerlar: Array<{ url: string }>; anaSayfa: boolean }) => React.createElement("section", { "data-banner": anaSayfa }, ...bannerlar.map(b => React.createElement("img", { key: b.url, src: b.url }))) },
  };
  const yukle = (path: string) => {
    const exports: Record<string, React.ComponentType<Record<string, unknown>>> = {};
    const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, { exports, AbortController, URLSearchParams, fetch: (adres: string, options: { signal: AbortSignal }) => new Promise(resolve => requests.push({ adres, signal: options.signal, resolve })), require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
    return exports;
  };
  modules["@/components/eclub/EclubKisiSayfa"] = yukle("components/eclub/EclubKisiSayfa.tsx");
  modules["./EczanemAnaSayfaSkeleton"] = yukle("app/eczanem/_components/EczanemAnaSayfaSkeleton.tsx");
  const Component = yukle("app/eczanem/_components/EczanemAnaSayfaUstBolum.tsx").default;
  const container = dom.document.createElement("div"); dom.document.body.append(container);
  const root = createRoot(container);
  let yenilemeler = 0;
  const props = { firmaId: undefined as string | undefined, eczaneId: undefined as string | undefined, kullaniciId: "a", ad: "Örnek", yeniIcerikler: 2, tamamlananlar: 1, iceriklerHazir: true, yenileniyor: false, yenilemeAnahtari: 0, onYenile: () => { props.yenilemeAnahtari++; yenilemeler++; } };
  const render = () => act(async () => root.render(React.createElement(Component, props)));
  const yanitla = (index: number, veri: unknown, ok = true) => act(async () => { requests[index].resolve({ ok, json: async () => veri }); });
  return { dom, container, requests, props, render, yanitla, yenilemeler: () => yenilemeler, kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); } };
}

test("üst bölüm gerçek E-Club stat kartlarını kullanır; kullanılabilir puan mevcut eczane/ürün bakiyelerinden gelir", async () => {
  const o = await ortam();
  try {
    await o.render();
    assert.match(o.container.textContent!, /Merhaba Örnek, 👋/);
    assert.equal(o.container.querySelectorAll("article").length, 3);
    assert.equal(o.container.querySelector('section[aria-label="Eczanem özetiniz"]')?.getAttribute("aria-busy"), "true");
    assert.equal(o.container.querySelectorAll("article")[2].querySelector(".tabular-nums")?.textContent, "—");
    assert.deepEqual(o.requests.map(r => r.adres), ["/eczanem/api/puanlar", "/eczanem/api/bannerlar"]);
    await o.yanitla(0, { eczaneler: [{ urunler: [{ kullanilabilir_puan: 100 }, { kullanilabilir_puan: 25 }] }, { urunler: [{ kullanilabilir_puan: 200 }] }] });
    await o.yanitla(1, { bannerlar: [{ sira: 1, url: "https://example.invalid/platform.png" }] });
    assert.deepEqual([...o.container.querySelectorAll("article .tabular-nums")].map(el => el.textContent), ["2", "1", "325"]);
    assert.ok(o.container.querySelector('section[aria-label="Eczanem özetiniz"]')!.classList.contains("sm:grid-cols-3"));
    assert.equal(o.container.querySelector('section[aria-label="Eczanem özetiniz"]')?.getAttribute("aria-busy"), "false");
    assert.ok(o.container.querySelector('[data-banner="true"] img'));
    const elements = [...o.container.children];
    assert.ok(elements.indexOf(o.container.querySelector("header")!) < elements.indexOf(o.container.querySelector("[data-banner]")!));
    assert.ok(elements.indexOf(o.container.querySelector("[data-banner]")!) < elements.indexOf(o.container.querySelector('section[aria-label="Eczanem özetiniz"]')!));
  } finally { await o.kapat(); }
});

test("puan hatası sıfır bakiye sayılmaz; banner yüklenebilir ve Yenile iki okumayı tekrar başlatır", async () => {
  const o = await ortam();
  try {
    await o.render();
    await o.yanitla(0, { hata: "Puan alınamadı" }, false);
    await o.yanitla(1, { bannerlar: [] });
    assert.match(o.container.querySelector('[role="alert"]')!.textContent!, /Puan özeti yüklenemedi/);
    assert.equal(o.container.querySelectorAll("article .tabular-nums")[2].textContent, "—");
    await act(async () => o.container.querySelector<HTMLButtonElement>('[aria-label="Yenile"]')!.click());
    await o.render();
    assert.equal(o.yenilemeler(), 1);
    assert.equal(o.requests.length, 4);
    await o.yanitla(2, { eczaneler: [] });
    await o.yanitla(3, { bannerlar: [] });
    assert.equal(o.container.querySelectorAll("article .tabular-nums")[2].textContent, "0");
    assert.equal(o.container.querySelector('[role="alert"]'), null);
  } finally { await o.kapat(); }
});

test("hesap değişince önceki bakiye/banner gizlenir; geciken önceki yanıt yeni hesaba yazılmaz", async () => {
  const o = await ortam();
  try {
    await o.render();
    await o.yanitla(0, { eczaneler: [{ urunler: [{ kullanilabilir_puan: 450 }] }] });
    o.props.kullaniciId = "b"; o.props.ad = "İkinci";
    await o.render();
    assert.equal(o.requests[0].signal.aborted, true);
    assert.equal(o.container.querySelectorAll("article .tabular-nums")[2].textContent, "—");
    await o.yanitla(1, { bannerlar: [{ sira: 1, url: "https://example.invalid/eski.png" }] });
    assert.equal(o.container.querySelector("img"), null);
    await o.yanitla(2, { eczaneler: [] });
    await o.yanitla(3, { bannerlar: [] });
    assert.equal(o.container.querySelectorAll("article .tabular-nums")[2].textContent, "0");
    assert.match(o.container.textContent!, /Merhaba İkinci/);
  } finally { await o.kapat(); }
});

test("geçersiz bakiye ve banner hatası ayrı görünür; içerikler henüz yüklenmediyse sayılar uydurulmaz", async () => {
  const o = await ortam();
  try {
    o.props.iceriklerHazir = false;
    await o.render();
    await o.yanitla(0, { eczaneler: [{ urunler: [{ kullanilabilir_puan: -20 }] }] });
    await o.yanitla(1, {}, false);
    assert.deepEqual([...o.container.querySelectorAll("article .tabular-nums")].map(el => el.textContent), ["—", "—", "—"]);
    assert.match(o.container.querySelector('[role="alert"]')!.textContent!, /Puan özeti yüklenemedi/);
    assert.match(o.container.querySelector('[role="alert"]')!.textContent!, /Ana sayfa görselleri yüklenemedi/);
  } finally { await o.kapat(); }
});

test("yenileme sırasında aynı hesabın puanı ve bannerı yerinde kalır", async () => {
  const o = await ortam();
  try {
    await o.render();
    await o.yanitla(0, { eczaneler: [{ urunler: [{ kullanilabilir_puan: 80 }] }] });
    await o.yanitla(1, { bannerlar: [{ sira: 1, url: "https://example.invalid/banner.png" }] });
    const banner = o.container.querySelector("img");
    o.props.yenilemeAnahtari++;
    await o.render();
    assert.equal(o.container.querySelector("img"), banner);
    assert.equal(o.container.querySelectorAll("article .tabular-nums")[2].textContent, "80");
    assert.equal(o.container.querySelector('section[aria-label="Eczanem özetiniz"]')!.getAttribute("aria-busy"), "true");
    await o.yanitla(2, { eczaneler: [{ urunler: [{ kullanilabilir_puan: 95 }] }] });
    await o.yanitla(3, { bannerlar: [] });
    assert.equal(o.container.querySelectorAll("article .tabular-nums")[2].textContent, "95");
    assert.equal(o.container.querySelector("img"), null);
  } finally { await o.kapat(); }
});

test("firma değişince önceki banner gizlenir; eski yanıt yeni kapsamı ezmez ve ürün değişimi okuma başlatmaz", async () => {
  const o = await ortam();
  try {
    await o.render();
    await o.yanitla(0, { eczaneler: [] });
    await o.yanitla(1, { bannerlar: [{ sira: 1, url: "https://example.invalid/platform.png" }] });
    o.props.firmaId = "firma-a"; o.props.eczaneId = "eczane-a"; await o.render();
    assert.equal(o.container.querySelector("img"), null);
    assert.equal(o.requests.length, 3, "Puan isteği kapsam değişiminde tekrarlanmaz");
    assert.equal(o.requests[2].adres, "/eczanem/api/bannerlar?firma_id=firma-a&eczane_id=eczane-a");
    o.props.firmaId = "firma-b"; await o.render();
    assert.equal(o.requests[2].signal.aborted, true);
    await o.yanitla(3, { bannerlar: [{ sira: 1, url: "https://example.invalid/firma-b.png" }] });
    await o.yanitla(2, { bannerlar: [{ sira: 1, url: "https://example.invalid/eski.png" }] });
    assert.equal(o.container.querySelector("img")!.getAttribute("src"), "https://example.invalid/firma-b.png");
    await o.render(); assert.equal(o.requests.length, 4);
    o.props.firmaId = undefined; o.props.eczaneId = undefined; await o.render();
    assert.equal(o.requests[4].adres, "/eczanem/api/bannerlar");
    await o.yanitla(4, { bannerlar: [] }); assert.equal(o.container.querySelector("[data-banner]"), null);
  } finally { await o.kapat(); }
});
