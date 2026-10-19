import assert from "node:assert/strict";
import test from "node:test";
import { GlobalWindow } from "happy-dom";
import { kityHedefiniBekle, kityHedefiniBul } from "@/lib/rehber/kityHedef";

const win = new GlobalWindow();
Object.assign(globalThis, { document: win.document, MutationObserver: win.MutationObserver });

test("masaüstü ve mobil kopyalarından yalnız görünür hedef seçilir", () => {
  const gizli = win.document.createElement("button");
  const gorunur = win.document.createElement("button");
  for (const eleman of [gizli, gorunur]) { eleman.dataset.kityMenu = "T-Club"; win.document.body.appendChild(eleman); }
  gorunur.getBoundingClientRect = () => ({ left: 10, top: 10, right: 110, bottom: 50, width: 100, height: 40, x: 10, y: 10, toJSON() {} });
  try {
    assert.equal(kityHedefiniBul({ hedefId: "sanal-menu", hedefSecici: '[data-kity-menu="T-Club"]' }), gorunur);
  } finally { gizli.remove(); gorunur.remove(); }
});

test("profil yüklenmeden hedef hazır sayılmaz; yüklenince bekleme tamamlanır", async () => {
  const signal = new AbortController();
  let bitti = false;
  const bekleme = kityHedefiniBekle({ hedefId: "profil-hazir" }, signal.signal).then(() => { bitti = true; });
  await Promise.resolve();
  assert.equal(bitti, false);
  const profil = win.document.createElement("section");
  profil.id = "profil-hazir";
  win.document.body.appendChild(profil);
  try { await bekleme; assert.equal(bitti, true); }
  finally { profil.remove(); }
});

test("kapatılan turun profil beklemesi iptal olur; eksik hedef süre sonunda çözülür", async () => {
  const iptal = new AbortController();
  const bekleme = kityHedefiniBekle({ hedefId: "iptal-hedefi" }, iptal.signal);
  iptal.abort();
  await assert.rejects(bekleme, { name: "AbortError" });
  await assert.rejects(kityHedefiniBekle({ hedefId: "olmayan-hedef" }, new AbortController().signal, 20), /yüklenemedi/);
});
