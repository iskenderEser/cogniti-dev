import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { Window } from "happy-dom";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import config from "../postcss.config.mjs";
import { YayinKarti, type YayinKartiVerisi } from "@/components/yayin/YayinKarti";
import { AracVarsayilanKapak } from "@/components/ogrenme-araci/AracVarsayilanKapak";
import PodcastKapakGorseli, { PodcastVarsayilanKapak } from "@/components/ogrenme-araci/PodcastKapakGorseli";
import PodcastOynatici from "@/components/ogrenme-araci/PodcastOynatici";
import GorselOynatici from "@/components/ogrenme-araci/GorselOynatici";
import VideoCercevesi from "@/components/video/VideoCercevesi";
import { eclubHoykUcRengi } from "@/lib/eclub/hoykSureCercevesi";

const compiled = await postcss([tailwind(config.plugins["@tailwindcss/postcss"])]).process(readFileSync("app/globals.css", "utf8"), { from: "app/globals.css" });
assert.equal(compiled.warnings().length, 0);
const utility = (name: string) => {
  let found: postcss.Rule | undefined;
  compiled.root.walkRules(`.${name.replace(/[^\w-]/g, "\\$&")}`, rule => { found = rule; });
  assert.ok(found, `Gerçek derlemede sınıf yok: ${name}`);
  return found;
};
const themeCss = readFileSync("app/tema.css", "utf8");
const maps = new Map<string, Record<string, string>>();
for (const theme of ["mavi", "yesil"]) {
  const map: Record<string, string> = {};
  postcss.parse(readFileSync("node_modules/tailwindcss/theme.css", "utf8")).walkDecls(d => { map[d.prop] = d.value; });
  postcss.parse(themeCss).walkRules(rule => {
    if (rule.selectors.includes(`[data-tema="${theme}"]`)) rule.walkDecls(d => { map[d.prop] = d.value; });
  });
  maps.set(theme, map);
}
const resolve = (value: string, theme: string): string => value.replace(/var\((--[\w-]+)\)/g, (_, key: string) => {
  assert.ok(key in maps.get(theme)!, key);
  return resolve(maps.get(theme)![key], theme);
});
const window = new Window({ url: "http://localhost" });
for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "HTMLButtonElement", "Event", "MouseEvent", "Image"]) Object.defineProperty(globalThis, key, { configurable: true, value: window[key] });
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
after(async () => { await window.happyDOM.close(); });

const sample: YayinKartiVerisi = {
  yayin_id: "yayin", urun_adi: "Örnek yayın", gorunen_urun_id: "30-001", arac_turu: "video",
  durum: "yeni", icerik_turu: "urun", video_puani: 50, extra_puan: 5,
  yayin_tarihi: "2026-10-14", talep_no: 120, firma_adi: "Örnek",
  begeni_mi: true, favori_mi: true, begeni_sayisi: 2, favori_sayisi: 3,
};

