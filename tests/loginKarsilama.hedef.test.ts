import * as baslangic from "@/lib/panel/baslangic";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as icons from "lucide-react";
import { Window } from "happy-dom";
import ts from "typescript";
import { TUM_ROLLER } from "@/lib/utils/roller";
import * as turSunumu from "@/lib/ogrenmeAraci/turSunumu";

type Kimlik = { id: string; rol?: string; kimlik_turu?: string; firma_id?: string };
async function ortam(kullanici: Kimlik | null = null, aktif = true) {
  const dom = new Window({ url: "http://localhost/login" });
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent", "HTMLInputElement"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const auth = { kullanici, yukleniyor: false, cikisYap: async () => { cikislar++; } };
  const yollar: string[] = [], girisler: unknown[] = [], sifirlamalar: unknown[] = [], tercihler: boolean[] = [], istekler: unknown[] = [];
  let cikislar = 0, tema = "mavi", girisHatasi = false, resetHatasi = false, davetBekliyor = false, telefonBasarili = false;
  const supabase = {
    auth: {
      signInWithPassword: async (veri: unknown) => { girisler.push(veri); return { data: { user: { app_metadata: { eclub_davet_bekliyor: davetBekliyor } } }, error: girisHatasi ? {} : null }; },
      resetPasswordForEmail: async (...veri: unknown[]) => { sifirlamalar.push(veri); return { error: resetHatasi ? {} : null }; },
    },
    from: (tablo: string) => { assert.equal(tablo, "firmalar"); const q = { select: () => q, eq: () => q, single: async () => ({ data: { aktif } }) }; return q; },
  };
  const router = { replace: (yol: string) => yollar.push(yol) };
  const css = { default: new Proxy({}, { get: (_, key) => String(key) }) };
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
    "@/lib/panel/baslangic": baslangic,
    "next/navigation": { useRouter: () => router },
    "@/app/providers/AuthProvider": { useAuth: () => auth },
    "@/app/providers/TemaProvider": { useTema: () => ({ tema, temaDegistir: (secim: string) => { tema = secim; } }) },
    "@/components/marka/CognitiLogo": { default: () => React.createElement("span", null, "Cogniti") },
    "@/lib/supabase/client": { createClient: () => supabase },
    "@/lib/utils/beniHatirla": { beniHatirlaKaydet: (deger: boolean) => tercihler.push(deger) },
    "@/lib/ogrenmeAraci/turSunumu": turSunumu,
    "./login.module.css": css, "./cogniti-hakkinda.module.css": css, "@/components/tema/tema-secici.module.css": css,
    "./_components/GirisAltBilgileri": { default: ({ gorunum }: { gorunum: React.ReactNode }) => React.createElement("footer", null, gorunum) },
  };
  function yukle(dosya: string) {
    const exports: { default?: React.ComponentType } = {};
    const compiled = ts.transpileModule(readFileSync(dosya, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(compiled, { exports, window: dom, document: dom.document,
      fetch: async (yol: string, init: RequestInit) => { assert.equal(yol, "/eczanem/api/giris/sifre"); istekler.push(JSON.parse(String(init.body))); return { ok: telefonBasarili, json: async () => telefonBasarili ? { yonlendir: "/eczanem" } : { hata: "Telefon veya şifre hatalı." } }; },
      require: (id: string) => { assert.ok(id in modules, id); return modules[id]; },
    });
    assert.ok(exports.default); return exports.default;
  }
  modules["@/components/panel/bilgi/CognitiHakkinda"] = { default: yukle("components/panel/bilgi/CognitiHakkinda.tsx") };
  const Sayfa = yukle("app/login/page.tsx");
  const container = dom.document.createElement("div"); dom.document.body.append(container);
  const root = createRoot(container);
  const render = () => act(async () => root.render(React.createElement(Sayfa)));
  const click = (el: Element | null | undefined) => { assert.ok(el); return act(async () => { (el as HTMLElement).click(); }); };
  const button = (text: string) => [...container.querySelectorAll("button")].find(el => el.textContent === text);
  return {
    dom, container, auth, yollar, girisler, sifirlamalar, tercihler, istekler, render, click, button,
    cikislar: () => cikislar,
    davet: () => { davetBekliyor = true; }, telefonBasarisi: () => { telefonBasarili = true; },
    hataliGiris: () => { girisHatasi = true; }, hataliReset: () => { resetHatasi = true; },
    yaz: async (id: string, value: string) => { const input = container.querySelector<HTMLInputElement>(`#${id}`)!; await act(async () => { Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype, "value")!.set!.call(input, value); input.dispatchEvent(new dom.Event("input", { bubbles: true })); }); },
    submit: () => act(async () => { const form = container.querySelector("#giris-alani form")!; form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true })); }),
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

