import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { yoneticiKilavuzunuSec } from "../lib/rehber/yoneticiKilavuzu.ts";

const silinenler = [
  "T-Club raporunda neden yalnızca bir takımın sonuçlarını görüyorum?",
  "Yayın Raporları’nda rolü değiştirdiğimde rakamlar neden değişiyor?",
  "Yayın sayısı ile tamamlanma sayısı neden aynı değil?",
  "T-Club, C-Club ve E-Club sonuçları neden birbirinden farklı?",
  "Net puan neden düşük veya eksi görünüyor?",
];
function metin(cc: boolean, eclub: boolean) {
  const k = yoneticiKilavuzunuSec(cc, eclub);
  return [...k.giris, ...k.bolumler.flatMap(b => [b.baslik, ...b.parcalar.flatMap(p => p.tip === "liste" ? p.maddeler : [p.metin])])].join("\n");
}
for (const cc of [false, true]) for (const eclub of [false, true]) {
  test(`Yönetici kılavuzu: C-Club=${cc}, E-Club=${eclub}; altı bölüm ve son onaylı sorular`, () => {
    const k = yoneticiKilavuzunuSec(cc, eclub), yazi = metin(cc, eclub);
    assert.equal(k.bolumler.length, 6);
    if (!cc) assert.doesNotMatch(yazi, /C-Club|Challenge|challenge/);
    if (!eclub) assert.doesNotMatch(yazi, /E-Club/);
    assert.match(yazi, /Net puan neden eksi görünüyor/);
    for (const soru of silinenler) assert.ok(!yazi.includes(soru));
    for (const b of k.bolumler) {
      assert.ok(b.parcalar.length);
      b.parcalar.forEach((p, i) => {
        if (p.tip === "baslik") assert.ok(b.parcalar[i + 1] && b.parcalar[i + 1].tip !== "baslik", p.metin);
      });
    }
  });
}
test("Yönetici kılavuzu onaylı belgeyle eşleşir ve seçimler kaynak metni değiştirmez", () => {
  const belge = readFileSync("docs/KULLANIM_KILAVUZU_YONETICI.md", "utf8").split("\n").slice(2).join("\n");
  const sade = (s: string) => s.replace(/\*\*/g, "").replace(/<!--.*?-->/g, "").replace(/^## \d+\. /gm, "").replace(/^(?:- |\d+\. )/gm, "").replace(/\s+/g, " ").trim();
  const ilk = metin(true, true);
  assert.equal(sade(ilk), sade(belge));
  metin(false, false);
  assert.equal(metin(true, true), ilk);
});
