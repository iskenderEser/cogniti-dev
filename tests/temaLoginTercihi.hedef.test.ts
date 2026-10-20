import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { Window } from "happy-dom";
import ts from "typescript";
import * as temalar from "@/lib/tema/temalar";

type TestKullanicisi = { id: string; rol?: string; kimlik_turu?: string };

async function temaOrtami(kayitliTemalar: Record<string, temalar.Tema> = {}, tarayiciTemasi?: temalar.Tema,
  endpoint?: (id: string, init?: RequestInit) => Promise<Response>) {
  const dom = new Window({ url: "http://localhost" });
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent"] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  }
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  if (tarayiciTemasi) dom.localStorage.setItem(temalar.TARAYICI_TEMA_ANAHTARI, tarayiciTemasi);
  const { createRoot } = await import("react-dom/client");
  const auth: { kullanici: TestKullanicisi | null; yukleniyor: boolean } = { kullanici: null, yukleniyor: false };
  const kayitlar = new Map<string, temalar.Tema>(Object.entries(kayitliTemalar));
  const yazmalar: { kullanici_id: string; tema: temalar.Tema }[] = [];
  const uyarilar: string[] = [];
  dom.alert = (mesaj?: unknown) => { uyarilar.push(String(mesaj)); };
  let getBeklet = false;
  const bekleyenler: { id: string; coz: (response: Response) => void; veri: { kullanici_id: string; tema: temalar.Tema | null } }[] = [];
  const modules: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "@/lib/tema/temalar": temalar,
    "@/app/providers/AuthProvider": { useAuth: () => auth },
  };
  const exports: Record<string, unknown> = {};
  const source = ts.transpileModule(readFileSync("app/providers/TemaProvider.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports, window: dom, document: dom.document,
    require: (id: string) => { assert.ok(id in modules, id); return modules[id]; },
    fetch: async (_url: string, init?: RequestInit) => {
      if (endpoint) {
        assert.ok(auth.kullanici);
        return endpoint(auth.kullanici.id, init);
      }
      if (init?.method === "PUT") {
        const body = JSON.parse(String(init.body)) as { kullanici_id: string; tema: temalar.Tema };
        assert.equal(body.kullanici_id, auth.kullanici?.id);
        kayitlar.set(body.kullanici_id, body.tema);
        yazmalar.push(body);
        return Response.json(body);
      }
      assert.ok(auth.kullanici);
      const veri = { kullanici_id: auth.kullanici.id, tema: kayitlar.get(auth.kullanici.id) ?? null };
      if (getBeklet) return new Promise<Response>(coz => bekleyenler.push({ id: veri.kullanici_id, coz, veri }));
      return Response.json(veri);
    },
  });
  const mod = exports as unknown as {
    TemaProvider: React.ComponentType<{ children: React.ReactNode }>;
    useTema: () => { tema: temalar.Tema; temaDegistir: (tema: temalar.Tema) => void };
  };
  function Probe() {
    const { tema, temaDegistir } = mod.useTema();
    return React.createElement("div", { "data-secili": tema },
      ...(["mavi", "yesil"] as const).map(secim => React.createElement("button", {
        key: secim, "data-tema": secim, onClick: () => temaDegistir(secim),
      }, secim)));
  }
  const container = dom.document.createElement("div");
  dom.document.body.append(container);
  let root = createRoot(container);
  const render = () => act(async () => { root.render(React.createElement(mod.TemaProvider, null, React.createElement(Probe))); });
  return {
    kayitlar, yazmalar, uyarilar,
    secili: () => dom.document.documentElement.getAttribute("data-tema"),
    tarayici: () => dom.localStorage.getItem(temalar.TARAYICI_TEMA_ANAHTARI),
    eskiTarayiciKaydiEkle: (tema: temalar.Tema) => dom.localStorage.setItem(temalar.MISAFIR_TEMA_ANAHTARI, tema),
    giris: async (kullanici: TestKullanicisi | null, yukleniyor = false) => { auth.kullanici = kullanici; auth.yukleniyor = yukleniyor; await render(); },
    sec: (tema: temalar.Tema) => act(async () => { container.querySelector<HTMLButtonElement>(`button[data-tema="${tema}"]`)!.click(); }),
    getBeklet: () => { getBeklet = true; },
    yanitla: (id: string, status = 200) => act(async () => {
      const indeks = bekleyenler.findIndex(bekleyen => bekleyen.id === id);
      assert.notEqual(indeks, -1, `Bekleyen tema okuması yok: ${id}`);
      const [bekleyen] = bekleyenler.splice(indeks, 1);
      bekleyen.coz(Response.json(bekleyen.veri, { status }));
    }),
    yenidenAc: async () => {
      await act(async () => root.unmount());
      dom.document.documentElement.setAttribute("data-tema", "mavi");
      root = createRoot(container);
      await render();
    },
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

test("açık yeşil seçimi tarayıcı açılışında korunur; diğer hesabın kendi rengine aktarılmaz", async () => {
  const ortam = await temaOrtami({ "hesap-a": "mavi", "hesap-b": "mavi" });
  try {
    await ortam.giris({ id: "hesap-a" });
    await ortam.sec("yesil");
    assert.equal(ortam.secili(), "yesil");
    assert.equal(ortam.kayitlar.get("hesap-a"), "yesil");
    assert.equal(ortam.tarayici(), "yesil");
    await ortam.giris(null);
    assert.equal(ortam.secili(), "yesil");
    await ortam.yenidenAc();
    assert.equal(ortam.secili(), "yesil");
    await ortam.giris({ id: "hesap-b" });
    assert.equal(ortam.secili(), "mavi");
    assert.equal(ortam.kayitlar.get("hesap-a"), "yesil");
    assert.equal(ortam.kayitlar.get("hesap-b"), "mavi");
    assert.deepEqual(ortam.yazmalar, [{ kullanici_id: "hesap-a", tema: "yesil" }]);
    await ortam.giris(null);
    assert.equal(ortam.secili(), "yesil", "diğer hesabın okunmuş mavisi tarayıcı seçimini değiştirmemeli");
    await ortam.giris({ id: "hesap-b" });
    await ortam.sec("mavi");
    await ortam.giris(null);
    await ortam.yenidenAc();
    assert.equal(ortam.secili(), "mavi", "son açık mavi seçimi de tarayıcı açılışında korunmalı");
  } finally { await ortam.kapat(); }
});

function gercekTemaApi(kayitlar: Map<string, Record<string, unknown>>) {
  let kimlik: string | null = null;
  const yazmalar: string[] = [];
  const modules: Record<string, unknown> = {
    "@/lib/tema/temalar": temalar,
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({
        data: { user: kimlik ? { id: kimlik, user_metadata: kayitlar.get(kimlik) ?? {} } : null }, error: null,
      }) } }),
      createAdminClient: () => ({ auth: { admin: { updateUserById: async (id: string, veri: { user_metadata: Record<string, unknown> }) => {
        assert.equal(id, kimlik);
        const metadata = { ...kayitlar.get(id), ...veri.user_metadata };
        kayitlar.set(id, metadata);
        yazmalar.push(id);
        return { data: { user: { id, user_metadata: metadata } }, error: null };
      } } } }),
    },
  };
  const exports: { GET?: () => Promise<Response>; PUT?: (request: Request) => Promise<Response> } = {};
  const source = ts.transpileModule(readFileSync("app/tema/api/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, Response, require: (id: string) => {
    assert.ok(id in modules, id);
    return modules[id];
  } });
  return {
    yazmalar,
    get: (id: string | null) => { kimlik = id; return exports.GET!(); },
    put: (id: string | null, veri: unknown) => {
      kimlik = id;
      return exports.PUT!(new Request("http://localhost/tema/api", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(veri),
      }));
    },
    fetch: (id: string, init?: RequestInit) => {
      kimlik = id;
      return init?.method === "PUT"
        ? exports.PUT!(new Request("http://localhost/tema/api", init)) : exports.GET!();
    },
  };
}

