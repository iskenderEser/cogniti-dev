import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { Window } from "happy-dom";
import ts from "typescript";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import type { AuthKullanici } from "@/types/auth";
import type { PanelNavbarProps } from "@/components/panel/PanelNavbar";
import type { NavContext, NavGrup } from "@/components/panel/panelNav.config";

type KabukProps = {
  children: React.ReactNode;
  navbar: PanelNavbarProps;
  baglam: NavContext;
  gruplar: NavGrup[];
  badge: Record<string, number>;
};

const uye: AuthKullanici = {
  id: "uye-a", email: "uye@example.invalid", rol: "musteri", kimlik_turu: "musteri",
  ad: "Örnek", soyad: "Üye", adSoyad: "Örnek Üye", firma_id: null, telefon: null,
};

async function ortam() {
  const dom = new Window({ url: "http://localhost/eczanem" });
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent"] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  }
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const auth: { kullanici: AuthKullanici | null; yukleniyor: boolean; cikisYap: () => Promise<void> } = {
    kullanici: null, yukleniyor: true, cikisYap: async () => { cikislar++; },
  };
  let cikislar = 0;
  let kabuk: KabukProps | null = null;
  const yonlendirmeler: string[] = [];
  const istekler: string[] = [];
  const router = { replace: (yol: string) => yonlendirmeler.push(yol) };
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime,
    "next/navigation": { useRouter: () => router },
    "@/app/providers/AuthProvider": { useAuth: () => auth },
    "@/lib/utils/roller": { MUSTERI_ROLU },
    "./eczanemGezinme": { default: () => [] },
    "./eczanemUyeMenusu": {},
    "./EczanemProfilMenusu": { default: () => null },
    "@/components/panel/PanelKabugu": { default: (props: KabukProps) => {
      kabuk = props;
      return React.createElement("main", null, props.children,
        React.createElement("button", { onClick: props.navbar.onCikis }, "Çıkış"));
    } },
  };
  const exports: { default?: React.ComponentType<{ children: React.ReactNode; gruplar: NavGrup[] }> } = {};
  const compiled = ts.transpileModule(readFileSync("app/eczanem/_components/EczanemPanelBaglantisi.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, fetch: (adres: string) => {
    istekler.push(adres); throw new Error("Bu bağlantı veri isteği yapmamalı.");
  }, require: (id: string) => { assert.ok(id in modules, `Beklenmeyen bağımlılık: ${id}`); return modules[id]; } });
  assert.ok(exports.default);
  const Bilesen = exports.default;
  const gruplar: NavGrup[] = [{ baslik: "Eczanem", oglar: [{ etiket: "Puanlarım", path: "/eczanem/puanlarim", gate: () => true }] }];
  const container = dom.document.createElement("div");
  dom.document.body.append(container);
  const root = createRoot(container);
  return {
    dom, container, gruplar, yonlendirmeler, istekler,
    kabuk: () => { assert.ok(kabuk); return kabuk; },
    cikislar: () => cikislar,
    render: (kullanici: AuthKullanici | null, yukleniyor: boolean) => act(async () => {
      auth.kullanici = kullanici; auth.yukleniyor = yukleniyor;
      root.render(React.createElement(Bilesen, { gruplar }, React.createElement("h1", null, "Üye içeriği")));
    }),
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

test("üye bağlantısı kimlik ve menüyü ortak kabuğa verir; firma servislerini çağırmaz", async () => {
  const o = await ortam();
  try {
    await o.render(uye, false);
    const props = o.kabuk();
    assert.equal(props.navbar.adSoyad, "Örnek Üye");
    assert.equal(props.navbar.anaSayfaYolu, "/eczanem");
    assert.equal(props.gruplar, o.gruplar);
    assert.equal(props.baglam.kimlikTuru, "musteri");
    assert.equal(props.baglam.eczanemAcik, true);
    for (const flag of ["storeAcik", "ccAcik", "eclubAcik", "eclubStoreAcik"] as const) assert.equal(props.baglam[flag], false);
    assert.equal(Object.keys(props.badge).length, 0);
    assert.match(o.container.textContent!, /Üye içeriği/);
    assert.equal(o.yonlendirmeler.length, 0);
    assert.equal(o.istekler.length, 0);
    await act(async () => { o.container.querySelector<HTMLButtonElement>("button")!.click(); });
    assert.equal(o.cikislar(), 1);
  } finally { await o.kapat(); }
});

test("yüklenirken içerik açılmaz; oturumsuz ve üye olmayan hesapların mevcut yönlendirmeleri korunur", async () => {
  const o = await ortam();
  try {
    await o.render(null, true);
    assert.ok(o.container.querySelector('[role="status"]'));
    assert.doesNotMatch(o.container.textContent!, /Üye içeriği/);
    assert.equal(o.yonlendirmeler.length, 0);
    await o.render(null, false);
    assert.equal(o.yonlendirmeler.at(-1), "/login");
    assert.equal(o.container.querySelector("main"), null);
    for (const kimlik_turu of ["kullanici", "eclub_kisi"] as const) {
      await o.render({ ...uye, kimlik_turu }, false);
      assert.equal(o.yonlendirmeler.at(-1), "/ana-sayfa");
      assert.equal(o.container.querySelector("main"), null, "Rol adı üye olsa da kimlik düzlemi doğrulanmalı");
    }
    assert.equal(o.istekler.length, 0);
  } finally { await o.kapat(); }
});

test("kimlik değişiminde önceki üyenin bilgisi tutulmaz ve yüklenme sırasında gizlenir", async () => {
  const o = await ortam();
  try {
    await o.render(uye, false);
    await o.render(uye, true);
    assert.equal(o.container.querySelector("main"), null);
    await o.render({ ...uye, id: "uye-b", adSoyad: "İkinci Üye", email: "ikinci@example.invalid" }, false);
    assert.equal(o.kabuk().navbar.adSoyad, "İkinci Üye");
    assert.equal(o.kabuk().navbar.email, "ikinci@example.invalid");
    assert.equal(o.istekler.length, 0);
  } finally { await o.kapat(); }
});
