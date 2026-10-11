import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { GlobalWindow } from "happy-dom";
import { useEclubPanel } from "@/app/(panel)/eclub/panel/_hooks/useEclubPanel";
import { panelOnbelleginiSil } from "@/lib/eclub/anaSayfaPanelOnbellek";
import * as gezinme from "@/lib/eclub/firmaGezinme";
import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";
import * as banner from "@/lib/eclub/firmaBannerOnbellek";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) if (!(key in globalThis)) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: Reflect.get(win, key) });
}
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
const { createRoot } = await import("react-dom/client");

test("firma bilgisi beklenirken yayın ve banner başlar; süresi dolmuş önbellekli dönüş ağ beklemez ve arka planda doğrulanır", async () => {
  const calls: string[] = [];
  let release: (() => void) | undefined;
  const bekleme = new Promise<void>(resolve => { release = resolve; });
  const eskiFetch = globalThis.fetch;
  const eskiSaat = Date.now;
  let saat = eskiSaat();
  Date.now = () => saat;
  globalThis.fetch = (async (url: string) => {
    calls.push(url);
    if (url.startsWith("/eclub/firmalar/api")) {
      await bekleme;
      return Response.json({ firma: { firma_id: "f1", firma_adi: "Firma", eclub_store_aktif: true }, urunler: [{ urun_id: "u1", urun_adi: "Ürün" }] });
    }
    if (url.startsWith("/eclub/api/bannerlar")) return Response.json({ bannerlar: [{ sira: 1, url: "https://example.com/banner.webp" }] });
    assert.equal(url, "/eclub/panel/api?firma=firma");
    return Response.json({ oneriler: [], firma_ozetleri: [], ozet: {} });
  }) as typeof fetch;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const empty = () => null;
  const children = (p: { children?: React.ReactNode }) => React.createElement("div", null, p.children);
  const hata = () => undefined;
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime,
    "next/dynamic": { default: (yukle: () => Promise<unknown>) => String(yukle).includes("/store/page") ? () => React.createElement("span", null, "Çekler hazır") : String(yukle).includes("/cek-taleplerim/page") ? () => React.createElement("span", null, "Takip hazır") : empty },
    "next/link": { default: children },
    "next/navigation": { useParams: () => ({ firma_id: "firma" }), usePathname: () => "/eclub/firma/firma/yayinlar", useRouter: () => ({ replace: empty, push: empty }), useSearchParams: () => new URLSearchParams() },
    "lucide-react": { ArrowLeft: empty, Building2: empty, CheckCircle2: empty, Clock3: empty, Trophy: empty },
    "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici: { id: "hiz-test-kisi", kimlik_turu: "eclub_kisi" }, yukleniyor: false }) },
    "@/components/HataMesaji": { useHataMesaji: () => ({ mesajlar: [], hata }), HataMesajiContainer: empty },
    "./EclubKisiSayfa": { EclubKisiSayfa: children, EclubKisiBaslik: empty, EclubKisiStat: empty, EclubKisiYukleniyor: empty, EclubKisiBosDurum: empty },
    "./EclubFirmaSecimi": { EclubFirmaSecimi: React.createContext(null) },
    "@/components/kontrol/SadeKontroller": { SadeKontrolGrubu: children, SadeKontrolButonu: children },
    "@/lib/eclub/firmaGezinme": gezinme,
    "@/lib/eclub/firmaUrunSecimi": { eclubFirmaUrunSecimineAboneOl: () => empty, eclubFirmaUrunSeciminiOku: () => null, eclubFirmaUrunSeciminiYaz: empty },
    "@/app/(panel)/eclub/panel/_hooks/useEclubPanel": { useEclubPanel },
    "@/app/(panel)/eclub/cek-taleplerim/page": { default: empty },
    "@/app/(panel)/eclub/store/page": { default: empty },
    "@/app/(panel)/eclub/ana-sayfa/page": { default: () => React.createElement("span", null, "Yayınlar hazır") },
    "@/lib/panel/sayfaOkumaOnbellegi": { sayfaOkumaOnbellegiOlustur },
    "@/lib/eclub/firmaBannerOnbellek": banner,
    "./EclubYayinPerformansi": { default: () => React.createElement("span", null, "Performans hazır") },
    "./EclubFirmaCekTakibiSkeleton": { default: () => React.createElement("span", null, "Takip iskeleti") },
    "./EclubFirmaCekTalebiSkeleton": { default: () => React.createElement("span", null, "Çek iskeleti") },
    "./EclubFirmaPerformansSkeleton": { default: () => React.createElement("span", null, "Performans iskeleti") },
    "./EclubFirmaYayinlarSkeleton": { default: () => React.createElement("span", null, "İskelet") },
  };
  const source = readFileSync("components/eclub/EclubFirmaCalismaAlani.tsx", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports: { default?: React.ComponentType<{ sekme: string }> } = {};
  vm.runInNewContext(compiled, { exports, require: (id: string) => { if (!(id in modules)) throw new Error(id); return modules[id]; }, URLSearchParams, encodeURIComponent, fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args), Array, Error });
  try {
    await React.act(async () => { root.render(React.createElement(exports.default!, { sekme: "yayinlar" })); });
    assert.ok(calls.includes("/eclub/firmalar/api?firma=firma"));
    assert.ok(calls.includes("/eclub/panel/api?firma=firma"));
    assert.ok(calls.includes("/eclub/api/bannerlar?firma=firma"));
    assert.equal(container.textContent, "İskelet");
    await React.act(async () => { release!(); await bekleme; });
    assert.match(container.textContent!, /Yayınlar hazır/);
    await React.act(async () => { root.render(null); });
    calls.length = 0;
    saat += 61_000;
    const donusBekleme = new Promise<void>(resolve => { release = resolve; });
    const ilkFetch = globalThis.fetch;
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      await donusBekleme;
      return ilkFetch(...args);
    }) as typeof fetch;
    await React.act(async () => { root.render(React.createElement(exports.default!, { sekme: "yayinlar" })); });
    assert.match(container.textContent!, /Yayınlar hazır/);
    assert.deepEqual(calls, []);
    assert.equal(banner.firmaBannerOnbelleginiOku("hiz-test-kisi", "firma")?.[0].url, "https://example.com/banner.webp");
    await React.act(async () => { release!(); await donusBekleme; });
    assert.deepEqual(calls.sort(), ["/eclub/firmalar/api?firma=firma", "/eclub/panel/api?firma=firma", "/eclub/api/bannerlar?firma=firma"].sort());
    calls.length = 0;
    await React.act(async () => root.render(React.createElement(exports.default!, { sekme: "performans" })));
    assert.match(container.textContent!, /Performans hazır/);
    assert.deepEqual(calls, ["/eclub/firmalar/api?firma=firma"]);
    panelOnbelleginiSil("hiz-test-kisi:firma:firma");
    let paneliTamamla!: (r: Response) => void;
    globalThis.fetch = ((url: string) => url.startsWith("/eclub/panel/api")
      ? new Promise<Response>(r => { paneliTamamla = r; }) : ilkFetch(url)) as typeof fetch;
    await React.act(async () => root.render(React.createElement(exports.default!, { sekme: "hediye-cekleri" })));
    assert.match(container.textContent!, /Çekler hazır/);
    assert.ok(container.querySelector('[aria-label="Firma özeti yükleniyor"]'));
    await React.act(async () => paneliTamamla(Response.json({ oneriler: [], firma_ozetleri: [], ozet: {} })));
    panelOnbelleginiSil("hiz-test-kisi:firma:firma");
    await React.act(async () => root.render(null));
    await React.act(async () => root.render(React.createElement(exports.default!, { sekme: "cek-talepleri" })));
    assert.match(container.textContent!, /Takip hazır/);
    assert.ok(container.querySelector('[aria-label="Firma özeti yükleniyor"]'));
    await React.act(async () => paneliTamamla(Response.json({ oneriler: [], firma_ozetleri: [], ozet: {} })));


    await React.act(async () => root.render(null));
    globalThis.fetch = (async (url: string) => url.startsWith("/eclub/firmalar/api")
      ? Response.json({ hata: "Yetki kaldırıldı" }, { status: 403 })
      : url.startsWith("/eclub/api/bannerlar") ? Response.json({ bannerlar: [] }) : Response.json({ oneriler: [], ozet: {} })) as typeof fetch;
    await React.act(async () => root.render(React.createElement(exports.default!, { sekme: "yayinlar" })));
    assert.doesNotMatch(container.textContent!, /Yayınlar hazır/);
    assert.match(container.textContent!, /Firmalara Dön/);
  } finally {
    release!();
    await React.act(async () => root.unmount());
    container.remove();
    globalThis.fetch = eskiFetch;
    Date.now = eskiSaat;
  }
});