test("gerçek API eski yeşil kayıtları geçersiz sayar; yalnız yeni açık seçim sonraki girişte geçerlidir", async () => {
  const kayitlar = new Map<string, Record<string, unknown>>([
    ["utt", { hb_tema: "yesil", diger_tercih: true }],
    ["eczaci", { hb_tema: "yesil" }],
    ["uye", { hb_tema: "yesil" }],
  ]);
  const api = gercekTemaApi(kayitlar);
  for (const id of kayitlar.keys()) {
    const response = await api.get(id);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).tema, null, `${id}: eski yeşil tekrar uygulanmamalı`);
  }
  assert.equal(api.yazmalar.length, 0);
  const yaz = await api.put("utt", { kullanici_id: "utt", tema: "yesil" });
  assert.equal(yaz.status, 200);
  assert.equal(kayitlar.get("utt")?.hb_tema_surumu, 2);
  assert.equal(kayitlar.get("utt")?.diger_tercih, true);
  assert.equal((await (await api.get("utt")).json()).tema, "yesil");
  assert.equal((await (await api.get("uye")).json()).tema, null);
});

test("gerçek API başka hesabın tercihini değiştirmeyi ve oturumsuz erişimi reddeder", async () => {
  const kayitlar = new Map<string, Record<string, unknown>>([["utt", { hb_tema: "yesil" }]]);
  const api = gercekTemaApi(kayitlar);
  assert.equal((await api.put("utt", { kullanici_id: "uye", tema: "yesil" })).status, 409);
  assert.equal((await api.get(null)).status, 401);
  assert.equal((await api.put(null, { kullanici_id: "utt", tema: "yesil" })).status, 401);
  assert.equal(api.yazmalar.length, 0);
});

