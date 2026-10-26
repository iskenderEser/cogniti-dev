import * as vivaSozlesme from "@/lib/viva/sozlesme";
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
async function ortam(kullanici: Kimlik | null = null, aktif = true, sayfa: "login" | "karsilama" = "login", adres = "/login") {
  const dom = new Window({ url: `http://localhost${adres}` });
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent", "HTMLInputElement"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const auth = { kullanici, yukleniyor: false, cikisYap: async () => { cikislar++; } };
  const yollar: string[] = [], girisler: unknown[] = [], sifirlamalar: unknown[] = [], tercihler: boolean[] = [], istekler: unknown[] = [];
  let cikislar = 0, tema = "mavi", girisHatasi = false, resetHatasi = false, davetBekliyor = false, telefonBasarili = false;
  let firmaBekleyen: Promise<{data:{aktif:boolean}}> | null = null;
  const supabase = {
    auth: {
      signInWithPassword: async (veri: unknown) => { girisler.push(veri); return { data: { user: { app_metadata: { eclub_davet_bekliyor: davetBekliyor } } }, error: girisHatasi ? {} : null }; },
      resetPasswordForEmail: async (...veri: unknown[]) => { sifirlamalar.push(veri); return { error: resetHatasi ? {} : null }; },
    },
    from: (tablo: string) => { assert.equal(tablo, "firmalar"); const q = { select: () => q, eq: () => q, single: async () => firmaBekleyen ?? ({ data: { aktif } }) }; return q; },
  };
  const istemciYollari: string[] = [];
  const router = { replace: (yol: string) => istemciYollari.push(yol) };
  const tamGecis = dom.location.replace.bind(dom.location);
  dom.location.replace = (yol: string) => { yollar.push(yol); tamGecis(yol); };
  const css = { default: new Proxy({}, { get: (_, key) => String(key) }) };
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
    "next/link": { default: ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => React.createElement("a", props, children) },
    "@/lib/panel/baslangic": baslangic,
    "@/lib/viva/sozlesme": vivaSozlesme,
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
  modules["@/app/login/login.module.css"] = css;
  modules["@/app/login/_components/GirisAltBilgileri"] = modules["./_components/GirisAltBilgileri"];
  const Sayfa = yukle(sayfa === "login" ? "app/login/page.tsx" : "app/_components/KarsilamaSayfasi.tsx");
  const container = dom.document.createElement("div"); dom.document.body.append(container);
  const root = createRoot(container);
  const render = () => act(async () => root.render(React.createElement(Sayfa)));
  const click = (el: Element | null | undefined) => { assert.ok(el); return act(async () => { (el as HTMLElement).click(); }); };
  const button = (text: string) => [...container.querySelectorAll("button")].find(el => el.textContent === text);
  return {
    dom, container, auth, yollar, istemciYollari, girisler, sifirlamalar, tercihler, istekler, render, click, button,
    firmayiBeklet: () => { let yanitla!:(v:{data:{aktif:boolean}})=>void; firmaBekleyen=new Promise(r=>{yanitla=r;});return () => yanitla({data:{aktif:true}}); },
    cikislar: () => cikislar,
    davet: () => { davetBekliyor = true; }, telefonBasarisi: () => { telefonBasarili = true; },
    hataliGiris: () => { girisHatasi = true; }, hataliReset: () => { resetHatasi = true; },
    yaz: async (id: string, value: string) => { const input = container.querySelector<HTMLInputElement>(`#${id}`)!; await act(async () => { Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype, "value")!.set!.call(input, value); input.dispatchEvent(new dom.Event("input", { bubbles: true })); }); },
    submit: () => act(async () => { const form = container.querySelector("#giris-alani form")!; form.dispatchEvent(new dom.Event("submit", { bubbles: true, cancelable: true })); }),
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

test("login doğrudan formu açar; sıfırlama, değerler ve odak korunur; dönüş ayrı adrestedir", async () => {
  const o = await ortam();
  try {
    await o.render();
    assert.equal(o.container.querySelector('article[aria-label="Cogniti Hakkında"]'), null);
    assert.equal(o.container.querySelector("header"), null);
    assert.equal(o.container.querySelector('[role="dialog"]'), null);
    assert.equal(o.dom.document.activeElement?.id, "giris-kimlik");
    assert.equal(o.container.querySelector<HTMLElement>("#giris-alani")!.hidden, false);
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
    const back = [...o.container.querySelectorAll('a')].find((link) => link.textContent === "← Cogniti’yi tanıyın")!;
    assert.equal(back.getAttribute('href'), '/welcome');
    assert.equal(o.girisler.length, 0);
  } finally { await o.kapat(); }
});

test("karşılama ayrı sayfada açıklamaları gösterir; Giriş Yap /login bağlantısıdır", async () => {
  const o = await ortam(null, true, "karsilama");
  try {
    await o.render();
    const article = o.container.querySelector('article[aria-label="Cogniti Hakkında"]')!;
    assert.ok(article);
    assert.equal(article.querySelectorAll("h3").length, 4);
    assert.match(article.textContent!, /Tanıtım ve Öğrenme/);
    assert.equal(o.container.querySelector("form"), null);
    const link = [...o.container.querySelectorAll("a")].find((a) => a.textContent === "Giriş Yap")!;
    assert.equal(link.getAttribute("href"), "/login");
    assert.equal(o.container.querySelector('a[aria-label="Cogniti"]')!.getAttribute('href'), '/welcome');
    assert.deepEqual(o.yollar, []);
    assert.equal(o.girisler.length, 0);
  } finally { await o.kapat(); }
});

test("e-posta girişi, beni hatırla ve servis hata mesajı korunur", async () => {
  const o = await ortam();
  try {
    await o.render();
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
    await o.render();
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
    await o.render();
    o.telefonBasarisi(); await o.yaz("giris-kimlik", "05000000000"); await o.yaz("giris-sifre", "sahte-sifre"); await o.submit();
    assert.equal(o.dom.location.pathname, "/eczanem"); assert.deepEqual(o.tercihler, [true]);
  } finally { await o.kapat(); }
});

test("bekleyen davet oturumu davet ekranına yönlenir", async () => {
  const o = await ortam();
  try {
    await o.render();
    o.davet(); await o.yaz("giris-kimlik", "ornek@example.invalid"); await o.yaz("giris-sifre", "sahte-sifre"); await o.submit();
    assert.equal(o.dom.location.pathname, "/davet-bekliyor"); assert.deepEqual(o.tercihler, []);
  } finally { await o.kapat(); }
});


test("Viva bağlantısından girişte iç kullanıcı ve EClub üyesi etkinliğe döner", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  for (const kimlik of [{ id, rol: "pm", kimlik_turu: "kullanici" }, { id, rol: "eczaci", kimlik_turu: "eclub_kisi" }]) {
    const o = await ortam(kimlik, true, "login", `/login?viva=${encodeURIComponent(`/viva/${id}/oda`)}`);
    try { await o.render(); assert.equal(o.yollar.at(-1), `/viva/${id}/oda`); } finally { await o.kapat(); }
  }
});


