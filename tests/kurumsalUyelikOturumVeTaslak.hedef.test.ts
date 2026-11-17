import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import {
  kurumsalTaslagiTemizle,
  SON_ETKILESIM_ANAHTARI,
  TASLAK_FIRMA_ANAHTARI,
  TASLAK_ISIM_LISTESI_ANAHTARI,
  TASLAK_SOZLESME_ANAHTARI,
  TASLAK_URUN_LISTESI_ANAHTARI,
  taslakOku,
  taslakSil,
  taslakYaz,
} from "@/app/kurumsal-uyelik/kurumsalTaslak";

function sahteSessionStorageKur() {
  const depo = new Map<string, string>();
  const storage = {
    getItem: (k: string) => depo.get(k) ?? null,
    setItem: (k: string, v: string) => { depo.set(k, v); },
    removeItem: (k: string) => { depo.delete(k); },
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: storage },
  });
  return depo;
}

test("aday oturumu varken /uyelik-basvurusu boş sayfa yerine doğrudan /kurumsal-uyelik adresine yönlendirir", async () => {
  let yonlendirilenYol = "";
  const modules: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: () => null },
    "next/navigation": {
      redirect: (yol: string) => {
        yonlendirilenYol = yol;
        throw new Error(`REDIRECT:${yol}`);
      },
    },
    "lucide-react": { Clock: () => null, LogIn: () => null },
    "@/components/marka/CognitiLogo": { default: () => null },
    "@/app/_components/montserrat": { montserrat: { className: "montserrat" } },
    "@/app/login/login.module.css": { default: {} },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) },
    "@/lib/firma/kurumsalBasvuru": { adayOturumu: async () => ({ id: "aday-123" }) },
    "./BasvuruIslemi": { default: () => null },
    "./SurecAdimlari": { default: () => null },
  };

  const exports: { default?: (props: { searchParams: Promise<Record<string, string>> }) => Promise<unknown> } = {};
  const compiled = ts.transpileModule(readFileSync("app/uyelik-basvurusu/page.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;

  vm.runInNewContext(compiled, {
    exports,
    require: (id: string) => {
      assert.ok(id in modules, `Beklenmeyen modül: ${id}`);
      return modules[id];
    },
  });

  await assert.rejects(
    () => exports.default!({ searchParams: Promise.resolve({}) }),
    /REDIRECT:\/kurumsal-uyelik/,
  );
  assert.equal(yonlendirilenYol, "/kurumsal-uyelik");
});

test("kurumsal taslak yardımcıları firma, sözleşme ve liste verilerini sessionStorage üzerinde saklar ve topluca temizler", () => {
  const depo = sahteSessionStorageKur();

  taslakYaz(TASLAK_FIRMA_ANAHTARI, {
    bilgiler: { firma_adi: "Örnek İlaç A.Ş.", vergi_numarasi: "1234567890" },
    logoDosyaAdi: "logo.png",
  });
  taslakYaz(TASLAK_SOZLESME_ANAHTARI, { indirmeBasladi: true });
  taslakYaz(TASLAK_ISIM_LISTESI_ANAHTARI, [["Takım A", "İstanbul", "UTT", "Ad Soyad", "a@b.co", "5551112233"]]);
  taslakYaz(TASLAK_URUN_LISTESI_ANAHTARI, [["Takım A", "8690000000001", "Ürün X", "PM Ad"]]);
  taslakYaz(SON_ETKILESIM_ANAHTARI, 1700000000000);

  assert.deepEqual(taslakOku(TASLAK_FIRMA_ANAHTARI), {
    bilgiler: { firma_adi: "Örnek İlaç A.Ş.", vergi_numarasi: "1234567890" },
    logoDosyaAdi: "logo.png",
  });
  assert.deepEqual(taslakOku(TASLAK_SOZLESME_ANAHTARI), { indirmeBasladi: true });
  assert.equal(depo.size, 5);

  taslakSil(TASLAK_URUN_LISTESI_ANAHTARI);
  assert.equal(taslakOku(TASLAK_URUN_LISTESI_ANAHTARI), null);

  kurumsalTaslagiTemizle();
  assert.equal(depo.size, 0);
});