for (const id of ["eczaci", "uye"]) {
  test(`gerçek sağlayıcı ve API: eski yeşili kayıtlı ${id} mavi açılır; UTT'nin yeni seçimi bunu değiştirmez`, async () => {
    const kayitlar = new Map<string, Record<string, unknown>>([
      ["utt", { hb_tema: "yesil" }], [id, { hb_tema: "yesil" }],
    ]);
    const api = gercekTemaApi(kayitlar);
    const ortam = await temaOrtami({}, "yesil", api.fetch);
    try {
      await ortam.giris({ id: "utt" });
      assert.equal(ortam.secili(), "mavi", "UTT'nin de eski yeşili geçersiz olmalı");
      await ortam.sec("yesil");
      await ortam.giris(null);
      await ortam.giris({ id });
      assert.equal(ortam.secili(), "mavi");
      await ortam.yenidenAc();
      assert.equal(ortam.secili(), "mavi", "yenileme eski yeşili geri getirmemeli");
      assert.deepEqual(api.yazmalar, ["utt"]);
      await ortam.sec("yesil");
      await ortam.yenidenAc();
      assert.equal(ortam.secili(), "yesil", "yeni açık seçim kalıcı olmalı");
      assert.equal(kayitlar.get(id)?.hb_tema_surumu, 2);
      assert.deepEqual(api.yazmalar, ["utt", id]);
    } finally { await ortam.kapat(); }
  });
}

for (const kisi of [
  { id: "eczaci", rol: "eczaci", kimlik_turu: "eclub_kisi" },
  { id: "uye", rol: "musteri", kimlik_turu: "eczanem_musteri" },
]) {
  test(`UTT'nin yeşil seçimi tercihi olmayan ${kisi.id} hesabına taşınmaz veya otomatik yazılmaz`, async () => {
    const ortam = await temaOrtami({ utt: "mavi" }, "yesil");
    try {
      await ortam.giris({ id: "utt", rol: "utt", kimlik_turu: "kullanici" });
      await ortam.sec("yesil");
      await ortam.giris(null);
      assert.equal(ortam.secili(), "yesil");
      await ortam.giris(kisi);
      assert.equal(ortam.secili(), "mavi");
      assert.equal(ortam.tarayici(), "yesil", "hesabın varsayılan mavisi tarayıcı seçimini değiştirmemeli");
      assert.equal(ortam.kayitlar.has(kisi.id), false);
      assert.deepEqual(ortam.yazmalar, [{ kullanici_id: "utt", tema: "yesil" }]);
      await ortam.sec("yesil");
      assert.equal(ortam.kayitlar.get(kisi.id), "yesil");
      assert.equal(ortam.yazmalar.length, 2, "yalnız açık seçim hesabın tercihini yazmalı");
    } finally { await ortam.kapat(); }
  });
}

test("hesap değişiminde önceki yeşil gösterilmez; geciken kendi tercihi okununca uygulanır", async () => {
  const ortam = await temaOrtami({ utt: "yesil", eczaci: "yesil" }, "yesil");
  try {
    await ortam.giris({ id: "utt" });
    ortam.getBeklet();
    await ortam.giris({ id: "eczaci" });
    assert.equal(ortam.secili(), "mavi");
    assert.equal(ortam.tarayici(), "yesil");
    await ortam.yanitla("eczaci");
    assert.equal(ortam.secili(), "yesil");
    assert.equal(ortam.yazmalar.length, 0);
  } finally { await ortam.kapat(); }
});

test("önceki hesabın geciken yanıtı yeni hesabın rengini değiştirmez", async () => {
  const ortam = await temaOrtami({ utt: "yesil" }, "yesil");
  try {
    ortam.getBeklet();
    await ortam.giris({ id: "utt" });
    await ortam.giris({ id: "uye" });
    await ortam.yanitla("uye");
    await ortam.yanitla("utt");
    assert.equal(ortam.secili(), "mavi");
    assert.equal(ortam.kayitlar.has("uye"), false);
    assert.equal(ortam.yazmalar.length, 0);
  } finally { await ortam.kapat(); }
});

test("geciken okuma kullanıcının yeni açık seçimini ezmez", async () => {
  const ortam = await temaOrtami({ utt: "mavi" });
  try {
    ortam.getBeklet();
    await ortam.giris({ id: "utt" });
    await ortam.sec("yesil");
    await ortam.yanitla("utt");
    assert.equal(ortam.secili(), "yesil");
    assert.equal(ortam.kayitlar.get("utt"), "yesil");
    assert.equal(ortam.yazmalar.length, 1);
  } finally { await ortam.kapat(); }
});

