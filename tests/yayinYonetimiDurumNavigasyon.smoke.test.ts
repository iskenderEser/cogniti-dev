import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("YayinYonetimiPage useSearchParams ile durum ve hedef parametrelerini okur ve baslangic state'ine baglar", () => {
  const sayfa = readFileSync("app/(panel)/yayin-yonetimi/page.tsx", "utf8");
  assert.match(sayfa, /useSearchParams/);
  assert.match(sayfa, /searchParams\.get\("durum"\)/);
  assert.match(sayfa, /searchParams\.get\("hedef"\)/);
  assert.match(sayfa, /useState<YayinHedefGrubu>\(baslangicHedef \?\? "utt"\)/);
  assert.match(sayfa, /useState<AltSekme>\(baslangicDurum\)/);
  assert.match(sayfa, /<Suspense/);
});
