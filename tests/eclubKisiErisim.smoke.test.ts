import test from "node:test";
import assert from "node:assert/strict";

import { eclubKisiModulDurumu } from "@/lib/eclub/kisiErisim";

test("mutlu: en az bir aktif bağlı firma E-Club, Store ve Eczanem erişimini açar", () => {
  const sonuc = eclubKisiModulDurumu([
    { firma_id: "a", firma_adi: "A", aktif: true, eclub_aktif: true, eclub_store_aktif: true, eczanem_aktif: true },
    { firma_id: "b", firma_adi: "B", aktif: true, eclub_aktif: false, eclub_store_aktif: true, eczanem_aktif: false },
  ]);
  assert.deepEqual(sonuc, { eclub_aktif: true, eclub_store_aktif: true, eczanem_aktif: true });
});

test("sınır: E-Club kapalı veya firma pasifken Eczanem açılmaz", () => {
  const sonuc = eclubKisiModulDurumu([
    { firma_id: "a", firma_adi: "A", aktif: false, eclub_aktif: true, eclub_store_aktif: true, eczanem_aktif: true },
    { firma_id: "b", firma_adi: "B", aktif: true, eclub_aktif: false, eclub_store_aktif: true, eczanem_aktif: true },
  ]);
  assert.deepEqual(sonuc, { eclub_aktif: false, eclub_store_aktif: false, eczanem_aktif: false });
});

test("bir firmanın E-Club'ı başka firmanın Eczanem bayrağını açmaz", () => {
  assert.deepEqual(eclubKisiModulDurumu([
    { firma_id: "a", firma_adi: "A", aktif: true, eclub_aktif: true, eclub_store_aktif: false, eczanem_aktif: false },
    { firma_id: "b", firma_adi: "B", aktif: true, eclub_aktif: false, eclub_store_aktif: false, eczanem_aktif: true },
  ]), { eclub_aktif: true, eclub_store_aktif: false, eczanem_aktif: false });
});
