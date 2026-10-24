import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { uttKilavuzunuSec } from "../lib/rehber/uttKilavuzu.ts";

function metin(eclub: boolean, eczanem: boolean) {
  const kilavuz = uttKilavuzunuSec(eclub, eczanem);
  return [...kilavuz.giris, ...kilavuz.bolumler.flatMap(b => [b.baslik, ...b.parcalar.flatMap(p => p.tip === "liste" ? p.maddeler : [p.metin])])].join("\n");
}

for (const eczanem of [false, true]) {
  test(`E-Club kapalıyken Eczanem=${eczanem}: bütün modül anlatımları gizlenir`, () => {
    const yazi = metin(false, eczanem);
    assert.doesNotMatch(yazi, /E-Club|Eczanem|Mutabakat|C-Club/);
    assert.match(yazi, /T-Club Raporları/);
    assert.match(yazi, /Extra puan nasıl kazanılır/);
  });
}

test("Yalnız E-Club açıkken takım, puan ve lig korunur; Eczanem ve Mutabakat gizlenir", () => {
  const yazi = metin(true, false);
  assert.match(yazi, /E-Club takımınız/);
  assert.match(yazi, /E-Club Ligi/);
  assert.match(yazi, /15 günlük süre/);
  assert.match(yazi, /E-Club gönderimi öncesinde/);
  assert.doesNotMatch(yazi, /Eczanem|Mutabakat|C-Club/);
});

test("Her modül birleşiminde altı bölüm ve başlığıyla birlikte gösterilen içerik korunur", () => {
  for (const eclub of [false, true]) for (const eczanem of [false, true]) {
    const kilavuz = uttKilavuzunuSec(eclub, eczanem);
    assert.equal(kilavuz.bolumler.length, 6);
    for (const bolum of kilavuz.bolumler) {
      assert.ok(bolum.parcalar.length > 0);
      bolum.parcalar.forEach((p, i) => {
        if (p.tip === "baslik") assert.ok(bolum.parcalar[i + 1] && bolum.parcalar[i + 1].tip !== "baslik", p.metin);
      });
    }
  }
});

test("Tüm modüller açıkken ekrandaki metin onaylı belgeyle aynı sıradadır", () => {
  const belge = readFileSync("docs/KULLANIM_KILAVUZU_UTT.md", "utf8").split("\n").slice(2).join("\n");
  const sadelestir = (yazi: string) => yazi.replace(/\*\*/g, "").replace(/<!--.*?-->/g, "").replace(/^## \d+\. /gm, "").replace(/^(?:- |\d+\. )/gm, "").replace(/\s+/g, " ").trim();
  assert.equal(sadelestir(metin(true, true)), sadelestir(belge));
  assert.match(metin(true, true), /Mutabakat işlemleri/);
});

test("Modül değiştirmek önceki içeriği değiştirmez veya menü maddelerini çoğaltmaz", () => {
  const ilk = metin(true, true);
  metin(false, false);
  metin(true, false);
  assert.equal(metin(true, true), ilk);
});
