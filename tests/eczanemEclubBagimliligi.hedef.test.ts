import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eczanemRolErisimi } from "@/lib/eczanem/erisim";
import { eclubKisiModulDurumu } from "@/lib/eclub/kisiErisim";
import { PANEL_NAV, eclubKisiNavOlustur, type NavContext } from "@/components/panel/panelNav.config";
import { ECLUB_TUKETICI_ROLLERI, TUM_ROLLER } from "@/lib/utils/roller";
import * as hataIsle from "@/lib/utils/hataIsle";

const id = "00000000-0000-4000-8000-000000000001";
const firma = (eclub: boolean, eczanem: boolean, firma_id = id) => ({
  firma_id, firma_adi: "Sahte Firma", aktif: true,
  eclub_aktif: eclub, eczanem_aktif: eczanem, eclub_store_aktif: false,
});

function erisimDb(firmalar: ReturnType<typeof firma>[]) {
  const tablolar: Record<string, Array<Record<string, unknown>>> = {
    firmalar,
    kullanicilar: [{ kullanici_id: id, firma_id: id, takim_id: id }],
    eclub_kisiler: [{ auth_user_id: id, kisi_id: id }],
    eclub_kisi_eczane: [{ kisi_id: id, eczane_id: id, aktif_mi: true }],
    eclub_eczane_firma: firmalar.map(f => ({ eczane_id: id, firma_id: f.firma_id, aktif_mi: true })),
    eczanem_musteriler: [{ auth_user_id: id, musteri_id: id, aktif_mi: true }],
    eczanem_uyelikler: [{ musteri_id: id, eczane_id: id, aktif_mi: true }],
  };
  return { from(tablo: string) {
    assert.ok(tablo in tablolar, tablo);
    let satirlar = tablolar[tablo];
    const sonuc = () => ({ data: satirlar, error: null });
    const sorgu = {
      select: () => sorgu,
      eq: (alan: string, deger: unknown) => { satirlar = satirlar.filter(r => r[alan] === deger); return sorgu; },
      in: (alan: string, degerler: unknown[]) => { satirlar = satirlar.filter(r => degerler.includes(r[alan])); return sorgu; },
      maybeSingle: async () => ({ data: satirlar[0] ?? null, error: null }),
      then: (resolve: (value: ReturnType<typeof sonuc>) => unknown) => Promise.resolve(sonuc()).then(resolve),
    };
    return sorgu;
  } } as unknown as SupabaseClient;
}

const yetkiliRoller = ["utt", "kd_utt", "bm", "tm", ...ECLUB_TUKETICI_ROLLERI, "musteri"];
for (const [eclub, eczanem] of [[false, false], [false, true], [true, false], [true, true]]) {
  test(`erişim tablosu E-Club=${eclub}, Eczanem=${eczanem}: bütün ilgili roller`, async () => {
    const db = erisimDb([firma(eclub, eczanem)]);
    for (const rol of yetkiliRoller) {
      const sonuc = await eczanemRolErisimi(db, id, rol);
      assert.equal(sonuc.ok, true, rol);
      assert.equal(sonuc.acik, eclub && eczanem, rol);
    }
  });
}

test("iki firmanın ayrı açık bayrakları birleştirilmez; ikinci açık firma erişimi korur", async () => {
  const diger = "00000000-0000-4000-8000-000000000002";
  const firmalar = [firma(true, false), firma(false, true, diger)];
  assert.equal(eclubKisiModulDurumu(firmalar).eczanem_aktif, false);
  for (const rol of [...ECLUB_TUKETICI_ROLLERI, "musteri"]) {
    assert.equal((await eczanemRolErisimi(erisimDb(firmalar), id, rol)).acik, false);
    const acik = await eczanemRolErisimi(erisimDb([firma(false, true), firma(true, true, diger)]), id, rol);
    assert.equal(acik.acik, true);
    assert.deepEqual(acik.firmaIdler, [diger]);
  }
});

test("menüler bütün rollerde E-Club kapalıyken Eczanem'i göstermez", () => {
  const gruplar = [...PANEL_NAV, ...eclubKisiNavOlustur([])].filter(g => g.baslik === "Eczanem");
  for (const rolKucu of [...TUM_ROLLER, ...ECLUB_TUKETICI_ROLLERI, "musteri"]) {
    const ctx: NavContext = { rolKucu, storeAcik: false, ccAcik: false, eclubStoreAcik: false, eclubAcik: false, eczanemAcik: true };
    for (const grup of gruplar) for (const oge of grup.oglar) assert.equal(oge.gate(ctx), false, `${rolKucu}/${oge.etiket}`);
  }
});