function applyCss(markup: string) {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.append(host);
  const names = new Set([...host.querySelectorAll("[class]")].flatMap(el => [...el.classList]).filter(name => name.includes("var(") && !/^(?:sm:|hover:|disabled:|focus-visible:|group-hover:)/.test(name)));
  // Only the real target utility rules are flattened: Happy DOM cannot evaluate Tailwind layers.
  const style = document.createElement("style");
  style.textContent = `${themeCss}\n${[...names].map(name => utility(name).toString()).join("\n")}`;
  document.head.append(style);
  return { host, close: () => { host.remove(); style.remove(); } };
}
function expectColor(el: Element, property: string, expected: string) {
  // Happy DOM does not support OKLCH; for those legacy colors compare the real
  // compiled declaration after resolving its variables instead of inventing RGB.
  if (expected.startsWith("oklch(")) {
    const values = [...el.classList].filter(name => name.includes("var(")).flatMap(name => {
      const values: string[] = [];
      utility(name).walkDecls(property, d => { values.push(resolve(d.value, document.documentElement.getAttribute("data-tema")!)); });
      return values;
    });
    assert.ok(values.includes(expected), `${el.tagName}/${property}: ${values.join(", ")}`);
    return;
  }
  const probe = document.createElement("span");
  probe.style.setProperty(property, expected);
  document.body.append(probe);
  try {
    const expectedValue = window.getComputedStyle(probe).getPropertyValue(property);
    assert.notEqual(expectedValue, "", expected);
    const normalize = (value: string) => value.replace(/#([\da-f])([\da-f])([\da-f])\b/gi, "#$1$1$2$2$3$3");
    assert.equal(normalize(window.getComputedStyle(el).getPropertyValue(property)), normalize(expectedValue), `${el.tagName}/${property}`);
  } finally { probe.remove(); }
}

test("HOYK gerçek CSS'si iki temada yüzey, başlık, puan, etkileşim ve işlevsel durum ayrımlarını korur", () => {
  const cases = ["yeni", "devam", "tamamlanan"] as const;
  const markup = cases.map(durum => renderToStaticMarkup(React.createElement(YayinKarti, { yayin: { ...sample, durum } }))).join("");
  const view = applyCss(markup);
  try {
    for (const theme of ["mavi", "yesil", "mavi"]) {
      document.documentElement.setAttribute("data-tema", theme);
      for (const [i, card] of [...view.host.children].entries()) {
        expectColor(card, "background-color", "#fff");
        expectColor(card.querySelector("h3")!, "color", theme === "mavi" ? resolve("var(--color-gray-900)", theme) : "#2c4137");
        expectColor(card.querySelector("[data-hoyk-puan]")!, "color", theme === "mavi" ? "#fff" : "#536d4c");
        expectColor(card.querySelector("[data-hoyk-ek-puan]")!, "color", theme === "mavi" ? "#fff" : "#536d4c");
        expectColor(card.querySelector('[aria-label="Beğen"]')!, "color", theme === "mavi" ? resolve("var(--color-red-500)", theme) : "#a0784d");
        expectColor(card.querySelector('[aria-label="Favoriye ekle"] svg')!, "fill", theme === "mavi" ? "#2563eb" : "#967346");
        const status = card.querySelector("[data-hoyk-kapsul] > span")!;
        expectColor(status, "color", resolve(`var(--color-${["blue-600", "amber-600", "gray-700"][i]})`, theme));
      }
    }
    for (const [prop, before] of [["--tema-puan-zemini", "linear-gradient(to right, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)"], ["--tema-ek-puan-zemini", "linear-gradient(to right, #267d39 0%, #2e9143 55%, #3db856 100%)"]]) assert.equal(resolve(`var(${prop})`, "mavi"), before);
  } finally { view.close(); }
});

test("dört varsayılan kapak ve podcastin iki boyutu doğru renkleri alır; yüklenmiş kapaklar aynı kalır", () => {
  const types = ["video", "podcast", "gorsel", "flip_pdf"] as const;
  const blue = [["#1e3a8a", "#0f172a"], ["#2a1343", "#140824"], ["#064e3b", "#022c22"], ["#78350f", "#451a03"]];
  const green = [["#dfe7d7", "#edf0e6", "#456844"], ["#e8e7d8", "#f0f1e9", "#776f58"], ["#eef1e6", "#dfe7d7", "#456844"], ["#fffdf5", "#e8e7d8", "#776f58"]];
  const nodes = types.flatMap(tur => [false, true].map(kucuk => React.createElement(AracVarsayilanKapak, { aracTuru: tur, urunAdi: "Örnek", kucuk })));
  nodes.push(...[false, true].map(kucuk => React.createElement(PodcastVarsayilanKapak, { urunAdi: "Podcast", kucuk })));
  const view = applyCss(nodes.map(node => renderToStaticMarkup(node)).join(""));
  try {
    for (const theme of ["mavi", "yesil", "mavi"]) {
      document.documentElement.setAttribute("data-tema", theme);
      [...view.host.children].forEach((cover, i) => {
        const index = i < 8 ? Math.floor(i / 2) : 1;
        const expected = theme === "mavi" ? blue[index] : green[index];
        const css = window.getComputedStyle(cover);
        assert.equal(css.getPropertyValue("--tw-gradient-from"), expected[0]);
        const last = i === 8 && theme === "mavi" ? "#120721" : expected[1];
        assert.equal(css.getPropertyValue("--tw-gradient-to"), last);
        expectColor(cover, "color", theme === "mavi" ? "#fff" : green[index][2]);
      });
    }
    for (const node of [React.createElement(YayinKarti, { yayin: { ...sample, thumbnail_url: "https://example.test/gercek.jpg" } }), React.createElement(PodcastKapakGorseli, { kapakUrl: "https://example.test/podcast.jpg", urunAdi: "Podcast" })]) {
      const holder = document.createElement("div"); holder.innerHTML = renderToStaticMarkup(node);
      const image = holder.querySelector("img")!;
      assert.ok(image);
      assert.doesNotMatch(image.className, /filter|grayscale|sepia|hue-rotate|saturate/);
      assert.equal(image.style.filter, "");
      assert.equal(holder.querySelector("[data-arac-varsayilan-kapak]"), null);
    }
  } finally { view.close(); }
});

test("tema geçişinde kart seçimi, beğeni/favori callback'leri ve olayın karta taşmaması korunur", async () => {
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  let cardClicks = 0, likes = 0, favorites = 0;
  const props = { yayin: sample, onClick: () => { cardClicks++; }, onBegeni: (_: React.MouseEvent, id: string) => { assert.equal(id, "yayin"); likes++; }, onFavori: (_: React.MouseEvent, id: string) => { assert.equal(id, "yayin"); favorites++; } };
  try {
    await act(async () => root.render(React.createElement(YayinKarti, props)));
    const card = container.firstElementChild;
    for (const theme of ["mavi", "yesil"]) {
      document.documentElement.setAttribute("data-tema", theme);
      await act(async () => { container.querySelector<HTMLButtonElement>('[aria-label="Beğen"]')!.click(); container.querySelector<HTMLButtonElement>('[aria-label="Favoriye ekle"]')!.click(); });
      assert.equal(cardClicks, 0);
      assert.equal(container.firstElementChild, card);
    }
    assert.equal(likes, 2); assert.equal(favorites, 2);
    await act(async () => root.render(React.createElement(YayinKarti, { ...props, etkilesimAktif: false })));
    assert.ok([...container.querySelectorAll("button")].every(button => button.disabled));
  } finally { await act(async () => root.unmount()); container.remove(); }
});

test("podcast tema değişiminde aynı ses öğesi, transkript ve tamamlama zincirini korur", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url: string) => {
    calls.push(url);
    return new Response(JSON.stringify(url.includes("podcast-ilerleme") ? { tamamlanabilir: true } : { erisim_url: "https://example.test/podcast.m4a", kapak_url: null, transkript_metni: "**Anlatıcı:** Örnek <script> metin" }), { status: 200 });
  }) as typeof fetch;
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  let starts = 0, ends = 0, complete = 0;
  try {
    await act(async () => root.render(React.createElement(PodcastOynatici, { aracId: "arac", yayinId: "yayin", urunAdi: "Örnek", baslat: async () => { starts++; return { izlemeId: "izleme" }; }, bitir: async id => { assert.equal(id, "izleme"); ends++; }, onTamamlandi: () => { complete++; }, hata: mesaj => assert.fail(mesaj) })));
    const audio = container.querySelector("audio")!;
    assert.ok(audio); assert.ok(audio.controls); assert.equal(audio.getAttribute("controlsList"), "nodownload");
    assert.match(container.querySelector("details")!.textContent!, /Örnek <script> metin/);
    assert.equal(container.querySelector("script"), null);
    for (const theme of ["mavi", "yesil"]) {
      document.documentElement.setAttribute("data-tema", theme);
      await act(async () => audio.dispatchEvent(new window.Event("play")));
      assert.equal(container.querySelector("audio"), audio);
    }
    await act(async () => audio.dispatchEvent(new window.Event("ended")));
    assert.equal(starts, 1); assert.equal(ends, 1); assert.equal(complete, 1);
    assert.equal(calls.filter(url => url.includes("podcast-ilerleme")).length, 1);
  } finally { globalThis.fetch = originalFetch; await act(async () => root.unmount()); container.remove(); }
});

