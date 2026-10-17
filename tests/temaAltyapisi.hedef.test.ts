import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { VARSAYILAN_TEMA } from "@/lib/tema/temalar";

const css = readFileSync(new URL("../app/tema.css", import.meta.url), "utf8");
const kontrolCss = readFileSync(new URL("../components/kontrol/sade-kontroller.module.css", import.meta.url), "utf8");
const kontrolReferansi = JSON.parse(readFileSync(new URL("../docs/ortak-gorsel-sistem/SADE_KONTROL_CSS_REFERANSI.json", import.meta.url), "utf8")) as { bildirimler: Array<{ ozellik: string; deger: string }> };
const eskiKontrolRenkleri = new Map(kontrolReferansi.bildirimler.filter(bildirim => bildirim.ozellik.startsWith("--")).map(bildirim => [bildirim.ozellik, bildirim.deger]));
const kontrolRenkleri = [
  { yerel: "--surface", ortak: "--tema-kontrol-yuzey", palet: "--tema-yuzey" },
  { yerel: "--text", ortak: "--tema-kontrol-metin", palet: "--tema-metin" },
  { yerel: "--muted", ortak: "--tema-kontrol-ikincil-metin", palet: "--tema-ikincil-metin" },
  { yerel: "--line", ortak: "--tema-kontrol-cizgi", palet: "--tema-cizgi" },
  { yerel: "--blue", ortak: "--tema-kontrol-eylem", palet: "--tema-eylem" },
  { yerel: "--hover", ortak: "--tema-kontrol-hover", palet: "--tema-secili" },
];

function ortam(icerik: string) {
  const window = new Window();
  window.document.documentElement.setAttribute("data-tema", VARSAYILAN_TEMA);
  window.document.head.innerHTML = `<style>${css}</style>`;
  window.document.body.innerHTML = icerik;
  return window;
}

function renk(window: Window, id: string, degisken: string) {
  const eleman = window.document.getElementById(id)!;
  eleman.style.color = `var(${degisken})`;
  return window.getComputedStyle(eleman).color;
}

test("varsayılan tema mevcut genel ve shadcn renklerini korur", async () => {
  const window = ortam('<span id="ornek"></span>');
  try {
    assert.equal(renk(window, "ornek", "--background"), "#ffffff");
    assert.equal(renk(window, "ornek", "--foreground"), "#171717");
    assert.equal(renk(window, "ornek", "--primary"), "#56aeff");
    assert.equal(renk(window, "ornek", "--secondary"), "#f4f4f5");
    assert.equal(renk(window, "ornek", "--border"), "#e5e7eb");
  } finally { await window.happyDOM.close(); }
});

test("yeşil tema hem ana paleti hem bileşen eşlemelerini değiştirir; kardeş kapsam mavi kalır", async () => {
  const window = ortam('<section data-tema="yesil"><span id="yesil"></span></section><span id="disarisi"></span>');
  try {
    assert.equal(renk(window, "yesil", "--tema-zemin"), "#f8f8f3");
    assert.equal(renk(window, "yesil", "--tema-metin"), "#2c4137");
    assert.equal(renk(window, "yesil", "--primary"), "#355545");
    assert.equal(renk(window, "yesil", "--popover"), "#fffefb");
    assert.equal(renk(window, "yesil", "--border"), "#dfe3d7");
    assert.equal(renk(window, "disarisi", "--tema-zemin"), "#f9fafb");
    assert.equal(renk(window, "disarisi", "--primary"), "#56aeff");
  } finally { await window.happyDOM.close(); }
});

test("yeşil alanın içindeki açık mavi tema üst kapsamın eşlemelerini taşımadan sıfırlanır", async () => {
  const window = ortam('<section data-tema="yesil"><div data-tema="mavi"><span id="ic"></span></div></section><span id="kok"></span>');
  try {
    for (const degisken of ["--background", "--foreground", "--card", "--popover", "--primary", "--primary-foreground", "--secondary", "--muted-foreground", "--border", "--ring", "--tema-zemin", "--tema-puan-metni", ...kontrolRenkleri.map(renk => renk.ortak)]) {
      assert.equal(renk(window, "ic", degisken), renk(window, "kok", degisken), degisken);
    }
  } finally { await window.happyDOM.close(); }
});