test("karşılama → modalsız giriş → sıfırlama → Cogniti’ye dönüş; değerler ve odak korunur", async () => {
  const o = await ortam();
  try {
    await o.render();
    assert.equal(o.container.querySelector("header")!.hidden, false);
    const icerik = o.container.querySelector('article[aria-label="Cogniti Hakkında"]')!;
    assert.ok(icerik); assert.equal(icerik.querySelectorAll("h3").length, 7);
    await o.click(o.button("Giriş Yap"));
    assert.equal(o.container.querySelector("header")!.hidden, true);
    assert.equal(o.container.querySelector('[role="dialog"]'), null);
    assert.equal(o.dom.document.activeElement?.id, "giris-kimlik");
    await o.yaz("giris-kimlik", "ornek@example.invalid"); await o.yaz("giris-sifre", "sahte-sifre");
    await o.click(o.container.querySelector('[aria-label="Şifreyi göster"]'));
    assert.equal(o.container.querySelector<HTMLInputElement>("#giris-sifre")!.type, "text");
    await o.click(o.button("Şifremi unuttum"));
    assert.equal(o.dom.document.activeElement?.id, "sifirlama-email");
    assert.equal(o.container.querySelector<HTMLInputElement>("#sifirlama-email")!.value, "ornek@example.invalid");
    await o.submit();
    assert.deepEqual(JSON.parse(JSON.stringify(o.sifirlamalar)), [["ornek@example.invalid", { redirectTo: "http://localhost/sifre-yenile" }]]);
    assert.match(o.container.querySelector('[role="status"]')!.textContent!, /kayıtlıysa/);
    await o.click(o.button("← Girişe dön"));
    assert.equal(o.container.querySelector<HTMLInputElement>("#giris-sifre")!.value, "sahte-sifre");
    await o.click(o.button("← Cogniti’yi tanıyın"));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
    assert.equal(o.container.querySelector("header")!.hidden, false);
    assert.equal(o.container.querySelector<HTMLElement>("#giris-alani")!.hidden, true);
    assert.equal(o.girisler.length, 0);
  } finally { await o.kapat(); }
});

test("e-posta girişi, beni hatırla ve servis hata mesajı korunur", async () => {
  const o = await ortam();
  try {
    await o.render(); await o.click(o.button("Giriş Yap"));
    await o.yaz("giris-kimlik", "  ornek@example.invalid  "); await o.yaz("giris-sifre", "sahte-sifre");
    await o.click(o.container.querySelector('input[type="checkbox"]')); await o.submit();
    assert.deepEqual(JSON.parse(JSON.stringify(o.girisler)), [{ email: "ornek@example.invalid", password: "sahte-sifre" }]);
    assert.deepEqual(o.tercihler, [false]);
    o.hataliGiris(); await o.submit();
    assert.match(o.container.querySelector('[role="alert"]')!.textContent!, /E-posta veya şifre hatalı/);
    assert.deepEqual(o.tercihler, [false]);
  } finally { await o.kapat(); }
});

test("telefon girişi mevcut API’ye gider; sıfırlama hatası görünür kalır", async () => {
  const o = await ortam();
  try {
    await o.render(); await o.click(o.button("Giriş Yap"));
    await o.yaz("giris-kimlik", "05000000000"); await o.yaz("giris-sifre", "sahte-sifre"); await o.submit();
    assert.deepEqual(o.istekler, [{ telefon: "05000000000", sifre: "sahte-sifre" }]);
    assert.equal(o.girisler.length, 0); assert.match(o.container.querySelector('[role="alert"]')!.textContent!, /Telefon/);
    await o.click(o.button("Şifremi unuttum"));
    assert.equal(o.container.querySelector<HTMLInputElement>("#sifirlama-email")!.value, "");
    o.hataliReset(); await o.yaz("sifirlama-email", "ornek@example.invalid"); await o.submit();
    assert.match(o.container.querySelector('[role="status"]')!.textContent!, /Bağlantı gönderilemedi/);
  } finally { await o.kapat(); }
});

for (const rol of TUM_ROLLER) {
  test(`${rol} girişte Hakkında yerine rolünün ana sayfasına gider`, async () => {
    const o = await ortam({ id: "sahte", kimlik_turu: "kullanici", rol, firma_id: "firma" });
    try { await o.render(); assert.deepEqual(o.yollar, [rol === "admin" ? "/admin" : baslangic.panelBaslangici(rol).yol]); assert.equal(o.girisler.length, 0); }
    finally { await o.kapat(); }
  });
}
for (const [kimlik_turu, rol, hedef] of [["eclub_kisi", "eczaci", "/eclub/ana-sayfa"], ["eclub_kisi", "teknisyen", "/eclub/ana-sayfa"], ["musteri", "musteri", "/eczanem"]]) {
  test(`${kimlik_turu}/${rol} kendi ana sayfasını açar`, async () => {
    const o = await ortam({ id: "sahte", rol, kimlik_turu });
    try { await o.render(); assert.deepEqual(o.yollar, [hedef]); } finally { await o.kapat(); }
  });
}
test("kapalı firma çıkış yapar ve giriş formunda hata gösterir", async () => {
  const o = await ortam({ id: "sahte", kimlik_turu: "kullanici", rol: "utt", firma_id: "firma" }, false);
  try { await o.render(); assert.equal(o.cikislar(), 1); assert.deepEqual(o.yollar, []); assert.equal(o.container.querySelector<HTMLElement>("#giris-alani")!.hidden, false); assert.match(o.container.querySelector('[role="alert"]')!.textContent!, /Firmanızın/); }
  finally { await o.kapat(); }
});

test("başarılı telefon girişi mevcut tam sayfa hedefini ve hatırlama tercihini korur", async () => {
  const o = await ortam();
  try {
    await o.render(); await o.click(o.button("Giriş Yap"));
    o.telefonBasarisi(); await o.yaz("giris-kimlik", "05000000000"); await o.yaz("giris-sifre", "sahte-sifre"); await o.submit();
    assert.equal(o.dom.location.pathname, "/eczanem"); assert.deepEqual(o.tercihler, [true]);
  } finally { await o.kapat(); }
});

test("bekleyen davet oturumu davet ekranına yönlenir", async () => {
  const o = await ortam();
  try {
    await o.render(); await o.click(o.button("Giriş Yap"));
    o.davet(); await o.yaz("giris-kimlik", "ornek@example.invalid"); await o.yaz("giris-sifre", "sahte-sifre"); await o.submit();
    assert.equal(o.dom.location.pathname, "/davet-bekliyor"); assert.deepEqual(o.tercihler, []);
  } finally { await o.kapat(); }
});