function adminApi(eclub: boolean, eczanem: boolean, secenek: { yetkili?: boolean; kapanmaYarisi?: boolean; hata?: { code: string; message: string } } = {}) {
  const kayit = { ...firma(eclub, eczanem), hbstore_aktif: true, cc_aktif: true };
  const yazmalar: Array<Record<string, unknown>> = [];
  const db = { from: (tablo: string) => {
    assert.equal(tablo, "firmalar");
    let degisiklik: Record<string, unknown> = {};
    const filtreler: Array<[string, unknown]> = [];
    const sorgu = {
      update: (veri: Record<string, unknown>) => { degisiklik = veri; return sorgu; },
      eq: (alan: string, deger: unknown) => { filtreler.push([alan, deger]); return sorgu; },
      select: () => sorgu,
      maybeSingle: async () => {
        if (secenek.kapanmaYarisi) { kayit.eclub_aktif = false; kayit.eczanem_aktif = false; }
        if (secenek.hata) return { data: null, error: secenek.hata };
        if (!filtreler.every(([alan, deger]) => kayit[alan as keyof typeof kayit] === deger)) return { data: null, error: null };
        yazmalar.push({ ...degisiklik });
        Object.assign(kayit, degisiklik);
        return { data: { ...kayit }, error: null };
      },
    };
    return sorgu;
  } };
  const moduller: Record<string, unknown> = {
    "next/server": { NextResponse: Response },
    "@/lib/supabase/server": { createAdminClient: () => db },
    "@/lib/utils/hataIsle": hataIsle,
    "@/lib/firma/kolonlar": { FIRMA_KOLONLARI: "firma_id,eclub_aktif,eczanem_aktif" },
    "@/lib/utils/adminGirisKontrol": { adminGirisKontrol: async () => secenek.yetkili === false
      ? { gecerli: false, yanit: Response.json({}, { status: 403 }) } : { gecerli: true } },
    "@/lib/admin/kullaniciDogrulama": { firmaninEksikKullanicilari: async () => ({ ok: true, eksikler: [] }) },
    "@/lib/utils/firmaAdiBicimle": {},
    "@/lib/admin/hiyerarsiTekillik": {},
  };
  const exports: { PATCH?: (request: Request, context: { params: Promise<{ firma_id: string }> }) => Promise<Response> } = {};
  const code = ts.transpileModule(readFileSync("app/admin/api/firmalar/[firma_id]/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (ad: string) => { assert.ok(ad in moduller, ad); return moduller[ad]; } });
  return { kayit, yazmalar, patch: (body: unknown) => exports.PATCH!(new Request("http://localhost/admin", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }), { params: Promise.resolve({ firma_id: id }) }) };
}

test("admin E-Club kapalıyken Eczanem açamaz; açıkken açabilir", async () => {
  for (const acik of [false, true]) {
    const api = adminApi(acik, false);
    const res = await api.patch({ eczanem_aktif: true });
    assert.equal(res.status, acik ? 200 : 400);
    assert.equal(api.kayit.eczanem_aktif, acik);
    assert.equal(api.yazmalar.length, acik ? 1 : 0);
  }
  const celiskili = adminApi(true, true);
  assert.equal((await celiskili.patch({ eclub_aktif: false, eczanem_aktif: true })).status, 400);
  assert.equal(celiskili.yazmalar.length, 0);
});

test("E-Club kapatması Eczanem'i aynı UPDATE ile kapatır; tekrar açmak alt modülü açmaz", async () => {
  const api = adminApi(true, true);
  const kapanis = await api.patch({ eclub_aktif: false });
  assert.equal(kapanis.status, 200);
  assert.equal(api.kayit.eclub_aktif, false);
  assert.equal(api.kayit.eczanem_aktif, false);
  assert.equal(JSON.stringify(api.yazmalar[0]), JSON.stringify({ eclub_aktif: false, eczanem_aktif: false }));
  assert.equal((await kapanis.json()).firma.eczanem_aktif, false);
  assert.equal((await api.patch({ eclub_aktif: true })).status, 200);
  assert.equal(api.kayit.eczanem_aktif, false);
  assert.equal(api.kayit.hbstore_aktif, true);
  assert.equal(api.kayit.cc_aktif, true);
});

test("aynı istekte iki modül açılabilir; yalnız Eczanem kapatılınca E-Club açık kalır", async () => {
  const api = adminApi(false, false);
  assert.equal((await api.patch({ eclub_aktif: true, eczanem_aktif: true })).status, 200);
  assert.equal(api.kayit.eczanem_aktif, true);
  assert.equal((await api.patch({ eczanem_aktif: false })).status, 200);
  assert.equal(api.kayit.eclub_aktif, true);
});

test("eş zamanlı kapanış Eczanem açılışını geçersiz kılar; DB kısıt hatası anlaşılır döner", async () => {
  const api = adminApi(true, false, { kapanmaYarisi: true });
  assert.equal((await api.patch({ eczanem_aktif: true })).status, 400);
  assert.equal(api.yazmalar.length, 0);
  const kisit = adminApi(true, false, { hata: { code: "23514", message: 'violates check constraint "firmalar_eczanem_eclub_bagimliligi"' } });
  const res = await kisit.patch({ eczanem_aktif: true });
  assert.equal(res.status, 400);
  assert.match((await res.json()).hata, /önce E-Club/);
});

test("admin olmayan kullanıcı modül değiştiremez", async () => {
  const api = adminApi(true, true, { yetkili: false });
  assert.equal((await api.patch({ eclub_aktif: false })).status, 403);
  assert.equal(api.yazmalar.length, 0);
});