test("tema okuma hatasında önceki kullanıcının rengi uygulanmaz veya hesaba yazılmaz", async () => {
  const ortam = await temaOrtami({}, "yesil");
  try {
    ortam.getBeklet();
    await ortam.giris({ id: "uye" });
    await ortam.yanitla("uye", 500);
    assert.equal(ortam.secili(), "mavi");
    assert.equal(ortam.tarayici(), "yesil");
    assert.equal(ortam.yazmalar.length, 0);
    assert.equal(ortam.uyarilar.length, 1);
  } finally { await ortam.kapat(); }
});

test("oturumsuz açılış tarayıcının yeşilini korur; hesaba giriş yapmadan tercih kaydı yazılmaz", async () => {
  const ortam = await temaOrtami({}, "yesil");
  try {
    await ortam.giris(null, true);
    assert.equal(ortam.secili(), "yesil");
    assert.equal(ortam.tarayici(), "yesil");
    await ortam.giris(null);
    assert.equal(ortam.secili(), "yesil");
    await ortam.sec("mavi");
    assert.equal(ortam.secili(), "yesil", "oturumsuz renk seçimi kabul edilmemeli");
    assert.equal(ortam.tarayici(), "yesil", "oturumsuz eylem tarayıcı kaydını değiştirmemeli");
    assert.equal(ortam.yazmalar.length, 0);
  } finally { await ortam.kapat(); }
});

test("hiç seçim bulunmayan tarayıcı ve hesap varsayılan maviyle açılır", async () => {
  const ortam = await temaOrtami();
  try {
    await ortam.giris(null);
    assert.equal(ortam.secili(), "mavi");
    await ortam.yenidenAc();
    assert.equal(ortam.secili(), "mavi");
    await ortam.giris({ id: "yeni-hesap" });
    assert.equal(ortam.secili(), "mavi");
    assert.equal(ortam.tarayici(), null);
    assert.equal(ortam.yazmalar.length, 0);
  } finally { await ortam.kapat(); }
});

test("eski ortak yeşil kayıt varken açılış mavidir; ancak yeni açık seçimden sonra yeşil kalabilir", async () => {
  const ortam = await temaOrtami();
  try {
    ortam.eskiTarayiciKaydiEkle("yesil");
    await ortam.giris(null, true);
    assert.equal(ortam.secili(), "mavi");
    await ortam.giris(null);
    await ortam.yenidenAc();
    assert.equal(ortam.secili(), "mavi", "eski ortak yeşil varsayılan maviyi ezmemeli");
    assert.equal(ortam.tarayici(), null);
    await ortam.giris({ id: "utt" });
    assert.equal(ortam.secili(), "mavi");
    assert.equal(ortam.yazmalar.length, 0);
    await ortam.sec("yesil");
    await ortam.giris(null);
    await ortam.yenidenAc();
    assert.equal(ortam.secili(), "yesil", "yeni açık seçim kendi tarayıcısında korunmalı");
    await ortam.giris({ id: "uye" });
    assert.equal(ortam.secili(), "mavi");
    assert.equal(ortam.kayitlar.has("uye"), false);
    assert.deepEqual(ortam.yazmalar, [{ kullanici_id: "utt", tema: "yesil" }]);
  } finally { await ortam.kapat(); }
});


test("login başlangıç betiği React yüklenmeden kayıtlı rengi uygular", () => {
  for (const [secim, beklenen] of [[null, "mavi"], ["yesil", "yesil"], ["mavi", "mavi"], ["bozuk", "mavi"]]) {
    let renk = "mavi";
    vm.runInNewContext(temalar.LOGIN_TEMA_BASLANGIC_BETIGI, {
      window: { location: { pathname: "/login" }, localStorage: { getItem: () => secim } },
      document: { documentElement: { setAttribute: (_: string, deger: string) => { renk = deger; } } },
    });
    assert.equal(renk, beklenen);
  }
});

test("login başlangıcı kapalı depolamada mavi kalır; hesap sayfasında tarayıcı rengini uygulamaz", () => {
  for (const pathname of ["/login", "/", "/uye"]) {
    let renk: string | null = null;
    vm.runInNewContext(temalar.LOGIN_TEMA_BASLANGIC_BETIGI, {
      window: { location: { pathname }, localStorage: { getItem: () => { throw new Error("kapalı"); } } },
      document: { documentElement: { setAttribute: (_: string, deger: string) => { renk = deger; } } },
    });
    assert.equal(renk, pathname === "/uye" ? null : "mavi");
  }
});