test("giriş sonrası UTT hedefi eski karşılama cache'i yerine tam sayfa isteğiyle açılır", async () => {
 const o=await ortam();try{await o.render();assert.deepEqual(o.yollar,[]);o.auth.kullanici={id:'utt',rol:'utt',kimlik_turu:'kullanici',firma_id:'firma'};await o.render();assert.deepEqual(o.yollar,['/ana-sayfa']);assert.deepEqual(o.istemciYollari,[]);assert.equal(o.dom.location.pathname,'/ana-sayfa');}finally{await o.kapat();}
});


test("Cogniti’yi tanıyın tam sayfa dönüşü geç kalan giriş yönlendirmesiyle ezilmez",async()=>{
 const o=await ortam();try{await o.render();const release=o.firmayiBeklet();o.auth.kullanici={id:'utt',rol:'utt',kimlik_turu:'kullanici',firma_id:'firma'};await o.render();const gecisler:string[]=[];const assign=o.dom.location.assign.bind(o.dom.location);o.dom.location.assign=(yol:string)=>{gecisler.push(yol);assign(yol);};const link=[...o.container.querySelectorAll('a')].find(a=>a.textContent==='← Cogniti’yi tanıyın')!;await o.click(link);assert.deepEqual(gecisler,['/welcome']);assert.equal(o.dom.location.pathname,'/welcome');await act(async()=>release());assert.deepEqual(o.yollar,[]);assert.deepEqual(o.istemciYollari,[]);}finally{await o.kapat();}
});
