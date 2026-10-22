import * as baslangic from "@/lib/panel/baslangic";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Window } from "happy-dom";
import FirmaSidebar from "@/app/admin/_components/FirmaSidebar";
import ModulDurumKarti from "@/app/admin/_components/ModulDurumKarti";
import type { Firma } from "@/app/admin/_types";
import type { useAdminPanel } from "@/app/admin/_hooks/useAdminPanel";

const firma = (eclub: boolean, eczanem: boolean): Firma => ({
  firma_id: "f", firma_adi: "Sahte Firma", aktif: true, hbstore_aktif: true,
  cc_aktif: true, eclub_aktif: eclub, eclub_store_aktif: false, eczanem_aktif: eczanem,
  son_export_at: null, created_at: "2026-10-21", eksik_sayisi: 0,
});

test("admin firma anahtarı ve modül kartı E-Club kapalıyken Eczanem açılışını engeller", () => {
  const dom = new Window();
  try {
    for (const eclub of [false, true]) {
      const noop = () => {};
      dom.document.body.innerHTML = renderToStaticMarkup(React.createElement(FirmaSidebar, {
        firmalar: [firma(eclub, false)], seciliFirma: null, yeniFirmaAdi: "", loading: false,
        setYeniFirmaAdi: noop, handleFirmaEkle: noop, handleFirmaSecildi: noop,
        handleStoreToggle: noop, handleCcToggle: noop, handleEclubToggle: noop,
        handleEclubStoreToggle: noop, handleEczanemToggle: noop, handleFirmaToggle: noop,
        handleFirmaSil: async () => true, onVeriSil: noop, handleExport: noop,
      }));
      const anahtar = dom.document.querySelector<HTMLButtonElement>('button[title^="Eczanem"]');
      assert.ok(anahtar); assert.equal(anahtar.disabled, !eclub);
      dom.document.body.innerHTML = renderToStaticMarkup(React.createElement(ModulDurumKarti, {
        baslik: "Eczanem", acik: false, aciklama: "E-Club gereklidir.", toggleDisabled: !eclub, onToggle: noop,
      }));
      assert.equal(dom.document.querySelector<HTMLButtonElement>("button")?.disabled, !eclub);
    }
  } finally { dom.happyDOM.abort(); }
});

test("admin kapanış yanıtı iki anahtarı birlikte günceller; yeniden açılış Eczanem'i açmaz", async () => {
  const dom = new Window({ url: "http://localhost/admin" });
  const eski = new Map<string, PropertyDescriptor | undefined>();
  for (const [ad, deger] of Object.entries({ window: dom, document: dom.document, navigator: dom.navigator,
    HTMLElement: dom.HTMLElement, Node: dom.Node, IS_REACT_ACT_ENVIRONMENT: true })) {
    eski.set(ad, Object.getOwnPropertyDescriptor(globalThis, ad));
    Object.defineProperty(globalThis, ad, { configurable: true, writable: true, value: deger });
  }
  let kayit = firma(true, true);
  const yazmalar: unknown[] = [], hatalar: string[] = [];
  const kullanici = { rol: "admin", firma_id: null };
  const moduller: Record<string, unknown> = {
    react: React,
    "@/lib/panel/baslangic": baslangic,
    "next/navigation": { useRouter: () => ({ replace: () => {} }) },
    "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici, yukleniyor: false, cikisYap: () => {} }) },
    "@/components/HataMesaji": { useHataMesaji: () => ({ mesajlar: [], hata: (metin: string) => hatalar.push(metin), basari: () => {} }) },
    "@/lib/utils/roller": { ADMIN_ROLLER: ["admin"] },
  };
  const exports: { useAdminPanel?: typeof useAdminPanel } = {};
  const code = ts.transpileModule(readFileSync("app/admin/_hooks/useAdminPanel.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const fetch = async (url: string, options?: RequestInit) => {
    if (options?.method === "PATCH") {
      const patch = JSON.parse(String(options.body)); yazmalar.push(patch);
      kayit = { ...kayit, ...patch, ...(patch.eclub_aktif === false ? { eczanem_aktif: false } : {}) };
      return Response.json({ firma: kayit, mesaj: "Güncellendi." });
    }
    if (url === "/admin/api/firmalar") return Response.json({ firmalar: [kayit] });
    return Response.json({ kullanicilar: [], takimlar: [] });
  };
  vm.runInNewContext(code, { exports, fetch, require: (ad: string) => { assert.ok(ad in moduller, ad); return moduller[ad]; } });
  let api: ReturnType<typeof useAdminPanel>;
  function Deneme() { api = exports.useAdminPanel!(); return null; }
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(dom.document.body);
  try {
    await act(async () => root.render(React.createElement(Deneme)));
    await act(async () => api.handleFirmaSecildi(api.firmalar[0]));
    await act(async () => api.handleEclubToggle(api.seciliFirma!));
    assert.equal(api!.seciliFirma?.eclub_aktif, false);
    assert.equal(api!.seciliFirma?.eczanem_aktif, false);
    assert.equal(api!.firmalar[0].eczanem_aktif, false);
    await act(async () => api.handleEczanemToggle(api.seciliFirma!));
    assert.equal(yazmalar.length, 1); assert.match(hatalar[0], /önce E-Club/);
    await act(async () => api.handleEclubToggle(api.seciliFirma!));
    assert.equal(api!.seciliFirma?.eclub_aktif, true);
    assert.equal(api!.seciliFirma?.eczanem_aktif, false);
  } finally {
    await act(async () => root.unmount());
    await dom.happyDOM.abort();
    for (const [ad, onceki] of eski) {
      if (onceki) Object.defineProperty(globalThis, ad, onceki);
      else Reflect.deleteProperty(globalThis, ad);
    }
  }
});
