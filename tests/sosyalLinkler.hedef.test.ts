import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { act, createElement } from "react";
import { GlobalWindow } from "happy-dom";
import {
  sosyalIkonDosyaKontrol,
  sosyalLinkAdNormalizeEt,
  sosyalLinkUrlNormalizeEt,
} from "@/lib/sosyalLinkler";
import { adminSosyalLinkleriniOku, kamuSosyalLinkleriniOku } from "@/lib/sosyalLinklerSunucu";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) {
  if (!(key in globalThis)) {
    // @ts-expect-error Test DOM ortamı.
    globalThis[key] = win[key];
  }
}
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
globalThis.Event = win.Event as unknown as typeof Event;
globalThis.CustomEvent = win.CustomEvent as unknown as typeof CustomEvent;
// @ts-expect-error React test ortamı.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { default: CognitiHakkinda } = await import("@/components/panel/bilgi/CognitiHakkinda");
const { default: SosyalLinkYonetimi } = await import("@/app/admin/_components/SosyalLinkYonetimi");

test("Sosyal link URL, ad ve ikon dosya doğrulama yardımcıları güvenli biçimde çalışır", async () => {
  assert.equal(sosyalLinkUrlNormalizeEt("https://www.linkedin.com/company/cogniti"), "https://www.linkedin.com/company/cogniti");
  assert.equal(sosyalLinkUrlNormalizeEt("www.instagram.com/cogniti"), "https://www.instagram.com/cogniti");
  assert.equal(sosyalLinkUrlNormalizeEt("javascript:alert(1)"), null);
  assert.equal(sosyalLinkUrlNormalizeEt("/admin"), null);
  assert.equal(sosyalLinkUrlNormalizeEt(""), null);

  assert.equal(sosyalLinkAdNormalizeEt("  LinkedIn  "), "LinkedIn");
  assert.equal(sosyalLinkAdNormalizeEt("   "), null);
  assert.equal(sosyalLinkAdNormalizeEt("a".repeat(81)), null);

  const gecerliSvg = new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>'], "li.svg", { type: "image/svg+xml" });
  const svgSonuc = await sosyalIkonDosyaKontrol(gecerliSvg);
  assert.equal(svgSonuc.gecerli, true);

  const zararliSvg = new File(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], "xss.svg", { type: "image/svg+xml" });
  const zararliSonuc = await sosyalIkonDosyaKontrol(zararliSvg);
  assert.equal(zararliSonuc.gecerli, false);

  const gecerliPng = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0])], "ig.png", { type: "image/png" });
  const pngSonuc = await sosyalIkonDosyaKontrol(gecerliPng);
  assert.equal(pngSonuc.gecerli, true);

  const sahtePng = new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], "sahte.png", { type: "image/png" });
  const sahteSonuc = await sosyalIkonDosyaKontrol(sahtePng);
  assert.equal(sahteSonuc.gecerli, false);
});

test("Sunucu okuyucuları tablo yoksa güvenli döner; kayıt varsa publicUrl üretir", async () => {
  const eksikMock = {
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => ({ order: async () => ({ data: null, error: { code: "PGRST205" } }) }) }),
        order: () => ({ order: async () => ({ data: null, error: { code: "42P01" } }) }),
      }),
    }),
  } as never;

  const kamuBos = await kamuSosyalLinkleriniOku(eksikMock);
  assert.deepEqual(kamuBos, []);

  const adminEksik = await adminSosyalLinkleriniOku(eksikMock);
  assert.equal(adminEksik.kurulumHazir, false);
  assert.deepEqual(adminEksik.linkler, []);

  const doluMock = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: async () => ({
              data: [{ id: "1", ad: "LinkedIn", url: "https://linkedin.com/company/cogniti", ikon_yolu: "sosyal-ikonlar/li.svg" }],
              error: null,
            }),
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        getPublicUrl: (yol: string) => ({ data: { publicUrl: `https://cdn.test/${yol}` } }),
      }),
    },
  } as never;

  const kamuDolu = await kamuSosyalLinkleriniOku(doluMock);
  assert.equal(kamuDolu.length, 1);
  assert.equal(kamuDolu[0].ikonUrl, "https://cdn.test/sosyal-ikonlar/li.svg");
});

test("CognitiHakkinda sosyal linkleri navbar altı / COGNITI NEDİR? üstünde render eder", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(createElement(CognitiHakkinda, { sosyalLinkler: [] })));
    assert.equal(host.querySelector('nav[aria-label="Sosyal medya ve bağlantılar"]'), null);

    await act(async () =>
      root.render(
        createElement(CognitiHakkinda, {
          sosyalLinkler: [
            { id: "1", ad: "LinkedIn", url: "https://www.linkedin.com/company/cogniti", ikonUrl: "/li.svg" },
            { id: "2", ad: "Instagram", url: "https://www.instagram.com/cogniti", ikonUrl: "/ig.svg" },
          ],
        }),
      ),
    );

    const nav = host.querySelector('nav[aria-label="Sosyal medya ve bağlantılar"]')!;
    assert.ok(nav);
    const baglantilar = [...nav.querySelectorAll("a")];
    assert.equal(baglantilar.length, 2);
    assert.equal(baglantilar[0].getAttribute("href"), "https://www.linkedin.com/company/cogniti");
    assert.equal(baglantilar[0].getAttribute("aria-label"), "LinkedIn");
    assert.equal(baglantilar[1].getAttribute("href"), "https://www.instagram.com/cogniti");
    assert.equal(baglantilar[1].getAttribute("aria-label"), "Instagram");

    // DOM sırası: sosyal nav, "COGNITI NEDİR?" paragrafından önce gelir.
    const sahneMetni = host.querySelector("header")!;
    const tumDugumler = [...sahneMetni.querySelectorAll("nav, p")];
    const navIndeks = tumDugumler.indexOf(nav);
    const baslikIndeks = tumDugumler.findIndex((el) => el.textContent === "COGNITI NEDİR?");
    assert.ok(navIndeks >= 0 && baslikIndeks > navIndeks);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

