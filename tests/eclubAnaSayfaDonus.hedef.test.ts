import test from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import { GlobalWindow } from "happy-dom";
import { useEclubPanel } from "@/app/(panel)/eclub/panel/_hooks/useEclubPanel";
import { panelOnbellegineYaz, panelOnbelleginiOku } from "@/lib/eclub/anaSayfaPanelOnbellek";
import { anaSayfaBannerlariniIste, anaSayfaBannerOnbelleginiOku } from "@/lib/eclub/anaSayfaBannerOnbellek";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) if (!(key in globalThis)) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: Reflect.get(win, key) });
}
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
const { createRoot } = await import("react-dom/client");

test("60 saniye dolmuş panel hemen açılır, ağ sonucu yeniler; zorunlu yenileme ve yetki hatası önbelleği aşar", async () => {
  const eskiFetch = globalThis.fetch;
  const eskiSaat = Date.now;
  let saat = eskiSaat();
  Date.now = () => saat;
  panelOnbellegineYaz("donus:genel", { kisi: { ad: "Eski", soyad: "", rol: "" } });
  saat += 61_000;
  let tamamla!: (r: Response) => void;
  let istekSayisi = 0;
  globalThis.fetch = (() => { istekSayisi++; return new Promise<Response>(r => { tamamla = r; }); }) as typeof fetch;
  let panel!: ReturnType<typeof useEclubPanel>;
  const hatalar: string[] = [];
  const hata = (s: string) => { hatalar.push(s); };
  function Probe({ user = "donus" }: { user?: string }) {
    const durum = useEclubPanel({ hazir: true, hata, onbellekKullaniciId: user, acilistaArkaPlandaYenile: true });
    React.useEffect(() => { panel = durum; });
    return React.createElement("span", null, durum.loading ? "Bekliyor" : durum.kisi?.ad ?? "Boş");
  }
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await React.act(async () => root.render(React.createElement(Probe)));
    assert.equal(container.textContent, "Eski");
    assert.equal(istekSayisi, 1);
    assert.equal(panelOnbelleginiOku("donus:genel", 300_000)?.kisi?.ad, "Eski");
    await React.act(async () => tamamla(Response.json({ kisi: { ad: "Güncel", soyad: "", rol: "" } })));
    assert.equal(container.textContent, "Güncel");
    assert.equal(panelOnbelleginiOku("donus:genel")?.kisi?.ad, "Güncel");
    let yenileme!: Promise<void>;
    await React.act(async () => { yenileme = panel.veriCek(); });
    assert.equal(container.textContent, "Bekliyor");
    await React.act(async () => { tamamla(Response.json({ hata: "Yetki yok" }, { status: 403 })); await yenileme; });
    assert.equal(container.textContent, "Boş");
    assert.deepEqual(hatalar, ["Yetki yok"]);
    assert.equal(panelOnbelleginiOku("donus:genel", 300_000), null);
    panelOnbellegineYaz("donus:genel", { kisi: { ad: "Başka kullanıcı", soyad: "", rol: "" } });
    await React.act(async () => root.render(React.createElement(Probe, { user: "yeni" })));
    assert.equal(container.textContent, "Bekliyor");
    await React.act(async () => tamamla(Response.json({})));
  } finally {
    await React.act(async () => root.unmount());
    globalThis.fetch = eskiFetch; Date.now = eskiSaat;
  }
});

test("beş dakikalık sınır, okuma ile uzamaz; banner arka planda yenilenirken eldeki görsel korunur", async () => {
  const eskiFetch = globalThis.fetch;
  const eskiSaat = Date.now;
  let saat = eskiSaat();
  Date.now = () => saat;
  try {
    panelOnbellegineYaz("sinir:genel", {});
    saat += 299_000;
    assert.ok(panelOnbelleginiOku("sinir:genel", 300_000));
    saat += 1_000;
    assert.equal(panelOnbelleginiOku("sinir:genel", 300_000), null);
    globalThis.fetch = (async () => Response.json({ bannerlar: [{ sira: 1, url: "/eski.webp" }] })) as typeof fetch;
    await anaSayfaBannerlariniIste("banner-donus");
    saat += 61_000;
    let tamamla!: (r: Response) => void;
    globalThis.fetch = (() => new Promise<Response>(r => { tamamla = r; })) as typeof fetch;
    const istek = anaSayfaBannerlariniIste("banner-donus", true);
    assert.equal(anaSayfaBannerOnbelleginiOku("banner-donus")?.[0].url, "/eski.webp");
    assert.equal(anaSayfaBannerlariniIste("banner-donus"), istek);
    tamamla(Response.json({ bannerlar: [{ sira: 1, url: "/yeni.webp" }] }));
    await istek;
    assert.equal(anaSayfaBannerOnbelleginiOku("banner-donus")?.[0].url, "/yeni.webp");
    assert.equal(anaSayfaBannerOnbelleginiOku("baska-kullanici"), null);
    saat += 300_000;
    assert.equal(anaSayfaBannerOnbelleginiOku("banner-donus"), null);
  } finally { globalThis.fetch = eskiFetch; Date.now = eskiSaat; }
});