test("görsel yakınlaştırma/sıfırlama ile videonun ilk Play katmanı tema değişiminde çalışır", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ erisim_url: "https://example.test/gorsel.jpg" }), { status: 200 })) as typeof fetch;
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  const fail = async () => { assert.fail("Salt görüntüleme izleme kaydı açamaz"); return { izlemeId: "" }; };
  try {
    await act(async () => root.render(React.createElement(GorselOynatici, { aracId: "arac", yayinId: "yayin", saltGoruntuleme: true, baslat: fail, bitir: async () => { assert.fail("Salt görüntüleme tamamlama kaydı açamaz"); }, hata: mesaj => assert.fail(mesaj) })));
    const image = container.querySelector("img")!;
    for (const theme of ["mavi", "yesil"]) {
      document.documentElement.setAttribute("data-tema", theme);
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Yakınlaştır"]')!.click());
      assert.notEqual(image.style.transform, "translate(0px, 0px) scale(1)");
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Sıfırla"]')!.click());
      assert.equal(image.style.transform, "translate(0px, 0px) scale(1)");
    }
    let play = 0;
    await act(async () => root.render(React.createElement(VideoCercevesi, { genislik: 720, yukseklik: 1280, etkilesimKatmani: { ariaLabel: "Önizle", onClick: () => { play++; }, yalnizPlayButonu: true } }, React.createElement("iframe", { src: "about:blank", allow: "autoplay" }))));
    const iframe = container.querySelector("iframe");
    for (const theme of ["mavi", "yesil"]) {
      document.documentElement.setAttribute("data-tema", theme);
      await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Önizle"]')!.click());
      assert.equal(container.querySelector("iframe"), iframe);
    }
    assert.equal(play, 2);
    assert.match(container.innerHTML, /size-14/);
  } finally { globalThis.fetch = originalFetch; await act(async () => root.unmount()); container.remove(); }
});

test("HOYK süre çerçevesinin 0–15 günlük renkleri kaydedilmiş işlevsel paletle aynıdır", () => {
  const reference = JSON.parse(readFileSync("docs/renk-envanteri/ozel-bilesenler.json", "utf8")) as { hoykIlerlemeGunleri: Array<{ gun: number; uc: string }> };
  for (const theme of ["mavi", "yesil"]) {
    document.documentElement.setAttribute("data-tema", theme);
    for (const row of reference.hoykIlerlemeGunleri) assert.equal(eclubHoykUcRengi(row.gun), row.uc);
  }
});
