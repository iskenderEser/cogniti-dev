import test from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import { GlobalWindow } from "happy-dom";
import { useEclubStore } from "@/app/(panel)/eclub/store/_hooks/useEclubStore";
import { vitrinOnbellegi } from "@/lib/eclub/store/vitrinOnbellek";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) if (!(key in globalThis)) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: Reflect.get(win, key) });
}
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
const { createRoot } = await import("react-dom/client");

test("çek vitrinine dönüş beklemez; güncellik, talep sonrası yenileme ve kapsam ayrımı korunur", async () => {
  const eskiFetch = globalThis.fetch;
  const eskiSaat = Date.now;
  let saat = eskiSaat();
  Date.now = () => saat;
  const payload = (ad: string) => ({ firma: { firma_id: "f", firma_adi: ad, eclub_store_aktif: true }, cek_yayinlar: [] });
  await vitrinOnbellegi.iste("cek-kisi:f", async () => payload("Eski"));
  saat += 61_000;
  let tamamla!: (r: Response) => void;
  const calls: string[] = [];
  globalThis.fetch = ((url: string, opts?: RequestInit) => {
    calls.push(`${opts?.method ?? "GET"} ${url}`);
    if (opts?.method === "POST") return Promise.resolve(Response.json({ mesaj: "Talep alındı" }));
    return new Promise<Response>(r => { tamamla = r; });
  }) as typeof fetch;
  const hatalar: string[] = [];
  const hata = (s: string) => { hatalar.push(s); };
  const basari = () => undefined;
  let store!: ReturnType<typeof useEclubStore>;
  function Probe({ user = "cek-kisi" }: { user?: string }) {
    const durum = useEclubStore({ hata, basari, firmaId: "f", onbellekKullaniciId: user });
    React.useEffect(() => { store = durum; });
    return React.createElement("button", { disabled: durum.yenileniyor }, durum.loading ? "Bekliyor" : durum.firma?.firma_adi ?? "Boş");
  }
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await React.act(async () => root.render(React.createElement(Probe)));
    assert.equal(container.textContent, "Eski");
    assert.equal(container.querySelector("button")!.disabled, true);
    await React.act(async () => tamamla(Response.json(payload("Güncel"))));
    assert.equal(container.textContent, "Güncel");
    assert.equal(container.querySelector("button")!.disabled, false);
    let talep!: Promise<boolean>;
    await React.act(async () => { talep = store.cekTalebiOlustur("y", false); });
    assert.equal(container.querySelector("button")!.disabled, true);
    assert.equal(vitrinOnbellegi.oku("cek-kisi:f", 300_000), null);
    await React.act(async () => { tamamla(Response.json(payload("Talep sonrası"))); assert.equal(await talep, true); });
    assert.equal(container.textContent, "Talep sonrası");
    assert.equal(vitrinOnbellegi.oku("cek-kisi:f")?.firma?.firma_adi, "Talep sonrası");
    assert.ok(calls.includes("POST /eclub/api/cek-talepleri"));
    await React.act(async () => root.render(null));
    await React.act(async () => root.render(React.createElement(Probe)));
    await React.act(async () => tamamla(Response.json({ hata: "Yetki yok" }, { status: 403 })));
    assert.equal(container.textContent, "Boş");
    assert.equal(vitrinOnbellegi.oku("cek-kisi:f", 300_000), null);
    assert.deepEqual(hatalar, ["Yetki yok"]);
    await vitrinOnbellegi.iste("cek-kisi:f", async () => payload("Başka kişi"));
    await React.act(async () => root.render(React.createElement(Probe, { user: "yeni-kisi" })));
    assert.equal(container.textContent, "Bekliyor");
    await React.act(async () => tamamla(Response.json(payload("Yeni kişi"))));
  } finally {
    await React.act(async () => root.unmount());
    Date.now = eskiSaat; globalThis.fetch = eskiFetch;
  }
});