test("Admin SosyalLinkYonetimi ayrı ikon ve link alanlarıyla ekleme, gizleme ve silme yapar", async () => {
  const oncekiFetch = globalThis.fetch;
  const oncekiCreate = URL.createObjectURL;
  const oncekiRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:ikon-onizleme";
  URL.revokeObjectURL = () => undefined;

  const istekler: Array<{ url: string; method: string }> = [];
  globalThis.fetch = (async (url, init) => {
    const method = init?.method ?? "GET";
    istekler.push({ url: String(url), method });
    if (method === "GET") {
      return Response.json({ linkler: [], kurulumHazir: true });
    }
    if (method === "POST") {
      const form = init?.body as FormData;
      assert.equal(form.get("ad"), "LinkedIn");
      assert.equal(form.get("url"), "https://www.linkedin.com/company/cogniti");
      assert.ok(form.get("ikon") instanceof File);
      return Response.json(
        {
          link: {
            id: "11111111-1111-4111-8111-111111111111",
            ad: "LinkedIn",
            url: "https://www.linkedin.com/company/cogniti",
            ikonUrl: "/li-saved.svg",
            sira: 1,
            gorunur: true,
          },
        },
        { status: 201 },
      );
    }
    if (method === "PATCH") {
      return Response.json({
        link: {
          id: "11111111-1111-4111-8111-111111111111",
          ad: "LinkedIn",
          url: "https://www.linkedin.com/company/cogniti",
          ikonUrl: "/li-saved.svg",
          sira: 1,
          gorunur: false,
        },
      });
    }
    if (method === "DELETE") {
      return Response.json({ ok: true });
    }
    return Response.json({});
  }) as typeof fetch;

  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const hatalar: string[] = [];
  const basarilar: string[] = [];

  try {
    // Admin gezinme bağlantısı mevcut mu?
    assert.match(readFileSync("app/admin/_components/FirmaGezinme.tsx", "utf8"), /Sosyal Medya ve Link Ekleme/);
    assert.match(readFileSync("app/admin/page.tsx", "utf8"), /globalBolum === "sosyal-linkler"/);

    await act(async () =>
      root.render(
        createElement(SosyalLinkYonetimi, {
          hata: (m) => hatalar.push(m),
          basari: (m) => basarilar.push(m),
        }),
      ),
    );

    const dosyaInput = host.querySelector('input[type="file"]') as HTMLInputElement;
    const adInput = host.querySelector('input[type="text"]') as HTMLInputElement;
    const urlInput = host.querySelector('input[type="url"]') as HTMLInputElement;

    const svgDosya = new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>'], "li.svg", { type: "image/svg+xml" });
    Object.defineProperty(dosyaInput, "files", { configurable: true, value: [svgDosya] });
    await act(async () => dosyaInput.dispatchEvent(new win.Event("change", { bubbles: true })));

    const setInputValue = (el: HTMLInputElement, val: string) => {
      const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value")!.set!;
      setter.call(el, val);
      el.dispatchEvent(new win.Event("input", { bubbles: true }));
    };

    await act(async () => {
      setInputValue(adInput, "LinkedIn");
      setInputValue(urlInput, "https://www.linkedin.com/company/cogniti");
    });

    const ekleForm = host.querySelector("form")!;
    await act(async () => {
      ekleForm.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
    });

    assert.equal(hatalar.length, 0);
    assert.equal(istekler.filter((i) => i.method === "POST").length, 1);
    assert.ok(host.textContent?.includes("LinkedIn"));

    const gizleButon = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("Gizle"))!;
    await act(async () => gizleButon.click());
    assert.equal(istekler.filter((i) => i.method === "PATCH").length, 1);

    const silButon = [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Sil")!;
    await act(async () => silButon.click());
    // AlertDialog portal'ı document.body içinde açılır.
    const onayButon = [...document.body.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Sil" && b !== silButon)!;
    assert.ok(onayButon);
    await act(async () => onayButon.click());
    assert.equal(istekler.filter((i) => i.method === "DELETE").length, 1);
    assert.equal(hatalar.length, 0);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = oncekiFetch;
    URL.createObjectURL = oncekiCreate;
    URL.revokeObjectURL = oncekiRevoke;
    await win.happyDOM.close();
  }
});