test("aynı alanda tema değişimi iki yönde işler; hata ve başarı anlamı korunur", async () => {
  const window = ortam('<section id="alan" data-tema="mavi"><span id="ornek"></span></section>');
  try {
    const alan = window.document.getElementById("alan")!;
    for (const [tema, beklenen] of [["yesil", "#355545"], ["mavi", "#2563eb"], ["yesil", "#355545"]]) {
      alan.setAttribute("data-tema", tema);
      assert.equal(renk(window, "ornek", "--tema-eylem"), beklenen);
      assert.equal(renk(window, "ornek", "--tema-hata"), "#e24b4a");
      assert.equal(renk(window, "ornek", "--tema-basari"), "#15803d");
    }
  } finally { await window.happyDOM.close(); }
});

test("kontrol renkleri mevcut mavi CSS değerlerini korur; yeşil geçişi kardeş kapsamı etkilemez", async () => {
  const window = ortam('<section id="alan" data-tema="mavi"><button id="kontrol" class="trigger"></button></section><button id="kardes" class="trigger"></button>');
  const stil = window.document.createElement("style");
  stil.textContent = kontrolCss;
  window.document.head.appendChild(stil);
  try {
    const alan = window.document.getElementById("alan")!;
    for (const tema of ["mavi", "yesil", "mavi"]) {
      alan.setAttribute("data-tema", tema);
      for (const esleme of kontrolRenkleri) {
        assert.equal(renk(window, "kontrol", esleme.ortak), tema === "mavi" ? eskiKontrolRenkleri.get(esleme.yerel) : renk(window, "kontrol", esleme.palet), `${tema}: ${esleme.ortak}`);
        assert.equal(renk(window, "kontrol", esleme.yerel), renk(window, "kontrol", esleme.ortak), `gerçek tüketici: ${esleme.yerel}`);
        assert.equal(renk(window, "kardes", esleme.ortak), eskiKontrolRenkleri.get(esleme.yerel), `kardeş kapsam: ${esleme.ortak}`);
      }
    }
  } finally { await window.happyDOM.close(); }
});

test("gerçek kontrol CSS'si kişi, tablo, form, menü, kapsül ve sekmeyi iki temada boyar", async () => {
  const window = ortam(`<section id="alan" data-tema="mavi">
    <span id="referans"></span>
    <button id="kisi" class="trigger"><span id="alt" class="sub">Alt bilgi</span><span id="ok" class="arrow"></span></button>
    <button id="tablo" class="trigger" data-variant="table"></button>
    <button id="form" class="trigger" data-variant="form"></button>
    <div id="menu" class="menu"><input id="arama" class="search"><button id="secenek" class="option" aria-pressed="true"></button></div>
    <div class="capsule"><button id="kapsul" aria-pressed="true"></button><button id="pasif" disabled></button></div>
    <div class="tabs"><button id="sekme" data-state="active"></button></div>
    <div class="field"><select id="native" class="native"></select></div><input id="tarih" class="date" type="date">
    <div data-tema="mavi"><button id="icMavi" class="trigger"></button></div>
  </section><button id="disMavi" class="trigger"></button>`);
  const stil = window.document.createElement("style");
  stil.textContent = kontrolCss;
  window.document.head.appendChild(stil);
  try {
    const alan = window.document.getElementById("alan")!;
    for (const tema of ["mavi", "yesil", "mavi"]) {
      alan.setAttribute("data-tema", tema);
      const deger = (degisken: string) => renk(window, "referans", degisken);
      const bekle = (id: string, ozellik: string, beklenen: string) => assert.equal(window.getComputedStyle(window.document.getElementById(id)!).getPropertyValue(ozellik), beklenen, `${tema}: ${id}/${ozellik}`);
      for (const id of ["kisi", "tablo", "form", "menu", "arama", "native", "tarih"]) bekle(id, "background-color", deger("--tema-kontrol-yuzey"));
      for (const id of ["kisi", "tablo", "tarih", "kapsul", "sekme", "secenek"]) bekle(id, id === "kapsul" ? "background-color" : "color", deger("--tema-kontrol-eylem"));
      for (const id of ["form", "menu", "arama", "native"]) bekle(id, "color", deger("--tema-kontrol-metin"));
      bekle("secenek", "background-color", deger("--tema-kontrol-hover"));
      bekle("kapsul", "color", deger("--tema-kontrol-eylem-metin"));
      bekle("alt", "color", deger("--tema-kontrol-ikincil-metin"));
      bekle("ok", "border-right-color", deger("--tema-kontrol-ikincil-metin"));
      bekle("kisi", "border-top-color", deger("--tema-kontrol-cizgi"));
      bekle("pasif", "opacity", ".5");
      for (const id of ["icMavi", "disMavi"]) bekle(id, "color", eskiKontrolRenkleri.get("--blue")!);
    }
  } finally { await window.happyDOM.close(); }
});
